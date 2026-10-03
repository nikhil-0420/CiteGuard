import React, { useState } from "react";
import AppShell from "../components/AppShell";
import { getCurrentUser } from "../auth";
import { resetDemoAudits } from "../api";
import {
  SettingsIcon,
  GithubIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
  ChevronDownIcon } from
"../components/Icons";

export default function SettingsPage() {
  const [user] = useState(getCurrentUser);
  const [resetMessage, setResetMessage] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const handleResetData = () => {
    resetDemoAudits();
    setResetMessage(true);
    setTimeout(() => setResetMessage(false), 3000);
  };

  return (
    <AppShell breadcrumbs={[{ label: "Settings" }]}>
      <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
        <div className="pb-2 border-b border-[var(--cg-line)]">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--cg-ink)]">Workspace Settings & Integrations</h1>
          <p className="text-xs text-[var(--cg-ink-secondary)] mt-0.5">
            Reviewer authorization, repository CI/CD webhooks, and local demo data management.
          </p>
        </div>

        {resetMessage &&
        <div className="p-3.5 bg-[var(--cg-pass-subtle)] border border-[var(--cg-pass-line)] rounded-md text-xs text-[var(--cg-pass)] flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircleIcon size={16} />
            <span>Local demo audit state successfully reset to original fixtures.</span>
          </div>
        }

        {/* 1. Reviewer Identity Panel */}
        <div className="bg-white border border-[var(--cg-line)] rounded-lg p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[var(--cg-ink)]">Current Reviewer Identity</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="block text-[11px] font-mono text-[var(--cg-ink-secondary)]">FULL NAME</span>
              <span className="font-semibold text-[var(--cg-ink)] text-sm">{user ? user.name : "Guest Evaluator"}</span>
            </div>

            <div>
              <span className="block text-[11px] font-mono text-[var(--cg-ink-secondary)]">GITHUB LOGIN HANDLE</span>
              <span className="font-mono text-[var(--cg-accent)] font-semibold">{user ? `@${user.handle}` : "Not signed in"}</span>
            </div>

            <div>
              <span className="block text-[11px] font-mono text-[var(--cg-ink-secondary)]">ROLE DISPOSITION</span>
              <span className="font-medium text-[var(--cg-ink)] capitalize">{user ? user.role : "Read-only"}</span>
            </div>

            <div>
              <span className="block text-[11px] font-mono text-[var(--cg-ink-secondary)]">GOVERNANCE ALLOWLIST STATUS</span>
              <span className={`font-semibold ${user?.isAllowlisted ? "text-[var(--cg-pass)]" : "text-[var(--cg-block)]"}`}>
                {user?.isAllowlisted ? "Authorized Approver (sam, nikhil-0420, nehaa)" : "Unauthorized (Read-only observer)"}
              </span>
            </div>
          </div>
        </div>

        {/* 2. GitHub CI/CD Integration Panel */}
        <div className="bg-white border border-[var(--cg-line)] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--cg-line)] pb-3">
            <div className="flex items-center gap-2.5">
              <GithubIcon size={20} />
              <div>
                <h2 className="text-sm font-bold text-[var(--cg-ink)]">GitHub Repository Integration</h2>
                <span className="text-[11px] text-[var(--cg-ink-secondary)]">Webhook status check synchronization</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border ${
                isConnected ?
                "bg-[var(--cg-pass-subtle)] text-[var(--cg-pass)] border-[var(--cg-pass-line)]" :
                "bg-[var(--cg-block-subtle)] text-[var(--cg-block)] border-[var(--cg-block-line)]"}`
                }>
                
                <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-[var(--cg-pass)]" : "bg-[var(--cg-block)]"}`} />
                <span>{isConnected ? "Connected & Synchronized" : "Disconnected"}</span>
              </span>

              <button
                type="button"
                onClick={() => setIsConnected((c) => !c)}
                className="px-2.5 py-1 rounded text-xs font-medium border border-[var(--cg-line)] hover:bg-[var(--cg-surface)] text-[var(--cg-ink-secondary)] hover:text-[var(--cg-ink)] transition-colors">
                
                {isConnected ? "Disconnect" : "Reconnect"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-[var(--cg-surface)] border border-[var(--cg-line)] rounded-md space-y-1">
              <span className="text-[11px] font-mono text-[var(--cg-ink-secondary)]">AUTHORIZED REPOSITORIES</span>
              <div className="font-semibold text-[var(--cg-ink)]">
                nikhil-0420/agent-briefs, nikhil-0420/citeguard-demo
              </div>
            </div>

            <div className="p-3 bg-[var(--cg-surface)] border border-[var(--cg-line)] rounded-md space-y-1">
              <span className="text-[11px] font-mono text-[var(--cg-ink-secondary)]">LAST WEBHOOK DELIVERY</span>
              <div className="font-semibold text-[var(--cg-ink)]">
                2026-10-03 12:30:00 IST (HTTP 202 Accepted)
              </div>
            </div>

            <div className="p-3 bg-[var(--cg-surface)] border border-[var(--cg-line)] rounded-md space-y-1">
              <span className="text-[11px] font-mono text-[var(--cg-ink-secondary)]">BRANCH PROTECTION ENFORCEMENT</span>
              <div className="font-semibold text-[var(--cg-review)]">
                Unknown (Requires repo:admin OAuth scope to query branch rules)
              </div>
            </div>

            <div className="p-3 bg-[var(--cg-surface)] border border-[var(--cg-line)] rounded-md space-y-1">
              <span className="text-[11px] font-mono text-[var(--cg-ink-secondary)]">COMMIT STATUS CONTEXT</span>
              <div className="font-mono text-[var(--cg-ink)]">
                CiteGuard / citation-audit
              </div>
            </div>
          </div>

          {/* Collapsible Advanced Technical Endpoints & HMAC */}
          <div className="pt-2 border-t border-[var(--cg-line)]">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="w-full flex items-center justify-between text-left text-xs font-semibold text-[var(--cg-ink-secondary)] hover:text-[var(--cg-ink)] transition-colors">
              
              <span>Advanced Webhook & HMAC Specifications</span>
              <ChevronDownIcon
                size={14}
                className={`transition-transform duration-200 ${showAdvanced ? "rotate-180" : ""}`} />
              
            </button>

            {showAdvanced &&
            <div className="pt-3 space-y-2 text-xs font-mono animate-in fade-in duration-150">
                <div className="p-2.5 bg-[var(--cg-surface-subtle)] border border-[var(--cg-line)] rounded text-[11px]">
                  <span className="text-[var(--cg-ink-secondary)] block">Inbound Webhook:</span>
                  <span className="text-[var(--cg-ink)] font-bold">POST /webhooks/github</span>
                </div>
                <div className="p-2.5 bg-[var(--cg-surface-subtle)] border border-[var(--cg-line)] rounded text-[11px]">
                  <span className="text-[var(--cg-ink-secondary)] block">Signature Header:</span>
                  <span className="text-[var(--cg-ink)] font-bold">X-Hub-Signature-256 = sha256(body, GITHUB_WEBHOOK_SECRET)</span>
                </div>
                <div className="p-2.5 bg-[var(--cg-surface-subtle)] border border-[var(--cg-line)] rounded text-[11px]">
                  <span className="text-[var(--cg-ink-secondary)] block">Outbound Notification Webhook:</span>
                  <span className="text-[var(--cg-ink)] font-bold">POST N8N_WEBHOOK_URL with X-CiteGuard-Signature</span>
                </div>
              </div>
            }
          </div>
        </div>

        {/* 3. Demo Data Management */}
        <div className="bg-white border border-[var(--cg-line)] rounded-lg p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-[var(--cg-ink)]">Local Demo & Evaluation State</h2>
          <p className="text-xs text-[var(--cg-ink-secondary)]">
            If you have submitted test audits or accepted sample exceptions in this browser session, you can reset local storage to restore original fixtures.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetData}
              className="px-3.5 py-2 rounded bg-white hover:bg-[var(--cg-block-subtle)] text-[var(--cg-block)] border border-[var(--cg-block-line)] text-xs font-semibold transition-colors">
              
              Reset local demo audits to default
            </button>
          </div>
        </div>
      </div>
    </AppShell>);

}