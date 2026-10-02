# CiteGuard — Master Build Plan

**Event:** Nuroen AgentForge · Sat 3 Oct 2026 · OJone Marathahalli, Bengaluru · 10:00–18:00 · in person
**Brief:** Create · Govern · Automate. **Prizes:** INR 10,000 + 5,000 + merch. **Tools (our choice, not required):** n8n Pro, ElevenLabs Pro, Antigravity Pro.
**Team:** Nikhil = frontend lead · Sam = backend lead · Nehaa = sub frontend.
**Prep is allowed.** Strategy: finish the heavy build TODAY so tomorrow is integration, rehearsal and polish. Past hackathons lost time to intros, sponsor-credit redemption and other overhead, so tomorrow's plan assumes ~90 minutes of overhead and a HARD feature freeze.

---

## 0. The pitch in one line
AI agents write reports full of sources. **CiteGuard governs them before they merge:** it checks that every reference is real and that the cited source supports the claim, then enforces a GitHub review gate with evidence, explicit uncertainty and human approval.

Positioning (do NOT overclaim): an auditable review workflow that turns reference checks and source evidence into bounded, explainable GitHub decisions with measured results and tested failure behavior. We did not invent citation verification. We check support, not causal faithfulness. Never say "fabricated" for an unresolved reference.

---

## 1. Ownership and merge rules (this is what prevents merge conflicts)

| Path | Owner | Others may |
|---|---|---|
| `backend/**` | **Sam** | read only |
| `frontend/src/**` (except below) | **Nikhil** | Nehaa only in her files |
| `frontend/src/components/VoiceBriefing.tsx` | **Nehaa** (event day) | Nikhil reads |
| `contract/**` | **Nikhil + Sam** (both must approve) | — |
| `n8n/**`, `demo/**`, `eval/**` | **Nikhil** | Nehaa for labels |
| `docs/**` | anyone, via PR | — |
| `pitch/**` (create tomorrow) | **Nehaa** | — |

Git rules
1. `main` is protected. Branches: `sam/<topic>`, `nikhil/<topic>`, `nehaa/<topic>`. Small commits, push often.
2. Contract changes are their own PR, merged FIRST, before anything that depends on them.
3. After any contract change: `python scripts/gen_mocks.py && bash scripts/sync-contract.sh && bash scripts/smoke.sh`.
4. Merge order tomorrow: contract -> backend -> frontend -> n8n -> voice -> pitch assets. Sam merges and runs `scripts/smoke.sh` after EACH merge.
5. Never edit someone else's folder. Need a change? Message them, or open a PR to their branch.
6. Nobody force-pushes. Nobody merges on a red `scripts/smoke.sh`.

---

## 2. TODAY (Fri 2 Oct) — the heavy build

Time-box each block; if a block overruns by 30 minutes, cut scope per Section 7. Start both Antigravity sessions by pasting `PROMPT_BACKEND.md` (Sam) and `PROMPT_FRONTEND.md` (Nikhil).

### Sam — backend (blocks in order)
| # | Block | Target | Done when |
|---|---|---|---|
| S1 | Unzip, venv, `pytest` green (22 tests), run `uvicorn`, hit `/api/reports/blocked` | 20 min | frontend can read live API |
| S2 | **GitHub path proof (riskiest item):** demo repo `citeguard-demo`, branch protection requiring status `CiteGuard`, bypass checked, token or GitHub App, `curl` a commit status and see the merge button block | 60 min | PR shows "CiteGuard" required check, merge blocked on `failure`/`pending` |
| S3 | **Corpus spike (30 min, 10 papers):** can arXiv HTML give clean section text? Rule: >= 8/10 clean -> arXiv, else Europe PMC with claims checkable by non-experts | 30 min | decision written in `backend/CORPUS_DECISION.md` |
| S4 | Crossref identity matching (`agent/retrieval.py`): DOI resolve + title query, compare title/year/authors, produce `Reference` (matched / metadata_mismatch / unresolved) | 60 min | the 6 demo references classify as in `demo/agent-brief.md` |
| S5 | One full-text adapter + passage selection + `validate_quote` | 60 min | real passages with locators for Transformer, BERT, ResNet |
| S6 | Bounded agent loop (permitted actions only, budget + deadline) + structured LLM judge (strict JSON, malformed -> `unavailable`) | 90 min | `POST /api/audit` with `demo/agent-brief.md` returns a real report close to the mock `blocked` |
| S7 | Wire `pipeline.run_audit`, GitHub webhook -> fetch PR markdown at head sha -> audit -> `publish()` (status + n8n event) | 45 min | opening a PR on the demo repo sets a real status |
| S8 | Probe tests #2, #3, #10 (see `PROBES.md`), cached-fallback labeling (`cached: true`) | 30 min | `pytest` green |
| S9 | Hand-off note `backend/HANDOFF.md`: how to run, env vars, known gaps | 15 min | pushed |

