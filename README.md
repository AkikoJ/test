# 微信服务号智能选品推荐系统

基于 Node.js + TypeScript 的微信服务号后端，集成 LLM（DeepSeek）实现智能对话选品推荐。

## 技术栈

- **Runtime**: Node.js 20+ / TypeScript
- **Web**: Express
- **Database**: PostgreSQL + Drizzle ORM
- **Queue**: Redis + BullMQ
- **LLM**: DeepSeek API (兼容 OpenAI SDK)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动数据库和 Redis

```bash
docker compose up -d
```

### 3. 配置环境变量

复制 `.env` 文件并填入实际配置：

- `WECHAT_APP_ID` / `WECHAT_APP_SECRET` / `WECHAT_TOKEN` — 微信服务号后台获取
- `LLM_API_KEY` — DeepSeek API Key（https://platform.deepseek.com）

### 4. 生成并运行数据库迁移

```bash
npm run db:generate
npm run db:migrate
```

### 5. 导入示例产品数据

```bash
npm run db:seed
```

### 6. 启动开发服务器

```bash
npm run dev
```

### 7. 配置微信服务号

在微信公众平台后台 → 设置与开发 → 基本配置：

- **URL**: `https://your-domain.com/webhook`
- **Token**: 与 `.env` 中 `WECHAT_TOKEN` 一致
- **EncodingAESKey**: 与 `.env` 中 `WECHAT_ENCODING_AES_KEY` 一致

## 项目结构

```
src/
├── index.ts            # 应用入口
├── config.ts           # 配置管理
├── db/                 # 数据库层
│   ├── schema.ts       # Drizzle 表定义
│   ├── index.ts        # 数据库连接
│   ├── migrate.ts      # 迁移脚本
│   └── seed.ts         # 种子数据
├── wechat/             # 微信接入
│   ├── gateway.ts      # 消息网关
│   ├── crypto.ts       # 签名验证
│   └── api.ts          # 微信 API
├── queue/              # 消息队列
│   ├── producer.ts     # 入队
│   └── consumer.ts     # 消费处理
├── services/           # 业务逻辑
│   ├── conversation.ts # 对话编排
│   ├── llm.ts          # LLM 服务
│   ├── product.ts      # 产品检索
│   └── profile.ts      # 用户画像
├── prompts/            # LLM 提示词
└── utils/              # 工具函数
```

## 核心流程

1. 用户在微信发消息 → 微信服务器 POST 到 `/webhook`
2. 网关验签、解析 XML，立即返回 `success`（避免 5 秒超时）
3. 消息入 BullMQ 异步处理
4. LLM 第一阶段：分析意图，生成产品查询条件
5. 产品服务按条件检索匹配产品
6. LLM 第二阶段：结合产品数据生成推荐回复 + 提取用户画像
7. 通过客服消息 API 主动推送回复给用户
8. 保存对话记录，更新用户画像
