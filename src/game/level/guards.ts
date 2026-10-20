import { ASSETS } from "../env/assets";
import { ACID_GUARD_MUZZLE } from "../env/guard";
import { TILE } from "../env/paint";
import type { Fog } from "../fog";
import type { Hero } from "../hero/hero";
import { burstStep, seesHero, type Burst } from "./enemy";
import type { Prop } from "./sandboxLevel";
import type { TileGrid } from "../../engine/world/tiles";

export interface PropFire {
  facing: -1 | 1;
  burst: Burst;
  pauseMs: number;
  states: number[];
}

const [left, , right] = ASSETS.acidGuard.box;
const ART_SHIFT = -(left + right) / 2;

export const gunOf = (prop: Prop): [number, number] => [prop.x + (ACID_GUARD_MUZZLE[0] + ART_SHIFT) / TILE, (prop.y ?? 0) + ACID_GUARD_MUZZLE[1] / TILE];

export function updateGuard(prop: Prop, grid: TileGrid, fog: Fog | null, hero: Hero, sightCells: number, dt: number): number {
  const fire = prop.fires;
  if (!fire) return 0;
  prop.pauseLeft = Math.max(0, (prop.pauseLeft ?? 0) - dt);
  const alive = fire.states.includes(prop.state ?? 0);
  const [x] = gunOf(prop);
  if (!alive || !seesHero({ x, ground: prop.y ?? 0, facing: fire.facing }, grid, hero, fog, sightCells)) {
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
