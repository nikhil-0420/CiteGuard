import React, { useState, useEffect, useMemo } from "react";
import { Link, useRouter } from "../router";
import AppShell from "../components/AppShell";
import { listReports, getReport } from "../api";

import { formatDateTime } from "../utils/date";
import {
  ShieldIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  AlertOctagonIcon,
  GitCommitIcon,
  FileTextIcon,
  SearchIcon,
  ArrowLeftIcon,
  ExternalLinkIcon,
  FilterIcon } from
"../components/Icons";












const REPORT_METADATA = {
  blocked: {
    title: "Agent Brief v1.4 — ResNet & Attention Claims",
    scenario: "Active Blocker Run",
    reason: "2 Blocking findings: Contradiction (<2% vs 3.57%) & Identity mismatch (2018 vs 2017)",
    versionLabel: "v1.4",
    blockedCount: 2,
    reviewCount: 3,
    passedCount: 2,
    exceptionsCount: 0
  },
  pending: {
    title: "Transformer Attention Verification — Exception Under Review",
    scenario: "Reviewer Exception Submitted",
    reason: "1 Reviewer exception awaiting approval for non-standard citation format",
    versionLabel: "v1.2",
    blockedCount: 0,
    reviewCount: 3,
    passedCount: 2,
    exceptionsCount: 1
  },
  passed: {
    title: "Attention Is All You Need — Clean Reference Audit",
    scenario: "Clean Baseline / Approved",
    reason: "All claims verified against canonical sources; 2 exceptions accepted",
    versionLabel: "v2.0",
    blockedCount: 0,
    reviewCount: 0,
    passedCount: 5,
    exceptionsCount: 2
  },
  error: {
    title: "Multimodal Agent Draft — Incomplete Extraction",
    scenario: "Extraction Syntax Error",
    reason: "Unparseable citation syntax prevented full AST generation",
    versionLabel: "v0.9-draft",
    blockedCount: 1,
    reviewCount: 0,
    passedCount: 0,
    exceptionsCount: 0
  }
};

