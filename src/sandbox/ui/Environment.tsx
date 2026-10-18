import { useSandbox } from "../store";
import { Section, styles, type SandboxCommands } from "./Panel";

export function Environment({ commands }: { commands: SandboxCommands }) {
  const fogOn = useSandbox((s) => s.fogOn);
  const locked = useSandbox((s) => s.recording || s.playing);
  return (
    <Section title="Environment">
      <div style={styles.row}>
        <label>
          <input type="checkbox" checked={fogOn} disabled={locked} onChange={(e) => commands.setFog(e.target.checked)} /> fog of war
        </label>
      </div>
    </Section>
  );
}
