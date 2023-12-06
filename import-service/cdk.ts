#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { S3 } from 'aws-sdk';
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

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_20_X,
  environment: {
    IMPORT_AWS_REGION: importAWSRegion,
    BUCKET_NAME: bucketName
  }
};

const bucket = s3.Bucket.fromBucketName(stack, 'importBucket', bucketName);

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
  }
});

const importFileParser = new NodejsFunction(stack, 'ImportFileParserLambda', {
  ...sharedLambdaProps,
  functionName: 'importFileParser',
  entry: 'src/handlers/importFileParser.ts',
});

bucket.grantReadWrite(importFileParser.grantPrincipal, `${prefix_uploaded}*`);
bucket.grantWrite(importFileParser.grantPrincipal, `${prefix_parsed}*`);

bucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3n.LambdaDestination(importFileParser),
  { prefix: prefix_uploaded }
);