# CiteGuard Frontend — Handoff & Architecture Documentation

**Author**: Nikhil (Frontend Lead) & Antigravity IDE  
**Hackathon**: Nuroen AgentForge (3 October 2026)  
**Release Tag**: `frontend-upgrade-v2`  
**Git Branch**: `nikhil/frontend-redesign` (Local only; remote push pending repo creation)

---

## 1. Quick Start

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm or pnpm

### Running Locally

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already done)
npm install

# Start Vite development server
npm run dev
```

The application will be accessible at: `http://localhost:5173/`

### Production Build & Typecheck
```bash
npm run build
```
This runs `node --max-old-space-size=2048 ./node_modules/typescript/bin/tsc --noEmit && vite build`, ensuring zero type errors and creating production assets in `dist/`.

---

## 2. Information Architecture & Stable Routes

CiteGuard features a zero-dependency typed client router (`src/router.tsx`) supporting browser back/forward, deep-linking, copy-to-clipboard URL preservation, safe `returnTo` redirects, and full responsive support.

| Route | Purpose | Support Status | Notes |
| :--- | :--- | :--- | :--- |
| `/` | **Public Hero Landing Page** | **Implemented (Compulsory)** | Asymmetric hero, headline, primary CTA, sample-report CTA, live HTML evidence comparison, 3-step workflow, selectable walkthrough (Identity, Evidence, Gate), author/reviewer sections, SHA commit status section, coverage & limitations table, FAQ, real footer. |
| `/login` | **Dedicated Login Page** | **Implemented (Compulsory)** | Calm layout, GitHub OAuth & magic link controls, explicit provider disclosure notice, 1-click verified demo account switcher (`@sam`, `@nikhil`, `@nehaa`, `@guest`), "Explore sample workspace" path, governance invariant callout. |
| `/auth/callback` | OAuth Provider Callback | Implemented | Validates random cryptographic OAuth state, handles error codes and denial, redirects safely to `returnTo` destination. |
| `/methodology` | Public Methodology & Pipeline | Implemented | Public explanation of 3-stage pipeline (AST Extraction, Crossref/arXiv/PubMed resolution, Deterministic Policy Evaluation), citation vs source support, retraction handling, limitations. |
| `/demo` & `/demo/audits/:auditId` | Labeled Sample Workspace | Implemented | Full 2-pane report/evidence workspace in sample mode with fixture selector (`blocked`, `pending`, `passed`, `error`). No credentials required. |
| `/app` | Workspace Overview | Implemented | "Needs your attention" urgent queue, quick actions, recent audits table, demo/live data indicators. |
| `/app/audits` | Audit History | Implemented | Searchable, filterable audit history table with gate status chips, author, commit SHA, and direct report links. |
| `/app/audits/new` | Start New Audit | Implemented | Markdown input wizard with tabbed paste/upload, one-click "Load Sample Brief" button, document preview, policy selector, and budget controls. |
| `/app/audits/:auditId` | Primary Report / Evidence Workspace | Implemented | 2-pane editorial workspace: Left pane (Audited Findings table + Rendered Markdown Document View with line annotations); Right pane (Focused Evidence Panel with 7-part reading order, identity comparison, verbatim quote validation, policy rule, exception dialog, dynamic trace comparison). |
| `/app/reviews` | Reviewer Queue (P1) | Implemented | Centralized queue of findings requiring human review, filterable by status (`PENDING_REVIEW`, `BLOCKED`, `ALL`) with direct links into evidence. |
| `/app/sources` | Source Registry & Provenance (P1) | Implemented | Canonical reference library showing registry provenance (Crossref, arXiv, Europe PMC), DOI locators, retraction status, and affected audit links. |
| `/app/policies` | Policy Rules Viewer | Implemented | Interactive directory of deterministic governance rules (`CG-RULE-01` to `05`, `CG-EXIST-01`, `CG-SUPPORT-01`, `CG-TRUST-01`) explaining criteria, gate impact, and reviewer eligibility. |
| `/app/results` | Evaluation Metrics & Methodology | Implemented | Honest evaluation results page with exact numerators/denominators, test datasets, caveats, and one-click "Copy as Slide Text". |
| `/app/settings` & `/app/settings/integrations` | Settings & Integrations | Implemented | Profile management, GitHub connection status, branch protection guidelines, and sample data reset control. |

