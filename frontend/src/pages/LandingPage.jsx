import React, { useState } from "react";
import { Link, useRouter } from "../router";
import { DEMO_USERS, setCurrentUser } from "../auth";
import {
  ShieldIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
  GithubIcon
} from "../components/Icons";

/* ── Technical Side Ruler Ticks (Spade Signature) ── */
function RulerTicks({ side = "left", dark = false }) {
  const ticks = Array.from({ length: 25 });
  const tickColor = dark ? "bg-white/20" : "bg-[#090F05]/25";
  const majorTickColor = dark ? "bg-white/40" : "bg-[#090F05]/40";
  const arrowColor = dark ? "text-white/70" : "text-[#090F05]";

  return (
    <div
      aria-hidden="true"
      className={`hidden lg:flex flex-col justify-between py-6 select-none pointer-events-none w-6 shrink-0 ${
        side === "left" ? "items-start pl-1" : "items-end pr-1"
      }`}
    >
      {ticks.map((_, i) => {
        const isCenter = i === 12;
        if (isCenter) {
          return (
            <div key={i} className={`flex items-center text-[11px] leading-none my-0.5 ${arrowColor}`}>
              {side === "left" ? <span>►</span> : <span>◄</span>}
            </div>
          );
        }
        return (
          <div
            key={i}
            className={`h-px ${i % 4 === 0 ? `w-4 ${majorTickColor}` : `w-2 ${tickColor}`}`}
          />
        );
      })}
    </div>
  );
}

