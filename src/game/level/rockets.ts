import type { Pt } from "../../engine/rig/tree";
import type { TileGrid } from "../../engine/world/tiles";
import { seenAt, type Fog } from "../fog";
import type { MovementConfig } from "../hero/config";
import { isDead, type Hero } from "../hero/hero";
import type { RocketJson } from "./enemy";

export interface Rocket {
  x: number;
  y: number;
  heading: number;
  speed: number;
  hits: number;
  turn: number;
  steerAt: number;
  glide: number;
  level: number;
  blind: boolean;
  seen: boolean;
  mark: Pt | null;
  aimed: boolean;
  range: number | null;
  flown: number;
  trail: [number, number, number][];
  trailLife: number;
  fins: boolean;
  age: number;
  ended: number | null;
  burst: boolean;
}

export const BOOM_LIFE = 1.2;
const TRAIL_STEP = 0.08;
const LIFE = 10;
const DEG = Math.PI / 180;

export function launch([x, y]: Pt, facing: 1 | -1, { speed, hits, range, homing, trailMs, fins }: RocketJson): Rocket {
  const climb = (homing?.climb ?? 0) * DEG;
  return {
    x,
    y,
    heading: facing > 0 ? -climb : Math.PI + climb,
    speed,
    hits,
    turn: (homing?.turn ?? 0) * DEG,
    steerAt: (homing?.steerMs ?? 0) / 1000,
    glide: homing?.glide ?? 1,
    level: homing?.level ?? 1,
    seen: false,
    blind: false,
    mark: null,
    aimed: false,
    range: range ?? null,
    flown: 0,
    trail: [[x, y, 0]],
    trailLife: trailMs / 1000,
    fins: !!fins,
    age: 0,
    ended: null,
    burst: false,
  };
}

const targetable = (hero: Hero): boolean => !isDead(hero.state) && !hero.hidden;

const struck = (r: Rocket, hero: Hero, box: MovementConfig["box"]): boolean =>
  targetable(hero) && Math.abs(r.x - hero.x) <= box.width / 2 && r.y <= hero.y && r.y >= hero.y - box.height;

function aim(r: Rocket, [x, y]: Pt): number {
  const dx = x - r.x;
  return Math.atan2(r.level * (y - r.y), Math.sign(dx || 1) * Math.min(1, Math.abs(dx) / r.glide));
}

export const CLOSE = { cells: 6, climb: 85 * DEG, tighter: 1 };
const REACHED = 0.5;

function aimLaunch(r: Rocket, [x]: Pt): void {
  r.aimed = true;
  const near = 1 - Math.min(1, Math.abs(x - r.x) / CLOSE.cells);
  const climb = Math.abs(Math.atan2(Math.sin(r.heading), Math.abs(Math.cos(r.heading))));
  const steep = climb + (CLOSE.climb - climb) * near;
  r.heading = x >= r.x ? -steep : Math.PI + steep;
  r.turn *= 1 + CLOSE.tighter * near;
}

function steer(r: Rocket, hero: Hero, box: MovementConfig["box"], dt: number): void {
  const seen = targetable(hero);
  if (seen) r.mark = [hero.x, hero.y - box.height / 2];
  if (!r.turn || !r.mark) return;
  if (!r.aimed) aimLaunch(r, r.mark);
  if (r.age < r.steerAt && Math.abs(r.mark[0] - r.x) > CLOSE.cells) return;
  if (!seen) {
    r.blind = true;
    if (Math.abs(r.mark[0] - r.x) < REACHED) r.mark = null;
    if (!r.mark) return;
  } else if (r.blind) {
    r.blind = false;
    r.heading = aim(r, r.mark);
    return;
  }
  const want = aim(r, r.mark);
  const diff = Math.atan2(Math.sin(want - r.heading), Math.cos(want - r.heading));
  r.heading += Math.max(-r.turn * dt, Math.min(r.turn * dt, diff));
}

function move(r: Rocket, dt: number): void {
  const step = r.speed * dt;
  r.x += Math.cos(r.heading) * step;
  r.y += Math.sin(r.heading) * step;
  r.flown += step;
  const last = r.trail[r.trail.length - 1]!;
  if (Math.hypot(r.x - last[0], r.y - last[1]) >= TRAIL_STEP) r.trail.push([r.x, r.y, r.age]);
}

function lost(r: Rocket, fog: Fog | null): boolean {
  if (r.age >= LIFE) return true;
  if (!r.turn || !fog) return false;
  const visible = seenAt(fog, Math.floor(r.x), Math.floor(r.y));
  r.seen ||= visible;
  return r.seen && !visible;
}

export function flyRockets(rockets: Rocket[], grid: TileGrid, fog: Fog | null, hero: Hero, box: MovementConfig["box"], dt: number): { hits: number; booms: number } {
  let hits = 0;
  let booms = 0;
  for (const r of rockets) {
    r.age += dt;
    if (r.ended !== null) {
      r.ended += dt;
      continue;
    }
    steer(r, hero, box, dt);
    const [x, y] = [r.x, r.y];
    move(r, dt);
    const hit = struck(r, hero, box);
    if (hit) hits += r.hits;
    const wall = !hit && grid.solid(Math.floor(r.x), Math.floor(r.y));
    if (wall) [r.x, r.y] = [x, y];
    const burst = hit || wall || (r.range !== null && r.flown >= r.range);
    if (burst || lost(r, fog)) {
      r.ended = 0;
      r.burst = burst;
      if (burst) booms++;
    }
  }
  return { hits, booms };
}

export const liveRockets = (rockets: Rocket[]): Rocket[] =>
  rockets.filter((r) => r.ended === null || r.ended < Math.max(r.burst ? BOOM_LIFE : 0, r.trailLife));
