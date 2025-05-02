import { Handler } from "aws-lambda";
import {
  SESClient,
  SendEmailCommand,
  SendEmailCommandInput,
} from "@aws-sdk/client-ses";
import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput,
} from "@aws-sdk/client-sqs"; // 新增：用于发送到 Queue B

const SES_REGION = 'eu-west-1';
const SES_EMAIL_FROM = 'yourEmailAddressFrom';
const SES_EMAIL_TO = 'yourEmailAddressTo';
const QUEUE_B_URL = process.env.QUEUE_B_URL;  // 通过 env 设置 Queue B 的 URL

const client = new SESClient({ region: SES_REGION });
const sqs = new SQSClient();

type ContactDetails = {
  name: string;
  email: string;
  message: string;
};

export const handler: Handler = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));

    for (const record of event.Records) {
      const recordBody = JSON.parse(record.body);
      const snsMessage = JSON.parse(recordBody.Message);

      const country = snsMessage.address?.country;
      const email = snsMessage.email;

      // ✅ 检查 country 是否是 Ireland / China 且 email 是否缺失
      if ((country === "Ireland" || country === "China") && (!email || email.trim() === "")) {
        // 🔥 没有 email，发到 Queue B
        const params: SendMessageCommandInput = {
          QueueUrl: QUEUE_B_URL!,
          MessageBody: JSON.stringify(snsMessage),
        };
        await sqs.send(new SendMessageCommand(params));
        console.log(`Message sent to Queue B: ${JSON.stringify(snsMessage)}`);
        continue;  // ✅ 跳过当前循环，后续逻辑不再执行
      }

      if (snsMessage.Records) {
        console.log("Record body ", JSON.stringify(snsMessage));

        for (const messageRecord of snsMessage.Records) {
          const s3e = messageRecord.s3;
          const srcBucket = s3e.bucket.name;
          const srcKey = decodeURIComponent(s3e.object.key.replace(/\+/g, " "));

          try {
            const { name, email, message }: ContactDetails = {
              name: "The Photo Album",
              email: SES_EMAIL_FROM,
              message: `We received your Image. Its URL is s3://${srcBucket}/${srcKey}`,
            };

            const params = sendEmailParams({ name, email, message });
            await client.send(new SendEmailCommand(params));
            console.log(`Email sent for image: ${srcKey}`);
          } catch (error: unknown) {
            console.log("ERROR is: ", error);
          }
        }
      }
    }
  } catch (error: any) {
    throw new Error(JSON.stringify(error));
  }
};

function sendEmailParams({ name, email, message }: ContactDetails) {
  const parameters: SendEmailCommandInput = {
    Destination: {
      ToAddresses: [SES_EMAIL_TO],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: getHtmlContent({ name, email, message }),
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: `New image Upload`,
      },
    },
    Source: SES_EMAIL_FROM,
  };
  return parameters;
}

function getHtmlContent({ name, email, message }: ContactDetails) {
  return `
    <html>
      <body>
        <h2>Sent from: </h2>
        <ul>
          <li style="font-size:18px">👤 <b>${name}</b></li>
          <li style="font-size:18px">✉️ <b>${email}</b></li>
        </ul>
        <p style="font-size:18px">${message}</p>
      </body>
    </html> 
  `;
}
