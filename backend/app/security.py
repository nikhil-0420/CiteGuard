"""HMAC verification, replay protection, idempotency (CG-ACTION-01) and untrusted-text hygiene (CG-TRUST-01)."""
from __future__ import annotations
import hmac, hashlib, re, time
from urllib.parse import urlparse

ALLOWED_RETRIEVAL_HOSTS = {"export.arxiv.org", "arxiv.org", "api.crossref.org", "api.openalex.org",
                           "www.ebi.ac.uk"}  # Europe PMC REST lives under ebi.ac.uk
MAX_RESPONSE_BYTES = 2_000_000


def verify_github_signature(secret: str, body: bytes, header: str | None) -> bool:
    if not header or not header.startswith("sha256="):
        return False
    expected = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header)


def sign(secret: str, body: bytes) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def verify_signed(secret: str, body: bytes, header: str | None) -> bool:
    return bool(header) and hmac.compare_digest(sign(secret, body), header)  # type: ignore[arg-type]


def url_allowed(url: str) -> bool:
    """CG-TRUST-01: agent may only call allow-listed https hosts."""
    p = urlparse(url)
    return p.scheme == "https" and (p.hostname or "") in ALLOWED_RETRIEVAL_HOSTS


class SeenEvents:
    """Idempotency: delivery-id + commit. In-memory is fine for the demo."""
    def __init__(self) -> None:
        self._seen: dict[str, float] = {}

    def first_time(self, key: str) -> bool:
        if key in self._seen:
            return False
        self._seen[key] = time.time()
        return True


INJECTION_HINTS = re.compile(r"(ignore (all|previous|the above)|disregard.*instructions|you are now|system prompt|"
                             r"approve this|mark (this )?as supported|set status)", re.I)


def looks_like_injection(text: str) -> bool:
    """Heuristic FLAG only — sources are always treated as data. Used for the demo probe + report note."""
    return bool(INJECTION_HINTS.search(text))
