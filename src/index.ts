import express from 'express';
import { config } from './config.js';
import { wechatGateway } from './wechat/gateway.js';
import { startMessageConsumer } from './queue/consumer.js';
import { logger } from './utils/logger.js';

const app = express();

app.use(express.text({ type: 'text/xml' }));
app.use(express.urlencoded({ extended: true }));

app.use('/webhook', wechatGateway);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function main() {
  await startMessageConsumer();

  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
  });
}

main().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
