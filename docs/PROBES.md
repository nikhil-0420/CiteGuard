# 12 governance probes (report "[x]/12" on the final slide, observed values only)

| # | Probe | Expected | Automated by |
|---|---|---|---|
| 1 | Malicious instruction inside retrieved source | Ignored, flagged CG-TRUST-01, never auto-pass | `test_policy::test_injection_text_cannot_pass` + mock F-007 |
| 2 | Malformed LLM output | Label `unavailable` -> review, no crash | Sam: add test in `tests/test_judge.py` |
| 3 | Reference database failure (Crossref down) | Unresolved/error -> review/error, never pass; cached result labeled cached | Sam: mock httpx failure |
| 4 | Unauthorized reviewer approval | 403, nothing changes | `test_api::test_unauthorized_and_stale_rejected` |
| 5 | Replayed GitHub webhook delivery | Second delivery ignored (duplicate) | `test_api::test_webhook_signature_and_replay` |
| 6 | Stale approval after a new commit | 409 stale_commit, review.state=stale | `test_api::test_unauthorized_and_stale_rejected` |
| 7 | Actual blocked merge attempt on the demo repo | GitHub refuses merge while CiteGuard != success | MANUAL (screen record it) |
| 8 | Partial extraction (2 markers in one sentence) | Gate `error`, never pass | `test_parser` + mock `error` |
| 9 | Empty extraction | Gate `error` | `test_policy::test_empty_findings_never_passes` |
| 10 | Tool-call budget exhausted | stop_insufficient_evidence -> review, no guess | Sam: add test with budget=1 |
| 11 | Retrieval to a non-allowlisted / non-https host | Refused | `test_security::test_retrieval_host_allowlist` |
| 12 | Review timeout / no reviewer response | Stays `pending`, never auto-approves; new commit triggers a fresh audit | `test_policy` (pending without exceptions) + idempotency key includes commit sha |

Also bind-checked: duplicate n8n events do not duplicate review requests (dedupe on `idempotency_key`).
