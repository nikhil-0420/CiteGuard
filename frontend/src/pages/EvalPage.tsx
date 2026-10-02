// NIKHIL (event day, ~4:00–5:00 block): replace each "[x]" slot with an OBSERVED value only.
// Never invent a number. Keep the caveats on screen.
const SLOTS: [string, string][] = [
  ["Dataset sizes", "[104 refs] · [40 claim cases: 8 dev / 32 held-out] · [12 probes]"],
  ["Semantic accuracy (abstentions count as not correct)", "[correct]/24"],
  ["Decision coverage", "[x]%"],
  ["Accuracy when deciding", "[x]%"],
  ["Unsafe automatic passes", "[x]/26"],
  ["Useful automatic passes", "[x]/6"],
  ["Correct abstentions (simulated retrieval failures)", "[x]/8"],
  ["Workflow / governance checks", "[x]/12"],
  ["Median latency · range · timeouts · cost", "[x] s · [min–max] · [x] · INR/USD [x]"],
  ["Reference benchmark confusion counts (historical published comparison)", "TP [x] FP [x] FN [x] TN [x] · unresolved [x]"],
];
const CAVEATS = [
  "Small curated sample; held-out cases are dependent at the paper level.",
  "Synthetic cases are reported separately from natural ones.",
  "Simulated outages are not measured paywall coverage.",
  "No general fabrication-detection claim. Zero observed unsafe passes does not mean zero risk.",
  "No adoption or time-saving claim unless tested.",
];

export default function EvalPage() {
  return (
    <div className="stack">
      <div className="card">
        <h2>Results (fill with observed values only)</h2>
        <table>
          <thead><tr><th>Measure</th><th>Observed</th></tr></thead>
          <tbody>{SLOTS.map(([k, v]) => <tr key={k}><td>{k}</td><td className="slot">{v}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="card">
        <h2>Required caveats</h2>
        <ul>{CAVEATS.map((c) => <li key={c}>{c}</li>)}</ul>
      </div>
    </div>
  );
}
