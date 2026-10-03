import React, { useState } from "react";
import { Link, useRouter } from "../router";
import {
  DEMO_USERS,
  setCurrentUser,
  isGithubConfigured,
  isMagicLinkConfigured,
  generateOAuthState } from
"../auth";
import {
  ShieldIcon,
  GithubIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  ArrowLeftIcon } from
"../components/Icons";

export default function LoginPage() {
  const router = useRouter();
  const returnTo = router.searchParams.get("returnTo") || "/app";
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const hasGithub = isGithubConfigured();
  const hasMagicLink = isMagicLinkConfigured();

  const handleDemoLogin = (userKey) => {
    const selected = DEMO_USERS[userKey];
    if (!selected) return;
    setIsLoading(true);
    setTimeout(() => {
      setCurrentUser(selected);
      setIsLoading(false);
      router.navigate(returnTo);
    }, 200);
  };

  const handleGithubOAuth = () => {
    if (!hasGithub) {
      setErrorMsg(
        "GitHub OAuth is not configured in this environment (missing VITE_GITHUB_CLIENT_ID). Please use a demo persona below."
      );
      return;
    }
    const state = generateOAuthState();
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/callback`;
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=read:user,repo:status&state=${state}`;
    window.location.href = githubUrl;
  };

  const handleMagicLinkSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid work email address.");
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);

    if (!hasMagicLink) {
      setTimeout(() => {
        setIsLoading(false);
        setErrorMsg(
          "Magic link email service is not configured in this environment (missing SMTP / VITE_EMAIL_SERVICE). Please select a demo persona below."
        );
      }, 300);
      return;
    }

    setTimeout(() => {
      setIsLoading(false);
      setEmailSubmitted(true);
    }, 600);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 antialiased"
      style={{
        background: "var(--cg-canvas)",
        backgroundImage: "linear-gradient(to right, var(--cg-line) 1px, transparent 1px), linear-gradient(to bottom, var(--cg-line) 1px, transparent 1px)",
        backgroundSize: "64px 64px"
      }}>
      
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(circle at 50% 0%, var(--cg-accent-subtle) 0%, transparent 60%)",
        opacity: 0.5
      }} />
      
      <div className="w-full max-w-md relative z-10 animate-fade-in stagger">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70 mb-8"
          style={{ color: "var(--cg-ink-secondary)" }}>
          
          <ArrowLeftIcon size={13} />
          <span>Back to home</span>
        </Link>
        
        <div
          className="rounded-xl border overflow-hidden p-8 shadow-sm bg-white"
          style={{
            borderColor: "var(--cg-line)"
          }}>
          
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <Link href="/" className="flex items-center justify-center">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-mono font-bold shadow-sm"
                style={{ background: "var(--cg-accent)" }}>
                
                CG
              </div>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--cg-ink)" }}>
                Sign in to CiteGuard
              </h1>
              <p className="text-sm" style={{ color: "var(--cg-ink-secondary)" }}>
                Access saved audit runs, repository PR gates, and authorized reviewer exceptions.
              </p>
            </div>
          </div>

          {errorMsg &&
          <div
            className="p-3 mb-6 rounded-md text-xs flex items-start gap-2 animate-fade-in"
            style={{
              background: "#FEF2F2",
              borderColor: "#FECACA",
              border: "1px solid #FECACA",
              color: "var(--cg-block)"
            }}>
            
              <XCircleIcon size={14} className="shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          }

          <div className="space-y-6">
            <div className="p-4 rounded-md border text-sm" style={{ background: "var(--cg-surface-subtle)", borderColor: "var(--cg-line)", color: "var(--cg-ink-secondary)" }}>
              <div className="font-medium mb-1.5 flex items-center gap-2" style={{ color: "var(--cg-ink)" }}>
                <AlertTriangleIcon size={14} style={{ color: "var(--cg-review)" }} />
                Simulated Demo Environment
              </div>
              <p className="leading-relaxed text-xs">
                Real authentication has been disabled for this static demo.
                Please use one of the simulated personas below.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider mb-2" style={{ color: "var(--cg-ink-muted)" }}>
                Select a Demo Persona
              </div>
              
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("sam")}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-left group"
                  style={{
                    background: "var(--cg-surface)",
                    borderColor: "var(--cg-line)"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--cg-accent)"}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--cg-line)"}>
                  
                  <div>
                    <span className="block font-medium text-sm" style={{ color: "var(--cg-ink)" }}>Sam (@sam)</span>
                    <span className="block text-xs mt-0.5" style={{ color: "var(--cg-ink-secondary)" }}>
                      Lead Reviewer (Allowlisted)
                    </span>
                  </div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "var(--cg-accent-subtle)", color: "var(--cg-accent)" }}>
                    →
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin("nikhil")}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-left group"
                  style={{
                    background: "var(--cg-surface)",
                    borderColor: "var(--cg-line)"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--cg-accent)"}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--cg-line)"}>
                  
                  <div>
                    <span className="block font-medium text-sm" style={{ color: "var(--cg-ink)" }}>Nikhil (@nikhil-0420)</span>
                    <span className="block text-xs mt-0.5" style={{ color: "var(--cg-ink-secondary)" }}>
                      Research Author
                    </span>
                  </div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "var(--cg-accent-subtle)", color: "var(--cg-accent)" }}>
                    →
                  </div>
                </button>
              </div>
            </div>

            <Link
              href={returnTo.startsWith("/demo") ? returnTo : "/demo/audits/blocked"}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-semibold border transition-colors mt-6"
              style={{
                color: "var(--cg-ink)",
                background: "var(--cg-surface)",
                borderColor: "var(--cg-line)"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "var(--cg-surface-subtle)"}
              onMouseOut={(e) => e.currentTarget.style.background = "var(--cg-surface)"}>
              
              Explore sample demo workspace
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-[11px] font-mono" style={{ color: "var(--cg-ink-muted)" }}>
          <p>Demo identities are isolated for local simulation and do not authorize live backend actions.</p>
          <p className="mt-2 text-[#94a3b8]">CiteGuard · Citation Verification for Research</p>
        </div>
      </div>
    </div>);

}