from fastapi import APIRouter, Query
from pydantic import BaseModel
from services.agent_service import get_agent_suggestions, chat_with_agent, RISK_PROFILES

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    budget: int = 200
    risk_profile: str = "modere"
    history: list = []   # [{role: "user"|"assistant", content: "..."}]


@router.get("/suggestions")
async def suggestions(
    budget: int = Query(200, ge=50, le=10000),
    filter_type: str = Query("all", enum=["all", "actions", "etf", "crypto"]),
    risk_profile: str = Query("modere", enum=["prudent", "modere", "agressif"])
):
    """Get AI-powered suggestions adapted to budget and risk profile."""
    return await get_agent_suggestions(budget, filter_type, risk_profile)


@router.get("/profiles")
async def list_profiles():
    """List available risk profiles."""
    return RISK_PROFILES


@router.post("/chat")
async def chat(req: ChatRequest):
    """Chat with memory — send conversation history for context."""
    response = await chat_with_agent(
        req.message,
        req.budget,
        req.risk_profile,
        req.history
    )
    return {"response": response}
