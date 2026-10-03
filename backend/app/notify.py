"""Publish the gate to GitHub as a commit status (CG-ACTION-01: only the application boundary writes status).
Best-effort: a failure here is logged and never changes the verdict."""
import logging
from .models import AuditReport
from .github_status import set_commit_status

log = logging.getLogger("citeguard.notify")


async def publish(report: AuditReport, event: str = "audit_complete") -> None:
    try:
        await set_commit_status(report.repo, report.commit_sha, report.gate.state,
                                report.gate.description, report.gate.report_url)
    except Exception as exc:
        log.warning("commit status failed: %s", exc)
