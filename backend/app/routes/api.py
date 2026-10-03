from __future__ import annotations
import json
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import JSONResponse
from ..config import settings
from ..models import AuditRequest, ExceptionRequest, Exception_
from ..store import store
from ..policy import build_report_fields, now_iso
from ..notify import publish
from ..nuroen_client import trigger as nuroen_trigger
from ..github_pr import fetch_pr_markdown, verify_pr_approval
from ..github_status import set_commit_status
from ..security import verify_github_signature, SeenEvents

router = APIRouter()
seen = SeenEvents()


@router.get("/health")
def health():
    return {"ok": True, "mock_mode": settings.mock_mode}


@router.get("/api/reports")
def list_reports():
    return {"reports": [
        {"report_id": r.report_id, "repo": r.repo, "pr_number": r.pr_number, "commit_sha": r.commit_sha,
         "gate_state": r.gate.state, "generated_at": r.generated_at} for r in store.reports.values()]}


@router.get("/api/reports/{report_id}")
def get_report(report_id: str):
    r = store.get(report_id)
    if not r:
        raise HTTPException(404, detail={"error": "report not found", "code": "not_found"})
    return r


@router.post("/api/audit", status_code=202)
async def start_audit(req: AuditRequest):
    key = f"{req.repo}#{req.pr_number}@{req.commit_sha}"
    if not seen.first_time(key):                      # idempotent per commit (CG-ACTION-01)
        return JSONResponse(status_code=202, content={"report_id": None, "duplicate": True})
    return await nuroen_trigger(req)                  # Nuroen agents audit; they call /api/ingest when done


@router.post("/api/reports/{report_id}/exceptions")
async def add_exception(report_id: str, body: ExceptionRequest):
    r = store.get(report_id)
    if not r:
        raise HTTPException(404, detail={"error": "report not found", "code": "not_found"})
    if body.reviewer.lower() not in settings.allowlist:
        raise HTTPException(403, detail={"error": "reviewer not allowlisted", "code": "not_allowlisted"})
    is_valid = await verify_pr_approval(r.repo, r.pr_number, body.commit_sha, body.reviewer)
    if not is_valid:
        raise HTTPException(403, detail={"error": "unverified GitHub approval", "code": "not_allowlisted"})
    if body.commit_sha != r.commit_sha:                # stale approval on changed commit is rejected
        r.review.state = "stale"
        raise HTTPException(409, detail={"error": "approval is for a different commit", "code": "stale_commit"})
    f = next((x for x in r.findings if x.id == body.finding_id), None)
    if not f:
        raise HTTPException(404, detail={"error": "finding not found", "code": "not_found"})
    if f.action == "pass":
        raise HTTPException(400, detail={"error": "finding already passes policy", "code": "bad_request"})
    f.exception = Exception_(reviewer=body.reviewer, reason=body.reason, commit_sha=body.commit_sha,
                             at=now_iso(), original_action=f.action)   # original finding preserved
    _, _, gate = build_report_fields(r.findings, r.summary.references_total, r.extraction.complete,
                                     r.commit_sha, r.gate.report_url)
    # build_report_fields re-runs policy on findings (action unchanged); only gate is replaced
    r.gate = gate
    r.review.state = "approved_with_exceptions"
    store.put(r)
    await publish(r, "exception_recorded")
    return r


async def _audit_pr(repo: str, pr: int, sha: str):
    await set_commit_status(repo, sha, "pending", "CiteGuard is auditing this commit", "")
    try:
        md = await fetch_pr_markdown(repo, pr, sha)
        await nuroen_trigger(AuditRequest(repo=repo, pr_number=pr, commit_sha=sha, markdown=md))
    except Exception as exc:                          # never leave the gate open on a technical failure
        await set_commit_status(repo, sha, "error", f"CiteGuard could not start: {str(exc)[:90]}", "")


@router.post("/webhooks/github", status_code=202)
async def github_webhook(request: Request, bg: BackgroundTasks):
    body = await request.body()
    if not verify_github_signature(settings.github_webhook_secret, body, request.headers.get("X-Hub-Signature-256")):
        raise HTTPException(401, detail={"error": "bad signature", "code": "bad_request"})
    delivery = request.headers.get("X-GitHub-Delivery", "")
    if delivery and not seen.first_time(f"delivery:{delivery}"):
        return {"duplicate": True}
    payload = json.loads(body or b"{}")
    if request.headers.get("X-GitHub-Event") == "pull_request" and payload.get("action") in ("opened", "synchronize", "reopened"):
        repo = payload["repository"]["full_name"]
        pr = payload["pull_request"]["number"]
        sha = payload["pull_request"]["head"]["sha"]
        if seen.first_time(f"{repo}#{pr}@{sha}"):     # one audit per commit
            bg.add_task(_audit_pr, repo, pr, sha)
    return {"accepted": True, "action": payload.get("action")}
