# Distributed Systems Exam Starter.

## Instructions to student.

This repository contains the starting code for a lab-based exam on the Distributed Systems module.
## Setup
You are required to take the following steps in preparation for this exam:
Fork this repository and clone it to your laptop. 
Import the project into VS Code and run the following commands:
~~~
$ npm install
$ npm run schema
$ git add -A
$ git commit -m "Added dependencies."
$ git push origin main
~~~

## The App.
Deploy the app to your AWS account (cdk deploy).

The app's infrastructure includes some lambdas, queues, a table, a topis, and a skeleton REST API. The table stores information about movie crews, e.g. directors, camera operators, etc. Some seed data is defined in the seed folder. 

Examine all aspects of the codebase before the exam, but do not change it until the exam begins. When you have fully understood the app, you may destroy the stack. However, redeploy the app again the day before the exam and leave it deployed.

question1:
在 question1.ts 中
从下面的几个功能中根据考试需求在try中填入对应的文件
在console.log("Event: ", event);这一行下面，return上面
//getAllList使用
const commandOutput = await client.send(
      new ScanCommand({
        TableName: process.env.TABLE_NAME,
      })
    );
    if (!commandOutput.Items) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Not found" }),
      };
    }
    const body = {
      data: commandOutput.Items,
    };


//添加人员
        const body = event.body ? JSON.parse(event.body) : undefined;
    if (!body) {
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    if (!isValidBodyParams(body)) {
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: `Incorrect type. Must match the Movie schema`,
          schema: schema.definitions["MovieCast"],
        }),
      };
    }
    
    const commandOutput = await client.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: body,
      })
    );


//通过ID和ROLE来查询
    const pathParameters = event?.pathParameters;
    const movieId = pathParameters?.movieId ? parseInt(pathParameters.movieId) : undefined;
    const role = event.queryStringParameters?.role;

    if (!movieId) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing movie Id" }),
      };
    }

    const commandOutput = await client.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { 
          movieId,
          role
        },
      })
    );
    if (!commandOutput.Item) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Invalid movie Id" }),
      };
    }
    const body: any = { data: commandOutput.Item };


//删除人员
//DELETE
const pathParameters = event?.pathParameters;
    const movieId = pathParameters?.movieId ? parseInt(pathParameters.movieId) : undefined;
    const role = event.queryStringParameters?.role;

    if (!movieId|| !role) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing movie Id" }),
      };
    }

    const commandOutput = await client.send(
      new DeleteCommand({
        TableName: process.env.TABLE_NAME,
        Key: { 
          movieId,
          role
        },
      })
    );

    const body = commandOutput


//update更新
const pathParameters = event?.pathParameters;
    const movieId = pathParameters?.movieId ? parseInt(pathParameters.movieId) : undefined;
    const role = event.queryStringParameters?.role;


  if (!movieId || !role || !event.body) {
    return {
      statusCode: 400,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: "Missing movieId, role or body" }),
    };
  }

  const bodyData = JSON.parse(event.body);
  const names = bodyData.names;

  if (!names) {
    return {
      statusCode: 400,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: "Missing 'names' field in body" }),
    };
  }

  const commandOutput = await client.send(
    new UpdateCommand({
      TableName: process.env.TABLE_NAME!,
      Key: {
        movieId,
        role,
      },
      UpdateExpression: "SET #n = :n",
      ExpressionAttributeNames: {
        "#n": "names" 
      },
      ExpressionAttributeValues: {
        ":n": names, 
      },
      ReturnValues: "ALL_NEW", 
    })
  );
  
  const body: any = { data: commandOutput.Attributes };

在lib/exam-stack.ts中
const api = new apig.RestApi(this, "ExamAPI", {这一行的上面
添加如下内容
table.grantReadWriteData(question1Fn)


const anEndpoint = api.root.addResource("patha");在这一行下添加 对应需求的的代码
//getAllList使用“GET”，add方法使用“POST”
    anEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(question1Fn, { proxy: true })
    );
//    通过ID来查询，如果是删除修改GET为DELETE,如果更新是PUT
   const specificAnEndpoint = anEndpoint.addResource("{movieId}");
    specificAnEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(question1Fn, { proxy: true })
    );

