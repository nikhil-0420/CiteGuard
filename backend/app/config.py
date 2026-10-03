from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    mock_mode: bool = True
    github_webhook_secret: str = "change-me"
    github_token: str = ""
    reviewer_allowlist: str = ""
    tools_api_key: str = "change-me"          # Nuroen -> our tools (X-API-Key)
    nuroen_invoke_url: str = ""               # filled after the spike (how we call the orchestrator agent)
    nuroen_api_key: str = ""
    policy_version: str = "1.0.0"
    tool_call_budget: int = 12
    audit_deadline_ms: int = 90000
    frontend_url: str = "http://localhost:5173"
    public_base_url: str = "http://localhost:8000"   # the tunnel URL Nuroen can reach
    cors_origins: str = "http://localhost:5173"
    mock_dir: str = str(Path(__file__).resolve().parents[2] / "contract" / "mock")

    @property
    def allowlist(self) -> set[str]:
        return {x.strip().lower() for x in self.reviewer_allowlist.split(",") if x.strip()}


settings = Settings()
