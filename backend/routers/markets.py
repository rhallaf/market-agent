from fastapi import APIRouter, Query
from services.market_service import get_all_markets, get_history, get_enriched_asset, SYMBOLS

router = APIRouter()


@router.get("/")
async def all_markets():
    return await get_all_markets()


@router.get("/symbols")
async def list_symbols():
    return SYMBOLS


@router.get("/{symbol}/history")
async def asset_history(
    symbol: str,
    period: str = Query("1mo", enum=["1d", "5d", "1mo", "3mo", "6mo", "1y"])
):
    return await get_history(symbol, period)


@router.get("/{symbol}/detail")
async def asset_detail(symbol: str):
    return await get_enriched_asset(symbol)
