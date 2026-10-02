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
