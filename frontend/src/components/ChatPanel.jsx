import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Trash2 } from "lucide-react";
import { sendChat } from "../services/api";

const QUICK_QUESTIONS = [
  "Quel ETF recommandes-tu pour débuter ?",
  "Est-ce un bon moment pour la crypto ?",
  "Explique le RSI simplement",
  "Comment répartir mon budget ?",
];

export default function ChatPanel({ budget, riskProfile }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour ! Je suis votre agent d'analyse. Je me souviens de notre conversation et m'adapte à votre profil de risque. Posez-moi vos questions !" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const newMsg = { role: "user", content: text };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      // Send full history for memory
      const history = updatedMessages.map(m => ({ role: m.role, content: m.content }));
      const reply = await sendChat(text, budget, riskProfile, history);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Désolé, une erreur s'est produite." }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([{ role: "assistant", content: "Conversation réinitialisée. Comment puis-je vous aider ?" }]);
  };

  return (
    <div className="flex flex-col h-[72vh]">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-widest">Agent — mémoire active</p>
        <button onClick={clearHistory} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors">
          <Trash2 size={12} /> Effacer
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {QUICK_QUESTIONS.map((q, i) => (
          <button key={i} onClick={() => send(q)}
            className="text-xs px-3 py-1.5 border border-gray-700 rounded-lg text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors">
            {q}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              m.role === "assistant" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-700 text-gray-300"
            }`}>
              {m.role === "assistant" ? <Bot size={14} /> : <User size={14} />}
            </div>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
              m.role === "assistant"
                ? "bg-gray-900 border border-gray-800 text-gray-200"
                : "bg-emerald-500/15 border border-emerald-500/20 text-gray-100"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Bot size={14} />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
              <Loader2 size={14} className="animate-spin text-gray-500" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send(input)}
          placeholder="Posez votre question..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors" />
        <button onClick={() => send(input)} disabled={loading || !input.trim()}
          className="px-4 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 rounded-xl text-gray-950 transition-colors">
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
