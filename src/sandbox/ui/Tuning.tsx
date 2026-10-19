import { useEffect, useState } from "react";
import type { MovementConfig } from "../../game/hero/config";
import { useSandbox, type ClipField } from "../store";
import { Button, Section, styles } from "./Panel";

const numberPaths = (o: object, prefix = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    typeof v === "number" ? [prefix + k] : typeof v === "object" && v !== null ? numberPaths(v, `${prefix}${k}.`) : [],
  );

const valueAt = (m: MovementConfig, path: string): number =>
  path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], m) as number;

interface NumberFieldProps {
  label: string;
  value: number;
  onCommit: (v: number) => void;
  min?: number;
  max?: number;
}

export function NumberField({ label, value, onCommit, min, max }: NumberFieldProps) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);
  return (
    <label style={styles.field}>
      <span>{label}</span>
      <input
        style={styles.input}
        type="number"
        step="any"
        min={min}
        max={max}
        value={text}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw.trim() === "" || !Number.isFinite(Number(raw))) return setText(raw);
          const n = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, Number(raw)));
          setText(n === Number(raw) ? raw : String(n));
          onCommit(n);
        }}
      />
    </label>
  );
}

function copy(text: string, done: (msg: string) => void): void {
  navigator.clipboard.writeText(text).then(
    () => done("copied"),
    () => done("clipboard blocked"),
  );
}

export function Tuning() {
  const movement = useSandbox((s) => s.movement);
  const clips = useSandbox((s) => s.clips);
  const setMovementValue = useSandbox((s) => s.setMovementValue);
  const setClipValue = useSandbox((s) => s.setClipValue);
  const resetTuning = useSandbox((s) => s.resetTuning);
  const exportTuning = useSandbox((s) => s.exportTuning);
  const [status, setStatus] = useState("");
  const clipField = (name: string, field: ClipField, value: number) => (
    <NumberField key={`${name}.${field}`} label={`${name}.${field}`} value={value} onCommit={(v) => setClipValue(name, field, v)} />
  );
  return (
    <Section title="Tuning">
      <div style={styles.row}>
        <Button onClick={resetTuning}>Reset</Button>
        <Button onClick={() => copy(exportTuning().movement, setStatus)}>Copy movement JSON</Button>
        <Button onClick={() => copy(exportTuning().clips, setStatus)}>Copy clips JSON</Button>
        <span>{status}</span>
      </div>
      <details open>
        <summary>movement.json</summary>
        {numberPaths(movement).map((path) => (
          <NumberField key={path} label={path} value={valueAt(movement, path)} onCommit={(v) => setMovementValue(path, v)} />
        ))}
      </details>
      <details>
        <summary>clips.json</summary>
        {Object.entries(clips).flatMap(([name, clip]) => [
          clipField(name, "duration", clip.duration),
          ...(clip.travel === undefined ? [] : [clipField(name, "travel", clip.travel)]),
        ])}
      </details>
    </Section>
  );
}
