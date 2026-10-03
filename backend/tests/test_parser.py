from app.parser import parse_markdown

GOOD = """# Brief
Transformers use only attention. [@vaswani2017]
BERT is bidirectional. [@devlin2018]

```bibliography
- key: vaswani2017
  title: Attention Is All You Need
  year: 2017
- key: devlin2018
  title: BERT
  year: 2018
```
"""


def test_complete_extraction():
    r = parse_markdown(GOOD)
    assert r.complete and len(r.claims) == 2 and r.markers_found == 2
    assert r.claims[0].text == "Transformers use only attention."


def test_multiple_markers_in_one_sentence_incomplete():
    r = parse_markdown(GOOD.replace("only attention. [@vaswani2017]", "only attention. [@vaswani2017] [@devlin2018]"))
    assert not r.complete and any("multiple citation markers" in i for i in r.issues)


def test_unknown_key_incomplete():
    r = parse_markdown(GOOD.replace("[@devlin2018]", "[@ghost2020]", 1))
    assert not r.complete


def test_no_markers_never_complete():
    r = parse_markdown("# empty\n\n```bibliography\n- key: a\n  title: A\n```\n")
    assert not r.complete


def test_no_bibliography_incomplete():
    assert not parse_markdown("Claim. [@x]").complete
