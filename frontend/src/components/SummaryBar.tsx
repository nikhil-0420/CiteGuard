import type { AuditReport } from "../contract/types";

export function SummaryBar({ r }: { r: AuditReport }) {
  const s = r.summary;
  const items: [string, number][] = [
    ["Claims", s.claims_total], ["References", s.references_total], ["Auto-pass", s.passed_count],
    ["Needs review", s.review_count], ["Blocked", s.blocked_count],
  ];
  const b = r.budget;
  return (
    <div className="stack">
      <div className="stats">
        {items.map(([k, v]) => <div className="stat" key={k}><b>{v}</b><span className="muted">{k}</span></div>)}
      </div>
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="muted">Tool-call budget</span>
          <span className="mono">{b.tool_calls_used}/{b.tool_calls_max} calls · {(b.elapsed_ms / 1000).toFixed(1)}s of {(b.deadline_ms / 1000).toFixed(0)}s{b.exhausted ? " · exhausted → review" : ""}</span>
        </div>
        <div className="bar" style={{ marginTop: 8 }}><i style={{ width: `${Math.min(100, (b.tool_calls_used / b.tool_calls_max) * 100)}%` }} /></div>
      </div>
    </div>
  );
}
