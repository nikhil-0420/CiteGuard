import React, { useState } from "react";
import AppShell from "../components/AppShell";
import { getCurrentUser } from "../auth";
import { resetDemoAudits } from "../api";
import {
  GithubIcon,
  CheckCircleIcon,
} from "../components/Icons";

export default function SettingsPage() {
  const [user] = useState(getCurrentUser);
  const [resetMessage, setResetMessage] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const handleResetData = () => {
    resetDemoAudits();
    setResetMessage(true);
    setTimeout(() => setResetMessage(false), 3000);
  };

  return (
    <AppShell breadcrumbs={[{ label: "Settings" }]}>
      <div className="flex-1 flex flex-col min-h-[calc(100vh-56px)]">
        {/* Header */}
        <div className="px-6 md:px-8 pt-8 pb-6">
          <div className="max-w-2xl mx-auto flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#090F05]">
              Settings
            </h1>
            <p className="text-sm text-[#5C6854] mt-1.5">
              Workspace configuration and integrations.
            </p>
          </div>
        </div>

        {/* Settings Cards */}
        <div className="flex-1 px-6 md:px-8 pb-8">
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Reset Banner */}
            {resetMessage && (
              <div className="p-4 rounded-xl bg-[#F4FAED] border border-[#18280E]/20 text-sm text-[#166534] flex items-center gap-2 animate-fade-in">
                <CheckCircleIcon size={16} />
                <span>Demo data reset to original fixtures.</span>
              </div>
            )}

            {/* Reviewer Identity */}
            <div className="p-5 rounded-xl bg-white border border-[#18280E]/10">
              <h2 className="text-sm font-semibold text-[#090F05] mb-4">Reviewer Identity</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] text-[#8A9684] font-mono mb-1">NAME</div>
                  <div className="text-sm font-medium text-[#090F05]">{user ? user.name : "Guest"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#8A9684] font-mono mb-1">HANDLE</div>
                  <div className="text-sm font-mono text-[#18280E]">{user ? `@${user.handle}` : "—"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#8A9684] font-mono mb-1">ROLE</div>
                  <div className="text-sm text-[#090F05] capitalize">{user ? user.role : "Read-only"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#8A9684] font-mono mb-1">STATUS</div>
                  <div className={`text-sm font-medium ${user?.isAllowlisted ? "text-[#166534]" : "text-[#991B1B]"}`}>
                    {user?.isAllowlisted ? "Authorized" : "Unauthorized"}
                  </div>
                </div>
              </div>
            </div>

            {/* GitHub Integration */}
            <div className="p-5 rounded-xl bg-white border border-[#18280E]/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <GithubIcon size={18} />
                  <h2 className="text-sm font-semibold text-[#090F05]">GitHub Integration</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                    isConnected
                      ? "bg-[#F4FAED] text-[#166534] border-[#18280E]/20"
                      : "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[#166534]" : "bg-[#991B1B]"}`} />
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsConnected((c) => !c)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[#18280E]/10 text-[#5C6854] hover:text-[#090F05] hover:border-[#18280E]/25 transition-colors"
                  >
                    {isConnected ? "Disconnect" : "Reconnect"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] text-[#8A9684] font-mono mb-1">REPOSITORIES</div>
                  <div className="text-xs text-[#090F05] font-mono">nikhil-0420/citeguard-demo</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#8A9684] font-mono mb-1">STATUS CONTEXT</div>
                  <div className="text-xs text-[#090F05] font-mono">CiteGuard / citation-audit</div>
                </div>
              </div>
            </div>

            {/* Demo Data */}
            <div className="p-5 rounded-xl bg-white border border-[#18280E]/10">
              <h2 className="text-sm font-semibold text-[#090F05] mb-2">Demo Data</h2>
              <p className="text-xs text-[#5C6854] mb-4">
                Reset local storage to restore original sample fixtures.
              </p>
              <button
                type="button"
                onClick={handleResetData}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-[#FECACA] text-[#991B1B] hover:bg-[#FEF2F2] transition-colors"
              >
                Reset demo data
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}