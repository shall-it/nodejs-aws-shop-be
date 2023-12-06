import { buildResponse } from '../utils';
import { S3 } from 'aws-sdk';

export const handler = async (event: any) => {
    const s3 = new S3();
    const bucketName = process.env.BUCKET_NAME!;
    const fileName = event.queryStringParameters.name;

    if (!fileName) {
        return buildResponse(500,
            {
                message: 'CSV file name cannot be extracted'
            });
    }

    console.log(`Name of S3 bucket for import: ${bucketName}`);

    const params = {
        Bucket: bucketName,
        Key: `uploaded/${fileName}`,
        ContentType: 'text/csv',
        Expires: 60,
    };

    const url = await s3.getSignedUrlPromise('putObject', params);
    console.log(url)
    return buildResponse(200, url);
};
