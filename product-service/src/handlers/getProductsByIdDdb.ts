import { buildResponse } from '../utils';
import { DynamoDB } from 'aws-sdk';
const docClient = new DynamoDB.DocumentClient();

exports.handler = async (event: any) => {
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

    const productId = event.pathParameters.productId
    console.log(`Value of product ID: ${productId}`);

    const productsParams = {
        TableName: productsTableName,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
            ':id': productId
        }
    };

    const stocksParams = {
        TableName: stocksTableName,
        KeyConditionExpression: 'product_id = :product_id',
        ExpressionAttributeValues: {
            ':product_id': productId
        }
    };

    try {
        const productsData = await docClient.query(productsParams).promise();
        console.log('Query of product by id is:', JSON.stringify(productsData.Items, null, 2));

        const stocksData = await docClient.query(stocksParams).promise();
        console.log('Query of stock by product_id is:', JSON.stringify(stocksData.Items, null, 2));

        if (productsData.Items && stocksData.Items) {
            if (productsData.Items.length === 0) {
                console.log('Product not found by id in products table');
                return buildResponse(404,
                    {
                        message: "Product not found"
                    });
            }
            if (stocksData.Items.length === 0) {
                console.log('Product not found by id in stocks table');
                return buildResponse(404,
                    {
                        message: "Product not found"
                    });
            }
            const stocksDataItemsById = stocksData.Items.reduce((acc, item) => {
                acc[item.product_id] = item;
                return acc;
            }, {});

            const mergedData = productsData.Items.map(item1 => {
                const item2 = stocksDataItemsById[item1.id];
                const mergedItem = { ...item1, ...item2 };
                delete mergedItem.product_id;
                return mergedItem;
            });

            console.log('Merged data from products and stocks tables:', JSON.stringify(mergedData, null, 2));

            return mergedData;
        } else {
            return buildResponse(500,
                {
                    message: "productsData.Items or stocksData.Items is undefined"
                });
        }
    } catch (err) {
        console.error('Unable to query from tables. Error JSON:', JSON.stringify(err, null, 2));
        return buildResponse(500,
            {
                message: "Unhandled error"
            });
    }
};
