import { db } from './drizzle/db';
import { brokerAccounts } from './drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { TokenStore } from './oauth';

export class PostgreSQLTokenStore implements TokenStore {
  async saveToken(
    userId: number,
    brokerType: string,
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number
  ): Promise<void> {
    const existing = await db
      .select()
      .from(brokerAccounts)
      .where(
        and(
          eq(brokerAccounts.userId, userId),
          eq(brokerAccounts.brokerType, brokerType)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(brokerAccounts)
        .set({
          accessToken,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(brokerAccounts.userId, userId),
            eq(brokerAccounts.brokerType, brokerType)
          )
        );
    } else {
      await db.insert(brokerAccounts).values({
        userId,
        brokerType,
        accessToken,
        clientId: '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  async getToken(userId: number, brokerType: string): Promise<string | null> {
    const result = await db
      .select({ accessToken: brokerAccounts.accessToken, isActive: brokerAccounts.isActive })
      .from(brokerAccounts)
      .where(
        and(
          eq(brokerAccounts.userId, userId),
          eq(brokerAccounts.brokerType, brokerType),
          eq(brokerAccounts.isActive, true)
        )
      )
      .limit(1);

    return result.length > 0 ? result[0].accessToken : null;
  }

  async refreshToken(userId: number, brokerType: string): Promise<string | null> {
    // Would call broker's refresh endpoint
    return null;
  }

  async revokeToken(userId: number, brokerType: string): Promise<void> {
    await db
      .update(brokerAccounts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(brokerAccounts.userId, userId),
          eq(brokerAccounts.brokerType, brokerType)
        )
      );
  }
}
