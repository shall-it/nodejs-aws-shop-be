import { buildResponse } from '../utils';
import { DynamoDB } from 'aws-sdk';
const docClient = new DynamoDB.DocumentClient();

exports.handler = async (event: any) => {
    const table1Name = process.env.TABLE1_NAME;
    const table2Name = process.env.TABLE2_NAME;

    const productId = event.pathParameters.productId

    if (!table1Name || !table2Name) {
        throw new Error('Environment variables TABLE1_NAME and TABLE2_NAME must be set');
    }

    const params1 = {
        TableName: table1Name,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
            ':id': productId
        }
    };

    const params2 = {
        TableName: table2Name,
        KeyConditionExpression: 'product_id = :product_id',
        ExpressionAttributeValues: {
            ':product_id': productId
        }
    };

    try {
        const data1 = await docClient.query(params1).promise();
        console.log('Query of product by id is succeeded:', JSON.stringify(data1.Items, null, 2));

        const data2 = await docClient.query(params2).promise();
        console.log('Query of stock by product_id is succeeded:', JSON.stringify(data2.Items, null, 2));

        if (data1.Items && data2.Items) {
            if (data1.Items.length === 0) {
                return buildResponse(404,
                    {
                        message: "Product not found"
                    });
            }
            if (data2.Items.length === 0) {
                return buildResponse(404,
                    {
                        message: "Product not found"
                    });
            }
            const data2ItemsById = data2.Items.reduce((acc, item) => {
                acc[item.product_id] = item;
                return acc;
            }, {});

            const mergedData = data1.Items.map(item1 => {
                const item2 = data2ItemsById[item1.id];
                const mergedItem = { ...item1, ...item2 };
                delete mergedItem.product_id;
                return mergedItem;
            });

            return mergedData;
        } else {
            throw new Error('data1.Items or data2.Items is undefined');
        }
    } catch (err) {
        console.error('Unable to query from tables. Error JSON:', JSON.stringify(err, null, 2));
        return buildResponse(500,
            {
                message: "Unhandled error"
            });
    }
};
