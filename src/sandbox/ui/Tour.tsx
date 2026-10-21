import { useEffect, useMemo, useState } from "react";
import { useSandbox } from "../store";
import { tourStops } from "../tour";
import { Button, Section, styles, type SandboxCommands } from "./Panel";

export function Tour({ commands }: { commands: SandboxCommands }) {
  const [text, setText] = useState("");
  const [delay, setDelay] = useState(3);
  const [at, setAt] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const locked = useSandbox((s) => s.recording || s.playing);
  const stops = useMemo(() => tourStops(text), [text]);

  const go = (i: number): void => {
    const stop = stops[i];
    if (!stop) return;
    setAt(i);
    commands.cheat(`moveto(${stop[0]},${stop[1]})`);
  };

  useEffect(() => {
    if (!playing) return;
    if (at >= stops.length - 1) return setPlaying(false);
    const timer = setTimeout(() => go(at + 1), Math.max(0.1, delay) * 1000);
    return () => clearTimeout(timer);
  });

  const play = (): void => {
    go(at < 0 || at >= stops.length - 1 ? 0 : at);
    setPlaying(true);
  };

  return (
    <Section title="Tour">
      <textarea
        value={text}
        disabled={locked}
        placeholder="moveto(67,37) moveto(84,44)"
        onChange={(e) => {
          setText(e.target.value);
          setAt(-1);
          setPlaying(false);
        }}
        style={{ ...styles.input, width: "100%", height: 48, boxSizing: "border-box" }}
      />
      <div style={styles.row}>
        <Button disabled={locked || !stops.length} active={playing} onClick={play}>
          Play
        </Button>
        <Button disabled={!playing} onClick={() => setPlaying(false)}>
          Stop
        </Button>
        <Button disabled={locked || at <= 0} onClick={() => go(at - 1)}>
          Prev
        </Button>
        <Button disabled={locked || at >= stops.length - 1} onClick={() => go(at + 1)}>
          Next
        </Button>
        <span>
          {at + 1}/{stops.length}
        </span>
      </div>
      <div style={styles.row}>
        delay s <input type="number" min={0.1} step={0.1} value={delay} onChange={(e) => setDelay(Number(e.target.value))} style={{ ...styles.input, width: 50 }} />
      </div>
    </Section>
  );
}
