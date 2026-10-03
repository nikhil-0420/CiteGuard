import os, json, pathlib
os.environ["MOCK_MODE"] = "true"
from fastapi.testclient import TestClient
from app.main import app

H = {"X-API-Key": "change-me"}
MOCK = pathlib.Path(__file__).resolve().parents[2] / "contract" / "mock"


def test_requires_key():
    with TestClient(app) as c:
        assert c.post("/tools/parse", json={"markdown": "x"}).status_code == 401


def test_parse_demo_brief():
    md = (pathlib.Path(__file__).resolve().parents[2] / "demo" / "agent-brief.md").read_text()
    with TestClient(app) as c:
        r = c.post("/tools/parse", json={"markdown": md}, headers=H).json()
        assert r["complete"] and len(r["claims"]) == 7 and "vaswani2018" in r["bibliography"]


def test_compare_identity():
    with TestClient(app) as c:
        cited = {"title": "Attention Is All You Need", "authors": ["Vaswani", "Shazeer", "Parmar"], "year": 2018}
        found = {"title": "Attention Is All You Need", "year": 2017,
                 "authors": ["Vaswani", "Shazeer", "Parmar", "Uszkoreit", "Jones", "Gomez", "Kaiser", "Polosukhin"]}
        r = c.post("/tools/compare-identity", json={"cited": cited, "found": found}, headers=H).json()
        assert r["status"] == "metadata_mismatch" and set(r["mismatch_fields"]) == {"year", "authors"}
        ok = c.post("/tools/compare-identity", json={"cited": found, "found": found}, headers=H).json()
        assert ok["status"] == "matched"
        none = c.post("/tools/compare-identity", json={"cited": cited, "found": None}, headers=H).json()
        assert none["status"] == "unresolved"


def test_validate_quote():
    with TestClient(app) as c:
        src = "We propose a new simple network architecture, the Transformer,\nbased solely on attention."
        assert c.post("/tools/validate-quote", json={"quote": "the Transformer, based solely on attention", "source_text": src}, headers=H).json()["validated"]
        assert not c.post("/tools/validate-quote", json={"quote": "invented", "source_text": src}, headers=H).json()["validated"]


def test_policy_and_ingest_roundtrip():
    rep = json.loads((MOCK / "report-blocked.json").read_text())
    findings = [{k: v for k, v in f.items() if k not in ("action", "rules_applied", "exception")} for f in rep["findings"]]
    with TestClient(app) as c:
        p = c.post("/tools/policy", json={"commit_sha": rep["commit_sha"], "extraction_complete": True,
                                          "references_total": 6, "findings": findings}, headers=H).json()
        assert p["gate"]["state"] == "failure" and p["summary"]["blocked_count"] == 2
        body = {"repo": rep["repo"], "pr_number": 1, "commit_sha": rep["commit_sha"], "references_total": 6,
                "extraction": rep["extraction"], "findings": findings}
        i = c.post("/api/ingest", json=body, headers=H).json()
        assert i["gate"] == "failure"
        assert c.get(f"/api/reports/{i['report_id']}").status_code == 200


def _body(rep, findings, sha=None):
    return {"repo": rep["repo"], "pr_number": 1, "commit_sha": sha or rep["commit_sha"], "references_total": 4,
            "extraction": rep["extraction"], "findings": findings}


def test_ingest_replaces_same_commit_and_moves_gate():
    rep = json.loads((MOCK / "report-pending.json").read_text())
    base = [{k: v for k, v in f.items() if k not in ("action", "rules_applied", "exception")} for f in rep["findings"]]
    with TestClient(app) as c:
        a = c.post("/api/ingest", json=_body(rep, base), headers=H).json()
        assert a["gate"] == "pending" and a["report_id"] == "pr1-" + rep["commit_sha"][:7]
        approved = []
        for f in base:
            f = dict(f)
            f["exception"] = {"reviewer": "nikhil-0420", "reason": "checked manually", "commit_sha": rep["commit_sha"],
                              "at": "2026-10-03T12:00:00+00:00", "original_action": "review"}
            approved.append(f)
        os.environ["REVIEWER_ALLOWLIST"] = "nikhil-0420"
        from app.config import settings
        settings.reviewer_allowlist = "nikhil-0420"
        b = c.post("/api/ingest", json=_body(rep, approved), headers=H).json()
        assert b["report_id"] == a["report_id"] and b["gate"] == "success"
        assert len(c.get("/api/reports").json()["reports"]) == 4 + 1       # replaced, not duplicated


def test_ingest_rejects_non_allowlisted_and_flags_stale():
    from app.config import settings
    settings.reviewer_allowlist = "nikhil-0420"
    rep = json.loads((MOCK / "report-pending.json").read_text())
    base = [{k: v for k, v in f.items() if k not in ("action", "rules_applied", "exception")} for f in rep["findings"]]
    ex = {"reviewer": "mallory", "reason": "trust me", "commit_sha": rep["commit_sha"], "at": "x", "original_action": "review"}
    with TestClient(app) as c:
        bad = [dict(base[0], exception=ex)] + base[1:]
        assert c.post("/api/ingest", json=_body(rep, bad), headers=H).status_code == 403
        old = dict(ex, reviewer="nikhil-0420", commit_sha="oldcommit")
        stale = [dict(f, exception=old) for f in base]
        r = c.post("/api/ingest", json=_body(rep, stale, sha="newcommit1234"), headers=H).json()
        assert r["gate"] == "pending"                                         # stale approvals clear nothing
        assert c.get(f"/api/reports/{r['report_id']}").json()["review"]["state"] == "stale"


def test_pr_webhook_sets_pending_then_triggers_nuroen(monkeypatch):
    import app.routes.api as api
    from app.security import sign
    calls = {}

    async def fake_fetch(repo, pr, sha): return "# md"
    async def fake_trigger(req): calls["trigger"] = (req.repo, req.pr_number, req.commit_sha, req.markdown)
    async def fake_status(repo, sha, state, desc, url): calls.setdefault("status", []).append(state)
    monkeypatch.setattr(api, "fetch_pr_markdown", fake_fetch)
    monkeypatch.setattr(api, "nuroen_trigger", fake_trigger)
    monkeypatch.setattr(api, "set_commit_status", fake_status)
    body = json.dumps({"action": "opened", "repository": {"full_name": "o/r"},
                       "pull_request": {"number": 7, "head": {"sha": "abc1234"}}}).encode()
    h = {"X-Hub-Signature-256": "sha256=" + sign("change-me", body), "X-GitHub-Event": "pull_request", "X-GitHub-Delivery": "d-pr-1"}
    with TestClient(app) as c:
        assert c.post("/webhooks/github", content=body, headers=h).status_code == 202
    assert calls["status"] == ["pending"] and calls["trigger"] == ("o/r", 7, "abc1234", "# md")
