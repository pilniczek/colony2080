import { useSandbox } from "../store";
import { Section, styles, type SandboxCommands } from "./Panel";
import { NumberField } from "./Tuning";

export function Environment({ commands }: { commands: SandboxCommands }) {
  const emitterOn = useSandbox((s) => s.emitterOn);
  const emitterPeriod = useSandbox((s) => s.emitterPeriod);
  const locked = useSandbox((s) => s.recording || s.playing);
  return (
    <Section title="Environment">
      <div style={styles.row}>
        <label>
          <input type="checkbox" checked={emitterOn} disabled={locked} onChange={(e) => commands.setEmitter(e.target.checked)} /> emitter shooting
        </label>
      </div>
      <NumberField label="emitter period s" value={emitterPeriod} onCommit={commands.setEmitterPeriod} />
    </Section>
  );
}
