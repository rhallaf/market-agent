import os
import json
import time
import httpx
from services.market_service import get_all_markets, get_enriched_asset, get_all_alerts
from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
MODEL = "deepseek-chat"  # V4 Flash

# Cache — évite d'appeler DeepSeek trop souvent (TTL 1 heure)
_suggestions_cache = {}
_CACHE_TTL = 3600

def _get_cache(key: str):
    entry = _suggestions_cache.get(key)
    if entry and (time.time() - entry["ts"]) < _CACHE_TTL:
        return entry["data"]
    return None

def _set_cache(key: str, data: dict):
    _suggestions_cache[key] = {"data": data, "ts": time.time()}


RISK_PROFILES = {
    "prudent": {
        "label": "Prudent",
        "description": "Préfère la sécurité, tolère peu la volatilité",
        "max_volatility": "faible",
        "preferred_types": ["etf"],
        "avoid_types": ["crypto"],
        "max_single_investment_pct": 30,
    },
    "modere": {
        "label": "Modéré",
        "description": "Équilibre risque/rendement, volatilité moyenne acceptable",
        "max_volatility": "moyenne",
        "preferred_types": ["etf", "actions"],
        "avoid_types": [],
        "max_single_investment_pct": 50,
    },
    "agressif": {
        "label": "Agressif",
        "description": "Cherche la performance, accepte forte volatilité",
        "max_volatility": "haute",
        "preferred_types": ["actions", "crypto", "etf"],
        "avoid_types": [],
        "max_single_investment_pct": 100,
    },
}

SYSTEM_PROMPT = """Tu es un agent d'analyse financière pour petits investisseurs particuliers.
Tu reçois des données de marché enrichies avec des indicateurs techniques avancés.

Indicateurs disponibles :
- RSI (< 30 = survente, > 70 = surachat)
- MACD et croisements (signal fort)
- Bandes de Bollinger (position dans la bande)
- Stochastique (< 20 = survente, > 80 = surachat)
- ATR (mesure de volatilité)
- Score haussier global (0-100)

Tes règles :
- Adapte les suggestions au budget ET au profil de risque
- Un profil "prudent" → ETF uniquement, pas de crypto
- Un profil "agressif" → peut inclure crypto et actions volatiles
- Utilise un langage simple, jamais de jargon
- Sois honnête sur les risques, ne promets jamais de gains
- Toujours inclure le disclaimer

Format JSON attendu :
{
  "summary": "Résumé du marché en 2 phrases max",
  "market_mood": "bullish|bearish|neutral",
  "suggestions": [
    {
      "name": "Nom de l'actif",
      "type": "actions|etf|crypto",
      "signal": "buy|wait|avoid",
      "reason": "Explication courte max 15 mots",
      "min_amount": 50,
      "confidence": "low|medium|high",
      "risk_level": "faible|moyenne|élevée"
    }
  ],
  "alerts": [
    {
      "message": "Alerte courte",
      "level": "info|warning|danger"
    }
  ],
  "portfolio_tip": "Conseil de répartition du budget en une phrase",
  "disclaimer": "Ceci n'est pas un conseil financier officiel."
}
"""


async def _call_deepseek(messages: list, max_tokens: int = 1200) -> str:
    """Call DeepSeek API directly via httpx."""
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            DEEPSEEK_URL,
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "max_tokens": max_tokens,
                "messages": messages,
            }
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


def build_market_context(budget: int, filter_type: str = "all", risk_profile: str = "modere") -> str:
    markets = await get_all_markets()
    profile = RISK_PROFILES.get(risk_profile, RISK_PROFILES["modere"])

    lines = [
        f"Budget : {budget}€",
        f"Profil de risque : {profile['label']} — {profile['description']}",
        f"Types préférés : {', '.join(profile['preferred_types'])}",
        f"Volatilité max acceptable : {profile['max_volatility']}\n",
    ]

    for category, assets in markets.items():
        if filter_type != "all" and category != filter_type and category != "indices":
            continue
        lines.append(f"\n=== {category.upper()} ===")
        for name, data in assets.items():
            direction = "▲" if data.get("direction") == "up" else "▼"
            vol_info = f" | vol x{data.get('volume_vs_avg', 1)}" if data.get('volume_vs_avg') else ""
            lines.append(f"- {name}: {data['price']} {direction} {data['change_pct']:+.2f}%{vol_info}")

    top_symbols = {
        "ETF MSCI World": "IWDA.AS",
        "S&P 500": "^GSPC",
        "Bitcoin": "BTC-USD",
        "LVMH": "MC.PA",
        "Nvidia": "NVDA",
    }

    lines.append("\n=== INDICATEURS TECHNIQUES AVANCÉS ===")
    for name, symbol in top_symbols.items():
        enriched = await get_enriched_asset(symbol)
        ind = enriched.get("indicators", {})
        if ind:
            lines.append(
                f"- {name}: RSI={ind.get('rsi')} ({ind.get('rsi_signal')}) | "
                f"MACD={'↑' if ind.get('macd_bullish') else '↓'}"
                f"{'[CROISEMENT HAUSSIER]' if ind.get('macd_crossover') else ''}"
                f"{'[CROISEMENT BAISSIER]' if ind.get('macd_crossunder') else ''} | "
                f"Bollinger={ind.get('bb_position_pct')}% | "
                f"Stoch={ind.get('stoch_k')} ({ind.get('stoch_signal')}) | "
                f"Volatilité={ind.get('volatility')} | "
                f"Score haussier={ind.get('bullish_score')}/100"
            )

    auto_alerts = await get_all_alerts()
    if auto_alerts:
        lines.append("\n=== ALERTES DÉTECTÉES ===")
        for a in auto_alerts[:5]:
            lines.append(f"- [{a['level'].upper()}] {a['message']}")

    return "\n".join(lines)


async def get_agent_suggestions(budget: int, filter_type: str = "all", risk_profile: str = "modere") -> dict:
    cache_key = f"{budget}:{filter_type}:{risk_profile}"
    cached = _get_cache(cache_key)
    if cached:
        cached["_cached"] = True
        return cached

    context = build_market_context(budget, filter_type, risk_profile)

    text = await _call_deepseek([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Voici les données de marché. Génère tes suggestions.\n\n{context}\n\nRéponds uniquement en JSON valide, sans balises markdown."}
    ])

    text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    result = json.loads(text)
    _set_cache(cache_key, result)
    return result


async def chat_with_agent(user_message: str, budget: int = 200,
                          risk_profile: str = "modere", history: list = None) -> str:
    context = build_market_context(budget, risk_profile=risk_profile)

    system = (
        SYSTEM_PROMPT
        + "\n\nRéponds en texte libre, de façon conversationnelle et concise. "
        + "INTERDIT de répondre en JSON ou avec des blocs de code. Texte simple uniquement."
        + f"\n\nContexte marché actuel:\n{context}"
    )

    messages = [{"role": "system", "content": system}]

    if history:
        for msg in history[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": user_message})

    return await _call_deepseek(messages)
