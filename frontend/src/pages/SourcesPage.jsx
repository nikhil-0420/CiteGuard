import React, { useState, useMemo } from "react";
import AppShell from "../components/AppShell";
import { formatDateTime } from "../utils/date";
import {
  DatabaseIcon,
  ExternalLinkIcon,
  FilterIcon,
  SearchIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  FileTextIcon } from
"../components/Icons";

























const CANONICAL_SOURCES = [
{
  id: "src-vaswani-2017",
  canonicalDoi: "10.48550/arXiv.1706.03762",
  canonicalTitle: "Attention Is All You Need",
  canonicalAuthors: ["Vaswani", "Shazeer", "Parmar", "Uszkoreit", "Jones", "Gomez", "Kaiser", "Polosukhin"],
  canonicalYear: 2017,
  provenance: "crossref_verified",
  retrievalStatus: "available",
  lastChecked: "2026-10-03T12:30:00+00:00",
  occurrences: [
  {
    occurrenceId: "occ-1",
    auditId: "blocked",
    findingId: "F-001",
    citationKey: "vaswani2017",
    line: 8,
    citedYear: 2017,
    citedAuthors: ["Vaswani", "Shazeer", "Parmar", "Uszkoreit", "Jones", "Gomez", "Kaiser", "Polosukhin"],
    mismatchFields: [],
    status: "matched"
  },
  {
    occurrenceId: "occ-2",
    auditId: "blocked",
    findingId: "F-005",
    citationKey: "vaswani2018",
    line: 18,
    citedYear: 2018,
    citedAuthors: ["Vaswani", "Shazeer", "Parmar"],
    mismatchFields: ["year", "authors"],
    status: "metadata_mismatch"
  }]

},
{
  id: "src-he-2015",
  canonicalDoi: "10.48550/arXiv.1512.03385",
  canonicalTitle: "Deep Residual Learning for Image Recognition",
  canonicalAuthors: ["He", "Zhang", "Ren", "Sun"],
  canonicalYear: 2015,
  provenance: "crossref_verified",
  retrievalStatus: "available",
  lastChecked: "2026-10-03T12:30:00+00:00",
  occurrences: [
  {
    occurrenceId: "occ-3",
    auditId: "blocked",
    findingId: "F-003",
    citationKey: "he2015",
    line: 13,
    citedYear: 2015,
    citedAuthors: ["He", "Zhang", "Ren", "Sun"],
    mismatchFields: [],
    status: "matched"
  }]

},
{
  id: "src-devlin-2018",
  canonicalDoi: "10.48550/arXiv.1810.04805",
  canonicalTitle: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
  canonicalAuthors: ["Devlin", "Chang", "Lee", "Toutanova"],
  canonicalYear: 2018,
  provenance: "crossref_verified",
  retrievalStatus: "available",
  lastChecked: "2026-10-03T12:30:00+00:00",
  occurrences: [
  {
    occurrenceId: "occ-4",
    auditId: "blocked",
    findingId: "F-002",
    citationKey: "devlin2018",
    line: 9,
    citedYear: 2018,
    citedAuthors: ["Devlin", "Chang", "Lee", "Toutanova"],
    mismatchFields: [],
    status: "matched"
  },
  {
    occurrenceId: "occ-5",
    auditId: "blocked",
    findingId: "F-004",
    citationKey: "devlin2018",
    line: 14,
    citedYear: 2018,
    citedAuthors: ["Devlin", "Chang", "Lee", "Toutanova"],
    mismatchFields: [],
    status: "matched"
  }]

},
{
  id: "src-lee-2026",
  canonicalDoi: null,
  canonicalTitle: "Agentic Verification Loops for Scientific Writing",
  canonicalAuthors: ["Lee"],
  canonicalYear: 2026,
  provenance: "unresolved_candidate",
  retrievalStatus: "unavailable",
  lastChecked: "2026-10-03T12:30:00+00:00",
  occurrences: [
  {
    occurrenceId: "occ-6",
    auditId: "blocked",
    findingId: "F-006",
    citationKey: "lee2026agentic",
    line: 19,
    citedYear: 2026,
    citedAuthors: ["Lee"],
    mismatchFields: ["doi"],
    status: "unresolved"
  }]

},
{
  id: "src-doe-2024",
  canonicalDoi: "10.0000/planted.2024.notes",
  canonicalTitle: "Notes on Citation Hygiene",
  canonicalAuthors: ["Doe"],
  canonicalYear: 2024,
  provenance: "sample_fixture",
  retrievalStatus: "unavailable",
  lastChecked: "2026-10-03T12:30:00+00:00",
  occurrences: [
  {
    occurrenceId: "occ-7",
    auditId: "blocked",
    findingId: "F-007",
    citationKey: "doe2024notes",
    line: 20,
    citedYear: 2024,
    citedAuthors: ["Doe"],
    mismatchFields: [],
    status: "unresolved"
  }]

}];


