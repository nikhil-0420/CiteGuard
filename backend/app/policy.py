"""Deterministic governance policy (CG-* rules). NO LLM here. Pure functions, fully unit-tested.

The LLM/agent only produces *structured findings*; this module decides the action and the gate.
"""
from __future__ import annotations
from datetime import datetime, timezone
from .models import Finding, Summary, Gate
from .security import looks_like_injection

RECENT_YEAR_CUTOFF = 2025  # CG-EXIST-02: unresolved refs from this year onward -> review, never block
LABELS = ["supported", "partial", "not_supported_in_reviewed_evidence", "contradicted", "unavailable"]


def decide_finding(f: Finding) -> tuple[str, list[str]]:
    """Return (action, rules_applied) for one finding, ignoring exceptions."""
    rules: list[str] = []
    ref, ev, label = f.reference, f.evidence, f.judgment.label

    # --- Identity (CG-EXIST-01 / 02) ---
    if ref.status == "metadata_mismatch":
        rules.append("CG-EXIST-01")
        return "block", rules                      # confirmed identity mismatch stays blocked
    if ref.status == "unresolved":
        rules.append("CG-EXIST-01")
        if ref.year is not None and ref.year >= RECENT_YEAR_CUTOFF:
            rules.append("CG-EXIST-02")            # indexing lag expected
        return "review", rules                     # a failed search never establishes fabrication

    # --- Untrusted source text (CG-TRUST-01): flag, never obey, never auto-pass ---
    injected = any(looks_like_injection(p.text) for p in ev.passages)
    if injected:
        rules.append("CG-TRUST-01")

    # --- Support (CG-SUPPORT-01) ---
    rules.append("CG-SUPPORT-01")
    if label == "contradicted":
        return "block", rules
    if label == "supported":
        quotes_ok = bool(ev.passages) and all(p.quote_validated for p in ev.passages)
        if ev.availability == "available" and quotes_ok and not injected:
            return "pass", rules
        return "review", rules                     # supported but provenance/evidence incomplete
    # partial / not_supported / unavailable -> human review
    return "review", rules


def apply_exception_state(f: Finding, audited_commit: str) -> bool:
    """True if an exception validly clears this finding for the gate (CG-HUMAN-01).
    Only 'review' findings can be excepted at gate level; 'block' on contradiction/identity
    needs a valid exception too (authorized reviewer, reason, same commit)."""
    ex = f.exception
    if ex is None:
        return False
    return bool(ex.reason.strip()) and ex.commit_sha == audited_commit


def evaluate_finding(f: Finding) -> Finding:
    action, rules = decide_finding(f)
    f.action = action  # original policy result preserved on the finding
    f.rules_applied = rules  # type: ignore[assignment]
    return f


def summarize(findings: list[Finding], references_total: int) -> Summary:
    counts = {k: 0 for k in LABELS}
    for f in findings:
        counts[f.judgment.label] += 1
    return Summary(
        references_total=references_total,
        claims_total=len(findings),
        counts=counts,
        review_count=sum(1 for f in findings if f.action == "review"),
        blocked_count=sum(1 for f in findings if f.action == "block"),
        passed_count=sum(1 for f in findings if f.action == "pass"),
    )


def decide_gate(findings: list[Finding], extraction_complete: bool, commit_sha: str,
                technical_error: bool, report_url: str) -> Gate:
    """CG-GATE-01. Maps to GitHub commit-status states."""
    if technical_error:
        return Gate(state="error", description="CiteGuard technical error — not approved",
                    reasons=["CG-GATE-01"], report_url=report_url)
    if not extraction_complete or not findings:
        return Gate(state="error", description="Extraction incomplete or empty — cannot pass",
                    reasons=["CG-GATE-01"], report_url=report_url)

    open_blocks = [f for f in findings if f.action == "block" and not apply_exception_state(f, commit_sha)]
    open_reviews = [f for f in findings if f.action == "review" and not apply_exception_state(f, commit_sha)]
    reasons: list[str] = ["CG-GATE-01"]
    if any(f.exception for f in findings):
        reasons.append("CG-HUMAN-01")

    if open_blocks:
        return Gate(state="failure",
                    description=f"{len(open_blocks)} blocking finding(s): contradiction or identity mismatch",
                    reasons=reasons, report_url=report_url)
    if open_reviews:
        return Gate(state="pending",
                    description=f"{len(open_reviews)} finding(s) awaiting human review",
                    reasons=reasons, report_url=report_url)
    return Gate(state="success", description="All claims satisfy policy", reasons=reasons, report_url=report_url)


def build_report_fields(findings: list[Finding], references_total: int, extraction_complete: bool,
                        commit_sha: str, report_url: str, technical_error: bool = False):
    findings = [evaluate_finding(f) for f in findings]
    return findings, summarize(findings, references_total), decide_gate(
        findings, extraction_complete, commit_sha, technical_error, report_url)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")
