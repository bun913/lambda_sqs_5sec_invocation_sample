import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { aws_lambda_nodejs } from "aws-cdk-lib";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { send } from "process";

export class SqsSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SQSのキューを作成
    const queue = new sqs.Queue(this, "SqsSampleQueue", {
      fifo: true,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(1),
    });
    // Lambdaの関数を作成
    const consumeFn = new aws_lambda_nodejs.NodejsFunction(this, "ReciveFunc", {
      entry: "lambda/handler.ts",
      handler: "handler",
      environment: {
        QUEUE_URL: queue.queueUrl,
      },
      reservedConcurrentExecutions: 1,
      logRetention: RetentionDays.ONE_DAY,
      timeout: cdk.Duration.seconds(60 * 5),
    });
    // メッセージを一気に10件登録するための関数を作成
    const sendFn = new aws_lambda_nodejs.NodejsFunction(this, "SendQueFunc", {
      entry: "lambda/send_que.ts",
      handler: "handler",
      environment: {
        QUEUE_URL: queue.queueUrl,
      },
      reservedConcurrentExecutions: 1,
      logRetention: RetentionDays.ONE_DAY,
    });
    // SQSのキューをトリガーにLambdaを実行
    consumeFn.addEventSourceMapping("SqsSampleEventSourceMapping", {
      eventSourceArn: queue.queueArn,
      batchSize: 1,
    });
    // キューからのメッセージ受信権限をLambdaに付与
    queue.grantConsumeMessages(consumeFn)
    // キューにメッセージを入れる権限をLambdaに付与
    queue.grantSendMessages(sendFn)
  }
}
