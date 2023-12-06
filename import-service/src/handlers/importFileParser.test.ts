
import { handler } from './importFileParser';
import { S3 } from 'aws-sdk';
import { S3Event } from 'aws-lambda';

const mockHeadObjectPromise = jest.fn();
const mockGetObjectPromise = jest.fn();
const mockCopyObjectPromise = jest.fn();
const mockDeleteObjectPromise = jest.fn();

jest.mock('aws-sdk', () => {
    return {
        S3: jest.fn(() => ({
            headObject: () => ({ promise: mockHeadObjectPromise }),
            getObject: () => ({ promise: mockGetObjectPromise }),
            copyObject: () => ({ promise: mockCopyObjectPromise }),
            deleteObject: () => ({ promise: mockDeleteObjectPromise }),
        })),
    };
});

describe('Test handler', () => {
    beforeEach(() => {
        mockHeadObjectPromise.mockClear();
        mockGetObjectPromise.mockClear();
        mockCopyObjectPromise.mockClear();
        mockDeleteObjectPromise.mockClear();
    });

    it('should call headObject and getObject with correct parameters', async () => {

        const bucketName = 'testBucket';
        const key = 'test.csv';

        const mockEvent = {
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

        mockHeadObjectPromise.mockResolvedValue({ Bucket: bucketName, Key: key });
        mockGetObjectPromise.mockResolvedValue({ Body: 'test' });
        mockCopyObjectPromise.mockResolvedValue({ Bucket: bucketName, CopySource: `${bucketName}/${mockEvent.Records[0].s3.object.key}`, Key: mockEvent.Records[0].s3.object.key.replace('uploaded', 'parsed') });
        mockDeleteObjectPromise.mockResolvedValue({ Bucket: bucketName, Key: mockEvent.Records[0].s3.object.key });

        const response = await handler(mockEvent);

        expect(S3).toHaveBeenCalledTimes(1);
        expect(mockHeadObjectPromise).toHaveBeenCalledTimes(1);
        expect(mockGetObjectPromise).toHaveBeenCalledTimes(1);
        expect(mockCopyObjectPromise).toHaveBeenCalledTimes(1);
        expect(mockDeleteObjectPromise).toHaveBeenCalledTimes(1);
        expect(mockHeadObjectPromise).toHaveBeenCalled();
        expect(mockGetObjectPromise).toHaveBeenCalled();
        expect(mockCopyObjectPromise).toHaveBeenCalledWith();
        expect(mockDeleteObjectPromise).toHaveBeenCalledWith();
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
});
