'use client';

import { useState } from 'react';
import { API_URL } from '../src/lib/trpc';

export default function ConnectBrokers() {
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [iciciCreds, setIciciCreds] = useState({ customerId: '', password: '' });

  const handleBrokerLogin = async (broker: string) => {
    setLoading(true);
    try {
      if (broker === 'icici') {
        const res = await fetch(`${API_URL}/auth/icici/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(iciciCreds),
        });
        if (res.ok) {
          const data = await res.json();
          window.location.href = data.redirectUrl;
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.error || 'ICICI login failed');
        }
      } else {
        const res = await fetch(`${API_URL}/auth/${broker}/login`);
        const { redirectUrl } = await res.json();
        window.location.href = redirectUrl;
      }
    } catch (error) {
      console.error(`Failed to connect ${broker}:`, error);
      alert(`Failed to connect to ${broker}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-2">Connect Your Broker</h1>
        <p className="text-gray-600 mb-8">Link your broker account to start trading on Trading OS</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-6 hover:shadow-lg transition">
            <h2 className="text-xl font-bold mb-2">Zerodha</h2>
            <p className="text-gray-600 text-sm mb-4">Fast, secure OAuth login</p>
            <button
              onClick={() => handleBrokerLogin('zerodha')}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect Zerodha'}
            </button>
          </div>

          <div className="border rounded-lg p-6 hover:shadow-lg transition">
            <h2 className="text-xl font-bold mb-2">DhanHQ</h2>
            <p className="text-gray-600 text-sm mb-4">Lightweight, direct access</p>
            <button
              onClick={() => handleBrokerLogin('dhan')}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect Dhan'}
            </button>
          </div>

          <div className="border rounded-lg p-6 hover:shadow-lg transition">
            <h2 className="text-xl font-bold mb-2">ICICI Direct</h2>
            <p className="text-gray-600 text-sm mb-4">Established, reliable</p>
            <button
              onClick={() => setSelectedBroker('icici')}
              className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700"
            >
              Connect ICICI
            </button>
          </div>
        </div>

        {selectedBroker === 'icici' && (
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold mb-4">ICICI Direct Login</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Customer ID"
                value={iciciCreds.customerId}
                onChange={(e) => setIciciCreds({ ...iciciCreds, customerId: e.target.value })}
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="password"
                placeholder="Password"
                value={iciciCreds.password}
                onChange={(e) => setIciciCreds({ ...iciciCreds, password: e.target.value })}
                className="w-full px-4 py-2 border rounded"
              />
              <button
                onClick={() => handleBrokerLogin('icici')}
                disabled={loading || !iciciCreds.customerId || !iciciCreds.password}
                className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login to ICICI'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> Your credentials are encrypted and never stored. Each session requires new authentication.
          </p>
        </div>
      </div>
    </div>
  );
}