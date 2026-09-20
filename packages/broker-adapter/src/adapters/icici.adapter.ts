import { BrokerAdapter, BrokerConfig } from '../index';
import { Order, Position, Quote } from '@trading-os/types';
import axios from 'axios';

export interface IciciConfig extends BrokerConfig {
  // TODO: not populated post-login (trpc.ts only has accessToken+apiKey at
  // call time) - customerId/password are required for ICICI's real
  // form-login flow but broker account metadata isn't persisted anywhere
  // retrievable yet, so post-login calls can't re-authenticate from scratch.
  customerId?: string;
  apiKey: string;
  password?: string;
  accessToken?: string;
}

export class IciciDirectAdapter extends BrokerAdapter<IciciConfig> {
  private baseUrl = 'https://api.icicidirect.com';
  private client = axios.create();

  constructor(config: IciciConfig) {
    super(config);
  }

  async authenticate(): Promise<boolean> {
    try {
      const response = await this.client.post(`${this.baseUrl}/customer/login`, {
        customerId: this.config.customerId,
        password: this.config.password,
      });

      if (response.data.status === 'success') {
        this.config.accessToken = response.data.sessionId;
        return true;
      }
      return false;
    } catch (error) {
      console.error('ICICI Direct auth failed:', error);
      return false;
    }
  }

  async placeOrder(order: Order): Promise<string> {
    try {
      const response = await this.client.post(
        `${this.baseUrl}/trading/order`,
        {
          transactionType: order.side === 'BUY' ? 'B' : 'S',
          exchangeCode: this.getExchange(order.symbol),
          scriptCode: order.symbol,
          quantity: order.qty,
          price: order.price,
          priceType: 'L', // Limit order
          product: 'DAY', // Day trading
          remarks: 'Trading Platform Order',
        },
        {
          headers: {
            'sessionID': this.config.accessToken,
            'Accept': 'application/json',
          },
        }
      );

      if (response.data.status === 'success') {
        return response.data.orderId;
      }
      throw new Error(`Order placement failed: ${response.data.message}`);
    } catch (error) {
      console.error('Order placement failed:', error);
      throw error;
    }
  }

  async getPositions(): Promise<Position[]> {
    try {
      const response = await this.client.get(`${this.baseUrl}/trading/positions`, {
        headers: {
          'sessionID': this.config.accessToken,
        },
      });

      if (response.data.status === 'success') {
        return response.data.positions.map((pos: any) => ({
          id: pos.positionId,
          brokerId: 'icici',
          symbol: pos.scriptName,
          qty: pos.netQuantity,
          entryPrice: pos.buyPrice || pos.sellPrice,
          currentPrice: pos.lastPrice,
          pnl: pos.dayGain,
          pnlPercent: (pos.dayGain / (pos.buyPrice * pos.netQuantity)) * 100,
        }));
      }
      return [];
    } catch (error) {
      console.error('Position fetch failed:', error);
      return [];
    }
  }

  async streamQuotes(symbols: string[]): Promise<void> {
    // ICICI Direct uses REST polling for quotes
    // Alternatively, can use WebSocket if available
    console.log(`Polling quotes for: ${symbols.join(', ')}`);

    // Poll every 5 seconds (rate limit friendly)
    setInterval(async () => {
      for (const symbol of symbols) {
        try {
          const response = await this.client.get(
            `${this.baseUrl}/market/quote/${symbol}`,
            {
              headers: {
                'sessionID': this.config.accessToken,
              },
            }
          );
          console.log(`Quote: ${symbol} - ${response.data.ltp}`);
        } catch (error) {
          console.error(`Failed to fetch quote for ${symbol}:`, error);
        }
      }
    }, 5000);
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const response = await this.client.post(
        `${this.baseUrl}/trading/order/${orderId}/cancel`,
        {},
        {
          headers: {
            'sessionID': this.config.accessToken,
          },
        }
      );

      return response.data.status === 'success';
    } catch (error) {
      console.error('Order cancellation failed:', error);
      return false;
    }
  }

  private getExchange(symbol: string): string {
    if (symbol.includes('-FUT') || symbol.includes('-OPT')) return 'NFO';
    if (symbol.includes('-BSE')) return 'BSE';
    return 'NSE';
  }
}