If time is short, the **minimum viable backend tonight** is S1, S2, S4, S6 (can use arXiv abs/HTML for 3 known papers), S7.

### Nikhil — frontend (blocks in order)
| # | Block | Target | Done when |
|---|---|---|---|
| N1 | Unzip, `npm install`, `npm run dev`, click through all 4 mock reports (blocked / pending / passed / error) | 20 min | all four render |
| N2 | Product pass on the report page: hierarchy, spacing, mobile width, light/dark, empty/loading/error states. Keep the 3-column Identity / Evidence / Judgment layout | 90 min | looks demo-ready on a projector |
| N3 | Reviewer flow polish: exception form validation, 403 / 409 messages (stale commit shown clearly), optimistic update then re-render gate | 45 min | stale-approval probe is visually obvious |
| N4 | Live mode against Sam's server (`VITE_USE_MOCK=false`): verify shapes, fix any contract drift WITH Sam | 45 min | live and mock render identically |
| N5 | Action-trace view: two retrieval paths for two different problems side by side (demo step 3). Highlight F-003 (inspect_more_context) vs F-006 (reformulate x2 then stop) | 45 min | one click shows both paths |
| N6 | Results page (`EvalPage.tsx`): slots only, no invented numbers; caveats permanently visible | 30 min | ready to fill tomorrow |
| N7 | Cached/fresh labeling everywhere (`cached` badge, voice briefing cached label) | 20 min | badges render |
| N8 | Draft `eval/claims_template.csv` labels if spare time (label evidence BEFORE running the system) | spare | rows added |
| N9 | Hand-off note `frontend/HANDOFF.md`, tag `frontend-freeze-1` | 15 min | pushed |

### End-of-day sync (15 min, all three, tonight)
- Sam and Nikhil confirm: both on the same contract hash, `scripts/smoke.sh` green on both machines.
- Agree tomorrow's meeting spot, Wi-Fi fallback (phone hotspot), chargers, who carries the demo laptop.
- Charge laptops; make sure Antigravity, n8n and ElevenLabs logins work offline-ish (already signed in).

---

## 3. TOMORROW (Sat 3 Oct) — event day plan

Reality check: expect **~90 minutes of overhead** (arrival, intro, sponsor credits, instructions). Real build time may be ~5–6 hours. Everything big is already built, so tomorrow is wiring, polish, evaluation numbers and rehearsal. **Confirm at the desk: submission deadline, demo slot length, judging criteria, and whether Nuroen requires its own platform.**

| Window (approx.) | Plan |
|---|---|
| Arrival -> sponsor/intro overhead | Do the cheap parallel stuff: Sam starts servers + `smoke.sh`; Nikhil asks organizers the 4 questions; Nehaa redeems credits and starts the ElevenLabs test |
| First 60 min of build | Merge today's branches (Sam runs smoke). Nikhil starts n8n workflow (Section 4A). Nehaa: voice + deck skeleton |
| Next 2 h | n8n end-to-end with the real demo repo; reviewer flow; run held-out eval; fix only critical defects |
| **Feature freeze** | **~15:00 (or 3 h before the deadline). After this: bug fixes only** |
| Last 2 h | Evaluation numbers into the Results page, rehearsal x3, record backup video, prepare cached fallbacks |
| Final 30 min | Submit early. No new merges. |

