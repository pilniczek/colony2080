import jeskyneEnemies from "@config/levels/jeskyne/enemies.json";
import jeskyneMap from "@config/levels/jeskyne/map.json";
import jungleEnemies from "@config/levels/jungle/enemies.json";
import jungleMap from "@config/levels/jungle/map.json";
import mestoEnemies from "@config/levels/mesto/enemies.json";
import mestoWorld from "@config/levels/mesto/world.json";
import sandbox from "@config/levels/sandbox.json";
import vesniceEnemies from "@config/levels/vesnice/enemies.json";
import vesniceMap from "@config/levels/vesnice/map.json";
import type { EnemyJson } from "./enemy";
import { droidsOf, mestoJson, type DroidTuning } from "./mesto";
import { loadSandbox, type SandboxJson, type SandboxWorld } from "./sandboxLevel";

export type MissionId = "mesto" | "vesnice" | "jungle" | "jeskyne";

export const MISSIONS: MissionId[] = ["mesto", "vesnice", "jungle", "jeskyne"];

interface KindEntry {
  type: string;
  engine?: { hp?: number | null } | null;
}

interface MapEnemy {
  kind: string;
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

const KIND_ENTRIES: Record<MissionId, KindEntry[]> = {
  mesto: mestoEnemies.enemies,
  vesnice: vesniceEnemies.enemies,
  jungle: jungleEnemies.enemies,
  jeskyne: jeskyneEnemies.enemies,
};

const MESTO_KINDS = { walker: "chromeDroid", flyer: "flyer" } as const;

const { hits: sandboxHits, reactMs, burst, pauseMs } = sandbox.enemies[0]!;
const { flight } = sandbox.enemies.find((e) => "flight" in e) as EnemyJson;

const usedKinds = (id: MissionId): Set<string> =>
  new Set(id === "mesto" ? Object.values(MESTO_KINDS) : MAPS[id].enemies.map((e) => e.kind));

export function enemyKinds(id: MissionId): Record<string, DroidTuning> {
  const used = usedKinds(id);
  const kinds: Record<string, DroidTuning> = {};
  for (const entry of KIND_ENTRIES[id]) {
    const hp = entry.engine?.hp;
    if (!used.has(entry.type) || kinds[entry.type] || typeof hp !== "number") continue;
    const tuning: DroidTuning = { hits: Math.round((hp / 2) * sandboxHits), reactMs, burst, pauseMs, respawnMs: null };
    kinds[entry.type] = id === "mesto" && entry.type === MESTO_KINDS.flyer ? { ...tuning, flight } : tuning;
  }
  return kinds;
}

function mapEnemies(id: OtherMission): EnemyJson[] {
  const kinds = enemyKinds(id);
  return MAPS[id].enemies.flatMap((e) => {
    const tuning = kinds[e.kind];
    if (!tuning) throw new Error(`unknown enemy kind in ${id}: ${e.kind}`);
    return droidsOf([e], tuning);
  });
}

export function missionJson(id: MissionId): SandboxJson {
  if (id === "mesto") return mestoJson();
  const map = MAPS[id];
  return {
    rows: map.rows,
    spawn: [map.spawn[0]!, map.spawn[1]!],
    sky: mestoWorld.sky,
    backdrop: [],
    dressing: [],
    lifts: map.lifts as SandboxJson["lifts"],
    props: [],
    enemies: mapEnemies(id),
    tasks: { tasks: [] },
    fallDeathCells: map.fallDeathCells ?? null,
    hazards: (map.hazards ?? []) as SandboxJson["hazards"],
    conveyors: (map.conveyors ?? []) as SandboxJson["conveyors"],
    teleports: (map.teleports ?? []) as SandboxJson["teleports"],
    variants: (map.variants ?? {}) as SandboxJson["variants"],
  };
}

export const loadMission = (id: MissionId): SandboxWorld => loadSandbox(missionJson(id));
