import { SHIELDS_MAX } from "../../game/hud/svg";
import { useSandbox } from "../store";
import { Button, Section, styles, type SandboxCommands } from "./Panel";
import { NumberField } from "./Tuning";

export function Recorder({ commands }: { commands: SandboxCommands }) {
  const recording = useSandbox((s) => s.recording);
  const playing = useSandbox((s) => s.playing);
  const record = useSandbox((s) => s.record);
  const weapon = useSandbox((s) => s.weapon);
  const ammo = useSandbox((s) => s.ammo);
  const shields = useSandbox((s) => s.shields);
  const reserve = useSandbox((s) => s.reserve);
  const setReserve = useSandbox((s) => s.setReserve);
  const locked = recording || playing;
  return (
    <Section title="Run">
      <div style={styles.row}>
        <Button active={recording} disabled={recording} onClick={commands.startRecording}>
          Record
        </Button>
        <Button disabled={!recording && !playing} onClick={commands.stopRecording}>
          Stop
        </Button>
        <Button active={playing} disabled={recording || !record} onClick={commands.replay}>
          Replay
        </Button>
        <span>{record ? `${record.length} events` : "no record"}</span>
      </div>
      <div style={styles.row}>
        <Button active={weapon === "fists"} onClick={() => commands.setWeapon("fists")}>
          Fists
        </Button>
        <Button active={weapon === "gun"} disabled={ammo <= 0} onClick={() => commands.setWeapon("gun")}>
          Gun
        </Button>
        <Button disabled={locked} onClick={commands.hit}>
          Hit
        </Button>
        <Button disabled={locked} onClick={commands.kill}>
          Kill
        </Button>
      </div>
      {!locked && <NumberField label="ammo" value={ammo} onCommit={commands.setAmmo} min={0} />}
      {!locked && <NumberField label="shields" value={shields} onCommit={commands.setShields} min={0} max={SHIELDS_MAX} />}
      <NumberField label="reserve %" value={reserve} onCommit={setReserve} min={0} max={100} />
    </Section>
  );
}
