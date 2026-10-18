import { useSandbox, type OverlayName } from "../store";
import { Section, styles } from "./Panel";

const NAMES: OverlayName[] = ["hitbox", "tiles", "joints", "info"];

export function Overlays() {
  const overlays = useSandbox((s) => s.overlays);
  const toggle = useSandbox((s) => s.toggleOverlay);
  const state = useSandbox((s) => s.state);
  const time = useSandbox((s) => s.time);
  const vx = useSandbox((s) => s.vx);
  const vy = useSandbox((s) => s.vy);
  const energy = useSandbox((s) => s.energy);
  const weapon = useSandbox((s) => s.weapon);
  const inputLog = useSandbox((s) => s.inputLog);
  return (
    <Section title="Overlays">
      <div style={styles.row}>
        {NAMES.map((name) => (
          <label key={name}>
            <input type="checkbox" checked={overlays[name]} onChange={() => toggle(name)} /> {name}
          </label>
        ))}
      </div>
      <div>
        {state} t {time.toFixed(2)} vx {vx.toFixed(2)} vy {vy.toFixed(2)}
      </div>
      <div>
        energy {energy} weapon {weapon}
      </div>
      <div style={{ color: "#8fb3b8" }}>{inputLog.join(" | ") || "no input yet"}</div>
    </Section>
  );
}