---

## 3. Product Positioning & Editorial Design Direction

### Positioning Sentence
> **"Check the sources. Inspect the evidence. Control what ships."**

CiteGuard deliberately avoids exaggerated AI marketing tropes (no "universal truth verification", no "100% hallucination elimination", no glowing badges or floating particles). The deterministic engine evaluates policy rules against inspected source text; source-support judgments can still involve model uncertainty and incomplete evidence.

### Design Persona: Editorial Research Instrument
- **Canvas / Surfaces**: Warm paper (`--canvas: #F6F5F1`, `--surface: #FFFFFF`, `--surface-subtle: #EEEDE7`).
- **Typography**: Restrained serif (`Charter`, `Bitstream Charter`, `Sitka Text`, `Cambria`, `Georgia`) for marketing headlines and document prose; clean sans-serif for UI labels; monospace strictly for identifiers, hashes, DOIs, and agent traces.
- **Accents & Status Tokens**: High-contrast, WCAG AA compliant muted inks:
  - Deep Navy Accent: `#294F91`
  - Critical Block: `#A33032` (surface `#FDF1F1`, border `#ECC0C1`)
  - Warning / Review: `#805B16` (surface `#FEF9EB`, border `#ECCF8C`)
  - Validated Pass: `#256246` (surface `#EEF7F2`, border `#A8D6C0`)
- **Charcoal Dark Mode**: Restrained neutral charcoal surfaces (`#141715`, `#1C201D`) with zero neon ambient glows.

---

## 4. Feature Support Matrix

| Feature / Module | Support Status | Architecture / Backend Contract |
| :--- | :--- | :--- |
| **Public Hero Landing Page (`/`)** | Implemented | Zero backend required; pure responsive editorial component. |
| **Dedicated Login Page (`/login`)** | Implemented | Discloses unconfigured OAuth in local mode; provides verified 1-click demo personas (`@sam`, `@nikhil`, `@nehaa`, `@guest`). |
| **Provider OAuth Flow (`/auth/callback`)** | Supported by Adapter | Generates cryptographically secure random state + PKCE, validates state in callback. Real GitHub OAuth requires server client secret exchange. |
| **2-Pane Evidence Workspace** | Implemented | Left: Markdown document source view with line markers + Findings table; Right: 7-part reading order evidence panel. |
| **Document Source View** | Implemented | Markdown AST line mapping with clickable inline citation badges `[@vaswani2017]` that scroll and select findings. |
| **Scoped Reviewer Exceptions** | Implemented | Validates reviewer handle against repo allowlist, enforces minimum 20-character rationale, binds exception to exact commit SHA, preserves original judgment. Includes test probes for 403 Forbidden and 409 Conflict. |
| **Dynamic Trace Comparison** | Implemented | Side-by-side tool execution timeline comparing any two selected findings with step outcomes, queries, and latencies. |
| **New Audit Submission** | Implemented | Supports paste & file upload. Local demo persistence saves audits to `localStorage` under `citeguard_local_audits`. Live mode calls `POST /api/verify`. |
| **Review Queue (`/app/reviews`)** | Implemented | In-memory & local queue of outstanding review items across audits. |
| **Source Library (`/app/sources`)** | Implemented | Canonical reference catalog with DOI links and multi-source provenance metadata. |
| **Policy Viewer (`/app/policies`)** | Implemented | Read-only directory of audited policy rules with versioning tags. |
| **Evaluation Dashboard (`/app/results`)** | Implemented | Grounded metrics on versioned test corpora with slide text copy. |
| **Data Exports (JSON / CSV / Print)** | Implemented | JSON dump with run identity; CSV with spreadsheet formula injection protection (`=,+,-,@`); browser `window.print()` styling. |
| **GitHub Commit Status Publication** | Demo-only / Adapter Ready | Visualizes status check on exact commit SHA (`9f3c2a1`). Live webhook delivery and API token exchange require server-side GitHub App installation. |

