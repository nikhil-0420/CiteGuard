import type { AuditReport, ExceptionRequest, ReportListItem } from "./contract/types";

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") === "true";
const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const isMock = USE_MOCK;

export class ApiFail extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export async function listReports(): Promise<ReportListItem[]> {
  const r = await fetch(USE_MOCK ? "/mock/reports-index.json" : `${API}/api/reports`);
  if (!r.ok) throw new ApiFail(r.status, "bad_request", "Could not list reports");
  return (await r.json()).reports;
}

export async function getReport(id: string): Promise<AuditReport> {
  const r = await fetch(USE_MOCK ? `/mock/report-${id}.json` : `${API}/api/reports/${id}`);
  if (!r.ok) throw new ApiFail(r.status, "not_found", `Report "${id}" not found`);
  return r.json();
}

// In mock mode we simulate the backend rules locally so the demo flow works with no server.
export async function addException(id: string, body: ExceptionRequest, current: AuditReport): Promise<AuditReport> {
  if (USE_MOCK) return mockException(body, current);
  const r = await fetch(`${API}/api/reports/${id}/exceptions`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!r.ok) {
    const d = (await r.json().catch(() => ({}))).detail ?? {};
    throw new ApiFail(r.status, d.code ?? "bad_request", d.error ?? "Request failed");
  }
  return r.json();
}

function mockException(body: ExceptionRequest, cur: AuditReport): AuditReport {
  if (!["nikhil-0420", "sam", "nehaa"].includes(body.reviewer.toLowerCase()))
    throw new ApiFail(403, "not_allowlisted", "Reviewer is not on the allowlist");
  if (body.commit_sha !== cur.commit_sha) throw new ApiFail(409, "stale_commit", "Approval is bound to a different commit");
  const next: AuditReport = structuredClone(cur);
  const f = next.findings.find((x) => x.id === body.finding_id);
  if (!f) throw new ApiFail(404, "not_found", "Finding not found");
  f.exception = { reviewer: body.reviewer, reason: body.reason, commit_sha: body.commit_sha, at: new Date().toISOString(), original_action: f.action };
  const open = next.findings.filter((x) => x.action !== "pass" && !x.exception);
  const blocks = open.filter((x) => x.action === "block").length;
  next.gate = blocks
    ? { ...next.gate, state: "failure", description: `${blocks} blocking finding(s): contradiction or identity mismatch`, reasons: ["CG-GATE-01", "CG-HUMAN-01"] }
    : open.length
      ? { ...next.gate, state: "pending", description: `${open.length} finding(s) awaiting human review`, reasons: ["CG-GATE-01", "CG-HUMAN-01"] }
      : { ...next.gate, state: "success", description: "All claims satisfy policy", reasons: ["CG-GATE-01", "CG-HUMAN-01"] };
  next.review.state = "approved_with_exceptions";
  return next;
}
