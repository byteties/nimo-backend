import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { DESTINATION_EMAIL,SENDER_EMAIL,REGION } from './env'
const ses = new SESClient({ region: REGION });

export const handler = async(event) => {
  const command = new SendEmailCommand({
    Destination: {
      ToAddresses: [DESTINATION_EMAIL]
    },
    Message: {
      Body: {
        Text: { Data: "Test" },
      },

      Subject: { Data: "Test Email" },
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