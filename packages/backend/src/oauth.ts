import { randomBytes } from 'crypto';

export interface OAuthState {
  state: string;
  brokerType: string;
  userId: number;
  timestamp: number;
  expiresAt: number;
}

export class OAuthManager {
  private stateStore: Map<string, OAuthState> = new Map();
  private readonly STATE_EXPIRY = 10 * 60 * 1000; // 10 minutes

  generateState(brokerType: string, userId: number): string {
    const state = randomBytes(32).toString('hex');
    this.stateStore.set(state, {
      state,
      brokerType,
      userId,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.STATE_EXPIRY,
    });
    return state;
  }

  verifyState(state: string): OAuthState | null {
    const oauthState = this.stateStore.get(state);
    if (!oauthState || oauthState.expiresAt < Date.now()) {
      return null;
    }
    this.stateStore.delete(state); // One-time use
    return oauthState;
  }

  /**
   * Zerodha OAuth Flow:
   * 1. User clicks "Connect Zerodha"
   * 2. Redirect to Zerodha login: https://kite.zerodha.com/connect/login?api_key=...&redirect_url=...
   * 3. User logs in and authorizes
   * 4. Zerodha redirects to our callback with auth_code
   * 5. We exchange auth_code for access_token
   */
  getZerodhaLoginUrl(apiKey: string, redirectUrl: string, userId: number): string {
    const state = this.generateState('zerodha', userId);
    const params = new URLSearchParams({
      api_key: apiKey,
      redirect_url: redirectUrl,
      v: '3',
    });
    return `https://kite.zerodha.com/connect/login?${params.toString()}`;
  }

  /**
   * Dhan OAuth Flow:
   * 1. User clicks "Connect Dhan"
   * 2. Redirect to Dhan login
   * 3. User logs in and authorizes
   * 4. Dhan redirects to our callback with auth_code
   * 5. We exchange auth_code for access_token
   */
  getDhanLoginUrl(clientId: string, redirectUrl: string, userId: number): string {
    const state = this.generateState('dhan', userId);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUrl,
      response_type: 'code',
      state,
    });
    return `https://api.dhan.co/oauth/authorize?${params.toString()}`;
  }

  /**
   * ICICI Direct:
   * Uses session-based auth (not OAuth)
   * Customer logs in with customer_id + password
   * We get sessionId back
   */
  getIciciLoginPayload(customerId: string): object {
    return {
      customerId,
      // password will be submitted via form (not in code)
    };
  }
}

/**
 * Token Storage Interface
 * Implements in database or cache (Redis)
 */
export interface TokenStore {
  saveToken(
    userId: number,
    brokerType: string,
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number
  ): Promise<void>;

  getToken(userId: number, brokerType: string): Promise<string | null>;

  refreshToken(userId: number, brokerType: string): Promise<string | null>;

  revokeToken(userId: number, brokerType: string): Promise<void>;
}

/**
 * In-memory token store (for dev only)
 * In production: use PostgreSQL or Redis
 */
export class InMemoryTokenStore implements TokenStore {
  private tokens: Map<string, { token: string; expiresAt: number }> = new Map();

  async saveToken(
    userId: number,
    brokerType: string,
    accessToken: string,
    refreshToken?: string,
    expiresIn: number = 3600
  ): Promise<void> {
    const key = `${userId}:${brokerType}`;
    this.tokens.set(key, {
      token: accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
    });
  }

  async getToken(userId: number, brokerType: string): Promise<string | null> {
    const key = `${userId}:${brokerType}`;
    const tokenData = this.tokens.get(key);

    if (!tokenData || tokenData.expiresAt < Date.now()) {
      return null;
    }

    return tokenData.token;
  }

  async refreshToken(userId: number, brokerType: string): Promise<string | null> {
    // Would call broker's refresh endpoint
    return null;
  }

  async revokeToken(userId: number, brokerType: string): Promise<void> {
    const key = `${userId}:${brokerType}`;
    this.tokens.delete(key);
  }
}
