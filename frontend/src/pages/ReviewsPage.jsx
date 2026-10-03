import React, { useState, useEffect, useMemo } from "react";
import { Link } from "../router";
import AppShell from "../components/AppShell";
import { listReports, getReport } from "../api";
import {
  SearchIcon,
  AlertTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
} from "../components/Icons";

const RUN_SCENARIOS = {
  blocked: { scenario: "Active Blocker Run", aging: "25 mins ago" },
  pending: { scenario: "Reviewer Exception Submitted", aging: "4 hrs ago" },
  passed: { scenario: "Baseline Verified", aging: "2 days ago" },
  error: { scenario: "Incomplete Extraction", aging: "5 days ago" },
};

export default function ReviewsPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listReports()
      .then(async (reportsList) => {
        const queue = [];
        for (const rep of reportsList) {
          try {
            const full = await getReport(rep.report_id);
            const scenarioMeta = RUN_SCENARIOS[rep.report_id] || {
              scenario: "Custom Audit Run",
              aging: "Recent",
            };
            full.findings.forEach((f) => {
              if (f.action === "review" || f.action === "block" || f.exception) {
                queue.push({
                  compositeId: `${full.report_id}-${f.id}`,
                  reportId: full.report_id,
                  repo: full.repo,
                  scenario: scenarioMeta.scenario,
                  commitSha: full.commit_sha,
                  aging: scenarioMeta.aging,
                  finding: f,
                });
              }
            });
          } catch {
            // Ignore missing reports
          }
        }
        setItems(queue);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => {
      const f = item.finding;
      return (
        f.claim_text.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        f.citation_key.toLowerCase().includes(q) ||
        f.reference.title.toLowerCase().includes(q) ||
        item.repo.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const getActionStyle = (finding) => {
    if (finding.exception) {
      return { label: "Excepted", color: "text-[#166534]", bg: "bg-[#F4FAED]", border: "border-[#18280E]/20", icon: CheckCircleIcon };
    }
    if (finding.action === "block") {
      return { label: "Blocks Gate", color: "text-[#991B1B]", bg: "bg-[#FEF2F2]", border: "border-[#FECACA]", icon: XCircleIcon };
    }
    return { label: "Needs Review", color: "text-[#B45309]", bg: "bg-[#FFFBEB]", border: "border-[#FDE68A]", icon: AlertTriangleIcon };
  };

  return (
    <AppShell breadcrumbs={[{ label: "Review Queue" }]}>
      <div className="flex-1 flex flex-col min-h-[calc(100vh-56px)]">
        {/* Header */}
        <div className="px-6 md:px-8 pt-8 pb-6">
          <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#090F05]">
              Review Queue
            </h1>
            <p className="text-sm text-[#5C6854] mt-1.5">
              Findings that need human review or are blocking a merge gate.
            </p>

            {/* Search */}
            <div className="w-full max-w-lg mt-5 relative">
              <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9684]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search claims, citations, papers..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border-2 border-[#18280E]/12 text-sm text-[#090F05] placeholder-[#8A9684] outline-none focus:border-[#18280E] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Review Items */}
        <div className="flex-1 px-6 md:px-8 pb-8">
          <div className="max-w-3xl mx-auto space-y-3">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-[#8A9684]">
                Loading review queue...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#8A9684]">
                {search ? `No items matching "${search}"` : "No items in the review queue."}
              </div>
            ) : (
              filtered.map((item) => {
                const f = item.finding;
                const style = getActionStyle(f);
                const ActionIcon = style.icon;
                return (
                  <Link
                    key={item.compositeId}
                    href={`/app/audits/${item.reportId}?finding=${f.id}`}
                    className="block p-5 rounded-xl bg-white border border-[#18280E]/10 hover:border-[#18280E]/25 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-[#090F05]">{f.id}</span>
                          <span className="text-[10px] text-[#8A9684]">·</span>
                          <span className="text-[11px] text-[#5C6854]">{item.scenario}</span>
                        </div>
                        <div className="text-sm text-[#090F05] leading-relaxed line-clamp-2">
                          {f.claim_text}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-[#8A9684]">
                          <span className="font-mono">@{f.citation_key}</span>
                          <span className="w-1 h-1 rounded-full bg-[#18280E]/15" />
                          <span className="truncate">{f.reference.title}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${style.bg} ${style.color} border ${style.border}`}>
                          <ActionIcon size={12} />
                          {style.label}
                        </span>
                        <span className="text-[10px] text-[#8A9684] font-mono">{item.aging}</span>
                      </div>
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