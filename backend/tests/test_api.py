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



