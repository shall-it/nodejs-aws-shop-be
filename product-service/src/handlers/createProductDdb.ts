import { buildResponse } from '../utils';
import { DynamoDB } from 'aws-sdk';
const docClient = new DynamoDB.DocumentClient();

exports.handler = async (event: any) => {
    const body = JSON.parse(event.body);
    const table1Name = process.env.TABLE1_NAME;
    const table2Name = process.env.TABLE2_NAME;

    if (!table1Name || !table2Name) {
        throw new Error('Environment variables TABLE1_NAME and TABLE2_NAME must be set');
    }

    const params1 = {
        TableName: table1Name,
        Item: {
            id: body.id,
            description: body.description,
            price: body.price,
            title: body.title
        }
    };

    const params2 = {
        TableName: table2Name,
        Item: {
            product_id: body.id,
            count: body.count
        }
    };

    try {
        await docClient.put(params1).promise();
        console.log('Creation of product in products is succeeded');

        await docClient.put(params2).promise();
        console.log('Creation of product in stocks is succeeded');

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