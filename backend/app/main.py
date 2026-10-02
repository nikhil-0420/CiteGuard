from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .store import store
from .routes.api import router

app = FastAPI(title="CiteGuard Audit Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
                   allow_methods=["*"], allow_headers=["*"])
app.include_router(router)


@app.on_event("startup")
def _startup():
    if settings.mock_mode:
        store.load_mocks()
