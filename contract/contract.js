// CiteGuard API contract v1.0 — FROZEN. Change only via PR approved by BOTH Nikhil and Sam.
// Backend mirrors this in backend/app/models.py (pydantic). Frontend uses a synced copy
// (run scripts/sync-contract.sh after any change).

/**
 * @typedef {"success" | "pending" | "failure" | "error"} GateState
 * @typedef {"pass" | "review" | "block"} Action
 * @typedef {"matched" | "metadata_mismatch" | "unresolved"} RefStatus
 * @typedef {"available" | "incomplete" | "unavailable"} EvidenceAvailability
 * @typedef {"supported" | "partial" | "not_supported_in_reviewed_evidence" | "contradicted" | "unavailable"} Label
 * @typedef {"CG-EXIST-01" | "CG-EXIST-02" | "CG-SUPPORT-01" | "CG-GATE-01" | "CG-HUMAN-01" | "CG-ACTION-01" | "CG-TRUST-01" | "CG-DATA-01"} RuleId
 */

/**
 * @typedef {Object} Locator
 * @property {string} section
 * @property {number} [paragraph]
 */

/**
 * @typedef {Object} Passage
 * @property {string} text
 * @property {Locator} locator
 * @property {boolean} quote_validated
 */

/**
 * @typedef {Object} Reference
 * @property {string} key
 * @property {string} title
 * @property {string[]} authors
 * @property {number|null} year
 * @property {string|null} doi
 * @property {RefStatus} status
 * @property {string[]} sources_agreeing
 * @property {string[]} mismatch_fields
 * @property {string|null} [note]
 */

/**
 * @typedef {Object} AgentStep
 * @property {number} step
 * @property {string} action
 * @property {string} observation
 * @property {string} reason
 */

/**
 * @typedef {Object} Exception
 * @property {string} reviewer
 * @property {string} reason
 * @property {string} commit_sha
 * @property {string} at
 * @property {Action} original_action
 */

/**
 * @typedef {Object} Finding
 * @property {string} id
 * @property {string} claim_id
 * @property {string} claim_text
 * @property {number} line
 * @property {string} citation_key
 * @property {Reference} reference
 * @property {{ availability: EvidenceAvailability, corpus: "arxiv_html" | "europe_pmc" | "none", passages: Passage[] }} evidence
 * @property {{ label: Label, rationale: string }} judgment
 * @property {RuleId[]} rules_applied
 * @property {Action} action
 * @property {Exception|null} exception
 * @property {AgentStep[]} agent_trace
 */

/**
 * @typedef {Object} Summary
 * @property {number} references_total
 * @property {number} claims_total
 * @property {Record<Label, number>} counts
 * @property {number} review_count
 * @property {number} blocked_count
 * @property {number} passed_count
 */

/**
 * @typedef {Object} AuditReport
 * @property {"1.0"} contract_version
 * @property {string} report_id
 * @property {string} repo
 * @property {number} pr_number
 * @property {string} commit_sha
 * @property {string} policy_version
 * @property {string} generated_at
 * @property {boolean} cached
 * @property {{ state: GateState, description: string, reasons: RuleId[], report_url: string }} gate
 * @property {{ markers_found: number, claims_extracted: number, complete: boolean, issues: string[] }} extraction
 * @property {Summary} summary
 * @property {Finding[]} findings
 * @property {{ tool_calls_used: number, tool_calls_max: number, elapsed_ms: number, deadline_ms: number, exhausted: boolean }} budget
 * @property {{ state: "none" | "requested" | "approved_with_exceptions" | "stale", request_url: string | null }} review
 * @property {{ available: boolean, cached: boolean, url: string | null, script: string | null }} voice_briefing
 */

/**
 * @typedef {Object} ReportListItem
 * @property {string} report_id
 * @property {string} repo
 * @property {number} pr_number
 * @property {string} commit_sha
 * @property {GateState} gate_state
 * @property {string} generated_at
 */

/**
 * @typedef {Object} AuditRequest
 * @property {string} repo
 * @property {number} pr_number
 * @property {string} commit_sha
 * @property {string} markdown
 */

/**
 * @typedef {Object} ExceptionRequest
 * @property {string} finding_id
 * @property {string} reviewer
 * @property {string} reason
 * @property {string} commit_sha
 */

/**
 * @typedef {Object} ApiError
 * @property {string} error
 * @property {"stale_commit" | "not_allowlisted" | "not_found" | "bad_request" | "duplicate"} code
 */

/**
 * @typedef {Object} N8nEvent
 * @property {"audit_complete" | "exception_recorded"} event
 * @property {string} idempotency_key
 * @property {AuditReport} report
 */

export {};
