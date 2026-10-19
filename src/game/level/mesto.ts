import map from "@config/levels/mesto/map.json";
import enemies from "@config/levels/mesto/enemies.json";
import sandbox from "@config/levels/sandbox.json";
import world from "@config/levels/mesto/world.json";
import type { EnemyJson } from "./enemy";
import { loadSandbox, type SandboxJson, type SandboxWorld } from "./sandboxLevel";

type DroidTuning = Omit<EnemyJson, "x" | "y" | "facing" | "patrol">;

interface DroidEntry {
  type: string;
  cell: number[];
  patrol: number[];
}

export function droidsOf(json: unknown, tuning: DroidTuning): EnemyJson[] {
  const { enemies: entries } = json as { enemies: DroidEntry[] };
  return entries
    .filter((e) => e.type === "chromeDroid")
    .map((e) => ({
      ...tuning,
      x: e.cell[0]! + 0.5,
      y: e.cell[1]! + 1,
      facing: 1,
      patrol: [e.patrol[0]!, e.patrol[1]! + 1],
    }));
}

const { hits, reactMs, burst, pauseMs } = sandbox.enemies[0]!;

export function mestoJson(): SandboxJson & Pick<typeof map, "taskWalls"> {
  return {
    ...world,
    rows: map.rows,
    lifts: map.lifts as SandboxJson["lifts"],
    taskWalls: map.taskWalls,
    spawn: [map.spawn[0]!, map.spawn[1]!],
    enemies: droidsOf(enemies, { hits, reactMs, burst, pauseMs, respawnMs: null }),
  };
}

export function loadMesto(): SandboxWorld {
  return loadSandbox(mestoJson());
}
