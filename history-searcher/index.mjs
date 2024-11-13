import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { COIN_SEARCH_LOG_TABLE,REGION } from './env.mjs'

const client = new DynamoDBClient({ region: REGION });
const dynamo = DynamoDBDocument.from(client);

const coinLogQuery = async (username, day = '') => {
  const params = {
    TableName: COIN_SEARCH_LOG_TABLE,
    KeyConditionExpression: 'username = :username',
    ExpressionAttributeValues: {
      ":username": username,
    }
  }
  if(day) {
    params.KeyConditionExpression = 'username = :username and begins_with(sk, :sk)'
    params.ExpressionAttributeValues[":sk"] = day
  }
  const response = await dynamo.query(params);
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
  const day = queryStringParameters?.day;
  if(!username) {
    return {
      statusCode: 400,
      body: "username is missing in header"
    }
  }
  try {
    const coinsHostory = await coinLogQuery(username, day);
    return coinsHostory
  } catch (err) {
    return err.message
  }
};