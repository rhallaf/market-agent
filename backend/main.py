from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from routers import markets, agent, alerts
from services.telegram_service import send_scheduled_alerts

app = FastAPI(title="Market Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

app.include_router(markets.router, prefix="/api/markets", tags=["Markets"])
app.include_router(agent.router, prefix="/api/agent", tags=["Agent"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])

scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def startup():
    scheduler.add_job(send_scheduled_alerts, "cron", hour=9, minute=0)
    scheduler.start()

@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()

@app.get("/")
async def root():
    return {"status": "ok", "message": "Market Agent API is running"}