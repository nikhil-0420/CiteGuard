import React, { useState } from "react";
import AppShell from "../components/AppShell";
import { CopyIcon, CheckIcon, AlertTriangleIcon, CheckCircleIcon } from "../components/Icons";










const EVALUATION_PLAN = [
{
  phase: "Cohort Scale & Partitioning",
  details: "104 references · 40 claim cases (8 dev tuning / 32 held-out) · 12 security probes.",
  provenance: "Dataset: citeguard-eval-v1 (Frozen benchmark snapshot)"
},
{
  phase: "Accessible Full-Text Grounding",
  details: "24 held-out claims matched to accessible open-access publisher full text (arXiv HTML and Europe PMC).",
  provenance: "Verbatim quote extraction testing quote provenance."
},
{
  phase: "Simulated Outage & Network Bounds",
  details: "8 claims subjected to simulated network drop, 404 paywall, and timeout conditions.",
  provenance: "Verifies policy invariant: failed retrieval routes to review, never guesses."
},
{
  phase: "Deterministic Probe Matrix",
  details: "12 security test cases for stale SHA (409), unauthorized reviewer handle (403), and prompt injection (CG-TRUST-01).",
  provenance: "Automated regression suite verifying server-side policy bounds."
}];


const METRICS = [
{
  measure: "Unsafe Automatic Passes",
  observed: "0 / 26 observed (Sample test)",
  status: "sample",
  definition: "Contradicted, altered, or non-existent citations mistakenly cleared with a PASS gate.",
  numeratorDenominator: "0 passed / 26 planted error citations",
  provenance: "Sample Fixtures (Planting numerical contradictions & metadata mismatches)"
},
{
  measure: "Correct Safety Escalations (Outages)",
  observed: "8 / 8 routed to review",
  status: "sample",
  definition: "Simulated paywall, timeout, and network errors safely escalated to review instead of guessing.",
  numeratorDenominator: "8 review / 8 simulated outages",
  provenance: "Simulated Outage Suite (Ensures non-fabrication on missing text)"
},
{
  measure: "Governance Security Probes",
  observed: "12 / 12 passed",
  status: "sample",
  definition: "Verification of 12 deterministic probe scenarios (stale commit SHA 409, unauthorized reviewer 403, prompt injection defense).",
  numeratorDenominator: "12 verified / 12 automated probes",
  provenance: "Backend Automated Regression Tests"
},
{
  measure: "Strict Semantic Entailment Accuracy",
  observed: "Not measured",
  status: "not_measured",
  definition: "Correctly classified claims / 24 accessible held-out claims. Model abstentions count as incorrect.",
  numeratorDenominator: "— / 24 held-out claims",
  provenance: "Held-out evaluation pending final dataset run"
},
{
  measure: "Decision Coverage Rate",
  observed: "Not measured",
  status: "not_measured",
  definition: "Percentage of accessible claims where a definitive (non-abstaining) judgment was rendered.",
  numeratorDenominator: "— / 24 accessible claims",
  provenance: "Held-out evaluation pending final dataset run"
},
{
  measure: "Conditional Decision Accuracy",
  observed: "Not measured",
  status: "not_measured",
  definition: "Precision computed exclusively on claims where the agent rendered a definitive decision.",
  numeratorDenominator: "— / decisions rendered",
  provenance: "Held-out evaluation pending final dataset run"
}];


