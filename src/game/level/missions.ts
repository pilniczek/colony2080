import jeskyneMap from "@config/levels/jeskyne/map.json";
import jeskyneTasks from "@config/levels/jeskyne/tasks.json";
import jeskyneWorld from "@config/levels/jeskyne/world.json";
import jungleMap from "@config/levels/jungle/map.json";
import jungleWorld from "@config/levels/jungle/world.json";
import vesniceMap from "@config/levels/vesnice/map.json";
import vesniceTasks from "@config/levels/vesnice/tasks.json";
import vesniceWorld from "@config/levels/vesnice/world.json";
import type { EnemyJson } from "./enemy";
import type { MissionId } from "./missionIds";
import { DROID, droidsOf, FLYER, mestoJson, type DroidTuning } from "./mesto";
import { loadSandbox, type SandboxJson, type SandboxWorld } from "./sandboxLevel";

interface MapEnemy {
  kind: string;
  hp: number;
  cell: number[];
  patrol: number[];
}

interface MissionMap {
  rows: string[];
  lifts: unknown[];
  spawn: number[];
  hazards?: unknown[];
  conveyors?: unknown[];
  teleports?: unknown[];
  variants?: unknown;
  enemies: MapEnemy[];
}

type OtherMission = Exclude<MissionId, "mesto">;

const MAPS: Record<OtherMission, MissionMap> = { vesnice: vesniceMap, jungle: jungleMap, jeskyne: jeskyneMap };

interface MissionWorld {
  sky: string;
  backdrop: SandboxJson["backdrop"];
  dressing: SandboxJson["dressing"];
  bare?: SandboxJson["bare"];
  terrainArt?: SandboxJson["terrainArt"];
  haze?: string;
  ground?: number;
  props?: unknown[];
}

const WORLDS: Record<OtherMission, MissionWorld> = { vesnice: vesniceWorld, jungle: jungleWorld, jeskyne: jeskyneWorld };

const TASKS: Partial<Record<OtherMission, unknown>> = { vesnice: vesniceTasks, jeskyne: jeskyneTasks };

const MESTO_KINDS: Record<string, DroidTuning> = { chromeDroid: DROID, flyer: FLYER };

export const enemyKinds = (id: MissionId): Record<string, DroidTuning> =>
  id === "mesto" ? MESTO_KINDS : Object.fromEntries(MAPS[id].enemies.map((e) => [e.kind, DROID]));

const hitsOf = (hp: number): number => Math.round((hp / 2) * DROID.hits);

const OWN_KINDS: ReadonlySet<OtherMission> = new Set(["vesnice"]);

function mapEnemies(id: OtherMission): EnemyJson[] {
  const kinds = enemyKinds(id);
  return MAPS[id].enemies.flatMap((e) => droidsOf([e], { ...kinds[e.kind]!, hits: hitsOf(e.hp), ...(OWN_KINDS.has(id) ? { kind: e.kind } : {}) }));
}

export function missionJson(id: MissionId): SandboxJson {
  if (id === "mesto") return mestoJson();
  const map = MAPS[id];
  return {
    rows: map.rows,
    spawn: [map.spawn[0]!, map.spawn[1]!],
    sky: WORLDS[id].sky,
    backdrop: WORLDS[id].backdrop,
    dressing: WORLDS[id].dressing,
    lifts: map.lifts as SandboxJson["lifts"],
    props: (WORLDS[id].props ?? []) as SandboxJson["props"],
    enemies: mapEnemies(id),
    tasks: TASKS[id] ?? { tasks: [] },
    hazards: (map.hazards ?? []) as SandboxJson["hazards"],
    conveyors: (map.conveyors ?? []) as SandboxJson["conveyors"],
    teleports: (map.teleports ?? []) as SandboxJson["teleports"],
    variants: (map.variants ?? {}) as SandboxJson["variants"],
    ...(WORLDS[id].bare === undefined ? {} : { bare: WORLDS[id].bare }),
    ...(WORLDS[id].terrainArt === undefined ? {} : { terrainArt: WORLDS[id].terrainArt }),
    ...(WORLDS[id].haze === undefined ? {} : { haze: WORLDS[id].haze }),
    ...(WORLDS[id].ground === undefined ? {} : { ground: WORLDS[id].ground }),
  };
}

export const loadMission = (id: MissionId): SandboxWorld => loadSandbox(missionJson(id));
