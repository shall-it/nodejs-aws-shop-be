import { buildResponse } from '../utils';
import { DynamoDB } from 'aws-sdk';
const docClient = new DynamoDB.DocumentClient();

exports.handler = async () => {
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

    const productsParams = {
        TableName: productsTableName,
    };

    const stocksParams = {
        TableName: stocksTableName,
    };

    try {
        const productsData = await docClient.scan(productsParams).promise();
        console.log('Scan of products table is succeeded:', JSON.stringify(productsData.Items, null, 2));

        const stocksData = await docClient.scan(stocksParams).promise();
        console.log('Scan of stocks table is succeeded:', JSON.stringify(stocksData.Items, null, 2));

        if (productsData.Items && stocksData.Items) {
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
        console.error('Unable to scan tables. Error JSON:', JSON.stringify(err, null, 2));
        return buildResponse(500,
            {
                message: "Unhandled error"
            });
    }
};
