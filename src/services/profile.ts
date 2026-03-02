import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export type UserProfile = Record<string, unknown>;

/**
 * Get or create a user by WeChat openId.
 * Returns the user record including their profile.
 */
export async function getOrCreateUser(openId: string) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  if (existing[0]) {
    return existing[0];
  }

  const inserted = await db
    .insert(users)
    .values({ openId, profile: {} })
    .returning();

  return inserted[0];
}

/**
 * Merge new profile fields into the existing user profile (shallow merge).
 * Only overwrites fields that are present in the update.
 */
export async function updateUserProfile(
  userId: string,
  profileUpdate: UserProfile,
): Promise<void> {
  if (Object.keys(profileUpdate).length === 0) return;

  const current = await db
    .select({ profile: users.profile })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const currentProfile =
    (current[0]?.profile as UserProfile | null) ?? {};
  const merged = { ...currentProfile, ...profileUpdate };

  await db
    .update(users)
    .set({ profile: merged, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
