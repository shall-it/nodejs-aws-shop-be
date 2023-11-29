import { buildResponse } from '../utils';
import { DynamoDB } from 'aws-sdk';
const { v4: uuidv4 } = require('uuid');
const docClient = new DynamoDB.DocumentClient();

exports.handler = async (event: any) => {
    const productBody = JSON.parse(event.body);

    console.log(`Product body of request for product creation: ${productBody}`);

    const paramsToCheck = [
        { name: 'title', type: 'string', required: true },
        { name: 'description', type: 'string', required: false },
        { name: 'price', type: 'number', required: true },
        { name: 'count', type: 'number', required: true }
    ];

    for (const param of paramsToCheck) {
        const value = productBody[param.name];
        if (param.required && !value) {
            return buildResponse(400,
                {
                    message: `Invalid or missing ${param.name}`
                });
        }
        if (value && typeof value !== param.type) {
            return buildResponse(400,
                {
                    message: `Invalid type of ${param.name}`
                });
        }
    }

    const productsTableName = process.env.PRODUCTS_TABLE_NAME;
    const stocksTableName = process.env.STOCKS_TABLE_NAME;

    if (!productsTableName || !stocksTableName) {
        return buildResponse(500,
            {
                message: "Environment variables PRODUCTS_TABLE_NAME and STOCKS_TABLE_NAME must be set"
            });
    }

    console.log(`Name for table of products: ${productsTableName}`);
    console.log(`Name for table of stocks: ${stocksTableName}`);

    const id = uuidv4();

    const params = {
        TransactItems: [
            {
                Put: {
                    TableName: productsTableName,
                    Item: {
                        id: id,
                        description: productBody.description,
                        price: productBody.price,
                        title: productBody.title
                    }
                }
            },
            {
                Put: {
                    TableName: stocksTableName,
                    Item: {
                        product_id: id,
                        count: productBody.count
                    }
                }
            }
        ]
    };

    console.log('Parameters for product creation in both tables:', JSON.stringify(params, null, 2));

    try {
        await docClient.transactWrite(params).promise();
        console.log('Creation of product in products and stocks is succeeded');

        return buildResponse(200,
            {
                message: "Product created successfully"
            });
    } catch (err) {
        console.error('Unable to create product. Error JSON:', JSON.stringify(err, null, 2));
        return buildResponse(500,
            {
                message: "Unhandled error"
            });
    }
};