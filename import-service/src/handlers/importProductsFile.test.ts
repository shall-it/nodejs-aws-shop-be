
import { handler } from './importProductsFile';

const getSignedUrlPromise = jest.fn();

jest.mock('aws-sdk', () => {
    return {
        S3: jest.fn(() => ({
            getSignedUrlPromise,
        })),
    };
});

describe('Test handler', () => {
    it('should call getSignedUrlPromise with correct parameters', async () => {
        const mockEvent = {
            queryStringParameters: {
                name: 'test.csv',
            },
        };

        process.env.BUCKET_NAME = 'testBucket';
        const MOCK_URL: string = 'https://mock-presigned-url.com';

        getSignedUrlPromise.mockResolvedValue(MOCK_URL);

        const response = await handler(mockEvent);

        expect(getSignedUrlPromise).toHaveBeenCalledWith('putObject', {
            Bucket: 'testBucket',
            Key: 'uploaded/test.csv',
            ContentType: 'text/csv',
            Expires: 60,
        });

        expect(response).toEqual({
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Headers': '*',
            },
            body: JSON.stringify(MOCK_URL),
        });
    });
});
