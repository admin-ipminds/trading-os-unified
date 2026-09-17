import { Position } from '@trading-os/types';
import { BrokerAdapter } from '@trading-os/broker-adapter';

export class ReconciliationEngine {
  constructor(private brokerAdapter: BrokerAdapter) {}

  async reconcile(localPositions: Map<string, Position>): Promise<{
    synced: boolean;
    drift: Position[];
    corrections: Position[];
  }> {
    // Fetch positions from broker (source of truth)
    const brokerPositions = await this.brokerAdapter.getPositions();
    const brokerMap = new Map(brokerPositions.map((p) => [p.symbol, p]));

    const drift: Position[] = [];
    const corrections: Position[] = [];

    // Check for qty/price mismatches
    for (const [symbol, localPos] of localPositions.entries()) {
      const brokerPos = brokerMap.get(symbol);
      if (!brokerPos) {
        drift.push(localPos); // We have a position broker doesn't
        continue;
      }

      if (
        localPos.qty !== brokerPos.qty ||
        Math.abs(localPos.currentPrice - brokerPos.currentPrice) > 0.01
      ) {
        corrections.push(brokerPos); // Correct to broker's version
      }

      brokerMap.delete(symbol);
    }

    // Broker has positions we don't know about
    for (const [, brokerPos] of brokerMap.entries()) {
      drift.push(brokerPos);
    }

    return {
      synced: drift.length === 0 && corrections.length === 0,
      drift,
      corrections,
    };
  }
}
