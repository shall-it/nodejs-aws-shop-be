#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as apiGateway from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

const dotenv = require('dotenv');
dotenv.config();

const app = new cdk.App();

const productAWSRegion = process.env.PRODUCT_AWS_REGION!
if (!productAWSRegion) {
  throw new Error('Variable PRODUCT_AWS_REGION must be set into .env file');
}

console.log(`CDK region for deploy: ${productAWSRegion}`);

const stack = new cdk.Stack(app, 'ProductServiceStack', {
  env: { region: productAWSRegion }
});

const tableNameProducts = process.env.TABLE_NAME_PRODUCTS!;
const tableNameStocks = process.env.TABLE_NAME_STOCKS!;

if (!tableNameProducts || !tableNameStocks) {
  throw new Error('Variables TABLE_NAME_PRODUCTS and TABLE_NAME_STOCKS must be set into .env file');
}

console.log(`Name for DynamoDB table of products: ${tableNameProducts}`);
console.log(`Name for DynamoDB table of stocks: ${tableNameStocks}`);

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_20_X,
  environment: {
    PRODUCT_AWS_REGION: productAWSRegion,
    PRODUCTS_TABLE_NAME: tableNameProducts,
    STOCKS_TABLE_NAME: tableNameStocks,
  }
};

const productsTableName = dynamodb.Table.fromTableName(stack, 'productsTableName', tableNameProducts);
const stocksTableName = dynamodb.Table.fromTableName(stack, 'stocksTableName', tableNameStocks);

const getProductsList = new NodejsFunction(stack, 'GetProductsListLambda', {
  ...sharedLambdaProps,
  functionName: 'getProductsList',
  entry: 'src/handlers/getProductsListDdb.ts',
});
productsTableName.grantReadData(getProductsList)
stocksTableName.grantReadData(getProductsList)

const getProductsById = new NodejsFunction(stack, 'GetProductsByIdLambda', {
  ...sharedLambdaProps,
  functionName: 'getProductsById',
  entry: 'src/handlers/getProductsByIdDdb.ts',
});
productsTableName.grantReadData(getProductsById)
stocksTableName.grantReadData(getProductsById)

const createProduct = new NodejsFunction(stack, 'createProductLambda', {
  ...sharedLambdaProps,
  functionName: 'createProduct',
  entry: 'src/handlers/createProductDdb.ts',
});
productsTableName.grantWriteData(createProduct)
stocksTableName.grantWriteData(createProduct)

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

api.addRoutes({
  integration: new HttpLambdaIntegration('createProductIntegration', createProduct),
  path: '/products',
  methods: [apiGateway.HttpMethod.POST]
})