#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as apiGateway from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
// import dotenv from 'dotenv';

const dotenv = require('dotenv');
dotenv.config();

const app = new cdk.App();

const stack = new cdk.Stack(app, 'ProductServiceStack', {
  env: { region: 'us-east-1' }
});

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_20_X,
  environment: {
    PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION!,
  }
};

const getProductsList = new NodejsFunction(stack, 'GetProductsListLambda', {
  ...sharedLambdaProps,
  functionName: 'getProductsList',
  entry: 'src/handlers/getProductsList.ts',
});

const getProductsById = new NodejsFunction(stack, 'GetProductsByIdLambda', {
  ...sharedLambdaProps,
  functionName: 'getProductsById',
  entry: 'src/handlers/getProductsById.ts',
});

const api = new apiGateway.HttpApi(stack, 'ProductApi', {
  corsPreflight: {
    allowHeaders: ['*'],
    allowOrigins: ['*'],
    allowMethods: [apiGateway.CorsHttpMethod.ANY],
  }
});

api.addRoutes({
  integration: new HttpLambdaIntegration('getProductsListIntegration', getProductsList),
  path: '/products',
  methods: [apiGateway.HttpMethod.GET]
})

api.addRoutes({
  integration: new HttpLambdaIntegration('getProductsByIdIntegration', getProductsById),
  path: '/products/{productId}',
  methods: [apiGateway.HttpMethod.GET]
})