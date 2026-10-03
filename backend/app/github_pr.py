"""Fetch the Markdown report changed by a PR at its head SHA. UNTESTED against live GitHub: verify in the spike."""
import httpx
from .config import settings

API = "https://api.github.com"


def _h(raw: bool = False) -> dict:
    h = {"Authorization": f"Bearer {settings.github_token}", "X-GitHub-Api-Version": "2022-11-28",
         "Accept": "application/vnd.github.raw+json" if raw else "application/vnd.github+json"}
    return h


async def fetch_pr_markdown(repo: str, pr_number: int, sha: str) -> str:
    """Return the changed Markdown report under demo/ at head SHA.
    Fails with a clear ValueError if there are zero or more than one Markdown file under demo/."""
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(f"{API}/repos/{repo}/pulls/{pr_number}/files", headers=_h(), params={"per_page": 100})
        r.raise_for_status()
        files = r.json()
        demo_md = [
            f for f in files
            if f.get("filename", "").lower().endswith(".md")
            and f.get("filename", "").lower().startswith("demo/")
            and f.get("status") != "removed"
        ]
        if len(demo_md) == 0:
            raise ValueError("PR changes no Markdown file under demo/")
        if len(demo_md) > 1:
            raise ValueError(f"PR changes multiple Markdown files under demo/ ({len(demo_md)} found); expected exactly one")

        path = demo_md[0]["filename"]
        raw = await c.get(f"{API}/repos/{repo}/contents/{path}", headers=_h(raw=True), params={"ref": sha})
        raw.raise_for_status()
        return raw.text


async def verify_pr_approval(repo: str, pr_number: int, commit_sha: str, reviewer: str) -> bool:
    """
    Verify that `reviewer` has a valid, uncancelled GitHub approval on `repo#pr_number` for `commit_sha`.
    - Handles pagination over all reviews.
    - Tracks each reviewer's latest meaningful review state:
      'APPROVED' -> approval
      'CHANGES_REQUESTED', 'DISMISSED' -> cancels earlier approval
      'COMMENTED' -> does not cancel earlier approval
    - Requires matching commit SHA and allowlisted reviewer.
    - If GitHub cannot be reached, fails closed (returns False).
    - If in mock_mode without a github_token, skips live check.
    """
    reviewer_clean = reviewer.strip().lower()
    if reviewer_clean not in settings.allowlist:
        return False

    if settings.mock_mode and not settings.github_token:
        return True

    try:
        async with httpx.AsyncClient(timeout=20) as c:
            page = 1
            latest_meaningful_review = None

            while True:
                r = await c.get(
                    f"{API}/repos/{repo}/pulls/{pr_number}/reviews",
                    headers=_h(),
                    params={"per_page": 100, "page": page},
                )
                r.raise_for_status()
                reviews = r.json()
                if not reviews:
                    break

                for rev in reviews:
                    user = rev.get("user", {}).get("login", "").strip().lower()
                    if user != reviewer_clean:
                        continue
                    state = rev.get("state", "").upper()
                    if state in ("APPROVED", "CHANGES_REQUESTED", "DISMISSED"):
                        latest_meaningful_review = rev

                if len(reviews) < 100:
                    break
                page += 1

            if not latest_meaningful_review:
                return False

            return (
                latest_meaningful_review.get("state", "").upper() == "APPROVED"
                and latest_meaningful_review.get("commit_id") == commit_sha
            )
    except Exception:
        return False

