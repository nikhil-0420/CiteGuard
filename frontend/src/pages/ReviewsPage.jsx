import React, { useState, useEffect, useMemo } from "react";
import { Link } from "../router";
import AppShell from "../components/AppShell";
import { listReports, getReport } from "../api";

import { formatDateTime } from "../utils/date";
import {
  ListIcon,
  AlertTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  FilterIcon,
  SearchIcon,
  ExternalLinkIcon } from
"../components/Icons";












const RUN_SCENARIOS = {
  blocked: { scenario: "Active Blocker Run", aging: "25 mins ago" },
  pending: { scenario: "Reviewer Exception Submitted", aging: "4 hrs ago" },
  passed: { scenario: "Baseline Verified", aging: "2 days ago" },
  error: { scenario: "Incomplete Extraction", aging: "5 days ago" }
};

export default function ReviewsPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState("blocked"); // Default to active scenario!
  const [filterAction, setFilterAction] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    listReports().
    then(async (reportsList) => {
      const queue = [];
      for (const rep of reportsList) {
        try {
          const full = await getReport(rep.report_id);
          const scenarioMeta = RUN_SCENARIOS[rep.report_id] || {
            scenario: "Custom Audit Run",
            aging: "Recent"
          };
          full.findings.forEach((f) => {
            // Only add if it requires action or has exception
            if (f.action === "review" || f.action === "block" || f.exception) {
              queue.push({
                compositeId: `${full.report_id}-${f.id}`,
                reportId: full.report_id,
                repo: full.repo,
                scenario: scenarioMeta.scenario,
                commitSha: full.commit_sha,
                generatedAt: full.generated_at,
                aging: scenarioMeta.aging,
                finding: f
              });
            }
          });
        } catch {

          // Ignore missing reports
        }}
      setItems(queue);
      setIsLoading(false);
    }).
    catch(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      // Run/Scenario filter
      if (selectedRun !== "all" && item.reportId !== selectedRun) return false;

      // Action filter
      if (filterAction === "block" && item.finding.action !== "block") return false;
      if (filterAction === "review" && item.finding.action !== "review") return false;
      if (filterAction === "excepted" && !item.finding.exception) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const mText = item.finding.claim_text.toLowerCase().includes(q);
        const mRepo = item.repo.toLowerCase().includes(q);
        const mId = item.finding.id.toLowerCase().includes(q);
        const mKey = item.finding.citation_key.toLowerCase().includes(q);
        const mTitle = item.finding.reference.title.toLowerCase().includes(q);
        return mText || mRepo || mId || mKey || mTitle;
      }
      return true;
    });
  }, [items, selectedRun, filterAction, search]);

  return (
    <AppShell breadcrumbs={[{ label: "Review Queue" }]}>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--cg-line)]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--cg-ink)]">Review Queue</h1>
            <p className="text-xs text-[var(--cg-ink-secondary)] mt-0.5">
              Claim-specific triage queue of unverified assertions, contradictions, and reviewer exceptions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--cg-ink-secondary)] font-semibold">Active Run Scenario:</span>
            <select
              value={selectedRun}
              onChange={(e) => setSelectedRun(e.target.value)}
              className="text-xs font-medium bg-white text-[var(--cg-ink)] border border-[var(--cg-line)] rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[var(--cg-accent)]">
              
              <option value="blocked">Active Blocker Run (Default · blocked)</option>
              <option value="pending">Review Exception Scenario (pending)</option>
              <option value="passed">Approved Baseline (passed)</option>
              <option value="all">All Runs & Scenarios Combined</option>
            </select>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white border border-[var(--cg-line)] rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cg-ink-secondary)]" />
            <input
              type="text"
              placeholder="Search claim, citation key, or paper title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[var(--cg-line)] rounded-md text-[var(--cg-ink)] placeholder-[var(--cg-ink-muted)] focus:outline-none focus:border-[var(--cg-accent)]" />
            
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--cg-ink-secondary)] font-medium">Filter Action:</span>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="bg-white border border-[var(--cg-line)] rounded px-2.5 py-1 text-xs text-[var(--cg-ink)] focus:outline-none focus:border-[var(--cg-accent)]">
                
                <option value="all">All Outstanding</option>
                <option value="block">Blocking Contradictions</option>
                <option value="review">Needs Review Only</option>
                <option value="excepted">Accepted Exceptions</option>
              </select>
            </div>
          </div>
        </div>

        {/* Queue Items Table */}
        <div className="bg-white border border-[var(--cg-line)] rounded-lg shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--cg-surface-subtle)] border-b border-[var(--cg-line)] text-[var(--cg-ink-secondary)] font-mono uppercase text-[11px]">
                  <th className="py-2.5 px-4 font-semibold w-24">Finding ID</th>
                  <th className="py-2.5 px-4 font-semibold">Claim Assertion & Citation</th>
                  <th className="py-2.5 px-4 font-semibold">Reference Source</th>
                  <th className="py-2.5 px-4 font-semibold">Action / Status</th>
                  <th className="py-2.5 px-4 font-semibold">Aging / Assignment</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cg-line)]">
                {isLoading ?
                <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--cg-ink-secondary)]">
                      Loading review queue...
                    </td>
                  </tr> :
                filtered.length === 0 ?
                <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--cg-ink-secondary)]">
                      No review items found in this scenario matching your filter.
                    </td>
                  </tr> :

                filtered.map((item) => {
                  const f = item.finding;
                  return (
                    <tr key={item.compositeId} className="hover:bg-[var(--cg-surface)] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[var(--cg-ink)]">
                          <div>{f.id}</div>
                          <div className="text-[10px] text-[var(--cg-ink-secondary)] font-normal">{item.scenario}</div>
                        </td>
                        <td className="py-3 px-4 max-w-md">
                          <div className="font-semibold text-[var(--cg-ink)] text-xs line-clamp-2">
                            {f.claim_text}
                          </div>
                          <div className="text-[11px] text-[var(--cg-ink-secondary)] font-mono mt-0.5">
                            Line {f.line} · [@{f.citation_key}]
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-medium text-[var(--cg-ink)] truncate">{f.reference.title}</div>
                          <div className="text-[11px] text-[var(--cg-ink-secondary)] font-mono">
                            {f.reference.year ? `${f.reference.year}` : "Year unk."} · {f.reference.status}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {f.exception ?
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--cg-accent-subtle)] text-[var(--cg-accent)] border border-[var(--cg-accent)]/30">
                              <CheckCircleIcon size={11} />
                              EXCEPTED (@{f.exception.reviewer})
                            </span> :
                        f.action === "block" ?
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--cg-block-subtle)] text-[var(--cg-block)] border border-[var(--cg-block-line)]">
                              <XCircleIcon size={11} />
                              BLOCKS GATE
                            </span> :

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--cg-review-subtle)] text-[var(--cg-review)] border border-[var(--cg-review-line)]">
                              <AlertTriangleIcon size={11} />
                              NEEDS REVIEW
                            </span>
                        }
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs text-[var(--cg-ink)] font-mono">{item.aging}</div>
                          <div className="text-[10px] text-[var(--cg-ink-secondary)]">
                            Assignment: Any allowlisted reviewer
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                          href={`/app/audits/${item.reportId}?finding=${f.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[var(--cg-surface)] hover:bg-[var(--cg-surface-subtle)] text-white text-xs font-semibold shadow-2xs transition-colors">
                          
                            <span>Inspect Evidence</span>
                            <span>→</span>
                          </Link>
                        </td>
                      </tr>);

                })
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>);

}