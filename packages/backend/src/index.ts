import express, { type Express } from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import authRoutes from './authRoutes';
import { appRouter } from './trpc';

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for frontend(s) - allow the deployed Vercel frontend, Railway frontend, and local dev
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  [
    'https://trading-os-unified.vercel.app',
    'https://trading-osfrontend-production.up.railway.app',
    'http://localhost:3000',
  ].join(',')
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // no origin header (server-to-server, curl, health checks) - no CORS header needed
  } else {
    res.header('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
  }
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Vary', 'Origin');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Auth routes (OAuth callbacks, login, status)
app.use('/auth', authRoutes);

// tRPC routes
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
  })
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`tRPC endpoint: http://localhost:${PORT}/trpc`);
  console.log(`Auth routes: http://localhost:${PORT}/auth`);
});

export default app;