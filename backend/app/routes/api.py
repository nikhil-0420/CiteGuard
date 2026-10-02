from __future__ import annotations
import json
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import JSONResponse
from ..config import settings
from ..models import AuditRequest, ExceptionRequest, Exception_
from ..store import store
from ..policy import build_report_fields, now_iso
from ..pipeline import run_audit
from ..notify import publish
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
async def start_audit(req: AuditRequest, bg: BackgroundTasks):
    key = f"{req.repo}#{req.pr_number}@{req.commit_sha}"
    if not seen.first_time(key):                      # idempotent per commit (CG-ACTION-01)
        return JSONResponse(status_code=202, content={"report_id": None, "duplicate": True})
    report = await run_audit(req)                     # sync for now; Sam can move to background
    store.put(report)
    bg.add_task(publish, report, "audit_complete")
    return {"report_id": report.report_id}


@router.post("/api/reports/{report_id}/exceptions")
async def add_exception(report_id: str, body: ExceptionRequest):
    r = store.get(report_id)
    if not r:
        raise HTTPException(404, detail={"error": "report not found", "code": "not_found"})
    if body.reviewer.lower() not in settings.allowlist:
        raise HTTPException(403, detail={"error": "reviewer not allowlisted", "code": "not_allowlisted"})
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


async def fetch_pr_markdown(repo: str, pr_number: int, head_sha: str) -> str | None:
    headers = {"Accept": "application/vnd.github+json"}
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"https://api.github.com/repos/{repo}/pulls/{pr_number}/files", headers=headers)
            if resp.status_code != 200:
                return None
            files = resp.json()
            md_files = [f for f in files if f.get("filename", "").endswith(".md") and f.get("status") != "removed"]
            if not md_files:
                return None
            chosen = next((f for f in md_files if "brief" in f.get("filename", "").lower()), md_files[0])
            raw_url = chosen.get("raw_url")
            if raw_url:
                raw_resp = await client.get(raw_url, headers=headers)
                if raw_resp.status_code == 200:
                    return raw_resp.text
            contents_url = f"https://api.github.com/repos/{repo}/contents/{chosen.get('filename')}"
            c_resp = await client.get(contents_url, headers=headers, params={"ref": head_sha})
            if c_resp.status_code == 200:
                import base64
                content_b64 = c_resp.json().get("content", "")
                return base64.b64decode(content_b64).decode("utf-8", errors="replace")
    except Exception:
        return None
    return None


@router.post("/webhooks/github", status_code=202)
async def github_webhook(request: Request, bg: BackgroundTasks):
    body = await request.body()
    if not verify_github_signature(settings.github_webhook_secret, body, request.headers.get("X-Hub-Signature-256")):
        raise HTTPException(401, detail={"error": "bad signature", "code": "bad_request"})
    delivery = request.headers.get("X-GitHub-Delivery", "")
    if delivery and not seen.first_time(f"delivery:{delivery}"):
        return {"duplicate": True}
    payload = json.loads(body or b"{}")

    action = payload.get("action")
    pr = payload.get("pull_request")
    if pr and action in ("opened", "synchronize", "reopened"):
        repo = payload.get("repository", {}).get("full_name", "")
        pr_number = pr.get("number", 1)
        head_sha = pr.get("head", {}).get("sha", "")
        if repo and head_sha:
            md = await fetch_pr_markdown(repo, pr_number, head_sha)
            if md:
                audit_req = AuditRequest(repo=repo, pr_number=pr_number, commit_sha=head_sha, markdown=md)
                report = await run_audit(audit_req)
                store.put(report)
                bg.add_task(publish, report, "audit_complete")
                return {"accepted": True, "action": action, "report_id": report.report_id}

    return {"accepted": True, "action": action}
