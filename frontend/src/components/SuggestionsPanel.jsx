import { Loader2 } from "lucide-react";

const SIGNAL_CONFIG = {
  buy:   { label: "Acheter", color: "text-emerald-400", bg: "bg-emerald-400/10", dot: "bg-emerald-400" },
  wait:  { label: "Attendre", color: "text-yellow-400", bg: "bg-yellow-400/10", dot: "bg-yellow-400" },
  avoid: { label: "Éviter",  color: "text-red-400",     bg: "bg-red-400/10",     dot: "bg-red-400" },
};

const FILTERS = ["all", "actions", "etf", "crypto"];
const FILTER_LABELS = { all: "Tout", actions: "Actions", etf: "ETF", crypto: "Crypto" };

export default function SuggestionsPanel({ suggestions, loading, budget, setBudget, filter, setFilter }) {
  const items = suggestions?.suggestions || [];
  const summary = suggestions?.summary;

  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Suggestions de l'agent</p>

      {/* Budget slider */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Budget disponible</span>
          <span className="text-sm font-semibold text-emerald-400">{budget} €</span>
        </div>
        <input
          type="range" min="50" max="1000" step="50" value={budget}
          onChange={e => setBudget(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>50 €</span><span>1 000 €</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
              filter === f
                ? "bg-emerald-500 border-emerald-500 text-gray-950 font-medium"
                : "border-gray-700 text-gray-400 hover:text-gray-200"
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Summary */}
      {summary && !loading && (
        <p className="text-sm text-gray-400 mb-4 italic">{summary}</p>
      )}

      {/* Suggestions list */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-8 justify-center">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">L'agent analyse les marchés...</span>
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">Aucune suggestion pour ce budget et ce filtre.</p>
      ) : (
        <div className="space-y-3">
          {items.map((s, i) => {
            const cfg = SIGNAL_CONFIG[s.signal] || SIGNAL_CONFIG.wait;
            return (
              <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{s.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-500">min {s.min_amount}€</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {suggestions?.disclaimer && (
        <p className="text-xs text-gray-600 mt-4">{suggestions.disclaimer}</p>
      )}
    </div>
  );
}
