import { useSandbox } from "../store";
import { Button, Section, styles } from "./Panel";

const SPEEDS = [0.25, 0.5, 1];

export function TimeControls({ step }: { step: () => void }) {
  const paused = useSandbox((s) => s.paused);
  const timeScale = useSandbox((s) => s.timeScale);
  const fps = useSandbox((s) => s.fps);
  const setPaused = useSandbox((s) => s.setPaused);
  const setTimeScale = useSandbox((s) => s.setTimeScale);
  return (
    <Section title={`Time - ${fps} fps`}>
      <div style={styles.row}>
        <Button active={paused} onClick={() => setPaused(!paused)}>
          {paused ? "Resume" : "Pause"}
        </Button>
        <Button onClick={step} disabled={!paused}>
          Step
        </Button>
        {SPEEDS.map((v) => (
          <Button key={v} active={timeScale === v} onClick={() => setTimeScale(v)}>
            {v}x
          </Button>
        ))}
      </div>
    </Section>
  );
}
