// Shared types for trading platform

export interface Broker {
  id: string;
  name: string;
  enabled: boolean;
}

export interface Position {
  id: string;
  brokerId: string;
  symbol: string;
  qty: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface Order {
  id: string;
  brokerId: string;
  symbol: string;
  qty: number;
  price: number;
  side: 'BUY' | 'SELL';
  status: 'PENDING' | 'FILLED' | 'REJECTED' | 'CANCELLED';
  createdAt: Date;
  filledAt?: Date;
}

export interface Quote {
  symbol: string;
  ltp: number;
  bid: number;
  ask: number;
  volume: number;
  timestamp: Date;
}
