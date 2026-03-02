import { Worker, Job } from 'bullmq';
import { sendCustomerMessage } from '../wechat/api.js';
import { handleUserMessage } from '../services/conversation.js';
import { logger } from '../utils/logger.js';
import { bullmqConnection } from '../utils/redis.js';
import type { IncomingMessage } from './producer.js';

let worker: Worker | null = null;

async function processJob(job: Job<IncomingMessage>): Promise<void> {
  const { openId, content } = job.data;

  try {
    if (content === '__SUBSCRIBE__') {
      await sendCustomerMessage(
        openId,
        '欢迎关注！我是您的智能选品助手，请告诉我您的需求，我来帮您推荐合适的产品。',
      );
      return;
    }

    const reply = await handleUserMessage(openId, content);
    await sendCustomerMessage(openId, reply);
  } catch (err) {
    logger.error(`Error processing message for ${openId}`, err);
    await sendCustomerMessage(
      openId,
      '抱歉，系统处理遇到问题，请稍后再试。',
    );
  }
}

export async function startMessageConsumer(): Promise<void> {
  worker = new Worker('wechat-messages', processJob, {
    connection: bullmqConnection(),
    concurrency: 5,
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed`, { error: err.message });
  });

  logger.info('Message consumer started');
}
