import express, { type Express } from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import authRoutes from './authRoutes';
import { appRouter } from './trpc';

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 tRPC endpoint: http://localhost:${PORT}/trpc`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/auth`);
});

export default app;
