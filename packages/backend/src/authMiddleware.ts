import jwt from 'jsonwebtoken';
import type { Express, Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  brokerType?: string;
}

export const verifyJWT = (token: string): { userId: string } => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    return decoded;
  } catch (error) {
    throw new Error('Invalid JWT token');
  }
};

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    const { userId } = verifyJWT(token);
    req.userId = userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const generateJWT = (userId: string, expiresIn: jwt.SignOptions['expiresIn'] = '24h'): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn });
};

// tRPC middleware wrapper
export const createAuthMiddleware = () => {
  return async (opts: any) => {
    const token = opts.ctx.req?.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new Error('Unauthorized: Missing token');
    }

    try {
      const { userId } = verifyJWT(token);
      return opts.next({
        ctx: {
          ...opts.ctx,
          userId,
          isAuthenticated: true,
        },
      });
    } catch (error) {
      throw new Error('Unauthorized: Invalid token');
    }
  };
};
