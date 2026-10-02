import asyncio
from unittest.mock import AsyncMock, patch
import httpx
from app.agent.retrieval import resolve_reference, run_agent, Budget
from app.models import Finding, Reference, Evidence, Judgment
from app.policy import decide_finding, decide_gate


def test_probe_3_reference_database_failure():
    """Probe 3: Reference database failure (Crossref down)
    Expected: Unresolved/error -> review/error, never pass.
    """
    async def _run():
        budget = Budget(12, 30000)
        bib = {
            "title": "A Great Paper On AI",
            "year": 2023,
            "authors": ["Smith"],
            "doi": "10.1000/mock.doi.fail",
        }

        # Mock httpx failure simulating Crossref outage
        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_client.get.side_effect = httpx.ConnectError("Connection to api.crossref.org failed")

        ref, steps = await resolve_reference("smith2023", bib, budget, client=mock_client)
        assert ref.status == "unresolved"
        assert ref.sources_agreeing == []

        # Verify policy behavior: unresolved never passes, routes to review
        f = Finding(
            id="F-001", claim_id="C-001", claim_text="Some claim", line=10, citation_key="smith2023",
            reference=ref,
            evidence=Evidence(availability="unavailable", corpus="none", passages=[]),
            judgment=Judgment(label="unavailable", rationale="Crossref down"),
        )
        action, rules = decide_finding(f)
        assert action == "review"
        assert action != "pass"

        # Gate with this finding must be pending (review), never success
        f.action = action
        gate = decide_gate([f], extraction_complete=True, commit_sha="sha123", technical_error=False, report_url="http://test")
        assert gate.state == "pending"
        assert gate.state != "success"

    asyncio.run(_run())


def test_probe_10_budget_exhausted():
    """Probe 10: Tool-call budget exhausted
    Expected: stop_insufficient_evidence -> review, no guess.
    """
    async def _run():
        # Set budget to 1 call
        budget = Budget(max_calls=1, deadline_ms=30000)
        bib = {
            "title": "Agentic Verification Loops for Scientific Writing",
            "year": 2026,
            "authors": ["Lee"],
        }
        ref, ev, trace = await run_agent(
            "Agentic verification loops reduce errors by 40%.",
            "lee2026agentic",
            bib,
            budget,
        )

        assert budget.is_exhausted()
        assert any(step.action == "stop_insufficient_evidence" for step in trace)
        assert ref.status == "unresolved"

        f = Finding(
            id="F-001", claim_id="C-001", claim_text="Some claim", line=10, citation_key="lee2026agentic",
            reference=ref,
            evidence=ev,
            judgment=Judgment(label="unavailable", rationale="Budget exhausted"),
        )
        action, rules = decide_finding(f)
        assert action == "review"
        assert action != "pass"

    asyncio.run(_run())
