import yfinance as yf
import pandas as pd
import ta
import requests

# Session avec User-Agent pour éviter le blocage Yahoo Finance sur les serveurs cloud
_session = requests.Session()
_session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
})

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
        "ETF MSCI World": "IWDA.AS",
        "ETF CAC 40": "CAC.PA",
        "ETF S&P 500": "SPY",
        "ETF Nasdaq": "QQQ",
    },
    "crypto": {
        "Bitcoin": "BTC-USD",
        "Ethereum": "ETH-USD",
        "Solana": "SOL-USD",
    },
    "indices": {
        "CAC 40": "^FCHI",
        "S&P 500": "^GSPC",
        "Nasdaq": "^IXIC",
        "Or": "GC=F",
    }
}


def get_quote(symbol: str) -> dict:
    try:
        ticker = yf.Ticker(symbol, session=_session)
        hist = ticker.history(period="5d")
        if hist.empty:
            return None
        current = float(hist["Close"].iloc[-1])
        prev = float(hist["Close"].iloc[-2]) if len(hist) > 1 else current
        change_pct = ((current - prev) / prev) * 100
        volume = int(hist["Volume"].iloc[-1]) if "Volume" in hist else 0
        avg_volume = int(hist["Volume"].mean()) if "Volume" in hist else 0
        return {
            "price": round(current, 2),
            "change_pct": round(change_pct, 2),
            "direction": "up" if change_pct >= 0 else "down",
            "volume": volume,
            "volume_vs_avg": round(volume / avg_volume, 2) if avg_volume > 0 else 1.0,
        }
    except Exception:
        return None


def get_history(symbol: str, period: str = "1mo") -> list[dict]:
    try:
        ticker = yf.Ticker(symbol, session=_session)
        hist = ticker.history(period=period)
        if hist.empty:
            return []
        return [
            {
                "date": str(idx.date()),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            }
            for idx, row in hist.iterrows()
        ]
    except Exception:
        return []


def get_technical_indicators(symbol: str) -> dict:
    """Compute rich technical indicators: RSI, MACD, Bollinger, Stochastic, ATR."""
    try:
        ticker = yf.Ticker(symbol, session=_session)
        hist = ticker.history(period="6mo")
        if hist.empty or len(hist) < 50:
            return {}

        close = hist["Close"]
        high = hist["High"]
        low = hist["Low"]
        current_price = float(close.iloc[-1])

        # RSI
        rsi = float(ta.momentum.RSIIndicator(close, window=14).rsi().iloc[-1])

        # MACD
        macd_ind = ta.trend.MACD(close)
        macd = float(macd_ind.macd().iloc[-1])
        macd_signal = float(macd_ind.macd_signal().iloc[-1])
        macd_hist = float(macd_ind.macd_diff().iloc[-1])
        macd_prev_hist = float(macd_ind.macd_diff().iloc[-2])

        # Moving averages
        ma20 = float(close.rolling(20).mean().iloc[-1])
        ma50 = float(close.rolling(50).mean().iloc[-1])
        ma200 = float(close.rolling(200).mean().iloc[-1]) if len(close) >= 200 else None

        # Bollinger Bands
        bb = ta.volatility.BollingerBands(close, window=20, window_dev=2)
        bb_upper = float(bb.bollinger_hband().iloc[-1])
        bb_lower = float(bb.bollinger_lband().iloc[-1])
        bb_mid = float(bb.bollinger_mavg().iloc[-1])
        bb_pct = (current_price - bb_lower) / (bb_upper - bb_lower) if (bb_upper - bb_lower) > 0 else 0.5

        # Stochastic
        stoch = ta.momentum.StochasticOscillator(high, low, close, window=14, smooth_window=3)
        stoch_k = float(stoch.stoch().iloc[-1])
        stoch_d = float(stoch.stoch_signal().iloc[-1])

        # ATR (volatilité)
        atr = float(ta.volatility.AverageTrueRange(high, low, close, window=14).average_true_range().iloc[-1])
        atr_pct = round((atr / current_price) * 100, 2)

        # Signaux synthétiques
        bullish_signals = 0
        bearish_signals = 0

        if rsi < 30: bullish_signals += 2   # survente forte
        elif rsi < 45: bullish_signals += 1
        elif rsi > 70: bearish_signals += 2  # surachat fort
        elif rsi > 55: bearish_signals += 1

        if macd > macd_signal: bullish_signals += 1
        else: bearish_signals += 1

        if macd_hist > 0 and macd_prev_hist < 0: bullish_signals += 2   # croisement haussier
        if macd_hist < 0 and macd_prev_hist > 0: bearish_signals += 2   # croisement baissier

        if current_price > ma20: bullish_signals += 1
        else: bearish_signals += 1

        if current_price > ma50: bullish_signals += 1
        else: bearish_signals += 1

        if bb_pct < 0.2: bullish_signals += 1   # proche bande basse
        elif bb_pct > 0.8: bearish_signals += 1  # proche bande haute

        if stoch_k < 20: bullish_signals += 1
        elif stoch_k > 80: bearish_signals += 1

        total = bullish_signals + bearish_signals
        score = round((bullish_signals / total) * 100) if total > 0 else 50

        return {
            "rsi": round(rsi, 1),
            "rsi_signal": "survente" if rsi < 30 else "surachat" if rsi > 70 else "neutre",
            "macd": round(macd, 4),
            "macd_signal": round(macd_signal, 4),
            "macd_histogram": round(macd_hist, 4),
            "macd_bullish": macd > macd_signal,
            "macd_crossover": macd_hist > 0 and macd_prev_hist < 0,
            "macd_crossunder": macd_hist < 0 and macd_prev_hist > 0,
            "ma20": round(ma20, 2),
            "ma50": round(ma50, 2),
            "ma200": round(ma200, 2) if ma200 else None,
            "price_vs_ma20": "above" if current_price > ma20 else "below",
            "price_vs_ma50": "above" if current_price > ma50 else "below",
            "bb_upper": round(bb_upper, 2),
            "bb_lower": round(bb_lower, 2),
            "bb_mid": round(bb_mid, 2),
            "bb_position_pct": round(bb_pct * 100, 1),
            "stoch_k": round(stoch_k, 1),
            "stoch_d": round(stoch_d, 1),
            "stoch_signal": "survente" if stoch_k < 20 else "surachat" if stoch_k > 80 else "neutre",
            "atr": round(atr, 2),
            "atr_pct": atr_pct,
            "volatility": "haute" if atr_pct > 3 else "moyenne" if atr_pct > 1.5 else "faible",
            "bullish_score": score,
        }
    except Exception as e:
        print(f"Indicator error for {symbol}: {e}")
        return {}


