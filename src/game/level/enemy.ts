import type { TileGrid } from "../../engine/world/tiles";
import { seenAt, type Fog } from "../fog";
import type { ClipSet, MovementConfig } from "../hero/config";
import { createHero, type Hero } from "../hero/hero";

export const ENEMY_SHOT = "enemy";

export const SAME_FLOOR = 0.5;
const HALF_WIDTH = 0.35;

export interface EnemyJson {
  x: number;
  y: number;
  facing: -1 | 1;
  hits: number;
  respawnMs: number | null;
  reactMs: number;
  burst: Burst;
  pauseMs: number;
  patrol?: [number, number];
}

export interface Burst {
  shots: number;
  ms: number;
}

export interface Shaft {
  x: number;
  w: number;
  top: number;
  bottom: number;
  stops?: number[];
}

export interface Enemy {
  body: Hero;
  spot: [number, number];
  facing: -1 | 1;
  hits: number;
  respawnMs: number | null;
  reactMs: number;
  burst: Burst;
  pauseMs: number;
  patrol: [number, number];
  deadAge: number | null;
  alertAge: number | null;
  pauseLeft: number;
}

const walking = (body: Hero): Hero => ({ ...body, state: "walk" });

const spawnBody = (e: Pick<Enemy, "spot" | "facing" | "hits">): Hero => walking({ ...createHero(e.spot, "gun", e.hits), facing: e.facing });

const floorAt = (grid: TileGrid, col: number, row: number): boolean =>
  (grid.solid(col, row) || grid.ladderTop(col, row)) && !grid.solid(col, row - 1);

function patrolOf(grid: TileGrid, shafts: Shaft[], [x, y]: [number, number]): [number, number] {
  const row = Math.round(y);
  const walkable = (col: number): boolean =>
    floorAt(grid, col, row) && !shafts.some((s) => (s.stops ?? [s.top, s.bottom]).includes(row) && col >= s.x && col < s.x + s.w);
  let [left, right] = [Math.floor(x), Math.floor(x)];
  while (walkable(left - 1)) left--;
  while (walkable(right + 1)) right++;
  return [left + HALF_WIDTH, right + 1 - HALF_WIDTH];
}

function configuredPatrol(walkable: [number, number], cells: [number, number] | undefined): [number, number] {
  if (!cells) return walkable;
  return [Math.max(walkable[0], cells[0] + HALF_WIDTH), Math.min(walkable[1], cells[1] - HALF_WIDTH)];
}

export function createEnemy(json: EnemyJson, grid: TileGrid, shafts: Shaft[] = []): Enemy {
  const base = { spot: [json.x, json.y] as [number, number], facing: json.facing, hits: json.hits };
  return {
    ...base,
    respawnMs: json.respawnMs,
    reactMs: json.reactMs,
    burst: json.burst,
    pauseMs: json.pauseMs,
    patrol: configuredPatrol(patrolOf(grid, shafts, base.spot), json.patrol),
    body: spawnBody(base),
    deadAge: null,
    alertAge: null,
    pauseLeft: 0,
  };
}

export const isDead = (e: Enemy): boolean => e.deadAge !== null;

export function hitEnemy(e: Enemy, damage = 1, react = true): boolean {
  if (isDead(e)) return false;
  e.body.energy -= damage;
  if (react) {
    e.body.hitAge = 0;
    e.alertAge ??= 0;
  }
  if (e.body.energy <= 0) e.deadAge = 0;
  return true;
}

function sees(e: Enemy, grid: TileGrid, hero: Hero, fog: Fog | null, sightCells: number): boolean {
  const { body } = e;
  const dx = hero.x - body.x;
  if (hero.hidden || hero.energy <= 0 || Math.abs(hero.y - body.y) > SAME_FLOOR) return false;
  if (Math.sign(dx) !== body.facing || Math.abs(dx) > sightCells) return false;
  const row = Math.floor(body.y - 1);
  for (let col = Math.floor(Math.min(body.x, hero.x)); col <= Math.floor(Math.max(body.x, hero.x)); col++) {
    if (grid.solid(col, row) || (fog && !seenAt(fog, col, row))) return false;
  }
  return true;
}

function patrol(e: Enemy, clips: ClipSet, dt: number): void {
  const { body } = e;
  const walk = clips.walk;
  const speed = walk ? (walk.travel ?? 0) / walk.duration : 0;
  const [left, right] = e.patrol;
  body.x += body.facing * speed * dt;
  if (body.x <= left || body.x >= right) {
    body.x = Math.min(right, Math.max(left, body.x));
    body.facing = body.x <= left ? 1 : -1;
  }
}

function shoot(e: Enemy, dt: number): number {
  const { body, burst } = e;
  if (body.state !== "attack") {
    if (e.pauseLeft > 0) {
      if (body.state !== "idle") Object.assign(body, { state: "idle", time: 0, fireTime: null });
      return 0;
    }
    Object.assign(body, { state: "attack", time: 0, fireTime: 0 });
    return 1;
  }
  const rate = (burst.shots - 1) / (burst.ms / 1000);
  const before = Math.floor((body.fireTime ?? 0) * rate + 1e-9);
  body.fireTime = (body.fireTime ?? 0) + dt;
  const fired = Math.min(burst.shots - 1, Math.floor(body.fireTime * rate + 1e-9));
  if (fired === burst.shots - 1) {
    Object.assign(body, { state: "idle", time: 0, fireTime: null });
    e.pauseLeft = e.pauseMs / 1000;
  }
  return fired - before;
}

export function updateEnemy(e: Enemy, grid: TileGrid, fog: Fog | null, hero: Hero, clips: ClipSet, cfg: Pick<MovementConfig, "sightCells">, dt: number): number {
  e.body.time += dt;
  e.pauseLeft = Math.max(0, e.pauseLeft - dt);
  if (e.body.hitAge !== null) e.body.hitAge += dt;
  if (e.deadAge !== null) {
    e.deadAge += dt;
    if (e.respawnMs === null || e.deadAge * 1000 < e.respawnMs - 1e-6) return 0;
    e.body = spawnBody(e);
    e.deadAge = null;
    e.alertAge = null;
    e.pauseLeft = 0;
    return 0;
  }
  if (e.alertAge !== null && (e.alertAge += dt) * 1000 >= e.reactMs - 1e-6) {
    if (hero.x !== e.body.x) e.body.facing = hero.x > e.body.x ? 1 : -1;
    e.alertAge = null;
  }
  if (sees(e, grid, hero, fog, cfg.sightCells)) return shoot(e, dt);
  if (e.body.state !== "walk") Object.assign(e.body, { state: "walk", time: 0, fireTime: null });
  patrol(e, clips, dt);
  return 0;
}
