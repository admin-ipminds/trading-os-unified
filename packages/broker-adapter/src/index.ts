import { Order, Quote, Position } from '@trading-os/types';

export interface BrokerConfig {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  baseUrl?: string;
}

export abstract class BrokerAdapter<TConfig extends BrokerConfig = BrokerConfig> {
  protected config: TConfig;

  constructor(config: TConfig) {
    this.config = config;
  }

  abstract authenticate(): Promise<boolean>;
  abstract placeOrder(order: Order): Promise<string>;
  abstract getPositions(): Promise<Position[]>;
  abstract streamQuotes(symbols: string[]): Promise<void>;
  abstract cancelOrder(orderId: string): Promise<boolean>;
}

// Import implementations
import { ZerodhaBrokerAdapter, ZerodhaConfig } from './adapters/zerodha.adapter';
import { DhanBrokerAdapter, DhanConfig } from './adapters/dhan.adapter';
import { IciciDirectAdapter, IciciConfig } from './adapters/icici.adapter';

export type AnyBrokerConfig = ZerodhaConfig | DhanConfig | IciciConfig;

export class BrokerAdapterFactory {
  static create(type: string, config: AnyBrokerConfig): BrokerAdapter {
    switch (type.toLowerCase()) {
      case 'zerodha':
        return new ZerodhaBrokerAdapter(config as ZerodhaConfig);
      case 'dhan':
        return new DhanBrokerAdapter(config as DhanConfig);
      case 'icici':
      case 'icici-direct':
        return new IciciDirectAdapter(config as IciciConfig);
      default:
        throw new Error(`Unknown broker type: ${type}`);
    }
  }
}

export { ZerodhaBrokerAdapter, DhanBrokerAdapter, IciciDirectAdapter };
export type { ZerodhaConfig, DhanConfig, IciciConfig };