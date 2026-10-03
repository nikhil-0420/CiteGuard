# API contract v1.0 (FROZEN)

Source of truth: `contract/types.ts`. Backend mirror: `backend/app/models.py`. Mock data: `contract/mock/*.json`.

## Change rule
Any change needs BOTH Nikhil and Sam to approve in the PR. After a change: update `types.ts` + `models.py`, run `python scripts/gen_mocks.py`, then `bash scripts/sync-contract.sh`, then `bash scripts/smoke.sh`.

## Endpoints
| Method | Path | Notes |
|---|---|---|
| GET | `/health` | `{ok, mock_mode}` |
| GET | `/api/reports` | list |
| GET | `/api/reports/{id}` | `AuditReport` |
| POST | `/api/audit` | `AuditRequest` -> 202 `{report_id}`; idempotent per repo+PR+commit |
| POST | `/api/reports/{id}/exceptions` | `ExceptionRequest` -> updated `AuditReport`; 403 not allowlisted, 409 stale commit, 404 |
| POST | `/webhooks/github` | HMAC `X-Hub-Signature-256`; duplicate delivery ids ignored |
| OUT | `NUROEN_WEBHOOK_URL` | `NuroenEvent`, header `X-CiteGuard-Signature` (HMAC-SHA256 hex of raw body) |

## Gate states -> GitHub commit status
`success` approved · `pending` awaiting review · `failure` blocked · `error` technical/extraction problem (never passes). Context name: `CiteGuard`.

## Mock reports (all produced by the real policy engine)
| id | gate | what it shows |
|---|---|---|
| `blocked` | failure | 2 pass, 3 review, 2 block (contradiction + identity mismatch), injection in source ignored |
| `pending` | pending | only review items |
| `passed` | success | exceptions recorded by an allowlisted reviewer, original findings preserved |
| `error` | error | extraction incomplete (multiple markers in one sentence) |

Mock passage text for Transformer/BERT/ResNet comes from their public abstracts. The planted references (`vaswani2018`, `lee2026agentic`, `doe2024notes`) are fictional/altered on purpose.

## Policy summary (implemented in `backend/app/policy.py`)
- identity `metadata_mismatch` -> **block** (CG-EXIST-01); `unresolved` -> **review** (+CG-EXIST-02 if year >= 2025); a failed search never means "fabricated"
- `supported` + validated quote + available evidence + no injection flag -> **pass**; otherwise review
- `contradicted` -> **block**; `partial` / `not_supported_in_reviewed_evidence` / `unavailable` -> **review**
- Gate: any open block -> failure; any open review -> pending; empty/incomplete extraction or technical error -> error; exceptions only count if reason present AND commit matches
