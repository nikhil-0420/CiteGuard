import React, { useState, useEffect } from "react";
import { Link, useRouter } from "../router";
import { getCurrentUser, setCurrentUser, DEMO_USERS } from "../auth";
import { isMock } from "../api";
import CommandPalette from "./CommandPalette";
import {
  FileTextIcon,
  ListIcon,
  DatabaseIcon,
  BookOpenIcon,
  SettingsIcon,
  PlusIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  SearchIcon,
  ShieldIcon,
  ArrowLeftIcon } from
"./Icons";







export default function AppShell({ children, breadcrumbs = [], isSampleMode = false }) {
  const router = useRouter();
  const [user, setUser] = useState(getCurrentUser);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("cmd") === "1";
    }
    return false;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("citeguard-sidebar-collapsed") === "true";
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("citeguard-sidebar-collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    const onAuthChange = () => {
      setUser(getCurrentUser());
    };
    window.addEventListener("citeguard_auth_change", onAuthChange);
    return () => window.removeEventListener("citeguard_auth_change", onAuthChange);
  }, []);

  // Listen for Ctrl+K / Cmd+K to open Command Palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSwitchUser = (userKey) => {
    const nextUser = DEMO_USERS[userKey];
    if (nextUser) {
      setCurrentUser(nextUser);
      setUser(nextUser);
      setUserMenuOpen(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUser(null);
    setUserMenuOpen(false);
    router.navigate("/");
  };

  const currentPath = router.pathname;

  const navItems = [
  {
    label: "Overview",
    href: isSampleMode ? "/demo/audits/blocked" : "/app",
    icon: ShieldIcon,
    active: isSampleMode ? currentPath === "/demo" : currentPath === "/app"
  },
  {
    label: "Audits",
    href: isSampleMode ? "/demo/audits/blocked" : "/app/audits",
    icon: FileTextIcon,
    active: currentPath.startsWith("/app/audits") || currentPath.startsWith("/demo/audits")
  },
  {
    label: "Review Queue",
    href: "/app/reviews",
    icon: ListIcon,
    active: currentPath === "/app/reviews",
    badge: "2"
  },
  {
    label: "Source Library",
    href: "/app/sources",
    icon: DatabaseIcon,
    active: currentPath === "/app/sources"
  },
  {
    label: "Policy Rules",
    href: "/app/policies",
    icon: BookOpenIcon,
    active: currentPath === "/app/policies"
  },
  {
    label: "Evaluation",
    href: "/app/results",
    icon: CheckCircleIcon,
    active: currentPath === "/app/results"
  },
  {
    label: "Settings",
    href: "/app/settings",
    icon: SettingsIcon,
    active: currentPath.startsWith("/app/settings")
  }];


  return (
    <div className="flex h-screen w-screen overflow-hidden antialiased bg-[#F8FAF6] text-[#090F05]">
      {/* ── Sidebar Rail ── */}
      <aside
        className="shrink-0 flex flex-col justify-between select-none transition-all duration-200 z-30 bg-white border-r border-[#18280E]/10"
        style={{ width: sidebarCollapsed ? 64 : 228 }}
        aria-label="Navigation Rail"
      >
        {/* Rail Header */}
        <div>
          <div className="h-14 flex items-center px-4 justify-between border-b border-[#18280E]/10">
            <Link
              href={isSampleMode ? "/demo/audits/blocked" : "/app"}
              className="flex items-center gap-2 tracking-tight hover:opacity-85 transition-opacity"
            >
              <span className="font-bold text-base tracking-tight text-[#090F05]">
                {sidebarCollapsed ? "C’" : "CITEGUARD’"}
              </span>
              {!sidebarCollapsed && (
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#F4FAED] border border-[#18280E]/15 text-[#5C6854] tracking-wider">
                  {isSampleMode ? "DEMO" : "CONSOLE"}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1 rounded border border-[#18280E]/10 text-[#5C6854] hover:text-[#090F05] hover:bg-[#F4FAED] transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label="Toggle sidebar"
            >
              <span className="text-xs font-mono">{sidebarCollapsed ? "→" : "←"}</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    item.active
                      ? "bg-[#F4FAED] text-[#090F05] font-semibold border border-[#18280E]/12"
                      : "text-[#5C6854] hover:text-[#090F05] hover:bg-[#F4FAED]/60 border border-transparent"
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      size={15}
                      className={item.active ? "text-[#18280E]" : "text-[#5C6854]"}
                    />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rail Footer / User Persona */}
        <div className="p-3 relative border-t border-[#18280E]/10">
          <div
            className={`flex items-center ${
              sidebarCollapsed ? "justify-center" : "justify-between"
            } p-2 rounded-lg cursor-pointer transition-colors bg-[#F4FAED] hover:bg-[#E8F2DF] border border-[#18280E]/10`}
            onClick={() => setUserMenuOpen((o) => !o)}
            title="Switch demo persona or sign out"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 font-mono bg-[#18280E] text-[#B2EB76]">
                {user ? user.name[0] : "?"}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 text-left leading-tight">
                  <div className="text-xs font-mono font-semibold truncate text-[#090F05]">
                    {user ? `@${user.handle}` : "Guest Evaluator"}
                  </div>
                  <div className="text-[10px] font-mono truncate text-[#5C6854]">
                    {user ? `${user.role} ${user.isAllowlisted ? "· Allowlisted" : ""}` : "Read-only"}
                  </div>
                </div>
              )}
            </div>
            {!sidebarCollapsed && <ChevronDownIcon size={12} className="text-[#5C6854]" />}
          </div>

          {/* User / Persona Popover */}
          {userMenuOpen && (
            <div className="absolute bottom-full left-2 right-2 mb-1.5 rounded-xl shadow-xl p-2 z-50 bg-white border border-[#18280E]/15 font-mono animate-scale-in">
              <div className="text-[10px] uppercase tracking-wider px-2 py-1 font-semibold text-[#5C6854]">
                [SWITCH DEMO PERSONA]
              </div>
              <button
                type="button"
                className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-[#F4FAED] text-[#090F05] flex items-center justify-between"
                onClick={() => handleSwitchUser("sam")}
              >
                <span>@sam</span>
                <span className="text-[10px] text-[#166534] bg-[#F4FAED] px-1 rounded">Reviewer</span>
              </button>
              <button
                type="button"
                className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-[#F4FAED] text-[#090F05] flex items-center justify-between"
                onClick={() => handleSwitchUser("nikhil")}
              >
                <span>@nikhil-0420</span>
                <span className="text-[10px] text-[#5C6854] bg-[#F4FAED] px-1 rounded">Author</span>
              </button>
              <button
                type="button"
                className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-[#F4FAED] text-[#090F05] flex items-center justify-between"
                onClick={() => handleSwitchUser("nehaa")}
              >
                <span>@nehaa</span>
                <span className="text-[10px] text-[#5C6854] bg-[#F4FAED] px-1 rounded">Auditor</span>
              </button>
              <button
                type="button"
                className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-[#FEF2F2] text-[#991B1B] flex items-center justify-between"
                onClick={() => handleSwitchUser("guest")}
              >
                <span>@unauthorized</span>
                <span className="text-[10px] text-[#991B1B] bg-[#FEF2F2] px-1 rounded">403 probe</span>
              </button>
              <div className="border-t border-[#18280E]/10 my-1 pt-1">
                <button
                  type="button"
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-black/5 text-[#5C6854]"
                  onClick={handleLogout}
                >
                  Sign out →
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Viewport Container ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAF6]">
        {/* Topbar (56px) */}
        <header className="h-14 flex items-center justify-between px-6 shrink-0 z-20 bg-white border-b border-[#18280E]/10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <Link
              href={isSampleMode ? "/demo/audits/blocked" : "/app"}
              className="font-bold tracking-tight text-[#090F05] hover:opacity-75 transition-opacity"
            >
              CITEGUARD’
            </Link>
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={idx}>
                <span className="text-[#5C6854]/40 font-normal">/</span>
                {b.href ? (
                  <Link href={b.href} className="text-[#5C6854] hover:text-[#090F05] transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-[#090F05]">
                    {b.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>


          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Live Connection / Mode Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#F4FAED] border border-[#18280E]/12 text-[#090F05]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#18280E] animate-pulse" />
              <span>{isSampleMode ? "DEMO DATA" : isMock ? "MOCK FIXTURE" : "LIVE BACKEND"}</span>
            </div>

            {/* Quick Primary CTA */}
            <Link
              href="/app/audits/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium bg-[#18280E] text-[#B2EB76] hover:bg-[#223814] transition-colors"
            >
              <PlusIcon size={13} />
              <span>New audit</span>
            </Link>
          </div>
        </header>

        {/* Sample Mode Banner */}
        {isSampleMode && (
          <div className="px-6 py-2 text-xs font-mono flex items-center justify-between shrink-0 bg-[#FFFBEB] border-b border-[#FDE68A] text-[#B45309]">
            <div className="flex items-center gap-2">
              <span className="font-semibold">[SAMPLE AUDIT WORKSPACE]</span>
              <span>Evaluating deterministic policy on planted AI draft fixtures.</span>
            </div>
            <Link
              href="/app/audits/new"
              className="font-medium underline hover:opacity-75 transition-opacity"
            >
              Run live audit →
            </Link>
          </div>
        )}

        {/* Dynamic Workspace Scrollport */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-[#F8FAF6]">
          {children}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );

}