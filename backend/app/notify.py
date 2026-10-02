"""Signed outbound events to n8n (CG-ACTION-01). Best-effort: failure never changes the gate."""
import json, logging
import httpx
from .config import settings
from .models import AuditReport
from .security import sign
from .github_status import set_commit_status

log = logging.getLogger("citeguard.notify")


def idem_key(r: AuditReport, event: str) -> str:
    n_ex = sum(1 for f in r.findings if f.exception)
    return f"{r.repo}#{r.pr_number}@{r.commit_sha}:{event}:{n_ex}"


async def publish(report: AuditReport, event: str) -> None:
    """Called after every audit and every recorded exception."""
    if settings.status_writer == "service":
        await set_commit_status(report.repo, report.commit_sha, report.gate.state,
                                report.gate.description, report.gate.report_url)
    if not settings.n8n_webhook_url:
        return
    body = json.dumps({"event": event, "idempotency_key": idem_key(report, event),
                       "report": json.loads(report.model_dump_json())}).encode()
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            await c.post(settings.n8n_webhook_url, content=body,
                         headers={"Content-Type": "application/json",
                                  "X-CiteGuard-Signature": sign(settings.n8n_shared_secret, body)})
    except Exception as exc:  # n8n down must not break the audit
        log.warning("n8n notify failed: %s", exc)
