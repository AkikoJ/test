import { Queue } from 'bullmq';
import { bullmqConnection } from '../utils/redis.js';

export interface IncomingMessage {
  openId: string;
  content: string;
  msgId: string;
  timestamp: number;
}

const messageQueue = new Queue('wechat-messages', {
  connection: bullmqConnection(),
});

export async function enqueueMessage(msg: IncomingMessage): Promise<void> {
  await messageQueue.add('process-message', msg, {
    removeOnComplete: 1000,
    removeOnFail: 5000,
  });
}
