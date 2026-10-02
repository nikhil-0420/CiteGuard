"""SAM/NIKHIL: commit status writer. Only the application boundary (audit service + n8n on its signed request)
may call this (CG-ACTION-01). Maps gate.state -> GitHub state; context = 'CiteGuard'.
POST /repos/{owner}/{repo}/statuses/{sha}  {state, target_url, description (<=140 chars), context}
"""
import httpx
from .config import settings


async def set_commit_status(repo: str, sha: str, state: str, description: str, target_url: str) -> dict:
    if settings.mock_mode or not settings.github_token:
        return {"mock": True, "repo": repo, "sha": sha, "state": state}
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.post(
            f"https://api.github.com/repos/{repo}/statuses/{sha}",
            headers={"Authorization": f"Bearer {settings.github_token}", "Accept": "application/vnd.github+json"},
            json={"state": state, "target_url": target_url, "description": description[:140], "context": "CiteGuard"},
        )
        r.raise_for_status()
        return r.json()
