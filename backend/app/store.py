"""In-memory report store, pre-seeded from contract/mock in MOCK_MODE. Swap for SQLite/JSON file if needed."""
from __future__ import annotations
import json
from pathlib import Path
from .models import AuditReport
from .config import settings


class Store:
    def __init__(self) -> None:
        self.reports: dict[str, AuditReport] = {}

    def load_mocks(self) -> None:
        for p in sorted(Path(settings.mock_dir).glob("report-*.json")):
            r = AuditReport.model_validate(json.loads(p.read_text()))
            self.reports[r.report_id] = r

    def put(self, r: AuditReport) -> None:
        self.reports[r.report_id] = r

    def get(self, rid: str) -> AuditReport | None:
        return self.reports.get(rid)


store = Store()
