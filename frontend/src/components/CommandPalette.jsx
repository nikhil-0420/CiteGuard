import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "../router";
import {
  SearchIcon,
  FileTextIcon,
  ListIcon,
  DatabaseIcon,
  BookOpenIcon,
  CheckCircleIcon,
  SettingsIcon,
  PlusIcon,
  ShieldIcon,
  ArrowLeftIcon } from
"./Icons";











const COMMAND_ITEMS = [
// Audits & Runs
{
  id: "run-blocked",
  category: "Audits & Runs",
  title: "Agent Brief v1.4 — ResNet Benchmark & Attention Claims",
  subtitle: "PR #1 · Commit 9f3c2a1 · 2 Blocking findings (Contradiction & Mismatch)",
  href: "/app/audits/blocked",
  badge: "BLOCKED"
},
{
  id: "run-pending",
  category: "Audits & Runs",
  title: "Transformer Attention Verification — Exception Under Review",
  subtitle: "PR #1 · Commit 9f3c2a1 · 1 Reviewer exception awaiting approval",
  href: "/app/audits/pending",
  badge: "REVIEW"
},
{
  id: "run-passed",
  category: "Audits & Runs",
  title: "Attention Is All You Need — Clean Reference Audit",
  subtitle: "PR #1 · Commit 9f3c2a1 · Clean audit with 2 reviewer exceptions accepted",
  href: "/app/audits/passed",
  badge: "PASSED"
},
{
  id: "run-error",
  category: "Audits & Runs",
  title: "Multimodal Agent Draft — Incomplete Extraction",
  subtitle: "PR #1 · Commit 9f3c2a1 · Unparseable citation markup",
  href: "/app/audits/error",
  badge: "ERROR"
},

// Navigation
{
  id: "nav-overview",
  category: "Navigation",
  title: "Workspace Overview",
  subtitle: "Operational dashboard, attention queue, outcome metrics",
  href: "/app"
},
{
  id: "nav-audits",
  category: "Navigation",
  title: "Audit History",
  subtitle: "All evaluated research reports, versioned audits, and PR status",
  href: "/app/audits"
},
{
  id: "nav-reviews",
  category: "Navigation",
  title: "Review Queue",
  subtitle: "Pending findings requiring human reviewer assessment",
  href: "/app/reviews"
},
{
  id: "nav-sources",
  category: "Navigation",
  title: "Source Library",
  subtitle: "Canonical Crossref / arXiv records and cited occurrences",
  href: "/app/sources"
},
{
  id: "nav-policies",
  category: "Navigation",
  title: "Policy Rules",
  subtitle: "Deterministic governance rules and gate transition definitions",
  href: "/app/policies"
},
{
  id: "nav-results",
  category: "Navigation",
  title: "Evaluation Benchmark Results",
  subtitle: "Nuroen benchmark runs, precision, and verification telemetry",
  href: "/app/results"
},
{
  id: "nav-settings",
  category: "Navigation",
  title: "Settings & Integrations",
  subtitle: "GitHub webhooks, HMAC secrets, reviewer allowlist",
  href: "/app/settings"
},
{
  id: "nav-methodology",
  category: "Navigation",
  title: "Verification Methodology",
  subtitle: "Public audit pipeline specification and bounds",
  href: "/methodology"
},

// Sources
{
  id: "src-he2015",
  category: "Sources",
  title: "He et al. (2015) — Deep Residual Learning for Image Recognition",
  subtitle: "DOI: 10.48550/arXiv.1512.03385 · Crossref resolved",
  href: "/app/sources?query=he2015"
},
{
  id: "src-vaswani2017",
  category: "Sources",
  title: "Vaswani et al. (2017) — Attention Is All You Need",
  subtitle: "DOI: 10.48550/arXiv.1706.03762 · Crossref resolved",
  href: "/app/sources?query=vaswani2017"
},
{
  id: "src-devlin2018",
  category: "Sources",
  title: "Devlin et al. (2018) — BERT: Pre-training of Deep Bidirectional Transformers",
  subtitle: "DOI: 10.48550/arXiv.1810.04805 · Crossref resolved",
  href: "/app/sources?query=devlin2018"
},

// Actions
{
  id: "act-new",
  category: "Actions",
  title: "Start a New Research Audit",
  subtitle: "Submit draft markdown or sync a PR commit for policy verification",
  href: "/app/audits/new"
},
{
  id: "act-demo",
  category: "Actions",
  title: "Open Sample Demo Workspace",
  subtitle: "Inspect pre-populated test fixtures and deterministic gates",
  href: "/demo/audits/blocked"
}];







export default function CommandPalette({ isOpen, onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't open if user is currently typing in an input or textarea unless Ctrl+K is pressed
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {

          // Open trigger handled by parent or state
        }}
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = COMMAND_ITEMS.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q));

  });

  // Handle keyboard navigation within the palette
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => prev + 1 < filtered.length ? prev + 1 : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => prev - 1 >= 0 ? prev - 1 : filtered.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[selectedIndex];
      if (item) {
        if (item.action) {
          item.action();
        } else if (item.href) {
          router.navigate(item.href);
        }
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-[var(--cg-surface)]/60 backdrop-blur-sm transition-all"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette">
      
      <div
        className="w-full max-w-2xl bg-white border border-[var(--cg-line)] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}>
        
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[var(--cg-line)] bg-white">
          <SearchIcon size={18} className="text-[var(--cg-ink-secondary)] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-[var(--cg-ink)] text-sm placeholder-[var(--cg-ink-secondary)] focus:outline-none"
            placeholder="Type a report title, repository, source, or command..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }} />
          
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono font-medium text-[var(--cg-ink-secondary)] bg-[var(--cg-surface-subtle)] border border-[var(--cg-line)] rounded shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-[var(--cg-surface-subtle)]">
          {filtered.length === 0 ?
          <div className="py-12 text-center text-sm text-[var(--cg-ink-secondary)]">
              No results found for &ldquo;{query}&rdquo;
            </div> :

          filtered.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                isSelected ? "bg-[var(--cg-accent-subtle)] text-[var(--cg-ink)]" : "hover:bg-[var(--cg-surface-subtle)] text-[var(--cg-ink)]"}`
                }
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => {
                  if (item.action) item.action();else
                  if (item.href) router.navigate(item.href);
                  onClose();
                }}>
                
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--cg-ink-secondary)] font-semibold">
                        {item.category}
                      </span>
                      {item.badge &&
                    <span
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border ${
                      item.badge === "BLOCKED" ?
                      "bg-[var(--cg-block-subtle)] text-[var(--cg-block)] border-[var(--cg-block-line)]" :
                      item.badge === "PASSED" ?
                      "bg-[var(--cg-pass-subtle)] text-[var(--cg-pass)] border-[var(--cg-pass-line)]" :
                      "bg-[var(--cg-review-subtle)] text-[var(--cg-review)] border-[var(--cg-review-line)]"}`
                      }>
                      
                          {item.badge}
                        </span>
                    }
                    </div>
                    <div className="text-sm font-semibold text-[var(--cg-ink)] truncate mt-0.5">
                      {item.title}
                    </div>
                    <div className="text-xs text-[var(--cg-ink-secondary)] truncate mt-0.5">
                      {item.subtitle}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-[var(--cg-ink-secondary)] font-mono">
                    {isSelected ? "↵ to select" : ""}
                  </div>
                </div>);

          })
          }
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-[var(--cg-line)] bg-[var(--cg-surface-subtle)] flex items-center justify-between text-[11px] text-[var(--cg-ink-secondary)]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="font-mono">CiteGuard Technical Console</span>
        </div>
      </div>
    </div>);

}