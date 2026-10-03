import React, { useState } from "react";
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
  ChevronRightIcon,
} from "./Icons";

export default function EvidencePanel({
  finding,
  report,
  onOpenExceptionModal,
  onSelectFinding,
  allFindings,
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(false);
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#F4FAED] text-[#166534] border border-[#18280E]/15">
            <CheckCircleIcon size={12} /> PASS
          </span>
        );
      case "block":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
            <XCircleIcon size={12} /> BLOCKED
          </span>
        );
      case "review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
            <AlertTriangleIcon size={12} /> NEEDS REVIEW
          </span>
        );
      default:
        return null;
    }
  };

  const isIdentityMismatch = finding.reference.status === "metadata_mismatch";
  const isUnavailable = finding.evidence.availability === "unavailable";
  const hasInjectedPrompt = finding.rules_applied.includes("CG-TRUST-01");

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden font-sans">
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#18280E]/10 bg-white">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs font-bold text-[#090F05] bg-[#F4FAED] px-2.5 py-1 rounded-lg border border-[#18280E]/10">
            {finding.id}
          </span>
          {getStatusBadge()}
          {finding.exception && (
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#F4FAED] text-[#18280E] border border-[#18280E]/20 rounded-full font-semibold">
              Excepted by @{finding.exception.reviewer}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-[#5C6854] bg-[#F4FAED] border border-[#18280E]/10 rounded-lg hover:text-[#090F05] hover:bg-[#E8F2DF] cursor-pointer transition-colors"
            title="Copy deep link to finding"
          >
            {copiedLink ? <CheckIcon size={13} className="text-[#166534]" /> : <CopyIcon size={13} />}
            <span>{copiedLink ? "Copied" : "Link"}</span>
          </button>

          <div className="flex items-center border border-[#18280E]/10 rounded-lg bg-[#F4FAED] overflow-hidden text-xs font-mono">
            <button
              type="button"
              disabled={!prevFinding}
              onClick={() => prevFinding && onSelectFinding(prevFinding.id)}
              className="px-2.5 py-1 text-[#5C6854] hover:text-[#090F05] hover:bg-[#E8F2DF] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Previous finding"
            >
              ←
            </button>
            <span className="px-2 text-[10px] text-[#5C6854] select-none border-l border-r border-[#18280E]/10 py-1">
              {currentIndex + 1}/{allFindings.length}
            </span>
            <button
              type="button"
              disabled={!nextFinding}
              onClick={() => nextFinding && onSelectFinding(nextFinding.id)}
              className="px-2.5 py-1 text-[#5C6854] hover:text-[#090F05] hover:bg-[#E8F2DF] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Next finding"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
        {/* Claim Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[#5C6854] font-mono text-[11px]">
            <span className="font-semibold uppercase tracking-wider">
              Audited Claim (Line {finding.line})
            </span>
            <span>
              {finding.claim_id} · [@{finding.citation_key}]
            </span>
          </div>
          <div className="p-4 bg-[#F8FAF6] rounded-xl text-[#090F05] leading-relaxed text-[13px] border border-[#18280E]/10 italic">
            &ldquo;{finding.claim_text}&rdquo;
          </div>
        </div>

        {/* Decisive Source Evidence */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[#5C6854] font-mono text-[11px]">
            <span className="font-semibold uppercase tracking-wider">
              Inspected Source Evidence
            </span>
            {finding.evidence.passages.length > 0 &&
              finding.evidence.passages[0].quote_validated && (
                <span className="text-[10px] font-mono font-medium text-[#166534] bg-[#F4FAED] px-2 py-0.5 rounded-full border border-[#18280E]/15">
                  ✓ Verbatim quote verified
                </span>
              )}
          </div>

          {isIdentityMismatch ? (
            <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#991B1B] text-xs leading-relaxed space-y-1">
              <div className="font-bold">
                Support assessment not performed: reference identity mismatch
              </div>
              <p className="opacity-90">
                {finding.reference.note ||
                  "The cited publication year or authors do not match the canonical registry record."}
              </p>
            </div>
          ) : isUnavailable ? (
            <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-[#B45309] text-xs leading-relaxed space-y-1">
              <div className="font-bold">Source passage unavailable</div>
              <p className="opacity-90">
                {finding.reference.note ||
                  "No matching record found in indexed registries within retrieval budget. Flagged for reviewer inspection without fabricating content."}
              </p>
            </div>
          ) : finding.evidence.passages.length > 0 ? (
            <div className="p-4 bg-[#F4FAED] rounded-xl border border-[#18280E]/12 space-y-2.5">
              <p className="text-xs text-[#090F05] leading-relaxed font-serif">
                &ldquo;{finding.evidence.passages[0].text}&rdquo;
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-[#18280E]/10 text-[10px] text-[#5C6854] font-mono">
                <span>
                  Section {finding.evidence.passages[0].locator.section}, Paragraph{" "}
                  {finding.evidence.passages[0].locator.paragraph}
                </span>
                <span>Provenance: {finding.evidence.corpus}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#F8FAF6] border border-[#18280E]/10 rounded-xl text-xs text-[#5C6854] italic">
              No direct passages retrieved.
            </div>
          )}
        </div>

        {/* Judgment & Discrepancy Card */}
        <div className="p-4 bg-white border border-[#18280E]/10 rounded-xl shadow-xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#18280E]/10">
            <span className="text-xs font-semibold text-[#090F05]">
              Verdict:{" "}
              <span className="uppercase text-[#18280E] font-mono font-bold tracking-tight">
                {pretty(finding.judgment.label)}
              </span>
            </span>
            <span className="text-[10px] font-mono text-[#5C6854]">
              Rule: {finding.rules_applied.join(", ")}
            </span>
          </div>

          <p className="text-xs text-[#090F05] leading-relaxed">
            {finding.judgment.rationale}
          </p>

          {/* Specific Comparison Callout */}
          {finding.id === "F-003" && (
            <div className="mt-2 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs space-y-1 font-mono">
              <span className="font-semibold text-[#991B1B]">Numerical Discrepancy:</span>
              <div className="flex items-center gap-3">
                <span className="text-[#991B1B]">
                  Claimed: <code className="bg-white px-1.5 py-0.5 rounded border border-[#FECACA] font-bold">&lt; 2%</code>
                </span>
                <span className="text-[#991B1B] font-bold">≠</span>
                <span className="text-[#991B1B]">
                  Source: <code className="bg-white px-1.5 py-0.5 rounded border border-[#FECACA] font-bold">3.57%</code>
                </span>
              </div>
            </div>
          )}

          {finding.id === "F-004" && (
            <div className="mt-2 p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs space-y-1 font-mono">
              <span className="font-semibold text-[#B45309]">Scope Discrepancy:</span>
              <div className="flex items-center gap-3">
                <span className="text-[#B45309]">
                  Claimed: <code className="bg-white px-1.5 py-0.5 rounded border border-[#FDE68A] font-bold">all tasks</code>
                </span>
                <span className="text-[#B45309] font-bold">&gt;</span>
                <span className="text-[#B45309]">
                  Source: <code className="bg-white px-1.5 py-0.5 rounded border border-[#FDE68A] font-bold">eleven tasks</code>
                </span>
              </div>
            </div>
          )}

          {hasInjectedPrompt && (
            <div className="mt-2 p-3 bg-[#F4FAED] border border-[#18280E]/15 rounded-xl text-xs space-y-1 text-[#166534]">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldIcon size={13} />
                <span>CG-TRUST-01: Untrusted Instruction Neutralized</span>
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed font-sans">
                Source document contained an embedded instruction to alter the policy gate. The verification engine treated source text strictly as data and ignored directives.
              </p>
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <div>
          {finding.action !== "pass" && !finding.exception ? (
            <button
              type="button"
              onClick={() => onOpenExceptionModal(finding)}
              className="w-full py-2.5 px-4 text-xs font-semibold text-[#B2EB76] bg-[#18280E] hover:bg-[#223814] rounded-full shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Record Reviewer Exception →</span>
            </button>
          ) : finding.exception ? (
            <div className="p-3 bg-[#F4FAED] border border-[#18280E]/15 rounded-xl text-xs text-[#090F05] flex items-center justify-between font-mono">
              <span className="font-semibold">Exception recorded by @{finding.exception.reviewer}</span>
              <span className="text-[10px] text-[#166534] font-bold bg-white px-2 py-0.5 rounded border border-[#18280E]/10">
                Permanent Trail
              </span>
            </div>
          ) : (
            <div className="p-3 bg-[#F4FAED] border border-[#18280E]/15 rounded-xl text-center text-xs text-[#166534] font-semibold font-mono">
              Finding satisfies all deterministic criteria.
            </div>
          )}
        </div>

        {/* Expandable Subsections */}
        <div className="pt-3 border-t border-[#18280E]/10 space-y-2">
          {/* Metadata Accordion */}
          <div className="border border-[#18280E]/10 rounded-xl overflow-hidden bg-[#F8FAF6]">
            <button
              type="button"
              onClick={() => setMetadataOpen(!metadataOpen)}
              className="w-full flex items-center justify-between p-3 text-xs font-semibold text-[#090F05] hover:bg-[#F4FAED] cursor-pointer transition-colors"
            >
              <span>Reference Metadata & Identity</span>
              {metadataOpen ? (
                <ChevronDownIcon size={14} className="text-[#5C6854]" />
              ) : (
                <ChevronRightIcon size={14} className="text-[#5C6854]" />
              )}
            </button>
            {metadataOpen && (
              <div className="p-3 bg-white text-xs space-y-2 border-t border-[#18280E]/10 font-mono">
                <div className="flex justify-between py-1 border-b border-[#18280E]/5">
                  <span className="text-[#5C6854]">Title</span>
                  <span className="font-medium text-[#090F05] text-right max-w-[200px] truncate">
                    {finding.reference.title}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#18280E]/5">
                  <span className="text-[#5C6854]">Authors</span>
                  <span className="text-[#090F05] text-right max-w-[200px] truncate">
                    {finding.reference.authors.join(", ")}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#18280E]/5">
                  <span className="text-[#5C6854]">Year</span>
                  <span className="text-[#090F05]">{finding.reference.year}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#18280E]/5">
                  <span className="text-[#5C6854]">DOI</span>
                  <span>
                    {finding.reference.doi ? (
                      <a
                        href={`https://doi.org/${finding.reference.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#18280E] font-bold hover:underline inline-flex items-center gap-1"
                      >
                        {finding.reference.doi}
                        <ExternalLinkIcon size={11} />
                      </a>
                    ) : (
                      <span className="text-[#8A9684]">None</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#5C6854]">Registry Status</span>
                  <span className="text-[10px] font-bold uppercase text-[#090F05] bg-[#F4FAED] px-2 py-0.5 rounded border border-[#18280E]/10">
                    {finding.reference.status}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Trace Accordion */}
          <div className="border border-[#18280E]/10 rounded-xl overflow-hidden bg-[#F8FAF6]">
            <button
              type="button"
              onClick={() => setTraceOpen(!traceOpen)}
              className="w-full flex items-center justify-between p-3 text-xs font-semibold text-[#090F05] hover:bg-[#F4FAED] cursor-pointer transition-colors"
            >
              <span>Agent Execution Steps ({finding.agent_trace.length} actions)</span>
              {traceOpen ? (
                <ChevronDownIcon size={14} className="text-[#5C6854]" />
              ) : (
                <ChevronRightIcon size={14} className="text-[#5C6854]" />
              )}
            </button>
            {traceOpen && (
              <div className="p-3 bg-white space-y-2 border-t border-[#18280E]/10">
                {finding.agent_trace.map((step) => (
                  <div
                    key={step.step}
                    className="p-2.5 bg-[#F8FAF6] border border-[#18280E]/10 rounded-lg text-xs space-y-1 font-mono"
                  >
                    <div className="flex items-center justify-between text-[#090F05] font-bold border-b border-[#18280E]/10 pb-1">
                      <span>
                        Step {step.step}: {step.action}
                      </span>
                    </div>
                    <div className="text-[#5C6854] text-[11px] leading-relaxed pt-0.5">
                      {step.observation}
                    </div>
                    <div className="text-[#8A9684] text-[10px] italic bg-white p-1.5 rounded border border-[#18280E]/5">
                      Rationale: {step.reason}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}