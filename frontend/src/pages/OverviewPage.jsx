import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useRouter } from "../router";
import AppShell from "../components/AppShell";
import { listReports } from "../api";
import { formatDateTime } from "../utils/date";
import {
  SearchIcon,
  FileTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  AlertOctagonIcon,
  PlusIcon,
  ExternalLinkIcon,
  ShieldIcon,
  DatabaseIcon,
  BookOpenIcon,
  SettingsIcon,
  ListIcon,
} from "../components/Icons";

// Static corpus of findings, sources, policies, and actions searchable in CiteGuard
const CORE_SEARCH_ITEMS = [
  // ── Findings & Claims ──
  {
    id: "finding-f001",
    category: "Findings",
    title: "F-001: Attention Is All You Need Claim",
    subtitle: "The Transformer architecture relies solely on attention mechanisms [@vaswani2017]",
    meta: "Line 12 · [@vaswani2017] · Vaswani et al. (2017)",
    href: "/app/audits/blocked?finding=F-001",
    badge: "PASSED",
    badgeType: "pass",
    keywords: "transformer attention vaswani 2017 passed f001",
  },
  {
    id: "finding-f002",
    category: "Findings",
    title: "F-002: Attention Steps Reference Identity Mismatch",
    subtitle: "Attention mechanisms reduce training steps significantly [@vaswani2018]",
    meta: "Line 18 · Identity Mismatch (2018 cited vs 2017 canonical) · Rule CG-EXIST-01",
    href: "/app/audits/blocked?finding=F-002",
    badge: "BLOCKED",
    badgeType: "block",
    keywords: "identity mismatch vaswani 2018 cg-exist-01 blocked f002",
  },
  {
    id: "finding-f003",
    category: "Findings",
    title: "F-003: ResNet Error Rate Numerical Contradiction",
    subtitle: "Our ResNet baseline achieves top-5 error rate of < 2% on ImageNet [@he2016]",
    meta: "Line 24 · Contradiction: Claimed <2% vs Source 3.57% · Rule CG-NUM-01",
    href: "/app/audits/blocked?finding=F-003",
    badge: "BLOCKED",
    badgeType: "block",
    keywords: "resnet baseline error rate imagenet contradiction 3.57 2 he2016 cg-num-01 f003",
  },
  {
    id: "finding-f004",
    category: "Findings",
    title: "F-004: BERT Universal Scope Discrepancy",
    subtitle: "BERT outperforms previous methods on all GLUE tasks [@devlin2019]",
    meta: "Line 31 · Scope Discrepancy: Claimed 'all' vs Source 'eleven' · Rule CG-SCOPE-01",
    href: "/app/audits/pending?finding=F-004",
    badge: "REVIEW",
    badgeType: "review",
    keywords: "bert glue tasks scope discrepancy all eleven devlin2019 cg-scope-01 f004",
  },
  {
    id: "finding-f005",
    category: "Findings",
    title: "F-005: Chain-of-Thought Recent Preprint Grace",
    subtitle: "Recent preprints on chain-of-thought prompt verification [@wei2024]",
    meta: "Line 42 · Unindexed recent preprint · Rule CG-EXIST-02",
    href: "/app/audits/pending?finding=F-005",
    badge: "REVIEW",
    badgeType: "review",
    keywords: "chain of thought wei 2024 unindexed preprint cg-exist-02 f005",
  },

  // ── Canonical Sources ──
  {
    id: "src-vaswani",
    category: "Sources",
    title: "Vaswani et al. (2017) — Attention Is All You Need",
    subtitle: "DOI: 10.48550/arXiv.1706.03762 · Crossref & arXiv resolved",
    meta: "3 audited occurrences in repository",
    href: "/app/sources?query=vaswani2017",
    badge: "RESOLVED",
    badgeType: "pass",
    keywords: "vaswani attention transformer 1706.03762 arxiv crossref",
  },
  {
    id: "src-he",
    category: "Sources",
    title: "He et al. (2015) — Deep Residual Learning for Image Recognition",
    subtitle: "DOI: 10.48550/arXiv.1512.03385 · Crossref & arXiv resolved",
    meta: "2 audited occurrences in repository",
    href: "/app/sources?query=he2015",
    badge: "RESOLVED",
    badgeType: "pass",
    keywords: "he resnet residual 1512.03385 imagenet crossref",
  },
  {
    id: "src-devlin",
    category: "Sources",
    title: "Devlin et al. (2018) — BERT: Pre-training of Deep Bidirectional Transformers",
    subtitle: "DOI: 10.48550/arXiv.1810.04805 · Crossref & arXiv resolved",
    meta: "1 audited occurrence in repository",
    href: "/app/sources?query=devlin2018",
    badge: "RESOLVED",
    badgeType: "pass",
    keywords: "devlin bert transformers 1810.04805 crossref",
  },
  {
    id: "src-crossref",
    category: "Sources",
    title: "Crossref Metadata Registry",
    subtitle: "Primary authority for DOI registration and author/year verification (150M+ records)",
    meta: "Authority: api.crossref.org",
    href: "/app/sources",
    badge: "REGISTRY",
    badgeType: "neutral",
    keywords: "crossref registry doi authority",
  },
  {
    id: "src-arxiv",
    category: "Sources",
    title: "arXiv Scholarly Repository",
    subtitle: "Open-access archive for physics, mathematics, and CS preprints (2.4M+ papers)",
    meta: "Authority: export.arxiv.org/api",
    href: "/app/sources",
    badge: "REGISTRY",
    badgeType: "neutral",
    keywords: "arxiv registry open access preprints",
  },

  // ── Policy Rules ──
  {
    id: "pol-exist-01",
    category: "Policies",
    title: "CG-EXIST-01: Reference Existence & Identity Resolution",
    subtitle: "Blocks merge gates if cited works cannot be located or fail author/year matching.",
    meta: "Severity: BLOCK · Automated Enforcer",
    href: "/app/policies",
    badge: "RULE",
    badgeType: "block",
    keywords: "cg-exist-01 existence identity resolution author year block",
  },
  {
    id: "pol-num-01",
    category: "Policies",
    title: "CG-NUM-01: Quantitative & Numerical Discrepancy Rule",
    subtitle: "Blocks merge gates when claims contradict numeric evidence in canonical source text.",
    meta: "Severity: BLOCK · Precision Auditor",
    href: "/app/policies",
    badge: "RULE",
    badgeType: "block",
    keywords: "cg-num-01 numerical contradiction percentage metrics block",
  },
  {
    id: "pol-scope-01",
    category: "Policies",
    title: "CG-SCOPE-01: Scope Generalization Bounds",
    subtitle: "Flags universal claims ('all tasks', 'universally') when source evidence reports limited subsets.",
    meta: "Severity: REVIEW · Human Sign-off Required",
    href: "/app/policies",
    badge: "RULE",
    badgeType: "review",
    keywords: "cg-scope-01 scope generalization universal all review",
  },
  {
    id: "pol-human-01",
    category: "Policies",
    title: "CG-HUMAN-01: Authorized Reviewer Exception Protocol",
    subtitle: "Allows allowlisted domain reviewers to accept documented risk with audit trail rationale.",
    meta: "Severity: EXCEPTION · Security Controlled",
    href: "/app/policies",
    badge: "RULE",
    badgeType: "neutral",
    keywords: "cg-human-01 reviewer exception allowlist rationale",
  },
  {
    id: "pol-trust-01",
    category: "Policies",
    title: "CG-TRUST-01: Prompt Injection Neutralization",
    subtitle: "Guarantees retrieved source text is treated purely as passive data payloads.",
    meta: "Severity: DEFENSE · Active Protection",
    href: "/app/policies",
    badge: "RULE",
    badgeType: "pass",
    keywords: "cg-trust-01 prompt injection neutralization security",
  },

  // ── Navigation & Actions ──
  {
    id: "act-new",
    category: "Actions",
    title: "Start a New Research Audit",
    subtitle: "Submit a Markdown research draft or sync a PR commit for deterministic verification.",
    meta: "/app/audits/new",
    href: "/app/audits/new",
    badge: "ACTION",
    badgeType: "pass",
    keywords: "new audit start create submit brief pr commit",
  },
  {
    id: "act-reviews",
    category: "Actions",
    title: "Open Review Queue",
    subtitle: "Review actionable findings awaiting human domain expert assessment.",
    meta: "/app/reviews · 2 pending items",
    href: "/app/reviews",
    badge: "QUEUE",
    badgeType: "review",
    keywords: "review queue pending exceptions sign-off",
  },
  {
    id: "act-sources",
    category: "Actions",
    title: "Browse Source Library",
    subtitle: "Explore registered canonical sources, DOIs, and citation occurrences.",
    meta: "/app/sources",
    href: "/app/sources",
    badge: "EXPLORE",
    badgeType: "neutral",
    keywords: "source library browse registry papers",
  },
  {
    id: "act-eval",
    category: "Actions",
    title: "Evaluation Benchmark Telemetry",
    subtitle: "Nuroen benchmark accuracy, recall, and verification latency stats.",
    meta: "/app/results",
    href: "/app/results",
    badge: "METRICS",
    badgeType: "neutral",
    keywords: "evaluation results benchmarks telemetry accuracy",
  },
  {
    id: "act-settings",
    category: "Actions",
    title: "Settings & HMAC Secrets",
    subtitle: "Manage GitHub webhook webhooks, HMAC signing secrets, and reviewer allowlists.",
    meta: "/app/settings",
    href: "/app/settings",
    badge: "CONFIG",
    badgeType: "neutral",
    keywords: "settings hmac webhooks allowlist config",
  },
  {
    id: "act-methodology",
    category: "Actions",
    title: "Inspection Methodology Specification",
    subtitle: "Read the public 5-stage verification pipeline and deterministic policy bounds.",
    meta: "/methodology",
    href: "/methodology",
    badge: "DOCS",
    badgeType: "neutral",
    keywords: "methodology documentation specification bounds pipeline",
  },
];

