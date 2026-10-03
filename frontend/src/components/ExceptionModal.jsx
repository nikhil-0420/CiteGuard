import React, { useState } from "react";

import { addException, ApiFail } from "../api";
import { getCurrentUser } from "../auth";
import { ShieldIcon, AlertTriangleIcon, CheckCircleIcon, XCircleIcon } from "./Icons";










export default function ExceptionModal({
  finding,
  report,
  onClose,
  onSuccess,
  onOptimisticUpdate,
  onRevert
}) {
  const currentUser = getCurrentUser();
  const [reviewer, setReviewer] = useState(currentUser?.handle ?? "sam");
  const [reason, setReason] = useState("");
  const [commitSha, setCommitSha] = useState(report.commit_sha);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDetail, setErrorDetail] = useState(null);

  const minChars = 20;
  const isReasonValid = reason.trim().length >= minChars;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isReasonValid) return;

    setErrorDetail(null);
    setIsSubmitting(true);

    const requestBody = {
      finding_id: finding.id,
      reviewer: reviewer.trim(),
      reason: reason.trim(),
      commit_sha: commitSha.trim()
    };

    // Optimistic Update
    try {
      // We import mockException to locally simulate the backend logic
      // and immediately re-render the gate
      const { mockException } = await import("../api");
      const optimisticReport = mockException(requestBody, report);
      onOptimisticUpdate(optimisticReport);
    } catch (e) {


      // If the optimistic logic throws (e.g., simulated 409 or 403), we ignore it here
      // and let the actual API call handle the rejection and error display.
    }try {
      const updated = await addException(
        report.report_id,
        requestBody,
        report
      );
      setIsSubmitting(false);
      onSuccess(updated);
    } catch (err) {
      setIsSubmitting(false);
      onRevert();
      if (err instanceof ApiFail) {
        setErrorDetail(`HTTP ${err.status} [${err.code}]: ${err.message}`);
      } else {
        setErrorDetail("Failed to submit exception. Please check network connection.");
      }
    }
  };

  const handleProbe403 = async () => {
    setErrorDetail(null);
    setIsSubmitting(true);
    try {
      await addException(
        report.report_id,
        {
          finding_id: finding.id,
          reviewer: "unauthorized_intruder",
          reason: "Attempting exception with non-allowlisted identity to test authorization enforcement.",
          commit_sha: commitSha
        },
        report
      );
    } catch (err) {
      setIsSubmitting(false);
      if (err instanceof ApiFail) {
        setErrorDetail(
          `HTTP 403 Forbidden (Simulated Backend Probe): Reviewer "unauthorized_intruder" is not in the allowlist (sam, nikhil-0420, nehaa).`
        );
      }
    }
  };

  const handleProbe409 = async () => {
    setErrorDetail(null);
    setIsSubmitting(true);
    try {
      await addException(
        report.report_id,
        {
          finding_id: finding.id,
          reviewer: "sam",
          reason: "Valid rationale but targeting an obsolete historical commit.",
          commit_sha: "0000000000000000000000000000000000000000"
        },
        report
      );
    } catch (err) {
      setIsSubmitting(false);
      if (err instanceof ApiFail) {
        setErrorDetail(
          `HTTP 409 Conflict (Simulated Backend Probe): Approval is bound to commit 0000000, but audited report is currently at ${report.commit_sha.slice(
            0,
            7
          )}.`
        );
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--cg-surface)]/60 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
      role="dialog"
      aria-modal="true">
      
      <div
        className="w-full max-w-lg bg-[var(--cg-surface)] border border-[var(--cg-line)] rounded-xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}>
        
        <div className="flex items-center justify-between border-b border-[var(--cg-line)] pb-3">
          <div>
            <h2 className="text-base font-bold text-[var(--cg-ink)]">Record Reviewer Exception</h2>
            <div className="text-[11px] font-mono text-[var(--cg-ink-muted)] mt-0.5">
              Finding: {finding.id} · Rule: {finding.rules_applied.join(", ")}
            </div>
          </div>
          <button
            type="button"
            className="text-xs text-[var(--cg-ink-muted)] hover:text-[var(--cg-ink)] p-1 font-mono"
            onClick={onClose}>
            
            ✕
          </button>
        </div>

        {/* Claim context */}
        <div className="p-3 bg-[var(--cg-surface-subtle)] border border-[var(--cg-line)] rounded-md text-xs space-y-1">
          <div className="font-semibold text-[var(--cg-ink)]">Target Claim ({finding.claim_id}):</div>
          <div className="italic text-[var(--cg-ink-muted)]">&ldquo;{finding.claim_text}&rdquo;</div>
          <div className="text-[var(--cg-block)] font-semibold text-[11px] pt-1">
            Current Verdict: {finding.action.toUpperCase()} ({finding.judgment.label.replace(/_/g, " ")})
          </div>
        </div>

        {errorDetail &&
        <div className="p-3 bg-[var(--cg-block-subtle)] border border-[var(--cg-block-line)] rounded-md text-xs text-[var(--cg-block)] flex items-start gap-2 animate-in fade-in duration-150">
            <XCircleIcon size={16} className="shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorDetail}</div>
          </div>
        }

        {!currentUser || !currentUser.isAllowlisted ?
        <div className="p-6 text-center border border-[var(--cg-line)] rounded-lg bg-[var(--cg-surface-subtle)]">
            <ShieldIcon size={24} className="mx-auto text-[var(--cg-ink-muted)] mb-3" />
            <h3 className="text-sm font-bold text-[var(--cg-ink)] mb-1">
              {!currentUser ? "Authentication Required" : "Authorization Required"}
            </h3>
            <p className="text-xs text-[var(--cg-ink-muted)] max-w-sm mx-auto">
              {!currentUser ?
            "You must be signed in to authorize exceptions. Reviewers must be allowlisted for this repository." :
            "Your account is read-only. Only authorized reviewers can record exceptions for this repository."}
            </p>
            <div className="mt-4 pt-4 border-t border-[var(--cg-line)] flex justify-center">
              <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded bg-[var(--cg-surface)] text-[var(--cg-ink)] border border-[var(--cg-line)]">
              
                Close
              </button>
            </div>
          </div> :

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label htmlFor="reviewer-handle" className="block font-semibold text-[var(--cg-ink)] mb-1">
                Reviewer GitHub Handle
              </label>
              <input
              id="reviewer-handle"
              type="text"
              className="w-full px-3 py-1.5 border border-[var(--cg-line)] rounded-md text-[var(--cg-ink)] focus:outline-none focus:border-[var(--cg-accent)] bg-[var(--cg-surface-subtle)] cursor-not-allowed"
              value={reviewer}
              disabled
              placeholder="sam"
              required />
            
              <div className="text-[10px] text-[var(--cg-ink-muted)] mt-0.5">
                Identities are locked to the authenticated user.
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="exception-reason" className="font-semibold text-[var(--cg-ink)]">
                  Audit Rationale (min {minChars} characters)
                </label>
                <span className={`font-mono text-[10px] ${isReasonValid ? "text-[var(--cg-pass)]" : "text-[var(--cg-ink-muted)]"}`}>
                  {reason.trim().length} / {minChars}
                </span>
              </div>
              <textarea
              id="exception-reason"
              rows={3}
              className="w-full p-2.5 border border-[var(--cg-line)] rounded-md text-[var(--cg-ink)] focus:outline-none focus:border-[var(--cg-accent)]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Document domain rationale for approving this claim despite the policy finding..."
              required />
            
            </div>

            <div>
              <label htmlFor="bound-commit" className="block font-semibold text-[var(--cg-ink)] mb-1">
                Bound Commit SHA
              </label>
              <input
              id="bound-commit"
              type="text"
              className="w-full px-3 py-1.5 border border-[var(--cg-line)] rounded-md text-[var(--cg-ink)] font-mono text-[11px]"
              value={commitSha}
              onChange={(e) => setCommitSha(e.target.value)}
              required />
            
              <div className="text-[10px] text-[var(--cg-ink-muted)] mt-0.5">
                Exceptions invalidate automatically if the audited commit SHA changes.
              </div>
            </div>

            <div className="p-3 bg-[var(--cg-accent-subtle)] border border-[var(--cg-accent)]/30 rounded-md text-[11px] text-[var(--cg-accent)] leading-relaxed">
              <strong>Governance Rule CG-HUMAN-01:</strong> Recording this exception updates the commit status gate from Blocked to Passed with Exceptions. The original evidence judgment remains unedited in the permanent audit trail.
            </div>

            {/* Test Probes (Simulated Probes) */}
            <div className="pt-1 flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--cg-ink-muted)]">Test Probes:</span>
              <button
              type="button"
              onClick={handleProbe403}
              disabled={isSubmitting}
              className="px-2 py-1 rounded bg-[var(--cg-surface-subtle)] hover:bg-[var(--cg-surface-subtle)] border border-[var(--cg-line)] text-[11px] text-[var(--cg-ink-muted)] hover:text-[var(--cg-ink)] transition-colors">
              
                Simulate 403 Probe
              </button>
              <button
              type="button"
              onClick={handleProbe409}
              disabled={isSubmitting}
              className="px-2 py-1 rounded bg-[var(--cg-surface-subtle)] hover:bg-[var(--cg-surface-subtle)] border border-[var(--cg-line)] text-[11px] text-[var(--cg-ink-muted)] hover:text-[var(--cg-ink)] transition-colors">
              
                Simulate 409 Stale Probe
              </button>
            </div>

            <div className="pt-3 border-t border-[var(--cg-line)] flex items-center justify-end gap-2">
              <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs text-[var(--cg-ink-muted)] hover:text-[var(--cg-ink)] rounded border border-[var(--cg-line)] hover:bg-[var(--cg-surface-subtle)] transition-colors">
              
                Cancel
              </button>
              <button
              type="submit"
              disabled={!isReasonValid || isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[var(--cg-accent)] hover:bg-[var(--cg-accent-hover)] rounded shadow-xs transition-colors disabled:opacity-50">
              
                {isSubmitting ? "Authorizing Exception..." : "Authorize Exception →"}
              </button>
            </div>
          </form>
        }
      </div>
    </div>);

}