import { useState, useEffect, useRef } from "react";









export default function DocumentViewer({
  markdown,
  findings,
  selectedFindingId,
  onSelectFinding
}) {
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("raw") === "1" || params.get("mode") === "raw") return "raw";
    }
    return "rendered";
  });
  const activeClaimRef = useRef(null);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (mode === "raw") {
        params.set("mode", "raw");
      } else {
        params.delete("mode");
      }
      window.history.replaceState(null, "", `?${params.toString()}`);
    }
  };

  // Auto-scroll selected finding into view when it changes
  useEffect(() => {
    if (activeClaimRef.current) {
      activeClaimRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedFindingId, viewMode]);

  // Separate body text from ```bibliography fence
  const bibSplit = markdown.split(/```bibliography/);
  const bodyText = bibSplit[0] || markdown;
  const bibText = bibSplit.length > 1 ? bibSplit[1].replace(/```$/, "") : "";

  // Line index mapping for Raw view
  const rawLines = markdown.split("\n");
  const findingsByLine = new Map();
  findings.forEach((f) => {
    const list = findingsByLine.get(f.line) || [];
    list.push(f);
    findingsByLine.set(f.line, list);
  });

  // Action badge styles
  const getActionBadge = (action) => {
    switch (action) {
      case "block":
        return "bg-red-50 text-red-700 border-red-200";
      case "review":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--cg-surface)] border border-[var(--cg-line)] rounded-lg shadow-xs overflow-hidden">
      {/* Viewer Header / Sub-tabs */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--cg-surface-subtle)] border-b border-[var(--cg-line)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--cg-ink)] uppercase tracking-wider font-mono">
            Document View
          </span>
          <span className="text-xs text-[var(--cg-ink-muted)]">
            ({findings.length} audited claims)
          </span>
        </div>
        <div className="flex items-center bg-[var(--cg-surface-subtle)] p-0.5 rounded-md border border-[var(--cg-line)]">
          <button
            type="button"
            onClick={() => handleViewModeChange("rendered")}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
            viewMode === "rendered" ?
            "bg-[var(--cg-surface)] text-[var(--cg-ink)] shadow-xs" :
            "text-[var(--cg-ink-muted)] hover:text-[var(--cg-ink)]"}`
            }>
            
            Rendered
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange("raw")}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-all font-mono ${
            viewMode === "raw" ?
            "bg-[var(--cg-surface)] text-[var(--cg-ink)] shadow-xs" :
            "text-[var(--cg-ink-muted)] hover:text-[var(--cg-ink)]"}`
            }>
            
            Raw Markdown
          </button>
        </div>
      </div>

      {/* Viewer Content Area */}
      <div className="flex-1 overflow-y-auto p-5 text-[14.5px] leading-relaxed">
        {viewMode === "rendered" ?
        <div className="max-w-2xl mx-auto space-y-4">
            {(() => {
            let currentLineNum = 1;
            return bodyText.split("\n\n").map((block, bIdx) => {
              const blockLines = block.split("\n");
              const numLinesInBlock = blockLines.length;
              const startLineNum = currentLineNum;
              currentLineNum += numLinesInBlock + 1;

              const trimmed = block.trim();
              if (!trimmed) return null;

              if (trimmed.startsWith("# ")) {
                return (
                  <h1
                    key={bIdx}
                    className="text-xl font-bold text-[var(--cg-ink)] pb-2 border-b border-[var(--cg-line)] tracking-tight">
                    
                      {trimmed.replace("# ", "")}
                    </h1>);

              }

              if (trimmed.startsWith("## ")) {
                return (
                  <h2
                    key={bIdx}
                    className="text-base font-semibold text-[var(--cg-ink)] mt-5 mb-1 tracking-tight">
                    
                      {trimmed.replace("## ", "")}
                    </h2>);

              }

              if (trimmed.startsWith("> ")) {
                return (
                  <blockquote
                    key={bIdx}
                    className="border-l-3 border-[var(--cg-accent)] pl-3 py-1 bg-[var(--cg-surface-subtle)] text-xs text-[var(--cg-ink-muted)] rounded-r my-2">
                    
                      {blockLines.map((line, lIdx) =>
                    <p key={lIdx}>{line.replace(/^>\s*/, "")}</p>
                    )}
                    </blockquote>);

              }

              // Paragraph containing claims
              return (
                <div key={bIdx} className="space-y-2">
                    {blockLines.map((line, lIdx) => {
                    if (!line.trim()) return null;

                    const absoluteLineNum = startLineNum + lIdx;
                    const lineFindings = findingsByLine.get(absoluteLineNum) || [];

                    // Using the first finding for the claim rendering, if multiple we can just render the first's box
                    const matchedFinding = lineFindings.length > 0 ? lineFindings[0] : undefined;
                    const isSelected = lineFindings.some((f) => f.id === selectedFindingId);
                    const activeFinding = isSelected ? lineFindings.find((f) => f.id === selectedFindingId) : matchedFinding;

                    if (activeFinding) {
                      return (
                        <div
                          key={lIdx}
                          ref={isSelected ? activeClaimRef : null}
                          onClick={() => onSelectFinding(activeFinding.id)}
                          className={`group p-2 rounded-md border transition-all cursor-pointer ${
                          isSelected ?
                          "bg-[var(--cg-accent-subtle)] border-[var(--cg-accent)] shadow-xs" :
                          "bg-[var(--cg-surface)] border-[var(--cg-line)] hover:border-[var(--cg-accent)]/50 hover:bg-[var(--cg-surface-subtle)]"}`
                          }>
                          
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-[var(--cg-ink)] font-normal leading-normal">
                                {line.replace(/\[@[A-Za-z0-9_\-:]+\]/, "")}
                                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--cg-surface-subtle)] text-[var(--cg-ink-muted)] ml-1 font-medium">
                                  [@{activeFinding.citation_key}]
                                </span>
                              </p>
                              <span
                              className={`shrink-0 inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium rounded border ${getActionBadge(
                                activeFinding.action
                              )}`}>
                              
                                {activeFinding.id} &bull; {activeFinding.action.toUpperCase()}
                              </span>
                            </div>
                          </div>);

                    }

                    return (
                      <p key={lIdx} className="text-[var(--cg-ink)]">
                          {line}
                        </p>);

                  })}
                  </div>);

            });
          })()}

            {/* Clean Formatted Bibliography section */}
            {bibText &&
          <div className="mt-8 pt-4 border-t border-[var(--cg-line)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-mono font-semibold uppercase text-[var(--cg-ink-muted)] tracking-wider">
                    Fenced Bibliography Manifest (Unannotated Metadata)
                  </h3>
                  <span className="text-[11px] text-[var(--cg-ink-muted)] bg-[var(--cg-surface-subtle)] px-2 py-0.5 rounded font-mono">
                    Source Anchors Only
                  </span>
                </div>
                <div className="bg-[var(--cg-surface-subtle)] border border-[var(--cg-line)] rounded-md p-3 text-xs font-mono text-[var(--cg-ink-muted)] space-y-2">
                  <div className="text-[11px] text-[var(--cg-ink-muted)] italic mb-2">
                    Note: Claim annotations attach exclusively to body sentences above; bibliography entries remain unannotated.
                  </div>
                  <pre className="text-xs text-[var(--cg-ink-muted)] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {bibText.trim()}
                  </pre>
                </div>
              </div>
          }
          </div> : (

        /* Raw Markdown View with original line coordinates */
        <div className="font-mono text-xs text-[var(--cg-ink)] max-w-full">
            <div className="bg-[var(--cg-surface)] border border-[var(--cg-line)] rounded-md p-3">
              {rawLines.map((lineText, idx) => {
              const lineNum = idx + 1;
              const lineFindings = findingsByLine.get(lineNum) || [];
              const isSelected = lineFindings.some((f) => f.id === selectedFindingId);

              return (
                <div
                  key={lineNum}
                  ref={isSelected ? activeClaimRef : null}
                  className={`flex items-start py-0.5 px-1 rounded transition-colors ${
                  isSelected ?
                  "bg-[var(--cg-accent-subtle)] text-[var(--cg-accent)] font-medium" :
                  "hover:bg-[var(--cg-surface-subtle)]"}`
                  }>
                  
                    <span className="w-9 shrink-0 select-none text-[var(--ink-faint)] text-right pr-3 font-mono text-[11px]">
                      {lineNum}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap break-all">
                      {lineText || " "}
                    </span>
                    {lineFindings.length > 0 &&
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                        {lineFindings.map((f) =>
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onSelectFinding(f.id)}
                      className={`px-1.5 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${getActionBadge(
                        f.action
                      )}`}
                      title={`Jump to finding ${f.id}`}>
                      
                            {f.id} &bull; {f.action.toUpperCase()}
                          </button>
                    )}
                      </div>
                  }
                  </div>);

            })}
            </div>
          </div>)
        }
      </div>
    </div>);

}