#!/usr/bin/env python3
"""Corpus spike: fetches 10 arXiv papers' HTML and reports how many yield clean section text.

Rule (BUILD_PLAN.md): >= 8/10 clean -> arXiv, else Europe PMC.
"""
from __future__ import annotations
import re
import sys
import httpx
from html.parser import HTMLParser

PAPERS = [
    ("1706.03762", "Attention Is All You Need (Vaswani et al., 2017)"),
    ("1810.04805", "BERT (Devlin et al., 2018)"),
    ("1512.03385", "ResNet (He et al., 2015)"),
    ("2005.14165", "GPT-3 (Brown et al., 2020)"),
    ("2103.00020", "CLIP (Radford et al., 2021)"),
    ("2203.02155", "InstructGPT (Ouyang et al., 2022)"),
    ("2210.03629", "ReAct (Yao et al., 2022)"),
    ("2303.08774", "GPT-4 (OpenAI, 2023)"),
    ("2305.18290", "Direct Preference Optimization (Rafailov et al., 2023)"),
    ("2106.09685", "LoRA (Hu et al., 2021)"),
]

USER_AGENT = "CiteGuard-CorpusSpike/1.0 (mailto:citeguard-research@example.com)"


class HTMLSectionExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.sections: list[dict] = []
        self.current_section = "Preamble"
        self.current_tag = None
        self.buf: list[str] = []
        self.in_heading = False
        self.heading_level = 0
        self.in_paragraph = False
        self.paragraphs: list[str] = []
        self.skip_tags = {"script", "style", "nav", "footer"}
        self.in_skip = False

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        classes = attrs_dict.get("class", "").split()

        if tag in self.skip_tags:
            self.in_skip = True
            return

        if re.match(r"^h[1-6]$", tag) or "ltx_title_section" in classes or "ltx_title_abstract" in classes:
            self.in_heading = True
            self.buf = []
        elif tag == "p" or "ltx_p" in classes:
            self.in_paragraph = True
            self.buf = []
        elif "ltx_section" in classes:
            pass

    def handle_endtag(self, tag):
        if tag in self.skip_tags:
            self.in_skip = False
            return

        if self.in_heading and re.match(r"^h[1-6]$", tag):
            heading_text = " ".join("".join(self.buf).split())
            if heading_text and len(heading_text) < 120:
                # Save previous section if it had content
                if self.paragraphs:
                    self.sections.append({
                        "section": self.current_section,
                        "paragraphs": self.paragraphs,
                    })
                    self.paragraphs = []
                self.current_section = heading_text
            self.in_heading = False
            self.buf = []
        elif self.in_paragraph and (tag == "p" or tag in ("div", "span")):
            para_text = " ".join("".join(self.buf).split())
            if para_text and len(para_text) > 30:
                self.paragraphs.append(para_text)
            self.in_paragraph = False
            self.buf = []

    def handle_data(self, data):
        if not self.in_skip and (self.in_heading or self.in_paragraph):
            self.buf.append(data)

    def close(self):
        super().close()
        if self.paragraphs:
            self.sections.append({
                "section": self.current_section,
                "paragraphs": self.paragraphs,
            })


def check_paper(arxiv_id: str, title: str, client: httpx.Client) -> tuple[bool, str, int, int]:
    url = f"https://arxiv.org/html/{arxiv_id}"
    try:
        resp = client.get(url, follow_redirects=True, timeout=20.0)
        if resp.status_code != 200:
            return False, f"HTTP {resp.status_code}", 0, 0

        parser = HTMLSectionExtractor()
        parser.feed(resp.text)
        parser.close()

        num_sections = len(parser.sections)
        total_paras = sum(len(s["paragraphs"]) for s in parser.sections)

        # Check quality criteria:
        # - Has at least 3 sections (e.g. Abstract / Intro / etc.)
        # - Has at least 10 readable paragraphs
        # - Non-empty text content
        if num_sections >= 3 and total_paras >= 10:
            return True, "Clean sections extracted", num_sections, total_paras
        else:
            return False, f"Too few sections ({num_sections}) or paragraphs ({total_paras})", num_sections, total_paras

    except Exception as exc:
        return False, f"Error: {exc}", 0, 0


def main():
    print("=" * 70)
    print("CiteGuard Corpus Spike: arXiv HTML Full-Text Feasibility")
    print("Threshold rule: >= 8/10 clean -> arXiv; else Europe PMC")
    print("=" * 70)

    clean_count = 0
    results = []

    with httpx.Client(headers={"User-Agent": USER_AGENT}) as client:
        for arxiv_id, name in PAPERS:
            clean, reason, sec_cnt, para_cnt = check_paper(arxiv_id, name, client)
            status_str = "PASS" if clean else "FAIL"
            if clean:
                clean_count += 1
            results.append((arxiv_id, name, clean, reason, sec_cnt, para_cnt))
            print(f"[{status_str}] {arxiv_id} - {name[:40]:<40} | Secs: {sec_cnt:2d} | Paras: {para_cnt:3d} | {reason}")

    print("-" * 70)
    print(f"Summary: {clean_count} / {len(PAPERS)} papers yielded clean section text ({clean_count * 10}%).")
    decision = "arxiv_html" if clean_count >= 8 else "europe_pmc"
    print(f"Spike Decision: {'arXiv HTML (>= 8/10 clean)' if decision == 'arxiv_html' else 'Europe PMC (< 8/10 clean)'}")
    print("=" * 70)
    return 0 if clean_count >= 8 else 1


if __name__ == "__main__":
    sys.exit(main())
