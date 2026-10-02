# CiteGuard Backend Handoff Note

**Date:** Fri 2 Oct 2026 (Eve of Nuroen AgentForge)  
**Author:** Sam (Backend Lead)  
**Branch:** `sam/env-setup`  
**Status:** Feature-complete, 34/34 tests green, audit pipeline & evaluation verified.

---

## 1. Quick Start

### Setup Environment
```bash
# In backend/
uv venv .venv --python 3.12   # or python -m venv .venv
.venv\Scripts\activate        # Linux/macOS: source .venv/bin/activate
uv pip install -r requirements.txt
```

### Run Tests
```bash
python -m pytest -q
# All 34 tests pass (100% green)
```

### Start Server
```bash
uvicorn app.main:app --reload --port 8000
```

---

## 2. Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` (already in `.gitignore`):

| Variable | Description | Default / Example |
|---|---|---|
| `MOCK_MODE` | If `true`, pre-loads canned reports from `contract/mock/` into memory on startup | `true` |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key for live LLM judge (optional; fallback heuristic active) | `""` |
| `GEMINI_API_KEY` | Alternative Google Gemini API key for live LLM judge | `""` |
| `OPENAI_API_KEY` | Alternative OpenAI API key for live LLM judge | `""` |
| `GITHUB_WEBHOOK_SECRET` | Secret for HMAC-SHA256 signature on `/webhooks/github` | `"change-me"` |
| `GITHUB_TOKEN` | Fine-grained PAT with commit status write + pull request read permissions | `""` |
| `REVIEWER_ALLOWLIST` | Comma-separated GitHub usernames allowed to grant policy exceptions | `nikhil-0420,sam-github-login` |
| `CROSSREF_MAILTO` | Email for Crossref polite API pool | `citeguard@example.com` |
| `N8N_WEBHOOK_URL` | Webhook URL for outbound signed events to n8n | `""` |
| `N8N_SHARED_SECRET` | HMAC secret for `X-CiteGuard-Signature` header to n8n | `"change-me"` |
| `STATUS_WRITER` | Who sets GitHub commit status: `"service"` (backend) or `"n8n"` (orchestrator) | `"service"` |
| `TOOL_CALL_BUDGET` | Maximum tool calls allowed per audit (budget enforcement) | `24` |
| `AUDIT_DEADLINE_MS` | Maximum duration before `stop_insufficient_evidence` timeout | `90000` |
| `CORS_ORIGINS` | Permitted frontend origins | `http://localhost:5173` |

---

## 3. Architecture & Implemented Components

1. **Deterministic Parser (`app/parser.py`)**:
   - Strictly parses atomic claim markers `[@key]` and the ````bibliography```` YAML block.
   - Multiple citation markers per sentence or missing keys flag `complete=False` and force Gate `error`.

2. **Corpus Decision & Full-Text Adapter (`app/agent/retrieval.py`, `backend/CORPUS_DECISION.md`)**:
   - Single chosen corpus: `arxiv_html` (10/10 papers clean in spike).
   - Fetches HTML from `https://arxiv.org/html/{id}` (or abstract fallback from `export.arxiv.org`).
   - Sentence-level candidate scoring with stemming and entity weighting.
   - Real locators (`section`, `paragraph`) with verbatim provenance check via `validate_quote()`.

3. **Identity Matching (`app/agent/retrieval.py`)**:
   - Resolves DOI and queries Crossref polite pool.
   - Compares title, year, and author family names.
   - Verified on all 6 demo references:
     - `vaswani2017`: `matched`
     - `devlin2018`: `matched`
     - `he2015`: `matched`
     - `vaswani2018`: `metadata_mismatch` (`mismatch_fields: ["year", "authors"]`) -> blocks
     - `lee2026agentic`: `unresolved` (`CG-EXIST-02` indexing lag) -> reviews
     - `doe2024notes`: planted demo fixture -> reviews with `CG-TRUST-01`

4. **Structured Judge (`app/agent/judge.py`)**:
   - Strict JSON validation against `models.Judgment`.
   - Malformed/unparsable model output safely degrades to `label="unavailable"` (Probe 2).
   - Direct support for Anthropic Claude, Google Gemini, and OpenAI via `httpx`.
   - Deterministic offline evaluator active if no API key is provided.

5. **Deterministic Policy Engine (`app/policy.py`)**:
   - Pure functions enforcing `CG-*` rules.
   - `metadata_mismatch` -> block (`CG-EXIST-01`).
   - `unresolved` -> review (`CG-EXIST-01` + `CG-EXIST-02`).
   - Prompt injection flag -> prevents auto-pass (`CG-TRUST-01`).
   - `contradicted` -> block (`CG-SUPPORT-01`).
   - Exceptions require authorized reviewer, valid reason, and matching commit SHA (`CG-HUMAN-01`).

6. **Outbound Notification & GitHub Integration (`app/notify.py`, `app/github_status.py`, `app/routes/api.py`)**:
   - Outbound `N8nEvent` with HMAC-SHA256 signature in `X-CiteGuard-Signature`.
   - Idempotency key per `repo#pr@sha:event:exceptions`.
   - GitHub webhook endpoint `/webhooks/github` ready for PR events (`opened`, `synchronize`, `reopened`).

---

## 4. Evaluation Benchmark (`scripts/run_eval.py`)

Run against live server:
```bash
python scripts/run_eval.py --api-url http://localhost:8000
```
Verified metrics on seed claims:
- **Accuracy:** 100.0%
- **Unsafe Passes (FP):** 0
- **Median Latency:** ~300ms

---

## 5. Event-Day Integration Checklist (Sat 3 Oct)

- [ ] **GitHub Demo Repo:** Set up `citeguard-demo`, add branch protection requiring status `CiteGuard`.
- [ ] **Secrets:** Populate `.env` with actual `GITHUB_TOKEN`, `ANTHROPIC_API_KEY` (or `GEMINI_API_KEY`), and `N8N_SHARED_SECRET`.
- [ ] **Webhook Tunnel:** Expose `/webhooks/github` via tunnel (ngrok / Cloudflare Tunnel) and point GitHub repo webhook.
- [ ] **Frontend Handshake:** Verify Nikhil's frontend running on `http://localhost:5173` reads live audit reports seamlessly.
- [ ] **Smoke Test:** Run `bash scripts/smoke.sh` after each merge.
