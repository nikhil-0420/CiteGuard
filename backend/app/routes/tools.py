"""Tool + callback endpoints for the Nuroen agents (Nuroen -> us). All guarded by X-API-Key.
LLM proposes (in Nuroen), this code disposes (deterministic)."""
from __future__ import annotations
import re, time, uuid, unicodedata
from difflib import SequenceMatcher
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from ..config import settings
from ..models import (AuditReport, Finding, Extraction, Budget, Review, VoiceBriefing)
from ..parser import parse_markdown
from ..policy import build_report_fields, now_iso
from ..store import store
from ..notify import publish
from ..agent.judge import validate_quote
from ..github_pr import verify_pr_approval

router = APIRouter(prefix="/tools", tags=["tools"])
ingest_router = APIRouter(tags=["ingest"])


def require_key(x_api_key: str | None = Header(default=None)):
    if not x_api_key or x_api_key != settings.tools_api_key:
        raise HTTPException(401, detail={"error": "bad api key", "code": "bad_request"})


# ---------- /tools/parse ----------
class ParseIn(BaseModel):
    markdown: str


@router.post("/parse", dependencies=[Depends(require_key)])
def parse(body: ParseIn):
    r = parse_markdown(body.markdown)
    return {
        "complete": r.complete, "issues": r.issues, "markers_found": r.markers_found,
        "claims": [c.__dict__ for c in r.claims], "bibliography": r.bibliography,
    }


# ---------- /tools/compare-identity ----------
class Meta(BaseModel):
    title: str = ""
    authors: list[str] = []
    year: Optional[int] = None
    doi: Optional[str] = None


class CompareIn(BaseModel):
    cited: Meta
    found: Optional[Meta] = None   # null/empty => nothing resolved


def _strip_accents(s: str) -> str:
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")


def _norm(s: str) -> str:
    s = _strip_accents(s)
    return re.sub(r"[^a-z0-9 ]", "", s.lower()).strip()


def _surname(a: str) -> str:
    a = _strip_accents(a.strip())
    part = a.split(",")[0] if "," in a else a.split()[-1] if a.split() else ""
    return re.sub(r"[^a-z0-9]", "", part.lower())


def _title_match(t1: str, t2: str) -> bool:
    n1, n2 = _norm(t1), _norm(t2)
    if not n1 or not n2:
        return False
    if n1 == n2 or SequenceMatcher(None, n1, n2).ratio() >= 0.85:
        return True
    m1 = _norm(re.split(r"[:\-—]", t1)[0])
    m2 = _norm(re.split(r"[:\-—]", t2)[0])
    if m1 and m2 and (m1 == m2 or SequenceMatcher(None, m1, m2).ratio() >= 0.9):
        return True
    return False


@router.post("/compare-identity", dependencies=[Depends(require_key)])
def compare_identity(body: CompareIn):
    f, c = body.found, body.cited
    if f is None or not (f.title or f.doi):
        return {"status": "unresolved", "mismatch_fields": []}
    mism: list[str] = []
    if c.title and f.title and not _title_match(c.title, f.title):
        mism.append("title")
    if c.year and f.year and c.year != f.year:
        mism.append("year")
    if c.authors and f.authors:
        c_first = _surname(c.authors[0])
        f_first = _surname(f.authors[0])
        if c_first and f_first and c_first != f_first:
            mism.append("authors")
        else:
            f_surnames = {_surname(a) for a in f.authors if _surname(a)}
            for ca in c.authors:
                cs = _surname(ca)
                if cs and cs not in f_surnames:
                    mism.append("authors")
                    break
    return {"status": "metadata_mismatch" if mism else "matched", "mismatch_fields": mism}


# ---------- /tools/validate-quote ----------
class QuoteIn(BaseModel):
    quote: str
    source_text: str


@router.post("/validate-quote", dependencies=[Depends(require_key)])
def validate_quote_ep(body: QuoteIn):
    return {"validated": bool(body.quote.strip()) and validate_quote(body.quote, body.source_text)}


# ---------- /tools/policy ----------
class PolicyIn(BaseModel):
    commit_sha: str
    extraction_complete: bool
    references_total: int
    findings: list[Finding]
    technical_error: bool = False


@router.post("/policy", dependencies=[Depends(require_key)])
def policy(body: PolicyIn):
    findings, summary, gate = build_report_fields(
        body.findings, body.references_total, body.extraction_complete,
        body.commit_sha, "", body.technical_error)
    return {"findings": findings, "summary": summary, "gate": gate}


# ---------- POST /api/ingest : Governor agent calls this when done ----------
class IngestIn(BaseModel):
    repo: str
    pr_number: int
    commit_sha: str
    references_total: int
    extraction: Extraction
    findings: list[Finding]
    budget: Optional[Budget] = None
    nuroen_run_id: str | None = None
    technical_error: bool = False


@ingest_router.post("/api/ingest", dependencies=[Depends(require_key)])
async def ingest(body: IngestIn):
    # CG-HUMAN-01: every exception must come from an allowlisted reviewer, carry a reason, and have a confirmed GitHub approval.
    for f in body.findings:
        ex = f.exception
        if ex:
            if ex.reviewer.lower() not in settings.allowlist or not ex.reason.strip():
                raise HTTPException(403, detail={"error": f"exception by '{ex.reviewer}' rejected", "code": "not_allowlisted"})
            is_valid = await verify_pr_approval(body.repo, body.pr_number, body.commit_sha, ex.reviewer)
            if not is_valid:
                raise HTTPException(403, detail={"error": f"exception by '{ex.reviewer}' rejected: unverified GitHub approval", "code": "not_allowlisted"})
    stale = any(f.exception and f.exception.commit_sha != body.commit_sha for f in body.findings)
    rid = f"pr{body.pr_number}-{body.commit_sha[:7]}"      # deterministic: re-ingest after approval REPLACES the report
    url = f"{settings.frontend_url}/?report={rid}"
    findings, summary, gate = build_report_fields(
        body.findings, body.references_total, body.extraction.complete,
        body.commit_sha, url, body.technical_error)
    report = AuditReport(
        report_id=rid, repo=body.repo, pr_number=body.pr_number, commit_sha=body.commit_sha,
        policy_version=settings.policy_version, generated_at=now_iso(), cached=False, gate=gate,
        extraction=body.extraction, summary=summary, findings=findings,
        budget=body.budget or Budget(tool_calls_used=0, tool_calls_max=settings.tool_call_budget, elapsed_ms=0,
                                     deadline_ms=settings.audit_deadline_ms, exhausted=False),
        review=Review(state="stale" if stale else ("approved_with_exceptions" if any(f.exception for f in body.findings) else "requested"),
                      request_url=None),
        voice_briefing=VoiceBriefing())
    store.put(report)
    await publish(report, "audit_complete")          # sets GitHub status (STATUS_WRITER=service)
    return {"report_id": rid, "gate": gate.state, "description": gate.description}
