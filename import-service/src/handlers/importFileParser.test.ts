
import { handler } from './importFileParser';
import { S3 } from 'aws-sdk';
import { S3Event } from 'aws-lambda';

const mockHeadObjectPromise = jest.fn();
const mockGetObjectPromise = jest.fn();
const mockCopyObjectPromise = jest.fn();
const mockDeleteObjectPromise = jest.fn();
const mockSendMessagePromise = jest.fn();

jest.mock('aws-sdk', () => {
    return {
        S3: jest.fn(() => ({
            headObject: () => ({ promise: mockHeadObjectPromise }),
            getObject: () => ({ promise: mockGetObjectPromise }),
            copyObject: () => ({ promise: mockCopyObjectPromise }),
            deleteObject: () => ({ promise: mockDeleteObjectPromise }),
        })),
        SQS: jest.fn(() => ({
            sendMessage: () => ({ promise: mockSendMessagePromise }),
        })),
    };
});

describe('Test handler', () => {
    let mockEvent: S3Event;
    let sqsParams;

    beforeEach(() => {
        mockHeadObjectPromise.mockClear();
        mockGetObjectPromise.mockClear();
        mockCopyObjectPromise.mockClear();
        mockDeleteObjectPromise.mockClear();
        mockSendMessagePromise.mockClear();

        const bucketName = 'testBucket';
        const key = 'test.csv';

        mockEvent = {
            Records: [
                {
                    s3: {
                        bucket: {
                            name: bucketName,
                        },
                        object: {
                            key: key,
                        },
                    },
                },
            ],
        } as S3Event;

        const mockData = {
            title: "Test Product",
            description: "This is the test product",
            price: 1000,
            count: 100
        };

        sqsParams = {
            QueueUrl: 'https://sqs.us-east-1.amazonaws.com/0123456789/test-queue',
            MessageBody: JSON.stringify(mockData),
        };
    });

    it('should call headObject and getObject with correct parameters', async () => {
        mockHeadObjectPromise.mockResolvedValue({});
        mockGetObjectPromise.mockResolvedValue({ Body: 'title,description,price,count\nTest Product,This is the test product,1000,100' });
        mockCopyObjectPromise.mockResolvedValue({});
        mockDeleteObjectPromise.mockResolvedValue({});
        mockSendMessagePromise.mockResolvedValue({});

        const response = await handler(mockEvent);

        expect(S3).toHaveBeenCalledTimes(1);
        expect(mockHeadObjectPromise).toHaveBeenCalledTimes(1);
        expect(mockGetObjectPromise).toHaveBeenCalledTimes(1);
        expect(mockCopyObjectPromise).toHaveBeenCalledTimes(1);
        expect(mockDeleteObjectPromise).toHaveBeenCalledTimes(1);
        expect(mockSendMessagePromise).toHaveBeenCalledTimes(1);
        expect(response).toEqual({
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Headers': '*',
            },
            body: JSON.stringify('CSV file processing completed'),
        });
    });

    it('should handle errors', async () => {
        mockHeadObjectPromise.mockRejectedValue(new Error('Test error'));

        try {
            await handler(mockEvent);
        } catch (err) {
            expect(err).toEqual(new Error('Test error'));
        }
    });
});
