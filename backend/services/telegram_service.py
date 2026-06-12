import os
import httpx
from dotenv import load_dotenv
from services.agent_service import get_agent_suggestions

load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")


async def send_message(text: str, chat_id: str = None) -> bool:
    """Send a message via Telegram HTTP API directly."""
    if not BOT_TOKEN or not (chat_id or CHAT_ID):
        print("Telegram: token ou chat_id manquant")
        return False
    try:
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json={
                "chat_id": chat_id or CHAT_ID,
                "text": text,
            })
            data = res.json()
            if not data.get("ok"):
                print(f"Telegram error: {data}")
                return False
            return True
    except Exception as e:
        print(f"Telegram exception: {e}")
        return False


async def send_scheduled_alerts():
    """Send daily morning market briefing."""
    try:
        data = await get_agent_suggestions(budget=200)
        summary = data.get("summary", "")
        alerts = data.get("alerts", [])
        suggestions = data.get("suggestions", [])

        signal_emoji = {"buy": "🟢", "wait": "🟡", "avoid": "🔴"}
        level_emoji = {"info": "ℹ️", "warning": "⚠️", "danger": "🚨"}

        lines = ["📊 Briefing marché du jour\n", f"{summary}\n"]

        if alerts:
            lines.append("Alertes :")
            for a in alerts:
                lines.append(f"{level_emoji.get(a['level'], 'ℹ️')} {a['message']}")

        if suggestions:
            lines.append("\nSuggestions :")
            for s in suggestions[:4]:
                emoji = signal_emoji.get(s['signal'], '•')
                lines.append(f"{emoji} {s['name']} — {s['reason']}")

        lines.append(f"\n{data.get('disclaimer', 'Ceci nest pas un conseil financier officiel.')}")

        await send_message("\n".join(lines))
    except Exception as e:
        print(f"Scheduled alert error: {e}")


async def send_custom_alert(asset_name: str, message: str, level: str = "info") -> bool:
    """Send a custom alert for a specific asset."""
    level_emoji = {"info": "ℹ️", "warning": "⚠️", "danger": "🚨"}
    text = f"{level_emoji.get(level, 'ℹ️')} {asset_name}\n{message}"
    return await send_message(text)
