import type { AgentStep } from "../contract/types";

export function AgentTrace({ steps }: { steps: AgentStep[] }) {
  if (!steps.length) return <div className="muted">No agent steps recorded.</div>;
  return (
    <ol className="trace">
      {steps.map((s) => (
        <li key={s.step}>
          <span className="n">{s.step}</span>
          <div>
            <div><span className="mono" style={{ color: "var(--blue)" }}>{s.action}</span> — {s.observation}</div>
            <div className="muted">why: {s.reason}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
