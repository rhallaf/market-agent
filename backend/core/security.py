import logging
import time
from collections import defaultdict
from fastapi import Request, HTTPException

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("market-agent")

_request_log: dict = defaultdict(list)

RATE_LIMITS = {
    "/api/agent/suggestions": {"max": 10, "window": 60},
    "/api/agent/chat":        {"max": 10, "window": 60},
    "/api/alerts/briefing":   {"max": 3,  "window": 60},
    "/api/markets/":          {"max": 30, "window": 60},
    "default":                {"max": 60, "window": 60},
}

BLOCKED_IPS: set = set()


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check_rate_limit(ip: str, path: str) -> None:
    now = time.time()
    limit_config = RATE_LIMITS["default"]
    for route, config in RATE_LIMITS.items():
        if route != "default" and path.startswith(route):
            limit_config = config
            break

    max_requests = limit_config["max"]
    window = limit_config["window"]
    key = f"{ip}:{path}"

    _request_log[key] = [t for t in _request_log[key] if now - t < window]

    if len(_request_log[key]) >= max_requests:
        logger.warning(f"RATE LIMIT exceeded | IP={ip} | path={path}")
        raise HTTPException(
            status_code=429,
            detail=f"Trop de requêtes. Réessayez dans {window} secondes."
        )
    _request_log[key].append(now)


async def security_middleware(request: Request, call_next):
    ip = get_client_ip(request)
    path = request.url.path
    method = request.method
    ua = request.headers.get("User-Agent", "unknown")[:60]

    if ip in BLOCKED_IPS:
        logger.warning(f"BLOCKED | IP={ip} | {path}")
        raise HTTPException(status_code=403, detail="Accès refusé.")

    logger.info(f"REQ | IP={ip} | {method} {path} | UA={ua}")

    if path.startswith("/api/"):
        check_rate_limit(ip, path)

    start = time.time()
    response = await call_next(request)
    ms = round((time.time() - start) * 1000)

    logger.info(f"RES | IP={ip} | {path} | {response.status_code} | {ms}ms")

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    return response
