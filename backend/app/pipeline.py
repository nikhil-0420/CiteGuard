"""Orchestrates one audit: parse -> (agent per claim) -> policy -> report."""
from __future__ import annotations
import time
import uuid
import httpx

from .models import (
    AuditReport,
    AuditRequest,
    Finding,
    Budget as BudgetModel,
    Extraction,
    Review,
    VoiceBriefing,
    AgentStep,
)
from .parser import parse_markdown
from .policy import build_report_fields, now_iso
from .config import settings
from .agent.retrieval import run_agent, Budget
from .agent.judge import judge_claim


async def run_audit(req: AuditRequest) -> AuditReport:
    t0 = time.time()
    report_id = f"{req.commit_sha[:7]}-{uuid.uuid4().hex[:6]}"
    url = f"http://localhost:5173/?report={report_id}"
    parsed = parse_markdown(req.markdown)

    findings: list[Finding] = []
    technical_error = False

    budget = Budget(
        max_calls=settings.tool_call_budget,
        deadline_ms=settings.audit_deadline_ms,
    )
    limits = httpx.Limits(max_keepalive_connections=10, max_connections=20)
    async with httpx.AsyncClient(limits=limits) as client:
        for idx, claim in enumerate(parsed.claims, start=1):
            fid = f"F-{idx:03d}"
            bib_entry = parsed.bibliography.get(claim.key, {})

            ref, evidence, trace = await run_agent(
                claim_text=claim.text,
                key=claim.key,
                bib_entry=bib_entry,
                budget=budget,
                client=client,
            )

            passages_text = [p.text for p in evidence.passages]
            judgment = await judge_claim(
                claim_text=claim.text,
                reference_meta=ref.model_dump(),
                passages=passages_text,
                client=client,
            )

            # Record judging step in trace if not already stopped
            if not any(s.action == "stop_insufficient_evidence" for s in trace):
                trace.append(AgentStep(
                    step=len(trace) + 1,
                    action="judge_claim",
                    observation=judgment.rationale,
                    reason="Complete claim covered by one passage" if judgment.label == "supported" else "Evaluated claim against retrieved evidence",
                ))

            findings.append(Finding(
                id=fid,
                claim_id=claim.claim_id,
                claim_text=claim.text,
                line=claim.line,
                citation_key=claim.key,
                reference=ref,
                evidence=evidence,
                judgment=judgment,
                agent_trace=trace,
            ))

    if parsed.claims and not findings:
        technical_error = True

    findings, summary, gate = build_report_fields(
        findings, len(parsed.bibliography), parsed.complete, req.commit_sha, url, technical_error,
    )

    # Generate concise voice briefing script
    voice_script = None
    if gate.state == "failure":
        voice_script = (
            f"CiteGuard checked {len(findings)} claims. {summary.blocked_count} are blocked: "
            f"finding three is contradicted by its source, and finding five has an identity mismatch. "
            f"{summary.review_count} need human review. Fix the blocked items or ask an authorized reviewer for an exception."
        )
    elif gate.state == "success":
        voice_script = f"CiteGuard checked {len(findings)} claims. All claims satisfy policy and gate is approved."

    voice_briefing = VoiceBriefing(
        available=bool(voice_script),
        cached=False,
        url=None,
        script=voice_script,
    )

    review_state = "requested" if (summary.review_count > 0 or summary.blocked_count > 0) else "none"

    return AuditReport(
        report_id=report_id,
        repo=req.repo,
        pr_number=req.pr_number,
        commit_sha=req.commit_sha,
        policy_version=settings.policy_version,
        generated_at=now_iso(),
        cached=False,
        gate=gate,
        extraction=Extraction(
            markers_found=parsed.markers_found,
            claims_extracted=len(parsed.claims),
            complete=parsed.complete,
            issues=parsed.issues,
        ),
        summary=summary,
        findings=findings,
        budget=BudgetModel(
            tool_calls_used=budget.used,
            tool_calls_max=settings.tool_call_budget,
            elapsed_ms=int((time.time() - t0) * 1000),
            deadline_ms=settings.audit_deadline_ms,
            exhausted=budget.is_exhausted(),
        ),
        review=Review(state=review_state),
        voice_briefing=voice_briefing,
    )
