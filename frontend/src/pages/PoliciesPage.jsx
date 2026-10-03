import React, { useState } from "react";
import AppShell from "../components/AppShell";
import { SearchIcon, ShieldIcon } from "../components/Icons";

const POLICY_RULES = [
  {
    id: "CG-EXIST-01",
    name: "Reference Existence & Identity",
    category: "Existence & Registry",
    summary: "Citation metadata must match canonical publisher records.",
    gateEffect: "BLOCK",
    reviewerEligible: true,
  },
  {
    id: "CG-EXIST-02",
    name: "Indexing Lag Grace Window",
    category: "Existence & Registry",
    summary: "Recent publications (>= 2025) are not assumed fabricated if unindexed.",
    gateEffect: "REVIEW",
    reviewerEligible: true,
  },
  {
    id: "CG-SUPPORT-01",
    name: "Passage Evidence Grounding",
    category: "Evidence & Grounding",
    summary: "Draft assertions must be substantiated by inspected full-text passages.",
    gateEffect: "BLOCK",
    reviewerEligible: true,
  },
  {
    id: "CG-GATE-01",
    name: "Deterministic Gate Precedence",
    category: "Gate & Governance",
    summary: "Commit status maps findings deterministically to GitHub states.",
    gateEffect: "GOVERNANCE",
    reviewerEligible: false,
  },
  {
    id: "CG-HUMAN-01",
    name: "Reviewer Accountability",
    category: "Gate & Governance",
    summary: "Human exceptions require allowlist membership and rationale.",
    gateEffect: "GOVERNANCE",
    reviewerEligible: false,
  },
  {
    id: "CG-TRUST-01",
    name: "Untrusted Source Defense",
    category: "Security & Guardrails",
    summary: "Directives in source text are treated strictly as data.",
    gateEffect: "BLOCK",
    reviewerEligible: false,
  },
  {
    id: "CG-ACTION-01",
    name: "Bounded Retrieval Loop",
    category: "Security & Guardrails",
    summary: "Agent execution is constrained by tool call budget.",
    gateEffect: "REVIEW",
    reviewerEligible: true,
  },
  {
    id: "CG-DATA-01",
    name: "Registry Provenance Integrity",
    category: "Security & Guardrails",
    summary: "Database agreement is provenance, not confidence voting.",
    gateEffect: "GOVERNANCE",
    reviewerEligible: false,
  },
];

export default function PoliciesPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const filtered = POLICY_RULES.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q)
    );
  });

  const selected = POLICY_RULES.find((r) => r.id === selectedId);

  const getGateColor = (effect) => {
    switch (effect) {
      case "BLOCK": return "text-[#991B1B] bg-[#FEF2F2] border-[#FECACA]";
      case "REVIEW": return "text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]";
      default: return "text-[#5C6854] bg-[#F4FAED] border-[#18280E]/15";
    }
  };

  return (
    <AppShell breadcrumbs={[{ label: "Policy Rules" }]}>
      <div className="flex-1 flex flex-col min-h-[calc(100vh-56px)]">
        {/* Header */}
        <div className="px-6 md:px-8 pt-8 pb-6">
          <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#090F05]">
              Policy Rules
            </h1>
            <p className="text-sm text-[#5C6854] mt-1.5">
              Deterministic governance rules that control merge gate decisions.
            </p>

            {/* Search */}
            <div className="w-full max-w-lg mt-5 relative">
              <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9684]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search policies by name or category..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border-2 border-[#18280E]/12 text-sm text-[#090F05] placeholder-[#8A9684] outline-none focus:border-[#18280E] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Policy Cards */}
        <div className="flex-1 px-6 md:px-8 pb-8">
          <div className="max-w-3xl mx-auto space-y-3">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#8A9684]">
                No policies matching "{search}"
              </div>
            ) : (
              filtered.map((rule) => {
                const isOpen = selectedId === rule.id;
                return (
                  <div
                    key={rule.id}
                    className={`rounded-xl bg-white border transition-all cursor-pointer ${
                      isOpen
                        ? "border-[#18280E]/30 shadow-sm"
                        : "border-[#18280E]/10 hover:border-[#18280E]/25"
                    }`}
                    onClick={() => setSelectedId(isOpen ? null : rule.id)}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#18280E]">{rule.id}</span>
                            <span className="text-[10px] text-[#8A9684]">·</span>
                            <span className="text-[11px] text-[#5C6854]">{rule.category}</span>
                          </div>
                          <div className="text-sm font-semibold text-[#090F05] mt-1">
                            {rule.name}
                          </div>
                          <div className="text-xs text-[#5C6854] mt-1">
                            {rule.summary}
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${getGateColor(rule.gateEffect)}`}>
                          {rule.gateEffect}
                        </span>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="px-5 pb-5 pt-0 border-t border-[#18280E]/08 mt-0 animate-fade-in">
                        <div className="flex items-center gap-4 pt-4 text-xs text-[#5C6854]">
                          <div className="flex items-center gap-1.5">
                            <ShieldIcon size={12} className="text-[#18280E]" />
                            <span>Gate Effect: <strong className="text-[#090F05]">{rule.gateEffect}</strong></span>
                          </div>
                          <span className="w-1 h-1 rounded-full bg-[#18280E]/15" />
                          <span>
                            Exception: <strong className="text-[#090F05]">{rule.reviewerEligible ? "Eligible" : "Not allowed"}</strong>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}