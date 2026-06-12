import { useState, useEffect } from "react";
import { Bell, AlertTriangle, Info, AlertCircle, RefreshCw } from "lucide-react";
import { triggerBriefing } from "../services/api";

const LEVEL_CONFIG = {
  info:    { icon: Info,          color: "text-blue-400",   bg: "bg-blue-400/10",   label: "Info" },
  warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Attention" },
  danger:  { icon: AlertCircle,   color: "text-red-400",    bg: "bg-red-400/10",    label: "Danger" },
};

export default function AlertsPanel({ suggestions }) {
  const [autoAlerts, setAutoAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [sent, setSent] = useState(false);
  const aiAlerts = suggestions?.alerts || [];

  const fetchAutoAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/alerts/auto`);
      const data = await res.json();
      setAutoAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => { fetchAutoAlerts(); }, []);

  const handleBriefing = async () => {
    await triggerBriefing();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  const allAlerts = [
    ...autoAlerts,
    ...aiAlerts.map(a => ({ message: a.message, level: a.level, asset: "Agent IA" }))
  ];

  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Alertes & Notifications</p>

      {/* Telegram briefing */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Briefing Telegram quotidien</p>
          <p className="text-xs text-gray-500 mt-0.5">Envoyé automatiquement chaque matin à 9h00</p>
        </div>
        <button onClick={handleBriefing}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-lg font-medium transition-colors whitespace-nowrap">
          <Bell size={14} />
          {sent ? "Envoyé !" : "Envoyer maintenant"}
        </button>
      </div>

      {/* Auto alerts header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 font-medium">Signaux détectés automatiquement</p>
        <button onClick={fetchAutoAlerts}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors">
          <RefreshCw size={12} className={loadingAlerts ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {allAlerts.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <Bell size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun signal détecté pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allAlerts.map((a, i) => {
            const cfg = LEVEL_CONFIG[a.level] || LEVEL_CONFIG.info;
            const Icon = cfg.icon;
            return (
              <div key={i} className={`rounded-xl p-4 border flex items-start gap-3 ${cfg.bg} border-transparent`}>
                <Icon size={16} className={`${cfg.color} flex-shrink-0 mt-0.5`} />
                <div>
                  <span className={`text-xs font-medium ${cfg.color}`}>{a.asset || cfg.label}</span>
                  <p className="text-sm text-gray-200 mt-0.5">{a.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Telegram setup */}
      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wider">Configuration Telegram</p>
        <ol className="text-sm text-gray-500 space-y-2 list-decimal list-inside">
          <li>Cherche <span className="text-gray-300">@BotFather</span> sur Telegram → <code className="text-emerald-400 text-xs">/newbot</code></li>
          <li>Copie le token → <code className="text-emerald-400 text-xs">TELEGRAM_BOT_TOKEN</code> dans .env</li>
          <li>Envoie un message à ton bot puis visite <code className="text-emerald-400 text-xs">api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code></li>
          <li>Copie le <code className="text-emerald-400 text-xs">chat_id</code> → <code className="text-emerald-400 text-xs">TELEGRAM_CHAT_ID</code> dans .env</li>
        </ol>
      </div>
    </div>
  );
}
