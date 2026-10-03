from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    mock_mode: bool = True
    github_webhook_secret: str = "change-me"
    n8n_shared_secret: str = "change-me"
    github_token: str = ""
    reviewer_allowlist: str = ""
    anthropic_api_key: str = ""
    gemini_api_key: str = ""
    openai_api_key: str = ""
    llm_model: str = ""
    crossref_mailto: str = ""
    n8n_webhook_url: str = ""
    status_writer: str = "service"  # "service" = audit service writes GitHub status; "n8n" = n8n writes it
    policy_version: str = "1.0.0"
    tool_call_budget: int = 24
    audit_deadline_ms: int = 90000
    cors_origins: str = "http://localhost:5173"
    mock_dir: str = str(Path(__file__).resolve().parents[2] / "contract" / "mock")

    @property
    def allowlist(self) -> set[str]:
        return {x.strip().lower() for x in self.reviewer_allowlist.split(",") if x.strip()}


settings = Settings()
