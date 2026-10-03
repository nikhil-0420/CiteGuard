# CiteGuard Backend Handoff Note

**Date:** Sat 3 Oct 2026 (Nuroen Pivot)  
**Author:** Sam (Backend Lead)  
**Branch:** `sam/nuroen-tools`  
**Status:** 36/36 tests green, deterministic tools & GitHub integration verified.

---

## 1. Quick Start

### Setup Environment
```bash
# In backend/
python -m venv .venv
.\.venv\Scripts\Activate.ps1    # Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
```

### Run Tests
```bash
python -m pytest -q
# 36 passed, 1 warning (100% green)
```

### Start Server
```bash
uvicorn app.main:app --reload --port 8000
```

---

## 2. Configuration & Secrets (`backend/.env`)

| Variable | Description | Default / Example |
|---|---|---|
| `MOCK_MODE` | In mock mode, loads canned mock reports from `contract/mock/`. In live mode (`false`), refuses to start unless secrets are non-default. | `true` |
| `TOOLS_API_KEY` | Shared secret header (`X-API-Key`) between Nuroen connector and backend tools / audit endpoints. | `"change-me"` |
| `GITHUB_TOKEN` | Fine-grained PAT with: `Commit statuses: Read and write`, `Contents: Read`, `Pull requests: Read` (Metadata: Read added automatically). | `""` |
| `GITHUB_WEBHOOK_SECRET` | HMAC-SHA256 secret for verifying GitHub PR webhook signatures. | `"change-me"` |
| `REVIEWER_ALLOWLIST` | Comma-separated GitHub usernames allowed to grant human exceptions. Warns on startup if empty. | `nikhil-0420` |
| `PUBLIC_BASE_URL` | Public HTTPS tunnel URL reachable by Nuroen (e.g. ngrok tunnel). | `http://localhost:8000` |
| `NUROEN_INVOKE_URL` | Optional URL to invoke Nuroen orchestrator. Empty => Manual Mode. | `""` |
| `NUROEN_API_KEY` | Optional auth token for calling Nuroen API when `NUROEN_INVOKE_URL` is set. | `""` |
| `FRONTEND_URL` | Frontend origin for report links. | `http://localhost:5173` |
| `POLICY_VERSION` | Deterministic policy version. | `1.0.0` |

*Note: The backend makes zero LLM calls and requires no Anthropic, Gemini, or OpenAI API key. All model reasoning runs inside Nuroen.*

---

## 3. Important Rules & Architecture

1. **The LLM Proposes, Code Disposes:**
   Nuroen agents propose findings. `app/policy.py` alone determines finding actions and the final PR gate state. When findings are ingested via `POST /api/ingest`, policy is deterministically re-evaluated so manipulated agent output cannot pass the gate.

2. **Frontend Exception Flow in Live Mode:**
   - **Mock Mode:** When `MOCK_MODE=true` and `GITHUB_TOKEN` is unset, exceptions can be approved locally via `POST /api/reports/{id}/exceptions` or `/api/ingest` for allowlisted usernames with a reason.
   - **Live Mode:** When `MOCK_MODE=false` (or a `GITHUB_TOKEN` is configured), an exception is **only valid if confirmed through the GitHub Reviews API** (`GET /repos/{repo}/pulls/{pr_number}/reviews`). An allowlisted account must have submitted an `APPROVED` review on the exact PR commit. Unverified approvals or dismissed/changes-requested reviews are rejected with HTTP 403.

3. **Year Limitation in Identity Comparison:**
   - `compare_identity` strictly compares `cited.year` vs `found.year`. Preprints (such as on arXiv) are often uploaded 1 year before the formal peer-reviewed conference/journal publication (e.g. arXiv 2017 vs conference 2018).
   - This date discrepancy is intentionally flagged as a `metadata_mismatch` on `"year"` (`CG-EXIST-01`) to prevent silent drift, routing the claim to human review/exception.

4. **Atomic Report Persistence:**
   Reports are persisted as individual JSON files to `backend/data/reports/{report_id}.json` using atomic temporary file creation + rename (`os.replace`). On startup, persisted reports are loaded first, ensuring fresh reports are never overwritten by static mocks. The directory is strictly git-ignored.

