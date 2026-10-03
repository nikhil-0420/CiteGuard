# Corpus Decision: arXiv HTML

**Date:** Fri 2 Oct 2026  
**Owner:** Sam (Backend Lead)  
**Status:** Decided (`arxiv_html`)

---

## 1. Rule and Evaluation
Per `docs/BUILD_PLAN.md` (Section S3):
> Can arXiv HTML give clean section text? Rule: >= 8/10 clean -> arXiv, else Europe PMC with claims checkable by non-experts.

We ran `scripts/corpus_spike.py` on 10 prominent computer science and machine learning research papers on arXiv (spanning from 2015 to 2023):

| Paper ID | Title | Sections Extracted | Paragraphs Extracted | Result |
|---|---|---|---|---|
| `1706.03762` | *Attention Is All You Need* (Vaswani et al., 2017) | 27 | 61 | **PASS** |
| `1810.04805` | *BERT* (Devlin et al., 2018) | 43 | 105 | **PASS** |
| `1512.03385` | *ResNet* (He et al., 2015) | 14 | 66 | **PASS** |
| `2005.14165` | *GPT-3* (Brown et al., 2020) | 54 | 314 | **PASS** |
| `2103.00020` | *CLIP* (Radford et al., 2021) | 50 | 165 | **PASS** |
| `2203.02155` | *InstructGPT* (Ouyang et al., 2022) | 75 | 438 | **PASS** |
| `2210.03629` | *ReAct* (Yao et al., 2022) | 31 | 341 | **PASS** |
| `2303.08774` | *GPT-4* (OpenAI, 2023) | 29 | 198 | **PASS** |
| `2305.18290` | *Direct Preference Optimization* (Rafailov et al., 2023) | 41 | 115 | **PASS** |
| `2106.09685` | *LoRA* (Hu et al., 2021) | 38 | 80 | **PASS** |

**Observed clean rate:** 10/10 (100%), exceeding the 8/10 threshold.

---

## 2. Decision
We will use **`arxiv_html`** as the single full-text corpus:
- **Corpus name in API contract:** `"arxiv_html"` (matches `contract/types.ts` and `app/models.py`).
- **Endpoint:** `https://arxiv.org/html/{arxiv_id}` (allowed in `security.ALLOWED_RETRIEVAL_HOSTS`).
- **HTML structure:** Standard ar5iv/arXiv HTML with `ltx_section`, `ltx_p`, standard headings (`<h2>`, `<h3>`), and abstract sections.
- **Locators:** Clear section headings and paragraph indices are directly derivable.
- **Contract fit:** Matches the mock data in `contract/mock/report-blocked.json` where `"corpus": "arxiv_html"`.
