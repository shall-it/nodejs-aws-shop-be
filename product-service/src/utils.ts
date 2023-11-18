import get from 'lodash/get';
import isUndefined from 'lodash/isUndefined';

export const buildResponse = (statusCode, body) => ({
    statusCode: statusCode,
    headers: {
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
    },
    body: JSON.stringify(body)
});

export const checkBodyParameters = (requiredParameters, data) => {
    return requiredParameters.every((parameter) => {
        const parameterValue = get(data, parameter);

        if (isUndefined(parameterValue)) {
            return false;
        }

        return true;
    });
};
