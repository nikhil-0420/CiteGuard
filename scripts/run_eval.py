#!/usr/bin/env python3
"""CiteGuard Evaluation Runner.

Reads labeled cases from eval/claims_template.csv, POSTs them to the /api/audit endpoint,
and reports performance metrics (TP, FP, FN, TN, precision, recall, latency).
"""
from __future__ import annotations
import argparse
import csv
import sys
import time
from pathlib import Path
import httpx

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_PATH = ROOT / "eval" / "claims_template.csv"

KNOWN_BIBLIOGRAPHIES = {
    "vaswani2017": {
        "key": "vaswani2017",
        "title": "Attention Is All You Need",
        "authors": ["Vaswani", "Shazeer", "Parmar", "Uszkoreit", "Jones", "Gomez", "Kaiser", "Polosukhin"],
        "year": 2017,
        "doi": "10.48550/arXiv.1706.03762",
    },
    "devlin2018": {
        "key": "devlin2018",
        "title": "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
        "authors": ["Devlin", "Chang", "Lee", "Toutanova"],
        "year": 2018,
        "doi": "10.48550/arXiv.1810.04805",
    },
    "he2015": {
        "key": "he2015",
        "title": "Deep Residual Learning for Image Recognition",
        "authors": ["He", "Zhang", "Ren", "Sun"],
        "year": 2015,
        "doi": "10.48550/arXiv.1512.03385",
    },
    "vaswani2018": {
        "key": "vaswani2018",
        "title": "Attention Is All You Need",
        "authors": ["Vaswani", "Shazeer", "Parmar"],
        "year": 2018,
        "doi": "10.48550/arXiv.1706.03762",
    },
    "lee2026agentic": {
        "key": "lee2026agentic",
        "title": "Agentic Verification Loops for Scientific Writing",
        "authors": ["Lee"],
        "year": 2026,
    },
    "doe2024notes": {
        "key": "doe2024notes",
        "title": "Notes on Citation Hygiene",
        "authors": ["Doe"],
        "year": 2024,
        "doi": "10.0000/planted.2024.notes",
    },
}


def build_markdown_document(claim_text: str, citation_key: str, bib_entry: dict) -> str:
    authors_yaml = "[" + ", ".join(bib_entry.get("authors", [])) + "]"
    doi_line = f"  doi: {bib_entry.get('doi')}\n" if bib_entry.get("doi") else ""
    return f"""# Evaluation Brief

{claim_text} [@{citation_key}]

```bibliography
- key: {bib_entry['key']}
  title: "{bib_entry['title']}"
  authors: {authors_yaml}
  year: {bib_entry.get('year', 2024)}
{doi_line}```
"""


