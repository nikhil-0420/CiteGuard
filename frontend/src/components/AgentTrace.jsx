

export function AgentTrace({ steps }) {
  if (!steps.length) {
    return (
      <div style={{ color: "var(--text-tertiary)", fontStyle: "italic", padding: "8px 0" }}>
        No agent actions recorded for this finding.
      </div>);

  }

  return (
    <div className="trace-timeline-box">
      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", marginBottom: "10px" }}>
        Autonomous Agent Trace ({steps.length} {steps.length === 1 ? "step" : "steps"})
      </div>
      <ol className="trace-timeline-list">
        {steps.map((s) =>
        <li key={s.step} className="trace-timeline-item">
            <span className="trace-step-number">{s.step}</span>
            <div className="trace-step-content">
              <div>
                <span className="trace-action-name">{s.action}</span>
                <span style={{ color: "var(--text-primary)" }}>{s.observation}</span>
              </div>
              <div className="trace-step-why">
                <span style={{ fontWeight: 600 }}>why:</span> {s.reason}
              </div>
            </div>
          </li>
        )}
      </ol>
    </div>);

}