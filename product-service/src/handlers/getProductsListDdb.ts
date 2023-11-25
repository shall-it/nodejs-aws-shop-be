import { DynamoDB } from 'aws-sdk';
const docClient = new DynamoDB.DocumentClient();

exports.handler = async (event: any) => {
    const table1Name = process.env.TABLE1_NAME;
    const table2Name = process.env.TABLE2_NAME;

    if (!table1Name || !table2Name) {
        console.error('Environment variables TABLE1_NAME and TABLE2_NAME must be set');
        return;
    }

    const params1 = {
        TableName: table1Name,
    };

    try {
        const data1 = await docClient.scan(params1).promise();
        console.log('Scan of products table is succeeded:', JSON.stringify(data1, null, 2));
    } catch (err) {
        console.error('Unable to scan products table. Error JSON:', JSON.stringify(err, null, 2));
    }

    const params2 = {
        TableName: table2Name,
    };

    try {
        const data2 = await docClient.scan(params2).promise();
        console.log('Scan of stocks table is succeeded:', JSON.stringify(data2, null, 2));
    } catch (err) {
        console.error('Unable to scan stocks table. Error JSON:', JSON.stringify(err, null, 2));
    }
};
