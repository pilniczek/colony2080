import { moveBox } from "../../engine/world/collide";
import type { TileGrid } from "../../engine/world/tiles";
import type { AssetId } from "../env/assets";
import { BLAST } from "../env/blast";
import { ACID_GUARD_FIRING } from "../env/guard";
import { SHOOT_GUARD_EXPLODE, SHOOT_GUARD_FIRING } from "../env/shootGuard";
import type { Fog } from "../fog";
import type { CutsceneId } from "../cutscene";
import type { MovementConfig } from "../hero/config";
import { isDead, type Hero } from "../hero/hero";
import { burstStep, seesHero, type Burst } from "./enemy";
import { startFilm, type Prop, type SandboxWorld } from "./sandboxLevel";

export interface PropFire {
  facing: -1 | 1;
  burst: Burst;
  pauseMs: number;
  states: number[];
}

export interface PropRepel {
  col: number;
  w: number;
  facing: -1 | 1;
  hits: number;
  push: number;
  ms: number;
  states: number[];
  cutscene?: CutsceneId;
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

const alive = (prop: Prop): boolean => !!(prop.fires ?? prop.repels)?.states.includes(prop.state ?? 0);

export const guardHidden = (prop: Prop, flags: ReadonlySet<string>): boolean => !!prop.shownBy && !flags.has(prop.shownBy) && alive(prop);

export function guardLook(prop: Prop): { state: number; t: number } | "gone" | null {
  if (!prop.fires && !prop.repels) return null;
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

function inZone(prop: Prop, hero: Hero, cfg: MovementConfig): boolean {
  const { repels, cells } = prop;
  if (!repels || !cells) throw new Error(`guard ${prop.id} needs cells and repels`);
  const half = cfg.box.width / 2;
  const row = Math.floor(hero.y - 0.001);
  return hero.x + half > repels.col && hero.x - half < repels.col + repels.w && row >= cells.row && row < cells.row + cells.h;
}

export function repelHero(prop: Prop, world: SandboxWorld, hero: Hero, cfg: MovementConfig, dt: number): number {
  const repel = prop.repels;
  if (!repel) return 0;
  if (typeof prop.fireTime === "number") {
    prop.fireTime += dt;
    if (prop.fireTime >= repel.ms / 1000) prop.fireTime = null;
  }
  if (!alive(prop) || prop.fireTime != null || world.cutscene !== null || isDead(hero.state) || !inZone(prop, hero, cfg)) return 0;
  prop.fireTime = 0;
  if (prop.shownBy && guardHidden(prop, world.flags)) {
    world.flags.add(prop.shownBy);
    startFilm(world, repel.cutscene);
  }
  const box = { x: hero.x, y: hero.y, w: cfg.box.width, h: cfg.box.height };
  hero.x = moveBox(box, repel.facing * repel.push, 0, world.grid, world.lifts).x;
  return repel.hits;
}
