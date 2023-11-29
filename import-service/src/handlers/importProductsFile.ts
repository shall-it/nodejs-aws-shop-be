import { buildResponse } from '../utils';
import { S3 } from 'aws-sdk';

exports.handler = async (event: any) => {
    const s3 = new S3();
    const fileName = event.fileName;
    const bucketName = process.env.BUCKET_NAME;

    if (!bucketName) {
        return buildResponse(500,
            {
                message: "Environment variable BUCKET_NAME must be set"
            });
    }

    console.log(`Name of S3 bucket for import: ${bucketName}`);

    const params = {
        Bucket: bucketName,
        Key: `uploaded/${fileName}`,
        Expires: 60,
    };

    const url = await s3.getSignedUrlPromise('putObject', params);
    return url;

};
