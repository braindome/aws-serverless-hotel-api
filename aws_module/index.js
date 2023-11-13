const {sendResponse} = require('../responses/index');
const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();

export const SERVER = {
    documentClient:documentClient,
    sendResponse:sendResponse,
};