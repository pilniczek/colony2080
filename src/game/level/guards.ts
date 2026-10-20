import type { TileGrid } from "../../engine/world/tiles";
import type { AssetId } from "../env/assets";
import { BLAST } from "../env/blast";
import { ACID_GUARD_FIRING } from "../env/guard";
import { SHOOT_GUARD_EXPLODE, SHOOT_GUARD_FIRING } from "../env/shootGuard";
import type { Fog } from "../fog";
import type { Hero } from "../hero/hero";
import { burstStep, seesHero, type Burst } from "./enemy";
import type { Prop } from "./sandboxLevel";

export interface PropFire {
  facing: -1 | 1;
  burst: Burst;
  pauseMs: number;
  states: number[];
}

interface GuardArt {
  firing: number;
  explode?: number;
}

const EDGE = 1e-6;

const ART: Partial<Record<AssetId, GuardArt>> = {
  acidGuard: { firing: ACID_GUARD_FIRING },
  shootGuard: { firing: SHOOT_GUARD_FIRING, explode: SHOOT_GUARD_EXPLODE },
};

const artOf = (prop: Prop): GuardArt => {
  const art = prop.asset && ART[prop.asset];
  if (!art) throw new Error(`no guard art for ${prop.asset}`);
  return art;
};

export function watchX(prop: Prop): number {
  const { cells, fires } = prop;
  if (!cells || !fires) throw new Error(`guard ${prop.id} needs cells and fires`);
  return fires.facing > 0 ? cells.col + cells.w : cells.col - EDGE;
}

const alive = (prop: Prop): boolean => !!prop.fires && prop.fires.states.includes(prop.state ?? 0);

export function guardLook(prop: Prop): { state: number; t: number } | "gone" | null {
  if (!prop.fires) return null;
  const art = artOf(prop);
  if (alive(prop)) return typeof prop.fireTime === "number" ? { state: art.firing, t: prop.fireTime } : null;
  if (art.explode === undefined) return null;
  const age = prop.brokenAge ?? Infinity;
  return age < BLAST.loop ? { state: art.explode, t: age } : "gone";
}

export function updateGuard(prop: Prop, grid: TileGrid, fog: Fog | null, hero: Hero, sightCells: number, dt: number): number {
  const fire = prop.fires;
  if (!fire) return 0;
  if (prop.brokenAge !== undefined) prop.brokenAge += dt;
  prop.pauseLeft = Math.max(0, (prop.pauseLeft ?? 0) - dt);
  if (!alive(prop) || !seesHero({ x: watchX(prop), ground: prop.y ?? 0, facing: fire.facing }, grid, hero, fog, sightCells)) {
    prop.fireTime = null;
    return 0;
  }
  if (prop.fireTime === null || prop.fireTime === undefined) {
    if (prop.pauseLeft > 0) return 0;
    prop.fireTime = 0;
    return 1;
  }
  const step = burstStep(prop.fireTime, dt, fire.burst);
  prop.fireTime = step.time;
  if (step.done) {
    prop.fireTime = null;
    prop.pauseLeft = fire.pauseMs / 1000;
  }
  return step.fired;
}
