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
        # Truncated author list is no longer flagged; preprint (2017) vs cited (2018) year difference flags year
        assert r["status"] == "metadata_mismatch" and set(r["mismatch_fields"]) == {"year"}
        ok = c.post("/tools/compare-identity", json={"cited": found, "found": found}, headers=H).json()
        assert ok["status"] == "matched"
        none = c.post("/tools/compare-identity", json={"cited": cited, "found": None}, headers=H).json()
        assert none["status"] == "unresolved"


def test_compare_identity_accents_subtitles_and_authors():
    with TestClient(app) as c:
        # Accents normalized (e.g. Müller -> Muller, Bengio)
        cited = {"title": "Deep Learning with Müller", "authors": ["Müller, J."], "year": 2020}
        found = {"title": "Deep Learning with Muller", "authors": ["Muller, J.", "Bengio, Y."], "year": 2020}
        r = c.post("/tools/compare-identity", json={"cited": cited, "found": found}, headers=H).json()
        assert r["status"] == "matched"

        # Subtitle difference ("Title: Subtitle" vs "Title")
        cited_sub = {"title": "Attention Is All You Need: Architecture & Scaling", "authors": ["Vaswani, A."], "year": 2017}
        found_main = {"title": "Attention Is All You Need", "authors": ["Vaswani, Ashish"], "year": 2017}
        r2 = c.post("/tools/compare-identity", json={"cited": cited_sub, "found": found_main}, headers=H).json()
        assert r2["status"] == "matched"

        # Hyphens and case variation
        cited_hyphen = {"title": "Self-Supervised Learning", "authors": ["Le-Cun, Y."], "year": 2021}
        found_hyphen = {"title": "self supervised learning", "authors": ["Lecun, Yann"], "year": 2021}
        r3 = c.post("/tools/compare-identity", json={"cited": cited_hyphen, "found": found_hyphen}, headers=H).json()
        assert r3["status"] == "matched"

        # First author surname difference
        cited_diff_first = {"title": "Attention Is All You Need", "authors": ["Devlin, J."], "year": 2017}
        r4 = c.post("/tools/compare-identity", json={"cited": cited_diff_first, "found": found_main}, headers=H).json()
        assert r4["status"] == "metadata_mismatch" and "authors" in r4["mismatch_fields"]

        # Missing cited author in found list
        cited_missing = {"title": "Attention Is All You Need", "authors": ["Vaswani, A.", "Nonexistent, Z."], "year": 2017}
        r5 = c.post("/tools/compare-identity", json={"cited": cited_missing, "found": found_main}, headers=H).json()
        assert r5["status"] == "metadata_mismatch" and "authors" in r5["mismatch_fields"]

        # Preprint (2017) vs Publication (2018) year difference flags year limitation
        cited_year = {"title": "Attention Is All You Need", "authors": ["Vaswani, A."], "year": 2018}
        r6 = c.post("/tools/compare-identity", json={"cited": cited_year, "found": found_main}, headers=H).json()
        assert r6["status"] == "metadata_mismatch" and r6["mismatch_fields"] == ["year"]


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


