import { useState } from "react";

import { pretty } from "./Chip";
import {
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
  CopyIcon,
  CheckIcon,
  ShieldIcon,
  ChevronDownIcon,
  ChevronRightIcon } from
"./Icons";









export default function EvidencePanel({
  finding,
  report,
  onOpenExceptionModal,
  onSelectFinding,
  allFindings
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);

  const currentIndex = allFindings.findIndex((f) => f.id === finding.id);
  const prevFinding = currentIndex > 0 ? allFindings[currentIndex - 1] : null;
  const nextFinding = currentIndex < allFindings.length - 1 ? allFindings[currentIndex + 1] : null;

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("finding", finding.id);
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getStatusBadge = () => {
    switch (finding.action) {
      case "pass":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-[var(--status-pass-bg)] text-[var(--status-pass-fg)] border border-[#CDE5CD]">
            <CheckCircleIcon size={12} /> PASS
          </span>);

      case "block":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-[var(--status-block-bg)] text-[var(--status-block-fg)] border border-[#F2CACA]">
            <XCircleIcon size={12} /> BLOCKED
          </span>);

      case "review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-[var(--status-review-bg)] text-[var(--status-review-fg)] border border-[#F6DCB6]">
            <AlertTriangleIcon size={12} /> NEEDS REVIEW
          </span>);

    }
  };

  const isIdentityMismatch = finding.reference.status === "metadata_mismatch";
  const isUnavailable = finding.evidence.availability === "unavailable";
  const hasInjectedPrompt = finding.rules_applied.includes("CG-TRUST-01");

  return (
    <div className="flex flex-col h-full bg-[var(--cg-surface)] border-l border-[var(--border-strong)] overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-faint)]">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold text-[var(--cg-ink)]">
            {finding.id}
          </span>
          {getStatusBadge()}
          {finding.exception &&
          <span className="text-[11px] font-mono px-2 py-0.5 bg-[var(--accent-subdued)] text-[var(--cg-accent)] border border-[var(--cg-accent)] rounded opacity-90">
              Excepted by @{finding.exception.reviewer}
            </span>
          }
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--ink-subdued)] bg-[var(--cg-surface)] border border-[var(--border-strong)] rounded hover:bg-[var(--cg-block)] cursor-pointer transition-colors"
            title="Copy deep link to finding">
            
            {copiedLink ? <CheckIcon size={14} className="text-[var(--status-pass-fg)]" /> : <CopyIcon size={14} />}
            <span>{copiedLink ? "Copied" : "Link"}</span>
          </button>

          <div className="flex items-center border border-[var(--border-strong)] rounded bg-[var(--cg-surface)] overflow-hidden">
            <button
              type="button"
              disabled={!prevFinding}
              onClick={() => prevFinding && onSelectFinding(prevFinding.id)}
              className="px-3 py-1.5 text-xs font-mono text-[var(--ink-subdued)] hover:bg-[var(--cg-block)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Previous finding">
              
              &larr;
            </button>
            <span className="px-2 text-[11px] text-[var(--ink-faint)] font-mono select-none border-l border-r border-[var(--border-faint)] py-1.5">
              {currentIndex + 1}/{allFindings.length}
            </span>
            <button
              type="button"
              disabled={!nextFinding}
              onClick={() => nextFinding && onSelectFinding(nextFinding.id)}
              className="px-3 py-1.5 text-xs font-mono text-[var(--ink-subdued)] hover:bg-[var(--cg-block)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Next finding">
              
              &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
        {/* Claim section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--ink-subdued)] tracking-wide">
              Audited Claim (Line {finding.line})
            </span>
            <span className="text-[11px] font-mono text-[var(--ink-faint)]">
              {finding.claim_id} &bull; [@{finding.citation_key}]
            </span>
          </div>
          <div className="p-4 bg-[var(--cg-block)] rounded-md text-[var(--cg-ink)] leading-relaxed text-[15px] italic border-l-4 border-[var(--ink-subdued)]">
            &ldquo;{finding.claim_text}&rdquo;
          </div>
        </div>

        {/* Decisive Source Evidence */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--ink-subdued)] tracking-wide">
              Inspected Source Evidence
            </span>
            {finding.evidence.passages.length > 0 && finding.evidence.passages[0].quote_validated &&
            <span className="text-[11px] font-medium text-[var(--status-pass-fg)] bg-[var(--status-pass-bg)] px-2 py-0.5 rounded border border-[#CDE5CD]">
                ✓ Verbatim quote verified
              </span>
            }
          </div>

          {isIdentityMismatch ?
          <div className="p-4 bg-[var(--status-block-bg)] border border-[var(--status-block-fg)] border-opacity-30 rounded-md text-[var(--status-block-fg)] text-sm leading-relaxed space-y-1">
              <div className="font-bold">
                Support assessment not performed: reference identity mismatch
              </div>
              <p className="opacity-90">
                {finding.reference.note ||
              "The cited publication year or authors do not match the canonical registry record."}
              </p>
            </div> :
          isUnavailable ?
          <div className="p-4 bg-[var(--status-review-bg)] border border-[var(--status-review-fg)] border-opacity-30 rounded-md text-[var(--status-review-fg)] text-sm leading-relaxed space-y-1">
              <div className="font-bold">
                Source passage unavailable
              </div>
              <p className="opacity-90">
                {finding.reference.note ||
              "No matching record found in indexed registries within retrieval budget. Flagged for reviewer inspection without fabricating content."}
              </p>
            </div> :
          finding.evidence.passages.length > 0 ?
          <div className="pl-4 py-3 bg-[var(--cg-block)] rounded border-l-4 border-[var(--cg-accent)] space-y-3">
              <p className="text-sm text-[var(--cg-ink)] leading-relaxed">
                &ldquo;{finding.evidence.passages[0].text}&rdquo;
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-strong)] border-opacity-50 text-[11px] text-[var(--ink-subdued)] font-mono">
                <span>
                  Locator: Section {finding.evidence.passages[0].locator.section}, Paragraph {finding.evidence.passages[0].locator.paragraph}
                </span>
                <span>Provenance: {finding.evidence.corpus}</span>
              </div>
            </div> :

          <div className="p-4 bg-[var(--cg-block)] border border-[var(--border-faint)] rounded-md text-sm text-[var(--ink-subdued)] italic">
              No direct passages retrieved.
            </div>
          }
        </div>

        {/* Judgment & Discrepancy Highlight */}
        <div className="p-4 bg-[var(--cg-surface)] border border-[var(--border-strong)] rounded-md shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-faint)]">
            <span className="text-sm font-semibold text-[var(--cg-ink)]">
              Evaluation Verdict:{" "}
              <span className="uppercase text-[var(--cg-accent)] font-mono font-bold tracking-tight">
                {pretty(finding.judgment.label)}
              </span>
            </span>
            <span className="text-[11px] font-mono text-[var(--ink-subdued)]">
              Rule: {finding.rules_applied.join(", ")}
            </span>
          </div>

          <p className="text-sm text-[var(--cg-ink)] leading-relaxed">
            {finding.judgment.rationale}
          </p>

          {/* Specific Comparison Callout */}
          {finding.id === "F-003" &&
          <div className="mt-3 p-3 bg-[var(--status-block-bg)] border border-[#F2CACA] rounded text-sm space-y-1.5">
              <span className="font-semibold text-[var(--status-block-fg)]">Numerical Discrepancy:</span>
              <div className="flex items-center gap-3">
                <span className="text-[var(--status-block-fg)]">Claimed: <code className="bg-[var(--cg-surface)] px-1.5 py-0.5 rounded border border-[#F2CACA] font-bold">&lt; 2%</code></span>
                <span className="text-[var(--status-block-fg)] opacity-60 font-bold">&ne;</span>
                <span className="text-[var(--status-block-fg)]">Source: <code className="bg-[var(--cg-surface)] px-1.5 py-0.5 rounded border border-[#F2CACA] font-bold">3.57%</code></span>
              </div>
            </div>
          }

          {finding.id === "F-004" &&
          <div className="mt-3 p-3 bg-[var(--status-review-bg)] border border-[#F6DCB6] rounded text-sm space-y-1.5">
              <span className="font-semibold text-[var(--status-review-fg)]">Scope Discrepancy:</span>
              <div className="flex items-center gap-3">
                <span className="text-[var(--status-review-fg)]">Claimed: <code className="bg-[var(--cg-surface)] px-1.5 py-0.5 rounded border border-[#F6DCB6] font-bold">all tasks</code></span>
                <span className="text-[var(--status-review-fg)] opacity-60 font-bold">&gt;</span>
                <span className="text-[var(--status-review-fg)]">Source: <code className="bg-[var(--cg-surface)] px-1.5 py-0.5 rounded border border-[#F6DCB6] font-bold">eleven tasks</code></span>
              </div>
            </div>
          }

          {hasInjectedPrompt &&
          <div className="mt-3 p-3 bg-[var(--status-pass-bg)] border border-[#CDE5CD] rounded text-sm space-y-1 text-[var(--status-pass-fg)]">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldIcon size={14} />
                <span>CG-TRUST-01: Untrusted Instruction Neutralized</span>
              </div>
              <p className="text-xs opacity-90 leading-relaxed">
                Source document contained an embedded instruction to alter the policy gate. The verification engine treated source text strictly as data and ignored directives.
              </p>
            </div>
          }
        </div>

        {/* Primary Action Button */}
        <div>
          {finding.action !== "pass" && !finding.exception ?
          <button
            type="button"
            onClick={() => onOpenExceptionModal(finding)}
            className="w-full py-3 px-4 text-sm font-semibold text-[var(--cg-surface)] bg-[var(--cg-ink)] hover:bg-[var(--ink-subdued)] rounded-md shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2">
            
              <span>Record Reviewer Exception &rarr;</span>
            </button> :
          finding.exception ?
          <div className="p-3 bg-[var(--accent-subdued)] border border-[#F1D5CD] rounded-md text-sm text-[var(--accent-hover)] flex items-center justify-between">
              <span className="font-semibold">Exception recorded by @{finding.exception.reviewer}</span>
              <span className="font-mono text-[11px] font-bold opacity-80">Permanent Log</span>
            </div> :

          <div className="p-3 bg-[var(--status-pass-bg)] border border-[#CDE5CD] rounded text-center text-sm text-[var(--status-pass-fg)] font-semibold">
              Finding satisfies all deterministic criteria.
            </div>
          }
        </div>

        {/* 3. Expandable Subsections */}
        <div className="pt-4 border-t border-[var(--border-strong)] space-y-3">
          {/* Metadata Accordion */}
          <div className="border border-[var(--border-strong)] rounded-md overflow-hidden bg-[var(--cg-block)]">
            <button
              type="button"
              onClick={() => setMetadataOpen(!metadataOpen)}
              className="w-full flex items-center justify-between p-3 text-xs font-semibold text-[var(--cg-ink)] hover:bg-[var(--border-faint)] cursor-pointer transition-colors">
              
              <span>Reference Metadata & Identity Resolution</span>
              {metadataOpen ? <ChevronDownIcon size={16} className="text-[var(--ink-subdued)]" /> : <ChevronRightIcon size={16} className="text-[var(--ink-subdued)]" />}
            </button>
            {metadataOpen &&
            <div className="p-4 bg-[var(--cg-surface)] text-xs space-y-2 border-t border-[var(--border-strong)]">
                <table className="w-full border-collapse text-left">
                  <tbody>
                    <tr className="border-b border-[var(--border-faint)]">
                      <td className="py-2 text-[var(--ink-subdued)] w-28">Title</td>
                      <td className="py-2 font-medium text-[var(--cg-ink)]">{finding.reference.title}</td>
                    </tr>
                    <tr className="border-b border-[var(--border-faint)]">
                      <td className="py-2 text-[var(--ink-subdued)]">Authors</td>
                      <td className="py-2 text-[var(--cg-ink)]">{finding.reference.authors.join(", ")}</td>
                    </tr>
                    <tr className="border-b border-[var(--border-faint)]">
                      <td className="py-2 text-[var(--ink-subdued)]">Year</td>
                      <td className="py-2 font-mono text-[var(--cg-ink)]">{finding.reference.year}</td>
                    </tr>
                    <tr className="border-b border-[var(--border-faint)]">
                      <td className="py-2 text-[var(--ink-subdued)]">Identifier / DOI</td>
                      <td className="py-2 font-mono">
                        {finding.reference.doi ?
                      <a
                        href={`https://doi.org/${finding.reference.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--cg-accent)] hover:text-[var(--accent-hover)] hover:underline inline-flex items-center gap-1.5 transition-colors">
                        
                            {finding.reference.doi}
                            <ExternalLinkIcon size={12} />
                          </a> :

                      <span className="text-[var(--ink-faint)]">None</span>
                      }
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-[var(--ink-subdued)]">Status</td>
                      <td className="py-2">
                        <span className="font-mono text-[11px] font-bold uppercase text-[var(--cg-ink)] bg-[var(--cg-block)] px-2 py-0.5 rounded border border-[var(--border-strong)]">
                          {finding.reference.status}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            }
          </div>

          {/* Trace Accordion */}
          <div className="border border-[var(--border-strong)] rounded-md overflow-hidden bg-[var(--cg-block)]">
            <button
              type="button"
              onClick={() => setTraceOpen(!traceOpen)}
              className="w-full flex items-center justify-between p-3 text-xs font-semibold text-[var(--cg-ink)] hover:bg-[var(--border-faint)] cursor-pointer transition-colors">
              
              <span>Agent Execution Steps ({finding.agent_trace.length} actions)</span>
              {traceOpen ? <ChevronDownIcon size={16} className="text-[var(--ink-subdued)]" /> : <ChevronRightIcon size={16} className="text-[var(--ink-subdued)]" />}
            </button>
            {traceOpen &&
            <div className="p-4 bg-[var(--cg-surface)] space-y-3 border-t border-[var(--border-strong)]">
                {finding.agent_trace.map((step) =>
              <div
                key={step.step}
                className="p-3 bg-[var(--cg-block)] border border-[var(--border-faint)] rounded-md text-xs space-y-2 font-mono">
                
                    <div className="flex items-center justify-between text-[var(--cg-ink)] font-bold border-b border-[var(--border-strong)] pb-1.5">
                      <span>Step {step.step}: {step.action}</span>
                    </div>
                    <div className="text-[var(--ink-subdued)] text-[12px] leading-relaxed pt-1">{step.observation}</div>
                    <div className="text-[var(--ink-faint)] text-[11px] italic bg-[var(--cg-surface)] p-2 rounded border border-[var(--border-faint)]">Rationale: {step.reason}</div>
                  </div>
              )}
              </div>
            }
          </div>
        </div>
      </div>
    </div>);

}