import { useState } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, Lock } from "lucide-react";

export default function PortfolioPanel({ isPremium, onUpgrade }) {
  const [positions, setPositions] = useState([
    { id: 1, name: "ETF MSCI World", symbol: "IWDA.AS", qty: 10, buyPrice: 115.0 },
    { id: 2, name: "Apple", symbol: "AAPL", qty: 5, buyPrice: 280.0 },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", symbol: "", qty: "", buyPrice: "" });

  // Simulated current prices
  const currentPrices = { "IWDA.AS": 120.89, "AAPL": 295.63, "MC.PA": 493.2 };

  const getPnL = (pos) => {
    const current = currentPrices[pos.symbol] || pos.buyPrice;
    return ((current - pos.buyPrice) / pos.buyPrice) * 100;
  };

  const getTotalValue = () =>
    positions.reduce((sum, p) => sum + (currentPrices[p.symbol] || p.buyPrice) * p.qty, 0);

  const getTotalPnL = () =>
    positions.reduce((sum, p) => {
      const current = currentPrices[p.symbol] || p.buyPrice;
      return sum + (current - p.buyPrice) * p.qty;
    }, 0);

  const addPosition = () => {
    if (!form.name || !form.qty || !form.buyPrice) return;
    setPositions(prev => [...prev, { id: Date.now(), ...form, qty: +form.qty, buyPrice: +form.buyPrice }]);
    setForm({ name: "", symbol: "", qty: "", buyPrice: "" });
    setShowAdd(false);
  };

  const removePosition = (id) => setPositions(prev => prev.filter(p => p.id !== id));

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
          <Lock size={24} className="text-emerald-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Fonctionnalité Premium</h3>
        <p className="text-sm text-gray-400 mb-6 max-w-xs">
          Le portfolio tracker est réservé aux abonnés Premium. Suivez vos investissements en temps réel.
        </p>
        <button onClick={onUpgrade}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold rounded-xl transition-colors">
          Passer Premium — 9,99€/mois
        </button>
      </div>
    );
  }

  const totalPnL = getTotalPnL();

  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Portfolio</p>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Valeur totale</p>
          <p className="text-xl font-semibold">{getTotalValue().toFixed(2)} €</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">P&L total</p>
          <p className={`text-xl font-semibold ${totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {totalPnL >= 0 ? "+" : ""}{totalPnL.toFixed(2)} €
          </p>
        </div>
      </div>

      {/* Positions */}
      <div className="space-y-3 mb-4">
        {positions.map(pos => {
          const pnl = getPnL(pos);
          const isUp = pnl >= 0;
          return (
            <div key={pos.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isUp ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                  {isUp ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-red-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{pos.name}</p>
                  <p className="text-xs text-gray-500">{pos.qty} × {pos.buyPrice}€</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                  {isUp ? "+" : ""}{pnl.toFixed(2)}%
                </span>
                <button onClick={() => removePosition(pos.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add position */}
      {showAdd ? (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
          <input placeholder="Nom (ex: Apple)" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500" />
          <input placeholder="Symbole (ex: AAPL)" value={form.symbol}
            onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500" />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Quantité" type="number" value={form.qty}
              onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500" />
            <input placeholder="Prix d'achat €" type="number" value={form.buyPrice}
              onChange={e => setForm(f => ({ ...f, buyPrice: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={addPosition} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-medium rounded-lg text-sm transition-colors">
              Ajouter
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-gray-200 transition-colors">
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full py-2.5 border border-dashed border-gray-700 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors flex items-center justify-center gap-2">
          <Plus size={14} /> Ajouter une position
        </button>
      )}
    </div>
  );
}