---

## 5. Verification Evidence & Screenshot Artifacts

Automated Playwright verification was executed across both 1440px desktop and 390px mobile viewports:

| # | Artifact Filename | Description |
| :--- | :--- | :--- |
| 1 | `20_landing_page_desktop.png` | Complete public hero landing page at 1440px with asymmetric hero, headline, CTAs, and HTML evidence card. |
| 2 | `21_landing_walkthrough_evidence.png` | Interactive walkthrough card on landing page with "2. Source Evidence" tab active. |
| 3 | `22_login_page_desktop.png` | Dedicated login page at 1440px with GitHub sign-in, magic link, configuration notice, and 1-click demo personas. |
| 4 | `23_methodology_page.png` | Public methodology page explaining 3-stage pipeline, identity resolution, and retraction notices. |
| 5 | `24_sample_workspace_blocked.png` | 2-pane report/evidence workspace for blocked sample report (`9f3c2a1`) with findings table and evidence inspector. |
| 6 | `25_document_source_view.png` | Document source view tab in left pane showing rendered markdown with line numbers and clickable citation pills. |
| 7 | `26_exception_modal_open.png` | Scoped reviewer exception modal with live character counter, allowlist validation, and commit SHA binding. |
| 8 | `27_exception_probe_403.png` | Visual rejection state when an unauthorized user attempts to approve an exception (HTTP 403 Forbidden). |
| 9 | `28_trace_comparison_modal.png` | Side-by-side agent action trace comparison between two selectable findings. |
| 10 | `29_workspace_overview.png` | `/app` workspace overview with "Needs your attention" queue and recent audits table. |
| 11 | `30_audit_history_list.png` | `/app/audits` searchable history table with filter dropdowns. |
| 12 | `31_new_audit_with_sample.png` | `/app/audits/new` wizard with sample brief loaded and live document preview. |
| 13 | `32_review_queue.png` | `/app/reviews` queue of unassigned and assigned review items. |
| 14 | `33_source_library.png` | `/app/sources` canonical provenance registry with DOI locators. |
| 15 | `34_policy_rules.png` | `/app/policies` interactive directory of governance rules. |
| 16 | `35_evaluation_results.png` | `/app/results` evaluation metrics, finding distribution, and slide text copy button. |
| 17 | `36_settings_integrations.png` | `/app/settings` account profile, GitHub setup instructions, and demo data reset. |
| 18 | `37_mobile_landing_page.png` | Hero landing page rendered at 390px (iPhone 14) showing responsive single-column layout. |
| 19 | `38_mobile_login_page.png` | Dedicated login page at 390px with comfortable touch targets and no horizontal overflow. |
| 20 | `39_mobile_sample_workspace.png` | Sample workspace at 390px with stacked layout and accessible evidence drawer. |

All screenshot artifacts are stored in:
`C:\Users\ACER.DESKTOP-R4G9UL6\.gemini\antigravity-ide\brain\0f1e14f3-a029-4e92-8d1e-f7a0596c1c2b\`

---

## 6. Three-Click Demo Walkthrough

To demonstrate the full evidence inspection and policy enforcement in under 15 seconds:
1. **Click 1**: From `/` (Landing Page), click **"View sample report"** (or open `/demo/audits/blocked`).
2. **Click 2**: In the findings table, click row **`F-003`** (or `F-005`). The right pane instantly loads the claim, reference diff, verbatim inspected passage, and policy rule.
3. **Click 3**: Click **"Compare Traces"** in the report header. A side-by-side modal opens comparing the agent's tool execution steps and query reformulations between two findings.
