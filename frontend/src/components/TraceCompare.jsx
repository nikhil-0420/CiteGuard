
import { AgentTrace } from "./AgentTrace";
import { Chip } from "./Chip";
import { SplitIcon, XCircleIcon, AlertTriangleIcon } from "./Icons";

export function TraceCompare({
  report,
  onClose



}) {
  // Locate F-003 and F-006 in findings
  const f3 = report.findings.find((f) => f.id === "F-003");
  const f6 = report.findings.find((f) => f.id === "F-006");

  return (
    <div className="trace-compare-container">
      <div className="trace-compare-header">
        <div>
          <div className="trace-compare-title">
            <SplitIcon size={20} style={{ color: "var(--accent-blue)" }} />
            Autonomous Agent Retrieval Path Comparison
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "2px" }}>
            Comparing two distinct agent strategies: Context Expansion vs Budget-Bounded Abstention
          </div>
        </div>
        {onClose &&
        <button type="button" className="btn ghost" onClick={onClose}>
            Close Comparison
          </button>
        }
      </div>

      <div className="trace-compare-grid">
        {/* Left Column: F-003 Deep Context Inspection */}
        <div className="trace-compare-column block">
          <div className="trace-col-headline">
            <div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-tertiary)" }}>
                Finding F-003
              </span>
              <div className="trace-col-title">Deep Context Inspection (inspect_more_context)</div>
            </div>
            <Chip kind="block" icon>Blocked</Chip>
          </div>

          <div style={{ fontStyle: "italic", fontSize: "13px", color: "var(--text-primary)" }}>
            “{f3 ? f3.claim_text : "ResNets reach under 2% top-5 error on the ImageNet test set."}”
          </div>

          <div className="trace-behavior-summary">
            <strong>Agent Strategy:</strong> Abstract alone could mislead. The agent actively invoked{" "}
            <code>inspect_more_context</code> to verify the full results table in the paper, discovering that 3.57%
            opposes the claimed &lt;2% figure.
          </div>

          {f3 ?
          <AgentTrace steps={f3.agent_trace} /> :

          <div style={{ color: "var(--text-tertiary)", fontStyle: "italic" }}>
              F-003 not present in this report.
            </div>
          }
        </div>

        {/* Right Column: F-006 Reformulation & Budget Stop */}
        <div className="trace-compare-column review">
          <div className="trace-col-headline">
            <div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-tertiary)" }}>
                Finding F-006
              </span>
              <div className="trace-col-title">Reformulation & Budget Stop (stop_insufficient_evidence)</div>
            </div>
            <Chip kind="review" icon>Needs Review</Chip>
          </div>

          <div style={{ fontStyle: "italic", fontSize: "13px", color: "var(--text-primary)" }}>
            “{f6 ? f6.claim_text : "Agentic verification loops reduce unsupported citations in scientific drafts by 40 percent."}”
          </div>

          <div className="trace-behavior-summary">
            <strong>Agent Strategy:</strong> Query returned 0 Crossref hits. The agent attempted two title reformulations,
            then triggered <code>stop_insufficient_evidence</code> to avoid hallucinating, routing directly to human review.
          </div>

          {f6 ?
          <AgentTrace steps={f6.agent_trace} /> :

          <div style={{ color: "var(--text-tertiary)", fontStyle: "italic" }}>
              F-006 not present in this report.
            </div>
          }
        </div>
      </div>
    </div>);

}