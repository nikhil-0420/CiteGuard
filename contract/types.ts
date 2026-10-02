// CiteGuard API contract v1.0 — FROZEN. Change only via PR approved by BOTH Nikhil and Sam.
// Backend mirrors this in backend/app/models.py (pydantic). Frontend uses a synced copy
// (run scripts/sync-contract.sh after any change).

export type GateState = "success" | "pending" | "failure" | "error"; // GitHub commit status states
export type Action = "pass" | "review" | "block";
export type RefStatus = "matched" | "metadata_mismatch" | "unresolved";
export type EvidenceAvailability = "available" | "incomplete" | "unavailable";
export type Label =
  | "supported"
  | "partial"
  | "not_supported_in_reviewed_evidence"
  | "contradicted"
  | "unavailable";

export type RuleId =
  | "CG-EXIST-01" | "CG-EXIST-02" | "CG-SUPPORT-01" | "CG-GATE-01"
  | "CG-HUMAN-01" | "CG-ACTION-01" | "CG-TRUST-01" | "CG-DATA-01";

export interface Locator { section: string; paragraph?: number }

export interface Passage {
  text: string;
  locator: Locator;
  quote_validated: boolean; // true only if text occurs verbatim in retrieved source (provenance, NOT entailment)
}

export interface Reference {
  key: string;
  title: string;
  authors: string[];
  year: number | null;
  doi: string | null;
  status: RefStatus;
  sources_agreeing: string[];   // e.g. ["crossref"] — provenance, NOT votes/confidence
  mismatch_fields: string[];    // e.g. ["year","authors"]
  note?: string | null;
}

export interface AgentStep {
  step: number;
  action: string;   // reformulate_title_query | resolve_identifier | inspect_more_context | stop_insufficient_evidence | fetch_fulltext | judge_claim
  observation: string;
  reason: string;   // short reason, NOT chain-of-thought
}

export interface Exception {
  reviewer: string;        // allowlisted GitHub login
  reason: string;
  commit_sha: string;      // MUST equal audited commit (CG-HUMAN-01)
  at: string;              // ISO timestamp
  original_action: Action; // original finding is preserved
}

export interface Finding {
  id: string;              // "F-001"
  claim_id: string;        // "C-001"
  claim_text: string;
  line: number;
  citation_key: string;
  reference: Reference;
  evidence: {
    availability: EvidenceAvailability;
    corpus: "arxiv_html" | "europe_pmc" | "none";
    passages: Passage[];
  };
  judgment: { label: Label; rationale: string };  // rationale <= ~280 chars
  rules_applied: RuleId[];
  action: Action;          // result of deterministic policy
  exception: Exception | null;
  agent_trace: AgentStep[];
}

export interface Summary {
  references_total: number;
  claims_total: number;
  counts: Record<Label, number>;
  review_count: number;
  blocked_count: number;
  passed_count: number;
}

export interface AuditReport {
  contract_version: "1.0";
  report_id: string;
  repo: string;
  pr_number: number;
  commit_sha: string;
  policy_version: string;
  generated_at: string;
  cached: boolean;         // true => never present as a fresh API call
  gate: { state: GateState; description: string; reasons: RuleId[]; report_url: string };
  extraction: { markers_found: number; claims_extracted: number; complete: boolean; issues: string[] };
  summary: Summary;
  findings: Finding[];
  budget: { tool_calls_used: number; tool_calls_max: number; elapsed_ms: number; deadline_ms: number; exhausted: boolean };
  review: { state: "none" | "requested" | "approved_with_exceptions" | "stale"; request_url: string | null };
  voice_briefing: { available: boolean; cached: boolean; url: string | null; script: string | null };
}

// ---- Endpoints (all JSON) ----
// GET  /health                      -> { ok: true, mock_mode: boolean }
// GET  /api/reports                 -> { reports: ReportListItem[] }
// GET  /api/reports/{report_id}     -> AuditReport
// POST /api/audit                   body AuditRequest -> { report_id }  (poll GET until done)
// POST /api/reports/{id}/exceptions body ExceptionRequest -> AuditReport (gate re-evaluated)
//                                   409 stale_commit | 403 not_allowlisted | 404 not_found
// POST /webhooks/github             GitHub PR event (HMAC X-Hub-Signature-256) -> 202
// OUTBOUND: audit service POSTs N8nEvent to N8N_WEBHOOK_URL after every audit and every recorded exception.
//           Header X-CiteGuard-Signature = HMAC-SHA256 hex of the raw body using N8N_SHARED_SECRET.
export interface ReportListItem {
  report_id: string; repo: string; pr_number: number; commit_sha: string; gate_state: GateState; generated_at: string;
}
export interface AuditRequest { repo: string; pr_number: number; commit_sha: string; markdown: string }
export interface ExceptionRequest { finding_id: string; reviewer: string; reason: string; commit_sha: string }
export interface ApiError { error: string; code: "stale_commit" | "not_allowlisted" | "not_found" | "bad_request" | "duplicate" }

export interface N8nEvent { event: "audit_complete" | "exception_recorded"; idempotency_key: string; report: AuditReport }
// idempotency_key = `${repo}#${pr_number}@${commit_sha}:${event}:${exception_count}` — n8n must dedupe on it.
