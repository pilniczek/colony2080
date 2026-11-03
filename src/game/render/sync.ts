import type { TileGrid } from "../../engine/world/tiles";
import type { Fog } from "../fog";
import type { Beam, Prop, SandboxWorld, Spark } from "../level/sandboxLevel";
import type { Tune } from "./frame";

export interface WorldSync {
  lifts: [number, number][];
  props: Prop[];
  beam: Beam | null;
  sparks: Spark[];
  projectiles: SandboxWorld["projectiles"];
  flags?: string[];
  grid?: Uint8Array;
  fog?: (Omit<Fog, "grid" | "cfg"> & { fresh: boolean }) | null;
  tune?: Tune;
}

interface Sent {
  flags: Set<string> | null;
  flagCount: number;
  grid: TileGrid | null;
  gridVersion: number;
  fog: Fog | null | undefined;
  fogVersion: number;
  tune: Tune | null;
}

export function syncer(): (world: SandboxWorld, tune: Tune) => WorldSync {
  const sent: Sent = { flags: null, flagCount: -1, grid: null, gridVersion: -1, fog: undefined, fogVersion: -1, tune: null };
  return (world, tune) => {
    const sync: WorldSync = { lifts: world.lifts.map((l) => [l.y, l.vy]), props: world.props, beam: world.beam, sparks: world.sparks, projectiles: world.projectiles };
    if (sent.flags !== world.flags || sent.flagCount !== world.flags.size) {
      sync.flags = [...world.flags];
      sent.flags = world.flags;
      sent.flagCount = world.flags.size;
    }
    if (sent.grid !== world.grid || sent.gridVersion !== world.grid.version) {
      sync.grid = world.grid.blocks();
      sent.grid = world.grid;
      sent.gridVersion = world.grid.version;
    }
    const { fog } = world;
    if (sent.fog !== fog || (fog && sent.fogVersion !== fog.version)) {
      sync.fog = fog && { anchorY: fog.anchorY, width: fog.width, height: fog.height, revealed: fog.revealed.slice(), seen: fog.seen.slice(), seenCells: fog.seenCells, version: fog.version, sightKey: fog.sightKey, fresh: sent.fog !== fog };
      sent.fog = fog;
      sent.fogVersion = fog?.version ?? -1;
    }
    if (sent.tune?.cfg !== tune.cfg || sent.tune?.clips !== tune.clips) {
      sync.tune = tune;
      sent.tune = tune;
    }
    return sync;
  };
}

export function applySync(world: SandboxWorld, fogCfg: Fog["cfg"], sync: WorldSync): void {
  sync.lifts.forEach(([y, vy], i) => {
    const lift = world.lifts[i];
    if (lift) Object.assign(lift, { y, vy });
  });
  world.props = sync.props;
  world.beam = sync.beam;
  world.sparks = sync.sparks;
  world.projectiles = sync.projectiles;
  if (sync.flags) world.flags = new Set(sync.flags);
  if (sync.grid) world.grid.adoptBlocks(sync.grid);
  if (sync.fog === null) world.fog = null;
  else if (sync.fog) {
    const { fresh, ...fog } = sync.fog;
    if (fresh || !world.fog) world.fog = { ...fog, cfg: fogCfg, grid: world.grid };
    else Object.assign(world.fog, fog);
  }
}
