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
                        price: productBody.price,
                        title: productBody.title
                    }
                }
            },
            {
                Put: {
                    TableName: stocksTableName as string,
                    Item: {
                        product_id: id,
                        count: productBody.count
                    }
                }
            }
        ]
    };

    await docClient.transactWrite(params).promise();
    return productBody;
}
