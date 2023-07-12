// このLambdaを実行すると環境変数eventSourceArnに指定した
// SQSに10件メッセージを登録する

import { SQSEvent } from "aws-lambda";
import { SQS } from "aws-sdk";

// FIFOキューに送信するためのメッセージ
type Message = {
  id: number;
  message: string;
  groupId: string;
  deduplicationId: string;
};

function generateRandomNumber(): string {
  const maxNumber = BigInt(10 ** 20);
  const randomNumber = BigInt(Math.floor(Math.random() * Number(maxNumber)));
  return randomNumber.toString();
}

const queueUrl = process.env.QUEUE_URL || "";

export async function handler(event: SQSEvent, context: any): Promise<void> {
  const sqs = new SQS();
  const queueUrl = process.env.QUEUE_URL;
  // ランダム生成したIDをメッセージIDのプレフィックスにする
  const messageIDPrefix = generateRandomNumber();
  const messages: Message[] = [...Array(10).keys()].map((id) => {
    return {
      id,
      message: `message-${messageIDPrefix}-${id}`,
      groupId: `${messageIDPrefix}`,
      deduplicationId: `${messageIDPrefix}-${id}`,
    };
  });

  try {
    if (!queueUrl) {
      throw new Error("QUEUE_URL is not defined");
    }
    for (const message of messages) {
      const params = {
        MessageBody: JSON.stringify(message),
        MessageGroupId: message.groupId,
        MessageDeduplicationId: message.deduplicationId,
        QueueUrl: queueUrl,
      };
      await sqs.sendMessage(params).promise();
    }
  } catch (error) {
    console.log(error);
  }
}
