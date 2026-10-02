"""Pydantic mirror of contract/types.ts. Keep in lockstep; contract is FROZEN."""
from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field

GateState = Literal["success", "pending", "failure", "error"]
Action = Literal["pass", "review", "block"]
RefStatus = Literal["matched", "metadata_mismatch", "unresolved"]
EvidenceAvailability = Literal["available", "incomplete", "unavailable"]
Label = Literal["supported", "partial", "not_supported_in_reviewed_evidence", "contradicted", "unavailable"]
RuleId = Literal[
    "CG-EXIST-01", "CG-EXIST-02", "CG-SUPPORT-01", "CG-GATE-01",
    "CG-HUMAN-01", "CG-ACTION-01", "CG-TRUST-01", "CG-DATA-01",
]


class Locator(BaseModel):
    section: str
    paragraph: Optional[int] = None


class Passage(BaseModel):
    text: str
    locator: Locator
    quote_validated: bool


class Reference(BaseModel):
    key: str
    title: str
    authors: list[str] = []
    year: Optional[int] = None
    doi: Optional[str] = None
    status: RefStatus
    sources_agreeing: list[str] = []
    mismatch_fields: list[str] = []
    note: Optional[str] = None


class AgentStep(BaseModel):
    step: int
    action: str
    observation: str
    reason: str


class Exception_(BaseModel):
    reviewer: str
    reason: str
    commit_sha: str
    at: str
    original_action: Action


class Evidence(BaseModel):
    availability: EvidenceAvailability
    corpus: Literal["arxiv_html", "europe_pmc", "none"]
    passages: list[Passage] = []


class Judgment(BaseModel):
    label: Label
    rationale: str = Field(max_length=400)


class Finding(BaseModel):
    id: str
    claim_id: str
    claim_text: str
    line: int
    citation_key: str
    reference: Reference
    evidence: Evidence
    judgment: Judgment
    rules_applied: list[RuleId] = []
    action: Action = "review"
    exception: Optional[Exception_] = None
    agent_trace: list[AgentStep] = []


class Summary(BaseModel):
    references_total: int
    claims_total: int
    counts: dict[str, int]
    review_count: int
    blocked_count: int
    passed_count: int


class Gate(BaseModel):
    state: GateState
    description: str
    reasons: list[RuleId] = []
    report_url: str


class Extraction(BaseModel):
    markers_found: int
    claims_extracted: int
    complete: bool
    issues: list[str] = []


class Budget(BaseModel):
    tool_calls_used: int
    tool_calls_max: int
    elapsed_ms: int
    deadline_ms: int
    exhausted: bool


class Review(BaseModel):
    state: Literal["none", "requested", "approved_with_exceptions", "stale"] = "none"
    request_url: Optional[str] = None


class VoiceBriefing(BaseModel):
    available: bool = False
    cached: bool = False
    url: Optional[str] = None
    script: Optional[str] = None


class AuditReport(BaseModel):
    contract_version: Literal["1.0"] = "1.0"
    report_id: str
    repo: str
    pr_number: int
    commit_sha: str
    policy_version: str
    generated_at: str
    cached: bool = False
    gate: Gate
    extraction: Extraction
    summary: Summary
    findings: list[Finding]
    budget: Budget
    review: Review
    voice_briefing: VoiceBriefing


class AuditRequest(BaseModel):
    repo: str
    pr_number: int
    commit_sha: str
    markdown: str


class ExceptionRequest(BaseModel):
    finding_id: str
    reviewer: str
    reason: str = Field(min_length=3)
    commit_sha: str
