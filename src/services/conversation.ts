import { db } from '../db/index.js';
import { conversations, messages } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { analyzeIntent, generateRecommendation, simpleChat } from './llm.js';
import { searchProducts, formatProductsForLLM } from './product.js';
import { getOrCreateUser, updateUserProfile } from './profile.js';

const CONTEXT_WINDOW = 20;
const CONVERSATION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Get or create the active conversation for a user.
 * If the last conversation is older than 30 minutes, start a new one.
 */
async function getActiveConversation(userId: string) {
  const existing = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.userId, userId),
        eq(conversations.status, 'active'),
      ),
    )
    .orderBy(desc(conversations.updatedAt))
    .limit(1);

  if (existing[0]) {
    const lastUpdate = existing[0].updatedAt.getTime();
    if (Date.now() - lastUpdate < CONVERSATION_TIMEOUT_MS) {
      return existing[0];
    }
    // Close the stale conversation
    await db
      .update(conversations)
      .set({ status: 'closed' })
      .where(eq(conversations.id, existing[0].id));
  }

  const created = await db
    .insert(conversations)
    .values({ userId })
    .returning();

  return created[0];
}

/**
 * Load recent messages from a conversation as LLM chat history.
 */
async function loadConversationHistory(
  conversationId: string,
): Promise<ChatCompletionMessageParam[]> {
  const rows = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(CONTEXT_WINDOW);

  return rows.reverse().map((r) => ({
    role: r.role as 'user' | 'assistant' | 'system',
    content: r.content,
  }));
}

/**
 * Save a message to the database.
 */
async function saveMessage(
  conversationId: string,
  role: string,
  content: string,
  metadata?: Record<string, unknown>,
) {
  await db.insert(messages).values({
    conversationId,
    role,
    content,
    metadata: metadata ?? null,
  });

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));
}

/**
 * Main entry point: handle an incoming user message end-to-end.
 *
 * Flow:
 * 1. Get/create user and active conversation
 * 2. Save user message
 * 3. Load conversation history
 * 4. Stage 1: Analyze intent
 * 5. Stage 2: Search products (if needed) and generate recommendation
 * 6. Save assistant reply and update user profile
 * 7. Return reply text
 */
export async function handleUserMessage(
  openId: string,
  content: string,
): Promise<string> {
  const user = await getOrCreateUser(openId);
  const conversation = await getActiveConversation(user.id);

  await saveMessage(conversation.id, 'user', content);

  const history = await loadConversationHistory(conversation.id);

  // Stage 1: understand intent
  const intent = await analyzeIntent(history);

  let reply: string;

  if (
    intent.intent === 'greeting' ||
    intent.intent === 'general_chat'
  ) {
    // No product search needed
    if (intent.needMoreInfo && intent.followUpQuestion) {
      reply = intent.followUpQuestion;
    } else {
      reply = await simpleChat(history);
    }
  } else {
    // Product-related intent — run search + recommendation
    if (intent.needMoreInfo && intent.followUpQuestion) {
      reply = intent.followUpQuestion;
    } else {
      const matchedProducts = await searchProducts(intent);
      const productsJson = formatProductsForLLM(matchedProducts);
      const userProfileJson = JSON.stringify(user.profile || {});

      const result = await generateRecommendation(
        history,
        productsJson,
        userProfileJson,
      );

      reply = result.reply;

      // Update user profile with extracted info
      if (Object.keys(result.profileUpdate).length > 0) {
        await updateUserProfile(user.id, result.profileUpdate);
      }

      // Store which products were recommended
      const productIds = matchedProducts.map((p) => p.id);
      await saveMessage(conversation.id, 'assistant', reply, {
        recommendedProducts: productIds,
      });
      return reply;
    }
  }

  await saveMessage(conversation.id, 'assistant', reply);
  return reply;
}
