import asyncio
from app.agent.judge import parse_judgment_json, judge_claim, validate_quote


def test_validate_quote():
    src = "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms."
    assert validate_quote("the Transformer, based solely on attention", src)
    assert not validate_quote("based solely on recurrent convolutions", src)


def test_malformed_llm_output_handled_gracefully():
    # Probe 2: Malformed LLM output -> label 'unavailable' -> review, no crash
    j1 = parse_judgment_json("Not a json at all, just some words.")
    assert j1.label == "unavailable"

    j2 = parse_judgment_json('{"label": "fabricated", "rationale": "Made up label"}')
    assert j2.label == "unavailable"

    j3 = parse_judgment_json('{"label": "supported"}')  # missing rationale
    assert j3.label == "supported"
    assert len(j3.rationale) > 0

    j4 = parse_judgment_json('```json\n{"label": "contradicted", "rationale": "Figure opposes claim"}\n```')
    assert j4.label == "contradicted"
    assert j4.rationale == "Figure opposes claim"

    # Edge cases: nested braces in rationale string & leading conversation text
    j5 = parse_judgment_json('Here is my judgment:\n```json\n{"label": "supported", "rationale": "Text states {attention is all you need}."}\n```')
    assert j5.label == "supported"
    assert "{attention is all you need}" in j5.rationale



def test_judge_claim_cases():
    async def _run():
        # Case 1: Contradicted
        j1 = await judge_claim(
            "ResNets reach under 2% top-5 error on the ImageNet test set.",
            {"status": "matched"},
            ["An ensemble of these residual nets achieves 3.57% error on the ImageNet test set."]
        )
        assert j1.label == "contradicted"
        assert len(j1.rationale) <= 280

        # Case 2: Partial
        j2 = await judge_claim(
            "BERT improves performance on all natural language processing tasks.",
            {"status": "matched"},
            ["BERT obtains new state-of-the-art results on eleven natural language processing tasks."]
        )
        assert j2.label == "partial"

        # Case 3: Supported
        j3 = await judge_claim(
            "The Transformer architecture relies solely on attention mechanisms, removing recurrence and convolutions.",
            {"status": "matched"},
            ["We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely."]
        )
        assert j3.label == "supported"

        # Case 4: Mismatched reference
        j4 = await judge_claim(
            "Self-attention alone is sufficient to model sequence transduction.",
            {"status": "metadata_mismatch"},
            []
        )
        assert j4.label == "unavailable"

        # Case 5: Unresolved reference
        j5 = await judge_claim(
            "Agentic verification loops reduce unsupported citations in scientific drafts by 40 percent.",
            {"status": "unresolved"},
            []
        )
        assert j5.label == "unavailable"

    asyncio.run(_run())
