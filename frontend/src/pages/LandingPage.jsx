import React, { useState, useEffect } from "react";
import { Link } from "../router";
import {
  ShieldIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  GithubIcon } from
"../components/Icons";

/* ── Interactive Evidence Specimen ── */
function EvidenceSpecimen() {
  const [activeStep, setActiveStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const steps = [
  {
    label: "DRAFT CLAIM",
    mono: "Line 13 · C-003",
    text: '"ResNets reach under 2% top-5 error on the ImageNet test set."',
    color: "var(--cg-ink)",
    bg: "var(--cg-surface-subtle)"
  },
  {
    label: "SOURCE EVIDENCE",
    mono: "He et al. 2015 · Abstract §2",
    text: '"...achieves a 3.57% top-5 error on the ImageNet test set."',
    color: "var(--cg-accent)",
    bg: "var(--cg-accent-subtle)"
  },
  {
    label: "VERDICT",
    mono: "CG-SUPPORT-01",
    text: "CONTRADICTED — Source reports 3.57%, draft claims < 2%. Gate action: BLOCK MERGE.",
    color: "var(--cg-block)",
    bg: "#FEF2F2" // Tailwind red-50
  }];


  useEffect(() => {
    if (!isAnimating) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isAnimating]);

  return (
    <div
      className="w-full"
      onMouseEnter={() => setIsAnimating(false)}
      onMouseLeave={() => setIsAnimating(true)}>
      
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, i) =>
        <button
          key={i}
          onClick={() => {setActiveStep(i);setIsAnimating(false);}}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium tracking-wide transition-all"
          style={{
            background: activeStep === i ? steps[i].bg : "transparent",
            color: activeStep === i ? steps[i].color : "var(--cg-ink-muted)",
            border: `1px solid ${activeStep === i ? steps[i].color + "40" : "transparent"}`
          }}>
          
            <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{
              background: activeStep === i ? steps[i].color : "var(--cg-line)",
              color: activeStep === i ? "#fff" : "var(--cg-ink-secondary)"
            }}>
            
              {i + 1}
            </span>
            {s.label}
          </button>
        )}
      </div>

      {/* Evidence card */}
      <div
        className="rounded-xl border p-6 transition-all duration-300 shadow-sm"
        style={{
          background: steps[activeStep].bg,
          borderColor: steps[activeStep].color + "33"
        }}>
        
        <div className="flex items-center justify-between mb-4">
          <span
            className="text-[11px] font-mono font-bold tracking-widest uppercase"
            style={{ color: steps[activeStep].color }}>
            
            {steps[activeStep].label}
          </span>
          <span className="text-[11px] font-mono" style={{ color: "var(--cg-ink-muted)" }}>
            {steps[activeStep].mono}
          </span>
        </div>
        <p
          className="text-base leading-relaxed font-serif italic"
          style={{ color: steps[activeStep].color }}>
          
          {steps[activeStep].text}
        </p>

        {/* Progress bar */}
        <div className="mt-5 h-1 w-full rounded-full overflow-hidden" style={{ background: "var(--cg-line)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(activeStep + 1) / steps.length * 100}%`,
              background: steps[activeStep].color,
              transition: "width 300ms ease, background-color 300ms ease"
            }} />
          
        </div>
      </div>
    </div>);

}