/* ── Evidence Inspection Card (Static, No Animation) ── */
function EvidenceSpecimen() {
  const [selectedTab, setSelectedTab] = useState(0);

  const specimenItems = [
    {
      badge: "DRAFT CLAIM",
      code: "Line 13 · Claim C-003",
      source: "Draft Report §3",
      quote: '"ResNets reach under 2% top-5 error on the ImageNet test set."',
      verdict: "Extracted from markdown AST",
      status: "neutral"
    },
    {
      badge: "CANONICAL SOURCE EVIDENCE",
      code: "He et al. 2015 · Section 4.1",
      source: "arXiv:1512.03385v1 [cs.CV]",
      quote: '"...achieves a 3.57% top-5 error on the ImageNet test set."',
      verdict: "Primary source retrieved via Crossref / arXiv",
      status: "source"
    },
    {
      badge: "GATE ACTION & VERDICT",
      code: "CG-POLICY-CONTRADICTION",
      source: "policy.py · Gate: BLOCK MERGE",
      quote: "CONTRADICTED — Primary source proves 3.57%, draft claims under 2%. PR merge blocked.",
      verdict: "Requires authorized reviewer exception (Sam) on exact commit SHA to pass.",
      status: "block"
    }
  ];

  const current = specimenItems[selectedTab];

  return (
    <div className="bg-white border border-[#18280E]/15 rounded-xl p-6 sm:p-8">
      {/* Tab Selector */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-black/[0.06] pb-4">
        {specimenItems.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSelectedTab(idx)}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-medium cursor-pointer transition-none ${
              selectedTab === idx
                ? "bg-[#18280E] text-[#B2EB76]"
                : "bg-[#F4FAED] text-[#090F05]/75 hover:text-[#090F05]"
            }`}
          >
            [{idx + 1}] {item.badge}
          </button>
        ))}
      </div>

      {/* Card Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-[#090F05]/60">
          <span>{current.code}</span>
          <span>{current.source}</span>
        </div>

        <div
          className={`p-4 rounded-lg border font-mono text-sm leading-relaxed ${
            current.status === "block"
              ? "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
              : current.status === "source"
              ? "bg-[#F4FAED] border-[#18280E]/20 text-[#18280E]"
              : "bg-white border-black/10 text-[#090F05]"
          }`}
        >
          {current.quote}
        </div>

        <div className="text-xs font-mono text-[#090F05]/70 pt-2 flex items-center justify-between">
          <span>{current.verdict}</span>
          <span className="font-semibold text-[#18280E]">Sub-50ms Policy Eval</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main Landing Page ── */
export default function LandingPage() {
  const router = useRouter();


  // Registration form state
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    organization: "",
    useCase: "citation_gate",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Newsletter state in footer
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterDone, setNewsletterDone] = useState(false);

  const handleDemoSignIn = (userKey) => {
    const user = DEMO_USERS[userKey];
    if (user) {
      setCurrentUser(user);
      router.navigate("/app");
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.email) return;

    const customUser = {
      login: formData.name ? formData.name.toLowerCase().replace(/\s+/g, "") : "researcher",
      name: formData.name || formData.email.split("@")[0],
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      role: "Reviewer",
      isAllowlisted: true,
      email: formData.email,
    };
    setCurrentUser(customUser);
    setFormSubmitted(true);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterDone(true);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#090F05] font-sans antialiased selection:bg-[#B2EB76] selection:text-[#090F05]">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-black/[0.04]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-x-8">
          {/* Brand Logo */}
          <Link href="/" className="inline-flex items-center group cursor-pointer">
            <span className="font-extrabold text-2xl tracking-[-0.04em] text-[#090F05] uppercase">
              CITEGUARD<span className="text-[#18280E] font-black">’</span>
            </span>
          </Link>

          {/* Center: Medium-Sized Clickable GitHub Logo Linked to Nikhil's Repo */}
          <div className="flex items-center justify-center">
            <a
              href="https://github.com/nikhil-0420/CiteGuard"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub Repository"
              className="inline-flex items-center justify-center p-2.5 rounded-lg bg-[#F4FAED] hover:bg-[#EBF3E5] text-[#090F05] border border-[#18280E]/15 transition-none shadow-2xs cursor-pointer group"
            >
              <GithubIcon size={24} className="text-[#090F05] group-hover:text-[#18280E]" />
            </a>
          </div>

          {/* Right Action: Single White Button "Register now" */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden sm:inline-block text-[14px] font-medium text-[#090F05]/75 hover:text-[#090F05] transition-none"
            >
              Sign in
            </Link>

            <a
              href="#signup"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-white text-[#090F05] text-[14px] font-semibold border border-black/15 hover:bg-[#F3F5F0] transition-none shadow-sm cursor-pointer"
            >
              Register now
            </a>
          </div>
        </div>
      </header>

      {/* ── Main Hero Section (Spade Framing Pattern) ── */}
      <main className="relative w-full overflow-hidden pt-4 pb-20">
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-stretch justify-center gap-2 sm:gap-4">
            {/* Left Vertical Ruler Ticks */}
            <RulerTicks side="left" />

            {/* Center Hero Card Container */}
            <div className="flex-1 bg-[#F4FAED] border border-[#18280E]/10 rounded-[28px] sm:rounded-[36px] px-6 sm:px-12 md:px-16 pt-24 sm:pt-36 pb-16 sm:pb-20 flex flex-col justify-between min-h-[580px] sm:min-h-[660px]">
              {/* Massive Centered Heading */}
              <div className="text-center my-auto">
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.25rem] font-semibold tracking-[-0.04em] leading-[1.04] text-[#090F05] max-w-4xl mx-auto">
                  The data & AI platform
                  <br />
                  for citation integrity
                </h1>
              </div>

              {/* Bottom Centered Subtitle & Single White Register Now Button */}
              <div className="text-center mt-12 sm:mt-16">
                <p className="max-w-[34rem] mx-auto text-xs sm:text-sm md:text-[15px] leading-relaxed text-[#090F05]/80 mb-6 font-normal">
                  CiteGuard audits citations in Markdown research reports and verifies claims against primary canonical sources — with deterministic policy gates that block hallucinations before papers or code ship.
                </p>

                <div className="flex items-center justify-center gap-3">
                  <a
                    href="#signup"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-white text-[#090F05] font-semibold text-sm hover:bg-[#F3F5F0] transition-none shadow-sm border border-black/15"
                  >
                    Register now
                  </a>

                  <Link
                    href="/demo/audits/blocked"
                    className="inline-flex items-center justify-center px-5 py-3 rounded-md bg-transparent text-[#090F05]/80 font-medium text-xs sm:text-sm hover:text-[#090F05] transition-none"
                  >
                    Explore live audit →
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Vertical Ruler Ticks */}
            <RulerTicks side="right" />
          </div>
        </div>

        {/* ── CiteGuard Core Features Section ── */}
        <section id="features" className="max-w-[1240px] mx-auto px-6 mt-28">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium text-[#18280E] bg-[#F4FAED] border border-[#18280E]/10 mb-4">
              <span>[01] CORE CAPABILITIES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#090F05] mb-4">
              Deterministic verification at scale
            </h2>
            <p className="text-sm sm:text-base text-[#090F05]/70 max-w-2xl mx-auto leading-relaxed">
              Every citation claim is traced from markdown draft to primary source with zero LLM hallucination and sub-50ms deterministic gate enforcement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {/* Feature 1 */}
            <div className="bg-[#F4FAED] border border-[#18280E]/10 rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-[#090F05]/50 block mb-3">[01] ENFORCEMENT</span>
                <h3 className="text-xl font-semibold text-[#090F05] mb-2">Deterministic PR Gates</h3>
                <p className="text-sm text-[#090F05]/75 leading-relaxed">
                  Contradicted claims automatically trigger a BLOCK MERGE status. Gates evaluate purely via immutable policy rules in policy.py.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#18280E]/10 font-mono text-2xl font-bold text-[#18280E]">
                100% Policy Driven
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#F4FAED] border border-[#18280E]/10 rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-[#090F05]/50 block mb-3">[02] CANONICAL</span>
                <h3 className="text-xl font-semibold text-[#090F05] mb-2">Primary Literature Grounding</h3>
                <p className="text-sm text-[#090F05]/75 leading-relaxed">
                  Resolves references against Crossref, arXiv, and publisher DOIs. Extracts quote passages and compares numerical values with provenance.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#18280E]/10 font-mono text-2xl font-bold text-[#18280E]">
                P99 &lt; 50ms
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#F4FAED] border border-[#18280E]/10 rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-[#090F05]/50 block mb-3">[03] EXCEPTIONS</span>
                <h3 className="text-xl font-semibold text-[#090F05] mb-2">Cryptographic Reviewer Gate</h3>
                <p className="text-sm text-[#090F05]/75 leading-relaxed">
                  Exceptions require genuine GitHub PR review approval from allowlisted leads on the exact commit SHA before an override can unblock a merge.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#18280E]/10 font-mono text-2xl font-bold text-[#18280E]">
                Zero Tampering
              </div>
            </div>
          </div>

          {/* Interactive Evidence Inspection Specimen */}
          <div className="mb-24">
            <div className="text-center mb-8">
              <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-[#090F05]/60 mb-2">
                Live Evidence Specimen Walkthrough
              </h3>
              <p className="text-sm text-[#090F05]/75">
                Inspect how CiteGuard isolates draft claims against canonical paper passages.
              </p>
            </div>
            <div className="max-w-3xl mx-auto">
              <EvidenceSpecimen />
            </div>
          </div>
        </section>

        {/* ── Sign Up Section (id="signup") ── */}
        <section id="signup" className="max-w-[1240px] mx-auto px-6 mt-16 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Column: Technical Value Proposition */}
            <div className="lg:col-span-6 flex flex-col justify-between pt-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium text-[#18280E] bg-[#F4FAED] border border-[#18280E]/10 mb-6">
                  <span>[02] REGISTRATION</span>
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-[-0.035em] text-[#090F05] leading-[1.1] mb-6">
                  Register for CiteGuard
                </h2>

                <p className="text-[#090F05]/75 text-base sm:text-lg leading-relaxed max-w-lg mb-10">
                  Protect your research pipelines from ungrounded claims and hallucinated numbers. Connect repositories or try an instant reviewer persona below.
                </p>
              </div>

              {/* Technical Capability Callouts */}
              <div className="space-y-4 max-w-lg">
                <div className="relative border border-black/10 bg-white p-5 rounded-lg">
                  <div className="flex gap-3">
                    <span className="text-[#18280E] mt-0.5 font-mono text-sm">►</span>
                    <p className="text-sm text-[#090F05] leading-relaxed">
                      <strong>Automated GitHub webhook auditing</strong> — triggers on every push and records commit marks atomically.
                    </p>
                  </div>
                </div>

                <div className="relative border border-black/10 bg-white p-5 rounded-lg">
                  <div className="flex gap-3">
                    <span className="text-[#18280E] mt-0.5 font-mono text-sm">►</span>
                    <p className="text-sm text-[#090F05] leading-relaxed">
                      <strong>Zero LLM dependencies in backend</strong> — reasoning is delegated to Nuroen agents while deterministic gates remain absolute.
                    </p>
                  </div>
                </div>

                <div className="relative border border-black/10 bg-white p-5 rounded-lg">
                  <div className="flex gap-3">
                    <span className="text-[#18280E] mt-0.5 font-mono text-sm">►</span>
                    <p className="text-sm text-[#090F05] leading-relaxed">
                      <strong>Replay protection & atomic files</strong> — reports are preserved in data/reports without data loss.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Registration Form Card */}
            <div className="lg:col-span-6">
              <div className="bg-[#F4FAED] border border-[#18280E]/10 rounded-[24px] p-8 sm:p-10 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold tracking-tight text-[#090F05] mb-2">
                    Register your workspace
                  </h3>
                  <p className="text-xs sm:text-sm text-[#090F05]/70">
                    Enter your work email or test immediately with an allowlisted demo identity.
                  </p>
                </div>

                {formSubmitted ? (
                  <div className="bg-white border border-[#18280E]/15 rounded-xl p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-[#18280E] text-[#B2EB76] flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                      ✓
                    </div>
                    <h4 className="font-semibold text-lg text-[#090F05] mb-1">Registration Complete</h4>
                    <p className="text-xs text-[#090F05]/70 mb-5 leading-relaxed">
                      Your session is ready. You have access to active audit runs and reviewer gates.
                    </p>
                    <Link
                      href="/app"
                      className="inline-flex items-center justify-center w-full py-3 rounded-md bg-white text-[#090F05] font-semibold text-sm border border-black/15 hover:bg-[#F3F5F0] transition-none shadow-sm"
                    >
                      Enter Workspace →
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    {/* Work Email */}
                    <div>
                      <label className="block font-mono text-[11px] font-medium uppercase tracking-wider text-[#090F05] mb-1.5">
                        Work Email <span className="text-[#18280E]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="researcher@lab.org"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full h-11 px-4 bg-white border border-[#18280E]/15 rounded-md font-mono text-sm text-[#090F05] placeholder-[#090F05]/30 focus:outline-none focus:border-[#18280E]"
                      />
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block font-mono text-[11px] font-medium uppercase tracking-wider text-[#090F05] mb-1.5">
                        Full Name <span className="text-[#18280E]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Dr. Samarth Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full h-11 px-4 bg-white border border-[#18280E]/15 rounded-md font-mono text-sm text-[#090F05] placeholder-[#090F05]/30 focus:outline-none focus:border-[#18280E]"
                      />
                    </div>

                    {/* Organization / Repo */}
                    <div>
                      <label className="block font-mono text-[11px] font-medium uppercase tracking-wider text-[#090F05] mb-1.5">
                        Organization or GitHub Repo
                      </label>
                      <input
                        type="text"
                        placeholder="nikhil-0420/CiteGuard"
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        className="w-full h-11 px-4 bg-white border border-[#18280E]/15 rounded-md font-mono text-sm text-[#090F05] placeholder-[#090F05]/30 focus:outline-none focus:border-[#18280E]"
                      />
                    </div>

                    {/* Primary Role */}
                    <div>
                      <label className="block font-mono text-[11px] font-medium uppercase tracking-wider text-[#090F05] mb-1.5">
                        Primary Role
                      </label>
                      <select
                        value={formData.useCase}
                        onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                        className="w-full h-11 px-3 bg-white border border-[#18280E]/15 rounded-md font-mono text-xs text-[#090F05] focus:outline-none focus:border-[#18280E]"
                      >
                        <option value="citation_gate">Lead Reviewer / PR Gate Authorizer</option>
                        <option value="author">Research Author / Paper Submitter</option>
                        <option value="lab_admin">Lab Administrator / Repository Owner</option>
                      </select>
                    </div>

                    {/* Submit Button in White */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full h-12 rounded-md bg-white text-[#090F05] font-semibold text-sm border border-black/15 hover:bg-[#F3F5F0] transition-none flex items-center justify-center cursor-pointer shadow-sm"
                      >
                        Register now
                      </button>
                    </div>

                    {/* Divider for 1-click Demo Persona Sign-In */}
                    <div className="relative my-4 text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#18280E]/10" />
                      </div>
                      <span className="relative bg-[#F4FAED] px-3 font-mono text-[10px] uppercase text-[#090F05]/60 tracking-wider">
                        Or instant 1-click demo persona
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleDemoSignIn("sam")}
                        className="p-2.5 bg-white border border-[#18280E]/15 rounded-md text-left hover:border-[#18280E] transition-none cursor-pointer"
                      >
                        <span className="block font-mono text-xs font-semibold text-[#090F05]">Sam (@sam)</span>
                        <span className="block text-[10px] text-[#090F05]/60">Allowlisted Reviewer</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDemoSignIn("nikhil")}
                        className="p-2.5 bg-white border border-[#18280E]/15 rounded-md text-left hover:border-[#18280E] transition-none cursor-pointer"
                      >
                        <span className="block font-mono text-xs font-semibold text-[#090F05]">Nikhil (@nikhil-0420)</span>
                        <span className="block text-[10px] text-[#090F05]/60">Research Author</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Exact Spade-Styled Deep Forest Footer (Matching Attached Reference) ── */}
      <footer className="bg-[#111E0C] text-white pt-20 pb-12 relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            {/* Left Vertical Ruler Ticks on Dark Canvas */}
            <RulerTicks side="left" dark={true} />

            <div className="flex-1 flex flex-col">
              {/* Centered Email Subscribe Box ("just put email in cnetre like at last page") */}
              <div className="w-full max-w-xl mx-auto text-center mb-16">
                <h4 className="font-mono text-base font-semibold text-white mb-2">
                  Sign up to our CiteGuard
                </h4>
                <p className="text-xs text-[#A3C78B] font-mono mb-6">
                  Get automated alerts on research citation integrity and PR policy gates.
                </p>

                {newsletterDone ? (
                  <div className="p-3 bg-white/10 rounded border border-white/20 font-mono text-xs text-[#B2EB76]">
                    ✓ Subscribed to CiteGuard updates.
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="flex items-center justify-center gap-2 max-w-md mx-auto">
                    {/* Dark input box with four white cut-corner brackets */}
                    <div className="relative flex-1">
                      {/* 4 White Corner Brackets */}
                      <div className="pointer-events-none absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white" />
                      <div className="pointer-events-none absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white" />
                      <div className="pointer-events-none absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white" />
                      <div className="pointer-events-none absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white" />

                      <input
                        type="email"
                        required
                        placeholder="Email address"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        className="w-full h-12 px-4 bg-[#0A1207]/80 text-white placeholder-white/40 font-mono text-sm border border-white/10 focus:outline-none text-center"
                      />
                    </div>

                    {/* Square Return Button with White Border */}
                    <button
                      type="submit"
                      aria-label="Submit"
                      className="w-12 h-12 shrink-0 border border-white/80 bg-transparent hover:bg-white/10 text-white flex items-center justify-center cursor-pointer transition-none text-base font-mono"
                    >
                      ↳
                    </button>
                  </form>
                )}
              </div>

              {/* Main Footer Links & Social */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-10 border-t border-white/10 pt-12">
                {/* 3 Columns for CiteGuard Details */}
                <div className="md:col-span-8 grid grid-cols-3 gap-6 sm:gap-8">
                  {/* Column 1: USE CASES */}
                  <div>
                    <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#A3C78B] mb-5">
                      USE CASES
                    </h4>
                    <ul className="space-y-3 font-sans text-sm text-white/90">
                      <li>
                        <a href="#features" className="hover:text-white transition-none">
                          Markdown Citation Audit
                        </a>
                      </li>
                      <li>
                        <a href="#features" className="hover:text-white transition-none">
                          PR Gate Verification
                        </a>
                      </li>
                      <li>
                        <a href="#features" className="hover:text-white transition-none">
                          Crossref &amp; arXiv Grounding
                        </a>
                      </li>
                      <li>
                        <a href="#features" className="hover:text-white transition-none">
                          Deterministic Exceptions
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* Column 2: PLATFORM */}
                  <div>
                    <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#A3C78B] mb-5">
                      PLATFORM
                    </h4>
                    <ul className="space-y-3 font-sans text-sm text-white/90">
                      <li>
                        <Link href="/app" className="hover:text-white transition-none">
                          Audit Workspace
                        </Link>
                      </li>
                      <li>
                        <Link href="/demo/audits/blocked" className="hover:text-white transition-none">
                          Sample Reports
                        </Link>
                      </li>
                      <li>
                        <a href="#features" className="hover:text-white transition-none">
                          Nuroen Agent Tools
                        </a>
                      </li>
                      <li>
                        <a href="#features" className="hover:text-white transition-none">
                          Policy Enforcement
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* Column 3: RESOURCES */}
                  <div>
                    <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#A3C78B] mb-5">
                      RESOURCES
                    </h4>
                    <ul className="space-y-3 font-sans text-sm text-white/90">
                      <li>
                        <Link href="/methodology" className="hover:text-white transition-none">
                          Methodology
                        </Link>
                      </li>
                      <li>
                        <a href="https://github.com/nikhil-0420/CiteGuard#readme" target="_blank" rel="noreferrer" className="hover:text-white transition-none">
                          API Reference
                        </a>
                      </li>
                      <li>
                        <a href="#signup" className="hover:text-white transition-none">
                          Security &amp; Allowlist
                        </a>
                      </li>
                      <li>
                        <a href="https://github.com/nikhil-0420/CiteGuard" target="_blank" rel="noreferrer" className="hover:text-white transition-none">
                          GitHub Repository
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Social Column */}
                <div className="md:col-span-4 flex flex-col justify-start md:items-end">
                  <div>
                    <h5 className="font-mono text-xs font-semibold text-white mb-3 md:text-right">
                      Social
                    </h5>
                    <div className="flex items-center gap-2.5">
                      <a
                        href="https://linkedin.com"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="LinkedIn"
                        className="w-7 h-7 bg-white text-[#111E0C] flex items-center justify-center font-bold text-xs rounded-sm hover:opacity-85 transition-none"
                      >
                        in
                      </a>
                      <a
                        href="https://github.com/nikhil-0420/CiteGuard"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="GitHub"
                        className="w-7 h-7 bg-white text-[#111E0C] flex items-center justify-center rounded-sm hover:opacity-85 transition-none"
                      >
                        <GithubIcon size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Legal / Copyright Row */}
              <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-4 font-sans">
                <div className="flex flex-wrap items-center gap-6">
                  <a href="#signup" className="hover:text-white transition-none">Terms of Service</a>
                  <a href="#signup" className="hover:text-white transition-none">Privacy Policy</a>
                  <a href="#signup" className="hover:text-white transition-none">MSA</a>
                  <a href="#signup" className="hover:text-white transition-none">SLA</a>
                </div>
                <div>
                  © CiteGuard 2026
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}