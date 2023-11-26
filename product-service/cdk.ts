#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as apiGateway from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
// import * as iam from '@aws-cdk/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
// import dotenv from 'dotenv';

const dotenv = require('dotenv');
dotenv.config();

const app = new cdk.App();

const stack = new cdk.Stack(app, 'ProductServiceStack', {
  env: { region: 'us-east-1' }
});

const table1Name = process.env.TABLE1_NAME;
const table2Name = process.env.TABLE2_NAME;

if (!table1Name || !table2Name) {
  throw new Error('Environment variables TABLE1_NAME and TABLE2_NAME must be set');
}

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_20_X,
  environment: {
    PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION!,
    TABLE1_NAME: process.env.TABLE1_NAME!,
    TABLE2_NAME: process.env.TABLE2_NAME!,
  }
};

const getProductsList = new NodejsFunction(stack, 'GetProductsListLambda', {
  ...sharedLambdaProps,
  functionName: 'getProductsList',
  entry: 'src/handlers/getProductsListDdb.ts',
});

const getProductsById = new NodejsFunction(stack, 'GetProductsByIdLambda', {
  ...sharedLambdaProps,
  functionName: 'getProductsById',
  entry: 'src/handlers/getProductsByIdDdb.ts',
});

const createProduct = new NodejsFunction(stack, 'createProductLambda', {
  ...sharedLambdaProps,
  functionName: 'createProduct',
  entry: 'src/handlers/createProductDdb.ts',
});

const table1 = dynamodb.Table.fromTableName(stack, 'Table1', table1Name);
const table2 = dynamodb.Table.fromTableName(stack, 'Table2', table2Name);

// const policy = new iam.PolicyStatement({
//   effect: iam.Effect.ALLOW,
//   actions: ['dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan'],
//   resources: [
//     `arn:aws:dynamodb:${stack.region}:${stack.account}:table/${table1Name}`,
//     `arn:aws:dynamodb:${stack.region}:${stack.account}:table/${table2Name}`,
//   ],
// });

table1.grantReadData(getProductsList)
table2.grantReadData(getProductsList)
table1.grantReadData(getProductsById)
table2.grantReadData(getProductsById)
table1.grantWriteData(createProduct)
table2.grantWriteData(createProduct)

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
  integration: new HttpLambdaIntegration('createProductIntegration', createProduct),
  path: '/products',
  methods: [apiGateway.HttpMethod.POST]
})

api.addRoutes({
  integration: new HttpLambdaIntegration('getProductsByIdIntegration', getProductsById),
  path: '/products/{productId}',
  methods: [apiGateway.HttpMethod.GET]
})