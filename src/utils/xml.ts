import { parseStringPromise, Builder } from 'xml2js';

export interface WeChatMessage {
  ToUserName: string;
  FromUserName: string;
  CreateTime: string;
  MsgType: string;
  Content?: string;
  MsgId?: string;
  Event?: string;
  EventKey?: string;
}

export async function parseXML(xml: string): Promise<WeChatMessage> {
  const result = await parseStringPromise(xml, { explicitArray: false });
  return result.xml as WeChatMessage;
}

export function buildXMLReply(
  toUser: string,
  fromUser: string,
  content: string,
): string {
  const builder = new Builder({
    rootName: 'xml',
    headless: true,
    cdata: true,
  });

  return builder.buildObject({
    ToUserName: toUser,
    FromUserName: fromUser,
    CreateTime: Math.floor(Date.now() / 1000),
    MsgType: 'text',
    Content: content,
  });
}
