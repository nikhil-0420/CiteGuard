import React, { useState } from "react";

import { CpuIcon } from "./Icons";






export default function TraceComparisonModal({
  findings,
  onClose
}) {
  const findingsWithTraces = findings.filter((f) => f.agent_trace && f.agent_trace.length > 0);

  const [findingIdA, setFindingIdA] = useState(() => {
    return findings.find((f) => f.id === "F-003")?.id || findingsWithTraces[0]?.id || "";
  });

  const [findingIdB, setFindingIdB] = useState(() => {
    return (
      findings.find((f) => f.id === "F-006")?.id ||
      findingsWithTraces[1]?.id ||
      findingsWithTraces[0]?.id ||
      "");

  });

  const findingA = findings.find((f) => f.id === findingIdA);
  const findingB = findings.find((f) => f.id === findingIdB);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--cg-surface)]/60 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
      role="dialog"
      aria-modal="true">
      
      <div
        className="w-full max-w-4xl bg-[var(--cg-surface)] border border-[var(--cg-line)] rounded-xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between border-b border-[var(--cg-line)] pb-3">
          <div className="flex items-center gap-2">
            <CpuIcon size={18} className="text-[var(--cg-accent)]" />
            <h2 className="text-base font-bold text-[var(--cg-ink)]">Agent Execution Trace Comparison</h2>
          </div>
          <button
            type="button"
            className="text-xs text-[var(--cg-ink-muted)] hover:text-[var(--cg-ink)] p-1 font-mono"
            onClick={onClose}>
            
            ✕
          </button>
        </div>

        <p className="text-xs text-[var(--cg-ink-muted)]">
          Compare two findings side-by-side to inspect autonomous retrieval actions, query reformulations, and tool execution boundaries.
        </p>

        {/* Dynamic Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-mono font-bold text-[var(--cg-ink-muted)] uppercase tracking-wider mb-1">
              Finding A:
            </label>
            <select
              className="w-full px-2.5 py-1.5 border border-[var(--cg-line)] rounded-md text-xs text-[var(--cg-ink)] bg-[var(--cg-surface)] focus:outline-none focus:border-[var(--cg-accent)]"
              value={findingIdA}
              onChange={(e) => setFindingIdA(e.target.value)}>
              
              {findings.map((f) =>
              <option key={f.id} value={f.id}>
                  {f.id}: {f.claim_text.slice(0, 45)}... ({f.agent_trace.length} steps)
                </option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-[var(--cg-ink-muted)] uppercase tracking-wider mb-1">
              Finding B:
            </label>
            <select
              className="w-full px-2.5 py-1.5 border border-[var(--cg-line)] rounded-md text-xs text-[var(--cg-ink)] bg-[var(--cg-surface)] focus:outline-none focus:border-[var(--cg-accent)]"
              value={findingIdB}
              onChange={(e) => setFindingIdB(e.target.value)}>
              
              {findings.map((f) =>
              <option key={f.id} value={f.id}>
                  {f.id}: {f.claim_text.slice(0, 45)}... ({f.agent_trace.length} steps)
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Finding A Column */}
          <div className="bg-[var(--cg-surface-subtle)] border border-[var(--cg-line)] rounded-lg p-4 space-y-3">
            <div className="border-b border-[var(--cg-line)] pb-2">
              <div className="text-xs font-bold text-[var(--cg-ink)] truncate">
                {findingA ? `${findingA.id}: ${findingA.reference.title}` : "Finding A"}
              </div>
              <div className="text-[11px] text-[var(--cg-ink-muted)] mt-0.5">
                Verdict: <strong className="text-[var(--cg-ink)]">{findingA?.action.toUpperCase()}</strong> · Steps: {findingA?.agent_trace.length || 0}
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {findingA?.agent_trace.map((step) =>
              <div key={step.step} className="p-2.5 bg-[var(--cg-surface)] border border-[var(--cg-line)] rounded text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-[var(--cg-accent)] font-mono font-bold">
                    <span>STEP {step.step}: {step.action}</span>
                  </div>
                  <div className="text-[var(--cg-ink)]">{step.observation}</div>
                  <div className="text-[10px] text-[var(--cg-ink-muted)] italic">Reason: {step.reason}</div>
                </div>
              )}
            </div>
          </div>

          {/* Finding B Column */}
          <div className="bg-[var(--cg-surface-subtle)] border border-[var(--cg-line)] rounded-lg p-4 space-y-3">
            <div className="border-b border-[var(--cg-line)] pb-2">
              <div className="text-xs font-bold text-[var(--cg-ink)] truncate">
                {findingB ? `${findingB.id}: ${findingB.reference.title}` : "Finding B"}
              </div>
              <div className="text-[11px] text-[var(--cg-ink-muted)] mt-0.5">
                Verdict: <strong className="text-[var(--cg-ink)]">{findingB?.action.toUpperCase()}</strong> · Steps: {findingB?.agent_trace.length || 0}
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {findingB?.agent_trace.map((step) =>
              <div key={step.step} className="p-2.5 bg-[var(--cg-surface)] border border-[var(--cg-line)] rounded text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-[var(--cg-accent)] font-mono font-bold">
                    <span>STEP {step.step}: {step.action}</span>
                  </div>
                  <div className="text-[var(--cg-ink)]">{step.observation}</div>
                  <div className="text-[10px] text-[var(--cg-ink-muted)] italic">Reason: {step.reason}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--cg-line)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-[var(--cg-surface)] bg-[var(--cg-ink)] hover:opacity-90 rounded transition-opacity">
            
            Close Trace Inspector
          </button>
        </div>
      </div>
    </div>);

}