def detect_alerts(symbol: str, name: str) -> list[dict]:
    """Detect strong signals worth alerting on."""
    alerts = []
    ind = get_technical_indicators(symbol)
    if not ind:
        return alerts

    if ind.get("rsi", 50) < 28:
        alerts.append({"asset": name, "message": f"{name} en zone de survente extrême (RSI {ind['rsi']})", "level": "warning"})
    if ind.get("rsi", 50) > 75:
        alerts.append({"asset": name, "message": f"{name} en zone de surachat (RSI {ind['rsi']})", "level": "warning"})
    if ind.get("macd_crossover"):
        alerts.append({"asset": name, "message": f"{name} — croisement MACD haussier détecté", "level": "info"})
    if ind.get("macd_crossunder"):
        alerts.append({"asset": name, "message": f"{name} — croisement MACD baissier détecté", "level": "danger"})
    if ind.get("bb_position_pct", 50) < 10:
        alerts.append({"asset": name, "message": f"{name} touche la bande de Bollinger basse", "level": "info"})
    if ind.get("volatility") == "haute":
        alerts.append({"asset": name, "message": f"{name} — volatilité élevée ({ind['atr_pct']}% ATR)", "level": "warning"})

    return alerts


def get_all_markets() -> dict:
    result = {}
    for category, symbols in SYMBOLS.items():
        result[category] = {}
        for name, symbol in symbols.items():
            quote = get_quote(symbol)
            if quote:
                result[category][name] = {"symbol": symbol, **quote}
    return result


def get_enriched_asset(symbol: str) -> dict:
    quote = get_quote(symbol)
    indicators = get_technical_indicators(symbol)
    history = get_history(symbol, period="1mo")
    return {
        "symbol": symbol,
        "quote": quote,
        "indicators": indicators,
        "history": history,
    }


def get_all_alerts() -> list[dict]:
    """Scan all assets and return triggered alerts."""
    all_alerts = []
    for category, symbols in SYMBOLS.items():
        if category == "indices":
            continue
        for name, symbol in symbols.items():
            all_alerts.extend(detect_alerts(symbol, name))
    return all_alerts
