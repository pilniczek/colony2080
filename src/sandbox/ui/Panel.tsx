import { useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import type { Weapon } from "../../game/hero/config";
import { Environment } from "./Environment";
import { Overlays } from "./Overlays";
import { Recorder } from "./Recorder";
import { TimeControls } from "./TimeControls";
import { Tuning } from "./Tuning";

export interface SandboxCommands {
  step(): void;
  startRecording(): void;
  stopRecording(): void;
  replay(): void;
  setWeapon(weapon: Weapon): void;
  hit(): void;
  kill(): void;
  setFog(on: boolean): void;
}

export const styles = {
  panel: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 300,
    maxWidth: "100%",
    maxHeight: "100%",
    overflowY: "auto",
    boxSizing: "border-box",
    padding: 8,
    pointerEvents: "auto",
    background: "rgba(10,16,18,0.88)",
    color: "#d8e4e4",
    font: "12px/1.4 monospace",
  },
  toggle: { position: "absolute", top: 8, right: 8, pointerEvents: "auto" },
  section: { margin: "0 0 10px", paddingBottom: 8, borderBottom: "1px solid #2d3a3c" },
  heading: { margin: "0 0 4px", fontSize: 12, color: "#8fb3b8", textTransform: "uppercase" },
  row: { display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", marginBottom: 4 },
  field: { display: "flex", justifyContent: "space-between", gap: 6, alignItems: "center" },
  input: { width: 80, font: "inherit", background: "#162022", color: "inherit", border: "1px solid #4a5c5f" },
  button: { font: "inherit", background: "#26363a", color: "inherit", border: "1px solid #4a5c5f", padding: "2px 6px", cursor: "pointer" },
  active: { background: "#3fa34a", color: "#000" },
} satisfies Record<string, CSSProperties>;

export function Button({ active = false, ...props }: { active?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" style={{ ...styles.button, ...(active ? styles.active : {}) }} {...props} />;
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.heading}>{title}</h2>
      {children}
    </section>
  );
}

export function Panel({ commands }: { commands: SandboxCommands }) {
  const [open, setOpen] = useState(true);
  if (!open)
    return (
      <div style={styles.toggle}>
        <Button onClick={() => setOpen(true)}>Debug</Button>
      </div>
    );
  return (
    <aside data-panel style={styles.panel}>
      <div style={{ ...styles.row, justifyContent: "flex-end" }}>
        <Button onClick={() => setOpen(false)}>Hide</Button>
      </div>
      <TimeControls step={commands.step} />
      <Overlays />
      <Recorder commands={commands} />
      <Environment commands={commands} />
      <Tuning />
    </aside>
  );
}
