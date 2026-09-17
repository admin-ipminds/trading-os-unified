import { Position, Order } from '@trading-os/types';

export interface RiskLimits {
  maxLeverageMultiplier: number;
  maxSinglePositionSize: number; // % of portfolio
  maxDailyLoss: number; // ₹
  maxMarginUsage: number; // % of available margin
  maxOrderSize: number; // Qty
}

export class RiskEngine {
  private limits: RiskLimits;
  private availableMargin: number;
  private dailyLoss: number = 0;
  private positions: Map<string, Position> = new Map();

  constructor(
    initialMargin: number = 100000,
    limits: Partial<RiskLimits> = {}
  ) {
    this.availableMargin = initialMargin;
    this.limits = {
      maxLeverageMultiplier: limits.maxLeverageMultiplier || 2,
      maxSinglePositionSize: limits.maxSinglePositionSize || 0.25, // 25%
      maxDailyLoss: limits.maxDailyLoss || 10000, // ₹10k
      maxMarginUsage: limits.maxMarginUsage || 0.8, // 80%
      maxOrderSize: limits.maxOrderSize || 1000,
    };
  }

  canPlaceOrder(order: Order, currentPrice: number): { allowed: boolean; reason?: string } {
    // Check 1: Order size
    if (order.qty > this.limits.maxOrderSize) {
      return { allowed: false, reason: `Order qty ${order.qty} exceeds limit ${this.limits.maxOrderSize}` };
    }

    // Check 2: Margin availability
    const marginRequired = (order.price * order.qty) / this.limits.maxLeverageMultiplier;
    if (marginRequired > this.availableMargin) {
      return { allowed: false, reason: `Insufficient margin: need ₹${marginRequired}, have ₹${this.availableMargin}` };
    }

    // Check 3: Daily loss limit
    if (this.dailyLoss + (order.price * order.qty * 0.05) > this.limits.maxDailyLoss) {
      return { allowed: false, reason: `Daily loss limit ₹${this.limits.maxDailyLoss} would be exceeded` };
    }

    // Check 4: Single position size
    const portfolioValue = Array.from(this.positions.values()).reduce(
      (sum, pos) => sum + (pos.currentPrice * pos.qty),
      this.availableMargin
    );
    const positionValue = order.price * order.qty;
    if (positionValue > portfolioValue * this.limits.maxSinglePositionSize) {
      return { allowed: false, reason: `Position size exceeds ${this.limits.maxSinglePositionSize * 100}% limit` };
    }

    return { allowed: true };
  }

  updateAfterFill(order: Order, position: Position): void {
    const orderMargin = (order.price * order.qty) / this.limits.maxLeverageMultiplier;
    this.availableMargin -= orderMargin;
    this.positions.set(order.symbol, position);
  }

  recordPnL(pnl: number): void {
    if (pnl < 0) {
      this.dailyLoss += Math.abs(pnl);
    }
  }

  getPortfolioMetrics() {
    const totalExposure = Array.from(this.positions.values()).reduce(
      (sum, pos) => sum + (pos.currentPrice * pos.qty),
      0
    );
    const totalPnL = Array.from(this.positions.values()).reduce(
      (sum, pos) => sum + pos.pnl,
      0
    );

    return {
      availableMargin: this.availableMargin,
      usedMargin: 100000 - this.availableMargin,
      totalExposure,
      totalPnL,
      dailyLoss: this.dailyLoss,
      marginUtilization: (1 - this.availableMargin / 100000) * 100,
      positionCount: this.positions.size,
    };
  }
}
