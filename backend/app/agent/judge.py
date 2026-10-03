"""Deterministic quote validation (provenance, NOT entailment). The LLM judging now happens inside Nuroen."""
import re


def normalize(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip().lower()


def validate_quote(quote: str, source_text: str) -> bool:
    return normalize(quote) in normalize(source_text)