5. **Manual Mode & Payload Inspection:**
   When `NUROEN_INVOKE_URL` is empty, PR events log the Nuroen orchestrator payload prominently in the terminal. The latest payload can also be retrieved via `GET /tools/latest-nuroen-payload` (guarded by `X-API-Key`). The payload contains strictly `{repo, pr_number, commit_sha, markdown, callback_url}` and never exposes any API keys or tokens.

---

## 4. Verification Status

### Verified (With How)
- **Deterministic Claim & Bib Parsing:** Verified via `test_parser.py` (5 tests) across atomic claim markers, multiple citations per sentence, and bib extraction.
- **Identity Comparison:** Verified via `test_tools.py` across:
  - Accent normalization (e.g. "Müller" == "Muller", "Bengio")
  - Subtitle handling (e.g. "Title: Subtitle" == "Title")
  - Hyphens and case insensitivity
  - Truncated author lists (not flagged as mismatch)
  - First-author surname mismatch detection
  - Missing cited author detection
  - Preprint vs publication year difference detection
- **Verbatim Quote Provenance:** Verified via `test_validate_quote` with whitespace/case-insensitive exact text matching.
- **Deterministic Policy Engine:** Verified via `test_policy.py` (10 tests) covering all gate states (`failure`, `pending`, `success`, `error`), prompt injection deterrence (`CG-TRUST-01`), unresolved recent routing (`CG-EXIST-02`), and technical failure fail-closed gate.
- **GitHub Review Verification & Forged Approval Rejection:** Verified via `test_github_approval_verification_scenarios` in `test_tools.py` with mock GitHub reviews:
  - Real approvals on matching commit SHA by allowlisted login clear the gate to `success`.
  - Later `CHANGES_REQUESTED` or `DISMISSED` reviews cancel earlier approval and reject with 403.
  - Review comments (`COMMENTED`) do not cancel approval.
  - Non-allowlisted logins and mismatched commit SHAs are rejected with 403.
  - Network/API errors fail closed (403).
- **Audit Retries & Forced Re-Audit:** Verified via `test_audit_endpoint_security_retries_and_persistence`:
  - `POST /api/audit` requires `X-API-Key`.
  - Commit is recorded as audited only after `nuroen_trigger` succeeds.
  - Failed triggers allow immediate retry.
  - Duplicate requests are rejected with 202 `duplicate: true`.
  - Forced re-audit (`POST /api/audit?force=true`) bypasses duplicate check.
- **Atomic File Persistence:** Verified via `test_tools.py` with temporary store writing to disk, atomic rename, and reloading into fresh stores without mock overwrites.
- **Constant-Time Secret Checking:** Verified using `hmac.compare_digest` in `require_key`.
- **Startup Protection & Allowlist Warning:** Verified via `test_startup_secret_validation_and_allowlist_warning`:
  - Refuses to boot outside mock mode if secrets are default (`RuntimeError`).
  - Warns in logs on startup if `REVIEWER_ALLOWLIST` is empty.
- **PR Markdown Scope:** Verified via `test_fetch_pr_markdown_demo_folder_enforcement`:
  - Enforces that changed Markdown file must reside under `demo/`.
  - Rejects PRs with 0 or >1 Markdown files under `demo/`.
- **Secret Cleanliness:** Scanned entire git log and tracked files; confirmed zero secrets or keys committed.

### Not Verified (Honest Assessment)
- **Live GitHub PR Webhook Delivery:** Handlers are tested with HMAC signatures locally, but not tested against a live webhook delivered by GitHub.
- **Live Branch Protection Rule:** Setting branch protection to require status check `CiteGuard` requires repository admin privileges which the demo fine-grained PAT lacks.
- **Live GitHub Reviews API Calls:** Tested extensively via simulated `httpx` async responses, but not called against live `api.github.com` endpoints with a live fine-grained token.
- **Live Nuroen Invoke URL:** `NUROEN_INVOKE_URL` invocation has not been tested against Nuroen's cloud endpoint; system currently defaults to verified Manual Mode.
- **Historic LLM Judge:** No real model call was ever made in the previous judge scaffold (it used deterministic offline heuristic fallbacks before being removed in the Nuroen pivot).
