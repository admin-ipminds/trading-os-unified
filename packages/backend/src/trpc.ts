import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { BrokerAdapterFactory } from '@trading-os/broker-adapter';
import { InMemoryTokenStore } from './oauth';

const t = initTRPC.create();
const tokenStore = new InMemoryTokenStore();

/**
 * tRPC Procedures
 */

// Health check
export const appRouter = t.router({
  health: t.procedure.query(() => ({
    status: 'ok',
    timestamp: new Date(),
  })),

  /**
   * Orders Router
   */
  orders: t.router({
    /**
     * Place an order
     * POST /trpc/orders.place
     */
    place: t.procedure
      .input(
        z.object({
          brokerType: z.enum(['zerodha', 'dhan', 'icici']),
          symbol: z.string(),
          qty: z.number().int().min(1),
          price: z.number().min(0.01),
          side: z.enum(['BUY', 'SELL']),
        })
      )
      .mutation(async ({ input }) => {
        const userId = 1; // Would be from auth context
        const token = await tokenStore.getToken(userId, input.brokerType);

        if (!token) {
          throw new Error(`Not connected to ${input.brokerType}`);
        }

        // Get broker adapter
        const broker = BrokerAdapterFactory.create(input.brokerType, {
          accessToken: token,
          apiKey: process.env[`${input.brokerType.toUpperCase()}_API_KEY`],
        });

        // Authenticate with broker
        const isAuthenticated = await broker.authenticate();
        if (!isAuthenticated) {
          throw new Error(`Failed to authenticate with ${input.brokerType}`);
        }

        // Place order
        const orderId = await broker.placeOrder({
          id: `${input.brokerType}-${Date.now()}`,
          brokerId: '',
          symbol: input.symbol,
          qty: input.qty,
          price: input.price,
          side: input.side,
          status: 'PENDING',
          createdAt: new Date(),
        });

        return {
          success: true,
          orderId,
          message: `Order placed: ${input.side} ${input.qty} ${input.symbol} @ ₹${input.price}`,
        };
      }),

    /**
     * Cancel an order
     */
    cancel: t.procedure
      .input(
        z.object({
          brokerType: z.enum(['zerodha', 'dhan', 'icici']),
          orderId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const userId = 1;
        const token = await tokenStore.getToken(userId, input.brokerType);

        if (!token) {
          throw new Error(`Not connected to ${input.brokerType}`);
        }

        const broker = BrokerAdapterFactory.create(input.brokerType, {
          accessToken: token,
        });

        const cancelled = await broker.cancelOrder(input.orderId);

        return {
          success: cancelled,
          message: cancelled ? 'Order cancelled' : 'Failed to cancel order',
        };
      }),

    /**
     * Get order history (stub)
     */
    history: t.procedure.query(() => ({
      orders: [],
      total: 0,
    })),
  }),

  /**
   * Portfolio Router
   */
  portfolio: t.router({
    /**
     * Get positions from broker
     */
    positions: t.procedure
      .input(z.object({ brokerType: z.enum(['zerodha', 'dhan', 'icici']) }))
      .query(async ({ input }) => {
        const userId = 1;
        const token = await tokenStore.getToken(userId, input.brokerType);

        if (!token) {
          return { positions: [], brokerType: input.brokerType };
        }

        const broker = BrokerAdapterFactory.create(input.brokerType, {
          accessToken: token,
        });

        const isAuthenticated = await broker.authenticate();
        if (!isAuthenticated) {
          return { positions: [], brokerType: input.brokerType };
        }

        const positions = await broker.getPositions();

        return {
          positions,
          brokerType: input.brokerType,
          totalQty: positions.reduce((sum, p) => sum + p.qty, 0),
          totalPnL: positions.reduce((sum, p) => sum + p.pnl, 0),
        };
      }),

    /**
     * Get portfolio metrics
     */
    metrics: t.procedure.query(() => ({
      totalValue: 1000000,
      totalPnL: 25000,
      totalPnLPercent: 2.5,
      dayPnL: 5000,
      dayPnLPercent: 0.5,
      marginUsed: 250000,
      buyingPower: 750000,
      leverage: 2.0,
      positionCount: 8,
    })),

    /**
     * Get order history from DB
     */
    orders: t.procedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ input }) => {
        // Would query database
        return { orders: [], total: 0 };
      }),
  }),

  /**
   * Quotes Router
   */
  quotes: t.router({
    /**
     * Get live quote for a symbol
     */
    get: t.procedure
      .input(z.object({ symbol: z.string(), brokerType: z.enum(['zerodha', 'dhan', 'icici']) }))
      .query(async ({ input }) => {
        // Would call broker or cache
        return {
          symbol: input.symbol,
          ltp: 1234.5,
          bid: 1234.25,
          ask: 1234.75,
          volume: 1000000,
          timestamp: new Date(),
        };
      }),

    /**
     * Subscribe to quote stream (WebSocket)
     */
    stream: t.procedure
      .input(z.object({ symbols: z.array(z.string()), brokerType: z.enum(['zerodha', 'dhan', 'icici']) }))
      .query(async ({ input }) => {
        return {
          symbols: input.symbols,
          message: 'WebSocket stream starting...',
        };
      }),
  }),

  /**
   * Broker Status Router
   */
  brokers: t.router({
    /**
     * Get connection status for all brokers
     */
    status: t.procedure.query(async () => {
      const userId = 1;
      const zerodhaToken = await tokenStore.getToken(userId, 'zerodha');
      const dhanToken = await tokenStore.getToken(userId, 'dhan');
      const iciciToken = await tokenStore.getToken(userId, 'icici');

      return {
        zerodha: { connected: !!zerodhaToken, type: 'zerodha' },
        dhan: { connected: !!dhanToken, type: 'dhan' },
        icici: { connected: !!iciciToken, type: 'icici' },
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
