import { buildResponse } from '../utils';
import { S3 } from 'aws-sdk';
import csv from 'csv-parser';
import { Readable } from 'stream';

const s3 = new S3();
const bucketName = process.env.BUCKET_NAME!;

export const handler = async (event: any) => {
    const key: string = event.Records[0].s3.object.key;
    try {
        await s3.headObject({ Bucket: bucketName, Key: key }).promise();

        const s3object = await s3.getObject({ Bucket: bucketName, Key: key }).promise();
        const csvreadstream: Readable = new Readable();
        csvreadstream._read = () => { };
        csvreadstream.push(s3object.Body);

        csvreadstream
            .pipe(csv())
            .on('data', async function (data: any) {
                csvreadstream.pause();
                console.log(JSON.stringify(data));
                csvreadstream.resume();
            })
            .on('end', async function () {
                console.log("END");
            });
    } catch (error: any) {
        if (error.code === 'NotFound') {
            console.log('The specified S3 object does not exist');
            return buildResponse(500,
                {
                    message: 'The specified S3 object does not exist'
                });
        } else {
            console.log('An error occurred:', error);
            return buildResponse(500,
                {
                    message: 'An error occurred:', error
                });
        }
    }

    console.log('CSV processing completed');
    return buildResponse(200, 'CSV processing completed');
};
