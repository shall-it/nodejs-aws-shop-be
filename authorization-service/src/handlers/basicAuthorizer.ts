import { buildResponse } from '../utils';
import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';

exports.handler = async (event: APIGatewayTokenAuthorizerEvent) => {
    console.log(event)
    const token = event.authorizationToken;

    if (!token) {
        return buildResponse(401,
            {
                message: 'Authorization header is not provided'
            });
    }
    console.log(token)

    try {
        const base64Credentials = token.split(' ')[1];
        console.log(base64Credentials)
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8').split(':');
        console.log(credentials)
        const username = credentials[0];
        console.log('username', username)
        const password = credentials[1];
        console.log('password', password)

        const envCredentials = process.env.CREDENTIALS!;
        console.log(envCredentials)
        if (!envCredentials) {
            throw new Error('Variable CREDENTIALS must be set into .env file');
        }
        const [envUsername, envPassword] = envCredentials.split('=');
        console.log('envUsername', envUsername)
        console.log('envPassword', envPassword)

        if (username === envUsername && password === envPassword) {
            console.log('Begin policy')
            const policy = generatePolicy(username, 'Allow', event.methodArn);
            console.log(policy)
            return policy
        } else {
            return buildResponse(403,
                {
                    message: 'Access is denied for this user due to invalid authorization token'
                });
        }
    } catch (err) {
        return buildResponse(500,
            {
                message: 'An error occurred:', err
            });
    }
};

const generatePolicy = (principalId: string, effect: string, resource: string): APIGatewayAuthorizerResult => {
    return {
        principalId: principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource,
                },
            ],
        },
    };
};
