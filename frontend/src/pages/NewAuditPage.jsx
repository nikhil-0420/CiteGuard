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
  ChevronDownIcon,
  PlusIcon,
} from "../components/Icons";

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

  // Syntax analysis
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
        markdown,
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
      <div className="flex-1 flex flex-col items-center justify-start py-8 px-4 sm:px-6 w-full max-w-3xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-6 pb-4 border-b border-[#18280E]/10">
          <div className="flex items-center gap-3">
            <Link
              href="/app/audits"
              className="p-1.5 rounded-lg border border-[#18280E]/10 text-[#5C6854] hover:text-[#090F05] hover:bg-[#F4FAED] transition-colors"
              title="Back to Audits"
            >
              <ArrowLeftIcon size={14} />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#090F05]">
                New Research Audit
              </h1>
              <p className="text-xs text-[#5C6854] mt-0.5 font-mono">
                Submit a research brief to verify reference identity and grounded passage evidence.
              </p>
            </div>
          </div>

          {/* Mode Pill Switcher */}
          <div className="flex items-center bg-[#F4FAED] border border-[#18280E]/10 rounded-full p-1 text-xs">
            <button
              type="button"
              onClick={() => setMode("standalone")}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                mode === "standalone"
                  ? "bg-[#18280E] text-[#B2EB76] font-semibold shadow-xs"
                  : "text-[#5C6854] hover:text-[#090F05]"
              }`}
            >
              Standalone
            </button>
            <button
              type="button"
              onClick={() => setMode("github")}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                mode === "github"
                  ? "bg-[#18280E] text-[#B2EB76] font-semibold shadow-xs"
                  : "text-[#5C6854] hover:text-[#090F05]"
              }`}
            >
              GitHub PR
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="w-full mb-6 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-xs text-[#991B1B] flex items-start gap-2.5">
            <AlertTriangleIcon size={16} className="shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {/* Document Title Card */}
          <div className="bg-white border border-[#18280E]/10 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#090F05] mb-1.5">
                Report Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-[#F8FAF6] border border-[#18280E]/12 rounded-xl text-[#090F05] placeholder-[#8A9684] focus:outline-none focus:border-[#18280E] focus:bg-white transition-colors"
                placeholder="e.g. Agent Brief — Attention & Vision Benchmarks"
                required
              />
            </div>

            {/* GitHub Mode Fields */}
            {mode === "github" && (
              <div className="p-4 bg-[#F4FAED] border border-[#18280E]/10 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-scale-in">
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-[#5C6854] mb-1">
                    Repository
                  </label>
                  <input
                    type="text"
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#18280E]/12 rounded-lg text-[#090F05]"
                    placeholder="org/repo"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-[#5C6854] mb-1">
                    PR Number
                  </label>
                  <input
                    type="number"
                    value={prNumber}
                    onChange={(e) => setPrNumber(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#18280E]/12 rounded-lg text-[#090F05]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-[#5C6854] mb-1">
                    Audited Commit SHA
                  </label>
                  <input
                    type="text"
                    value={commitSha}
                    onChange={(e) => setCommitSha(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#18280E]/12 rounded-lg text-[#090F05] font-mono text-[11px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Document Content Input Area */}
          <div className="bg-white border border-[#18280E]/10 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#18280E]/10 pb-3">
              <div>
                <label htmlFor="markdown-input" className="block text-xs font-semibold text-[#090F05]">
                  Draft Markdown Source
                </label>
                <span className="text-[11px] text-[#5C6854]">
                  Use inline citations like <code className="font-mono text-[#18280E] font-bold">[@key]</code> and a <code className="font-mono text-[#18280E] font-bold">```bibliography</code> fence.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-3 py-1.5 rounded-full bg-[#18280E] hover:bg-[#223814] text-[#B2EB76] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Load sample brief
                </button>
                <label className="px-3 py-1.5 rounded-full bg-[#F4FAED] hover:bg-[#E8F2DF] text-[#090F05] border border-[#18280E]/12 text-xs font-medium cursor-pointer transition-colors">
                  Upload .md
                  <input type="file" accept=".md,.txt" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            <textarea
              id="markdown-input"
              rows={12}
              value={markdown}
              onChange={(e) => {
                setMarkdown(e.target.value);
                setHasInteracted(true);
              }}
              placeholder={`# Your Research Title\n\nThe Transformer architecture relies solely on attention mechanisms [@vaswani2017].\n\n\`\`\`bibliography\n- key: vaswani2017\n  title: Attention Is All You Need\n  doi: 10.48550/arXiv.1706.03762\n\`\`\``}
              className="w-full p-4 text-xs font-mono bg-[#F8FAF6] border border-[#18280E]/12 rounded-xl text-[#090F05] placeholder-[#8A9684] focus:outline-none focus:border-[#18280E] focus:bg-white resize-y leading-relaxed transition-colors"
            />

            {/* Syntax Indicators */}
            {hasInteracted && (
              <div className="p-3 bg-[#F4FAED] border border-[#18280E]/10 rounded-xl flex flex-wrap items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-4 text-[11px] font-mono">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        markersCount > 0 ? "bg-[#166534]" : "bg-[#8A9684]"
                      }`}
                    />
                    <span>
                      Citation markers: <strong>{markersCount}</strong>
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        hasBibliography ? "bg-[#166534]" : "bg-[#B45309]"
                      }`}
                    />
                    <span>
                      Bibliography block:{" "}
                      <strong>{hasBibliography ? "Present" : "Missing fence"}</strong>
                    </span>
                  </span>
                </div>
                <div className="text-[11px] text-[#5C6854] font-mono">
                  Deterministic AST ready
                </div>
              </div>
            )}
          </div>

          {/* Advanced Collapsible Settings */}
          <div className="bg-white border border-[#18280E]/10 rounded-2xl p-5 shadow-xs space-y-3">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="w-full flex items-center justify-between text-left text-xs font-semibold text-[#090F05] hover:text-[#18280E] transition-colors cursor-pointer"
            >
              <span>Execution Configuration (Budget & Latency Deadline)</span>
              <ChevronDownIcon
                size={14}
                className={`text-[#5C6854] transition-transform duration-200 ${
                  showAdvanced ? "rotate-180" : ""
                }`}
              />
            </button>

            {showAdvanced && (
              <div className="pt-3 border-t border-[#18280E]/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-scale-in">
                <div>
                  <label className="block text-[11px] font-semibold text-[#5C6854] mb-1 font-mono">
                    Max External Tool Calls (Budget)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-[#F8FAF6] border border-[#18280E]/12 rounded-lg text-[#090F05]"
                  />
                  <span className="text-[10px] text-[#5C6854] mt-0.5 block font-mono">
                    Default 20 calls to Crossref, arXiv, and Europe PMC.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5C6854] mb-1 font-mono">
                    Timeout Deadline (Seconds)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    value={timeoutSec}
                    onChange={(e) => setTimeoutSec(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-[#F8FAF6] border border-[#18280E]/12 rounded-lg text-[#090F05]"
                  />
                  <span className="text-[10px] text-[#5C6854] mt-0.5 block font-mono">
                    Maximum time allowed for retrieval and evaluation.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/app/audits"
              className="text-xs font-mono font-medium text-[#5C6854] hover:text-[#090F05] transition-colors"
            >
              ← Cancel and return to audits
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full text-xs font-semibold text-[#B2EB76] bg-[#18280E] hover:bg-[#223814] shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#B2EB76] border-t-transparent rounded-full animate-spin" />
                  <span>Running Deterministic Audit...</span>
                </>
              ) : (
                <span>Run Audit & Evaluate Gate →</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}