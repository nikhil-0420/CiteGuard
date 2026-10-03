import React, { useState, useEffect } from "react";
import { useRouter } from "../router";

import { getReport } from "../api";
import AppShell from "../components/AppShell";
import DocumentViewer from "../components/DocumentViewer";
import EvidencePanel from "../components/EvidencePanel";
import ExceptionModal from "../components/ExceptionModal";
import TraceComparisonModal from "../components/TraceComparisonModal";
import { SAMPLE_MARKDOWN } from "../utils/sampleBrief";
import { exportReportAsJson, exportFindingsAsCsv, printAuditReport } from "../utils/export";
import { formatDateTime } from "../utils/date";
import {
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  AlertOctagonIcon,
  GitCommitIcon,
  DownloadIcon,
  SplitIcon,
  FilterIcon,
  SearchIcon,
  ChevronDownIcon,
  ExternalLinkIcon } from
"../components/Icons";






export default function AuditWorkspacePage({
  auditId,
  isSampleMode = false
}) {
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Tabs on Left Pane: "findings" or "document"
  const [leftTab, setLeftTab] = useState(
    router.searchParams.get("tab") === "document" ? "document" : "findings"
  );

  // Selected finding ID
  const [selectedFindingId, setSelectedFindingId] = useState(
    router.searchParams.get("finding") || ""
  );

  // Filters for findings rail
  const [filterAction, setFilterAction] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [exceptionModalFinding, setExceptionModalFinding] = useState(null);
  const [traceComparisonOpen, setTraceComparisonOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    getReport(auditId).
    then((data) => {
      setReport(data);
      setIsLoading(false);

      // Section 6 Mandate:
      // Default to the highest-priority unexcepted blocking finding,
      // then outstanding review, then supported findings.
      // Honor explicit deep-linked selection if present in searchParams.
      const urlFinding = router.searchParams.get("finding");
      const matchedUrl = urlFinding ? data.findings.find((f) => f.id === urlFinding) : null;

      if (matchedUrl) {
        setSelectedFindingId(matchedUrl.id);
      } else if (data.findings.length > 0) {
        const firstBlocker = data.findings.find((f) => f.action === "block" && !f.exception);
        const firstReview = data.findings.find((f) => f.action === "review" && !f.exception);
        const defaultFinding = firstBlocker || firstReview || data.findings[0];
        setSelectedFindingId(defaultFinding.id);
      }
    }).
    catch((err) => {
      setIsLoading(false);
      setLoadError(err.message || "Failed to load audit report");
    });
  }, [auditId]);

  const handleSelectFinding = (findingId) => {
    setSelectedFindingId(findingId);
    const newParams = new URLSearchParams(window.location.search);
    newParams.set("finding", findingId);
    window.history.replaceState(null, "", `?${newParams.toString()}`);
  };

  const handleTabChange = (newTab) => {
    setLeftTab(newTab);
    const newParams = new URLSearchParams(window.location.search);
    if (newTab === "document") {
      newParams.set("tab", "document");
    } else {
      newParams.delete("tab");
    }
    window.history.replaceState(null, "", `?${newParams.toString()}`);
  };

  const handleExceptionSuccess = (updated) => {
    setReport(updated);
    setExceptionModalFinding(null);
  };

  if (isLoading) {
    return (
      <AppShell
        isSampleMode={isSampleMode}
        breadcrumbs={[
        { label: "Audits", href: isSampleMode ? "/demo/audits/blocked" : "/app/audits" },
        { label: auditId }]
        }>
        
        <div className="flex items-center justify-center h-96 text-sm font-mono text-[var(--ink-subdued)]">
          Loading audit workspace for {auditId}...
        </div>
      </AppShell>);

  }

  if (loadError || !report) {
    return (
      <AppShell
        isSampleMode={isSampleMode}
        breadcrumbs={[
        { label: "Audits", href: isSampleMode ? "/demo/audits/blocked" : "/app/audits" },
        { label: auditId }]
        }>
        
        <div className="p-8 max-w-2xl mx-auto my-12 bg-[var(--status-block-bg)] border border-[var(--status-block-fg)] border-opacity-30 rounded-md text-[var(--status-block-fg)] space-y-3">
          <h2 className="text-base font-bold">Unable to load audit report</h2>
          <p className="text-sm opacity-90">{loadError || "Report does not exist or network connection failed."}</p>
        </div>
      </AppShell>);

  }

  // Filter findings
  const filteredFindings = report.findings.filter((f) => {
    if (filterAction !== "all" && f.action !== filterAction) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = f.claim_text.toLowerCase().includes(q);
      const matchKey = f.citation_key.toLowerCase().includes(q);
      const matchTitle = f.reference.title.toLowerCase().includes(q);
      const matchId = f.id.toLowerCase().includes(q);
      return matchText || matchKey || matchTitle || matchId;
    }
    return true;
  });

  const selectedFinding =
  report.findings.find((f) => f.id === selectedFindingId) || report.findings[0];

  const getGateBadge = (state) => {
    switch (state) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-[var(--status-pass-bg)] text-[var(--status-pass-fg)] border border-[#CDE5CD]">
            <CheckCircleIcon size={14} />
            <span>PASSED</span>
          </span>);

      case "failure":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-[var(--status-block-bg)] text-[var(--status-block-fg)] border border-[#F2CACA]">
            <XCircleIcon size={14} />
            <span>BLOCKED</span>
          </span>);

      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-[var(--status-review-bg)] text-[var(--status-review-fg)] border border-[#F6DCB6]">
            <AlertTriangleIcon size={14} />
            <span>PENDING REVIEW</span>
          </span>);

      case "error":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-[var(--status-block-bg)] text-[var(--status-block-fg)] border border-[#F2CACA]">
            <AlertOctagonIcon size={14} />
            <span>EXTRACTION ERROR</span>
          </span>);

      default:
        return null;
    }
  };

  const acceptedExceptionsCount = report.findings.filter((f) => f.exception).length;

  return (
    <AppShell
      isSampleMode={isSampleMode}
      breadcrumbs={[
      { label: "Audits", href: isSampleMode ? "/demo/audits/blocked" : "/app/audits" },
      { label: report.report_id }]
      }>
      
      <div className="flex flex-col h-full bg-[var(--cg-canvas)]">
        {/* Sample State Switcher Bar */}
        {isSampleMode &&
        <div className="px-6 py-2 bg-[var(--cg-surface)] border-b border-[var(--border-strong)] flex items-center gap-3 overflow-x-auto shrink-0">
            <span className="text-xs font-mono text-[var(--ink-subdued)] uppercase font-bold tracking-widest shrink-0 mr-2">
              Sample Scenarios:
            </span>
            <button
            type="button"
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors shrink-0 ${
            report.report_id === "blocked" ?
            "bg-[var(--cg-ink)] text-[var(--cg-surface)]" :
            "bg-[var(--cg-block)] text-[var(--ink-subdued)] hover:text-[var(--cg-ink)] hover:bg-[var(--border-faint)] border border-[var(--border-faint)]"}`
            }
            onClick={() => router.navigate("/demo/audits/blocked")}>
            
              Blocked (Contradiction)
            </button>
            <button
            type="button"
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors shrink-0 ${
            report.report_id === "pending" ?
            "bg-[var(--cg-ink)] text-[var(--cg-surface)]" :
            "bg-[var(--cg-block)] text-[var(--ink-subdued)] hover:text-[var(--cg-ink)] hover:bg-[var(--border-faint)] border border-[var(--border-faint)]"}`
            }
            onClick={() => router.navigate("/demo/audits/pending")}>
            
              Pending Review
            </button>
            <button
            type="button"
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors shrink-0 ${
            report.report_id === "passed" ?
            "bg-[var(--cg-ink)] text-[var(--cg-surface)]" :
            "bg-[var(--cg-block)] text-[var(--ink-subdued)] hover:text-[var(--cg-ink)] hover:bg-[var(--border-faint)] border border-[var(--border-faint)]"}`
            }
            onClick={() => router.navigate("/demo/audits/passed")}>
            
              Passed with Exceptions
            </button>
            <button
            type="button"
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors shrink-0 ${
            report.report_id === "error" ?
            "bg-[var(--cg-ink)] text-[var(--cg-surface)]" :
            "bg-[var(--cg-block)] text-[var(--ink-subdued)] hover:text-[var(--cg-ink)] hover:bg-[var(--border-faint)] border border-[var(--border-faint)]"}`
            }
            onClick={() => router.navigate("/demo/audits/error")}>
            
              Extraction Syntax Error
            </button>
          </div>
        }

        {/* Compact Workspace Header Bar */}
        <div className="bg-[var(--cg-surface)] px-6 py-4 border-b border-[var(--border-strong)] shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--cg-ink)]">
                  {report.repo} · PR #{report.pr_number}
                </h1>
                {getGateBadge(report.gate.state)}
              </div>
              <p className="text-sm text-[var(--ink-subdued)] mt-1">
                {report.gate.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold text-[var(--cg-ink)] bg-[var(--cg-surface)] border border-[var(--border-strong)] hover:bg-[var(--cg-block)] transition-colors"
                onClick={() => setTraceComparisonOpen(true)}>
                
                <SplitIcon size={16} />
                <span>Compare Traces</span>
              </button>

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold text-[var(--cg-ink)] bg-[var(--cg-surface)] border border-[var(--border-strong)] hover:bg-[var(--cg-block)] transition-colors"
                  onClick={() => setExportMenuOpen((o) => !o)}>
                  
                  <DownloadIcon size={16} />
                  <span>Export</span>
                  <ChevronDownIcon size={14} />
                </button>

                {exportMenuOpen &&
                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--cg-surface)] border border-[var(--border-strong)] rounded-md shadow-lg p-1.5 z-50 animate-in fade-in duration-100 text-sm">
                    <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm font-medium text-[var(--cg-ink)] hover:bg-[var(--cg-block)] rounded transition-colors"
                    onClick={() => {
                      exportReportAsJson(report);
                      setExportMenuOpen(false);
                    }}>
                    
                      Export JSON Report
                    </button>
                    <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm font-medium text-[var(--cg-ink)] hover:bg-[var(--cg-block)] rounded transition-colors"
                    onClick={() => {
                      exportFindingsAsCsv(report);
                      setExportMenuOpen(false);
                    }}>
                    
                      Export CSV (Sanitized)
                    </button>
                    <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm font-medium text-[var(--cg-ink)] hover:bg-[var(--cg-block)] rounded transition-colors"
                    onClick={() => {
                      printAuditReport();
                      setExportMenuOpen(false);
                    }}>
                    
                      Printable View
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>

          {/* Metadata & Summary Strip */}
          <div className="flex flex-wrap items-center justify-between text-sm pt-3 border-t border-[var(--border-faint)] gap-4">
            <div className="flex items-center gap-3 text-[var(--ink-subdued)] font-mono text-[12px]">
              <span className="flex items-center gap-1.5 text-[var(--cg-ink)] bg-[var(--cg-block)] px-2 py-0.5 rounded border border-[var(--border-faint)]">
                <GitCommitIcon size={14} />
                <span>SHA: {report.commit_sha.slice(0, 7)}</span>
              </span>
              <span>·</span>
              <span>Audited: {formatDateTime(report.generated_at, isSampleMode)}</span>
              <span>·</span>
              <span>Policy: {report.policy_version}</span>
            </div>

            {/* Counts */}
            <div className="flex items-center gap-4 text-[12px] font-mono">
              <span className="text-[var(--ink-subdued)]">Claims: <strong className="text-[var(--cg-ink)]">{report.summary.claims_total}</strong></span>
              <span className="text-[var(--status-block-fg)]">Blocked: <strong>{report.summary.blocked_count}</strong></span>
              <span className="text-[var(--status-review-fg)]">Review: <strong>{report.summary.review_count}</strong></span>
              <span className="text-[var(--status-pass-fg)]">Passed: <strong>{report.summary.passed_count}</strong></span>
              <span className="text-[var(--cg-accent)]">Exceptions: <strong>{acceptedExceptionsCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Extraction Issue Banner if any */}
        {!report.extraction.complete &&
        <div className="px-6 py-4 bg-[var(--status-block-bg)] border-b border-[var(--status-block-fg)] border-opacity-30 text-sm text-[var(--status-block-fg)] flex items-start gap-3 shrink-0">
            <AlertOctagonIcon size={18} className="shrink-0 mt-0.5" />
            <div>
              <div className="font-bold tracking-wide">EXTRACTION INCOMPLETE · GATE CANNOT PASS (CG-GATE-01)</div>
              <div className="text-xs opacity-90 mt-1">
                The deterministic AST parser encountered syntax issues. Policy engine is blocked until citation markers are corrected.
              </div>
            </div>
          </div>
        }

        {/* Deliberate Fixed-Height Viewport 2-Pane Workspace */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-[var(--cg-canvas)] p-6 gap-6">
          {/* Left Pane (Findings Rail or Document Viewer) - 55% width on desktop */}
          <div className="lg:w-7/12 flex flex-col border border-[var(--border-strong)] rounded-lg bg-[var(--cg-surface)] overflow-hidden shadow-sm">
            {/* Left Pane Header Tabs */}
            <div className="h-14 px-6 bg-[var(--cg-block)] border-b border-[var(--border-strong)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${
                  leftTab === "findings" ?
                  "bg-[var(--cg-surface)] text-[var(--cg-ink)] shadow-sm border border-[var(--border-faint)]" :
                  "text-[var(--ink-subdued)] hover:text-[var(--cg-ink)]"}`
                  }
                  onClick={() => handleTabChange("findings")}>
                  
                  Audited Findings ({filteredFindings.length})
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${
                  leftTab === "document" ?
                  "bg-[var(--cg-surface)] text-[var(--cg-ink)] shadow-sm border border-[var(--border-faint)]" :
                  "text-[var(--ink-subdued)] hover:text-[var(--cg-ink)]"}`
                  }
                  onClick={() => handleTabChange("document")}>
                  
                  Document Source View
                </button>
              </div>

              {leftTab === "findings" &&
              <div className="flex items-center gap-2">
                  <select
                  className="text-xs bg-[var(--cg-surface)] border border-[var(--border-strong)] rounded-md px-3 py-1.5 text-[var(--cg-ink)] font-medium focus:outline-none focus:border-[var(--cg-ink)] transition-colors"
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}>
                  
                    <option value="all">All Actions</option>
                    <option value="block">Block Only</option>
                    <option value="review">Review Only</option>
                    <option value="pass">Pass Only</option>
                  </select>
                </div>
              }
            </div>

            {/* Left Pane Content Body */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {leftTab === "findings" ?
              <div className="divide-y divide-[var(--border-faint)]">
                  {/* Search Bar */}
                  <div className="p-4 bg-[var(--cg-block)] border-b border-[var(--border-strong)]">
                    <div className="relative">
                      <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
                      <input
                      type="text"
                      placeholder="Search claims, keys, or source titles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm bg-[var(--cg-surface)] border border-[var(--border-strong)] rounded-md text-[var(--cg-ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:border-[var(--cg-ink)] transition-colors" />
                    
                    </div>
                  </div>

                  {/* Findings Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-[var(--cg-block)] border-b border-[var(--border-strong)] text-[var(--ink-subdued)] font-mono uppercase text-[11px] tracking-wider">
                          <th className="py-3 px-4 font-bold w-20">ID</th>
                          <th className="py-3 px-4 font-bold">Claim Excerpt</th>
                          <th className="py-3 px-4 font-bold w-32">Reference</th>
                          <th className="py-3 px-4 font-bold w-28">Judgment</th>
                          <th className="py-3 px-4 font-bold w-24 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-faint)]">
                        {filteredFindings.map((f) => {
                        const isSelected = f.id === selectedFindingId;
                        return (
                          <tr
                            key={f.id}
                            onClick={() => handleSelectFinding(f.id)}
                            className={`cursor-pointer transition-colors ${
                            isSelected ?
                            "bg-[var(--accent-subdued)] border-l-4 border-l-[var(--cg-accent)]" :
                            "hover:bg-[var(--cg-block)] border-l-4 border-l-transparent"}`
                            }>
                            
                              <td className="py-3 px-4 font-mono font-bold text-[var(--cg-ink)]">
                                {f.id}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-[var(--cg-ink)] line-clamp-2">
                                  {f.claim_text}
                                </div>
                                <div className="text-xs text-[var(--ink-subdued)] font-mono mt-1">
                                  Line {f.line} · [@{f.citation_key}]
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-[var(--cg-ink)] truncate max-w-[140px]">
                                  {f.reference.title}
                                </div>
                                <div className="text-[11px] text-[var(--ink-subdued)] font-mono mt-0.5">
                                  {f.reference.year ?? "Unk."}
                                </div>
                              </td>
                              <td className="py-3 px-4 capitalize text-[var(--ink-subdued)] text-xs font-medium">
                                {f.judgment.label.replace(/_/g, " ")}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span
                                className={`px-2 py-1 rounded text-[10px] font-mono font-bold border ${
                                f.action === "block" ?
                                "bg-[var(--status-block-bg)] text-[var(--status-block-fg)] border-[#F2CACA]" :
                                f.action === "review" ?
                                "bg-[var(--status-review-bg)] text-[var(--status-review-fg)] border-[#F6DCB6]" :
                                "bg-[var(--status-pass-bg)] text-[var(--status-pass-fg)] border-[#CDE5CD]"}`
                                }>
                                
                                  {f.action.toUpperCase()}
                                </span>
                              </td>
                            </tr>);

                      })}
                      </tbody>
                    </table>
                  </div>
                </div> :

              <DocumentViewer
                markdown={SAMPLE_MARKDOWN}
                findings={report.findings}
                selectedFindingId={selectedFindingId}
                onSelectFinding={handleSelectFinding} />

              }
            </div>
          </div>

          {/* Right Pane (Focused Evidence Inspector) - 45% width on desktop */}
          <div className="lg:w-5/12 flex flex-col bg-[var(--cg-surface)] border border-[var(--border-strong)] rounded-lg shadow-sm overflow-hidden">
            {selectedFinding ?
            <EvidencePanel
              finding={selectedFinding}
              report={report}
              onOpenExceptionModal={(f) => setExceptionModalFinding(f)}
              onSelectFinding={handleSelectFinding}
              allFindings={report.findings} /> :


            <div className="p-12 text-center text-sm font-medium text-[var(--ink-subdued)]">
                Select a finding from the rail to inspect source evidence.
              </div>
            }
          </div>
        </div>
      </div>

      {/* Exception Modal */}
      {exceptionModalFinding &&
      <ExceptionModal
        finding={exceptionModalFinding}
        report={report}
        onClose={() => setExceptionModalFinding(null)}
        onSuccess={handleExceptionSuccess}
        onOptimisticUpdate={(optimisticReport) => setReport(optimisticReport)}
        onRevert={() => {
          // Re-fetch or rely on the previous report state if we stored it?
          // Since we updated report state optimistically, we need to revert it.
          // Better to re-fetch to ensure consistency.
          getReport(auditId).then(setReport).catch(console.error);
        }} />

      }

      {/* Trace Comparison Modal */}
      {traceComparisonOpen &&
      <TraceComparisonModal
        findings={report.findings}
        onClose={() => setTraceComparisonOpen(false)} />

      }
    </AppShell>);

}