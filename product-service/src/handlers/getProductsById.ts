import { buildResponse } from '../utils';
import { PRODUCTS } from '../constants';

export const handler = async (event: any) => {
    try {
        console.log('aloha', event)

        const productId = event.pathParameters.productId

        if (!PRODUCTS.some(product => product.id === productId)) {
            return buildResponse(400,
                {
                    message: "Product not found"
                });
        }

        return buildResponse(200, PRODUCTS.find(product => product.id === productId));

    } catch (err) {
        if (err instanceof Error) {
            return buildResponse(500, { message: err.message });
        } else {
            return buildResponse(500, { message: 'Unknown error occurred' });
        }
    }
};
