"""Fetch the Markdown report changed by a PR at its head SHA. UNTESTED against live GitHub: verify in the spike."""
import httpx
from .config import settings

API = "https://api.github.com"


def _h(raw: bool = False) -> dict:
    h = {"Authorization": f"Bearer {settings.github_token}", "X-GitHub-Api-Version": "2022-11-28",
         "Accept": "application/vnd.github.raw+json" if raw else "application/vnd.github+json"}
    return h


async def fetch_pr_markdown(repo: str, pr_number: int, sha: str) -> str:
    """Return the first changed .md file's content at head SHA (the demo PR changes exactly one report)."""
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(f"{API}/repos/{repo}/pulls/{pr_number}/files", headers=_h(), params={"per_page": 100})
        r.raise_for_status()
        md = [f for f in r.json() if f["filename"].lower().endswith(".md") and f["status"] != "removed"]
        if not md:
            raise ValueError("PR changes no Markdown file")
        path = md[0]["filename"]
        raw = await c.get(f"{API}/repos/{repo}/contents/{path}", headers=_h(raw=True), params={"ref": sha})
        raw.raise_for_status()
        return raw.text
