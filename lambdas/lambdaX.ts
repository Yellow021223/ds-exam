import { Handler } from "aws-lambda";
import {
  GetObjectCommand,
  GetObjectCommandInput,
  GetObjectCommandOutput,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput,
} from "@aws-sdk/client-sqs";  //用于把消息发到 Queue A

const s3 = new S3Client();
const sqs = new SQSClient();

const QUEUE_A_URL = process.env.QUEUE_A_URL;  // 在环境变量中设置 Queue A 的 URL

export const handler: Handler = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));

    for (const record of event.Records) {
      const recordBody = JSON.parse(record.body);
      const snsMessage = JSON.parse(recordBody.Message);

      const country = snsMessage.address?.country;

      if (country === "Ireland" || country === "China") {
        // send message to Queue A
        const params: SendMessageCommandInput = {
          QueueUrl: QUEUE_A_URL!,
          MessageBody: JSON.stringify(snsMessage),
        };
        await sqs.send(new SendMessageCommand(params));
        console.log(`Message sent to Queue A: ${JSON.stringify(snsMessage)}`);
      } else {
        // process message here (Lambda Y)
        console.log(`Processing message in Lambda Y: ${JSON.stringify(snsMessage)}`);

        // 你可以在这里做额外处理
        if (snsMessage.Records) {
          for (const messageRecord of snsMessage.Records) {
            const s3e = messageRecord.s3;
            const srcBucket = s3e.bucket.name;
            const srcKey = decodeURIComponent(s3e.object.key.replace(/\+/g, " "));

            let origimage: GetObjectCommandOutput | null = null;
            try {
              const params: GetObjectCommandInput = {
                Bucket: srcBucket,
                Key: srcKey,
              };

              origimage = await s3.send(new GetObjectCommand(params));
              // 这里处理 S3 对象逻辑
            } catch (error) {
              console.log(error);
            }
          }
        }
      }
    }
  } catch (error: any) {
    throw new Error(JSON.stringify(error));
  }
};
