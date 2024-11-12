import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { COIN_SEARCH_LOG_TABLE } from './env.mjs'

const client = new DynamoDBClient();
const dynamo = DynamoDBDocument.from(client);

const coinLogQuery = async (username, day = '') => {
  const response = await dynamo.query({
    TableName: COIN_SEARCH_LOG_TABLE,
    KeyConditionExpression: 'username = :username and begins_with(sk, :sk)',
    ExpressionAttributeValues: {
      ":username": username,
      ":sk": day
    }
  });
  const { Items, Count, LastEvaluatedKey } = response
  return { 
    items: Items,
    count: Count,
    nextToken: LastEvaluatedKey
  };
};

export const handler = async (event) => {
  const { headers, queryStringParameters } = event
  const { username } = headers;
  const { day } = queryStringParameters;
  if(!username) {
    return {
      statusCode: 400,
      body: "username is missing in header"
    }
  }
  if(!day) {
    return {
      statusCode: 400,
      body: "day is missing in queryStringParameters"
    }
  }
  try {
    const coinsHostory = await coinLogQuery(username, day);
    return coinsHostory
  } catch (err) {
    return err.message
  }
};