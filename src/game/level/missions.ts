import jeskyneMap from "@config/levels/jeskyne/map.json";
import jungleMap from "@config/levels/jungle/map.json";
import mestoWorld from "@config/levels/mesto/world.json";
import vesniceMap from "@config/levels/vesnice/map.json";
import vesniceWorld from "@config/levels/vesnice/world.json";
import type { ItemId } from "../items";
import type { EnemyJson } from "./enemy";
import { DROID, droidsOf, FLYER, mestoJson, type DroidTuning } from "./mesto";
import { loadSandbox, type SandboxJson, type SandboxWorld } from "./sandboxLevel";

export type MissionId = "mesto" | "vesnice" | "jungle" | "jeskyne";

export const MISSIONS: MissionId[] = ["mesto", "vesnice", "jungle", "jeskyne"];

export const missionFromQuery = (search: string): MissionId => MISSIONS.find((id) => id === new URLSearchParams(search).get("mission")) ?? "mesto";

export const mapItemOf = (id: MissionId): ItemId | undefined => (id === "vesnice" ? undefined : "holoPlan");

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
  fallDeathCells?: number | null;
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
}

const NO_WORLD: MissionWorld = { sky: mestoWorld.sky, backdrop: [], dressing: [] };

const WORLDS: Record<OtherMission, MissionWorld> = { vesnice: vesniceWorld, jungle: NO_WORLD, jeskyne: NO_WORLD };

const MESTO_KINDS: Record<string, DroidTuning> = { chromeDroid: DROID, flyer: FLYER };

export const enemyKinds = (id: MissionId): Record<string, DroidTuning> =>
  id === "mesto" ? MESTO_KINDS : Object.fromEntries(MAPS[id].enemies.map((e) => [e.kind, DROID]));

const hitsOf = (hp: number): number => Math.round((hp / 2) * DROID.hits);

function mapEnemies(id: OtherMission): EnemyJson[] {
  const kinds = enemyKinds(id);
  return MAPS[id].enemies.flatMap((e) => droidsOf([e], { ...kinds[e.kind]!, hits: hitsOf(e.hp) }));
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
    props: [],
    enemies: mapEnemies(id),
    tasks: { tasks: [] },
    ...(map.fallDeathCells === undefined ? {} : { fallDeathCells: map.fallDeathCells }),
    hazards: (map.hazards ?? []) as SandboxJson["hazards"],
    conveyors: (map.conveyors ?? []) as SandboxJson["conveyors"],
    teleports: (map.teleports ?? []) as SandboxJson["teleports"],
    variants: (map.variants ?? {}) as SandboxJson["variants"],
    ...(WORLDS[id].bare === undefined ? {} : { bare: WORLDS[id].bare }),
  };
}

export const loadMission = (id: MissionId): SandboxWorld => loadSandbox(missionJson(id));
