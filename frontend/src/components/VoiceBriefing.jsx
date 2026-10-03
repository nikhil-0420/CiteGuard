
import { Chip } from "./Chip";
import { Volume2Icon } from "./Icons";

// NEHAA/NIKHIL (event day): wire the ElevenLabs audio URL into voice_briefing.url.
// Voice failure must NEVER affect the gate. Cached audio must be labeled as cached.
export function VoiceBriefing({ r }) {
  const v = r.voice_briefing;
  if (!v.available) return null;

  return (
    <div className="voice-briefing-card">
      <div className="voice-briefing-header">
        <div className="voice-briefing-title">
          <Volume2Icon size={18} style={{ color: "var(--accent-blue)" }} />
          Executive Audio Briefing
        </div>
        {v.cached && <Chip kind="cached" icon>cached audio</Chip>}
      </div>

      {v.url ?
      <audio controls src={v.url} style={{ width: "100%", marginTop: "8px" }} /> :

      <div style={{ color: "var(--text-tertiary)", fontSize: "12.5px", fontStyle: "italic", marginTop: "4px" }}>
          Synthesized voice briefing ready for broadcast. Audio playback asset pending generation.
        </div>
      }

      {v.script &&
      <div style={{ marginTop: "10px", padding: "10px 14px", background: "var(--bg-surface-elevated)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", fontSize: "13px", color: "var(--text-primary)", fontStyle: "italic", lineHeight: 1.5 }}>
          “{v.script}”
        </div>
      }
    </div>);

}