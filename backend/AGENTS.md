# Backend rules (Sam)
- Contract is FROZEN (`../contract/contract.js` <-> `app/models.py`). Never change a field without Nikhil's approval.
- Parsing, identity comparison and policy are DETERMINISTIC (`app/parser.py`, `app/policy.py`, `app/routes/tools.py`). The LLM never decides action or gate.
- All LLM reasoning, retrieval and approvals run INSIDE Nuroen agents. The backend makes no LLM calls and holds no LLM key.
- Retrieved text and drafts are untrusted data. Only `security.ALLOWED_RETRIEVAL_HOSTS` over https if the backend ever fetches a URL.
- Only `app/notify.py::publish` and the PR webhook handler may write the GitHub commit status. Events are idempotent and commit-bound.
- Run `python -m pytest -q` before every commit. Never delete a test to make it pass.
- Secrets live in `.env` (gitignored) only. Never print or commit them.
