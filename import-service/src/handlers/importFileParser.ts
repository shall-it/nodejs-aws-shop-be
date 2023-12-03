import { buildResponse } from '../utils';
import { S3 } from 'aws-sdk';
import csv from 'csv-parser';
import { Readable } from 'stream';

const s3 = new S3();
const bucketName = process.env.BUCKET_NAME!;

export const handler = async (event: any) => {
    const key: string = event.Records[0].s3.object.key;
    console.log('CSV file processing started for', key)
    try {
        await s3.headObject({ Bucket: bucketName, Key: key }).promise();

        const s3object = await s3.getObject({ Bucket: bucketName, Key: key }).promise();
        const csvreadstream: Readable = new Readable();
        csvreadstream._read = () => { };
        csvreadstream.push(s3object.Body);

        await new Promise<void>((resolve, reject) => {
            csvreadstream
                .pipe(csv())
                .on('data', async function (data: any) {
                    csvreadstream.pause();
                    console.log(JSON.stringify(data));
                    csvreadstream.resume();
                })
                .on('end', async function () {
                    const destinationKey = key.replace('uploaded', 'parsed');
                    const copyPromise = s3.copyObject({
                        Bucket: bucketName,
                        CopySource: `${bucketName}/${key}`,
                        Key: destinationKey,
                    }).promise();
                    console.log('CSV file copied to parsed directory');

                    const deletePromise = s3.deleteObject({
                        Bucket: bucketName,
                        Key: key,
                    }).promise();
                    console.log('CSV file deleted from uploaded directory');

                    try {
                        await Promise.all([copyPromise, deletePromise]);
                        resolve();
                        console.log('CSV file processing completed');
                    } catch (err) {
                        reject(err);
                    }
                })
                .on('error', reject);
            csvreadstream.push(null);
        });
    } catch (err: any) {
        if (err.code === 'NotFound') {
            console.log('The specified S3 object does not exist');
            return buildResponse(500,
                {
                    message: 'The specified S3 object does not exist'
                });
        } else {
            console.log('An error occurred:', err);
            return buildResponse(500,
                {
                    message: 'An error occurred:', err
                });
        }
    }

    return buildResponse(200, 'CSV processing completed');
};
