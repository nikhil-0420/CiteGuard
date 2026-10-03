

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") === "true";
const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const isMock = USE_MOCK;
export const apiUrl = API;

export class ApiFail extends Error {
  constructor(status, code, message) {
    super(message);this.status = status;this.code = code;
    this.name = "ApiFail";
  }
}

const LOCAL_AUDITS_KEY = "citeguard_local_audits";

function getLocalAudits() {
  try {
    const raw = localStorage.getItem(LOCAL_AUDITS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalAudit(report) {
  const all = getLocalAudits();
  all[report.report_id] = report;
  localStorage.setItem(LOCAL_AUDITS_KEY, JSON.stringify(all));
}

export function resetDemoAudits() {
  localStorage.removeItem(LOCAL_AUDITS_KEY);
}

export async function listReports() {
  let baseReports = [];
  try {
    const r = await fetch(USE_MOCK ? "/mock/reports-index.json" : `${API}/api/reports`);
    if (r.ok) {
      const data = await r.json();
      baseReports = data.reports || [];
    }
  } catch (err) {
    if (!USE_MOCK) throw new ApiFail(503, "network_error", "Failed to connect to backend");
  }

  // Include user-created local audits if in mock mode
  const local = getLocalAudits();
  const localList = Object.values(local).map((r) => ({
    report_id: r.report_id,
    repo: r.repo,
    pr_number: r.pr_number,
    commit_sha: r.commit_sha,
    gate_state: r.gate.state,
    generated_at: r.generated_at
  }));

  // Deduplicate and sort newest first
  const combined = [...localList, ...baseReports];
  const seen = new Set();
  return combined.filter((r) => {
    if (seen.has(r.report_id)) return false;
    seen.add(r.report_id);
    return true;
  });
}

export async function getReport(id) {
  // Check local audits first (for newly created user audits)
  const local = getLocalAudits();
  if (local[id]) {
    return local[id];
  }

  const r = await fetch(USE_MOCK ? `/mock/report-${id}.json` : `${API}/api/reports/${id}`);
  if (!r.ok) {
    throw new ApiFail(r.status, "not_found", `Report "${id}" not found`);
  }
  return r.json();
}

export async function submitAudit(req) {
  if (!USE_MOCK) {
    const r = await fetch(`${API}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req)
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new ApiFail(r.status, err.detail?.code || "bad_request", err.detail?.error || "Audit failed to submit");
    }
    return r.json();
  }

  // Deterministic local simulation of new audit run in mock mode
  const reportId = `audit-${Date.now().toString(36)}`;
  const hasMarkers = req.markdown.includes("[@");
  const hasBib = req.markdown.includes("```bibliography");
  const isErr = !hasBib || !hasMarkers;

  const simulatedReport = {
    contract_version: "1.0",
    report_id: reportId,
    repo: req.repo || "nikhil-0420/citeguard-demo",
    pr_number: req.pr_number || 2,
    commit_sha: req.commit_sha || "e4d2a1b9c87f6504321e0987a6b5c4d3e2f10987",
    policy_version: "CG-2026.1",
    generated_at: new Date().toISOString(),
    cached: false,
    gate: isErr ?
    {
      state: "error",
      description: "Extraction incomplete: Missing bibliography block or citation markers",
      reasons: ["CG-GATE-01"],
      report_url: `http://localhost:5173/app/audits/${reportId}`
    } :
    {
      state: "pending",
      description: "2 finding(s) awaiting human review under policy rules CG-EXIST-02, CG-SUPPORT-01",
      reasons: ["CG-GATE-01"],
      report_url: `http://localhost:5173/app/audits/${reportId}`
    },
    extraction: {
      markers_found: hasMarkers ? 3 : 0,
      claims_extracted: hasMarkers ? 3 : 0,
      complete: !isErr,
      issues: isErr ? ["No ```bibliography block found or citation markers missing"] : []
    },
    summary: {
      references_total: hasBib ? 3 : 0,
      claims_total: hasMarkers ? 3 : 0,
      counts: {
        supported: 1,
        partial: 1,
        not_supported_in_reviewed_evidence: 0,
        contradicted: 1,
        unavailable: 0
      },
      review_count: 1,
      blocked_count: 1,
      passed_count: 1
    },
    findings: [
    {
      id: "F-001",
      claim_id: "C-001",
      claim_text: "The Transformer architecture relies solely on attention mechanisms, removing recurrence.",
      line: 8,
      citation_key: "vaswani2017",
      reference: {
        key: "vaswani2017",
        title: "Attention Is All You Need",
        authors: ["Vaswani", "Shazeer", "Parmar", "Uszkoreit", "Jones", "Gomez", "Kaiser", "Polosukhin"],
        year: 2017,
        doi: "10.48550/arXiv.1706.03762",
        status: "matched",
        sources_agreeing: ["crossref", "arxiv"],
        mismatch_fields: []
      },
      evidence: {
        availability: "available",
        corpus: "arxiv_html",
        passages: [
        {
          text: "We propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output.",
          locator: { section: "Abstract", paragraph: 1 },
          quote_validated: true
        }]

      },
      judgment: {
        label: "supported",
        rationale: "Retrieved abstract explicitly confirms the model relies entirely on attention without recurrence."
      },
      rules_applied: ["CG-SUPPORT-01"],
      action: "pass",
      exception: null,
      agent_trace: [
      {
        step: 1,
        action: "resolve_identifier",
        observation: "Resolved DOI 10.48550/arXiv.1706.03762 in Crossref registry.",
        reason: "Match citation key against bibliography."
      },
      {
        step: 2,
        action: "fetch_fulltext",
        observation: "Retrieved arXiv HTML abstract.",
        reason: "Extract author passage for claim verification."
      },
      {
        step: 3,
        action: "judge_claim",
        observation: "Passage contains verbatim claim entailment.",
        reason: "Deterministic quote validation succeeded."
      }]

    },
    {
      id: "F-002",
      claim_id: "C-002",
      claim_text: "Agentic verification loops reduce unsupported citations in scientific drafts by 40 percent.",
      line: 19,
      citation_key: "lee2026agentic",
      reference: {
        key: "lee2026agentic",
        title: "Agentic Verification Loops for Scientific Writing",
        authors: ["Lee"],
        year: 2026,
        doi: null,
        status: "unresolved",
        sources_agreeing: [],
        mismatch_fields: [],
        note: "Publication year 2026 implies recent preprint indexing lag (CG-EXIST-02)."
      },
      evidence: {
        availability: "unavailable",
        corpus: "none",
        passages: []
      },
      judgment: {
        label: "unavailable",
        rationale: "Reference not found in Crossref or arXiv. Publication year >= 2025 triggers indexing lag review."
      },
      rules_applied: ["CG-EXIST-01", "CG-EXIST-02"],
      action: "review",
      exception: null,
      agent_trace: [
      {
        step: 1,
        action: "resolve_identifier",
        observation: "Query returned 0 hits across all allowed hosts.",
        reason: "Attempted exact title search in Crossref."
      },
      {
        step: 2,
        action: "stop_insufficient_evidence",
        observation: "Budget halted after exhausted search retries.",
        reason: "Escalate to human review rather than fabricating result."
      }]

    },
    {
      id: "F-003",
      claim_id: "C-003",
      claim_text: "Self-attention alone is sufficient to model sequence transduction.",
      line: 18,
      citation_key: "vaswani2018",
      reference: {
        key: "vaswani2018",
        title: "Attention Is All You Need",
        authors: ["Vaswani", "Shazeer", "Parmar"],
        year: 2018,
        doi: "10.48550/arXiv.1706.03762",
        status: "metadata_mismatch",
        sources_agreeing: ["crossref"],
        mismatch_fields: ["year", "authors"],
        note: "DOI points to 2017 publication with 8 authors; citation specifies 2018 with 3 authors."
      },
      evidence: {
        availability: "available",
        corpus: "arxiv_html",
        passages: [
        {
          text: "The Transformer is the first transduction model relying entirely on self-attention to compute representations of its input and output without using sequence-aligned RNNs or convolution.",
          locator: { section: "Abstract", paragraph: 1 },
          quote_validated: true
        }]

      },
      judgment: {
        label: "supported",
        rationale: "Claim is supported by passage, but metadata mismatch on author count and year violates CG-EXIST-01."
      },
      rules_applied: ["CG-EXIST-01", "CG-SUPPORT-01"],
      action: "block",
      exception: null,
      agent_trace: [
      {
        step: 1,
        action: "resolve_identifier",
        observation: "Crossref records 8 authors published in 2017. Citation claimed 2018.",
        reason: "Validate reference identity against canonical DOI."
      }]

    }],

    budget: {
      tool_calls_used: 6,
      tool_calls_max: 20,
      elapsed_ms: 1840,
      deadline_ms: 30000,
      exhausted: false
    },
    review: {
      state: "requested",
      request_url: `http://localhost:5173/app/audits/${reportId}`
    },
    voice_briefing: {
      available: false,
      cached: false,
      url: null,
      script: null
    }
  };

  saveLocalAudit(simulatedReport);
  return { report_id: reportId };
}

// In mock mode we simulate the backend rules locally so the demo flow works with no server.
export async function addException(id, body, current) {
  if (USE_MOCK) return mockException(body, current);
  const r = await fetch(`${API}/api/reports/${id}/exceptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const d = (await r.json().catch(() => ({}))).detail ?? {};
    throw new ApiFail(r.status, d.code ?? "bad_request", d.error ?? "Request failed");
  }
  return r.json();
}

export function mockException(body, cur) {
  const allowlist = ["nikhil-0420", "sam", "nehaa"];
  if (!allowlist.includes(body.reviewer.toLowerCase().replace(/^@/, ""))) {
    throw new ApiFail(403, "not_allowlisted", `Reviewer "${body.reviewer}" is not on the authorized allowlist (${allowlist.join(", ")}).`);
  }
  if (body.commit_sha !== cur.commit_sha) {
    throw new ApiFail(409, "stale_commit", `Approval is bound to commit ${body.commit_sha.slice(0, 7)}, but report is at ${cur.commit_sha.slice(0, 7)}.`);
  }

  const next = structuredClone(cur);
  const f = next.findings.find((x) => x.id === body.finding_id);
  if (!f) throw new ApiFail(404, "not_found", `Finding "${body.finding_id}" not found.`);

  // Record exception; note that original_action is strictly preserved
  f.exception = {
    reviewer: body.reviewer,
    reason: body.reason,
    commit_sha: body.commit_sha,
    at: new Date().toISOString(),
    original_action: f.action
  };

  // Re-evaluate gate state based on remaining unexcepted findings
  const open = next.findings.filter((x) => x.action !== "pass" && !x.exception);
  const blocks = open.filter((x) => x.action === "block").length;

  next.gate = blocks ?
  {
    ...next.gate,
    state: "failure",
    description: `${blocks} blocking finding(s): contradiction or identity mismatch`,
    reasons: ["CG-GATE-01", "CG-HUMAN-01"]
  } :
  open.length ?
  {
    ...next.gate,
    state: "pending",
    description: `${open.length} finding(s) awaiting human review`,
    reasons: ["CG-GATE-01", "CG-HUMAN-01"]
  } :
  {
    ...next.gate,
    state: "success",
    description: "All claims satisfy policy with recorded reviewer exceptions",
    reasons: ["CG-GATE-01", "CG-HUMAN-01"]
  };

  next.review.state = "approved_with_exceptions";

  // If this was a local audit, persist the update
  const local = getLocalAudits();
  if (local[cur.report_id]) {
    saveLocalAudit(next);
  }

  return next;
}