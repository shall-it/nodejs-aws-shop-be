import { DynamoDB } from 'aws-sdk';
const docClient = new DynamoDB.DocumentClient();

exports.handler = async () => {
    const table1Name = process.env.TABLE1_NAME;
    const table2Name = process.env.TABLE2_NAME;

    if (!table1Name || !table2Name) {
        throw new Error('Environment variables TABLE1_NAME and TABLE2_NAME must be set');
    }

    const params1 = {
        TableName: table1Name,
    };

    const params2 = {
        TableName: table2Name,
    };

    try {
        const data1 = await docClient.scan(params1).promise();
        console.log('Scan of products table is succeeded:', JSON.stringify(data1.Items, null, 2));

        const data2 = await docClient.scan(params2).promise();
        console.log('Scan of stocks table is succeeded:', JSON.stringify(data2.Items, null, 2));

        if (data1.Items && data2.Items) {
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
        console.error('Unable to scan tables. Error JSON:', JSON.stringify(err, null, 2));
        throw err;
    }
};
