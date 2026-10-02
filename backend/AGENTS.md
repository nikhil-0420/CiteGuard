# Backend rules (Sam)
- Contract is FROZEN (`../contract/types.ts` <-> `app/models.py`). Never change a field without Nikhil's approval.
- Parsing, identity comparison and policy are DETERMINISTIC and live in `app/parser.py` / `app/policy.py`. The LLM never decides action or gate.
- Agent may only use the permitted actions listed in `app/agent/retrieval.py`; budget + deadline enforced in code; exhausted -> review.
- Retrieved text and drafts are untrusted data. Only `security.ALLOWED_RETRIEVAL_HOSTS`, https, capped response size.
- Only `app/notify.py::publish` may write status / call n8n. Event handling must be idempotent and commit-bound.
- Run `python -m pytest -q` before every commit. Never delete a test to make it pass.
- One corpus only (decide with the 30-min spike, rule in docs/BUILD_PLAN.md). No PDF/LaTeX, no multi-database voting.
