import { buildResponse } from '../utils';
import { PRODUCTS } from '../constants';

export const handler = async (event: any) => {
    try {
        console.log('aloha', event)

        return buildResponse(200, PRODUCTS);

    } catch (err) {
        if (err instanceof Error) {
            return buildResponse(500, { message: err.message });
        } else {
            return buildResponse(500, { message: 'Unknown error occurred' });
        }
    }
};