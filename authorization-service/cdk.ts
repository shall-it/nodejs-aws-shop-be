#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import dotenv from 'dotenv';

dotenv.config();

const app = new cdk.App();

const authorizationAWSRegion = process.env.AUTHORIZATION_AWS_REGION!
if (!authorizationAWSRegion) {
  throw new Error('Variable AUTHORIZATION_AWS_REGION must be set into .env file');
}

const envCredentials = process.env.CREDENTIALS!;
console.log(envCredentials)
if (!envCredentials) {
  throw new Error('Variable CREDENTIALS must be set into .env file');
}

console.log(`CDK region for deploy: ${authorizationAWSRegion}`);

const stack = new cdk.Stack(app, 'AuthorizationServiceStack', {
  env: { region: authorizationAWSRegion }
});

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_20_X,
  logRetention: RetentionDays.ONE_DAY,
  environment: {
    IMPORT_AWS_REGION: authorizationAWSRegion,
    CREDENTIALS: envCredentials
  }
};

const basicAuthorizer = new NodejsFunction(stack, 'BasicAuthorizerLambda', {
  ...sharedLambdaProps,
  functionName: 'basicAuthorizer',
  entry: 'src/handlers/basicAuthorizer.ts'
});

new cdk.CfnOutput(stack, 'BasicAuthorizerArn', {
  value: basicAuthorizer.functionArn,
  exportName: 'BasicAuthorizerArn'
});
