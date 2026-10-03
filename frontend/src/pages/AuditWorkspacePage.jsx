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
  SearchIcon,
  ChevronDownIcon,
} from "../components/Icons";

export default function AuditWorkspacePage({ auditId, isSampleMode = false }) {
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
    getReport(auditId)
      .then((data) => {
        setReport(data);
        setIsLoading(false);

        // Section 6 Mandate:
        // Default to highest-priority blocker, then review, then first finding
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
      })
      .catch((err) => {
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
          { label: auditId },
        ]}
      >
        <div className="flex flex-col items-center justify-center h-96 gap-3 text-xs font-mono text-[#5C6854]">
          <div className="w-6 h-6 border-2 border-[#18280E] border-t-transparent rounded-full animate-spin" />
          <span>Loading audit workspace for {auditId}...</span>
        </div>
      </AppShell>
    );
  }

  if (loadError || !report) {
    return (
      <AppShell
        isSampleMode={isSampleMode}
        breadcrumbs={[
          { label: "Audits", href: isSampleMode ? "/demo/audits/blocked" : "/app/audits" },
          { label: auditId },
        ]}
      >
        <div className="p-8 max-w-xl mx-auto my-16 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-[#991B1B] space-y-3">
          <h2 className="text-base font-bold">Unable to load audit report</h2>
          <p className="text-xs opacity-90">{loadError || "Report does not exist or network connection failed."}</p>
        </div>
      </AppShell>
    );
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#F4FAED] text-[#166534] border border-[#18280E]/15">
            <CheckCircleIcon size={13} className="text-[#166534]" />
            <span>PASSED</span>
          </span>
        );
      case "failure":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
            <XCircleIcon size={13} className="text-[#991B1B]" />
            <span>BLOCKED</span>
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
            <AlertTriangleIcon size={13} className="text-[#B45309]" />
            <span>PENDING REVIEW</span>
          </span>
        );
      case "error":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
            <AlertOctagonIcon size={13} className="text-[#991B1B]" />
            <span>EXTRACTION ERROR</span>
          </span>
        );
    }
  };

  const acceptedExceptionsCount = report.findings.filter((f) => f.exception).length;

  return (
    <AppShell
      isSampleMode={isSampleMode}
      breadcrumbs={[
        { label: "Audits", href: isSampleMode ? "/demo/audits/blocked" : "/app/audits" },
        { label: report.report_id },
      ]}
    >
      <div className="flex flex-col h-full bg-[#F8FAF6] overflow-hidden">
        {/* Sample State Switcher Bar */}
        {isSampleMode && (
          <div className="px-6 py-2 bg-white border-b border-[#18280E]/10 flex items-center gap-2 overflow-x-auto shrink-0 font-mono">
            <span className="text-[11px] text-[#5C6854] uppercase font-bold tracking-widest shrink-0 mr-2">
              [SCENARIOS]:
            </span>
            <button
              type="button"
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                report.report_id === "blocked"
                  ? "bg-[#18280E] text-[#B2EB76] font-semibold"
                  : "bg-[#F4FAED] text-[#5C6854] hover:text-[#090F05] hover:bg-[#E8F2DF] border border-[#18280E]/10"
              }`}
              onClick={() => router.navigate("/demo/audits/blocked")}
            >
              Blocked (Contradiction)
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                report.report_id === "pending"
                  ? "bg-[#18280E] text-[#B2EB76] font-semibold"
                  : "bg-[#F4FAED] text-[#5C6854] hover:text-[#090F05] hover:bg-[#E8F2DF] border border-[#18280E]/10"
              }`}
              onClick={() => router.navigate("/demo/audits/pending")}
            >
              Pending Review
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                report.report_id === "passed"
                  ? "bg-[#18280E] text-[#B2EB76] font-semibold"
                  : "bg-[#F4FAED] text-[#5C6854] hover:text-[#090F05] hover:bg-[#E8F2DF] border border-[#18280E]/10"
              }`}
              onClick={() => router.navigate("/demo/audits/passed")}
            >
              Passed with Exceptions
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                report.report_id === "error"
                  ? "bg-[#18280E] text-[#B2EB76] font-semibold"
                  : "bg-[#F4FAED] text-[#5C6854] hover:text-[#090F05] hover:bg-[#E8F2DF] border border-[#18280E]/10"
              }`}
              onClick={() => router.navigate("/demo/audits/error")}
            >
              Syntax Error
            </button>
          </div>
        )}

        {/* Workspace Top Header Bar */}
        <div className="bg-white px-6 py-4 border-b border-[#18280E]/10 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#090F05]">
                  {report.repo} · PR #{report.pr_number}
                </h1>
                {getGateBadge(report.gate.state)}
              </div>
              <p className="text-xs text-[#5C6854] font-mono mt-1">
                {report.gate.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium text-[#090F05] bg-[#F4FAED] border border-[#18280E]/12 hover:bg-[#E8F2DF] transition-colors cursor-pointer"
                onClick={() => setTraceComparisonOpen(true)}
              >
                <SplitIcon size={13} />
                <span>Compare Traces</span>
              </button>

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium text-[#090F05] bg-[#F4FAED] border border-[#18280E]/12 hover:bg-[#E8F2DF] transition-colors cursor-pointer"
                  onClick={() => setExportMenuOpen((o) => !o)}
                >
                  <DownloadIcon size={13} />
                  <span>Export</span>
                  <ChevronDownIcon size={11} />
                </button>

                {exportMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-[#18280E]/15 rounded-2xl shadow-xl p-1.5 z-50 font-mono text-xs animate-scale-in">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-1.5 rounded-xl text-[#090F05] hover:bg-[#F4FAED] transition-colors"
                      onClick={() => {
                        exportReportAsJson(report);
                        setExportMenuOpen(false);
                      }}
                    >
                      Export JSON Report
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-1.5 rounded-xl text-[#090F05] hover:bg-[#F4FAED] transition-colors"
                      onClick={() => {
                        exportFindingsAsCsv(report);
                        setExportMenuOpen(false);
                      }}
                    >
                      Export CSV (Sanitized)
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-1.5 rounded-xl text-[#090F05] hover:bg-[#F4FAED] transition-colors"
                      onClick={() => {
                        printAuditReport();
                        setExportMenuOpen(false);
                      }}
                    >
                      Printable View
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metadata & Summary Strip */}
          <div className="flex flex-wrap items-center justify-between text-xs pt-3 border-t border-[#18280E]/10 gap-3">
            <div className="flex items-center gap-2.5 text-[#5C6854] font-mono text-[11px]">
              <span className="flex items-center gap-1 text-[#090F05] bg-[#F4FAED] px-2 py-0.5 rounded-full border border-[#18280E]/12">
                <GitCommitIcon size={12} />
                <span>SHA: {report.commit_sha.slice(0, 7)}</span>
              </span>
              <span>·</span>
              <span>Audited: {formatDateTime(report.generated_at, isSampleMode)}</span>
              <span>·</span>
              <span>Policy: {report.policy_version}</span>
            </div>

            {/* Counts */}
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-[#5C6854]">
                Claims: <strong className="text-[#090F05]">{report.summary.claims_total}</strong>
              </span>
              <span className="text-[#991B1B]">
                Blocked: <strong>{report.summary.blocked_count}</strong>
              </span>
              <span className="text-[#B45309]">
                Review: <strong>{report.summary.review_count}</strong>
              </span>
              <span className="text-[#166534]">
                Passed: <strong>{report.summary.passed_count}</strong>
              </span>
              <span className="text-[#18280E]">
                Exceptions: <strong>{acceptedExceptionsCount}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Extraction Error Banner */}
        {!report.extraction.complete && (
          <div className="px-6 py-3.5 bg-[#FEF2F2] border-b border-[#FECACA] text-xs text-[#991B1B] flex items-start gap-2.5 shrink-0">
            <AlertOctagonIcon size={16} className="shrink-0 mt-0.5" />
            <div>
              <div className="font-bold tracking-wide font-mono">
                EXTRACTION INCOMPLETE · GATE CANNOT PASS (CG-GATE-01)
              </div>
              <div className="opacity-90 mt-0.5">
                The deterministic AST parser encountered syntax issues. Policy engine is blocked until citation markers are corrected.
              </div>
            </div>
          </div>
        )}

        {/* Fixed Viewport 2-Pane Workspace */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden p-6 gap-6">
          {/* Left Pane (Findings Cards or Document Viewer) */}
          <div className="lg:w-7/12 flex flex-col border border-[#18280E]/10 rounded-2xl bg-white overflow-hidden shadow-xs">
            {/* Left Header Tabs */}
            <div className="h-14 px-5 bg-white border-b border-[#18280E]/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                    leftTab === "findings"
                      ? "bg-[#18280E] text-[#B2EB76] shadow-xs"
                      : "text-[#5C6854] hover:text-[#090F05]"
                  }`}
                  onClick={() => handleTabChange("findings")}
                >
                  Audited Findings ({filteredFindings.length})
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                    leftTab === "document"
                      ? "bg-[#18280E] text-[#B2EB76] shadow-xs"
                      : "text-[#5C6854] hover:text-[#090F05]"
                  }`}
                  onClick={() => handleTabChange("document")}
                >
                  Document Source View
                </button>
              </div>

              {leftTab === "findings" && (
                <div className="flex items-center gap-2">
                  <select
                    className="text-xs bg-[#F4FAED] border border-[#18280E]/12 rounded-lg px-2.5 py-1 text-[#090F05] font-mono focus:outline-none cursor-pointer"
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                  >
                    <option value="all">All Actions</option>
                    <option value="block">Block Only</option>
                    <option value="review">Review Only</option>
                    <option value="pass">Pass Only</option>
                  </select>
                </div>
              )}
            </div>

            {/* Left Body */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {leftTab === "findings" ? (
                <div className="flex flex-col h-full">
                  {/* Search Input */}
                  <div className="p-3 bg-white border-b border-[#18280E]/10">
                    <div className="relative">
                      <SearchIcon
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6854]"
                      />
                      <input
                        type="text"
                        placeholder="Search claims, citation keys, or titles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAF6] border border-[#18280E]/10 rounded-xl text-[#090F05] placeholder-[#8A9684] focus:outline-none focus:border-[#18280E] focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* Clean Finding Cards List (NO DENSE TABLES) */}
                  <div className="divide-y divide-[#18280E]/5 p-3 space-y-2.5 overflow-y-auto">
                    {filteredFindings.map((f) => {
                      const isSelected = f.id === selectedFindingId;
                      return (
                        <div
                          key={f.id}
                          onClick={() => handleSelectFinding(f.id)}
                          className={`p-4 rounded-xl cursor-pointer transition-all border ${
                            isSelected
                              ? "bg-[#F4FAED] border-[#18280E]/20 shadow-xs border-l-4 border-l-[#18280E]"
                              : "bg-white hover:bg-[#F8FAF6] border-[#18280E]/8 border-l-4 border-l-transparent"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#090F05]">
                                {f.id}
                              </span>
                              <span className="text-[11px] font-mono text-[#5C6854] bg-[#F8FAF6] px-1.5 py-0.5 rounded border border-[#18280E]/8">
                                [@{f.citation_key}]
                              </span>
                              <span className="text-[10px] text-[#5C6854] font-mono">
                                Line {f.line}
                              </span>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                f.action === "block"
                                  ? "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]"
                                  : f.action === "review"
                                  ? "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]"
                                  : "bg-[#F4FAED] text-[#166534] border-[#18280E]/15"
                              }`}
                            >
                              {f.action.toUpperCase()}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-[#090F05] line-clamp-2 leading-relaxed">
                            {f.claim_text}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#5C6854] mt-2 pt-2 border-t border-[#18280E]/5 font-mono">
                            <span className="truncate max-w-[280px]">
                              {f.reference.title}
                            </span>
                            <span className="shrink-0">{f.reference.year ?? "Unk."}</span>
                          </div>
                        </div>
                      );
                    })}

                    {filteredFindings.length === 0 && (
                      <div className="p-8 text-center text-xs font-mono text-[#5C6854]">
                        No findings match your filter or search query.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <DocumentViewer
                  markdown={SAMPLE_MARKDOWN}
                  findings={report.findings}
                  selectedFindingId={selectedFindingId}
                  onSelectFinding={handleSelectFinding}
                />
              )}
            </div>
          </div>

          {/* Right Pane (Evidence Inspector) */}
          <div className="lg:w-5/12 flex flex-col bg-white border border-[#18280E]/10 rounded-2xl shadow-xs overflow-hidden">
            {selectedFinding ? (
              <EvidencePanel
                finding={selectedFinding}
                report={report}
                onOpenExceptionModal={(f) => setExceptionModalFinding(f)}
                onSelectFinding={handleSelectFinding}
                allFindings={report.findings}
              />
            ) : (
              <div className="p-12 text-center text-xs font-mono text-[#5C6854]">
                Select a finding from the left rail to inspect source evidence.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exception Modal */}
      {exceptionModalFinding && (
        <ExceptionModal
          finding={exceptionModalFinding}
          report={report}
          onClose={() => setExceptionModalFinding(null)}
          onSuccess={handleExceptionSuccess}
          onOptimisticUpdate={(optimisticReport) => setReport(optimisticReport)}
          onRevert={() => {
            getReport(auditId).then(setReport).catch(console.error);
          }}
        />
      )}

      {/* Trace Comparison Modal */}
      {traceComparisonOpen && (
        <TraceComparisonModal
          findings={report.findings}
          onClose={() => setTraceComparisonOpen(false)}
        />
      )}
    </AppShell>
  );
}