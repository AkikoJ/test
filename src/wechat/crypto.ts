import crypto from 'node:crypto';
import { config } from '../config.js';

/**
 * Verify WeChat signature for webhook validation.
 * signature = SHA1(sort(token, timestamp, nonce))
 */
export function verifySignature(
  signature: string,
  timestamp: string,
  nonce: string,
): boolean {
  const token = config.wechat.token;
  const arr = [token, timestamp, nonce].sort();
  const hash = crypto.createHash('sha1').update(arr.join('')).digest('hex');
  return hash === signature;
}
