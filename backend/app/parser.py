"""Frozen input contract parser (deterministic).

Documented syntax:
  * Citation marker:  [@key]    — exactly ONE marker per claim sentence (one atomic claim per marker).
  * Bibliography:     a fenced block  ```bibliography  (YAML list: key, title, authors[], year, doi)
Anything else (multiple markers in one sentence, unknown key, marker-count mismatch) is recorded as an
extraction issue -> extraction.complete = False -> gate can never pass (CG-GATE-01).
"""
from __future__ import annotations
import re
import yaml
from dataclasses import dataclass, field

MARKER_RE = re.compile(r"\[@([A-Za-z0-9_:\-\.]+)\]")
BIB_RE = re.compile(r"```bibliography\s*\n(.*?)```", re.DOTALL)
# split after sentence end unless a marker follows; also split after a marker when a new capitalised sentence starts
SENT_SPLIT = re.compile(r"(?<=[.!?])\s+(?!\[@)|(?<=\])\s+(?=[A-Z])")


@dataclass
class Claim:
    claim_id: str
    text: str
    line: int
    key: str


@dataclass
class ParseResult:
    claims: list[Claim] = field(default_factory=list)
    bibliography: dict[str, dict] = field(default_factory=dict)
    markers_found: int = 0
    issues: list[str] = field(default_factory=list)

    @property
    def complete(self) -> bool:
        return not self.issues and self.markers_found > 0 and len(self.claims) == self.markers_found


def parse_markdown(md: str) -> ParseResult:
    res = ParseResult()

    m = BIB_RE.search(md)
    body = md
    if not m:
        res.issues.append("No ```bibliography block found")
    else:
        body = md[: m.start()] + md[m.end():]
        try:
            entries = yaml.safe_load(m.group(1)) or []
            for e in entries:
                res.bibliography[str(e["key"])] = e
        except Exception as exc:  # malformed bibliography
            res.issues.append(f"Bibliography unparseable: {exc}")

    # count ALL markers first (reconciliation baseline), including inside code spans — conservative
    res.markers_found = len(MARKER_RE.findall(body))

    n = 0
    in_code = False
    for lineno, line in enumerate(md.splitlines(), start=1):
        if line.strip().startswith("```"):
            in_code = not in_code
            continue
        if in_code:
            continue
        for sent in SENT_SPLIT.split(line):
            keys = MARKER_RE.findall(sent)
            if not keys:
                continue
            if len(keys) > 1:
                res.issues.append(f"Line {lineno}: multiple citation markers in one sentence (non-atomic claim)")
                continue
            key = keys[0]
            if key not in res.bibliography:
                res.issues.append(f"Line {lineno}: marker [@{key}] has no bibliography entry")
                continue
            n += 1
            text = MARKER_RE.sub("", sent).strip()
            res.claims.append(Claim(claim_id=f"C-{n:03d}", text=text, line=lineno, key=key))

    if res.markers_found == 0:
        res.issues.append("No citation markers found")
    elif len(res.claims) != res.markers_found and not res.issues:
        res.issues.append(f"Marker/claim count mismatch: {res.markers_found} markers vs {len(res.claims)} claims")
    return res
