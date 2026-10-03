# CiteGuard Upgrade — Implementation Plan & Feature Support Matrix

**Date**: 2 October 2026  
**Target Event**: Nuroen AgentForge Hackathon (3 October 2026)  
**Lead Engineer & Product Designer**: Nikhil / Antigravity IDE  

---

## 1. Feature Support Matrix

| Product Capability | Implementation Status | Backend / Config Support | Mode & Behavior |
| :--- | :--- | :--- | :--- |
| **Public Hero Landing (`/`)** | **Implemented** | Frontend native | Public, zero-auth, live HTML evidence comparison, interactive walkthrough, responsive. |
| **Dedicated Login (`/login`)** | **Implemented** | Frontend + Backend auth contract | Dedicated layout; GitHub OAuth & Magic Link controls; explicit disclosure of unconfigured credentials; working demo role selector (`@sam`, `@nikhil`, `@nehaa`). |
| **OAuth Callback (`/auth/callback`)** | **Implemented** | Contract defined | State validation, token exchange handoff, return-to redirect; safe error handling. |
| **Public Methodology (`/methodology`)** | **Implemented** | Frontend native | Transparent technical audit methodology, pipeline stages, bounds, caveats. |
| **Sample Workspace (`/demo`, `/demo/audits/:id`)** | **Implemented** | Canned policy engine fixtures | Clearly labeled sample badge, instant switching between 4 canonical gate states. |
| **Workspace Shell (`/app/*`)** | **Implemented** | Frontend state / Session | 220px desktop sidebar, breadcrumbs, user switcher, theme toggle, responsive drawer. |
| **Audit History (`/app/audits`)** | **Implemented** | Supported by Backend & Mock (`/api/reports`) | Table with search, gate filter, sorting, reviewer counts, commit SHA locators. |
| **New Audit (`/app/audits/new`)** | **Implemented** | Supported by Backend (`POST /api/audit`) & Demo | Text paste, file upload (`.md`), sample brief loader, parsing issue preview, budget knobs. |
| **Report Evidence Workspace (`/app/audits/:id`)**| **Implemented** | Supported by Backend (`GET /api/reports/:id`) | Two-pane ~55/45 split; rendered Markdown with inline annotations; compact filterable findings; deep evidence panel (identity diff, quote check, policy rule, agent trace). |
| **Reviewer Exception Flow** | **Implemented** | Supported by Backend (`POST /api/reports/:id/exceptions`) | Scoped exception modal; server/mock validation (allowlist, commit SHA); preserving original action. |
| **Review Queue (`/app/reviews`) [P1]** | **Implemented** | Derived from active audit reports | Triage queue of all open `review` and `block` findings across audits with direct evidence links. |
| **Source Library (`/app/sources`) [P1]** | **Implemented** | Derived from audited bibliographies | Registry of cited works, Crossref/arXiv provenance, retrieval status, affected audits. |
| **Policy Viewer (`/app/policies`) [P1]** | **Implemented** | Deterministic rule set (CG-*) | Plain-language definitions of all 8 policy rules, gate effects, reviewer eligibility. |
| **Results & Metrics (`/app/results`)** | **Implemented** | Benchmark fixtures | Honest evaluation metrics, empirical labels, caveats, slide copy export. |
| **Account & Settings (`/app/settings`)** | **Implemented** | Local persistence | Theme, timezone, reviewer identity, demo state reset. |
| **GitHub Integration Settings (`/app/settings/integrations`)** | **Implemented** | Contract defined / Backend webhook | Webhook setup guide, status check explanation, exact-SHA binding disclosure. |
| **Exports (JSON, CSV, Print)** | **Implemented** | Client-side generators | Machine-readable JSON; CSV with spreadsheet formula injection protection (`=,+,-,@`); clean print CSS. |
| **Live GitHub PR Status Write** | Contract defined | Requires `GITHUB_TOKEN` in `.env` | Documented fallback; UI separates audit completion from GitHub status delivery. |
| **Live ArXiv / Crossref Scrape** | Stub in Backend | Requires live network keys | Handled via cached/mock provenance adapters in demo mode. |

---

## 2. Implementation Architecture

### Phase A: Core Design Tokens & Client Router
- Re-theme `styles.css` with editorial research tokens:
  - `--canvas: #F6F5F1`, `--surface: #FFFFFF`, `--surface-subtle: #EEEDE7`, `--ink: #202521`, `--muted: #59625C`, `--line: #D9DDD5`, `--accent: #294F91`, `--danger: #A33032`, `--warning: #805B16`, `--success: #256246`.
  - Serif typography for headlines/document prose, clean sans for UI controls, monospace only for IDs/locators.
  - Dark mode semantic equivalents without ambient glows.
- Lightweight, zero-dependency typed router (`useRouter`, `Link`, `navigate`) supporting browser history, query parameters, hash anchors, and 404 fallback.

### Phase B: Dedicated Pages & Shell
1. **Landing Page (`/`)**: Asymmetric hero, interactive HTML claim/evidence comparison, 3-step workflow, selectable walkthrough (Identity, Evidence, Gate), author/reviewer personas, GitHub SHA commit status section, coverage & limitations, FAQ, real footer.
2. **Login Page (`/login`)**: Calm split layout; GitHub sign-in button & magic link input; configuration disclosure; working Demo Account entry with role switcher (`@sam`, `@nikhil`, `@nehaa`); safe return-to redirection.
3. **App Shell**: Desktop sidebar (Audits, Reviews, Sources, Policies, Results, Settings), top bar with breadcrumbs, mock/live badge, theme toggle, and mobile menu.
4. **Public Methodology (`/methodology`)**: Complete audit specification, explanation of provenance vs votes, and limitation disclosures.

### Phase C: Workspaces & Audits
1. **Audit History (`/app/audits`)** & **Workspace Overview (`/app`)**: Searchable, filterable audit list.
2. **New Audit Wizard (`/app/audits/new`)**: Markdown editor/uploader, parsing issue detection, sample loader, and execution telemetry.
3. **Evidence Workspace (`/app/audits/:auditId`)**:
   - Left: Annotated Markdown view + compact Findings list.
   - Right: Focused Evidence inspector (Identity diff, Inspected passage with quote validation, Decision, Policy Rule, Agent activity trace).
   - Trace comparison modal supporting dynamic selection of any two findings.
   - Exception modal with full validation and 403/409 error probing.

### Phase D: Supporting Modules (P1)
1. **Review Queue (`/app/reviews`)**: Central triage list.
2. **Source Library (`/app/sources`)**: Catalog of cited literature and provenance status.
3. **Policy Viewer (`/app/policies`)**: Detailed breakdown of `CG-*` rules.
4. **Settings & Integrations (`/app/settings`, `/app/settings/integrations`)**: GitHub configuration, timezones, data exports.
5. **Evaluation Results (`/app/results`)**: Benchmark data with slide export.

### Phase E: Verification & Polish
- Full responsive testing (1440px, 1024px, 768px, 390px).
- Production build verification (`npm run build`).
- Automated screenshots across key routes.
