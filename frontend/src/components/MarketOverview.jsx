import { TrendingUp, TrendingDown } from "lucide-react";

const DISPLAY_INDICES = ["CAC 40", "S&P 500", "Or", "Nasdaq"];

function QuoteCard({ name, data }) {
  const isUp = data?.direction === "up";
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <p className="text-xs text-gray-500 mb-2">{name}</p>
      <p className="text-xl font-semibold tabular-nums">
        {data ? data.price.toLocaleString("fr-FR") : "—"}
      </p>
      {data && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${isUp ? "text-emerald-400" : "text-red-400"}`}>
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {data.change_pct > 0 ? "+" : ""}{data.change_pct}%
        </div>
      )}
    </div>
  );
}

export default function MarketOverview({ markets, loading }) {
  const indices = markets?.indices || {};

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Marchés</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {DISPLAY_INDICES.map(name => (
          <QuoteCard key={name} name={name} data={indices[name]} />
        ))}
      </div>
    </div>
  );
}
