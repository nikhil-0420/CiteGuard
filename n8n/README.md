# n8n orchestration (Nikhil, event day)

## Architecture (who does what — CG-ACTION-01)
```
GitHub PR event --(HMAC verified)--> audit service --(runs audit, applies policy)--> signed N8nEvent --> n8n
n8n --> sets commit status "CiteGuard" (HTTP Request node) + posts ONE review-request comment
Reviewer approves in the CiteGuard UI --> audit service records exception (allowlist + commit check) --> new signed event --> n8n updates status
```
Only the audit service + n8n (acting on its signed request) may change status. n8n never decides anything; it executes the service's decision.

## Event shape (see contract/types.ts -> N8nEvent)
`{ event: "audit_complete" | "exception_recorded", idempotency_key, report: AuditReport }`
Header: `X-CiteGuard-Signature` = HMAC-SHA256 hex of the raw body, key = `N8N_SHARED_SECRET`.

## Step by step
1. Create the credential: HTTP Header Auth, name `Authorization`, value `Bearer <GitHub token>` (fine-grained PAT for the demo repo: Commit statuses RW, Pull requests/Issues RW).
2. Import `citeguard-workflow.json`; attach the credential to both HTTP Request nodes.
3. Webhook node: Production URL -> `N8N_WEBHOOK_URL` in backend `.env`. Enable "Raw Body".
4. HMAC check (Code node, first lines):
   ```js
   const crypto = require('crypto');            // allow in n8n: NODE_FUNCTION_ALLOW_BUILTIN=crypto if self-hosted
   const raw = $input.first().binary?.data ? Buffer.from($input.first().binary.data.data, 'base64') : Buffer.from(JSON.stringify($input.first().json.body));
   const sig = $input.first().json.headers['x-citeguard-signature'];
   const exp = crypto.createHmac('sha256', $env.N8N_SHARED_SECRET).update(raw).digest('hex');
   if (sig !== exp) throw new Error('bad signature');
   ```
   If crypto is unavailable on n8n Cloud, verify with the Crypto node instead. Test: send a wrong signature -> workflow must stop.
5. Set backend `STATUS_WRITER=n8n`. Send an audit; check the commit status appears on the PR with context `CiteGuard`.
6. Dedupe: replay the same payload; confirm no second comment/status. (The Code node stores `idempotency_key` in workflow static data. For the demo this is enough; note that static data only persists on ACTIVE workflows.)
7. Post-exception: approve in the UI; the `exception_recorded` event updates the status. The review-request comment node only fires for `audit_complete` with `review_count > 0`.
8. Timeout rule: no response means the status stays `pending`. Do NOT build an auto-approve path.
9. Deferred (do not build): Slack/email routing, escalation timers, scheduled re-audits.

## Debug checklist
- Webhook test URL vs production URL (workflow must be Active for production).
- 401 from GitHub: token scope or repo name.
- Status not blocking merges: branch protection must list the `CiteGuard` context as required.
