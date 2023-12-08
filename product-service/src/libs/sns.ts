import { SNSClient } from "@aws-sdk/client-sns";

export default new SNSClient({ region: process.env.PRODUCT_AWS_REGION })