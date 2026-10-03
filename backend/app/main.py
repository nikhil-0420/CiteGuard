from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .store import store
from .routes.api import router
from .routes.tools import router as tools_router, ingest_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.mock_mode:
        store.load_mocks()
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
