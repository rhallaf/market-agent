const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function fetchMarkets() {
  const res = await fetch(`${BASE_URL}/markets/`);
  return res.json();
}

export async function fetchSuggestions(budget, filterType = "all", riskProfile = "modere") {
  const res = await fetch(
    `${BASE_URL}/agent/suggestions?budget=${budget}&filter_type=${filterType}&risk_profile=${riskProfile}`
  );
  return res.json();
}

export async function fetchHistory(symbol, period = "1mo") {
  const res = await fetch(`${BASE_URL}/markets/${symbol}/history?period=${period}`);
  return res.json();
}

export async function sendChat(message, budget = 200, riskProfile = "modere", history = []) {
  const res = await fetch(`${BASE_URL}/agent/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, budget, risk_profile: riskProfile, history }),
  });
  const data = await res.json();
  return data.response;
}

export async function triggerBriefing() {
  const res = await fetch(`${BASE_URL}/alerts/briefing`, { method: "POST" });
  return res.json();
}
