import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL!,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  wechat: {
    appId: process.env.WECHAT_APP_ID!,
    appSecret: process.env.WECHAT_APP_SECRET!,
    token: process.env.WECHAT_TOKEN!,
    encodingAESKey: process.env.WECHAT_ENCODING_AES_KEY || '',
  },

  llm: {
    apiKey: process.env.LLM_API_KEY!,
    baseURL: process.env.LLM_BASE_URL || 'https://api.deepseek.com',
    model: process.env.LLM_MODEL || 'deepseek-chat',
  },
} as const;
