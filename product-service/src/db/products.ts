import { buildResponse } from '../utils';
import { DynamoDB } from 'aws-sdk';
const { v4: uuidv4 } = require('uuid');

const docClient = new DynamoDB.DocumentClient();

const productsTableName = process.env.PRODUCTS_TABLE_NAME;
const stocksTableName = process.env.STOCKS_TABLE_NAME;

export async function createProduct(productBody: any): Promise<any> {

    const id = uuidv4();

    const params: DynamoDB.DocumentClient.TransactWriteItemsInput = {
        TransactItems: [
            {
                Put: {
                    TableName: productsTableName as string,
                    Item: {
                        id: id,
                        description: productBody.description,
                        price: Number(productBody.price),
                        title: productBody.title
                    }
                }
            },
            {
                Put: {
                    TableName: stocksTableName as string,
                    Item: {
                        product_id: id,
                        count: Number(productBody.count)
                    }
                }
            }
        ]
    };

    console.log('Parameters for product creation in both tables:', JSON.stringify(params, null, 2));

    try {
        await docClient.transactWrite(params).promise();
        console.log('Creation of product in products and stocks is succeeded');

        return productBody;
    } catch (err: any) {
        console.error('Unable to create product. Error JSON:', JSON.stringify(err, null, 2));
        return buildResponse(500,
            {
                message: "Unhandled error"
            });
    }
}
