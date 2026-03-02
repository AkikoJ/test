import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { config } from '../config.js';
import { SYSTEM_PROMPT } from '../prompts/system.js';
import { INTENT_PROMPT } from '../prompts/intent.js';
import { buildRecommendPrompt } from '../prompts/recommend.js';

const client = new OpenAI({
  apiKey: config.llm.apiKey,
  baseURL: config.llm.baseURL,
});

export interface IntentResult {
  intent: string;
  filters: {
    category?: string;
    keywords?: string[];
    priceRange?: { min: number | null; max: number | null };
    tags?: string[];
    specs?: Record<string, unknown>;
  };
  needMoreInfo: boolean;
  followUpQuestion?: string;
}

export interface RecommendResult {
  reply: string;
  profileUpdate: Record<string, unknown>;
}

/**
 * Call LLM with conversation history and get a chat response.
 */
export async function chatCompletion(
  messages: ChatCompletionMessageParam[],
): Promise<string> {
  const response = await client.chat.completions.create({
    model: config.llm.model,
    messages,
    temperature: 0.7,
    max_tokens: 1024,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Stage 1: Analyze user intent and generate query filters.
 */
export async function analyzeIntent(
  conversationHistory: ChatCompletionMessageParam[],
): Promise<IntentResult> {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: INTENT_PROMPT },
    ...conversationHistory,
  ];

  const raw = await chatCompletion(messages);

  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as IntentResult;
  } catch {
    return {
      intent: 'general_chat',
      filters: {},
      needMoreInfo: false,
    };
  }
}

/**
 * Stage 2: Generate recommendation reply with product data.
 */
export async function generateRecommendation(
  conversationHistory: ChatCompletionMessageParam[],
  productsJson: string,
  userProfileJson: string,
): Promise<RecommendResult> {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory,
    {
      role: 'user',
      content: buildRecommendPrompt(productsJson, userProfileJson),
    },
  ];

  const raw = await chatCompletion(messages);
  const parts = raw.split('---SPLIT---');

  const reply = (parts[0] || raw).trim();
  let profileUpdate: Record<string, unknown> = {};

  if (parts[1]) {
    try {
      const cleaned = parts[1]
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      profileUpdate = JSON.parse(cleaned);
    } catch {
      // Profile extraction failed — non-critical, skip
    }
  }

  return { reply, profileUpdate };
}

/**
 * Simple chat for greetings and general conversation (no product lookup needed).
 */
export async function simpleChat(
  conversationHistory: ChatCompletionMessageParam[],
): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory,
  ];

  return chatCompletion(messages);
}
