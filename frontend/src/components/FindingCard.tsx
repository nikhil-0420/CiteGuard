import { useState } from "react";
import type { AuditReport, Finding } from "../contract/types";
import { Chip, pretty } from "./Chip";
import { AgentTrace } from "./AgentTrace";
import { ExceptionForm } from "./ExceptionForm";

export function FindingCard({ report, f, onUpdated }: { report: AuditReport; f: Finding; onUpdated: (r: AuditReport) => void }) {
  const [trace, setTrace] = useState(false);
  const ref = f.reference;
  const canExcept = f.action !== "pass" && !f.exception;
  return (
    <div className={`card finding ${f.action}`}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row"><span className="mono">{f.id}</span><Chip kind={f.action}>{f.action}</Chip>
          {f.exception && <Chip kind="rule">excepted by {f.exception.reviewer}</Chip>}</div>
        <span className="muted mono">line {f.line} · [@{f.citation_key}]</span>
      </div>
      <div className="claim">“{f.claim_text}”</div>

      <div className="grid3">
        <div className="col">
          <h3>1 · Identity</h3>
          <Chip kind={ref.status}>{pretty(ref.status)}</Chip>
          <div style={{ marginTop: 6 }}>{ref.title}</div>
          <div className="muted">{ref.authors.slice(0, 3).join(", ")}{ref.authors.length > 3 ? " et al." : ""} · {ref.year ?? "n/a"}</div>
          {ref.doi && <div className="mono muted">doi:{ref.doi}</div>}
          {ref.mismatch_fields.length > 0 && <div className="muted">mismatch: {ref.mismatch_fields.join(", ")}</div>}
          {ref.sources_agreeing.length > 0 && <div className="muted">provenance: {ref.sources_agreeing.join(", ")}</div>}
          {ref.note && <div className="muted">{ref.note}</div>}
        </div>
        <div className="col">
          <h3>2 · Evidence</h3>
          <Chip kind={f.evidence.availability}>{f.evidence.availability}</Chip> <span className="muted">{f.evidence.corpus}</span>
          {f.evidence.passages.map((p, i) => (
            <div key={i} className={`passage ${f.rules_applied.includes("CG-TRUST-01") ? "warn" : ""}`}>
              {p.text}
              <div className="muted mono">{p.locator.section}{p.locator.paragraph ? ` ¶${p.locator.paragraph}` : ""} · {p.quote_validated ? "quote found in source" : "quote NOT validated"}</div>
            </div>
          ))}
          {f.evidence.passages.length === 0 && <div className="muted" style={{ marginTop: 6 }}>No passages retrieved.</div>}
        </div>
        <div className="col">
          <h3>3 · Judgment</h3>
          <Chip kind={f.judgment.label}>{pretty(f.judgment.label)}</Chip>
          <div style={{ marginTop: 6 }}>{f.judgment.rationale}</div>
          <div className="row" style={{ marginTop: 8 }}>{f.rules_applied.map((x) => <Chip key={x} kind="rule">{x}</Chip>)}</div>
          {f.rules_applied.includes("CG-TRUST-01") && <div className="muted" style={{ marginTop: 6 }}>Instruction-like text in the source was treated as data and ignored.</div>}
        </div>
      </div>

      {f.exception && (
        <div className="notice info">
          Exception recorded by <b>{f.exception.reviewer}</b> on commit <span className="mono">{f.exception.commit_sha.slice(0, 7)}</span> — “{f.exception.reason}”. Original policy result: <b>{f.exception.original_action}</b>.
        </div>
      )}

      <div className="row">
        <button className="btn ghost" onClick={() => setTrace((v) => !v)}>{trace ? "Hide" : "Show"} agent trace ({f.agent_trace.length})</button>
      </div>
      {trace && <AgentTrace steps={f.agent_trace} />}
      {canExcept && <ExceptionForm report={report} finding={f} onUpdated={onUpdated} />}
    </div>
  );
}
