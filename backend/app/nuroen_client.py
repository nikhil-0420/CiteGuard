"""Trigger the Nuroen orchestrator agent. The exact invoke mechanism is UNVERIFIED until the spike
(REST / webhook / SDK). Fill NUROEN_INVOKE_URL + NUROEN_API_KEY once known. Empty URL => manual mode."""
import httpx
from .config import settings
from .models import AuditRequest


async def trigger(req: AuditRequest) -> dict:
    payload = {"repo": req.repo, "pr_number": req.pr_number, "commit_sha": req.commit_sha, "markdown": req.markdown,
               "callback_url": f"{settings.public_base_url}/api/ingest"}
    if not settings.nuroen_invoke_url:
        return {"mode": "manual", "note": "paste this payload into the Nuroen orchestrator", "payload": payload}
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(settings.nuroen_invoke_url, json=payload,
                         headers={"Authorization": f"Bearer {settings.nuroen_api_key}"})
        r.raise_for_status()
        return {"mode": "forwarded", "status": r.status_code}
