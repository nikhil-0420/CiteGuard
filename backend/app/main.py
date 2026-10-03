import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .store import store
from .routes.api import router
from .routes.tools import router as tools_router, ingest_router

log = logging.getLogger("citeguard")


@asynccontextmanager
async def lifespan(app: FastAPI):
    store.load_persisted()
    if settings.mock_mode:
        store.load_mocks()
    else:
        if settings.tools_api_key in ("change-me", "") or settings.github_webhook_secret in ("change-me", "") or not settings.github_token:
            raise RuntimeError("Production mode requires non-default secrets: GITHUB_TOKEN, GITHUB_WEBHOOK_SECRET, and TOOLS_API_KEY")
    if not settings.allowlist:
        log.warning("Startup warning: REVIEWER_ALLOWLIST is empty. No human exceptions can be approved!")
    yield


app = FastAPI(title="CiteGuard Audit Service", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)
app.include_router(tools_router)
app.include_router(ingest_router)
