import { useState } from "react";
import { Check, X, Zap, TrendingUp, Bell, MessageSquare, BarChart2, BookOpen } from "lucide-react";

const PAYPAL_LINK = "https://www.paypal.com/subscribe?business=liza.hallaf@gmail.com&item_name=MarketAgent+Premium&amount=9.99&currency_code=EUR&src=1";

const FEATURES = [
  { icon: TrendingUp, label: "Suggestions par jour",     free: "2",         premium: "Illimitées" },
  { icon: MessageSquare, label: "Messages chat/jour",    free: "5",         premium: "Illimités" },
  { icon: Bell, label: "Alertes Telegram",               free: false,       premium: true },
  { icon: BookOpen, label: "Historique des signaux",     free: false,       premium: "30 jours" },
  { icon: BarChart2, label: "Analyse détaillée",         free: false,       premium: true },
  { icon: Zap, label: "Portfolio tracker",               free: false,       premium: true },
];

export default function PremiumPage({ onClose }) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = () => {
    setLoading(true);
    window.open(PAYPAL_LINK, "_blank");
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-300">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-xs font-medium px-3 py-1 rounded-full mb-3">
            <Zap size={12} /> PREMIUM
          </div>
          <h2 className="text-2xl font-semibold text-white">Passez à Premium</h2>
          <p className="text-gray-400 text-sm mt-1">Accédez à toutes les fonctionnalités de l'agent</p>
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-white">9,99€</span>
            <span className="text-gray-400 text-sm">/mois</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Sans engagement — annulable à tout moment</p>
        </div>

        {/* Feature comparison */}
        <div className="space-y-2 mb-6">
          {FEATURES.map(({ icon: Icon, label, free, premium }) => (
            <div key={label} className="grid grid-cols-3 items-center gap-2 py-2 border-b border-gray-800 last:border-0">
              <div className="flex items-center gap-2 text-sm text-gray-300 col-span-1">
                <Icon size={14} className="text-gray-500 flex-shrink-0" />
                <span className="text-xs">{label}</span>
              </div>
              <div className="text-center text-xs text-gray-500">
                {free === false ? <X size={14} className="mx-auto text-red-500" /> : free}
              </div>
              <div className="text-center text-xs text-emerald-400 font-medium">
                {premium === true ? <Check size={14} className="mx-auto text-emerald-400" /> : premium}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-3 text-xs text-gray-500 pt-1">
            <span></span>
            <span className="text-center">Gratuit</span>
            <span className="text-center text-emerald-400 font-medium">Premium</span>
          </div>
        </div>

        {/* PayPal button */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-3 bg-[#0070ba] hover:bg-[#005ea6] disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.243-8.558 6.243H9.828l-1.167 7.39h3.48c.46 0 .85-.334.92-.788l.038-.197.733-4.64.047-.256a.932.932 0 0 1 .92-.788h.58c3.755 0 6.693-1.525 7.551-5.937.358-1.84.173-3.375-.708-4.74z"/>
          </svg>
          {loading ? "Redirection..." : "S'abonner avec PayPal"}
        </button>

        <p className="text-xs text-gray-600 text-center mt-3">
          Paiement sécurisé via PayPal · Annulation en 1 clic
        </p>
      </div>
    </div>
  );
}
