import { useEffect, useState } from "react";
import type { AuditReport } from "../contract/types";
import { getReport } from "../api";
import { GateBanner } from "../components/GateBanner";
import { SummaryBar } from "../components/SummaryBar";
import { FindingCard } from "../components/FindingCard";
import { VoiceBriefing } from "../components/VoiceBriefing";

export default function ReportPage({ id }: { id: string }) {
  const [r, setR] = useState<AuditReport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "block" | "review" | "pass">("all");

  useEffect(() => {
    setR(null); setErr(null);
    getReport(id).then(setR).catch((e) => setErr(String(e.message ?? e)));
  }, [id]);

  if (err) return <div className="notice">{err}</div>;
  if (!r) return <div className="muted">Loading report…</div>;

  const shown = r.findings.filter((f) => filter === "all" || f.action === filter);
  return (
    <div className="stack">
      <GateBanner r={r} />
      {!r.extraction.complete && (
        <div className="notice">
          <b>Extraction incomplete — this can never pass (CG-GATE-01).</b>
          <div className="muted">{r.extraction.claims_extracted} claims extracted from {r.extraction.markers_found} markers.</div>
          <ul>{r.extraction.issues.map((i) => <li key={i}>{i}</li>)}</ul>
        </div>
      )}
      <SummaryBar r={r} />
      <VoiceBriefing r={r} />
      <div className="row">
        {(["all", "block", "review", "pass"] as const).map((k) => (
          <button key={k} className={`tab ${filter === k ? "active" : ""}`} onClick={() => setFilter(k)}>{k}</button>
        ))}
      </div>
      <div className="stack">
        {shown.map((f) => <FindingCard key={f.id} report={r} f={f} onUpdated={setR} />)}
        {shown.length === 0 && <div className="muted">No findings in this view.</div>}
      </div>
      <div className="muted">
        Database agreement is shown as provenance, not as independent votes or calibrated confidence. “Not supported” is limited to the evidence inspected.
        Quote validation checks provenance, not semantic correctness.
      </div>
    </div>
  );
}
