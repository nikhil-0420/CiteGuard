import React, { useState } from "react";
import AppShell from "../components/AppShell";
import { CopyIcon, CheckIcon, CheckCircleIcon, AlertTriangleIcon } from "../components/Icons";

const METRICS = [
  {
    measure: "Unsafe Automatic Passes",
    observed: "0 / 26",
    status: "verified",
    description: "Contradicted or non-existent citations mistakenly cleared.",
  },
  {
    measure: "Safety Escalations (Outages)",
    observed: "8 / 8",
    status: "verified",
    description: "Simulated network errors safely escalated to review.",
  },
  {
    measure: "Governance Security Probes",
    observed: "12 / 12",
    status: "verified",
    description: "Stale SHA, unauthorized reviewer, and injection defense tests.",
  },
  {
    measure: "Semantic Entailment Accuracy",
    observed: "Pending",
    status: "pending",
    description: "Held-out 24-claim natural evaluation not yet executed.",
  },
  {
    measure: "Decision Coverage Rate",
    observed: "Pending",
    status: "pending",
    description: "Percentage of claims with definitive judgments rendered.",
  },
  {
    measure: "Conditional Decision Accuracy",
    observed: "Pending",
    status: "pending",
    description: "Precision on claims where the agent made a decision.",
  },
];

export default function EvalPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = METRICS.map((m) => `${m.measure}: ${m.observed}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell breadcrumbs={[{ label: "Evaluation" }]}>
      <div className="flex-1 flex flex-col min-h-[calc(100vh-56px)]">
        {/* Header */}
        <div className="px-6 md:px-8 pt-8 pb-6">
          <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#090F05]">
              Evaluation
            </h1>
            <p className="text-sm text-[#5C6854] mt-1.5">
              Benchmark metrics across sample fixtures and held-out evaluations.
            </p>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[#F4FAED] border border-[#18280E]/10 text-[#090F05] hover:border-[#18280E]/25 transition-all"
            >
              {copied ? <CheckIcon size={14} className="text-[#166534]" /> : <CopyIcon size={14} />}
              <span>{copied ? "Copied" : "Copy summary"}</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="flex-1 px-6 md:px-8 pb-8">
          <div className="max-w-3xl mx-auto space-y-3">
            {METRICS.map((m, idx) => {
              const isVerified = m.status === "verified";
              return (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-white border border-[#18280E]/10 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-[#090F05]">
                        {m.measure}
                      </div>
                      <div className="text-xs text-[#5C6854] mt-1">
                        {m.description}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-lg font-bold font-mono ${isVerified ? "text-[#166534]" : "text-[#8A9684]"}`}>
                        {m.observed}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        isVerified
                          ? "bg-[#F4FAED] text-[#166534] border-[#18280E]/20"
                          : "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]"
                      }`}>
                        {isVerified ? <CheckCircleIcon size={10} /> : <AlertTriangleIcon size={10} />}
                        {isVerified ? "Verified" : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}