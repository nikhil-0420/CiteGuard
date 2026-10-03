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
  FilterIcon,
  SearchIcon,
  GitCommitIcon,
  ArrowLeftIcon } from
"../components/Icons";









const AUDIT_METADATA = {
  blocked: {
    title: "Agent Brief v1.4 — ResNet Benchmark & Attention Claims",
    scenario: "Active Blocker Run",
    versionLabel: "v1.4",
    statusText: "Blocked (2 Contradictory/Mismatch findings)",
    isCurrent: true
  },
  pending: {
    title: "Transformer Attention Verification — Exception Under Review",
    scenario: "Reviewer Exception Submitted",
    versionLabel: "v1.2",
    statusText: "Awaiting human reviewer decision",
    isCurrent: false
  },
  passed: {
    title: "Attention Is All You Need — Clean Reference Audit",
    scenario: "Clean Baseline / Approved",
    versionLabel: "v2.0",
    statusText: "Passed with 2 accepted exceptions",
    isCurrent: false
  },
  error: {
    title: "Multimodal Agent Draft — Incomplete Extraction",
    scenario: "Extraction Syntax Error",
    versionLabel: "v0.9-draft",
    statusText: "Incomplete AST extraction error",
    isCurrent: false
  }
};

export default function AuditsListPage() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [filterGate, setFilterGate] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [previewReport, setPreviewReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listReports().
    then((data) => {
      const enriched = data.map((r) => {
        const meta = AUDIT_METADATA[r.report_id] || {
          title: `Audit ${r.report_id} (${r.repo})`,
          scenario: "Custom Audit Run",
          versionLabel: "v1.0",
          statusText: r.gate_state.toUpperCase(),
          isCurrent: false
        };
        return { ...r, ...meta };
      });
      setReports(enriched);
      setIsLoading(false);
    }).
    catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (selectedAuditId) {
      getReport(selectedAuditId).
      then((data) => setPreviewReport(data)).
      catch(() => setPreviewReport(null));
    } else {
      setPreviewReport(null);
    }
  }, [selectedAuditId]);

  const filtered = useMemo(() => {
    let list = reports.filter((r) => {
      if (filterGate !== "all" && r.gate_state !== filterGate) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const mTitle = r.title.toLowerCase().includes(q);
        const mRepo = r.repo.toLowerCase().includes(q);
        const mSha = r.commit_sha.toLowerCase().includes(q);
        const mId = r.report_id.toLowerCase().includes(q);
        return mTitle || mRepo || mSha || mId;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === "repo") return a.repo.localeCompare(b.repo);
      if (sortBy === "status") return a.gate_state.localeCompare(b.gate_state);
      // default: date desc
      return new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime();
    });

    return list;
  }, [reports, filterGate, search, sortBy]);

  const getGateBadge = (state) => {
    switch (state) {
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--cg-pass-subtle)] text-[var(--cg-pass)] border border-[var(--cg-pass-line)]">
            <CheckCircleIcon size={12} />
            <span>Passed</span>
          </span>);

      case "failure":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--cg-block-subtle)] text-[var(--cg-block)] border border-[var(--cg-block-line)]">
            <XCircleIcon size={12} />
            <span>Blocked</span>
          </span>);

      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--cg-review-subtle)] text-[var(--cg-review)] border border-[var(--cg-review-line)]">
            <AlertTriangleIcon size={12} />
            <span>Needs Review</span>
          </span>);

      case "error":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--cg-block-subtle)] text-[var(--cg-block)] border border-[var(--cg-block-line)]">
            <AlertOctagonIcon size={12} />
            <span>Error</span>
          </span>);

      default:
        return null;
    }
  };

  return (
    <AppShell breadcrumbs={[{ label: "Audits" }]}>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--cg-line)]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--cg-ink)]">Audit History</h1>
            <p className="text-xs text-[var(--cg-ink-secondary)] mt-0.5">
              Practical audit records, distinct run scenarios, and pull request commit status decisions.
            </p>
          </div>

          <Link
            href="/app/audits/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[var(--cg-accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto">
            
            <PlusIcon size={14} />
            <span>Start new audit</span>
          </Link>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white border border-[var(--cg-line)] rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cg-ink-secondary)]" />
            <input
              type="text"
              placeholder="Search reports by title, repository, SHA..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[var(--cg-line)] rounded-md text-[var(--cg-ink)] placeholder-[var(--cg-ink-muted)] focus:outline-none focus:border-[var(--cg-accent)]" />
            
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--cg-ink-secondary)] font-medium">Status:</span>
              <select
                value={filterGate}
                onChange={(e) => setFilterGate(e.target.value)}
                className="bg-white border border-[var(--cg-line)] rounded px-2.5 py-1 text-xs text-[var(--cg-ink)] focus:outline-none focus:border-[var(--cg-accent)]">
                
                <option value="all">All Statuses</option>
                <option value="failure">Blocked Only</option>
                <option value="pending">Review Only</option>
                <option value="success">Passed Only</option>
                <option value="error">Error Only</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[var(--cg-ink-secondary)] font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-[var(--cg-line)] rounded px-2.5 py-1 text-xs text-[var(--cg-ink)] focus:outline-none focus:border-[var(--cg-accent)]">
                
                <option value="date">Evaluation Date</option>
                <option value="repo">Repository Name</option>
                <option value="status">Gate Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audits Table */}
        <div className="bg-white border border-[var(--cg-line)] rounded-lg shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--cg-surface-subtle)] border-b border-[var(--cg-line)] text-[var(--cg-ink-secondary)] font-mono uppercase text-[11px]">
                  <th className="py-2.5 px-4 font-semibold">Report Title & Run</th>
                  <th className="py-2.5 px-4 font-semibold">Repository & Target</th>
                  <th className="py-2.5 px-4 font-semibold">Status / Gate</th>
                  <th className="py-2.5 px-4 font-semibold">Lineage</th>
                  <th className="py-2.5 px-4 font-semibold">Evaluated Time</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cg-line)]">
                {filtered.length === 0 ?
                <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--cg-ink-secondary)]">
                      No audit reports match your search criteria.
                    </td>
                  </tr> :

                filtered.map((r) => {
                  const isSelected = selectedAuditId === r.report_id;
                  return (
                    <tr
                      key={r.report_id}
                      onClick={() => setSelectedAuditId(r.report_id)}
                      className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-[var(--cg-accent-subtle)]" : "hover:bg-[var(--cg-surface)]"}`
                      }>
                      
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[var(--cg-ink)] text-xs">{r.title}</div>
                          <div className="text-[11px] text-[var(--cg-ink-secondary)] font-mono mt-0.5">
                            {r.scenario} · {r.versionLabel}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-[var(--cg-ink)]">{r.repo}</div>
                          <div className="text-[11px] text-[var(--cg-ink-secondary)] font-mono">
                            PR #{r.pr_number} (sha {r.commit_sha.slice(0, 7)})
                          </div>
                        </td>
                        <td className="py-3 px-4">{getGateBadge(r.gate_state)}</td>
                        <td className="py-3 px-4">
                          {r.isCurrent ?
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--cg-surface)] text-white">
                              CURRENT ACTIVE
                            </span> :

                        <span className="text-[11px] font-mono text-[var(--cg-ink-secondary)]">Historical sample</span>
                        }
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[var(--cg-ink-secondary)]">
                          {formatDateTime(r.generated_at)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                          href={`/app/audits/${r.report_id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--cg-accent)] hover:underline"
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

        {/* Selected Row Preview Drawer */}
        {selectedAuditId && previewReport &&
        <div className="bg-white border border-[var(--cg-line)] rounded-lg p-5 shadow-md space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-[var(--cg-line)] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--cg-ink-secondary)]">
                  Audit Run Detail:
                </span>
                <span className="font-mono text-xs text-[var(--cg-ink)] font-semibold">{previewReport.report_id}</span>
              </div>
              <button
              type="button"
              onClick={() => setSelectedAuditId(null)}
              className="text-xs text-[var(--cg-ink-secondary)] hover:text-[var(--cg-ink)] font-mono">
              
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[var(--cg-ink-secondary)] block font-mono text-[11px]">Gate Verdict:</span>
                <span className="font-semibold text-[var(--cg-ink)]">{previewReport.gate.description}</span>
              </div>
              <div>
                <span className="text-[var(--cg-ink-secondary)] block font-mono text-[11px]">Audit Policy:</span>
                <span className="font-mono text-[var(--cg-ink)]">{previewReport.policy_version}</span>
              </div>
              <div>
                <span className="text-[var(--cg-ink-secondary)] block font-mono text-[11px]">Full Commit SHA:</span>
                <span className="font-mono text-[var(--cg-ink)] break-all">{previewReport.commit_sha}</span>
              </div>
            </div>

            <div>
              <span className="text-[var(--cg-ink-secondary)] block font-mono text-[11px] mb-1">
                Findings ({previewReport.findings.length}):
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {previewReport.findings.map((f) =>
              <div
                key={f.id}
                className="p-2 rounded bg-[var(--cg-surface)] border border-[var(--cg-line)] flex items-center justify-between text-xs">
                
                    <div className="min-w-0 pr-2">
                      <span className="font-mono font-bold text-[var(--cg-ink)] mr-2">{f.id}</span>
                      <span className="text-[var(--cg-ink)] truncate">{f.claim_text}</span>
                    </div>
                    <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border shrink-0 ${
                  f.action === "block" ?
                  "bg-[var(--cg-block-subtle)] text-[var(--cg-block)] border-[var(--cg-block-line)]" :
                  f.action === "review" ?
                  "bg-[var(--cg-review-subtle)] text-[var(--cg-review)] border-[var(--cg-review-line)]" :
                  "bg-[var(--cg-pass-subtle)] text-[var(--cg-pass)] border-[var(--cg-pass-line)]"}`
                  }>
                  
                      {f.action.toUpperCase()}
                    </span>
                  </div>
              )}
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--cg-line)] flex items-center justify-between">
              <span className="text-[var(--cg-ink-secondary)] font-mono text-[11px]">
                Bound to commit {previewReport.commit_sha.slice(0, 7)}
              </span>
              <Link
              href={`/app/audits/${previewReport.report_id}`}
              className="px-4 py-1.5 rounded bg-[var(--cg-accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors">
              
                Open workspace →
              </Link>
            </div>
          </div>
        }
      </div>
    </AppShell>);

}