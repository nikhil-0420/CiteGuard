# Frontend rules (Nikhil)
- Types come from `src/contract/types.ts` (a synced copy; edit only `../contract/types.ts`, then `bash ../scripts/sync-contract.sh`).
- Must work in MOCK mode with no backend (`VITE_USE_MOCK=true`). Live mode must render the same shapes.
- Every finding shows: identity status, evidence availability, semantic judgment, source locator, rule ID, resulting action.
- Never show database agreement as votes/confidence. Never say "fabricated". Label cached results as cached.
- Error states (403/409/404) must render a readable message, not crash.
- `npm run build` (tsc + vite) must pass before every commit.
