import React from "react";
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon, AlertOctagonIcon, ClockIcon } from "./Icons";

export function Chip({ kind, children, title, icon }) {
  const getStyles = () => {
    switch (kind) {
      case "pass":
      case "supported":
      case "matched":
      case "available":
      case "success":
        return {
          bg: "var(--cg-pass-subtle)",
          color: "var(--cg-pass)",
          border: "var(--cg-pass-line)"
        };
      case "block":
      case "contradicted":
      case "metadata_mismatch":
      case "failure":
        return {
          bg: "var(--cg-block-subtle)",
          color: "var(--cg-block)",
          border: "var(--cg-block-line)"
        };
      case "review":
      case "partial":
      case "unresolved":
      case "incomplete":
      case "not_supported_in_reviewed_evidence":
      case "pending":
        return {
          bg: "var(--cg-review-subtle)",
          color: "var(--cg-review)",
          border: "var(--cg-review-line)"
        };
      case "error":
        return {
          bg: "var(--cg-block-subtle)",
          color: "var(--cg-block)",
          border: "var(--cg-block-line)"
        };
      case "cached":
      case "rule":
      default:
        return {
          bg: "var(--cg-surface-subtle)",
          color: "var(--cg-ink-secondary)",
          border: "var(--cg-line)"
        };
    }
  };

  const renderIcon = () => {
    if (!icon) return null;
    switch (kind) {
      case "pass":
      case "supported":
      case "matched":
      case "available":
      case "success":
        return <CheckCircleIcon size={12} />;
      case "block":
      case "contradicted":
      case "metadata_mismatch":
      case "failure":
        return <XCircleIcon size={12} />;
      case "review":
      case "partial":
      case "unresolved":
      case "incomplete":
      case "not_supported_in_reviewed_evidence":
      case "pending":
        return <AlertTriangleIcon size={12} />;
      case "error":
        return <AlertOctagonIcon size={12} />;
      case "cached":
        return <ClockIcon size={12} />;
      default:
        return null;
    }
  };

  const styles = getStyles();

  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider"
      style={{
        background: styles.bg,
        color: styles.color,
        border: `1px solid ${styles.border}`
      }}>
      
      {renderIcon()}
      <span>{children}</span>
    </span>);

}

export const pretty = (s) => s.replace(/_/g, " ");