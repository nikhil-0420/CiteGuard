import { useEffect, useState } from "react";
import { isMock, listReports } from "./api";
import type { ReportListItem } from "./contract/types";
import ReportPage from "./pages/ReportPage";
import EvalPage from "./pages/EvalPage";

const params = () => new URLSearchParams(window.location.search);

export default function App() {
  const [view, setView] = useState<"report" | "eval">((params().get("view") as "eval") ?? "report");
  const [id, setId] = useState(params().get("report") ?? "blocked");
  const [list, setList] = useState<ReportListItem[]>([]);

  useEffect(() => { listReports().then(setList).catch(() => setList([])); }, []);
  useEffect(() => {
    const p = new URLSearchParams({ report: id, ...(view === "eval" ? { view } : {}) });
    window.history.replaceState(null, "", `?${p}`);
  }, [id, view]);

  return (
    <div className="container">
      <div className="topbar">
        <div className="brand"><div className="logo">C</div><div><h1>CiteGuard</h1><div className="muted">Agent writes. CiteGuard governs.</div></div></div>
        <div className="tabs">
          <button className={`tab ${view === "report" ? "active" : ""}`} onClick={() => setView("report")}>Report</button>
          <button className={`tab ${view === "eval" ? "active" : ""}`} onClick={() => setView("eval")}>Results</button>
          {isMock && <span className="chip cached" title="Reading /public/mock/*.json">mock data</span>}
        </div>
      </div>
      {view === "report" && (
        <>
          {list.length > 0 && (
            <div className="tabs" style={{ marginBottom: 16 }}>
              {list.map((x) => (
                <button key={x.report_id} className={`tab ${id === x.report_id ? "active" : ""}`} onClick={() => setId(x.report_id)}>
                  {x.report_id} · {x.gate_state}
                </button>
              ))}
            </div>
          )}
          <ReportPage id={id} />
        </>
      )}
      {view === "eval" && <EvalPage />}
    </div>
  );
}
