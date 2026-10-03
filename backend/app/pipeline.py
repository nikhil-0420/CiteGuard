"""Orchestrates one audit: parse -> (agent per claim) -> policy -> report."""
from __future__ import annotations
import asyncio
import time
import uuid
from typing import Optional
import httpx

from .models import (
    AuditReport,
    AuditRequest,
    Finding,
    Summary,
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


def generate_voice_script(findings: list[Finding], summary: Summary, gate_state: str) -> Optional[str]:
    """Dynamically generate concise, professional audio briefing text for any document."""
    total = len(findings)
    if not total:
        return None

    if gate_state == "failure":
        blocked_findings = [f for f in findings if f.action == "block"]
        reasons_list = []
        for f in blocked_findings[:2]:
            fid_word = f.id.lower().replace("-", " ")
            if f.judgment.label == "contradicted":
                reasons_list.append(f"{fid_word} is contradicted by its source")
            elif f.reference.status == "metadata_mismatch":
                reasons_list.append(f"{fid_word} has an identity mismatch")
            elif "CG-TRUST-01" in f.rules_applied:
                reasons_list.append(f"{fid_word} contains untrusted prompt injection")
            else:
                reasons_list.append(f"{fid_word} violates policy")

        reasons_str = ", and ".join(reasons_list) if reasons_list else "blocked by policy"
        review_mention = f" {summary.review_count} need human review." if summary.review_count > 0 else ""
        return (
            f"CiteGuard checked {total} claims. {summary.blocked_count} are blocked: {reasons_str}."
            f"{review_mention} Fix the blocked items or ask an authorized reviewer for an exception."
        )
    elif gate_state == "pending":
        review_findings = [f for f in findings if f.action == "review"]
        first_few = [f.id.lower().replace("-", " ") for f in review_findings[:2]]
        mention = " and ".join(first_few) if first_few else "several findings"
        return (
            f"CiteGuard checked {total} claims. {summary.review_count} require human sign-off, "
            f"including {mention}. An authorized reviewer must record an exception before merge."
        )
    elif gate_state == "success":
        return f"CiteGuard checked {total} claims. All claims satisfy policy and gate is approved."
    elif gate_state == "error":
        return "CiteGuard extraction error: citation markers could not be fully parsed. Automated gate cannot pass."
    return None


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
        async def _audit_single_claim(idx: int, claim) -> Finding:
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

            return Finding(
                id=fid,
                claim_id=claim.claim_id,
                claim_text=claim.text,
                line=claim.line,
                citation_key=claim.key,
                reference=ref,
                evidence=evidence,
                judgment=judgment,
                agent_trace=trace,
            )

        if parsed.claims:
            claim_tasks = [_audit_single_claim(idx, claim) for idx, claim in enumerate(parsed.claims, start=1)]
            findings = await asyncio.gather(*claim_tasks)
            findings = list(findings)

    if parsed.claims and not findings:
        technical_error = True

    findings, summary, gate = build_report_fields(
        findings, len(parsed.bibliography), parsed.complete, req.commit_sha, url, technical_error,
    )

    # Dynamically generated concise voice briefing script
    voice_script = generate_voice_script(findings, summary, gate.state)

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