export default function SourcesPage() {
  const [sources] = useState(CANONICAL_SOURCES);
  const [selectedSourceId, setSelectedSourceId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const selectedSource = sources.find((s) => s.id === selectedSourceId) || null;

  const filtered = useMemo(() => {
    return sources.filter((s) => {
      if (statusFilter !== "all" && s.provenance !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const mTitle = s.canonicalTitle.toLowerCase().includes(q);
        const mDoi = s.canonicalDoi?.toLowerCase().includes(q) || false;
        const mAuthors = s.canonicalAuthors.some((a) => a.toLowerCase().includes(q));
        const mKeys = s.occurrences.some((o) => o.citationKey.toLowerCase().includes(q));
        return mTitle || mDoi || mAuthors || mKeys;
      }
      return true;
    });
  }, [sources, statusFilter, search]);

  const getProvenanceBadge = (prov) => {
    switch (prov) {
      case "crossref_verified":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--cg-pass-subtle)] text-[var(--cg-pass)] border border-[var(--cg-pass-line)]">
            <CheckCircleIcon size={12} />
            <span>Crossref Verified</span>
          </span>);

      case "unresolved_candidate":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--cg-review-subtle)] text-[var(--cg-review)] border border-[var(--cg-review-line)]">
            <AlertTriangleIcon size={12} />
            <span>Unresolved Candidate</span>
          </span>);

      case "sample_fixture":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[var(--cg-surface-subtle)] text-[var(--cg-ink-secondary)] border border-[var(--cg-line)]">
            Sample Fixture (Simulated)
          </span>);

      default:
        return null;
    }
  };

  return (
    <AppShell breadcrumbs={[{ label: "Source Library" }]}>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--cg-line)]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--cg-ink)]">Source Library & Canonical Records</h1>
            <p className="text-xs text-[var(--cg-ink-secondary)] mt-0.5">
              Canonical publisher registries, DOI fingerprints, and cited draft occurrences.
            </p>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white border border-[var(--cg-line)] rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cg-ink-secondary)]" />
            <input
              type="text"
              placeholder="Search title, DOI, author, citation key..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[var(--cg-line)] rounded-md text-[var(--cg-ink)] placeholder-[var(--cg-ink-muted)] focus:outline-none focus:border-[var(--cg-accent)]" />
            
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--cg-ink-secondary)] font-medium">Provenance:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-[var(--cg-line)] rounded px-2.5 py-1 text-xs text-[var(--cg-ink)] focus:outline-none focus:border-[var(--cg-accent)]">
                
                <option value="all">All Provenance Types</option>
                <option value="crossref_verified">Crossref Verified</option>
                <option value="unresolved_candidate">Unresolved Candidates</option>
                <option value="sample_fixture">Sample Fixtures</option>
              </select>
            </div>
          </div>
        </div>

        {/* Canonical Sources Table */}
        <div className="bg-white border border-[var(--cg-line)] rounded-lg shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--cg-surface-subtle)] border-b border-[var(--cg-line)] text-[var(--cg-ink-secondary)] font-mono uppercase text-[11px]">
                  <th className="py-2.5 px-4 font-semibold">Canonical Title & Authors</th>
                  <th className="py-2.5 px-4 font-semibold">Canonical Identifier / DOI</th>
                  <th className="py-2.5 px-4 font-semibold">Registry Provenance</th>
                  <th className="py-2.5 px-4 font-semibold">Cited Occurrences</th>
                  <th className="py-2.5 px-4 font-semibold">Fulltext</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cg-line)]">
                {filtered.map((s) => {
                  const isSelected = selectedSourceId === s.id;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSourceId(s.id)}
                      className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-[var(--cg-accent-subtle)]" : "hover:bg-[var(--cg-surface)]"}`
                      }>
                      
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-semibold text-[var(--cg-ink)] text-xs">{s.canonicalTitle}</div>
                        <div className="text-[11px] text-[var(--cg-ink-secondary)] truncate mt-0.5">
                          {s.canonicalAuthors.join(", ")} ({s.canonicalYear ?? "Unk."})
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[var(--cg-ink)]">
                        {s.canonicalDoi ?
                        <span className="text-[var(--cg-accent)]">{s.canonicalDoi}</span> :

                        <span className="text-[var(--cg-ink-muted)]">No DOI registered</span>
                        }
                      </td>
                      <td className="py-3 px-4">{getProvenanceBadge(s.provenance)}</td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className="font-bold text-[var(--cg-ink)]">{s.occurrences.length}</span>{" "}
                        {s.occurrences.length === 1 ? "occurrence" : "occurrences"}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {s.retrievalStatus === "available" ?
                        <span className="text-[var(--cg-pass)] font-semibold">Open Access PDF</span> :

                        <span className="text-[var(--cg-ink-muted)]">Unavailable</span>
                        }
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          className="text-xs font-semibold text-[var(--cg-accent)] hover:underline">
                          
                          View occurrences →
                        </button>
                      </td>
                    </tr>);

                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Occurrence Detail Drawer for Selected Source */}
        {selectedSource &&
        <div className="bg-white border border-[var(--cg-line)] rounded-lg p-5 shadow-md space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-[var(--cg-line)] pb-3">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--cg-ink-secondary)]">
                  Canonical Source Record
                </span>
                <h3 className="text-base font-bold text-[var(--cg-ink)] mt-0.5">{selectedSource.canonicalTitle}</h3>
              </div>
              <button
              type="button"
              onClick={() => setSelectedSourceId(null)}
              className="text-xs text-[var(--cg-ink-secondary)] hover:text-[var(--cg-ink)] font-mono">
              
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[var(--cg-ink-secondary)] block font-mono text-[11px]">Canonical Authors:</span>
                <span className="font-medium text-[var(--cg-ink)]">{selectedSource.canonicalAuthors.join(", ")}</span>
              </div>
              <div>
                <span className="text-[var(--cg-ink-secondary)] block font-mono text-[11px]">Publication Year:</span>
                <span className="font-mono text-[var(--cg-ink)] font-semibold">{selectedSource.canonicalYear ?? "Unk."}</span>
              </div>
              <div>
                <span className="text-[var(--cg-ink-secondary)] block font-mono text-[11px]">DOI / Registry Link:</span>
                {selectedSource.canonicalDoi ?
              <a
                href={`https://doi.org/${selectedSource.canonicalDoi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[var(--cg-accent)] underline inline-flex items-center gap-1">
                
                    <span>{selectedSource.canonicalDoi}</span>
                    <ExternalLinkIcon size={12} />
                  </a> :

              <span className="text-[var(--cg-ink-secondary)] font-mono">None registered</span>
              }
              </div>
            </div>

            {/* Cited Occurrences & Diffs */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-[var(--cg-ink)] mb-2 font-mono uppercase tracking-wider">
                Draft Occurrences Linked to this Canonical Source ({selectedSource.occurrences.length}):
              </h4>
              <div className="space-y-2">
                {selectedSource.occurrences.map((occ) =>
              <div
                key={occ.occurrenceId}
                className="p-3 bg-[var(--cg-surface)] border border-[var(--cg-line)] rounded-md text-xs space-y-1.5">
                
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[var(--cg-accent)]">@{occ.citationKey}</span>
                        <span className="font-mono text-[11px] text-[var(--cg-ink-secondary)]">
                          Finding {occ.findingId} · Line {occ.line} · Report: {occ.auditId}
                        </span>
                      </div>
                      <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${
                    occ.status === "matched" ?
                    "bg-[var(--cg-pass-subtle)] text-[var(--cg-pass)] border-[var(--cg-pass-line)]" :
                    "bg-[var(--cg-review-subtle)] text-[var(--cg-review)] border-[var(--cg-review-line)]"}`
                    }>
                    
                        {occ.status === "matched" ? "METADATA MATCH" : "METADATA MISMATCH"}
                      </span>
                    </div>

                    {occ.mismatchFields.length > 0 &&
                <div className="p-2 rounded bg-[var(--cg-review-subtle)] border border-[var(--cg-review-line)] text-[11px] text-[var(--cg-review)]">
                        <strong>Discrepancy:</strong> Draft cited year {occ.citedYear} with authors [{occ.citedAuthors.join(", ")}], but canonical Crossref registry resolves to year {selectedSource.canonicalYear}.
                      </div>
                }
                  </div>
              )}
              </div>
            </div>
          </div>
        }
      </div>
    </AppShell>);

}