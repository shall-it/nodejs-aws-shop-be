import { handler } from './getProductsById';
import { buildResponse } from '../utils';
import { PRODUCTS } from '../constants';

describe('Test for handler', () => {
    it('should return 200 and the product if productId is in PRODUCTS', async () => {
        const productId = PRODUCTS[0].id;
        const event = { pathParameters: { productId } };
        const expectedResponse = buildResponse(200, PRODUCTS[0]);
        const response = await handler(event);
        expect(response).toEqual(expectedResponse);
    });
});
