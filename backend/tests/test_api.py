import os
os.environ["MOCK_MODE"] = "true"
os.environ["REVIEWER_ALLOWLIST"] = "nikhil-0420"
from fastapi.testclient import TestClient
from app.main import app
from app.security import sign

def client():
    return TestClient(app)


def test_health_and_list():
    with client() as c:
        assert c.get("/health").json()["mock_mode"] is True
        assert len(c.get("/api/reports").json()["reports"]) == 4


def test_exception_flow_pending_to_success():
    with client() as c:
        r = c.get("/api/reports/pending").json()
        sha = r["commit_sha"]
        for fid in [f["id"] for f in r["findings"] if f["action"] == "review"]:
            res = c.post("/api/reports/pending/exceptions",
                         json={"finding_id": fid, "reviewer": "nikhil-0420", "reason": "checked manually", "commit_sha": sha})
            assert res.status_code == 200
        assert res.json()["gate"]["state"] == "success"


def test_unauthorized_and_stale_rejected():
    with client() as c:
        sha = c.get("/api/reports/blocked").json()["commit_sha"]
        bad = c.post("/api/reports/blocked/exceptions",
                     json={"finding_id": "F-006", "reviewer": "mallory", "reason": "trust me", "commit_sha": sha})
        assert bad.status_code == 403
        stale = c.post("/api/reports/blocked/exceptions",
                       json={"finding_id": "F-006", "reviewer": "nikhil-0420", "reason": "ok ok", "commit_sha": "oldsha"})
        assert stale.status_code == 409


def test_webhook_signature_and_replay():
    import json
    with client() as c:
        body = json.dumps({"action": "opened"}).encode()
        assert c.post("/webhooks/github", content=body, headers={"X-Hub-Signature-256": "sha256=bad"}).status_code == 401
        good = "sha256=" + sign("change-me", body)
        h = {"X-Hub-Signature-256": good, "X-GitHub-Delivery": "d-1"}
        assert c.post("/webhooks/github", content=body, headers=h).json().get("accepted")
        assert c.post("/webhooks/github", content=body, headers=h).json().get("duplicate")


def test_audit_endpoint_with_demo_brief():
    with open("../demo/agent-brief.md") as f:
        md = f.read()

    with client() as c:
        resp = c.post("/api/audit", json={
            "repo": "nikhil-0420/citeguard-demo",
            "pr_number": 99,
            "commit_sha": "live-test-sha-1234567890abcdef",
            "markdown": md,
        })
        assert resp.status_code == 202
        report_id = resp.json()["report_id"]
        assert report_id is not None

        rep_resp = c.get(f"/api/reports/{report_id}")
        assert rep_resp.status_code == 200
        report = rep_resp.json()

        assert report["gate"]["state"] == "failure"
        assert report["summary"]["blocked_count"] == 2
        assert report["summary"]["review_count"] == 3
        assert report["summary"]["passed_count"] == 2

        # Check finding specific behaviors
        f_by_id = {f["id"]: f for f in report["findings"]}
        assert f_by_id["F-003"]["action"] == "block"
        assert f_by_id["F-003"]["judgment"]["label"] == "contradicted"

        assert f_by_id["F-005"]["action"] == "block"
        assert f_by_id["F-005"]["reference"]["status"] == "metadata_mismatch"
        assert "CG-EXIST-01" in f_by_id["F-005"]["rules_applied"]

        assert f_by_id["F-006"]["action"] == "review"
        assert f_by_id["F-006"]["reference"]["status"] == "unresolved"
        assert "CG-EXIST-02" in f_by_id["F-006"]["rules_applied"]

        assert f_by_id["F-007"]["action"] == "review"
        assert "CG-TRUST-01" in f_by_id["F-007"]["rules_applied"]

