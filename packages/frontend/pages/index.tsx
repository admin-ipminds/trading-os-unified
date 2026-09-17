export default function Home() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold">Trading OS Unified</h1>
      <p className="text-lg mt-4">Multi-broker trading platform</p>
      
      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="p-4 border rounded">
          <h2 className="font-bold">Positions</h2>
          <p className="text-2xl mt-2">0</p>
        </div>
        <div className="p-4 border rounded">
          <h2 className="font-bold">P&L</h2>
          <p className="text-2xl mt-2">₹0.00</p>
        </div>
        <div className="p-4 border rounded">
          <h2 className="font-bold">Buying Power</h2>
          <p className="text-2xl mt-2">₹100,000</p>
        </div>
      </div>
    </div>
  );
}