export default function OverviewPage() {
  const router = useRouter();
  const searchInputRef = useRef(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'audits' | 'findings' | 'sources' | 'policies'
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    listReports()
      .then((raw) => {
        setReports(raw);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  // Global Ctrl+K / Cmd+K focuses the main centric search bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsFocused(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Map reports into searchable audit items
  const auditSearchItems = useMemo(() => {
    return reports.map((r) => {
      const gateState = r.gate_state || "failure";
      let badge = "BLOCKED";
      let badgeType = "block";
      if (gateState === "success") {
        badge = "PASSED";
        badgeType = "pass";
      } else if (gateState === "pending") {
        badge = "REVIEW";
        badgeType = "review";
      } else if (gateState === "error") {
        badge = "ERROR";
        badgeType = "block";
      }

      return {
        id: `audit-${r.report_id}`,
        category: "Audits",
        title: `Audit: ${r.report_id}`,
        subtitle: `${r.repo} · PR #${r.pr_number || 1} · SHA ${r.commit_sha?.slice(0, 7) || "latest"}`,
        meta: r.generated_at ? formatDateTime(r.generated_at, true) : "Recent Run",
        href: `/app/audits/${r.report_id}`,
        badge,
        badgeType,
        keywords: `${r.report_id} ${r.repo} ${r.commit_sha} ${gateState} audit`,
      };
    });
  }, [reports]);

  // Combined master search items
  const allItems = useMemo(() => {
    return [...auditSearchItems, ...CORE_SEARCH_ITEMS];
  }, [auditSearchItems]);

  // Filtered results based on search query and category tab
  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allItems.filter((item) => {
      // Category tab filtering
      if (activeTab === "audits" && item.category !== "Audits") return false;
      if (activeTab === "findings" && item.category !== "Findings") return false;
      if (activeTab === "sources" && item.category !== "Sources") return false;
      if (activeTab === "policies" && item.category !== "Policies") return false;
      if (activeTab === "actions" && item.category !== "Actions") return false;

      // Text query filtering
      if (!q) return true;

      const haystack = `${item.title} ${item.subtitle} ${item.meta} ${item.category} ${item.keywords || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [allItems, searchQuery, activeTab]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  // Keyboard navigation within search dropdown
  const handleKeyDown = (e) => {
    if (!isFocused && !searchQuery) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === "Enter" && filteredResults[selectedIndex]) {
      e.preventDefault();
      router.navigate(filteredResults[selectedIndex].href);
      setIsFocused(false);
    } else if (e.key === "Escape") {
      setIsFocused(false);
      searchInputRef.current?.blur();
    }
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case "pass":
        return "bg-[#F4FAED] text-[#166534] border-[#18280E]/15";
      case "block":
        return "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]";
      case "review":
        return "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
      default:
        return "bg-[#F4FAED] text-[#5C6854] border-[#18280E]/10";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Audits":
        return <FileTextIcon size={14} className="text-[#18280E]" />;
      case "Findings":
        return <ShieldIcon size={14} className="text-[#B45309]" />;
      case "Sources":
        return <DatabaseIcon size={14} className="text-[#5C6854]" />;
      case "Policies":
        return <BookOpenIcon size={14} className="text-[#166534]" />;
      case "Actions":
      default:
        return <PlusIcon size={14} className="text-[#18280E]" />;
    }
  };

  // Quick action shortcut pills shown below the search bar
  const quickActions = [
    { label: "New Audit", href: "/app/audits/new", icon: PlusIcon },
    { label: "All Audits", href: "/app/audits", icon: FileTextIcon },
    { label: "Review Queue", href: "/app/reviews", icon: AlertTriangleIcon },
    { label: "Source Library", href: "/app/sources", icon: ExternalLinkIcon },
  ];

  const showDropdown = isFocused || searchQuery.trim().length > 0;

  return (
    <AppShell breadcrumbs={[{ label: "Overview" }]}>
      <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4 py-8 relative">
        {/* ── Brand Mark & Centric Greeting ── */}
        <div className="flex flex-col items-center mb-7 animate-fade-in text-center">
          <div className="w-13 h-13 rounded-2xl bg-[#18280E] flex items-center justify-center mb-4 shadow-sm">
            <ShieldIcon size={26} className="text-[#B2EB76]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-[#090F05]">
            What would you like to audit?
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6854] mt-2 font-mono max-w-md">
            The main deterministic search: inspect audits, claims, sources, and policies.
          </p>
        </div>

        {/* ── Main Centric Search Bar ── */}
        <div className="w-full max-w-2xl relative z-40 animate-slide-up" style={{ animationDelay: "60ms" }}>
          <div
            className={`relative flex items-center rounded-2xl border-2 transition-all duration-200 bg-white ${
              isFocused
                ? "border-[#18280E] shadow-[0_4px_24px_rgba(24,40,14,0.12)]"
                : "border-[#18280E]/15 shadow-sm hover:border-[#18280E]/30"
            }`}
          >
            <SearchIcon
              size={20}
              className={`absolute left-5 transition-colors ${
                isFocused ? "text-[#18280E]" : "text-[#8A9684]"
              }`}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search all audits, findings, sources, policies..."
              className="w-full pl-14 pr-24 py-4 text-base bg-transparent outline-none text-[#090F05] placeholder-[#8A9684] font-medium"
              autoComplete="off"
              spellCheck="false"
            />
            <div className="absolute right-3.5 flex items-center gap-2">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-md text-[#8A9684] hover:text-[#090F05] hover:bg-[#F4FAED] transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <span className="text-xs font-mono font-bold">✕</span>
                </button>
              ) : null}
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-medium rounded-lg bg-[#F4FAED] border border-[#18280E]/12 text-[#5C6854]">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* ── Comprehensive Search List Dropdown ── */}
          {showDropdown && (
            <>
              {/* Invisible backdrop to dismiss when clicking outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsFocused(false)}
              />

              <div className="absolute top-full left-0 right-0 mt-2.5 rounded-2xl bg-white border border-[#18280E]/15 shadow-2xl overflow-hidden z-50 animate-scale-in">
                {/* Category Filter Tabs */}
                <div className="px-4 py-2.5 bg-[#FAFBF9] border-b border-[#18280E]/10 flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
                  {[
                    { id: "all", label: "All Items" },
                    { id: "audits", label: "Audits" },
                    { id: "findings", label: "Findings" },
                    { id: "sources", label: "Sources" },
                    { id: "policies", label: "Policies" },
                    { id: "actions", label: "Actions" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        activeTab === tab.id
                          ? "bg-[#18280E] text-[#B2EB76] font-semibold"
                          : "text-[#5C6854] hover:text-[#090F05] hover:bg-[#F4FAED]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                  <div className="ml-auto text-[10px] text-[#8A9684] shrink-0 hidden sm:block">
                    {filteredResults.length} item{filteredResults.length !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Results List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-[#18280E]/6 p-1">
                  {filteredResults.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-xs text-[#5C6854] font-mono">
                        No matches found for "{searchQuery}"
                      </p>
                      <Link
                        href="/app/audits/new"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-mono font-medium text-[#18280E] hover:underline"
                        onClick={() => setIsFocused(false)}
                      >
                        <PlusIcon size={12} />
                        <span>Start a new audit instead →</span>
                      </Link>
                    </div>
                  ) : (
                    filteredResults.map((item, idx) => {
                      const isSelected = idx === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          onClick={() => {
                            router.navigate(item.href);
                            setIsFocused(false);
                          }}
                          className={`flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-[#F4FAED] text-[#090F05]"
                              : "hover:bg-[#F8FAF6] text-[#090F05]"
                          }`}
                        >
                          <div className="mt-0.5 w-6 h-6 rounded-lg bg-[#FAFBF9] border border-[#18280E]/10 flex items-center justify-center shrink-0">
                            {getCategoryIcon(item.category)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#090F05] truncate">
                                {item.title}
                              </span>
                              <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded bg-white text-[#5C6854] border border-[#18280E]/10 shrink-0">
                                {item.category}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#5C6854] truncate mt-0.5">
                              {item.subtitle}
                            </div>
                            {item.meta && (
                              <div className="text-[10px] font-mono text-[#8A9684] truncate mt-0.5">
                                {item.meta}
                              </div>
                            )}
                          </div>

                          {item.badge && (
                            <span
                              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${getBadgeStyle(
                                item.badgeType
                              )}`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer hint */}
                <div className="px-4 py-2 bg-[#FAFBF9] border-t border-[#18280E]/10 flex items-center justify-between text-[10px] font-mono text-[#8A9684]">
                  <span>Navigate with ↑ / ↓ and Enter</span>
                  <span>ESC to close</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Quick Action Shortcuts ── */}
        <div
          className="flex flex-wrap items-center justify-center gap-2.5 mt-8 animate-slide-up"
          style={{ animationDelay: "120ms" }}
        >
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-[#F4FAED] border border-[#18280E]/10 text-[#090F05] hover:border-[#18280E]/25 hover:bg-[#E8F2DF] transition-all cursor-pointer"
              >
                <Icon size={13} className="text-[#5C6854]" />
                <span>{action.label}</span>
              </Link>
            );
          })}
        </div>

        {/* ── Summary Stats Strip ── */}
        {!isLoading && reports.length > 0 && (
          <div
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-9 text-[11px] font-mono text-[#8A9684] animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            <span>{reports.length} total audits</span>
            <span className="w-px h-3 bg-[#18280E]/10 hidden sm:block" />
            <span className="text-[#991B1B]">
              {reports.filter((r) => r.gate_state === "failure").length} blocked
            </span>
            <span className="w-px h-3 bg-[#18280E]/10 hidden sm:block" />
            <span className="text-[#B45309]">
              {reports.filter((r) => r.gate_state === "pending").length} in review
            </span>
            <span className="w-px h-3 bg-[#18280E]/10 hidden sm:block" />
            <span className="text-[#166534]">
              {reports.filter((r) => r.gate_state === "success").length} passed
            </span>
          </div>
        )}
      </div>
    </AppShell>
  );
}