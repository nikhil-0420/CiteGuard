"""Orchestrates one audit: parse -> (agent per claim) -> policy -> report. In MOCK_MODE returns a canned report.
SAM: replace the TODO block with the real agent. Keep the policy call exactly as is."""
from __future__ import annotations
import time, uuid
from .models import (AuditReport, AuditRequest, Finding, Budget as BudgetModel, Extraction, Review, VoiceBriefing)
from .parser import parse_markdown
from .policy import build_report_fields, now_iso
from .config import settings


async def run_audit(req: AuditRequest) -> AuditReport:
    t0 = time.time()
    report_id = f"{req.commit_sha[:7]}-{uuid.uuid4().hex[:6]}"
    url = f"http://localhost:5173/?report={report_id}"
    parsed = parse_markdown(req.markdown)

    findings: list[Finding] = []
    technical_error = False
    # ---- TODO(Sam): real agent loop per claim ----
    # for claim in parsed.claims:
    #     ref, evidence, trace = await run_agent(claim.text, claim.key, parsed.bibliography[claim.key], budget)
    #     judgment = await judge_claim(...)
    #     findings.append(Finding(...))
    # ---------------------------------------------
    if parsed.claims and not findings:
        technical_error = True  # agent not implemented yet -> never pass

    findings, summary, gate = build_report_fields(
        findings, len(parsed.bibliography), parsed.complete, req.commit_sha, url, technical_error)
    return AuditReport(
        report_id=report_id, repo=req.repo, pr_number=req.pr_number, commit_sha=req.commit_sha,
        policy_version=settings.policy_version, generated_at=now_iso(), cached=False, gate=gate,
        extraction=Extraction(markers_found=parsed.markers_found, claims_extracted=len(parsed.claims),
                              complete=parsed.complete, issues=parsed.issues),
        summary=summary, findings=findings,
        budget=BudgetModel(tool_calls_used=0, tool_calls_max=settings.tool_call_budget,
                           elapsed_ms=int((time.time() - t0) * 1000), deadline_ms=settings.audit_deadline_ms, exhausted=False),
        review=Review(), voice_briefing=VoiceBriefing(),
    )
