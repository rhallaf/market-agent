import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Bell, TrendingUp, MessageSquare, ShieldCheck } from "lucide-react";
import { fetchMarkets, fetchSuggestions, triggerBriefing } from "./services/api";
import MarketOverview from "./components/MarketOverview";
import SuggestionsPanel from "./components/SuggestionsPanel";
import ChatPanel from "./components/ChatPanel";
import AlertsPanel from "./components/AlertsPanel";

const RISK_PROFILES = {
  prudent:  { label: "Prudent",  color: "text-blue-400",   bg: "bg-blue-400/10",   desc: "ETF uniquement, faible risque" },
  modere:   { label: "Modéré",   color: "text-yellow-400", bg: "bg-yellow-400/10", desc: "Actions + ETF, risque équilibré" },
  agressif: { label: "Agressif", color: "text-red-400",    bg: "bg-red-400/10",    desc: "Tout inclus, haute performance" },
};

export default function App() {
  const [markets, setMarkets] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [budget, setBudget] = useState(200);
  const [filter, setFilter] = useState("all");
  const [riskProfile, setRiskProfile] = useState("modere");
  const [loading, setLoading] = useState(true);
  const [sugLoading, setSugLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadMarkets = useCallback(async () => {
    try {
      const data = await fetchMarkets();
      setMarkets(data);
      setLastUpdate(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSuggestions = useCallback(async () => {
    setSugLoading(true);
    try {
      const data = await fetchSuggestions(budget, filter, riskProfile);
      setSuggestions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSugLoading(false);
    }
  }, [budget, filter, riskProfile]);

  useEffect(() => { loadMarkets(); }, [loadMarkets]);
  useEffect(() => { loadSuggestions(); }, [loadSuggestions]);
  useEffect(() => {
    const interval = setInterval(loadMarkets, 60000);
    return () => clearInterval(interval);
  }, [loadMarkets]);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "chat", label: "Agent", icon: MessageSquare },
    { id: "alerts", label: "Alertes", icon: Bell },
  ];

  const profile = RISK_PROFILES[riskProfile];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <TrendingUp size={16} className="text-gray-950" />
          </div>
          <span className="font-semibold text-lg tracking-tight">MarketAgent</span>
          {lastUpdate && (
            <span className="text-xs text-gray-500 hidden sm:block">
              {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => triggerBriefing().then(() => alert("📩 Briefing envoyé !"))}
            className="flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">
            <Bell size={13} /><span className="hidden sm:block">Briefing</span>
          </button>
          <button onClick={() => { loadMarkets(); loadSuggestions(); }}
            className="p-1.5 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {/* Risk profile selector */}
      <div className="border-b border-gray-800 px-6 py-3 flex items-center gap-3">
        <ShieldCheck size={14} className="text-gray-500" />
        <span className="text-xs text-gray-500">Profil :</span>
        {Object.entries(RISK_PROFILES).map(([key, p]) => (
          <button key={key} onClick={() => setRiskProfile(key)}
            className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
              riskProfile === key
                ? `${p.bg} ${p.color} border-transparent font-medium`
                : "border-gray-700 text-gray-500 hover:text-gray-300"
            }`}>
            {p.label}
          </button>
        ))}
        <span className="text-xs text-gray-600 hidden sm:block">— {profile.desc}</span>
      </div>

      <nav className="border-b border-gray-800 px-6">
        <div className="flex">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
                activeTab === id ? "border-emerald-500 text-emerald-400" : "border-transparent text-gray-500 hover:text-gray-300"
              }`}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <MarketOverview markets={markets} loading={loading} />
            <SuggestionsPanel suggestions={suggestions} loading={sugLoading}
              budget={budget} setBudget={setBudget} filter={filter} setFilter={setFilter} />
          </div>
        )}
        {activeTab === "chat" && <ChatPanel budget={budget} riskProfile={riskProfile} />}
        {activeTab === "alerts" && <AlertsPanel suggestions={suggestions} />}
      </main>

      <footer className="text-center text-xs text-gray-600 py-6 border-t border-gray-800">
        Ceci n'est pas un conseil financier officiel. Investir comporte des risques de perte en capital.
      </footer>
    </div>
  );
}
