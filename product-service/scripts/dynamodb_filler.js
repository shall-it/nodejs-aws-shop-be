const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid');

const data = [
    { "title": "Test Product 1", "description": "This is a test product", "price": 100, "count": 3 },
    { "title": "Test Product 2", "description": "This is another test product", "price": 200, "count": 5 },
];

const client = new DynamoDBClient({ region: "us-east-1" });
const ddbDocClient = DynamoDBDocumentClient.from(client);

async function batchWrite() {
    try {
        let productsWrites = [];
        let stocksWrites = [];

        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const id = uuidv4();

            productsWrites.push({
                PutRequest: {
                    Item: {
                        id: id,
                        title: item.title,
                        description: item.description,
                        price: item.price
                    }
                }
            });

            stocksWrites.push({
                PutRequest: {
                    Item: {
                        product_id: id,
                        count: item.count
                    }
                }
            });
        }

        const productsParams = {
            RequestItems: {
                'products': productsWrites
            }
        };

        const stocksParams = {
            RequestItems: {
                'stocks': stocksWrites
            }
        };

        await ddbDocClient.send(new BatchWriteCommand(productsParams));
        await ddbDocClient.send(new BatchWriteCommand(stocksParams));
    } catch (err) {
        console.error(err);
    }
}

batchWrite();