import { config } from '../config.js';
import { logger } from '../utils/logger.js';

let accessToken = '';
let tokenExpiresAt = 0;

async function refreshAccessToken(): Promise<string> {
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.wechat.appId}&secret=${config.wechat.appSecret}`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    errcode?: number;
    errmsg?: string;
  };

  if (!data.access_token) {
    throw new Error(`Failed to get access_token: ${data.errmsg}`);
  }

  accessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in! - 300) * 1000;
  return accessToken;
}

export async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }
  return refreshAccessToken();
}

/**
 * Send a text message to a user via the Customer Service Message API.
 * Requires a verified WeChat Service Account.
 */
export async function sendCustomerMessage(
  openId: string,
  content: string,
): Promise<void> {
  const token = await getAccessToken();
  const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${token}`;

  const body = {
    touser: openId,
    msgtype: 'text',
    text: { content },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as { errcode: number; errmsg: string };
  if (data.errcode !== 0) {
    logger.error('Failed to send customer message', data);
  }
}