If the schedule shrinks, cut in this order: **(1) ElevenLabs voice -> (2) fixed-baseline comparison -> (3) 104-reference benchmark -> (4) reduce claim set from 40 to ~24 -> (5) Slack/email routing (already deferred).** Never cut: GitHub status gate, evidence display, reviewer exception, stale-commit probe, honest caveats.

### Sam on event day — integration owner
1. Merge in the order from Section 1; run `bash scripts/smoke.sh` after each merge.
2. Resolve merge conflicts (contract first). If the contract diverged, stop and fix with Nikhil before anything else.
3. Run the 12 probes (`docs/PROBES.md`), record observed pass/fail.
4. Own production-like config: `.env`, public webhook URL (tunnel), secrets, `STATUS_WRITER`.
5. Run the held-out evaluation script and give Nikhil the numbers.

---

## 4. Sub-frontend tasks (event day) — split Nikhil (~65%) / Nehaa (~35%)

### 4A. NIKHIL — n8n orchestration (largest task)
Goal: n8n sets the commit status and posts exactly one review request on the demo PR, acting on the audit service's signed event. Skeleton: `n8n/citeguard-workflow.json`; details: `n8n/README.md`.
1. Start n8n (Pro workspace). Create credential "GitHub token" (HTTP Header Auth: `Authorization: Bearer <token>`).
2. Import `n8n/citeguard-workflow.json`. Fix any node warnings after import.
3. Copy the Webhook **production** URL into Sam's `.env` as `N8N_WEBHOOK_URL`; set `N8N_SHARED_SECRET` identically in n8n.
4. Enable raw body on the Webhook node and add HMAC verification in the Code node (reject if signature mismatch). Test with a wrong signature -> must be rejected.
5. Set `STATUS_WRITER=n8n` on the backend so n8n (not the service) writes status. Verify only one writer is active.
6. Check whether n8n's GitHub node supports commit statuses; if not, the HTTP Request node already in the workflow is the fallback (it is the default).
7. Open a PR with `demo/agent-brief.md`. Expect: status `failure` (2 blocked), one PR comment with the report link.
8. Replay the same event: confirm NO second comment and NO second status (dedupe on `idempotency_key`).
9. Record an exception in the UI as an allowlisted reviewer: status should move per policy (`failure` -> `pending` -> `success`).
10. Push a corrected commit (`demo/agent-brief-fixed.md`): new audit, green status. Confirm a stale approval from the old commit is rejected (409).
11. Screenshot/record each state for the backup video.

### 4B. NIKHIL — demo repo, planted-error PR and fixtures
1. In `citeguard-demo`, protect `main` (required status `CiteGuard`, include admins if possible) — Sam proves this today; Nikhil rehearses the PR flow.
2. Create `agent-brief-broken.md` (two markers in one sentence), `agent-brief-fixed.md`, and the poisoned source page described in `demo/README.md`.
3. Keep a cached copy of each audit result (`cached: true`) as fallback if APIs fail on stage. Label it cached on screen.

### 4C. NIKHIL — evaluation numbers and Results page
1. Run Sam's eval script; collect observed values ONLY.
2. Fill `EvalPage.tsx` slots (`[correct]/24`, unsafe passes `[x]/26`, useful passes `[x]/6`, abstentions `[x]/8`, workflow `[x]/12`, latency/cost, confusion counts).
3. Keep the caveats on screen. Say "historical published comparison", never "we beat five tools".

### 4D. NEHAA — ElevenLabs briefing (optional, cut first)
1. Create a voice (ElevenLabs Pro) and test one TTS call from a script.
2. Build the script generator from a finalized report: number checked, review count, key finding IDs, next action. No new judgments. 20–30 seconds. (Example text is in `contract/mock/report-blocked.json` -> `voice_briefing.script`.)
3. Generate audio for the `blocked` and `passed` reports; save as files and label them cached.
4. Hand the audio URL/path to Nikhil to put in `voice_briefing.url`; `components/VoiceBriefing.tsx` already renders it. Voice failure must never touch the gate.

