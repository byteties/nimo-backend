import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { DESTINATION_EMAIL,SENDER_EMAIL,REGION } from './env.mjs'
const ses = new SESClient({ region: REGION });

const emailFormatter = (header, data) => {
  let newBody = ''
  for (const [coin, value] of Object.entries(data)) {
    for (const [unit, price] of Object.entries(value)) {
      newBody += `<tr><td>${coin}</td>
      <td>${price}</td>
      <td>${unit}</td><tr>`
    }
  }
  const emailTemplate = `
  <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  color: #333;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
                }
                .container {
                  width: 100%;
                  max-width: 600px;
                  margin: auto;
                  background-color: #ffffff;
                  padding: 20px;
                  border: 1px solid #ddd;
                }
                .header {
                  text-align: center;
                  padding: 10px;
                  background-color: #0073e6;
                  color: white;
                }
                .table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 20px;
                }
                .table th, .table td {
                  border: 1px solid #ddd;
                  padding: 8px;
                  text-align: left;
                }
                .table th {
                  background-color: #0073e6;
                  color: white;
                }
                .total {
                  font-weight: bold;
                  text-align: right;
                  padding: 8px;
                  background-color: #f4f4f4;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>${header}</h1>
                </div>
                <p>Dear Customer,</p>
                <p>Here is the summary of your watching list:</p>
                <table class="table">
                  <tr>
                    <th>Coin</th>
                    <th>Price</th>
                    <th>Unit</th>
                  </tr>
                  ${newBody}
                </table>
                <p>NIMO INDUSTRIES PTY. LTD</p>
              </div>
            </body>
          </html>
  `
  return emailTemplate;
}


export const handler = async(event) => {
  const { coinsPrice, timestamp } = event
  const date = new Date(timestamp);
  const formettedDate = date.toLocaleString();
  const subject = `Cryptocurrency Current Price at ${formettedDate}`
  const emailBody = emailFormatter('Cryptocurrency Current Price Service',coinsPrice)
  const command = new SendEmailCommand({
    Destination: {
      ToAddresses: [DESTINATION_EMAIL]
    },
    Message: {
      Body: {
        Html: { Data: emailBody },
        Charset: 'UTF-8',
      },

      Subject: { Data: subject },
    },
    Source: SENDER_EMAIL,
  });

  try {
    let response = await ses.send(command);
    console.error('Send Email was successfull!!!');
    return response;
  }
  catch (error) {
    console.error('Send Email was failed !!!');
    console.log(error)
  }
};