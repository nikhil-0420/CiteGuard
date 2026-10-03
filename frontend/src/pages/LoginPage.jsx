import React, { useState } from "react";
import { Link, useRouter } from "../router";
import {
  DEMO_USERS,
  setCurrentUser,
  isGithubConfigured,
  isMagicLinkConfigured,
  generateOAuthState
} from "../auth";
import {
  ShieldIcon,
  GithubIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  ArrowLeftIcon
} from "../components/Icons";

export default function LoginPage({ initialMode = "login" }) {
  const router = useRouter();
  const returnTo = router.searchParams.get("returnTo") || "/app";

  const [mode, setMode] = useState(initialMode); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const hasGithub = isGithubConfigured();
  const hasMagicLink = isMagicLinkConfigured();

  const handleDemoLogin = (userKey) => {
    const selected = DEMO_USERS[userKey];
    if (!selected) return;
    setIsLoading(true);
    setCurrentUser(selected);
    setIsLoading(false);
    router.navigate(returnTo);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid work email address.");
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);

    // Instant provisioning
    const customUser = {
      login: name ? name.toLowerCase().replace(/\s+/g, "") : email.split("@")[0],
      name: name || email.split("@")[0],
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      role: "Reviewer",
      isAllowlisted: true,
      email: email.trim(),
    };
    setCurrentUser(customUser);
    setIsLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white text-[#090F05] flex flex-col justify-between p-4 sm:p-6 antialiased selection:bg-[#B2EB76]">
      {/* Top Bar */}
      <div className="max-w-md w-full mx-auto pt-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#090F05]/70 hover:text-[#090F05] transition-none"
        >
          <ArrowLeftIcon size={13} />
          <span>Back to home</span>
        </Link>

        <span className="font-extrabold text-lg tracking-[-0.04em] text-[#090F05]">
          CITEGUARD<span className="text-[#18280E] font-black">’</span>
        </span>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto my-8">
        <div className="bg-[#F4FAED] border border-[#18280E]/10 rounded-[24px] p-8 sm:p-10 shadow-sm">
          {/* Tab Selector: Sign in vs Sign up */}
          <div className="flex bg-white/70 border border-[#18280E]/10 rounded-lg p-1 mb-8">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg(null);
                setSubmitted(false);
              }}
              className={`flex-1 py-1.5 rounded-md font-mono text-xs font-medium transition-none ${
                mode === "login"
                  ? "bg-[#18280E] text-[#B2EB76]"
                  : "text-[#090F05]/70 hover:text-[#090F05]"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMsg(null);
                setSubmitted(false);
              }}
              className={`flex-1 py-1.5 rounded-md font-mono text-xs font-medium transition-none ${
                mode === "signup"
                  ? "bg-[#18280E] text-[#B2EB76]"
                  : "text-[#090F05]/70 hover:text-[#090F05]"
              }`}
            >
              Sign up
            </button>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-[#090F05] mb-2">
              {mode === "signup" ? "Create your account" : "Sign in to workspace"}
            </h1>
            <p className="text-xs text-[#090F05]/70 leading-relaxed">
              {mode === "signup"
                ? "Join the deterministic data platform for real-time verification and research gates."
                : "Access saved audit runs, repository PR gates, and authorized reviewer exceptions."}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 mb-6 rounded-md text-xs flex items-start gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626]">
              <XCircleIcon size={14} className="shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {submitted ? (
            <div className="bg-white border border-[#18280E]/15 rounded-xl p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-[#18280E] text-[#B2EB76] flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                ✓
              </div>
              <h4 className="font-semibold text-lg text-[#090F05] mb-1">
                {mode === "signup" ? "Account Created" : "Signed In"}
              </h4>
              <p className="text-xs text-[#090F05]/70 mb-5 leading-relaxed">
                Your session is active. You can proceed directly to the verified workspace.
              </p>
              <Link
                href={returnTo}
                className="inline-flex items-center justify-center w-full py-3 rounded-md bg-[#18280E] text-[#B2EB76] font-medium text-sm hover:bg-[#203613] transition-none"
              >
                Proceed to workspace →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block font-mono text-[11px] font-medium uppercase tracking-wider text-[#090F05] mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 px-4 bg-white border border-[#18280E]/15 rounded-md font-mono text-sm text-[#090F05] placeholder-[#090F05]/30 focus:outline-none focus:border-[#18280E]"
                  />
                </div>
              )}

              <div>
                <label className="block font-mono text-[11px] font-medium uppercase tracking-wider text-[#090F05] mb-1.5">
                  Work Email <span className="text-[#18280E]">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 bg-white border border-[#18280E]/15 rounded-md font-mono text-sm text-[#090F05] placeholder-[#090F05]/30 focus:outline-none focus:border-[#18280E]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-md bg-[#18280E] text-[#B2EB76] font-medium text-sm hover:bg-[#203613] transition-none flex items-center justify-center cursor-pointer shadow-sm"
                >
                  {isLoading
                    ? "Processing..."
                    : mode === "signup"
                    ? "Create account"
                    : "Sign in with email"}
                </button>
              </div>

              {/* GitHub OAuth Button */}
              <button
                type="button"
                onClick={handleGithubOAuth}
                className="w-full h-11 rounded-md bg-white border border-[#18280E]/15 text-[#090F05] font-mono text-xs font-medium hover:bg-[#F3F5F0] transition-none flex items-center justify-center gap-2 cursor-pointer"
              >
                <GithubIcon size={14} />
                <span>Continue with GitHub</span>
              </button>

              {/* Divider for 1-click Demo Persona */}
              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#18280E]/10" />
                </div>
                <span className="relative bg-[#F4FAED] px-3 font-mono text-[10px] uppercase text-[#090F05]/60 tracking-wider">
                  Or instant 1-click demo persona
                </span>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("sam")}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border border-[#18280E]/15 rounded-md text-left hover:border-[#18280E] transition-none cursor-pointer"
                >
                  <div>
                    <span className="block font-mono text-xs font-semibold text-[#090F05]">Sam (@sam)</span>
                    <span className="block text-[10px] text-[#090F05]/60">Lead Reviewer (Allowlisted)</span>
                  </div>
                  <span className="font-mono text-xs text-[#18280E]">►</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin("nikhil")}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border border-[#18280E]/15 rounded-md text-left hover:border-[#18280E] transition-none cursor-pointer"
                >
                  <div>
                    <span className="block font-mono text-xs font-semibold text-[#090F05]">Nikhil (@nikhil-0420)</span>
                    <span className="block text-[10px] text-[#090F05]/60">Research Author</span>
                  </div>
                  <span className="font-mono text-xs text-[#18280E]">►</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Legal / Footnote */}
      <div className="text-center font-mono text-[11px] text-[#090F05]/40 pb-4">
        CiteGuard · High Precision Deterministic Platform
      </div>
    </div>
  );
}