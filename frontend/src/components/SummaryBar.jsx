
import { CpuIcon, XCircleIcon, AlertTriangleIcon, CheckCircleIcon, BookOpenIcon } from "./Icons";

export function SummaryBar({
  r,
  currentFilter,
  onFilterChange




}) {
  const s = r.summary;
  const b = r.budget;

  const budgetPercent = Math.min(100, Math.round(b.tool_calls_used / b.tool_calls_max * 100));
  const timeSec = (b.elapsed_ms / 1000).toFixed(1);
  const deadlineSec = (b.deadline_ms / 1000).toFixed(0);

  return (
    <div className="space-y-4">
      {/* 5-Column High Contrast Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Total Claims */}
        <button
          type="button"
          onClick={() => onFilterChange?.("all")}
          disabled={!onFilterChange}
          className="p-4 rounded-lg text-left transition-all relative overflow-hidden"
          style={{
            background: currentFilter === "all" ? "var(--cg-surface)" : "var(--cg-surface)",
            border: `1px solid ${currentFilter === "all" ? "var(--cg-accent)" : "var(--cg-line)"}`,
            boxShadow: currentFilter === "all" ? "0 0 0 1px var(--cg-accent)" : "none",
            cursor: onFilterChange ? "pointer" : "default"
          }}
          title="Show all findings">
          
          <div className="text-2xl font-bold" style={{ color: "var(--cg-ink)" }}>{s.claims_total}</div>
          <div className="text-[11px] font-mono uppercase tracking-wider font-semibold mt-1" style={{ color: "var(--cg-ink-secondary)" }}>
            Claims Audited
          </div>
        </button>

        {/* References (Static) */}
        <div
          className="p-4 rounded-lg text-left transition-all relative overflow-hidden"
          style={{
            background: "var(--cg-surface)",
            border: "1px solid var(--cg-line)"
          }}>
          
          <div className="text-2xl font-bold flex items-center gap-1.5" style={{ color: "var(--cg-ink)" }}>
            <BookOpenIcon size={22} style={{ color: "var(--cg-ink-secondary)" }} />
            {s.references_total}
          </div>
          <div className="text-[11px] font-mono uppercase tracking-wider font-semibold mt-1" style={{ color: "var(--cg-ink-secondary)" }}>
            References
          </div>
        </div>

        {/* Blocked */}
        <button
          type="button"
          onClick={() => onFilterChange?.("block")}
          disabled={!onFilterChange}
          className="p-4 rounded-lg text-left transition-all relative overflow-hidden group"
          style={{
            background: currentFilter === "block" ? "var(--cg-block-subtle)" : "var(--cg-surface)",
            border: `1px solid ${currentFilter === "block" ? "var(--cg-block-line)" : "var(--cg-line)"}`,
            boxShadow: currentFilter === "block" ? "0 0 0 1px var(--cg-block)" : "none",
            cursor: onFilterChange ? "pointer" : "default"
          }}
          title="Filter to blocked findings">
          
          <div className="text-2xl font-bold flex items-center gap-1.5 transition-colors group-hover:opacity-80" style={{ color: "var(--cg-block)" }}>
            <XCircleIcon size={22} />
            {s.blocked_count}
          </div>
          <div className="text-[11px] font-mono uppercase tracking-wider font-semibold mt-1" style={{ color: currentFilter === "block" ? "var(--cg-block)" : "var(--cg-ink-secondary)" }}>
            Blocked
          </div>
        </button>

        {/* Review */}
        <button
          type="button"
          onClick={() => onFilterChange?.("review")}
          disabled={!onFilterChange}
          className="p-4 rounded-lg text-left transition-all relative overflow-hidden group"
          style={{
            background: currentFilter === "review" ? "var(--cg-review-subtle)" : "var(--cg-surface)",
            border: `1px solid ${currentFilter === "review" ? "var(--cg-review-line)" : "var(--cg-line)"}`,
            boxShadow: currentFilter === "review" ? "0 0 0 1px var(--cg-review)" : "none",
            cursor: onFilterChange ? "pointer" : "default"
          }}
          title="Filter to findings needing review">
          
          <div className="text-2xl font-bold flex items-center gap-1.5 transition-colors group-hover:opacity-80" style={{ color: "var(--cg-review)" }}>
            <AlertTriangleIcon size={22} />
            {s.review_count}
          </div>
          <div className="text-[11px] font-mono uppercase tracking-wider font-semibold mt-1" style={{ color: currentFilter === "review" ? "var(--cg-review)" : "var(--cg-ink-secondary)" }}>
            Needs Review
          </div>
        </button>

        {/* Passed */}
        <button
          type="button"
          onClick={() => onFilterChange?.("pass")}
          disabled={!onFilterChange}
          className="p-4 rounded-lg text-left transition-all relative overflow-hidden group"
          style={{
            background: currentFilter === "pass" ? "var(--cg-pass-subtle)" : "var(--cg-surface)",
            border: `1px solid ${currentFilter === "pass" ? "var(--cg-pass-line)" : "var(--cg-line)"}`,
            boxShadow: currentFilter === "pass" ? "0 0 0 1px var(--cg-pass)" : "none",
            cursor: onFilterChange ? "pointer" : "default"
          }}
          title="Filter to passed findings">
          
          <div className="text-2xl font-bold flex items-center gap-1.5 transition-colors group-hover:opacity-80" style={{ color: "var(--cg-pass)" }}>
            <CheckCircleIcon size={22} />
            {s.passed_count}
          </div>
          <div className="text-[11px] font-mono uppercase tracking-wider font-semibold mt-1" style={{ color: currentFilter === "pass" ? "var(--cg-pass)" : "var(--cg-ink-secondary)" }}>
            Passed
          </div>
        </button>
      </div>

      {/* Tool-Call Telemetry & Budget Gauge */}
      <div
        className="rounded-lg p-3 overflow-hidden"
        style={{
          background: "var(--cg-surface)",
          border: "1px solid var(--cg-line)"
        }}>
        
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#fff" }}>
            <CpuIcon size={14} style={{ color: "var(--cg-accent)" }} />
            Autonomous Agent Telemetry
          </span>
          <span className="text-[11px] font-mono" style={{ color: b.exhausted ? "#ef4444" : "#94a3b8" }}>
            {b.tool_calls_used} / {b.tool_calls_max} ops ({budgetPercent}%) · {timeSec}s / {deadlineSec}s deadline
            {b.exhausted && " · [BUDGET EXHAUSTED → ROUTED TO REVIEW]"}
          </span>
        </div>
        <div
          className="h-1.5 w-full rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.1)" }}>
          
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${budgetPercent}%`,
              background: b.exhausted ? "#ef4444" : "var(--cg-accent)"
            }} />
          
        </div>
      </div>
    </div>);

}