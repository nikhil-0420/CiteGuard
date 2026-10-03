import React, { useState, useMemo } from "react";
import AppShell from "../components/AppShell";
import {
  SearchIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
} from "../components/Icons";

const CANONICAL_SOURCES = [
  {
    id: "src-vaswani-2017",
    canonicalDoi: "10.48550/arXiv.1706.03762",
    canonicalTitle: "Attention Is All You Need",
    canonicalAuthors: ["Vaswani", "Shazeer", "Parmar", "Uszkoreit", "Jones", "Gomez", "Kaiser", "Polosukhin"],
    canonicalYear: 2017,
    provenance: "crossref_verified",
    retrievalStatus: "available",
    occurrenceCount: 2,
  },
  {
    id: "src-he-2015",
    canonicalDoi: "10.48550/arXiv.1512.03385",
    canonicalTitle: "Deep Residual Learning for Image Recognition",
    canonicalAuthors: ["He", "Zhang", "Ren", "Sun"],
    canonicalYear: 2015,
    provenance: "crossref_verified",
    retrievalStatus: "available",
    occurrenceCount: 1,
  },
  {
    id: "src-devlin-2018",
    canonicalDoi: "10.48550/arXiv.1810.04805",
    canonicalTitle: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
    canonicalAuthors: ["Devlin", "Chang", "Lee", "Toutanova"],
    canonicalYear: 2018,
    provenance: "crossref_verified",
    retrievalStatus: "available",
    occurrenceCount: 2,
  },
  {
    id: "src-lee-2026",
    canonicalDoi: null,
    canonicalTitle: "Agentic Verification Loops for Scientific Writing",
    canonicalAuthors: ["Lee"],
    canonicalYear: 2026,
    provenance: "unresolved_candidate",
    retrievalStatus: "unavailable",
    occurrenceCount: 1,
  },
  {
    id: "src-doe-2024",
    canonicalDoi: "10.0000/planted.2024.notes",
    canonicalTitle: "Notes on Citation Hygiene",
    canonicalAuthors: ["Doe"],
    canonicalYear: 2024,
    provenance: "sample_fixture",
    retrievalStatus: "unavailable",
    occurrenceCount: 1,
  },
];

export default function SourcesPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return CANONICAL_SOURCES;
    const q = search.toLowerCase();
    return CANONICAL_SOURCES.filter((s) => {
      return (
        s.canonicalTitle.toLowerCase().includes(q) ||
        s.canonicalAuthors.some((a) => a.toLowerCase().includes(q)) ||
        s.canonicalDoi?.toLowerCase().includes(q)
      );
    });
  }, [search]);

  const getProvenanceStyle = (prov) => {
    switch (prov) {
      case "crossref_verified":
        return { label: "Verified", color: "text-[#166534]", bg: "bg-[#F4FAED]", border: "border-[#18280E]/20", icon: CheckCircleIcon };
      case "unresolved_candidate":
        return { label: "Unresolved", color: "text-[#B45309]", bg: "bg-[#FFFBEB]", border: "border-[#FDE68A]", icon: AlertTriangleIcon };
      default:
        return { label: "Fixture", color: "text-[#5C6854]", bg: "bg-[#F4FAED]", border: "border-[#18280E]/10", icon: AlertTriangleIcon };
    }
  };

  return (
    <AppShell breadcrumbs={[{ label: "Source Library" }]}>
      <div className="flex-1 flex flex-col min-h-[calc(100vh-56px)]">
        {/* Header */}
        <div className="px-6 md:px-8 pt-8 pb-6">
          <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#090F05]">
              Source Library
            </h1>
            <p className="text-sm text-[#5C6854] mt-1.5">
              Canonical references verified against publisher registries.
            </p>

            {/* Search */}
            <div className="w-full max-w-lg mt-5 relative">
              <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9684]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, author, or DOI..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border-2 border-[#18280E]/12 text-sm text-[#090F05] placeholder-[#8A9684] outline-none focus:border-[#18280E] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Source Cards */}
        <div className="flex-1 px-6 md:px-8 pb-8">
          <div className="max-w-3xl mx-auto space-y-3">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#8A9684]">
                No sources matching "{search}"
              </div>
            ) : (
              filtered.map((s) => {
                const prov = getProvenanceStyle(s.provenance);
                const ProvIcon = prov.icon;
                return (
                  <div
                    key={s.id}
                    className="p-5 rounded-xl bg-white border border-[#18280E]/10 hover:border-[#18280E]/25 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[#090F05]">
                          {s.canonicalTitle}
                        </div>
                        <div className="text-xs text-[#5C6854] mt-1">
                          {s.canonicalAuthors.join(", ")} · {s.canonicalYear}
                        </div>
                        <div className="flex items-center gap-3 mt-2.5 text-xs">
                          {s.canonicalDoi ? (
                            <a
                              href={`https://doi.org/${s.canonicalDoi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#18280E] font-mono hover:underline"
                            >
                              <span>{s.canonicalDoi}</span>
                              <ExternalLinkIcon size={11} />
                            </a>
                          ) : (
                            <span className="text-[#8A9684] font-mono">No DOI</span>
                          )}
                          <span className="w-1 h-1 rounded-full bg-[#18280E]/15" />
                          <span className="text-[#8A9684]">
                            {s.occurrenceCount} citation{s.occurrenceCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${prov.bg} ${prov.color} border ${prov.border} shrink-0`}>
                        <ProvIcon size={12} />
                        {prov.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}