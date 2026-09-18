import express, { Router, Request, Response } from 'express';
import axios from 'axios';
import { OAuthManager, InMemoryTokenStore } from './oauth';

const router: Router = Router();
const oauthManager = new OAuthManager();
const tokenStore = new InMemoryTokenStore();

// Middleware: Verify JWT token (stub for now)
const authenticateUser = (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // In production: verify JWT and attach user to req
  req.user = { id: 1 }; // Hardcoded for dev
  next();
};

/**
 * GET /auth/zerodha/login
 * Redirect user to Zerodha OAuth
 */
router.get('/zerodha/login', (req: Request, res: Response) => {
  const userId = req.user?.id || 1;
  const apiKey = process.env.ZERODHA_API_KEY || '';
  const redirectUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/zerodha/callback`;

  const loginUrl = oauthManager.getZerodhaLoginUrl(apiKey, redirectUrl, userId);
  res.json({ redirectUrl: loginUrl });
});

/**
 * GET /auth/zerodha/callback?request_token=...
 * Zerodha redirects here after user authorizes
 */
router.get('/zerodha/callback', async (req: Request, res: Response) => {
  const { request_token } = req.query;
  const userId = req.user?.id || 1;

  if (!request_token) {
    return res.status(400).json({ error: 'Missing request_token' });
  }

  try {
    // Exchange request_token for access_token
    const response = await axios.post(
      'https://api.kite.trade/session/token',
      {
        api_key: process.env.ZERODHA_API_KEY,
        request_token,
        checksum: '', // Would compute HMAC in production
      }
    );

    const accessToken = response.data.data.access_token;

    // Store token in database
    await tokenStore.saveToken(userId, 'zerodha', accessToken, undefined, 86400);

    // Redirect to frontend success page
    res.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?broker=zerodha&status=connected`);
  } catch (error) {
    console.error('Zerodha OAuth callback error:', error);
    res.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/connect?error=zerodha_failed`);
  }
});

/**
 * GET /auth/dhan/login
 */
router.get('/dhan/login', (req: Request, res: Response) => {
  const userId = req.user?.id || 1;
  const clientId = process.env.DHAN_CLIENT_ID || '';
  const redirectUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/dhan/callback`;

  const loginUrl = oauthManager.getDhanLoginUrl(clientId, redirectUrl, userId);
  res.json({ redirectUrl: loginUrl });
});

/**
 * GET /auth/dhan/callback?code=...&state=...
 */
router.get('/dhan/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing code or state' });
  }

  const oauthState = oauthManager.verifyState(state as string);
  if (!oauthState) {
    return res.status(400).json({ error: 'Invalid or expired state' });
  }

  try {
    // Exchange code for access_token
    const response = await axios.post('https://api.dhan.co/oauth/token', {
      grant_type: 'authorization_code',
      code,
      client_id: process.env.DHAN_CLIENT_ID,
      client_secret: process.env.DHAN_CLIENT_SECRET,
      redirect_uri: `${process.env.NEXT_PUBLIC_API_URL}/auth/dhan/callback`,
    });

    const accessToken = response.data.access_token;
    const expiresIn = response.data.expires_in || 3600;

    // Store token
    await tokenStore.saveToken(oauthState.userId, 'dhan', accessToken, undefined, expiresIn);

    res.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?broker=dhan&status=connected`);
  } catch (error) {
    console.error('Dhan OAuth callback error:', error);
    res.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/connect?error=dhan_failed`);
  }
});

/**
 * POST /auth/icici/login
 * ICICI uses form-based login (not OAuth)
 */
router.post('/icici/login', async (req: Request, res: Response) => {
  const { customerId, password } = req.body;
  const userId = req.user?.id || 1;

  if (!customerId || !password) {
    return res.status(400).json({ error: 'Missing customerId or password' });
  }

  try {
    // Exchange credentials for sessionId
    const response = await axios.post('https://api.icicidirect.com/customer/login', {
      customerId,
      password,
    });

    if (response.data.status !== 'success') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const sessionId = response.data.sessionId;

    // Store session token
    await tokenStore.saveToken(userId, 'icici', sessionId, undefined, 28800); // 8 hours

    res.json({
      success: true,
      message: 'ICICI Direct connected',
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?broker=icici&status=connected`,
    });
  } catch (error) {
    console.error('ICICI login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /auth/status
 * Check which brokers user is connected to
 */
router.get('/status', authenticateUser, async (req: Request, res: Response) => {
  const userId = req.user?.id || 1;

  const zerodhaToken = await tokenStore.getToken(userId, 'zerodha');
  const dhanToken = await tokenStore.getToken(userId, 'dhan');
  const iciciToken = await tokenStore.getToken(userId, 'icici');

  res.json({
    zerodha: !!zerodhaToken,
    dhan: !!dhanToken,
    icici: !!iciciToken,
  });
});

/**
 * POST /auth/disconnect
 * Revoke broker connection
 */
router.post('/disconnect', authenticateUser, async (req: Request, res: Response) => {
  const { brokerType } = req.body;
  const userId = req.user?.id || 1;

  if (!['zerodha', 'dhan', 'icici'].includes(brokerType)) {
    return res.status(400).json({ error: 'Invalid brokerType' });
  }

  await tokenStore.revokeToken(userId, brokerType);
  res.json({ success: true });
});

export default router;
