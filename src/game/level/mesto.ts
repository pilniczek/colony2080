import map from "@config/levels/mesto/map.json";
import world from "@config/levels/mesto/world.json";
import { loadSandbox, type SandboxJson, type SandboxWorld } from "./sandboxLevel";

export function mestoJson(): SandboxJson & Pick<typeof map, "taskWalls"> {
  return {
    ...world,
    rows: map.rows,
    lifts: map.lifts as SandboxJson["lifts"],
    taskWalls: map.taskWalls,
    spawn: [map.spawn[0]!, map.spawn[1]!],
    enemies: [],
  };
}

export function loadMesto(): SandboxWorld {
  return loadSandbox(mestoJson());
}
