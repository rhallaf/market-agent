import { useState, useEffect } from "react";
import { Check, X, Zap, TrendingUp, Bell, MessageSquare, BarChart2, BookOpen } from "lucide-react";

const PAYPAL_CLIENT_ID = "AShLY53H8XU8H2F6FjOULTGhXeo9VSwrslM9nL8v5LNXapjHkxkTmhubnnW_f9xfWqazCvEALmAIMJHO";
const PAYPAL_PLAN_ID = "P-7BS01620CU4022845NIWBKYI";

const FEATURES = [
  { icon: TrendingUp,   label: "Suggestions par jour",  free: "2",    premium: "Illimitées" },
  { icon: MessageSquare,label: "Messages chat/jour",    free: "5",    premium: "Illimités" },
  { icon: Bell,         label: "Alertes Telegram",      free: false,  premium: true },
  { icon: BookOpen,     label: "Historique des signaux",free: false,  premium: "30 jours" },
  { icon: BarChart2,    label: "Analyse détaillée",     free: false,  premium: true },
  { icon: Zap,          label: "Portfolio tracker",     free: false,  premium: true },
];

export default function PremiumPage({ onClose, onSuccess }) {
  const [paypalReady, setPaypalReady] = useState(false);

  useEffect(() => {
    // Load PayPal SDK
    if (window.paypal) { setPaypalReady(true); return; }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
    script.setAttribute("data-sdk-integration-source", "button-factory");
    script.onload = () => setPaypalReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!paypalReady) return;
    const container = document.getElementById("paypal-button-container");
    if (!container || container.children.length > 0) return;

    window.paypal.Buttons({
      style: { shape: "rect", color: "gold", layout: "vertical", label: "subscribe" },
      createSubscription: (data, actions) =>
        actions.subscription.create({ plan_id: PAYPAL_PLAN_ID }),
      onApprove: (data) => {
        alert("✅ Abonnement activé ! ID : " + data.subscriptionID);
        if (onSuccess) onSuccess();
        onClose();
      },
      onError: (err) => {
        console.error("PayPal error:", err);
        alert("Une erreur est survenue. Réessayez.");
      }
    }).render("#paypal-button-container");
  }, [paypalReady]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
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

        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-white">9,99€</span>
            <span className="text-gray-400 text-sm">/mois</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Sans engagement — annulable à tout moment</p>
        </div>

        <div className="space-y-2 mb-6">
          <div className="grid grid-cols-3 text-xs text-gray-500 pb-1">
            <span></span>
            <span className="text-center">Gratuit</span>
            <span className="text-center text-emerald-400 font-medium">Premium</span>
          </div>
          {FEATURES.map(({ icon: Icon, label, free, premium }) => (
            <div key={label} className="grid grid-cols-3 items-center gap-2 py-2 border-b border-gray-800 last:border-0">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <Icon size={13} className="text-gray-500 flex-shrink-0" />
                {label}
              </div>
              <div className="text-center text-xs text-gray-500">
                {free === false ? <X size={13} className="mx-auto text-red-500" /> : free}
              </div>
              <div className="text-center text-xs text-emerald-400 font-medium">
                {premium === true ? <Check size={13} className="mx-auto text-emerald-400" /> : premium}
              </div>
            </div>
          ))}
        </div>

        {/* PayPal Button */}
        <div id="paypal-button-container" className="min-h-[50px]">
          {!paypalReady && (
            <div className="text-center text-gray-500 text-sm py-4">Chargement du paiement...</div>
          )}
        </div>

        <p className="text-xs text-gray-600 text-center mt-3">
          Paiement sécurisé via PayPal · Annulation en 1 clic
        </p>
      </div>
    </div>
  );
}
