import { buildResponse } from '../utils';
import { PRODUCTS } from '../constants';

export const handler = async (event: any) => {
    try {
        console.log('aloha', event)

        const productId = event.pathParameters.productId
        const productIdFinder = PRODUCTS.find(product => product.id === productId)

        if (!productIdFinder) {
            return buildResponse(404,
                {
                    message: "Product not found"
                });
        }

        return buildResponse(200, productIdFinder);

    } catch (err) {
        if (err instanceof Error) {
            return buildResponse(500, { message: err.message });
        } else {
            return buildResponse(500, { message: 'Unknown error occurred' });
        }
    }
};
