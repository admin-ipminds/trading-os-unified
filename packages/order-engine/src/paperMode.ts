import { Order, Position } from '@trading-os/types';

/**
 * Paper Trading Engine
 * Simulates order fills with realistic slippage and partial fills
 */
export class PaperModeExecutor {
  private fills: Map<string, Order> = new Map();
  private positions: Map<string, Position> = new Map();

  async executeOrder(order: Order): Promise<Order> {
    // Simulate slippage (0.1-0.5% depending on volume)
    const slippagePct = Math.random() * 0.004 + 0.001;
    const slippedPrice = order.side === 'BUY'
      ? order.price * (1 + slippagePct)
      : order.price * (1 - slippagePct);

    // Simulate partial fill probability (90% full fill, 10% partial)
    const fillPct = Math.random() > 0.1 ? 1.0 : Math.random() * 0.8 + 0.2;
    const filledQty = Math.floor(order.qty * fillPct);

    const filledOrder: Order = {
      ...order,
      price: slippedPrice,
      qty: filledQty,
      status: filledQty === order.qty ? 'FILLED' : 'REJECTED',
      filledAt: new Date(),
    };

    this.fills.set(order.id, filledOrder);
    return filledOrder;
  }

  updatePosition(symbol: string, order: Order): void {
    const existing = this.positions.get(symbol);
    if (!existing) {
      this.positions.set(symbol, {
        id: symbol,
        brokerId: 'paper',
        symbol,
        qty: order.side === 'BUY' ? order.qty : -order.qty,
        entryPrice: order.price,
        currentPrice: order.price,
        pnl: 0,
        pnlPercent: 0,
      });
    } else {
      if (order.side === 'BUY') {
        existing.qty += order.qty;
      } else {
        existing.qty -= order.qty;
      }
    }
  }

  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getPosition(symbol: string): Position | undefined {
    return this.positions.get(symbol);
  }
}
