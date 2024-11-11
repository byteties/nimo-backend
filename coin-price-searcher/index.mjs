import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { COIN_SEARCH_LOG_TABLE, COIN_GECKO_URL } from './env.mjs'

const client = new DynamoDBClient();
const dynamo = DynamoDBDocument.from(client);
const tableName = COIN_SEARCH_LOG_TABLE;

const getCoinPrice = async(ids,currencies) => {
  const allIds = ids.toString();
  const allCurrencies = currencies.toString();
  try {
    const response = await fetch(`${COIN_GECKO_URL}/price?ids=${allIds}&vs_currencies=${allCurrencies}`);
    const json = await response.json()
    return json;
  } catch (error) {
    console.log('getCoinPrice was failed!!!');
    console.error(error);
  }
}

const putCoinData = async(username, coins) => {
  const timestamp = Date.now()
  const date = new Date().toISOString().split('T')[0]; 
  for await (const [key, value] of Object.entries(coins)) {
    for await (const [childKey, childValue] of Object.entries(value)) {
      await createCoinLog(`${username}:${date}:${key}:${childKey}`, timestamp, key, childValue, childKey)
    }
  }
}

const createCoinLog = async(id, timestamp, coin, price, unit) => {
  try {
    await dynamo.put({
      TableName: tableName,
      Item: {
        id,
        timestamp,
        coin,
        price,
        unit,
      },
    });
    console.log('Put Dynamo was sucessful!!!');
  } catch (error) {
    console.log('createCoinLog was failed!!!');
    console.error(error);
  }
    
}

export const handler = async (event) => {
  const { username, ids, currencies } = event
  try {
    const coinsPrice = await getCoinPrice(ids, currencies);
    await putCoinData(username, coinsPrice);
    return { 
      body: coinsPrice,
      statusCode: 200
    }
  } catch (err) {
    return {
      statusCode: 400,
      body: err.message
    }
  }
};