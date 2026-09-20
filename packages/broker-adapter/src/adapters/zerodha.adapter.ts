import { BrokerAdapter, BrokerConfig } from '../index';
import { Order, Position, Quote } from '@trading-os/types';
import axios from 'axios';

export interface ZerodhaConfig extends BrokerConfig {
  apiKey: string;
  apiSecret?: string;
  // TODO: not populated post-login (trpc.ts only has accessToken+apiKey at
  // call time) - clientId is required by Zerodha's real OAuth flow but
  // broker account metadata isn't persisted anywhere retrievable yet.
  clientId?: string;
  accessToken?: string;
}

export class ZerodhaBrokerAdapter extends BrokerAdapter<ZerodhaConfig> {
  private baseUrl = 'https://api.kite.trade';
  private client = axios.create();

  constructor(config: ZerodhaConfig) {
    super(config);
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.config.accessToken) {
        // OAuth flow: redirect to Zerodha login
        const loginUrl = `https://kite.zerodha.com/connect/login?api_key=${this.config.apiKey}`;
        console.log(`Redirect to: ${loginUrl}`);
        return false; // Waiting for OAuth callback
      }

      // Verify token validity
      const response = await this.client.get(`${this.baseUrl}/profile`, {
        headers: this.getHeaders(),
      });

      return response.status === 200;
    } catch (error) {
      console.error('Zerodha auth failed:', error);
      return false;
    }
  }

  async placeOrder(order: Order): Promise<string> {
    try {
      const response = await this.client.post(
        `${this.baseUrl}/orders/regular`,
        {
          variety: 'regular',
          exchange: this.getExchange(order.symbol),
          tradingsymbol: order.symbol,
          transaction_type: order.side,
          order_type: 'MIS', // Margin Intraday Square-off
          price: order.price,
          quantity: order.qty,
          product: 'MIS',
          validity: 'DAY',
        },
        { headers: this.getHeaders() }
      );

      return response.data.data.order_id;
    } catch (error) {
      console.error('Order placement failed:', error);
      throw error;
    }
  }

  async getPositions(): Promise<Position[]> {
    try {
      const response = await this.client.get(`${this.baseUrl}/portfolio/positions`, {
        headers: this.getHeaders(),
      });

      return response.data.data.net.map((pos: any) => ({
        id: pos.instrument_token,
        brokerId: 'zerodha',
        symbol: pos.tradingsymbol,
        qty: pos.quantity,
        entryPrice: pos.average_price,
        currentPrice: pos.last_price,
        pnl: pos.pnl,
        pnlPercent: (pos.pnl / (pos.average_price * pos.quantity)) * 100,
      }));
    } catch (error) {
      console.error('Position fetch failed:', error);
      return [];
    }
  }

  async streamQuotes(symbols: string[]): Promise<void> {
    // Zerodha WebSocket streaming implementation
    // Uses kiteconnect library for real-time quotes
    console.log(`Streaming quotes for: ${symbols.join(', ')}`);
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      await this.client.delete(`${this.baseUrl}/orders/regular/${orderId}`, {
        headers: this.getHeaders(),
      });
      return true;
    } catch (error) {
      console.error('Order cancellation failed:', error);
      return false;
    }
  }

  private getHeaders() {
    return {
      'Authorization': `token ${this.config.apiKey}:${this.config.accessToken}`,
      'X-Kite-Version': '3',
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }

  private getExchange(symbol: string): string {
    if (symbol.includes('-FUT') || symbol.includes('-OPT')) return 'NFO';
    return 'NSE';
  }
}