export default function OverviewPage() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [previewReport, setPreviewReport] = useState(null);

  // Filters
  const [period, setPeriod] = useState("all");
  const [repoFilter, setRepoFilter] = useState("all");
  const [gateFilter, setGateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(() => formatDateTime(new Date().toISOString()));

  const loadData = () => {
    setIsLoading(true);
    listReports().
    then((raw) => {
      const augmented = raw.map((r) => {
        const meta = REPORT_METADATA[r.report_id] || {
          title: `Audit ${r.report_id} (${r.repo})`,
          scenario: "Custom Audit Run",
          reason: r.gate_state === "failure" ? "Blocking finding detected" : "Audit complete",
          versionLabel: "v1.0",
          blockedCount: r.gate_state === "failure" ? 1 : 0,
          reviewCount: r.gate_state === "pending" ? 1 : 0,
          passedCount: r.gate_state === "success" ? 1 : 0,
          exceptionsCount: 0
        };
        return { ...r, ...meta };
      });
      setReports(augmented);
      setIsLoading(false);
      setLastRefreshed(formatDateTime(new Date().toISOString()));
    }).
    catch(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch preview detail when a row is selected
  useEffect(() => {
    if (selectedAuditId) {
      getReport(selectedAuditId).
      then((data) => setPreviewReport(data)).
      catch(() => setPreviewReport(null));
    } else {
      setPreviewReport(null);
    }
  }, [selectedAuditId]);

  // Unique repositories for selector
  const availableRepos = useMemo(() => {
    const set = new Set();
    reports.forEach((r) => set.add(r.repo));
    return Array.from(set);
  }, [reports]);

  // Filtered dataset
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (repoFilter !== "all" && r.repo !== repoFilter) return false;
      if (gateFilter === "failure" && r.gate_state !== "failure") return false;
      if (gateFilter === "pending" && r.gate_state !== "pending") return false;
      if (gateFilter === "success" && r.gate_state !== "success") return false;
      if (gateFilter === "exceptions" && r.exceptionsCount === 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesRepo = r.repo.toLowerCase().includes(q);
        const matchesSha = r.commit_sha.toLowerCase().includes(q);
        const matchesReason = r.reason.toLowerCase().includes(q);
        if (!matchesTitle && !matchesRepo && !matchesSha && !matchesReason) return false;
      }
      return true;
    });
  }, [reports, repoFilter, gateFilter, searchQuery]);

  // Derived metrics — counts audits, not individual findings
  const metrics = useMemo(() => {
    let totalAudits = filteredReports.length;
    let blockingAudits = 0;
    let reviewAudits = 0;
    let passedAudits = 0;
    let exceptionsAudits = 0;

    filteredReports.forEach((r) => {
      if (r.gate_state === "failure") blockingAudits++;
      if (r.gate_state === "pending") reviewAudits++;
      if (r.gate_state === "success") passedAudits++;
      if (r.exceptionsCount > 0) exceptionsAudits++;
    });

    return { totalAudits, blockingAudits, reviewAudits, passedAudits, exceptionsAudits };
  }, [filteredReports]);

  // "Needs attention" queue: failure or pending items
  const attentionQueue = useMemo(() => {
    return filteredReports.filter((r) => r.gate_state === "failure" || r.gate_state === "pending");
  }, [filteredReports]);

  // Recent activity events
  const activityEvents = [
  {
    id: "ev-1",
    action: "Review exception recorded",
    actor: "Sam (@sam)",
    target: "F-001 (Attention Is All You Need)",
    time: "10 mins ago",
    reportId: "pending"
  },
  {
    id: "ev-2",
    action: "Gate check failed (2 blockers)",
    actor: "CiteGuard Bot",
    target: "PR #1 (commit 9f3c2a1)",
    time: "45 mins ago",
    reportId: "blocked"
  },
  {
    id: "ev-3",
    action: "Audit passed & check posted",
    actor: "CiteGuard Bot",
    target: "PR #7 (commit 4d1c9f2)",
    time: "2 hours ago",
    reportId: "passed"
  }];


  const getGateBadge = (state) => {
    const styles = {
      success: {
        bg: "var(--cg-pass-subtle)",
        color: "var(--cg-pass)",
        border: "var(--cg-pass-line)",
        label: "Passed",
        icon: <CheckCircleIcon size={11} />
      },
      failure: {
        bg: "var(--cg-block-subtle)",
        color: "var(--cg-block)",
        border: "var(--cg-block-line)",
        label: "Blocked",
        icon: <XCircleIcon size={11} />
      },
      pending: {
        bg: "var(--cg-review-subtle)",
        color: "var(--cg-review)",
        border: "var(--cg-review-line)",
        label: "Needs Review",
        icon: <AlertTriangleIcon size={11} />
      },
      error: {
        bg: "var(--cg-block-subtle)",
        color: "var(--cg-block)",
        border: "var(--cg-block-line)",
        label: "Error",
        icon: <AlertOctagonIcon size={11} />
      }
    };

    const s = styles[state];
    if (!s) return null;
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold"
        style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
        
        {s.icon}
        <span>{s.label}</span>
      </span>);

  };

  return (
    <AppShell breadcrumbs={[{ label: "Overview" }]}>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* ── Header & Filter Controls ── */}
        <div
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4"
          style={{ borderBottom: "1px solid var(--cg-line)" }}>
          
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--cg-ink)" }}>
              Workspace Overview
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--cg-ink-secondary)" }}>
              Active audit gates, pending reviewer exceptions, and verification analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Repository Filter */}
            <select
              value={repoFilter}
              onChange={(e) => setRepoFilter(e.target.value)}
              className="text-xs font-medium rounded-md px-2.5 py-1.5 outline-none"
              aria-label="Filter by repository"
              style={{
                background: "var(--cg-surface)",
                color: "var(--cg-ink)",
                border: "1px solid var(--cg-line)"
              }}>
              
              <option value="all">All repositories ({reports.length})</option>
              {availableRepos.map((repo) =>
              <option key={repo} value={repo}>{repo}</option>
              )}
            </select>

            {/* Period Selector */}
            <div
              className="flex items-center rounded-md p-0.5 text-xs"
              style={{ background: "var(--cg-surface)", border: "1px solid var(--cg-line)" }}>
              
              {["7d", "30d", "all"].map((p) =>
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className="px-2.5 py-1 rounded font-medium transition-colors"
                style={{
                  background: period === p ? "var(--cg-surface)" : "transparent",
                  color: period === p ? "#fff" : "var(--cg-ink-secondary)"
                }}>
                
                  {p === "all" ? "All time" : p}
                </button>
              )}
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={loadData}
              className="text-xs font-medium rounded-md px-2.5 py-1.5 transition-colors"
              title={`Last refreshed at ${lastRefreshed}`}
              style={{
                background: "var(--cg-surface)",
                color: "var(--cg-ink-secondary)",
                border: "1px solid var(--cg-line)"
              }}>
              
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* ── Metric Cards (Click-to-Filter) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 stagger">
          {[
          { key: "all", label: "Total Audits", value: metrics.totalAudits, sub: "All reports", color: "var(--cg-accent)" },
          { key: "failure", label: "Blocked", value: metrics.blockingAudits, sub: "Blocks merge gate", color: "var(--cg-block)" },
          { key: "pending", label: "Needs Review", value: metrics.reviewAudits, sub: "Awaiting sign-off", color: "var(--cg-review)" },
          { key: "success", label: "Passed", value: metrics.passedAudits, sub: "Verified", color: "var(--cg-pass)" },
          { key: "exceptions", label: "Exceptions", value: metrics.exceptionsAudits, sub: "Reviewer overrides", color: "var(--cg-accent)" }].
          map((card) => {
            const isActive = gateFilter === card.key;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setGateFilter(isActive && card.key !== "all" ? "all" : card.key)}
                className="text-left p-3.5 rounded-lg transition-all animate-fade-in"
                style={{
                  background: isActive ? "var(--cg-surface)" : "var(--cg-surface)",
                  border: `1px solid ${isActive ? card.color : "var(--cg-line)"}`,
                  boxShadow: isActive ? `0 0 0 1px ${card.color}` : "none"
                }}>
                
                <div
                  className="text-[10px] font-mono uppercase tracking-wider font-semibold"
                  style={{ color: card.color }}>
                  
                  {card.label}
                </div>
                <div className="text-2xl font-bold mt-1" style={{ color: "var(--cg-ink)" }}>
                  {card.value}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: "var(--cg-ink-muted)" }}>
                  {card.sub}
                </div>
              </button>);

          })}
        </div>

        {/* ── Needs Attention Queue ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold" style={{ color: "var(--cg-ink)" }}>
                Needs Attention
              </h2>
              <span
                className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: "var(--cg-block-subtle)",
                  color: "var(--cg-block)",
                  border: "1px solid var(--cg-block-line)"
                }}>
                
                {attentionQueue.length} actionable
              </span>
            </div>
            <Link
              href="/app/reviews"
              className="text-xs font-semibold hover:opacity-70 transition-opacity"
              style={{ color: "var(--cg-accent)" }}>
              
              View full review queue →
            </Link>
          </div>

          {attentionQueue.length === 0 ?
          <div
            className="p-8 text-center rounded-lg text-xs"
            style={{
              background: "var(--cg-surface)",
              border: "1px solid var(--cg-line)",
              color: "var(--cg-ink-secondary)"
            }}>
            
              No blocked reports or unresolved findings in the selected view.
            </div> :

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
              {attentionQueue.map((item) =>
            <div
              key={item.report_id}
              className="p-4 rounded-lg flex flex-col justify-between space-y-3 transition-all animate-fade-in"
              style={{
                background: "var(--cg-surface)",
                border: "1px solid var(--cg-line)"
              }}>
              
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono" style={{ color: "var(--cg-ink-secondary)" }}>
                        PR #{item.pr_number} · {item.repo}
                      </span>
                      {getGateBadge(item.gate_state)}
                    </div>

                    <div className="text-sm font-bold leading-snug" style={{ color: "var(--cg-ink)" }}>
                      {item.title}
                    </div>

                    <p
                  className="text-xs leading-relaxed p-2 rounded"
                  style={{
                    background: "var(--cg-surface-subtle)",
                    border: "1px solid var(--cg-line)",
                    color: "var(--cg-ink-secondary)"
                  }}>
                  
                      <strong style={{ color: "var(--cg-block)" }}>Issue:</strong> {item.reason}
                    </p>
                  </div>

                  <div
                className="pt-2 flex items-center justify-between text-xs"
                style={{ borderTop: "1px solid var(--cg-line)" }}>
                
                    <div className="flex items-center gap-2 font-mono text-[11px]" style={{ color: "var(--cg-ink-secondary)" }}>
                      <span>SHA: {item.commit_sha.slice(0, 7)}</span>
                      <span>·</span>
                      <span>{item.versionLabel}</span>
                    </div>

                    <Link
                  href={`/app/audits/${item.report_id}?finding=${item.gate_state === "failure" ? "F-003" : "F-004"}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold text-white transition-colors"
                  style={{ background: "var(--cg-surface)" }}>
                  
                      <span>Open evidence</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
            )}
            </div>
          }
        </div>

        {/* ── Analytics: Outcome Bar + Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Stacked Outcome Distribution */}
          <div
            className="lg:col-span-7 rounded-lg p-5 space-y-4"
            style={{
              background: "var(--cg-surface)",
              border: "1px solid var(--cg-line)"
            }}>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--cg-ink)" }}>
                  Audit Outcome Breakdown
                </h3>
                <p className="text-xs" style={{ color: "var(--cg-ink-secondary)" }}>
                  Gate status distribution ({period === "all" ? "All time" : period}).
                </p>
              </div>
              {gateFilter !== "all" &&
              <button
                type="button"
                onClick={() => setGateFilter("all")}
                className="text-xs font-medium hover:opacity-70 transition-opacity"
                style={{ color: "var(--cg-accent)" }}>
                
                  Clear filter
                </button>
              }
            </div>

            {/* Visual Stacked Bar */}
            <div className="space-y-2">
              <div
                className="h-7 w-full rounded-md overflow-hidden flex"
                style={{ background: "var(--cg-surface-subtle)", border: "1px solid var(--cg-line)" }}>
                
                {metrics.totalAudits > 0 ?
                <>
                    <div
                    style={{ width: `${metrics.blockingAudits / metrics.totalAudits * 100}%`, background: "var(--cg-block)" }}
                    className="flex items-center justify-center text-[11px] font-bold text-white font-mono cursor-pointer hover:opacity-90 transition-opacity"
                    title={`Blocked: ${metrics.blockingAudits} audits`}
                    onClick={() => setGateFilter("failure")}>
                    
                      {metrics.blockingAudits > 0 ? metrics.blockingAudits : ""}
                    </div>
                    <div
                    style={{ width: `${metrics.reviewAudits / metrics.totalAudits * 100}%`, background: "var(--cg-review)" }}
                    className="flex items-center justify-center text-[11px] font-bold text-white font-mono cursor-pointer hover:opacity-90 transition-opacity"
                    title={`Review: ${metrics.reviewAudits} audits`}
                    onClick={() => setGateFilter("pending")}>
                    
                      {metrics.reviewAudits > 0 ? metrics.reviewAudits : ""}
                    </div>
                    <div
                    style={{ width: `${metrics.passedAudits / metrics.totalAudits * 100}%`, background: "var(--cg-pass)" }}
                    className="flex items-center justify-center text-[11px] font-bold text-white font-mono cursor-pointer hover:opacity-90 transition-opacity"
                    title={`Passed: ${metrics.passedAudits} audits`}
                    onClick={() => setGateFilter("success")}>
                    
                      {metrics.passedAudits > 0 ? metrics.passedAudits : ""}
                    </div>
                  </> :

                <div className="w-full flex items-center justify-center text-xs" style={{ color: "var(--cg-ink-secondary)" }}>
                    No audits matching current filters
                  </div>
                }
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-between text-xs" style={{ color: "var(--cg-ink-secondary)" }}>
                {[
                { label: "Blocked", count: metrics.blockingAudits, color: "var(--cg-block)", filter: "failure" },
                { label: "Needs Review", count: metrics.reviewAudits, color: "var(--cg-review)", filter: "pending" },
                { label: "Passed", count: metrics.passedAudits, color: "var(--cg-pass)", filter: "success" },
                { label: "Exceptions", count: metrics.exceptionsAudits, color: "var(--cg-accent)", filter: "exceptions" }].
                map((item) =>
                <button
                  key={item.label}
                  type="button"
                  className="flex items-center gap-1.5 cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => setGateFilter(item.filter)}>
                  
                    <span className="w-2.5 h-2.5 rounded" style={{ background: item.color }} />
                    <span>{item.label} ({item.count})</span>
                  </button>
                )}
              </div>
            </div>

            <p
              className="text-[11px] pt-2"
              style={{ color: "var(--cg-ink-muted)", borderTop: "1px solid var(--cg-line)" }}>
              
              Click any bar segment or legend item to filter the table below.
            </p>
          </div>

          {/* Activity Stream */}
          <div
            className="lg:col-span-5 rounded-lg p-5 space-y-4"
            style={{
              background: "var(--cg-surface)",
              border: "1px solid var(--cg-line)"
            }}>
            
            <h3 className="text-sm font-bold" style={{ color: "var(--cg-ink)" }}>Recent Audit Events</h3>
            <div style={{ borderColor: "var(--cg-line)" }}>
              {activityEvents.map((ev, i) =>
              <div
                key={ev.id}
                onClick={() => router.navigate(`/app/audits/${ev.reportId}`)}
                className="py-2.5 flex items-start justify-between cursor-pointer -mx-2 px-2 rounded transition-colors"
                style={{
                  borderBottom: i < activityEvents.length - 1 ? "1px solid var(--cg-line)" : "none"
                }}>
                
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold truncate" style={{ color: "var(--cg-ink)" }}>{ev.action}</div>
                    <div className="text-[11px] truncate" style={{ color: "var(--cg-ink-secondary)" }}>
                      {ev.actor} on {ev.target}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--cg-ink-muted)" }}>{ev.time}</span>
                </div>
              )}
            </div>
            <div>
              <span className="text-[11px] font-mono" style={{ color: "var(--cg-ink-muted)" }}>
                Log stream synced with GitHub PR commit events.
              </span>
            </div>
          </div>
        </div>

        {/* ── Reports Table ── */}
        <div
          className="rounded-lg overflow-hidden"
          style={{
            background: "var(--cg-surface)",
            border: "1px solid var(--cg-line)"
          }}>
          
          {/* Table Toolbar */}
          <div
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            style={{
              background: "var(--cg-surface-subtle)",
              borderBottom: "1px solid var(--cg-line)"
            }}>
            
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold" style={{ color: "var(--cg-ink)" }}>Evaluated Reports & Runs</h2>
              <span className="text-xs font-mono" style={{ color: "var(--cg-ink-secondary)" }}>({filteredReports.length})</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <SearchIcon
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--cg-ink-muted)" }} />
                
                <input
                  type="text"
                  placeholder="Filter by title, SHA, repo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-md w-64 outline-none"
                  style={{
                    background: "var(--cg-surface)",
                    border: "1px solid var(--cg-line)",
                    color: "var(--cg-ink)"
                  }} />
                
              </div>

              {gateFilter !== "all" &&
              <button
                type="button"
                onClick={() => setGateFilter("all")}
                className="text-xs font-medium hover:opacity-70 transition-opacity"
                style={{ color: "var(--cg-accent)" }}>
                
                  Reset filter
                </button>
              }
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className="text-[10px] font-mono uppercase tracking-wider"
                  style={{
                    background: "var(--cg-surface-subtle)",
                    color: "var(--cg-ink-secondary)",
                    borderBottom: "1px solid var(--cg-line)"
                  }}>
                  
                  <th className="py-2.5 px-4 font-semibold">Report Title & Run</th>
                  <th className="py-2.5 px-4 font-semibold">Repository / PR</th>
                  <th className="py-2.5 px-4 font-semibold">Gate Status</th>
                  <th className="py-2.5 px-4 font-semibold">Findings</th>
                  <th className="py-2.5 px-4 font-semibold">Evaluated</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ?
                <tr>
                    <td colSpan={6} className="py-8 text-center" style={{ color: "var(--cg-ink-secondary)" }}>
                      No audit runs found matching current filter parameters.
                    </td>
                  </tr> :

                filteredReports.map((r) => {
                  const isSelected = selectedAuditId === r.report_id;
                  return (
                    <tr
                      key={r.report_id}
                      onClick={() => setSelectedAuditId(r.report_id)}
                      className="cursor-pointer transition-colors"
                      style={{
                        background: isSelected ? "var(--cg-accent-subtle)" : "transparent",
                        borderBottom: "1px solid var(--cg-line)"
                      }}>
                      
                        <td className="py-3 px-4">
                          <div className="font-semibold text-xs" style={{ color: "var(--cg-ink)" }}>{r.title}</div>
                          <div className="text-[11px] font-mono mt-0.5" style={{ color: "var(--cg-ink-secondary)" }}>
                            {r.scenario} · {r.versionLabel}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium" style={{ color: "var(--cg-ink)" }}>{r.repo}</div>
                          <div className="text-[11px] font-mono" style={{ color: "var(--cg-ink-secondary)" }}>
                            PR #{r.pr_number} (sha {r.commit_sha.slice(0, 7)})
                          </div>
                        </td>
                        <td className="py-3 px-4">{getGateBadge(r.gate_state)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            {r.blockedCount > 0 &&
                          <span
                            className="px-1.5 py-0.5 rounded font-semibold"
                            style={{ background: "var(--cg-block-subtle)", color: "var(--cg-block)", border: "1px solid var(--cg-block-line)" }}>
                            
                                {r.blockedCount} Blocked
                              </span>
                          }
                            {r.reviewCount > 0 &&
                          <span
                            className="px-1.5 py-0.5 rounded font-semibold"
                            style={{ background: "var(--cg-review-subtle)", color: "var(--cg-review)", border: "1px solid var(--cg-review-line)" }}>
                            
                                {r.reviewCount} Review
                              </span>
                          }
                            {r.passedCount > 0 &&
                          <span
                            className="px-1.5 py-0.5 rounded font-semibold"
                            style={{ background: "var(--cg-pass-subtle)", color: "var(--cg-pass)", border: "1px solid var(--cg-pass-line)" }}>
                            
                                {r.passedCount} Passed
                              </span>
                          }
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]" style={{ color: "var(--cg-ink-secondary)" }}>
                          {formatDateTime(r.generated_at)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                          href={`/app/audits/${r.report_id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity"
                          style={{ color: "var(--cg-accent)" }}
                          onClick={(e) => e.stopPropagation()}>
                          
                            <span>Inspect</span>
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

        {/* ── Preview Drawer ── */}
        {selectedAuditId &&
        <div
          className="rounded-lg p-5 space-y-4 animate-slide-up"
          style={{
            background: "var(--cg-surface)",
            border: "1px solid var(--cg-line)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}>
          
            <div
            className="flex items-center justify-between pb-3"
            style={{ borderBottom: "1px solid var(--cg-line)" }}>
            
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--cg-ink-secondary)" }}>
                  Quick Audit Preview
                </span>
                <span className="font-mono text-xs font-semibold" style={{ color: "var(--cg-ink)" }}>{selectedAuditId}</span>
              </div>
              <button
              type="button"
              onClick={() => setSelectedAuditId(null)}
              className="text-xs font-mono hover:opacity-70 transition-opacity"
              style={{ color: "var(--cg-ink-secondary)" }}>
              
                Close ✕
              </button>
            </div>

            {previewReport ?
          <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="block font-mono text-[11px]" style={{ color: "var(--cg-ink-secondary)" }}>Repository:</span>
                    <span className="font-semibold" style={{ color: "var(--cg-ink)" }}>{previewReport.repo}</span>
                  </div>
                  <div>
                    <span className="block font-mono text-[11px]" style={{ color: "var(--cg-ink-secondary)" }}>Commit SHA:</span>
                    <span className="font-mono" style={{ color: "var(--cg-ink)" }}>{previewReport.commit_sha}</span>
                  </div>
                  <div>
                    <span className="block font-mono text-[11px]" style={{ color: "var(--cg-ink-secondary)" }}>Gate Verdict:</span>
                    <span className="font-semibold">{previewReport.gate.description}</span>
                  </div>
                </div>

                <div>
                  <span className="block font-mono text-[11px] mb-1" style={{ color: "var(--cg-ink-secondary)" }}>
                    Evaluated Findings ({previewReport.findings.length}):
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {previewReport.findings.map((f) =>
                <div
                  key={f.id}
                  className="p-2 rounded flex items-center justify-between"
                  style={{
                    background: "var(--cg-surface-subtle)",
                    border: "1px solid var(--cg-line)"
                  }}>
                  
                        <div className="min-w-0 pr-2">
                          <span className="font-mono font-bold mr-2" style={{ color: "var(--cg-ink)" }}>{f.id}</span>
                          <span className="truncate" style={{ color: "var(--cg-ink)" }}>{f.claim_text}</span>
                        </div>
                        <span
                    className="px-1.5 py-px rounded text-[10px] font-mono font-bold shrink-0"
                    style={{
                      background:
                      f.action === "block" ?
                      "var(--cg-block-subtle)" :
                      f.action === "review" ?
                      "var(--cg-review-subtle)" :
                      "var(--cg-pass-subtle)",
                      color:
                      f.action === "block" ?
                      "var(--cg-block)" :
                      f.action === "review" ?
                      "var(--cg-review)" :
                      "var(--cg-pass)",
                      border: `1px solid ${
                      f.action === "block" ?
                      "var(--cg-block-line)" :
                      f.action === "review" ?
                      "var(--cg-review-line)" :
                      "var(--cg-pass-line)"}`

                    }}>
                    
                          {f.action.toUpperCase()}
                        </span>
                      </div>
                )}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between" style={{ borderTop: "1px solid var(--cg-line)" }}>
                  <span className="font-mono text-[11px]" style={{ color: "var(--cg-ink-secondary)" }}>
                    Evaluated at: {formatDateTime(previewReport.generated_at)}
                  </span>
                  <Link
                href={`/app/audits/${selectedAuditId}`}
                className="px-4 py-1.5 rounded text-xs font-semibold text-white transition-colors"
                style={{ background: "var(--cg-accent)" }}>
                
                    Open full audit workspace →
                  </Link>
                </div>
              </div> :

          <div className="py-4 text-center text-xs" style={{ color: "var(--cg-ink-secondary)" }}>
                Loading report preview...
              </div>
          }
          </div>
        }
      </div>
    </AppShell>);

}