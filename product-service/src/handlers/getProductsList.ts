import { buildResponse } from '../utils';
import { PRODUCTS } from '../constants';

export const handler = async (event: any) => {
    try {
        console.log('aloha', event)

        return buildResponse(200, PRODUCTS);
    } catch (err) {
        return buildResponse(500,
            {
                message: err.message
            });
    }
};