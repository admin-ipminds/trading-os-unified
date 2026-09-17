import { Order, Quote, Position } from '@trading-os/types';

export interface BrokerConfig {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  baseUrl?: string;
}

export abstract class BrokerAdapter {
  protected config: BrokerConfig;

  constructor(config: BrokerConfig) {
    this.config = config;
  }

  abstract authenticate(): Promise<boolean>;
  abstract placeOrder(order: Order): Promise<string>;
  abstract getPositions(): Promise<Position[]>;
  abstract streamQuotes(symbols: string[]): Promise<void>;
  abstract cancelOrder(orderId: string): Promise<boolean>;
}

// Import implementations
import { ZerodhaBrokerAdapter } from './adapters/zerodha.adapter';
import { DhanBrokerAdapter } from './adapters/dhan.adapter';
import { IciciDirectAdapter } from './adapters/icici.adapter';

export class BrokerAdapterFactory {
  static create(type: string, config: BrokerConfig): BrokerAdapter {
    switch (type.toLowerCase()) {
      case 'zerodha':
        return new ZerodhaBrokerAdapter(config);
      case 'dhan':
        return new DhanBrokerAdapter(config);
      case 'icici':
      case 'icici-direct':
        return new IciciDirectAdapter(config);
      default:
        throw new Error(`Unknown broker type: ${type}`);
    }
  }
}

export { ZerodhaBrokerAdapter, DhanBrokerAdapter, IciciDirectAdapter };