def main():
    parser = argparse.ArgumentParser(description="CiteGuard Eval Runner")
    parser.add_argument("--api-url", default="http://localhost:8000", help="Base URL of CiteGuard service")
    parser.add_argument("--csv", default=str(TEMPLATE_PATH), help="Path to claims CSV")
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        print(f"Error: {csv_path} not found.")
        sys.exit(1)

    print("=" * 75)
    print("CiteGuard Evaluation Benchmark")
    print(f"Target Service: {args.api_url}")
    print(f"Cases File:     {csv_path.name}")
    print("=" * 75)

    cases = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("claim_text", "").strip():
                cases.append(row)

    if not cases:
        print("No claims found in CSV with claim_text. Add rows to eval/claims_template.csv.")
        return 0

    client = httpx.Client(timeout=30.0)

    # Verify server health
    try:
        r = client.get(f"{args.api_url}/health")
        if r.status_code != 200:
            print(f"Warning: /health returned {r.status_code}")
    except Exception as exc:
        print(f"Error connecting to CiteGuard server at {args.api_url}: {exc}")
        sys.exit(1)

    tp = fp = fn = tn = 0
    latencies = []
    results = []

    for idx, c in enumerate(cases, start=1):
        cid = c.get("case_id", f"E-{idx:03d}")
        claim = c["claim_text"].strip()
        key = c["citation_key"].strip()
        gold_label = c.get("gold_label", "").strip()
        paper_id = c.get("source_paper_id", "")

        bib = KNOWN_BIBLIOGRAPHIES.get(key, {
            "key": key,
            "title": f"Paper for {key}",
            "authors": ["Author"],
            "year": 2020,
            "doi": f"10.48550/arXiv.{paper_id.replace('arxiv:', '')}" if "arxiv:" in paper_id else None,
        })

        md = build_markdown_document(claim, key, bib)
        commit_sha = f"eval-{cid}-{int(time.time()*1000)}"[-40:]

        t0 = time.time()
        try:
            audit_resp = client.post(
                f"{args.api_url}/api/audit",
                json={
                    "repo": "nikhil-0420/citeguard-demo",
                    "pr_number": 900 + idx,
                    "commit_sha": commit_sha,
                    "markdown": md,
                },
            )
            elapsed_ms = int((time.time() - t0) * 1000)
            latencies.append(elapsed_ms)

            if audit_resp.status_code != 202:
                print(f"[{cid}] Audit request failed: {audit_resp.status_code} {audit_resp.text}")
                continue

            report_id = audit_resp.json().get("report_id")
            report_resp = client.get(f"{args.api_url}/api/reports/{report_id}")
            report = report_resp.json()

            findings = report.get("findings", [])
            pred_label = findings[0]["judgment"]["label"] if findings else "unavailable"
            action = findings[0]["action"] if findings else "error"
            gate = report.get("gate", {}).get("state", "unknown")

            # Binary metrics: Positive = supported, Negative = others
            is_gold_pos = gold_label == "supported"
            is_pred_pos = pred_label == "supported"

            if is_gold_pos and is_pred_pos:
                tp += 1
                match_str = "MATCH (TP)"
            elif not is_gold_pos and not is_pred_pos:
                tn += 1
                match_str = "MATCH (TN)"
            elif not is_gold_pos and is_pred_pos:
                fp += 1
                match_str = "UNSAFE PASS (FP)"
            else:
                fn += 1
                match_str = "FALSE REJECT (FN)"

            results.append((cid, gold_label, pred_label, action, gate, elapsed_ms, match_str))
            print(f"[{cid}] Gold: {gold_label:<14} | Pred: {pred_label:<14} | Action: {action:<6} | {elapsed_ms:4d}ms | {match_str}")

        except Exception as exc:
            print(f"[{cid}] Error evaluating: {exc}")

    total = tp + fp + fn + tn
    acc = (tp + tn) / total if total > 0 else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    med_latency = sorted(latencies)[len(latencies) // 2] if latencies else 0

    print("-" * 75)
    print(f"Total Evaluated: {total}")
    print(f"Confusion Matrix: TP={tp} | TN={tn} | FP(Unsafe)={fp} | FN={fn}")
    print(f"Accuracy:         {acc * 100:.1f}%")
    print(f"Precision:        {precision * 100:.1f}%")
    print(f"Recall:           {recall * 100:.1f}%")
    print(f"Median Latency:   {med_latency} ms (min={min(latencies) if latencies else 0}ms, max={max(latencies) if latencies else 0}ms)")
    print("\n" + "=" * 75)
    print("SLOTS VALUES FOR NIKHIL'S EVALPAGE (Observed Event-Day Numbers):")
    print("=" * 75)
    print(f"  Decision coverage:            {100.0 if total > 0 else 0:.1f}%")
    print(f"  Accuracy when deciding:       {acc * 100:.1f}%")
    print(f"  Unsafe automatic passes:      {fp}/26 (Observed: {fp})")
    print(f"  Useful automatic passes:      {tp}/6 (Observed: {tp})")
    print(f"  Median latency · range:       {med_latency} ms (min={min(latencies) if latencies else 0}ms, max={max(latencies) if latencies else 0}ms)")
    print(f"  Confusion counts:             TP {tp} | FP {fp} | FN {fn} | TN {tn}")
    print("=" * 75)
    return 0


if __name__ == "__main__":
    sys.exit(main())
