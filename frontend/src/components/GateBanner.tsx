import type { AuditReport } from "../contract/types";
import { Chip } from "./Chip";

const LABEL: Record<string, string> = {
  success: "Approved", pending: "Pending review", failure: "Blocked", error: "Error — not approved",
};

export function GateBanner({ r }: { r: AuditReport }) {
  return (
    <div className={`card gate ${r.gate.state}`}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="state">CiteGuard: {LABEL[r.gate.state]}</div>
        <div className="row">
          {r.cached && <Chip kind="cached" title="Replayed from cache — not a fresh API call">cached result</Chip>}
          <Chip>policy v{r.policy_version}</Chip>
        </div>
      </div>
      <div>{r.gate.description}</div>
      <div className="row">
        {r.gate.reasons.map((x) => <Chip key={x} kind="rule">{x}</Chip>)}
      </div>
      <div className="muted mono">{r.repo} · PR #{r.pr_number} · commit {r.commit_sha.slice(0, 7)} · {r.generated_at}</div>
    </div>
  );
}