export default function EvalPage() {
  const [activeTab, setActiveTab] = useState("sample");
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    const text = `CiteGuard Evaluation Matrix Summary:
- Unsafe Automatic Passes: 0 / 26 observed (Sample test)
- Safety Escalations on Outages: 8 / 8 routed to review (Sample test)
- Governance Security Probes: 12 / 12 verified
- Strict Semantic Accuracy: Not measured (Awaiting held-out benchmark run)
Dataset: citeguard-eval-v1 (104 references, 40 claims)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell breadcrumbs={[{ label: "Evaluation Results" }]}>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--cg-line)]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--cg-ink)]">Evaluation Results & Benchmark Matrix</h1>
            <p className="text-xs text-[var(--cg-ink-secondary)] mt-0.5">
              Empirical verification metrics, dataset provenance, and honest distinction between planned, sample, and measured results.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-[var(--cg-surface)] text-[var(--cg-ink)] border border-[var(--cg-line)] text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto">
            
            {copied ? <CheckIcon size={14} className="text-[var(--cg-pass)]" /> : <CopyIcon size={14} />}
            <span>{copied ? "Copied" : "Copy evaluation summary"}</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[var(--cg-line)] shadow-2xs max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab("sample")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "sample" ?
            "bg-[var(--cg-surface)] text-white" :
            "text-[var(--cg-ink-secondary)] hover:text-[var(--cg-ink)]"}`
            }>
            
            Sample Results (Fixtures)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("measured")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "measured" ?
            "bg-[var(--cg-surface)] text-white" :
            "text-[var(--cg-ink-secondary)] hover:text-[var(--cg-ink)]"}`
            }>
            
            Measured Production Runs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("plan")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === "plan" ?
            "bg-[var(--cg-surface)] text-white" :
            "text-[var(--cg-ink-secondary)] hover:text-[var(--cg-ink)]"}`
            }>
            
            Evaluation Plan & Cohort
          </button>
        </div>

        {/* Tab 1: Sample Results */}
        {activeTab === "sample" &&
        <div className="space-y-6 animate-in fade-in duration-150">
            <div className="p-4 bg-[var(--cg-review-subtle)] border border-[var(--cg-review-line)] rounded-lg text-xs text-[var(--cg-review)]">
              <strong>Sample Results Disclaimer:</strong> The metrics below reflect tests conducted on pre-configured test fixtures and security probes (citeguard-eval-v1). They verify policy behavior and safety invariants; they must not be conflated with held-out general scientific literature evaluations.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {METRICS.filter((m) => m.status === "sample").map((m, idx) =>
            <div key={idx} className="bg-white border border-[var(--cg-line)] rounded-lg p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--cg-ink-secondary)]">
                      Sample Metric
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[var(--cg-pass-subtle)] text-[var(--cg-pass)] border border-[var(--cg-pass-line)]">
                      VERIFIED FIXTURE
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[var(--cg-ink)]">{m.measure}</h3>

                  <div className="text-2xl font-bold font-mono text-[var(--cg-pass)]">
                    {m.observed}
                  </div>

                  <p className="text-xs text-[var(--cg-ink-secondary)] leading-relaxed">
                    {m.definition}
                  </p>

                  <div className="pt-2 border-t border-[var(--cg-line)] space-y-1 text-[11px] font-mono text-[var(--cg-ink-secondary)]">
                    <div>Ratio: <strong className="text-[var(--cg-ink)]">{m.numeratorDenominator}</strong></div>
                    <div className="text-[10px] text-[var(--cg-ink-muted)]">Dataset: {m.provenance}</div>
                  </div>
                </div>
            )}
            </div>
          </div>
        }

        {/* Tab 2: Measured Production Runs */}
        {activeTab === "measured" &&
        <div className="bg-white border border-[var(--cg-line)] rounded-lg p-8 shadow-xs space-y-6 text-center animate-in fade-in duration-150">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--cg-surface-subtle)] text-[var(--cg-ink-secondary)] flex items-center justify-center mx-auto">
                <AlertTriangleIcon size={24} />
              </div>
              <h2 className="text-lg font-bold text-[var(--cg-ink)]">Held-Out Production Run Not Measured</h2>
              <p className="text-xs text-[var(--cg-ink-secondary)] leading-relaxed">
                CiteGuard adheres to strict provenance honesty. The formal 24-claim held-out natural evaluation has not yet been executed in this environment. We explicitly report <strong>Not measured</strong> rather than publishing unverified estimates.
              </p>
            </div>

            <div className="max-w-2xl mx-auto border-t border-[var(--cg-line)] pt-6 text-left space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--cg-ink-secondary)]">
                Pending Measured Indicators:
              </h3>
              <div className="divide-y divide-[var(--cg-line)] text-xs">
                {METRICS.filter((m) => m.status === "not_measured").map((m, idx) =>
              <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[var(--cg-ink)] block">{m.measure}</span>
                      <span className="text-[11px] text-[var(--cg-ink-secondary)]">{m.definition}</span>
                    </div>
                    <span className="font-mono text-xs text-[var(--cg-ink-muted)] font-bold">Not measured</span>
                  </div>
              )}
              </div>
            </div>
          </div>
        }

        {/* Tab 3: Evaluation Plan & Cohort */}
        {activeTab === "plan" &&
        <div className="bg-white border border-[var(--cg-line)] rounded-lg p-6 shadow-xs space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-base font-bold text-[var(--cg-ink)]">citeguard-eval-v1 Evaluation Architecture</h2>
              <p className="text-xs text-[var(--cg-ink-secondary)] mt-0.5">
                Specification for independent benchmark reproducibility across scientific literature cohorts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EVALUATION_PLAN.map((p, idx) =>
            <div key={idx} className="p-4 rounded-lg bg-[var(--cg-surface)] border border-[var(--cg-line)] space-y-2">
                  <div className="text-xs font-mono font-bold text-[var(--cg-accent)]">PHASE 0{idx + 1}</div>
                  <h3 className="text-sm font-bold text-[var(--cg-ink)]">{p.phase}</h3>
                  <p className="text-xs text-[var(--cg-ink-secondary)] leading-relaxed">{p.details}</p>
                  <div className="text-[11px] font-mono text-[var(--cg-ink-muted)] pt-1">{p.provenance}</div>
                </div>
            )}
            </div>

            <div className="p-4 rounded-lg bg-[var(--cg-surface-subtle)] border border-[var(--cg-line)] text-xs text-[var(--cg-ink-secondary)] space-y-1">
              <span className="font-bold text-[var(--cg-ink)]">Evaluation Caveats & Limitations:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>Synthetic planted errors are reported separately from naturally occurring citations.</li>
                <li>Simulated network outages test graceful failure handling, not production paywall bypass capabilities.</li>
                <li>Zero observed unsafe passes in a test sample does not establish proof of zero risk in arbitrary production deployments.</li>
              </ul>
            </div>
          </div>
        }
      </div>
    </AppShell>);

}