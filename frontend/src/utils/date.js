/**
 * Centralized Date & Time Formatter for CiteGuard
 * Standardizes to "3 Oct 2026, 18:00 IST" or user locale format.
 * Eliminates ambiguous MM/DD/YYYY or DD/MM/YYYY numeric representations.
 */

export function formatDateTime(isoString, isSample = false) {
  if (!isoString) return "Not recorded";

  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);

    // Format as "3 Oct 2026, 18:00 IST"
    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    // Standard demo timestamp in IST
    const formatted = `${day} ${month} ${year}, ${hours}:${minutes} IST`;
    return isSample ? `${formatted} (Sample)` : formatted;
  } catch {
    return String(isoString);
  }
}

export function formatDateOnly(isoString) {
  if (!isoString) return "N/A";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return String(isoString);
  }
}