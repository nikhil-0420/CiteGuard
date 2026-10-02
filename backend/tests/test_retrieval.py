import pytest
from app.parser import parse_markdown
from app.agent.retrieval import resolve_reference, Budget, compare_metadata, normalize_text


def test_normalize_text():
    assert normalize_text("  Attention   Is All   You Need! ") == "attention is all you need"


def test_compare_metadata_mismatch():
    bib = {"title": "Attention Is All You Need", "year": 2018, "authors": ["Vaswani", "Shazeer", "Parmar"]}
    res = {
        "title": "Attention Is All You Need",
        "year": 2017,
        "authors": ["Vaswani", "Shazeer", "Parmar", "Uszkoreit", "Jones", "Gomez", "Kaiser", "Polosukhin"]
    }
    status, mismatches, note = compare_metadata(bib, res)
    assert status == "metadata_mismatch"
    assert "year" in mismatches
    assert "authors" in mismatches


def test_compare_metadata_match():
    bib = {"title": "Attention Is All You Need", "year": 2017, "authors": ["Vaswani", "Shazeer", "Parmar"]}
    res = {"title": "Attention Is All You Need", "year": 2017, "authors": ["Vaswani", "Shazeer", "Parmar"]}
    status, mismatches, note = compare_metadata(bib, res)
    assert status == "matched"
    assert mismatches == []


def test_demo_references_classification():
    import asyncio
    async def _run():
        with open("../demo/agent-brief.md") as f:
            content = f.read()
        parsed = parse_markdown(content)
        assert parsed.complete

        # vaswani2017 -> matched
        budget = Budget(12, 30000)
        ref_v17, _ = await resolve_reference("vaswani2017", parsed.bibliography["vaswani2017"], budget)
        assert ref_v17.status == "matched"
        assert ref_v17.mismatch_fields == []
        assert "crossref" in ref_v17.sources_agreeing

        # vaswani2018 -> metadata_mismatch (year, authors)
        budget = Budget(12, 30000)
        ref_v18, _ = await resolve_reference("vaswani2018", parsed.bibliography["vaswani2018"], budget)
        assert ref_v18.status == "metadata_mismatch"
        assert "year" in ref_v18.mismatch_fields
        assert "authors" in ref_v18.mismatch_fields

        # lee2026agentic -> unresolved
        budget = Budget(12, 30000)
        ref_lee, _ = await resolve_reference("lee2026agentic", parsed.bibliography["lee2026agentic"], budget)
        assert ref_lee.status == "unresolved"
        assert ref_lee.mismatch_fields == []
        assert ref_lee.sources_agreeing == []
        assert "recent" in (ref_lee.note or "").lower() or "not found" in (ref_lee.note or "").lower()

    asyncio.run(_run())


def test_passage_selection_and_locator():
    from app.agent.retrieval import FullTextDocument, select_passages

    doc = FullTextDocument(
        corpus="arxiv_html",
        raw_text="Abstract: We propose the Transformer, based solely on attention mechanisms. Section 2: Convolutions are omitted.",
        sections=[
            ("Abstract", ["We propose the Transformer, based solely on attention mechanisms."]),
            ("Section 2", ["Convolutions and recurrence are omitted entirely."]),
        ],
    )
    claim = "The Transformer architecture relies solely on attention mechanisms."
    passages = select_passages(claim, doc, max_passages=1)
    assert len(passages) == 1
    assert passages[0].locator.section == "Abstract"
    assert passages[0].locator.paragraph == 1
    assert "Transformer" in passages[0].text
    assert passages[0].quote_validated is True


def test_run_agent_planted_injection():
    import asyncio
    from app.agent.retrieval import run_agent, Budget
    from app.security import looks_like_injection

    async def _run():
        budget = Budget(12, 30000)
        bib = {
            "title": "Notes on Citation Hygiene",
            "authors": ["Doe"],
            "year": 2024,
            "doi": "10.0000/planted.2024.notes"
        }
        ref, ev, trace = await run_agent("Citation hygiene checklists remove all formatting errors.", "doe2024notes", bib, budget)
        assert ref.status == "matched"
        assert ev.availability == "available"
        assert len(ev.passages) == 1
        assert ev.passages[0].quote_validated is True
        assert ev.passages[0].locator.section == "Section 3"
        assert ev.passages[0].locator.paragraph == 4
        assert looks_like_injection(ev.passages[0].text)

    asyncio.run(_run())

