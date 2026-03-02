import { Router, type Router as RouterType } from 'express';
import { verifySignature } from './crypto.js';
import { parseXML } from '../utils/xml.js';
import { enqueueMessage } from '../queue/producer.js';
import { checkRateLimit } from '../utils/rateLimit.js';
import { logger } from '../utils/logger.js';

export const wechatGateway: RouterType = Router();

/**
 * GET /webhook — WeChat server verification (echostr handshake).
 */
wechatGateway.get('/', (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query as Record<
    string,
    string
  >;

  if (verifySignature(signature, timestamp, nonce)) {
    res.send(echostr);
  } else {
    res.status(403).send('Invalid signature');
  }
});

/**
 * POST /webhook — Receive messages from WeChat users.
 * Immediately returns empty string (no passive reply) and processes asynchronously.
 */
wechatGateway.post('/', async (req, res) => {
  const { signature, timestamp, nonce } = req.query as Record<string, string>;

  if (!verifySignature(signature, timestamp, nonce)) {
    res.status(403).send('Invalid signature');
    return;
  }

  res.send('success');

  try {
    const message = await parseXML(req.body as string);

    if (message.MsgType === 'text' && message.Content) {
      const allowed = await checkRateLimit(message.FromUserName, 10, 60);
      if (!allowed) {
        logger.warn('Rate limit hit', { openId: message.FromUserName });
        return;
      }

      logger.info('Incoming text message', {
        openId: message.FromUserName,
        msgId: message.MsgId,
      });

      await enqueueMessage({
        openId: message.FromUserName,
        content: message.Content.trim(),
        msgId: message.MsgId || '',
        timestamp: Date.now(),
      });
    }

    if (message.MsgType === 'event' && message.Event === 'subscribe') {
      logger.info('New subscriber', { openId: message.FromUserName });
      await enqueueMessage({
        openId: message.FromUserName,
        content: '__SUBSCRIBE__',
        msgId: '',
        timestamp: Date.now(),
      });
    }
  } catch (err) {
    logger.error('Failed to process incoming message', err);
  }
});
