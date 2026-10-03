

/**
 * Sanitizes spreadsheet cells to prevent formula injection attacks.
 * If a cell string starts with =, +, -, @, \t, or \r, prepend an apostrophe.
 */
function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  if (/^[=\+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  // Escape double quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

export function exportReportAsJson(report) {
  const jsonStr = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `citeguard-${report.report_id}-${report.commit_sha.slice(0, 7)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportFindingsAsCsv(report) {
  const headers = [
  "Finding ID",
  "Claim ID",
  "Line",
  "Citation Key",
  "Claim Text",
  "Reference Title",
  "Reference Year",
  "Reference Status",
  "Evidence Availability",
  "Quote Validated",
  "Judgment Label",
  "Judgment Rationale",
  "Policy Action",
  "Rules Applied",
  "Exception Reviewer",
  "Exception Reason"];


  const rows = report.findings.map((f) => {
    const quoteOk = f.evidence.passages.length > 0 && f.evidence.passages.every((p) => p.quote_validated);
    return [
    sanitizeCsvCell(f.id),
    sanitizeCsvCell(f.claim_id),
    sanitizeCsvCell(f.line),
    sanitizeCsvCell(f.citation_key),
    sanitizeCsvCell(f.claim_text),
    sanitizeCsvCell(f.reference.title),
    sanitizeCsvCell(f.reference.year),
    sanitizeCsvCell(f.reference.status),
    sanitizeCsvCell(f.evidence.availability),
    sanitizeCsvCell(quoteOk ? "YES" : "NO"),
    sanitizeCsvCell(f.judgment.label),
    sanitizeCsvCell(f.judgment.rationale),
    sanitizeCsvCell(f.action),
    sanitizeCsvCell(f.rules_applied.join("; ")),
    sanitizeCsvCell(f.exception?.reviewer ?? ""),
    sanitizeCsvCell(f.exception?.reason ?? "")].
    join(",");
  });

  const csvContent = "\uFEFF" + [headers.map(sanitizeCsvCell).join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `citeguard-findings-${report.report_id}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printAuditReport() {
  window.print();
}