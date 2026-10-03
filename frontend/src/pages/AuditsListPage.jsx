import React, { useState, useEffect, useMemo } from "react";
import { Link, useRouter } from "../router";
import AppShell from "../components/AppShell";
import { listReports, getReport } from "../api";
import { formatDateTime } from "../utils/date";
import {
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  AlertOctagonIcon,
  PlusIcon,
  SearchIcon,
} from "../components/Icons";

const AUDIT_METADATA = {
  blocked: {
    title: "Agent Brief v1.4 — ResNet & Attention Claims",
    scenario: "Active Blocker Run",
    versionLabel: "v1.4",
  },
  pending: {
    title: "Transformer Attention Verification — Exception Under Review",
    scenario: "Reviewer Exception Submitted",
    versionLabel: "v1.2",
  },
  passed: {
    title: "Attention Is All You Need — Clean Reference Audit",
    scenario: "Clean Baseline / Approved",
    versionLabel: "v2.0",
  },
  error: {
    title: "Multimodal Agent Draft — Incomplete Extraction",
    scenario: "Extraction Syntax Error",
    versionLabel: "v0.9-draft",
  },
};

export default function AuditsListPage() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listReports()
      .then((data) => {
        const enriched = data.map((r) => {
          const meta = AUDIT_METADATA[r.report_id] || {
            title: `Audit ${r.report_id}`,
            scenario: "Custom Run",
            versionLabel: "v1.0",
          };
          return { ...r, ...meta };
        });
        setReports(enriched);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter((r) => {
      return (
        r.title.toLowerCase().includes(q) ||
        r.repo.toLowerCase().includes(q) ||
        r.commit_sha.toLowerCase().includes(q) ||
        r.report_id.toLowerCase().includes(q)
      );
    });
  }, [reports, search]);

  const getGateStyle = (state) => {
    switch (state) {
      case "success":
        return { icon: CheckCircleIcon, label: "Passed", color: "text-[#166534]", bg: "bg-[#F4FAED]", border: "border-[#18280E]/20" };
      case "failure":
        return { icon: XCircleIcon, label: "Blocked", color: "text-[#991B1B]", bg: "bg-[#FEF2F2]", border: "border-[#FECACA]" };
      case "pending":
        return { icon: AlertTriangleIcon, label: "Review", color: "text-[#B45309]", bg: "bg-[#FFFBEB]", border: "border-[#FDE68A]" };
      default:
        return { icon: AlertOctagonIcon, label: "Error", color: "text-[#991B1B]", bg: "bg-[#FEF2F2]", border: "border-[#FECACA]" };
    }
  };

  return (
    <AppShell breadcrumbs={[{ label: "Audits" }]}>
      <div className="flex-1 flex flex-col min-h-[calc(100vh-56px)]">
        {/* Header */}
        <div className="px-6 md:px-8 pt-8 pb-6">
          <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#090F05]">
              Audit History
            </h1>
            <p className="text-sm text-[#5C6854] mt-1.5">
              All citation verification runs across your repositories.
            </p>

            {/* Search */}
            <div className="w-full max-w-lg mt-5 relative">
              <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9684]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search audits by title, repo, SHA..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border-2 border-[#18280E]/12 text-sm text-[#090F05] placeholder-[#8A9684] outline-none focus:border-[#18280E] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Audit Cards */}
        <div className="flex-1 px-6 md:px-8 pb-8">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* New Audit CTA */}
            <Link
              href="/app/audits/new"
              className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-[#18280E]/15 text-sm font-medium text-[#5C6854] hover:border-[#18280E]/30 hover:text-[#090F05] hover:bg-[#F4FAED] transition-all"
            >
              <PlusIcon size={16} />
              <span>Start a new audit</span>
            </Link>

            {isLoading ? (
              <div className="py-12 text-center text-sm text-[#8A9684] font-mono">
                Loading audits...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#8A9684]">
                No audits found matching "{search}"
              </div>
            ) : (
              filtered.map((r) => {
                const gate = getGateStyle(r.gate_state);
                const GateIcon = gate.icon;
                return (
                  <Link
                    key={r.report_id}
                    href={`/app/audits/${r.report_id}`}
                    className="block p-5 rounded-xl bg-white border border-[#18280E]/10 hover:border-[#18280E]/25 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[#090F05] group-hover:text-[#18280E] transition-colors">
                          {r.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-[#5C6854]">
                          <span className="font-mono">{r.repo}</span>
                          <span className="w-1 h-1 rounded-full bg-[#18280E]/20" />
                          <span className="font-mono">sha {r.commit_sha.slice(0, 7)}</span>
                          <span className="w-1 h-1 rounded-full bg-[#18280E]/20" />
                          <span>{r.versionLabel}</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${gate.bg} ${gate.color} border ${gate.border} shrink-0`}>
                        <GateIcon size={12} />
                        {gate.label}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}