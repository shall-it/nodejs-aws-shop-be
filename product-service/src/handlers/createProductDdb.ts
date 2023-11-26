import { buildResponse } from '../utils';
import { DynamoDB } from 'aws-sdk';
const docClient = new DynamoDB.DocumentClient();

exports.handler = async (event: any) => {
    const body = JSON.parse(event.body);

    const fieldsToCheck = [
        { name: 'id', type: 'string', required: true },
        { name: 'title', type: 'string', required: true },
        { name: 'description', type: 'string', required: false },
        { name: 'price', type: 'number', required: true },
        { name: 'count', type: 'number', required: true }
    ];

    for (const field of fieldsToCheck) {
        const value = body[field.name];
        if (field.required && !value) {
            return buildResponse(400,
                {
                    message: `Invalid or missing ${field.name}`
                });
        }
        if (value && typeof value !== field.type) {
            return buildResponse(400,
                {
                    message: `Invalid type of ${field.name}`
                });
        }
    }


    const table1Name = process.env.TABLE1_NAME;
    const table2Name = process.env.TABLE2_NAME;

    if (!table1Name || !table2Name) {
        throw new Error('Environment variables TABLE1_NAME and TABLE2_NAME must be set');
    }

    const params = {
        TransactItems: [
            {
                Put: {
                    TableName: table1Name,
                    Item: {
                        id: body.id,
                        description: body.description,
                        price: body.price,
                        title: body.title
                    }
                }
            },
            {
                Put: {
                    TableName: table2Name,
                    Item: {
                        product_id: body.id,
                        count: body.count
                    }
                }
            }
        ]
    };

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