Question2：
在exam-stack.ts中
接在代码const lambdaYFn整个方法函数的后面
 //此处我们认为lambdaXFn是图像处理函数，lambdaYFn是消息处理函数，queueA是通知图像处理的sqs队列，queueB是通知邮件处理的队列
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,                      
      new s3n.SnsDestination(topic1)             
    );

    topic1.addSubscription(new subs.SqsSubscription(queueA));

    topic1.addSubscription(new subs.SqsSubscription(queueB));

    const newImageEventSource = new events.SqsEventSource(queueA, {
      batchSize: 5,
      maxBatchingWindow: cdk.Duration.seconds(5),
    });
    lambdaXFn.addEventSource(newImageEventSource); 

    const newMailEventSource = new events.SqsEventSource(queueB, {
      batchSize: 5,
      maxBatchingWindow: cdk.Duration.seconds(5),
    }); 
    lambdaYFn.addEventSource(newMailEventSource)

    bucket.grantRead(lambdaXFn);

    new cdk.CfnOutput(this, "bucketName", {
      value: bucket.bucketName,
    });
    
    lambdaYFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ses:SendTemplatedEmail",
        ],
        resources: ["*"],  
      })
    );

//lambdaXFn作为图像处理函数来写，注意实际题目内容，需要装npm install @aws-sdk/client-s3
//在import { Handler } from "aws-lambda";下面，在export const handler: Handler = async (event, context) => {上面的部分中添加
import {
  GetObjectCommand,
  GetObjectCommandInput,
  GetObjectCommandOutput,
  S3Client,
} from "@aws-sdk/client-s3";  

const s3 = new S3Client();  
//try之中console.log("Event: ", JSON.stringify(event));下面添加
for (const record of event.Records) {  
      const recordBody = JSON.parse(record.body);        
      const snsMessage = JSON.parse(recordBody.Message);
  
      if (snsMessage.Records) {  
        console.log("Record body ", JSON.stringify(snsMessage));  
  
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
  
            // 这里是图像处理逻辑的预留区域
            // 你可以添加判断文件类型、记录数据库、触发后续流程等操作
  
          } catch (error) {
            console.log(error); 
          }
        }
      }
    }

//lambdaYFn作为邮件处理函数来写，注意实际题目内容，需要装npm install @aws-sdk/client-ses
//在import { Handler } from "aws-lambda";下面，在export const handler: Handler = async (event, context) => {上面的部分中添加
import {
  SESClient,
  SendEmailCommand,
  SendEmailCommandInput,
} from "@aws-sdk/client-ses";  

const SES_REGION = 'eu-west-1';
const SES_EMAIL_FROM = 'yourEmailAddressFrom' ;
const SES_EMAIL_TO =  'yourEmailAddressTo';

// 定义联系人信息的类型结构
type ContactDetails = {
  name: string;
  email: string;
  message: string;
};

const client = new SESClient({ region: SES_REGION });
//在try中console.log("Event: ", JSON.stringify(event));下面添加
for (const record of event.Records) {  
    const recordBody = JSON.parse(record.body);  
    const snsMessage = JSON.parse(recordBody.Message);  

    if (snsMessage.Records) {  
      console.log("Record body ", JSON.stringify(snsMessage));

      for (const messageRecord of snsMessage.Records) {  
        const s3e = messageRecord.s3;  
        const srcBucket = s3e.bucket.name;  
        const srcKey = decodeURIComponent(s3e.object.key.replace(/\+/g, " "));  

        try {
          // 构造邮件内容
          const { name, email, message }: ContactDetails = {
            name: "The Photo Album", 
            email: SES_EMAIL_FROM,   
            message: `We received your Image. Its URL is s3://${srcBucket}/${srcKey}`, 
          };

          const params = sendEmailParams({ name, email, message });  
          await client.send(new SendEmailCommand(params));  
        } catch (error: unknown) {
          console.log("ERROR is: ", error);  
        }
      }
    }
  }



//在最后的括号之后添加
// 构建发送邮件所需的参数
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
        // Text: {                      
        //   Charset: "UTF-8",
        //   Data: getTextContent({ name, email, message }),
        // },
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

function getTextContent({ name, email, message }: ContactDetails) {
  return `
    Received an Email. 📬
    Sent from:
        👤 ${name}
        ✉️ ${email}
    ${message}
  `;
}


