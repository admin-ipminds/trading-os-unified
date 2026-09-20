import { BrokerAdapter, BrokerConfig } from '../index';
import { Order, Position, Quote } from '@trading-os/types';
import axios from 'axios';
import WebSocket from 'ws';

export interface DhanConfig extends BrokerConfig {
  // TODO: not populated post-login (trpc.ts only has accessToken+apiKey at
  // call time) - clientId is required by Dhan's real OAuth flow but broker
  // account metadata isn't persisted anywhere retrievable yet.
  clientId?: string;
  apiKey: string;
  accessToken?: string;
}

export class DhanBrokerAdapter extends BrokerAdapter<DhanConfig> {
  private baseUrl = 'https://api.dhan.co';
  private wsUrl = 'wss://api.dhan.co/stream';
  private client = axios.create();
  private ws?: WebSocket;

  constructor(config: DhanConfig) {
    super(config);
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.config.accessToken) {
        // OAuth redirect
        const loginUrl = `https://app.dhan.co/login?client_id=${this.config.clientId}`;
        console.log(`Redirect to: ${loginUrl}`);
        return false;
      }

      // Verify access token
      const response = await this.client.get(`${this.baseUrl}/user/profile`, {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'X-API-Key': this.config.apiKey,
        },
      });

      return response.status === 200;
    } catch (error) {
      console.error('Dhan auth failed:', error);
      return false;
    }
  }

  async placeOrder(order: Order): Promise<string> {
    try {
      const response = await this.client.post(
        `${this.baseUrl}/orders/place`,
        {
          dhanClientId: this.config.clientId,
          transactionType: order.side === 'BUY' ? 'BUY' : 'SELL',
          exchangeTokens: this.getExchangeToken(order.symbol),
          orderType: 'LIMIT',
          legQuantity: order.qty,
          price: order.price,
          productType: 'INTRA',
          orderValidity: 'DAY',
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.accessToken}`,
            'X-API-Key': this.config.apiKey,
          },
        }
      );

      return response.data.data.orderId;
    } catch (error) {
      console.error('Order placement failed:', error);
      throw error;
    }
  }

  async getPositions(): Promise<Position[]> {
    try {
      const response = await this.client.get(`${this.baseUrl}/positions`, {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'X-API-Key': this.config.apiKey,
        },
      });

      return response.data.data.positions.map((pos: any) => ({
        id: pos.exchangeTokens,
        brokerId: 'dhan',
        symbol: pos.tradingSymbol,
        qty: pos.netQty,
        entryPrice: pos.avgPrice,
        currentPrice: pos.ltp,
        pnl: pos.unrealisedPnL,
        pnlPercent: (pos.unrealisedPnL / (pos.avgPrice * pos.netQty)) * 100,
      }));
    } catch (error) {
      console.error('Position fetch failed:', error);
      return [];
    }
  }

  async streamQuotes(symbols: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.on('open', () => {
          const subscribe = {
            RequestCode: 'SUBSCRIBE',
            Mode: 'LTP',
            ExchangeTokens: symbols.map((s) => this.getExchangeToken(s)),
          };
          this.ws!.send(JSON.stringify(subscribe));
          resolve();
        });

        this.ws.on('message', (data: string) => {
          const quote = JSON.parse(data);
          console.log(`Quote update: ${quote.TradingSymbol} - ${quote.LTP}`);
        });

        this.ws.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      await this.client.post(
        `${this.baseUrl}/orders/cancel/${orderId}`,
        { dhanClientId: this.config.clientId },
        {
          headers: {
            Authorization: `Bearer ${this.config.accessToken}`,
            'X-API-Key': this.config.apiKey,
          },
        }
      );
      return true;
    } catch (error) {
      console.error('Order cancellation failed:', error);
      return false;
    }
  }

  private getExchangeToken(symbol: string): string {
    // Map trading symbol to Dhan exchange token
    // In real implementation, this would look up from a master list
    if (symbol.includes('-FUT')) return `NFO_${symbol}`;
    if (symbol.includes('-OPT')) return `NFO_${symbol}`;
    return `NSE_${symbol}`;
  }
}