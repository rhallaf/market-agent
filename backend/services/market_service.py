import os
import httpx
from dotenv import load_dotenv

load_dotenv()

FINNHUB_KEY = os.getenv("FINNHUB_API_KEY")
FINNHUB_URL = "https://finnhub.io/api/v1"

SYMBOLS = {
    "actions": {
        "LVMH": "MC.PA",
        "TotalEnergies": "TTE.PA",
        "Schneider": "SU.PA",
        "Apple": "AAPL",
        "Microsoft": "MSFT",
        "Nvidia": "NVDA",
    },
    "etf": {
        "ETF S&P 500": "SPY",
        "ETF Nasdaq": "QQQ",
        "ETF MSCI World": "IWDA",
    },
    "crypto": {
        "Bitcoin": "BINANCE:BTCUSDT",
        "Ethereum": "BINANCE:ETHUSDT",
        "Solana": "BINANCE:SOLUSDT",
    },
    "indices": {
        "S&P 500": "^GSPC",
        "Nasdaq": "^IXIC",
        "CAC 40": "^FCHI",
        "Or": "OANDA:XAUUSD",
    }
}

# Map Finnhub symbol → display name
FINNHUB_SYMBOLS = {
    "MC.PA": "LVMH",
    "TTE.PA": "TotalEnergies",
    "SU.PA": "Schneider",
    "AAPL": "Apple",
    "MSFT": "Microsoft",
    "NVDA": "Nvidia",
    "SPY": "ETF S&P 500",
    "QQQ": "ETF Nasdaq",
    "IWDA": "ETF MSCI World",
    "BINANCE:BTCUSDT": "Bitcoin",
    "BINANCE:ETHUSDT": "Ethereum",
    "BINANCE:SOLUSDT": "Solana",
}


