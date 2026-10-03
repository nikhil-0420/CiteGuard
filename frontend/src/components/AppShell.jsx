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
    <div className="flex h-screen w-screen overflow-hidden antialiased" style={{ background: "var(--cg-canvas)", color: "var(--cg-ink)" }}>
      {/* ── Sidebar Rail ── */}
      <aside
        className="shrink-0 flex flex-col justify-between select-none transition-all duration-200 z-30"
        style={{
          width: sidebarCollapsed ? 64 : 224,
          background: "var(--cg-surface)",
          borderRight: "1px solid var(--cg-line)",
          color: "var(--cg-ink-muted)"
        }}
        aria-label="Navigation Rail">
        
        {/* Rail Header */}
        <div>
          <div
            className="h-14 flex items-center px-4 justify-between"
            style={{ borderBottom: "1px solid var(--cg-line)" }}>
            
            <Link
              href={isSampleMode ? "/demo/audits/blocked" : "/app"}
              className="flex items-center gap-2.5 font-semibold tracking-tight hover:opacity-80 transition-opacity"
              style={{ color: "var(--cg-ink)" }}>
              
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold font-mono shrink-0 shadow-sm"
                style={{ background: "var(--cg-accent)" }}>
                
                CG
              </div>
              {!sidebarCollapsed &&
              <div className="flex flex-col leading-none">
                  <span className="text-sm font-semibold tracking-tight">CiteGuard</span>
                  <span className="text-[10px] font-mono mt-0.5" style={{ color: "var(--cg-ink-muted)" }}>
                    {isSampleMode ? "Sample Workspace" : "Research Console"}
                  </span>
                </div>
              }
            </Link>

            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1 rounded transition-colors hover:bg-black/5"
              style={{ color: "var(--cg-ink-muted)" }}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label="Toggle sidebar">
              
              <span className="text-xs font-mono">{sidebarCollapsed ? "→" : "←"}</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all"
                  style={{
                    background: item.active ? "var(--cg-surface-subtle)" : "transparent",
                    color: item.active ? "var(--cg-ink)" : "var(--cg-ink-secondary)",
                    boxShadow: item.active ? "inset 2px 0 0 var(--cg-accent)" : "none"
                  }}
                  title={sidebarCollapsed ? item.label : undefined}>
                  
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon size={15} style={{ color: item.active ? "var(--cg-accent)" : "var(--cg-ink-muted)" }} />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge &&
                  <span
                    className="text-[10px] font-mono px-1.5 py-px rounded font-semibold"
                    style={{
                      background: "rgba(220, 38, 38, 0.1)",
                      color: "var(--cg-block)",
                      border: "1px solid rgba(220, 38, 38, 0.2)"
                    }}>
                    
                      {item.badge}
                    </span>
                  }
                </Link>);

            })}
          </nav>
        </div>

        {/* Rail Footer / User Persona */}
        <div className="p-3 relative" style={{ borderTop: "1px solid var(--cg-line)" }}>
          <div
            className={`flex items-center ${
            sidebarCollapsed ? "justify-center" : "justify-between"} p-2 rounded-md cursor-pointer transition-colors hover:bg-black/5`
            }
            onClick={() => setUserMenuOpen((o) => !o)}
            title="Switch demo persona or sign out"
            style={{ background: userMenuOpen ? "var(--cg-surface-subtle)" : "transparent" }}>
            
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 text-white shadow-sm"
                style={{
                  background: user?.isAllowlisted ? "var(--cg-pass)" : "var(--cg-block)"
                }}>
                
                {user ? user.name[0] : "?"}
              </div>
              {!sidebarCollapsed &&
              <div className="min-w-0 text-left leading-tight">
                  <div className="text-xs font-semibold truncate" style={{ color: "var(--cg-ink)" }}>
                    {user ? `@${user.handle}` : "Guest Evaluator"}
                  </div>
                  <div className="text-[10px] truncate" style={{ color: "var(--cg-ink-muted)" }}>
                    {user ? `${user.role} ${user.isAllowlisted ? "(Allowlisted)" : ""}` : "Read-only"}
                  </div>
                </div>
              }
            </div>
            {!sidebarCollapsed && <ChevronDownIcon size={12} style={{ color: "var(--cg-ink-muted)" }} />}
          </div>

          {/* User / Persona Popover */}
          {userMenuOpen &&
          <div
            className="absolute bottom-full left-2 right-2 mb-1.5 rounded-lg shadow-xl p-2 z-50 animate-scale-in"
            style={{
              background: "var(--cg-surface)",
              border: "1px solid var(--cg-line)"
            }}>
            
              <div className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 font-semibold" style={{ color: "var(--cg-ink-muted)" }}>
                Switch Demo Persona:
              </div>
              <button
              type="button"
              className="w-full text-left px-2 py-1.5 text-xs rounded transition-colors hover:bg-black/5"
              style={{ color: "var(--cg-ink)" }}
              onClick={() => handleSwitchUser("sam")}>
              
                Sam (@sam · Reviewer)
              </button>
              <button
              type="button"
              className="w-full text-left px-2 py-1.5 text-xs rounded transition-colors hover:bg-black/5"
              style={{ color: "var(--cg-ink)" }}
              onClick={() => handleSwitchUser("nikhil")}>
              
                Nikhil (@nikhil-0420 · Author)
              </button>
              <button
              type="button"
              className="w-full text-left px-2 py-1.5 text-xs rounded transition-colors hover:bg-black/5"
              style={{ color: "var(--cg-ink)" }}
              onClick={() => handleSwitchUser("nehaa")}>
              
                Nehaa (@nehaa · Auditor)
              </button>
              <button
              type="button"
              className="w-full text-left px-2 py-1.5 text-xs rounded transition-colors hover:bg-red-50"
              style={{ color: "var(--cg-block)" }}
              onClick={() => handleSwitchUser("guest")}>
              
                Guest (@unauthorized · 403 probe)
              </button>
              <div style={{ borderTop: "1px solid var(--cg-line)", margin: "4px 0", paddingTop: 4 }}>
                <button
                type="button"
                className="w-full text-left px-2 py-1.5 text-xs rounded transition-colors hover:bg-black/5"
                style={{ color: "var(--cg-ink-secondary)" }}
                onClick={handleLogout}>
                
                  Sign out
                </button>
              </div>
            </div>
          }
        </div>
      </aside>

      {/* ── Main Viewport Container ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: "var(--cg-canvas)" }}>
        {/* Topbar (56px) */}
        <header
          className="h-14 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm"
          style={{
            background: "var(--cg-surface)",
            borderBottom: "1px solid var(--cg-line)"
          }}>
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--cg-ink-secondary)" }}>
            <Link
              href={isSampleMode ? "/demo/audits/blocked" : "/app"}
              className="hover:opacity-70 transition-opacity">
              
              CiteGuard
            </Link>
            {breadcrumbs.map((b, idx) =>
            <React.Fragment key={idx}>
                <span style={{ color: "var(--cg-line)" }}>/</span>
                {b.href ?
              <Link href={b.href} className="hover:opacity-70 transition-opacity">
                    {b.label}
                  </Link> :

              <span className="font-semibold" style={{ color: "var(--cg-ink)" }}>
                    {b.label}
                  </span>
              }
              </React.Fragment>
            )}
          </div>

          {/* Center Search / Command Palette Trigger */}
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs w-72 justify-between transition-colors hover:bg-black/5"
            style={{
              background: "var(--cg-surface-subtle)",
              border: "1px solid var(--cg-line)",
              color: "var(--cg-ink-secondary)"
            }}>
            
            <div className="flex items-center gap-2">
              <SearchIcon size={13} style={{ color: "var(--cg-ink-muted)" }} />
              <span>Search reports, claims, sources...</span>
            </div>
            <kbd
              className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded shadow-sm"
              style={{
                color: "var(--cg-ink-secondary)",
                background: "var(--cg-surface)",
                border: "1px solid var(--cg-line)"
              }}>
              
              ⌘K
            </kbd>
          </button>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Live Connection / Mode Pill */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono shadow-sm"
              style={{
                background: "var(--cg-surface)",
                border: "1px solid var(--cg-line)",
                color: "var(--cg-ink-secondary)"
              }}>
              
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "var(--cg-pass)" }} />
              
              <span>{isSampleMode ? "DEMO DATA" : isMock ? "MOCK FIXTURE" : "LIVE BACKEND"}</span>
            </div>

            {/* Quick Primary CTA */}
            <Link
              href="/app/audits/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white transition-colors hover:opacity-90 shadow-sm"
              style={{ background: "var(--cg-ink)" }}>
              
              <PlusIcon size={13} />
              <span>New audit</span>
            </Link>
          </div>
        </header>

        {/* Sample Mode Banner */}
        {isSampleMode &&
        <div
          className="px-6 py-2 text-xs flex items-center justify-between shrink-0"
          style={{
            background: "rgba(217, 119, 6, 0.1)",
            borderBottom: "1px solid rgba(217, 119, 6, 0.2)",
            color: "var(--cg-review)"
          }}>
          
            <div className="flex items-center gap-2">
              <span className="font-semibold">Sample Audit Workspace:</span>
              <span>Evaluating deterministic policy on planted AI draft fixtures.</span>
            </div>
            <Link
            href="/app/audits/new"
            className="font-medium underline hover:opacity-70 text-xs transition-opacity">
            
              Run live audit →
            </Link>
          </div>
        }

        {/* Dynamic Workspace Scrollport */}
        <main className="flex-1 min-h-0 overflow-y-auto" style={{ background: "var(--cg-canvas)" }}>
          {children}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>);

}