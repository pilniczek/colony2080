import { useSandbox } from "../store";
import { Button, Section, styles, type SandboxCommands } from "./Panel";

export function Recorder({ commands }: { commands: SandboxCommands }) {
  const recording = useSandbox((s) => s.recording);
  const playing = useSandbox((s) => s.playing);
  const record = useSandbox((s) => s.record);
  const weapon = useSandbox((s) => s.weapon);
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
        <Button active={weapon === "gun"} onClick={() => commands.setWeapon("gun")}>
          Gun
        </Button>
        <Button disabled={locked} onClick={commands.hit}>
          Hit
        </Button>
        <Button disabled={locked} onClick={commands.kill}>
          Kill
        </Button>
      </div>
    </Section>
  );
}