### 4E. NEHAA — pitch and rehearsal
1. Build the deck (7 slides max): problem + documented failure, what CiteGuard does, architecture (Create/Govern/Automate), live demo, governance probes, results (from Nikhil), honest limits + prior art.
2. Include the prior-art slide: we do not claim to have invented citation verification (RefChecker, CiteSentry, sciwrite-lint, CiteTracer, scite, Elicit, SciFact, ALCE). veracite and touchneedle are unverified by us — do not cite them as facts.
3. Write the 3-minute script following the demo steps below; time it twice.
4. Record the backup video of the full demo (screen + voice).

### 4F. NEHAA + NIKHIL — claim labeling (if not done tonight)
Split `eval/claims_template.csv`: Nehaa labels natural cases, Nikhil labels synthetic/planted ones. Label BEFORE running the system.

---

## 5. Demo script (~3 minutes)
1. **Create:** an AI agent drafts a short research brief as a PR (`demo/agent-brief.md`). Say clearly that some citations are PLANTED errors.
2. **Govern:** CiteGuard audits. PR is blocked: each finding shows evidence span, locator and rule ID.
3. **Agent behavior:** open the trace for F-003 and F-006: two different retrieval paths for two different problems.
4. **Automate:** n8n sets the status and posts ONE review request. A reviewer approves one item with a recorded reason.
5. **Fix and pass:** push a corrected commit -> re-audit -> green.
6. **Governance probes:** poisoned source ignored (F-007); stale approval on a changed commit rejected (409).
7. **Numbers slide:** observed values only, caveats visible.

---

## 6. Evaluation plan (short form; full rules in `eval/README.md`)
1. Reference verification on the public 104-reference dataset (CC BY 4.0): TP, FP, FN, TN, precision, recall, unresolved, technical failures. Caveats: 3 source documents, 26 of 33 problematic from one document, "problematic" includes metadata errors.
2. Claim support: ~40 hand-labeled cases (8 dev / 32 held-out split by source paper). Held-out = 24 accessible (6 per label) + 8 simulated retrieval failures (expected: abstain).
3. 12 governance probes (`PROBES.md`).
4. Operations: median latency, range, timeouts, measured cost, cached vs fresh.
Required caveats: small curated sample; paper-level dependence; synthetic separated; simulated outages != paywall coverage; no general fabrication-detection claim; no adoption/time-saving claim; zero observed unsafe passes does not mean zero risk.

---

## 7. Cut list and fallbacks
- Semantic check underperforms -> disable automatic semantic clearance; present an evidence-assisted human review agent and report the failed evaluation honestly.
- External service fails -> use clearly labeled cached responses. Never present cached retrieval or audio as a fresh call.
- GitHub App/token trouble -> use a fine-grained PAT on the demo repo only.
- Tunnel/Wi-Fi trouble -> phone hotspot; keep the recorded video as last resort.

## 8. Open questions to confirm at the venue
Does Nuroen require its own platform? Judging criteria and weights? Demo slot length? Submission deadline and format? Are sponsor credits needed for any tool we planned to use?

## 9. Verification status (what we can and cannot claim)
Confirmed: Lancet audit figures (2,828 / 458 / 277; an 18 Jul 2026 erratum exists and is unread), ACL 2026 flagged >100 papers, tool precision 31–51% (dataset-specific arithmetic), 104-reference dataset (71 verified, 33 problematic), prizes. **Unverified:** Crossref/OpenAlex/Semantic Scholar limits for a live demo, Nuroen platform requirement and judging criteria. **Unmeasured:** CiteGuard accuracy, usefulness and latency until our evaluation runs. Removed from the pitch: the 57% post-rationalization figure, the ALCE figure, the court-case count.