/* ── Main Landing Page ── */
export default function LandingPage() {
  return (
    <div className="min-h-screen relative font-sans" style={{ background: "var(--cg-page)" }}>
      {/* ── Faint Green SVG Line Field Background ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40' stroke='%23D1FAE5' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }} />
      
      
      {/* ── Gradient Overlay to fade grid at bottom ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white pointer-events-none z-0" />

      {/* ── Navigation Bar ── */}
      <nav className="relative z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-mono font-bold text-xs shadow-sm"
              style={{ background: "var(--cg-accent)" }}>
              
              CG
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: "var(--cg-ink)" }}>
              CiteGuard
            </span>
          </Link>

          <div className="flex items-center gap-8">
            <Link
              href="/methodology"
              className="text-sm font-medium hover:text-[var(--cg-accent)] transition-colors"
              style={{ color: "var(--cg-ink-secondary)" }}>
              
              Methodology
            </Link>
            <Link
              href="/demo/audits/blocked"
              className="text-sm font-medium hover:text-[var(--cg-accent)] transition-colors"
              style={{ color: "var(--cg-ink-secondary)" }}>
              
              Sample Audit
            </Link>
            <div className="w-px h-4 bg-[var(--cg-line)]" />
            <Link
              href="/login"
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-all shadow-sm hover:shadow-md hover:scale-[1.02]"
              style={{ background: "var(--cg-accent)" }}>
              
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-24 pb-32">
        {/* ── Spacious Hero Section ── */}
        <section className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-semibold mb-8"
          style={{
            color: "var(--cg-accent)",
            background: "var(--cg-accent-subtle)",
            border: "1px solid var(--cg-line-green)"
          }}>
            
            <ShieldIcon size={14} />
            DETERMINISTIC CITATION VERIFICATION
          </div>

          <h1
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-8"
            style={{ color: "var(--cg-ink)" }}>
            
            Verify every claim
            <br />
            before it ships.
          </h1>

          <p
            className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
            style={{ color: "var(--cg-ink-secondary)" }}>
            
            CiteGuard audits citations in Markdown research reports. It retrieves
            primary sources, compares extracted evidence against draft claims, and
            blocks merges when the numbers don't match.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/demo/audits/blocked"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-base font-semibold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: "var(--cg-accent)" }}>
              
              Explore live audit
              <span className="text-white/70">→</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-base font-semibold transition-all hover:bg-[var(--cg-surface-subtle)]"
              style={{
                color: "var(--cg-ink)",
                background: "var(--cg-surface)",
                border: "1px solid var(--cg-line)"
              }}>
              
              Sign in to workspace
            </Link>
          </div>
        </section>

        {/* ── Large Overlapping Product Presentation ── */}
        <section className="mt-24 max-w-5xl mx-auto px-6">
          <div
            className="rounded-2xl bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border p-8 md:p-12"
            style={{ borderColor: "var(--cg-line-green)" }}>
            
            <div className="text-center mb-8">
              <h3 className="text-xs font-mono font-bold tracking-widest uppercase mb-2" style={{ color: "var(--cg-ink-muted)" }}>
                Live Evidence Walkthrough
              </h3>
              <p className="text-sm" style={{ color: "var(--cg-ink-secondary)" }}>
                Watch how CiteGuard evaluates a single citation against a primary source.
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <EvidenceSpecimen />
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="mt-32 max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4" style={{ color: "var(--cg-ink)" }}>
              How CiteGuard verifies claims
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: "var(--cg-ink-secondary)" }}>
              Every claim is traced from draft text to primary source. The system
              applies deterministic policy rules, not probabilistic scoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
            {
              step: "01",
              title: "Extract & Resolve",
              desc: "Parses Markdown AST and resolves references against Crossref & arXiv.",
              color: "var(--cg-accent)"
            },
            {
              step: "02",
              title: "Retrieve Evidence",
              desc: "Fetches full-text passages and validates quote provenance.",
              color: "var(--cg-pass)"
            },
            {
              step: "03",
              title: "Judge Claims",
              desc: "Evaluates claim as supported, contradicted, partial, or unavailable.",
              color: "var(--cg-review)"
            },
            {
              step: "04",
              title: "Enforce Policy",
              desc: "Contradictions block the merge. Supported claims pass automatically.",
              color: "var(--cg-block)"
            }].
            map((item) =>
            <div key={item.step} className="flex flex-col items-center text-center">
                <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold font-mono text-white mb-4 shadow-sm"
                style={{ background: item.color }}>
                
                  {item.step}
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: "var(--cg-ink)" }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--cg-ink-secondary)" }}>{item.desc}</p>
              </div>
            )}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="mt-32 border-t pt-10" style={{ borderColor: "var(--cg-line)" }}>
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-white font-mono font-bold text-[9px]"
                style={{ background: "var(--cg-accent)" }}>
                
                CG
              </div>
              <span className="text-xs font-medium" style={{ color: "var(--cg-ink-muted)" }}>
                CiteGuard · Citation Verification for Research
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/methodology" className="text-xs font-medium hover:text-[var(--cg-ink)] transition-colors" style={{ color: "var(--cg-ink-muted)" }}>
                Methodology
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium hover:text-[var(--cg-ink)] transition-colors"
                style={{ color: "var(--cg-ink-muted)" }}>
                
                <GithubIcon size={14} />
                Source
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>);

}