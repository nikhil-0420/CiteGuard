import json, pathlib
from app.models import AuditReport, Exception_
from app.policy import decide_finding, build_report_fields

MOCK = pathlib.Path(__file__).resolve().parents[2] / "contract" / "mock"


def load(name):
    return AuditReport.model_validate(json.loads((MOCK / f"report-{name}.json").read_text()))


def test_blocked_report_is_failure():
    r = load("blocked")
    assert r.gate.state == "failure"
    assert {f.id for f in r.findings if f.action == "block"} == {"F-003", "F-005"}


def test_unresolved_recent_is_review_never_block():
    f = next(x for x in load("blocked").findings if x.id == "F-006")
    action, rules = decide_finding(f)
    assert action == "review" and "CG-EXIST-02" in rules


def test_injection_text_cannot_pass():
    f = next(x for x in load("blocked").findings if x.id == "F-007")
    action, rules = decide_finding(f)
    assert action == "review" and "CG-TRUST-01" in rules


def test_supported_with_validated_quote_passes():
    f = next(x for x in load("blocked").findings if x.id == "F-001")
    assert decide_finding(f)[0] == "pass"


def test_supported_with_unvalidated_quote_goes_to_review():
    f = next(x for x in load("blocked").findings if x.id == "F-001").model_copy(deep=True)
    f.evidence.passages[0].quote_validated = False
    assert decide_finding(f)[0] == "review"


def test_passed_report_success_with_exceptions_preserving_original():
    r = load("passed")
    assert r.gate.state == "success"
    assert all(f.exception.original_action == "review" for f in r.findings if f.exception)


def test_exception_on_wrong_commit_does_not_clear():
    r = load("passed")
    for f in r.findings:
        if f.exception:
            f.exception.commit_sha = "deadbeef"
    _, _, gate = build_report_fields(r.findings, 4, True, r.commit_sha, "u")
    assert gate.state == "pending"


def test_incomplete_extraction_never_passes():
    r = load("passed")
    _, _, gate = build_report_fields(r.findings, 4, False, r.commit_sha, "u")
    assert gate.state == "error"


def test_empty_findings_never_passes():
    _, _, gate = build_report_fields([], 0, True, "c", "u")
    assert gate.state == "error"


def test_technical_error_never_passes():
    r = load("passed")
    _, _, gate = build_report_fields(r.findings, 4, True, r.commit_sha, "u", technical_error=True)
    assert gate.state == "error"

