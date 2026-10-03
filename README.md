# CiteGuard

CiteGuard is a governed citation audit system that enforces a GitHub commit-status gate on pull requests. It audits references and claim support in Markdown research reports, relying on an external agentic platform (Nuroen) to perform the heavy lifting, while keeping the governance and gating deterministic.

## Architecture
- **GitHub PR Webhook:** Triggers audits on new commits.
- **Backend:** Provides deterministic tool endpoints, handles incoming GitHub webhooks, and manages the PR gate status (success/pending/failure/error).
- **Nuroen Agents (External):** Includes Intake, Reference Verifier, Evidence Judge, and Governor agents that perform reference lookup, evidence retrieval, and claim judging.
- **Frontend:** A React application that displays detailed, finished audit reports and finding traces.

## Implementation Status
- **Implemented:** The backend deterministic policy engine, exception handling, tool endpoints, and the frontend report UI (against mock data).
- **Planned / Unverified:** The live GitHub PR webhook fetch and the live Nuroen agent integration are still stubs and have not yet been proven in production.

## Quickstart (Mock Mode)
```bash
# backend (Mock Mode)
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
MOCK_MODE=true uvicorn app.main:app --reload --port 8000

# frontend (Mock Mode - Works without backend)
cd frontend
npm install
npm run dev      # http://localhost:5173
```
After making any change under `contract/`, run `bash scripts/sync-contract.sh`. To run a full integration check, use `bash scripts/smoke.sh`.

## Layout
```
contract/        FROZEN: types.ts + mock/*.json (API contracts and mock data)
backend/         FastAPI audit service. Deterministic policy engine, API, exception flow
frontend/        Vite + React UI. Report page, finding cards, agent trace
demo/            planted-error brief + notes for the fixed/broken variants
eval/            labeling template + evaluation rules
docs/            prompts, contract notes, governance probes
scripts/         sync-contract.sh, gen_mocks.py, smoke.sh
```
