import React, { useState } from "react";
import { Link, useRouter } from "../router";
import AppShell from "../components/AppShell";
import { submitAudit } from "../api";
import { SAMPLE_MARKDOWN } from "../utils/sampleBrief";
import {
  ShieldIcon,
  FileTextIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ArrowLeftIcon,
  ChevronDownIcon } from
"../components/Icons";

export default function NewAuditPage() {
  const router = useRouter();
  const [title, setTitle] = useState("Agent Brief — Research Benchmark Evaluation");
  const [markdown, setMarkdown] = useState("");
  const [mode, setMode] = useState("standalone");
  const [repo, setRepo] = useState("nikhil-0420/agent-briefs");
  const [prNumber, setPrNumber] = useState(1);
  const [commitSha, setCommitSha] = useState("9f3c2a1d7b6e4a58c0d1e2f3a4b5c6d7e8f90123");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [budget, setBudget] = useState(20);
  const [timeoutSec, setTimeoutSec] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Syntax analysis (only show status when user has interacted)
  const markersCount = (markdown.match(/\[@([A-Za-z0-9_:\-\.]+)\]/g) || []).length;
  const hasBibliography = markdown.includes("```bibliography");

  const handleLoadSample = () => {
    setMarkdown(SAMPLE_MARKDOWN);
    setTitle("Agent Brief v1.4 — Attention & Vision Benchmarks");
    setHasInteracted(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      setMarkdown(text);
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
      setHasInteracted(true);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasInteracted(true);

    if (!markdown.trim()) {
      setErrorMessage("Please enter or upload a Markdown research brief.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await submitAudit({
        repo: mode === "github" ? repo : "citeguard-standalone/research-briefs",
        pr_number: mode === "github" ? prNumber : 0,
        commit_sha: mode === "github" ? commitSha : `standalone-${Date.now().toString(16)}`,
        markdown
      });

      setIsSubmitting(false);
      router.navigate(`/app/audits/${result.report_id}`);
    } catch (err) {
      setIsSubmitting(false);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to submit audit.");
      }
    }
  };

  return (
    <AppShell breadcrumbs={[{ label: "Audits", href: "/app/audits" }, { label: "New Audit" }]}>
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--cg-ink)]">Start a Research Audit</h1>
          <p className="text-xs text-[var(--cg-ink-secondary)] mt-0.5">
            Submit a research draft or brief to verify reference identity and grounded passage evidence.
          </p>
        </div>

        {errorMessage &&
        <div className="p-3.5 bg-[var(--cg-block-subtle)] border border-[var(--cg-block-line)] rounded-md text-xs text-[var(--cg-block)] flex items-start gap-2">
            <AlertTriangleIcon size={16} className="shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        }

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Title & Mode Selector */}
          <div className="bg-white border border-[var(--cg-line)] rounded-lg p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-[var(--cg-ink)] mb-1">
                  Report Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[var(--cg-line)] rounded-md text-[var(--cg-ink)] focus:outline-none focus:border-[var(--cg-accent)]"
                  placeholder="e.g. Agent Brief — Attention & Vision Benchmarks"
                  required />
                
              </div>

              <div className="sm:w-64">
                <label className="block text-xs font-semibold text-[var(--cg-ink)] mb-1">
                  Audit Target Mode
                </label>
                <div className="flex items-center bg-[var(--cg-surface-subtle)] border border-[var(--cg-line)] rounded-md p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setMode("standalone")}
                    className={`flex-1 py-1 rounded font-medium transition-colors ${
                    mode === "standalone" ? "bg-white text-[var(--cg-ink)] shadow-2xs font-semibold" : "text-[var(--cg-ink-secondary)]"}`
                    }>
                    
                    Standalone Brief
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("github")}
                    className={`flex-1 py-1 rounded font-medium transition-colors ${
                    mode === "github" ? "bg-white text-[var(--cg-ink)] shadow-2xs font-semibold" : "text-[var(--cg-ink-secondary)]"}`
                    }>
                    
                    GitHub PR Mode
                  </button>
                </div>
              </div>
            </div>

            {/* GitHub Mode Metadata (only shown if GitHub mode selected) */}
            {mode === "github" &&
            <div className="p-4 bg-[var(--cg-surface)] border border-[var(--cg-line)] rounded-md grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-[var(--cg-ink-secondary)] mb-1">
                    Repository
                  </label>
                  <input
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs bg-white border border-[var(--cg-line)] rounded text-[var(--cg-ink)]"
                  placeholder="org/repo" />
                
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-[var(--cg-ink-secondary)] mb-1">
                    PR Number
                  </label>
                  <input
                  type="number"
                  value={prNumber}
                  onChange={(e) => setPrNumber(Number(e.target.value))}
                  className="w-full px-2.5 py-1 text-xs bg-white border border-[var(--cg-line)] rounded text-[var(--cg-ink)]" />
                
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-[var(--cg-ink-secondary)] mb-1">
                    Audited Commit SHA
                  </label>
                  <input
                  type="text"
                  value={commitSha}
                  onChange={(e) => setCommitSha(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs bg-white border border-[var(--cg-line)] rounded text-[var(--cg-ink)] font-mono text-[11px]" />
                
                </div>
              </div>
            }
          </div>

          {/* Document Content Input Area */}
          <div className="bg-white border border-[var(--cg-line)] rounded-lg p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--cg-line)] pb-3">
              <div>
                <label htmlFor="markdown-input" className="block text-xs font-semibold text-[var(--cg-ink)]">
                  Draft Markdown Source
                </label>
                <span className="text-[11px] text-[var(--cg-ink-secondary)]">
                  Use inline citations like <code className="font-mono text-[var(--cg-accent)]">[@key]</code> and a <code className="font-mono text-[var(--cg-accent)]">```bibliography</code> fence at the bottom.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-2.5 py-1 rounded bg-[var(--cg-accent-subtle)] hover:bg-[var(--accent-ghost)] text-[var(--cg-accent)] border border-[var(--cg-accent)]/20 text-xs font-semibold transition-colors">
                  
                  Load sample brief
                </button>
                <label className="px-2.5 py-1 rounded bg-white hover:bg-[var(--cg-surface)] text-[var(--cg-ink-secondary)] hover:text-[var(--cg-ink)] border border-[var(--cg-line)] text-xs font-medium cursor-pointer transition-colors">
                  Upload .md
                  <input type="file" accept=".md,.txt" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <textarea
              id="markdown-input"
              rows={14}
              value={markdown}
              onChange={(e) => {
                setMarkdown(e.target.value);
                setHasInteracted(true);
              }}
              placeholder={`# Your Research Title\n\nThe Transformer architecture relies solely on attention mechanisms [@vaswani2017].\n\n\`\`\`bibliography\n- key: vaswani2017\n  title: Attention Is All You Need\n  doi: 10.48550/arXiv.1706.03762\n\`\`\``}
              className="w-full p-3 text-xs font-mono bg-[var(--cg-surface)] border border-[var(--cg-line)] rounded-md text-[var(--cg-ink)] placeholder-[var(--cg-ink-muted)] focus:outline-none focus:border-[var(--cg-accent)] focus:bg-white resize-y leading-relaxed" />
            

            {/* Syntax Guidance — Only shown once interacted with */}
            {hasInteracted &&
            <div className="p-3 bg-[var(--cg-surface)] border border-[var(--cg-line)] rounded-md flex flex-wrap items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-4 text-[11px] font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${markersCount > 0 ? "bg-[var(--cg-pass)]" : "bg-[var(--cg-ink-muted)]"}`} />
                    <span>Citation markers: <strong>{markersCount}</strong></span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${hasBibliography ? "bg-[var(--cg-pass)]" : "bg-[var(--cg-review)]"}`} />
                    <span>Bibliography block: <strong>{hasBibliography ? "Present" : "Missing fence"}</strong></span>
                  </span>
                </div>
                <div className="text-[11px] text-[var(--cg-ink-secondary)]">
                  Deterministic parser ready
                </div>
              </div>
            }
          </div>

          {/* Collapsible Advanced Settings (Budget, Timeout) */}
          <div className="bg-white border border-[var(--cg-line)] rounded-lg p-5 shadow-xs space-y-3">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="w-full flex items-center justify-between text-left text-xs font-semibold text-[var(--cg-ink)] hover:text-[var(--cg-accent)] transition-colors">
              
              <span>Advanced Execution Settings (Budget, Timeout)</span>
              <ChevronDownIcon
                size={14}
                className={`text-[var(--cg-ink-secondary)] transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`} />
              
            </button>

            {showAdvanced &&
            <div className="pt-3 border-t border-[var(--cg-line)] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--cg-ink-secondary)] mb-1">
                    Max External Tool Calls (Budget)
                  </label>
                  <input
                  type="number"
                  min={5}
                  max={50}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[var(--cg-line)] rounded-md text-[var(--cg-ink)]" />
                
                  <span className="text-[10px] text-[var(--cg-ink-secondary)] mt-0.5 block">
                    Default 20 calls to Crossref, arXiv, and Europe PMC.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--cg-ink-secondary)] mb-1">
                    Timeout Deadline (Seconds)
                  </label>
                  <input
                  type="number"
                  min={10}
                  max={120}
                  value={timeoutSec}
                  onChange={(e) => setTimeoutSec(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[var(--cg-line)] rounded-md text-[var(--cg-ink)]" />
                
                  <span className="text-[10px] text-[var(--cg-ink-secondary)] mt-0.5 block">
                    Maximum time allowed for retrieval and evaluation.
                  </span>
                </div>
              </div>
            }
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/app/audits"
              className="text-xs font-medium text-[var(--cg-ink-secondary)] hover:text-[var(--cg-ink)] transition-colors">
              
              Cancel and return to audits
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-md text-xs font-semibold text-white bg-[var(--cg-accent)] hover:bg-[var(--accent-hover)] shadow-sm transition-all disabled:opacity-50">
              
              {isSubmitting ? "Running Deterministic Audit..." : "Run Audit & Evaluate Gate →"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>);

}