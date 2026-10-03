
import { Chip } from "./Chip";
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon, AlertOctagonIcon, GitPullRequestIcon, GitCommitIcon } from "./Icons";

const STATUS_CONFIG =


{
  success: {
    label: "Approved",
    sub: "All verified claims satisfy policy — PR ready to merge",
    icon: CheckCircleIcon,
    color: "var(--cg-pass)",
    bg: "var(--cg-pass-subtle)",
    border: "var(--cg-pass-line)"
  },
  pending: {
    label: "Pending Review",
    sub: "Action required: human reviewer approval needed for unverified findings",
    icon: AlertTriangleIcon,
    color: "var(--cg-review)",
    bg: "var(--cg-review-subtle)",
    border: "var(--cg-review-line)"
  },
  failure: {
    label: "Blocked",
    sub: "Merge rejected: contradictory evidence or citation identity mismatch found",
    icon: XCircleIcon,
    color: "var(--cg-block)",
    bg: "var(--cg-block-subtle)",
    border: "var(--cg-block-line)"
  },
  error: {
    label: "Error — Cannot Pass",
    sub: "Technical/extraction defect prevented policy evaluation — audit incomplete",
    icon: AlertOctagonIcon,
    color: "var(--cg-block)",
    bg: "var(--cg-block-subtle)",
    border: "var(--cg-block-line)"
  }
};

export function GateBanner({ r, highlight }) {
  const config = STATUS_CONFIG[r.gate.state] ?? STATUS_CONFIG.error;
  const StatusIcon = config.icon;
  const s = r.summary;

  return (
    <div
      className="rounded-lg overflow-hidden animate-fade-in"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        transition: highlight ? "box-shadow 300ms ease" : undefined,
        boxShadow: highlight ? `0 0 0 2px ${config.color}` : undefined
      }}>
      
      {/* Top row: Status pill + Meta badges */}
      <div className="p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold"
            style={{ color: config.color }}>
            
            <StatusIcon size={18} />
            <span>{config.label}</span>
          </div>
          <span className="text-xs font-mono" style={{ color: "var(--cg-ink-secondary)" }}>
            CiteGuard Commit Gate
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {r.cached &&
          <Chip kind="cached" icon title="Replayed from cached audit record — not a fresh live API call">
              cached audit
            </Chip>
          }
          <Chip>policy v{r.policy_version}</Chip>
        </div>
      </div>

      {/* Description & cause */}
      <div
        className="px-4 pb-3"
        style={{ borderBottom: `1px solid ${config.border}` }}>
        
        <div className="text-sm font-semibold" style={{ color: "var(--cg-ink)" }}>
          {r.gate.description}
        </div>
        <div className="text-xs mt-1" style={{ color: "var(--cg-ink-secondary)" }}>
          {config.sub}
        </div>
      </div>

      {/* Rule triggers and Counts strip */}
      <div className="px-4 py-3 flex items-center flex-wrap gap-2" style={{ borderBottom: `1px solid ${config.border}` }}>
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider" style={{ color: "var(--cg-ink-secondary)" }}>
          Enforced Rules:
        </span>
        {r.gate.reasons.map((x) =>
        <Chip key={x} kind="rule">
            {x}
          </Chip>
        )}

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold"
            style={{ background: "var(--cg-block-subtle)", color: "var(--cg-block)", border: "1px solid var(--cg-block-line)" }}>
            
            <XCircleIcon size={11} /> {s.blocked_count} Blocked
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold"
            style={{ background: "var(--cg-review-subtle)", color: "var(--cg-review)", border: "1px solid var(--cg-review-line)" }}>
            
            <AlertTriangleIcon size={11} /> {s.review_count} Review
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold"
            style={{ background: "var(--cg-pass-subtle)", color: "var(--cg-pass)", border: "1px solid var(--cg-pass-line)" }}>
            
            <CheckCircleIcon size={11} /> {s.passed_count} Passed
          </span>
        </div>
      </div>

      {/* Footer metadata */}
      <div
        className="px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs"
        style={{ color: "var(--cg-ink-secondary)" }}>
        
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 font-mono">
            <GitPullRequestIcon size={13} />
            <strong style={{ color: "var(--cg-ink)" }}>{r.repo}</strong> #{r.pr_number}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono">
            <GitCommitIcon size={13} />
            <code>{r.commit_sha.slice(0, 7)}</code>
          </span>
        </div>
        <div className="font-mono text-[11px]">
          Audited at <span>{new Date(r.generated_at).toLocaleString()}</span>
        </div>
      </div>
    </div>);

}