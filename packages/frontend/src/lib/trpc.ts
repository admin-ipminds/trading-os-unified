import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

/**
 * Minimal local mirror of the backend's tRPC router shape.
 * Deliberately NOT imported from @trading-os/backend: that package's
 * types pull in @trading-os/broker-adapter's compiled output, which
 * isn't built when Vercel/Railway build only the frontend workspace.
 * Keep this in sync with packages/backend/src/trpc.ts by hand.
 */
type BrokerType = 'zerodha' | 'dhan' | 'icici';

interface PortfolioMetrics {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayPnL: number;
  dayPnLPercent: number;
  marginUsed: number;
  buyingPower: number;
  leverage: number;
  positionCount: number;
}

interface Position {
  symbol: string;
  qty: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
}

interface AppRouterShape {
  health: {
    query: (input?: void) => Promise<{ status: string; timestamp: Date }>;
  };
  orders: {
    place: {
      mutate: (input: {
        brokerType: BrokerType;
        symbol: string;
        qty: number;
        price: number;
        side: 'BUY' | 'SELL';
      }) => Promise<{ success: boolean; orderId: string; message: string }>;
    };
    cancel: {
      mutate: (input: { brokerType: BrokerType; orderId: string }) => Promise<{ success: boolean; message: string }>;
    };
    history: {
      query: (input?: void) => Promise<{ orders: unknown[]; total: number }>;
    };
  };
  portfolio: {
    positions: {
      query: (input: { brokerType: BrokerType }) => Promise<{
        positions: Position[];
        brokerType: BrokerType;
        totalQty?: number;
        totalPnL?: number;
      }>;
    };
    metrics: {
      query: (input?: void) => Promise<PortfolioMetrics>;
    };
    orders: {
      query: (input: { limit?: number }) => Promise<{ orders: unknown[]; total: number }>;
    };
  };
  quotes: {
    get: {
      query: (input: { symbol: string; brokerType: BrokerType }) => Promise<{
        symbol: string;
        ltp: number;
        bid: number;
        ask: number;
        volume: number;
        timestamp: Date;
      }>;
    };
  };
  brokers: {
    status: {
      query: (input?: void) => Promise<{
        zerodha: { connected: boolean; type: string };
        dhan: { connected: boolean; type: string };
        icici: { connected: boolean; type: string };
      }>;
    };
  };
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const trpc: AppRouterShape = createTRPCProxyClient<any>({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
    }),
  ],
}) as unknown as AppRouterShape;