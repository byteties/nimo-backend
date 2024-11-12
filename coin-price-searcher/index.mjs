import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { COIN_SEARCH_LOG_TABLE, COIN_GECKO_URL,X_CG_API_KEY,EMAIL_SENDER_LAMBDA,REGION } from './env.mjs'
const lambda = new LambdaClient({ region: REGION });

const client = new DynamoDBClient();
const dynamo = DynamoDBDocument.from(client);
const tableName = COIN_SEARCH_LOG_TABLE;

const getCoinPrice = async(ids,currencies) => {
  const allIds = ids.toString();
  const allCurrencies = currencies.toString();
  try {
    const response = await fetch(`${COIN_GECKO_URL}/price?ids=${allIds}&vs_currencies=${allCurrencies}`, {
      headers: {
        "x-cg-demo-api-key": X_CG_API_KEY,
      }
    });
    const json = await response.json()
    return json;
  } catch (error) {
    console.log('getCoinPrice was failed!!!');
    console.error(error);
  }
}

const putCoinData = async(username, coins, timestamp, date) => {
  const day = date.split('T')[0]
  for await (const [key, value] of Object.entries(coins)) {
    for await (const [childKey, childValue] of Object.entries(value)) {
      await createCoinLog(username,`${day}:${key}:${childKey}:${timestamp}`,key, childValue, childKey,timestamp, date)
    }
  }
}

const invokeEmailSender = async (payload) => {
  const params = {
    FunctionName: EMAIL_SENDER_LAMBDA, 
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify(payload),
  };
  try {
    const command = new InvokeCommand(params);
    const response = await lambda.send(command);
    console.log(`invokeEmailSender with payload ${JSON.stringify(payload)} was sucessful!!!`);
    return response;
  } catch (error) {
    console.log('invokeEmailSender was failed!!!');
    console.error(error);
  }
}

const createCoinLog = async(username, sk, coin, price, unit, timestamp, date) => {
  try {
    await dynamo.put({
      TableName: tableName,
      Item: {
        username, 
        sk, // day:coin:unit:timestamp
        coin,
        price,
        unit,
        timestamp,
        createAt: date
      },
    });
    console.log(`Put pk:${username} | sk:${sk} | Dynamo was sucessful!!!`);
  } catch (error) {
    console.log('createCoinLog was failed!!!');
    console.error(error);
  }
    
}

export const handler = async (event) => {
  const { headers, body } = event
  const { username } = headers
  const bodyFormated = JSON.parse(body)
  const { ids, currencies } = bodyFormated
  if(!username) {
    return {
      statusCode: 400,
      body: "username is missing in header"
    }
  }
  if(!Array.isArray(ids) || !Array.isArray(currencies)) {
    return {
      statusCode: 400,
      body: "ids or currencies must be array"
    }
  }
  if(ids.length === 0 || currencies === 0) {
    return {
      statusCode: 400,
      body: "ids or currencies must not be empty"
    }
  }
  const timestamp = Date.now()
  const date = new Date().toISOString(); 
  try {
    const coinsPrice = await getCoinPrice(ids, currencies);
    await putCoinData(username, coinsPrice, timestamp ,date);
    await invokeEmailSender({ coinsPrice, timestamp });
    return coinsPrice
  } catch (err) {
    return err.message
  }
};