
import { createProduct } from '../db/products';
import { SQSEvent, SQSRecord } from 'aws-lambda';
import { handler } from './catalogBatchProcess';
import { config as awsConfig } from 'aws-sdk';

jest.mock('../db/products');

describe('Test for SQS handler', () => {
    beforeEach(() => {
        awsConfig.update({ region: 'us-east-1' });
        (createProduct as jest.Mock).mockClear();
    });

    it('should call createProduct for each record', async () => {
        (createProduct as jest.Mock).mockResolvedValue({});

        const mockRecord: SQSRecord = {
            messageId: 'id',
            receiptHandle: 'handle',
            body: JSON.stringify({ name: 'test' }),
            attributes: {
                ApproximateReceiveCount: '',
                SentTimestamp: '',
                SenderId: '',
                ApproximateFirstReceiveTimestamp: ''
            },
            messageAttributes: {},
            md5OfBody: 'md5',
            eventSource: 'source',
            eventSourceARN: 'arn',
            awsRegion: 'region',
        };

        const mockEvent: SQSEvent = {
            Records: [mockRecord],
        };

        await handler(mockEvent);

        expect(createProduct).toHaveBeenCalledWith({ name: 'test' });
        expect(createProduct).toHaveBeenCalledTimes(1);
    });

    it('should handle errors', async () => {
        (createProduct as jest.Mock).mockRejectedValue(new Error('Test error'));

        const mockRecord: SQSRecord = {
            messageId: 'id',
            receiptHandle: 'handle',
            body: JSON.stringify({ name: 'test' }),
            attributes: {
                ApproximateReceiveCount: '',
                SentTimestamp: '',
                SenderId: '',
                ApproximateFirstReceiveTimestamp: ''
            },
            messageAttributes: {},
            md5OfBody: 'md5',
            eventSource: 'source',
            eventSourceARN: 'arn',
            awsRegion: 'region',
        };

        const mockEvent: SQSEvent = {
            Records: [mockRecord],
        };

        try {
            await handler(mockEvent);
        } catch (err) {
            expect(err).toEqual(new Error('Test error'));
        }
    });
});
