import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Bell, TrendingUp, MessageSquare, ShieldCheck, Zap, BarChart2 } from "lucide-react";
import { fetchMarkets, fetchSuggestions, triggerBriefing } from "./services/api";
import { PremiumProvider, usePremium } from "./context/PremiumContext";
import MarketOverview from "./components/MarketOverview";
import SuggestionsPanel from "./components/SuggestionsPanel";
import ChatPanel from "./components/ChatPanel";
import AlertsPanel from "./components/AlertsPanel";
import PortfolioPanel from "./components/PortfolioPanel";
import PremiumPage from "./components/PremiumPage";

const RISK_PROFILES = {
  prudent:  { label: "Prudent",  color: "text-blue-400",   bg: "bg-blue-400/10",   desc: "ETF uniquement, faible risque" },
  modere:   { label: "Modéré",   color: "text-yellow-400", bg: "bg-yellow-400/10", desc: "Actions + ETF, risque équilibré" },
  agressif: { label: "Agressif", color: "text-red-400",    bg: "bg-red-400/10",    desc: "Tout inclus, haute performance" },
};

function AppContent() {
  const { isPremium, canGetSuggestions, incrementSuggestion, suggestionRemaining } = usePremium();
  const [markets, setMarkets] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [budget, setBudget] = useState(200);
  const [filter, setFilter] = useState("all");
  const [riskProfile, setRiskProfile] = useState("modere");
  const [loading, setLoading] = useState(true);
  const [sugLoading, setSugLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showPremium, setShowPremium] = useState(false);

  const loadMarkets = useCallback(async () => {
    try {
      const data = await fetchMarkets();
      setMarkets(data);
      setLastUpdate(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const loadSuggestions = useCallback(async () => {
    if (!canGetSuggestions) return;
    setSugLoading(true);
    try {
      const data = await fetchSuggestions(budget, filter, riskProfile);
      setSuggestions(data);
      incrementSuggestion();
    } catch (e) { console.error(e); }
    finally { setSugLoading(false); }
  }, [budget, filter, riskProfile, canGetSuggestions]);

  useEffect(() => { loadMarkets(); }, [loadMarkets]);
  useEffect(() => { loadSuggestions(); }, [loadSuggestions]);
  useEffect(() => {
    const interval = setInterval(loadMarkets, 60000);
    return () => clearInterval(interval);
  }, [loadMarkets]);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "chat", label: "Agent", icon: MessageSquare },
    { id: "portfolio", label: "Portfolio", icon: BarChart2, premium: true },
    { id: "alerts", label: "Alertes", icon: Bell, premium: true },
  ];

  const profile = RISK_PROFILES[riskProfile];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {showPremium && <PremiumPage onClose={() => setShowPremium(false)} />}

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
          {!isPremium && (
            <button onClick={() => setShowPremium(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors">
              <Zap size={12} /> Premium
            </button>
          )}
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

      {/* Risk profile */}
      <div className="border-b border-gray-800 px-6 py-3 flex items-center gap-3 flex-wrap">
        <ShieldCheck size={14} className="text-gray-500" />
        <span className="text-xs text-gray-500">Profil :</span>
        {Object.entries(RISK_PROFILES).map(([key, p]) => (
          <button key={key} onClick={() => setRiskProfile(key)}
            className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
              riskProfile === key ? `${p.bg} ${p.color} border-transparent font-medium` : "border-gray-700 text-gray-500 hover:text-gray-300"
            }`}>
            {p.label}
          </button>
        ))}
        <span className="text-xs text-gray-600 hidden sm:block">— {profile.desc}</span>
        {!isPremium && (
          <span className="ml-auto text-xs text-gray-600">
            {suggestionRemaining} suggestion(s) gratuite(s) restante(s)
          </span>
        )}
      </div>

      <nav className="border-b border-gray-800 px-6">
        <div className="flex">
          {tabs.map(({ id, label, icon: Icon, premium }) => (
            <button key={id}
              onClick={() => {
                if (premium && !isPremium) { setShowPremium(true); return; }
                setActiveTab(id);
              }}
              className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
                activeTab === id ? "border-emerald-500 text-emerald-400" : "border-transparent text-gray-500 hover:text-gray-300"
              }`}>
              <Icon size={14} />
              {label}
              {premium && !isPremium && <Zap size={10} className="text-emerald-500" />}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <MarketOverview markets={markets} loading={loading} />
            {!canGetSuggestions ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                <Zap size={32} className="mx-auto mb-3 text-emerald-500 opacity-50" />
                <p className="text-sm font-medium mb-1">Limite gratuite atteinte</p>
                <p className="text-xs text-gray-500 mb-4">Tu as utilisé tes 2 suggestions gratuites aujourd'hui.</p>
                <button onClick={() => setShowPremium(true)}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold rounded-lg text-sm transition-colors">
                  Passer Premium — 9,99€/mois
                </button>
              </div>
            ) : (
              <SuggestionsPanel suggestions={suggestions} loading={sugLoading}
                budget={budget} setBudget={setBudget} filter={filter} setFilter={setFilter} />
            )}
          </div>
        )}
        {activeTab === "chat" && <ChatPanel budget={budget} riskProfile={riskProfile} onUpgrade={() => setShowPremium(true)} />}
        {activeTab === "portfolio" && <PortfolioPanel isPremium={isPremium} onUpgrade={() => setShowPremium(true)} />}
        {activeTab === "alerts" && <AlertsPanel suggestions={suggestions} isPremium={isPremium} onUpgrade={() => setShowPremium(true)} />}
      </main>

      <footer className="text-center text-xs text-gray-600 py-6 border-t border-gray-800">
        Ceci n'est pas un conseil financier officiel. Investir comporte des risques de perte en capital.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <PremiumProvider>
      <AppContent />
    </PremiumProvider>
  );
}
