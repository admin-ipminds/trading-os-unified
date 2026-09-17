import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const router = useRouter();
  const [broker, setBroker] = useState<'zerodha' | 'dhan' | 'icici' | null>(null);
  const [orderForm, setOrderForm] = useState({
    symbol: '',
    qty: 1,
    price: 0,
    side: 'BUY' as 'BUY' | 'SELL'
  });
  const [positions, setPositions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalValue: 500000,
    totalPnL: 0,
    dayPnL: 0,
    marginUsed: 0,
    buyingPower: 500000
  });

  const handlePlaceOrder = async () => {
    if (!broker || !orderForm.symbol || !orderForm.qty || !orderForm.price) {
      alert('Fill all fields');
      return;
    }
    try {
      const response = await fetch('/trpc/orders.place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brokerType: broker,
          symbol: orderForm.symbol,
          qty: orderForm.qty,
          price: orderForm.price,
          side: orderForm.side
        })
      });
      const result = await response.json();
      if (result.success) {
        alert(`Order placed: ${result.orderId}`);
        setOrderForm({ symbol: '', qty: 1, price: 0, side: 'BUY' });
      }
    } catch (error) {
      console.error('Order placement failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="space-x-4">
            <select value={broker || ''} onChange={(e) => setBroker(e.target.value as any)} className="px-4 py-2 border rounded">
              <option value="">Select Broker</option>
              <option value="zerodha">Zerodha</option>
              <option value="dhan">DhanHQ</option>
              <option value="icici">ICICI Direct</option>
            </select>
            <button onClick={() => router.push('/')} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Back</button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-600 text-sm">Total Value</p><p className="text-2xl font-bold">₹{metrics.totalValue.toLocaleString()}</p></div>
          <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-600 text-sm">Total P&L</p><p className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{metrics.totalPnL.toLocaleString()}</p></div>
          <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-600 text-sm">Day P&L</p><p className={`text-2xl font-bold ${metrics.dayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{metrics.dayPnL.toLocaleString()}</p></div>
          <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-600 text-sm">Margin Used</p><p className="text-2xl font-bold">₹{metrics.marginUsed.toLocaleString()}</p></div>
          <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-600 text-sm">Buying Power</p><p className="text-2xl font-bold text-blue-600">₹{metrics.buyingPower.toLocaleString()}</p></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Place Order</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Symbol (e.g., INFY)" value={orderForm.symbol} onChange={(e) => setOrderForm({ ...orderForm, symbol: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border rounded" />
                <input type="number" placeholder="Quantity" value={orderForm.qty} onChange={(e) => setOrderForm({ ...orderForm, qty: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded" />
                <input type="number" placeholder="Price" value={orderForm.price} onChange={(e) => setOrderForm({ ...orderForm, price: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded" step="0.05" />
                <select value={orderForm.side} onChange={(e) => setOrderForm({ ...orderForm, side: e.target.value as 'BUY' | 'SELL' })} className="w-full px-3 py-2 border rounded">
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
                <button onClick={handlePlaceOrder} disabled={!broker} className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50">Place Order</button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Positions ({positions.length})</h2>
              {positions.length === 0 ? (
                <p className="text-gray-500">No open positions</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b"><tr><th className="text-left py-2">Symbol</th><th className="text-right">Qty</th><th className="text-right">Entry</th><th className="text-right">Current</th><th className="text-right">P&L</th></tr></thead>
                  <tbody>{positions.map((pos) => (<tr key={pos.id} className="border-b"><td className="py-2">{pos.symbol}</td><td className="text-right">{pos.qty}</td><td className="text-right">₹{pos.entryPrice}</td><td className="text-right">₹{pos.currentPrice}</td><td className={`text-right font-semibold ${pos.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{pos.pnl.toLocaleString()}</td></tr>))}</tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
