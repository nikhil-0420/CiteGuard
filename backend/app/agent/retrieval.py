"""SAM: bounded retrieval agent. TODO. Contract with the rest of the system:

  run_agent(claim, reference_hint, budget) -> (Reference, Evidence, list[AgentStep])

Rules (CG-TRUST-01, doc section 4):
  * PERMITTED actions only: reformulate_title_query | resolve_identifier | inspect_more_context |
    stop_insufficient_evidence | fetch_fulltext | judge_claim
  * Application-enforced tool-call budget + deadline (settings.tool_call_budget / audit_deadline_ms).
    Exhausted budget -> stop_insufficient_evidence -> review. NEVER guess.
  * Only hosts in security.ALLOWED_RETRIEVAL_HOSTS; cap response size (security.MAX_RESPONSE_BYTES).
  * Agent output is STRUCTURED data validated by pydantic; it cannot set action/gate/status.
"""
from __future__ import annotations
from ..models import Reference, Evidence, AgentStep


class Budget:
    def __init__(self, max_calls: int, deadline_ms: int) -> None:
        self.max_calls, self.deadline_ms, self.used = max_calls, deadline_ms, 0

    def spend(self) -> bool:
        if self.used >= self.max_calls:
            return False
        self.used += 1
        return True


async def run_agent(claim_text: str, key: str, bib_entry: dict, budget: Budget):
    raise NotImplementedError("Sam: implement Crossref match + one full-text adapter + bounded loop")
