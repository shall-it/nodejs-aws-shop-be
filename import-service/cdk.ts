#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cr from 'aws-cdk-lib/custom_resources';
import dotenv from 'dotenv';

dotenv.config();

const app = new cdk.App();

const importAWSRegion = process.env.IMPORT_AWS_REGION!
if (!importAWSRegion) {
  throw new Error('Variable IMPORT_AWS_REGION must be set into .env file');
}

console.log(`CDK region for deploy: ${importAWSRegion}`);

const stack = new cdk.Stack(app, 'ImportServiceStack', {
  env: { region: importAWSRegion }
});

const bucketName = process.env.BUCKET_NAME!;

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

const importProductsFile = new NodejsFunction(stack, 'ImportProductsFileLambda', {
  ...sharedLambdaProps,
  functionName: 'importProductsFile',
  entry: 'src/handlers/importProductsFile.ts',
});

bucket.grantReadWrite(importProductsFile)
importProductsFile.addToRolePolicy(new iam.PolicyStatement({
  actions: ['s3:PutObject'],
  resources: [bucket.arnForObjects('uploaded/*')],
}));

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