import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trpc } from '../src/lib/trpc';

export default function Home() {
  const [metrics, setMetrics] = useState({ totalValue: 0, totalPnL: 0, buyingPower: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trpc.portfolio.metrics
      .query()
      .then((m) => setMetrics(m))
      .catch((err) => console.error('Failed to load metrics:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Trading OS Unified</h1>
          <p className="text-lg mt-4">Multi-broker trading platform</p>
        </div>
        <div className="space-x-3">
          <Link href="/connect" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block">
            Connect Broker
          </Link>
          <Link href="/dashboard" className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 inline-block">
            Go to Dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="p-4 border rounded">
          <h2 className="font-bold">Total Value</h2>
          <p className="text-2xl mt-2">{loading ? '...' : `\u20B9${metrics.totalValue.toLocaleString()}`}</p>
        </div>
        <div className="p-4 border rounded">
          <h2 className="font-bold">P&L</h2>
          <p className="text-2xl mt-2">{loading ? '...' : `\u20B9${metrics.totalPnL.toLocaleString()}`}</p>
        </div>
        <div className="p-4 border rounded">
          <h2 className="font-bold">Buying Power</h2>
          <p className="text-2xl mt-2">{loading ? '...' : `\u20B9${metrics.buyingPower.toLocaleString()}`}</p>
        </div>
      </div>
    </div>
  );
}