async def _get_quote_async(symbol: str) -> dict | None:
    """Get real-time quote from Finnhub."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(
                f"{FINNHUB_URL}/quote",
                params={"symbol": symbol, "token": FINNHUB_KEY}
            )
            data = res.json()
            if not data.get("c") or data["c"] == 0:
                return None
            current = float(data["c"])
            prev = float(data["pc"])
            change_pct = ((current - prev) / prev) * 100 if prev else 0
            return {
                "price": round(current, 2),
                "change_pct": round(change_pct, 2),
                "direction": "up" if change_pct >= 0 else "down",
                "volume": int(data.get("v", 0) or 0),
                "volume_vs_avg": 1.0,
            }
    except Exception as e:
        print(f"Finnhub quote error {symbol}: {e}")
        return None


async def _get_candles_async(symbol: str, resolution: str = "D", count: int = 30) -> list:
    """Get OHLCV candles from Finnhub."""
    import time
    try:
        end = int(time.time())
        start = end - (count * 24 * 3600 * 2)
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(
                f"{FINNHUB_URL}/stock/candle",
                params={
                    "symbol": symbol,
                    "resolution": resolution,
                    "from": start,
                    "to": end,
                    "token": FINNHUB_KEY
                }
            )
            data = res.json()
            if data.get("s") != "ok":
                return []
            return [
                {
                    "date": str(t),
                    "open": o, "high": h, "low": l,
                    "close": c, "volume": int(v)
                }
                for t, o, h, l, c, v in zip(
                    data["t"], data["o"], data["h"],
                    data["l"], data["c"], data["v"]
                )
            ]
    except Exception as e:
        print(f"Finnhub candles error {symbol}: {e}")
        return []


def _compute_indicators(candles: list) -> dict:
    """Compute RSI, MACD, Bollinger from candle data."""
    if len(candles) < 20:
        return {}
    try:
        import pandas as pd
        import ta
        closes = pd.Series([c["close"] for c in candles])
        highs = pd.Series([c["high"] for c in candles])
        lows = pd.Series([c["low"] for c in candles])
        current_price = float(closes.iloc[-1])

        rsi = float(ta.momentum.RSIIndicator(closes, window=14).rsi().iloc[-1])
        macd_ind = ta.trend.MACD(closes)
        macd = float(macd_ind.macd().iloc[-1])
        macd_signal = float(macd_ind.macd_signal().iloc[-1])
        macd_hist = float(macd_ind.macd_diff().iloc[-1])
        macd_prev = float(macd_ind.macd_diff().iloc[-2])
        ma20 = float(closes.rolling(20).mean().iloc[-1])
        ma50 = float(closes.rolling(min(50, len(closes))).mean().iloc[-1])
        bb = ta.volatility.BollingerBands(closes, window=20)
        bb_upper = float(bb.bollinger_hband().iloc[-1])
        bb_lower = float(bb.bollinger_lband().iloc[-1])
        bb_pct = (current_price - bb_lower) / (bb_upper - bb_lower) if (bb_upper - bb_lower) > 0 else 0.5
        atr = float(ta.volatility.AverageTrueRange(highs, lows, closes).average_true_range().iloc[-1])
        atr_pct = round((atr / current_price) * 100, 2)

        bullish = 0
        bearish = 0
        if rsi < 30: bullish += 2
        elif rsi > 70: bearish += 2
        if macd > macd_signal: bullish += 1
        else: bearish += 1
        if macd_hist > 0 and macd_prev < 0: bullish += 2
        if macd_hist < 0 and macd_prev > 0: bearish += 2
        if current_price > ma20: bullish += 1
        else: bearish += 1
        if bb_pct < 0.2: bullish += 1
        elif bb_pct > 0.8: bearish += 1
        total = bullish + bearish
        score = round((bullish / total) * 100) if total > 0 else 50

        return {
            "rsi": round(rsi, 1),
            "rsi_signal": "survente" if rsi < 30 else "surachat" if rsi > 70 else "neutre",
            "macd": round(macd, 4),
            "macd_signal": round(macd_signal, 4),
            "macd_bullish": macd > macd_signal,
            "macd_crossover": macd_hist > 0 and macd_prev < 0,
            "macd_crossunder": macd_hist < 0 and macd_prev > 0,
            "ma20": round(ma20, 2),
            "ma50": round(ma50, 2),
            "bb_position_pct": round(bb_pct * 100, 1),
            "atr_pct": atr_pct,
            "volatility": "haute" if atr_pct > 3 else "moyenne" if atr_pct > 1.5 else "faible",
            "bullish_score": score,
        }
    except Exception as e:
        print(f"Indicator error: {e}")
        return {}


async def get_quote(symbol: str) -> dict | None:
    return await _get_quote_async(symbol)


async def get_history(symbol: str, period: str = "1mo") -> list:
    return await _get_candles_async(symbol)


async def get_technical_indicators(symbol: str) -> dict:
    candles = await _get_candles_async(symbol, count=60)
    return _compute_indicators(candles)


async def get_all_markets() -> dict:
    result = {}
    for category, symbols in SYMBOLS.items():
        result[category] = {}
        for name, symbol in symbols.items():
            quote = await get_quote(symbol)
            if quote:
                result[category][name] = {"symbol": symbol, **quote}
    return result


async def get_enriched_asset(symbol: str) -> dict:
    candles = await _get_candles_async(symbol, count=60)
    return {
        "symbol": symbol,
        "quote": await get_quote(symbol),
        "indicators": _compute_indicators(candles),
        "history": candles[-30:],
    }


async def detect_alerts(symbol: str, name: str) -> list:
    candles = await _get_candles_async(symbol, count=60)
    ind = _compute_indicators(candles)
    alerts = []
    if not ind:
        return alerts
    if ind.get("rsi", 50) < 28:
        alerts.append({"asset": name, "message": f"{name} en survente extrême (RSI {ind['rsi']})", "level": "warning"})
    if ind.get("rsi", 50) > 75:
        alerts.append({"asset": name, "message": f"{name} en surachat (RSI {ind['rsi']})", "level": "warning"})
    if ind.get("macd_crossover"):
        alerts.append({"asset": name, "message": f"{name} — croisement MACD haussier", "level": "info"})
    if ind.get("macd_crossunder"):
        alerts.append({"asset": name, "message": f"{name} — croisement MACD baissier", "level": "danger"})
    return alerts


async def get_all_alerts() -> list:
    all_alerts = []
    for category, symbols in SYMBOLS.items():
        if category == "indices":
            continue
        for name, symbol in symbols.items():
            all_alerts.extend(await detect_alerts(symbol, name))
    return all_alerts
