from fastapi import APIRouter
from pydantic import BaseModel
from services.telegram_service import send_message, send_custom_alert, send_scheduled_alerts
from services.market_service import get_all_alerts

router = APIRouter()

class AlertRequest(BaseModel):
    asset_name: str
    message: str
    level: str = "info"

@router.get("/auto")
async def auto_alerts():
    """Get all automatically detected alerts from market analysis."""
    try:
        return await get_all_alerts()
    except Exception as e:
        print(f"Auto alerts error: {e}")
        return []

@router.post("/send")
async def send_alert(req: AlertRequest):
    """Send a custom Telegram alert."""
    success = await send_custom_alert(req.asset_name, req.message, req.level)
    return {"success": success}

@router.post("/briefing")
async def trigger_briefing():
    """Manually trigger the daily market briefing via Telegram."""
    await send_scheduled_alerts()
    return {"success": True, "message": "Briefing sent"}