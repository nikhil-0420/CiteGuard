"""Report store: persisted atomically to data/reports, pre-seeded from contract/mock in MOCK_MODE without overwriting."""
from __future__ import annotations
import json, os
from pathlib import Path
from .models import AuditReport
from .config import settings


class Store:
    def __init__(self) -> None:
        self.reports: dict[str, AuditReport] = {}
        self.data_dir = Path(__file__).resolve().parent.parent / "data" / "reports"
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def load_persisted(self) -> None:
        if not self.data_dir.exists():
            return
        for p in sorted(self.data_dir.glob("*.json")):
            try:
                r = AuditReport.model_validate(json.loads(p.read_text(encoding="utf-8", errors="replace")))
                self.reports[r.report_id] = r
            except Exception:
                continue

    def load_mocks(self) -> None:
        for p in sorted(Path(settings.mock_dir).glob("report-*.json")):
            r = AuditReport.model_validate(json.loads(p.read_text(encoding="utf-8", errors="replace")))
            # Do not overwrite fresher/persisted reports
            if r.report_id not in self.reports:
                self.reports[r.report_id] = r

    def put(self, r: AuditReport) -> None:
        self.reports[r.report_id] = r
        try:
            target = self.data_dir / f"{r.report_id}.json"
            tmp = self.data_dir / f"{r.report_id}.tmp.{os.getpid()}"
            tmp.write_text(r.model_dump_json(indent=2), encoding="utf-8")
            os.replace(tmp, target)
        except Exception:
            pass

    def get(self, rid: str) -> AuditReport | None:
        return self.reports.get(rid)


store = Store()

