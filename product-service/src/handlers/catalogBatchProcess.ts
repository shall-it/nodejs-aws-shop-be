import { createProduct } from '../db/products';
import { SQSEvent } from 'aws-lambda';
import { PublishCommand } from '@aws-sdk/client-sns';
import { get } from 'lodash';

import snsClient from '../libs/sns';
import { buildResponse } from '../utils';

export const handler = async (event: SQSEvent) => {
    try {
        console.log('sqs event', event)

        const records = get(event, 'Records', []);

        for (const record of records) {
            const newProductData: any = await createProduct(JSON.parse(record.body));

            console.log(newProductData);

            await snsClient.send(
                new PublishCommand({
                    Subject: 'New Files Added to Catalog',
                    Message: JSON.stringify(newProductData),
                    TopicArn: process.env.IMPORT_PRODUCTS_TOPIC_ARN!,
                    MessageAttributes: {
                        count: {
                            DataType: 'Number',
                            StringValue: newProductData.count,
                        },
                    },
                })
            );
        }

        return buildResponse(200, records);
    } catch (err) {
        console.log(err);
        return buildResponse(500, err)
    }
};
