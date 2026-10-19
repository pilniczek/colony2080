import map from "@config/levels/mesto/map.json";
import sandbox from "@config/levels/sandbox.json";
import tasks from "@config/levels/mesto/tasks.json";
import world from "@config/levels/mesto/world.json";
import type { EnemyJson } from "./enemy";
import { loadSandbox, type SandboxJson, type SandboxWorld } from "./sandboxLevel";

type DroidTuning = Omit<EnemyJson, "x" | "y" | "facing" | "patrol">;

interface DroidEntry {
  cell: number[];
  patrol: number[];
}

export function droidsOf(entries: DroidEntry[], tuning: DroidTuning): EnemyJson[] {
  return entries.map((e) => ({
    ...tuning,
    x: e.cell[0]! + 0.5,
    y: e.cell[1]! + 1,
    facing: 1,
    patrol: [e.patrol[0]!, e.patrol[1]! + 1],
  }));
}

const { hits, reactMs, burst, pauseMs } = sandbox.enemies[0]!;

export function mestoJson(): SandboxJson {
  return {
    ...world,
    props: world.props as SandboxJson["props"],
    rows: map.rows,
    lifts: map.lifts as SandboxJson["lifts"],
    tasks,
    spawn: [map.spawn[0]!, map.spawn[1]!],
    enemies: droidsOf(map.droids, { hits, reactMs, burst, pauseMs, respawnMs: null }),
  };
}

export function loadMesto(): SandboxWorld {
  return loadSandbox(mestoJson());
}
