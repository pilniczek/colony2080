import movementJson from "@config/hero/movement.json";
import { loadMovement } from "../hero/config";
import type { MissionId } from "./missionIds";
import { missionJson } from "./missions";
import { id, reachOf } from "./reach";
import { loadSandbox, type SandboxJson, type SandboxWorld } from "./sandboxLevel";
import { applyBlocks } from "./tasks";

const cfg = loadMovement(movementJson);

const FINAL_VARIANT: Partial<Record<MissionId, string>> = { vesnice: "barricadeGone", jungle: "puzzleSteps", jeskyne: "tankShot" };

const TASK_WALLS: Partial<Record<MissionId, Record<string, [number, number][]>>> = {
  vesnice: { "guard post code wall, the walkie-talkie removes it (report 14)": [35, 36, 37, 38, 39, 40].map((row) => [52, row]) },
};

export function patch(json: SandboxJson, cells: { col: number; row: number; ch: string }[]): SandboxJson {
  const rows = json.rows.map((row) => row.split(""));
  for (const { col, row, ch } of cells) rows[row]![col] = ch;
  return { ...json, rows: rows.map((row) => row.join("")) };
}

export const variant = (json: SandboxJson, vid: string): SandboxJson => patch(json, json.variants![vid]!);

export function opened(mission: MissionId): SandboxWorld {
  const last = FINAL_VARIANT[mission];
  const json = last ? variant(missionJson(mission), last) : missionJson(mission);
  const walls = Object.values(TASK_WALLS[mission] ?? {}).flat();
  const w = loadSandbox(patch(json, walls.map(([col, row]) => ({ col, row, ch: "." }))));
  for (const gate of [...w.lifts, ...w.teleports]) if (gate.enabledBy) w.flags.add(gate.enabledBy);
  for (const prop of w.props) if (prop.solidStates) prop.state = Math.max(...prop.solidStates) + 1;
  applyBlocks(w);
  return w;
}

export function openGraph(w: SandboxWorld, model: "strict" | "generous" = "generous") {
  const r = reachOf(w, cfg);
  const locked = new Set(w.lifts.flatMap((l, i) => (l.enabledBy === undefined || w.flags.has(l.enabledBy) ? [] : [i])));
  const g = new Map([...r.graph(r[model])].map(([k, edges]) => [k, edges.filter((e) => !locked.has(e.lift ?? -1) && !locked.has(e.deck ?? -1))]));
  const spawn = id(r.runAt(w.spawn[1], Math.floor(w.spawn[0]))!);
  return { r, g, spawn, from: r.reach(g, spawn) };
}
