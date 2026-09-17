import { db } from './drizzle/db';
import { brokerAccounts } from './drizzle/schema';
import { eq, and } from 'drizzle-orm';

export interface TokenStore {
  saveToken(userId: string, brokerType: string, token: string, expiresIn?: number): Promise<void>;
  getToken(userId: string, brokerType: string): Promise<string | null>;
  refreshToken(userId: string, brokerType: string): Promise<string>;
  revokeToken(userId: string, brokerType: string): Promise<void>;
}

export class PostgreSQLTokenStore implements TokenStore {
  async saveToken(
    userId: string,
    brokerType: string,
    token: string,
    expiresIn?: number
  ): Promise<void> {
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

    const existing = await db
      .select()
      .from(brokerAccounts)
      .where(
        and(
          eq(brokerAccounts.userId, parseInt(userId)),
          eq(brokerAccounts.brokerType, brokerType)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(brokerAccounts)
        .set({
          accessToken: token,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(brokerAccounts.userId, parseInt(userId)),
            eq(brokerAccounts.brokerType, brokerType)
          )
        );
    } else {
      await db.insert(brokerAccounts).values({
        userId: parseInt(userId),
        brokerType,
        accessToken: token,
        clientId: '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  async getToken(userId: string, brokerType: string): Promise<string | null> {
    const result = await db
      .select({ accessToken: brokerAccounts.accessToken, isActive: brokerAccounts.isActive })
      .from(brokerAccounts)
      .where(
        and(
          eq(brokerAccounts.userId, parseInt(userId)),
          eq(brokerAccounts.brokerType, brokerType),
          eq(brokerAccounts.isActive, true)
        )
      )
      .limit(1);

    return result.length > 0 ? result[0].accessToken : null;
  }

  async refreshToken(userId: string, brokerType: string): Promise<string> {
    throw new Error('Token refresh not implemented for this broker');
  }

  async revokeToken(userId: string, brokerType: string): Promise<void> {
    await db
      .update(brokerAccounts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(brokerAccounts.userId, parseInt(userId)),
          eq(brokerAccounts.brokerType, brokerType)
        )
      );
  }
}

export class InMemoryTokenStore implements TokenStore {
  private tokens = new Map<string, { token: string; expiresAt?: number }>();

  async saveToken(userId: string, brokerType: string, token: string, expiresIn?: number): Promise<void> {
    const key = {userId}:{brokerType};
    const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : undefined;
    this.tokens.set(key, { token, expiresAt });
  }

  async getToken(userId: string, brokerType: string): Promise<string | null> {
    const key = {userId}:{brokerType};
    const data = this.tokens.get(key);
    if (!data) return null;
    if (data.expiresAt && Date.now() > data.expiresAt) {
      this.tokens.delete(key);
      return null;
    }
    return data.token;
  }

  async refreshToken(userId: string, brokerType: string): Promise<string> {
    throw new Error('Token refresh not supported in memory store');
  }

  async revokeToken(userId: string, brokerType: string): Promise<void> {
    const key = {userId}:{brokerType};
    this.tokens.delete(key);
  }
}
