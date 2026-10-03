"""Trigger the Nuroen orchestrator agent. The exact invoke mechanism is UNVERIFIED until the spike
(REST / webhook / SDK). Fill NUROEN_INVOKE_URL + NUROEN_API_KEY once known. Empty URL => manual mode."""
import json, httpx
from .config import settings
from .models import AuditRequest

_latest_payload: dict | None = None


def get_latest_payload() -> dict | None:
    return _latest_payload


async def trigger(req: AuditRequest) -> dict:
    global _latest_payload
    payload = {
        "repo": req.repo,
        "pr_number": req.pr_number,
        "commit_sha": req.commit_sha,
        "markdown": req.markdown,
        "callback_url": f"{settings.public_base_url}/api/ingest",
    }
    _latest_payload = payload

    if not settings.nuroen_invoke_url:
        print("\n" + "=" * 60)
        print(">>> NUROEN MANUAL ORCHESTRATOR PAYLOAD <<<")
        print("Copy and paste this payload into the Nuroen orchestrator:")
        print(json.dumps(payload, indent=2))
        print("=" * 60 + "\n", flush=True)
        return {"mode": "manual", "note": "paste this payload into the Nuroen orchestrator", "payload": payload}

    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(
            settings.nuroen_invoke_url,
            json=payload,
            headers={"Authorization": f"Bearer {settings.nuroen_api_key}"},
        )
        r.raise_for_status()
        return {"mode": "forwarded", "status": r.status_code}
