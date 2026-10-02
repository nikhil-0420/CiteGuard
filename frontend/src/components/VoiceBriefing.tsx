import type { AuditReport } from "../contract/types";
import { Chip } from "./Chip";

// NEHAA/NIKHIL (event day): wire the ElevenLabs audio URL into voice_briefing.url. Optional — cut first if slipping.
// Voice failure must NEVER affect the gate. Cached audio must be labeled as cached.
export function VoiceBriefing({ r }: { r: AuditReport }) {
  const v = r.voice_briefing;
  if (!v.available) return null;
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Voice briefing</h2>
        {v.cached && <Chip kind="cached">cached audio</Chip>}
      </div>
      {v.url ? <audio controls src={v.url} style={{ width: "100%", marginTop: 8 }} /> : <div className="muted" style={{ marginTop: 6 }}>Audio not generated yet (placeholder).</div>}
      {v.script && <p className="muted" style={{ marginBottom: 0 }}>{v.script}</p>}
    </div>
  );
}
