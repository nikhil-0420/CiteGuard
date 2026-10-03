# CiteGuard — hackathon scaffold (Nuroen AgentForge, 3 Oct 2026)

**Agent writes. CiteGuard governs.** Audits references + claim support in Markdown research reports, enforces a GitHub commit-status gate, routes unresolved findings to a human reviewer (n8n), optional ElevenLabs briefing.

## Start here
1. `docs/BUILD_PLAN.md`  ← the master plan (today + event day + who does what)
2. Sam → `docs/PROMPT_BACKEND.md` (paste into Antigravity)
3. Nikhil → `docs/PROMPT_FRONTEND.md` (paste into Antigravity)
4. `docs/CONTRACT.md` + `contract/` ← FROZEN API contract + mock data. Both sides build against it.

## Quickstart
```bash
# backend (Sam)
cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
cp .env.example .env && python -m pytest -q && uvicorn app.main:app --reload --port 8000

# frontend (Nikhil) — works with NO backend (mock mode)
cd frontend && npm install && npm run dev      # http://localhost:5173

# after ANY change under contract/
bash scripts/sync-contract.sh
# full integration check (Sam, after every merge)
bash scripts/smoke.sh
```

## Layout
```
contract/        FROZEN: types.ts + mock/*.json (generated from the real policy engine: python scripts/gen_mocks.py)
backend/         FastAPI audit service. REAL: parser, policy engine, security, API, exception flow, tests. STUB: agent, judge, GitHub PR fetch
frontend/        Vite + React + TS. Report page, finding cards, agent trace, exception form, results page. Mock mode by default
n8n/             workflow skeleton + step-by-step README (event day)
demo/            planted-error brief + notes for the fixed/broken variants
eval/            labeling template + evaluation rules
docs/            plan, prompts, contract notes, governance probes
scripts/         sync-contract.sh, gen_mocks.py, smoke.sh
```

## What is real vs stub (be honest in your head)
| Area | State |
|---|---|
| Markdown parser (frozen syntax, reconciliation) | real, tested |
| Deterministic policy engine (CG-EXIST/SUPPORT/GATE/HUMAN/TRUST) | real, tested |
| HMAC, replay/idempotency, host allowlist, exception endpoint (403/409) | real, tested |
| n8n signed outbound event + status-writer switch | real (needs URL/secret) |
| Crossref match, full-text adapter, bounded agent loop, LLM judge | **STUB — Sam** |
| PR markdown fetch on webhook | **STUB — Sam** |
| Frontend report UI against mock data | real, builds clean |
| ElevenLabs briefing, pitch deck, n8n live wiring | event day |
