import { useState } from "react";
import type { AuditReport, Finding } from "../contract/types";
import { addException, ApiFail } from "../api";

// CG-HUMAN-01: authenticated allowlisted reviewer + reason + audited commit id. Original finding is preserved.
export function ExceptionForm({ report, finding, onUpdated }: { report: AuditReport; finding: Finding; onUpdated: (r: AuditReport) => void }) {
  const [reviewer, setReviewer] = useState("nikhil-0420");
  const [reason, setReason] = useState("");
  const [commit, setCommit] = useState(report.commit_sha);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setErr(null);
    try {
      onUpdated(await addException(report.report_id, { finding_id: finding.id, reviewer, reason, commit_sha: commit }, report));
    } catch (e) {
      setErr(e instanceof ApiFail ? `${e.status} ${e.code}: ${e.message}` : String(e));
    } finally { setBusy(false); }
  }

  return (
    <div className="form">
      <strong>Reviewer exception</strong>
      <div className="grid3">
        <label>Reviewer (GitHub login)<input value={reviewer} onChange={(e) => setReviewer(e.target.value)} /></label>
        <label>Audited commit<input className="mono" value={commit} onChange={(e) => setCommit(e.target.value)} /></label>
        <label>Reason<input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this acceptable?" /></label>
      </div>
      {err && <div className="notice">{err}</div>}
      <div className="row">
        <button className="btn" disabled={busy || reason.trim().length < 3} onClick={submit}>Record exception</button>
        <span className="muted">Original finding is preserved. Approval is bound to this commit.</span>
      </div>
    </div>
  );
}