def test_github_approval_verification_scenarios(monkeypatch):
    import httpx
    import app.github_pr as gh
    from app.config import settings
    settings.reviewer_allowlist = "nikhil-0420"
    settings.github_token = "dummy-token"

    # Case 1: Valid approval on exact commit
    reviews_page1 = [
        {"user": {"login": "nikhil-0420"}, "state": "APPROVED", "commit_id": "sha-1", "id": 1}
    ]
    class MockResp:
        def __init__(self, data, status_code=200):
            self._data = data
            self.status_code = status_code
        def json(self): return self._data
        def raise_for_status(self):
            if self.status_code != 200: raise httpx.HTTPStatusError("Err", request=None, response=None)

    async def mock_get(url, *args, **kwargs):
        return MockResp(reviews_page1)

    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    import asyncio
    assert asyncio.run(gh.verify_pr_approval("o/r", 1, "sha-1", "nikhil-0420")) is True
    # Wrong commit -> False
    assert asyncio.run(gh.verify_pr_approval("o/r", 1, "sha-diff", "nikhil-0420")) is False
    # Non-allowlisted reviewer -> False
    assert asyncio.run(gh.verify_pr_approval("o/r", 1, "sha-1", "mallory")) is False

    # Case 2: Later CHANGES_REQUESTED cancels approval
    cancelled_reviews = [
        {"user": {"login": "nikhil-0420"}, "state": "APPROVED", "commit_id": "sha-1", "id": 1},
        {"user": {"login": "nikhil-0420"}, "state": "CHANGES_REQUESTED", "commit_id": "sha-1", "id": 2},
    ]
    async def mock_cancelled(*a, **kw): return MockResp(cancelled_reviews)
    monkeypatch.setattr(httpx.AsyncClient, "get", mock_cancelled)
    assert asyncio.run(gh.verify_pr_approval("o/r", 1, "sha-1", "nikhil-0420")) is False

    # Case 3: Later COMMENTED does NOT cancel approval
    commented_reviews = [
        {"user": {"login": "nikhil-0420"}, "state": "APPROVED", "commit_id": "sha-1", "id": 1},
        {"user": {"login": "nikhil-0420"}, "state": "COMMENTED", "commit_id": "sha-1", "id": 2},
    ]
    async def mock_commented(*a, **kw): return MockResp(commented_reviews)
    monkeypatch.setattr(httpx.AsyncClient, "get", mock_commented)
    assert asyncio.run(gh.verify_pr_approval("o/r", 1, "sha-1", "nikhil-0420")) is True

    # Case 4: GitHub API fails -> fail closed
    async def mock_fail(*a, **kw): return MockResp(None, status_code=500)
    monkeypatch.setattr(httpx.AsyncClient, "get", mock_fail)
    assert asyncio.run(gh.verify_pr_approval("o/r", 1, "sha-1", "nikhil-0420")) is False

    # Reset token for subsequent tests
    settings.github_token = ""


def test_audit_endpoint_security_retries_and_persistence(monkeypatch, tmp_path):
    import app.routes.api as api
    from app.store import Store, store
    from app.models import AuditReport, Gate, Extraction, Summary

    # 1. API key protection
    with TestClient(app) as c:
        payload = {"repo": "owner/repo", "pr_number": 42, "commit_sha": "c123456", "markdown": "# Demo"}
        # Without key -> 401
        assert c.post("/api/audit", json=payload).status_code == 401

        # 2. Trigger failure allows retry (not marked as seen)
        async def fail_trigger(req): raise RuntimeError("Nuroen connection error")
        monkeypatch.setattr(api, "nuroen_trigger", fail_trigger)
        try:
            c.post("/api/audit", json=payload, headers=H)
        except Exception:
            pass
        key = "owner/repo#42@c123456"
        assert key not in api.audited_commits

        # 3. Successful trigger marks commit as audited
        async def ok_trigger(req): return {"mode": "forwarded", "status": 200}
        monkeypatch.setattr(api, "nuroen_trigger", ok_trigger)
        r = c.post("/api/audit", json=payload, headers=H)
        assert r.status_code == 202 and r.json().get("status") == 200
        assert key in api.audited_commits

        # 4. Duplicate request without force is rejected as duplicate
        dup = c.post("/api/audit", json=payload, headers=H)
        assert dup.status_code == 202 and dup.json().get("duplicate") is True

        # 5. Forced re-audit bypasses seen mark
        forced = c.post("/api/audit?force=true", json=payload, headers=H)
        assert forced.status_code == 202 and forced.json().get("status") == 200

    # 6. Atomic persistence & mock non-overwrite
    test_store = Store()
    test_store.data_dir = tmp_path / "reports"
    test_store.data_dir.mkdir(parents=True, exist_ok=True)
    rep = AuditReport.model_validate(json.loads((MOCK / "report-passed.json").read_text()))
    test_store.put(rep)
    # File exists on disk
    persisted_file = test_store.data_dir / f"{rep.report_id}.json"
    assert persisted_file.exists()

    # Re-loading into a fresh store preserves persisted report
    fresh_store = Store()
    fresh_store.data_dir = test_store.data_dir
    fresh_store.load_persisted()
    assert fresh_store.get(rep.report_id) is not None
    assert fresh_store.get(rep.report_id).gate.state == "success"


