#!/usr/bin/env bash
# One-command integration check. Sam runs this after every merge. Exits non-zero on any failure.
set -e
cd "$(dirname "$0")/.."
echo "== 1/5 contract sync check =="
bash scripts/sync-contract.sh >/dev/null
git diff --quiet -- frontend/src/contract frontend/public/mock 2>/dev/null || echo "!! frontend contract copy changed after sync (commit it)"
echo "== 2/5 backend tests =="
(cd backend && python3 -m pytest -q)
echo "== 3/5 frontend typecheck + build =="
(cd frontend && npm install --no-audit --no-fund >/dev/null && npm run build >/dev/null)
echo "== 4/5 live API contract check =="
(cd backend && MOCK_MODE=true python3 -m uvicorn app.main:app --port 8765 >/tmp/cg.log 2>&1 & echo $! >/tmp/cg.pid)
sleep 3
curl -sf localhost:8765/health >/dev/null
curl -sf localhost:8765/api/reports | python3 -c "import sys,json; d=json.load(sys.stdin); assert len(d['reports'])>=4"
curl -sf localhost:8765/api/reports/blocked | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['contract_version']=='1.0' and d['gate']['state']=='failure'"
kill "$(cat /tmp/cg.pid)" 2>/dev/null || true
echo "== 5/5 done: ALL GOOD =="
