#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { S3 } from 'aws-sdk';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import dotenv from 'dotenv';

dotenv.config();

const app = new cdk.App();
const s3sdk = new S3();

const importAWSRegion = process.env.IMPORT_AWS_REGION!
if (!importAWSRegion) {
  throw new Error('Variable IMPORT_AWS_REGION must be set into .env file');
}

console.log(`CDK region for deploy: ${importAWSRegion}`);

const stack = new cdk.Stack(app, 'ImportServiceStack', {
  env: { region: importAWSRegion }
});

const bucketName = process.env.BUCKET_NAME!;
const prefix_uploaded = 'uploaded/';
const prefix_parsed = 'parsed/';

if (!bucketName) {
  throw new Error('Variable BUCKET_NAME must be set into .env file');
}

console.log(`Name of S3 bucket for import: ${bucketName}`);

const bucket = s3.Bucket.fromBucketName(stack, 'importBucket', bucketName);
const queue = sqs.Queue.fromQueueArn(stack, 'importFileQueue', 'arn:aws:sqs:us-east-1:035511759406:import-file-queue')

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_20_X,
  environment: {
    IMPORT_AWS_REGION: importAWSRegion,
    BUCKET_NAME: bucketName,
    IMPORT_SQS_URL: queue.queueUrl
  }
};

const params = { Bucket: bucketName, Key: prefix_parsed, Body: '' };
const corsParams = {
  Bucket: bucketName,
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['PUT'],
        AllowedOrigins: ['https://dyfk99rjrorkr.cloudfront.net'],
        ExposeHeaders: []
      }
    ]
  }
};

s3sdk.putObject(params, function (err) {
  if (err) {
    console.log("Error of directory creating:", err);
  }
});

s3sdk.putBucketCors(corsParams, function (err) {
  if (err) {
    console.log("Error of CORS adding:", err);
  }
});

const importProductsFile = new NodejsFunction(stack, 'ImportProductsFileLambda', {
  ...sharedLambdaProps,
  functionName: 'importProductsFile',
  entry: 'src/handlers/importProductsFile.ts',
});
bucket.grantWrite(importProductsFile.grantPrincipal, `${prefix_uploaded}*`);

const importFileParser = new NodejsFunction(stack, 'ImportFileParserLambda', {
  ...sharedLambdaProps,
  functionName: 'importFileParser',
  entry: 'src/handlers/importFileParser.ts',
});
bucket.grantReadWrite(importFileParser.grantPrincipal, `${prefix_uploaded}*`);
bucket.grantWrite(importFileParser.grantPrincipal, `${prefix_parsed}*`);
queue.grantSendMessages(importFileParser)

bucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3n.LambdaDestination(importFileParser),
  { prefix: prefix_uploaded }
);

const basicAuthorizerFunctionArn = cdk.Fn.importValue('BasicAuthorizerArn');
console.log(`basicAuthorizerFunctionArn: ${basicAuthorizerFunctionArn}`);

const basicAuthorizer = lambda.Function.fromFunctionArn(stack, 'BasicAuthorizerFromLambda', basicAuthorizerFunctionArn);

const authorizer = new apigateway.TokenAuthorizer(stack, 'BasicAuthorizerForImport', {
  handler: basicAuthorizer,
  identitySource: 'method.request.header.Authorization',
  resultsCacheTtl: cdk.Duration.seconds(0),
});

const api = new apigateway.RestApi(stack, 'ImportApiRest', {
  defaultCorsPreflightOptions: {
    allowOrigins: apigateway.Cors.ALL_ORIGINS,
    allowMethods: apigateway.Cors.ALL_METHODS,
    allowHeaders: ['*']
  }
});

const resource = api.root.addResource('import');

const integration = new apigateway.LambdaIntegration(importProductsFile);

resource.addMethod('GET', integration, {
  requestParameters: {
    'method.request.querystring.name': true
  },
  methodResponses: [
    {
      statusCode: '200',
      responseParameters: {
        'method.response.header.Content-Type': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    },
  ],
  authorizationType: apigateway.AuthorizationType.CUSTOM,
  authorizer: authorizer
});

const authorizerArn = `arn:aws:execute-api:${stack.region}:${stack.account}:${api.restApiId}/authorizers/${authorizer.authorizerId}`;

new lambda.CfnPermission(stack, 'ApiGatewayInvokePermission', {
  action: 'lambda:InvokeFunction',
  functionName: basicAuthorizerFunctionArn,
  principal: 'apigateway.amazonaws.com',
  sourceArn: authorizerArn
});
