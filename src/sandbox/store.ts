import clipsJson from "@config/hero/clips.json";
import movementJson from "@config/hero/movement.json";
import { create } from "zustand";
import type { InputRecord } from "../engine/input";
import { loadClips, loadMovement, type ClipSet, type HeroState, type MovementConfig, type Weapon } from "../game/hero/config";

export type OverlayName = "hitbox" | "tiles" | "joints" | "info";
export type ClipField = "duration" | "travel";

export interface SandboxState {
  state: HeroState;
  time: number;
  vx: number;
  vy: number;
  energy: number;
  weapon: Weapon;
  fps: number;
  inputLog: string[];
  emitterOn: boolean;
  overlays: Record<OverlayName, boolean>;
  paused: boolean;
  timeScale: number;
  movement: MovementConfig;
  clips: ClipSet;
  recording: boolean;
  playing: boolean;
  record: InputRecord | null;
  toggleOverlay(name: OverlayName): void;
  setPaused(v: boolean): void;
  setTimeScale(v: number): void;
  setMovementValue(path: string, value: number): void;
  setClipValue(clip: string, field: ClipField, value: number): void;
  resetTuning(): void;
  exportTuning(): { movement: string; clips: string };
}

type Tree = Record<string, unknown>;

const isTree = (v: unknown): v is Tree => typeof v === "object" && v !== null && !Array.isArray(v);

const inline = (v: unknown): string => JSON.stringify(v).replace(/,/g, ", ").replace(/":/g, '": ');

function withNumber(root: Tree, keys: string[], value: number): Tree | null {
  const [key, ...rest] = keys;
  if (key === undefined || !(key in root)) return null;
  const current = root[key];
  if (rest.length === 0) return typeof current === "number" ? { ...root, [key]: value } : null;
  if (!isTree(current)) return null;
  const next = withNumber(current, rest, value);
  return next && { ...root, [key]: next };
}

function movementText(m: MovementConfig): string {
  const fields = Object.entries(m).map(([k, v]) => `  "${k}": ${isTree(v) ? inline(v).replace(/^\{/, "{ ").replace(/\}$/, " }") : JSON.stringify(v)}`);
  return `{\n${fields.join(",\n")}\n}\n`;
}

function clipsText(clips: ClipSet): string {
  const raw = clipsJson.clips as Record<string, Tree>;
  const names = Object.keys(raw);
  const body = names.map((name, i) => {
    const tuned = clips[name];
    const merged: Tree = { ...raw[name], duration: tuned?.duration, ...(tuned?.travel === undefined ? {} : { travel: tuned.travel }) };
    const fields = Object.entries(merged).map(([k, v]) =>
      k === "pose" ? `      "pose": [\n${(v as unknown[]).map((e) => "        " + inline(e)).join(",\n")}\n      ]` : `      "${k}": ${inline(v)}`);
    return `    "${name}": {\n${fields.join(",\n")}\n    }${i < names.length - 1 ? "," : ""}`;
  });
  return [`{`, `  "status": ${inline(clipsJson.status)},`, `  "source": ${inline(clipsJson.source)},`, `  "clips": {`, ...body, `  }`, `}`].join("\n") + "\n";
}

const fileTuning = () => ({ movement: loadMovement(movementJson), clips: loadClips(clipsJson) });

export const useSandbox = create<SandboxState>()((set, get) => ({
  state: "idle",
  time: 0,
  vx: 0,
  vy: 0,
  energy: 0,
  weapon: "gun",
  fps: 0,
  inputLog: [],
  emitterOn: false,
  overlays: { hitbox: false, tiles: false, joints: false, info: false },
  paused: false,
  timeScale: 1,
  ...fileTuning(),
  recording: false,
  playing: false,
  record: null,
  toggleOverlay: (name) => set((s) => ({ overlays: { ...s.overlays, [name]: !s.overlays[name] } })),
  setPaused: (paused) => set({ paused }),
  setTimeScale: (timeScale) => set({ timeScale }),
  setMovementValue: (path, value) => {
    if (!Number.isFinite(value) || value < 0) return;
    const next = withNumber(get().movement as unknown as Tree, path.split("."), value);
    if (next) set({ movement: next as unknown as MovementConfig });
  },
  setClipValue: (name, field, value) => {
    const clip = get().clips[name];
    if (!clip || !Number.isFinite(value) || value < 0 || (field === "duration" && value === 0)) return;
    set({ clips: { ...get().clips, [name]: { ...clip, [field]: value } } });
  },
  resetTuning: () => set(fileTuning()),
  exportTuning: () => ({ movement: movementText(get().movement), clips: clipsText(get().clips) }),
}));
