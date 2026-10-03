"""SAM/NIKHIL: commit status writer. Only the application boundary (audit service + n8n on its signed request)
may call this (CG-ACTION-01). Maps gate.state -> GitHub state; context = 'CiteGuard'.
POST /repos/{owner}/{repo}/statuses/{sha}  {state, target_url, description (<=140 chars), context}
"""
import httpx
from typing import TYPE_CHECKING
from .config import settings

if TYPE_CHECKING:
    from .models import AuditReport

STICKY_COMMENT_TAG = "<!-- citeguard-audit-comment -->"


def format_pr_comment_markdown(report: "AuditReport") -> str:
    gate_emoji = {
        "success": "✅",
        "pending": "⚠️",
        "failure": "🛑",
        "error": "❌",
    }.get(report.gate.state, "ℹ️")

    lines = [
        f"{STICKY_COMMENT_TAG}",
        f"## {gate_emoji} CiteGuard Governance Gate: {report.gate.state.upper()}",
        "",
        f"**Commit:** `{report.commit_sha[:7]}` · **Gate:** `{report.gate.state}` · **Report:** [{report.report_id}]({report.gate.report_url})",
        "",
        f"> **{report.gate.description}**",
        "",
        "### Summary",
        f"- **Blocked Claims:** {report.summary.blocked_count}",
        f"- **Review Needed:** {report.summary.review_count}",
        f"- **Passed Claims:** {report.summary.passed_count}",
        f"- **Tool Calls Budget:** {report.budget.tool_calls_used}/{report.budget.tool_calls_max} ({report.budget.elapsed_ms}ms elapsed)",
        "",
        "### Findings Table",
        "| ID | Claim | Citation | Status | Rules | Rationale |",
        "|---|---|---|---|---|---|",
    ]

    action_emoji = {"pass": "✅ Pass", "review": "⚠️ Review", "block": "🛑 Block"}
    for f in report.findings:
        claim_snippet = (f.claim_text[:45] + "...") if len(f.claim_text) > 45 else f.claim_text
        claim_snippet = claim_snippet.replace("|", "/")
        act = action_emoji.get(f.action, f.action)
        rules = ", ".join(f.rules_applied) if f.rules_applied else "—"
        rat = f.judgment.rationale.replace("|", "/")
        if len(rat) > 60:
            rat = rat[:57] + "..."
        lines.append(f"| `{f.id}` | {claim_snippet} | `{f.citation_key}` | {act} | `{rules}` | {rat} |")

    lines.extend([
        "",
        "---",
        "*Audited by CiteGuard deterministic policy engine & verified retrieval agent.*",
    ])
    return "\n".join(lines)


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


async def post_or_update_pr_comment(repo: str, pr_number: int, report: "AuditReport") -> dict:
    """Post or update a single sticky review comment on the PR conversation (idempotent)."""
    if settings.mock_mode or not settings.github_token or not pr_number:
        return {"mock": True, "repo": repo, "pr_number": pr_number}

    headers = {
        "Authorization": f"Bearer {settings.github_token}",
        "Accept": "application/vnd.github+json",
    }
    body_md = format_pr_comment_markdown(report)

    try:
        async with httpx.AsyncClient(timeout=15) as c:
            # Search for existing CiteGuard sticky comment
            resp = await c.get(
                f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments",
                headers=headers,
                params={"per_page": 50},
            )
            existing_comment_id = None
            if resp.status_code == 200:
                for comm in resp.json():
                    if STICKY_COMMENT_TAG in comm.get("body", ""):
                        existing_comment_id = comm.get("id")
                        break

            if existing_comment_id:
                up_resp = await c.patch(
                    f"https://api.github.com/repos/{repo}/issues/comments/{existing_comment_id}",
                    headers=headers,
                    json={"body": body_md},
                )
                up_resp.raise_for_status()
                return up_resp.json()
            else:
                cr_resp = await c.post(
                    f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments",
                    headers=headers,
                    json={"body": body_md},
                )
                cr_resp.raise_for_status()
                return cr_resp.json()
    except Exception as exc:
        return {"error": str(exc)}

