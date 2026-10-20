import type { TileGrid } from "../../engine/world/tiles";
import { FLYER_HULL, FLYER_MUZZLE } from "../env/flyer";
import { TILE } from "../env/paint";
import { seenAt, type Fog } from "../fog";
import type { ClipSet, MovementConfig } from "../hero/config";
import { createHero, type Hero } from "../hero/hero";

export const ENEMY_SHOT = "enemy";

export const SAME_FLOOR = 0.5;
const HALF_WIDTH = 0.35;
const AIM_EPS = 0.02;

export const FLYER_HALF: [number, number] = [FLYER_HULL.w / 2 / TILE, FLYER_HULL.h / 2 / TILE];
export const FLYER_GUN: [number, number] = [FLYER_MUZZLE[0] / TILE, FLYER_MUZZLE[1] / TILE];

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
  flight?: FlightJson;
}

export interface FlightJson {
  hoverLift: number;
  aimLift: number;
  speedScale: number;
  climb: number;
  closeCells: number;
  turnMs: number;
  wave: { cells: number; hz: number };
}

export interface Flight {
  cfg: FlightJson;
  lift: number;
  clock: number;
  behindAge: number;
}

export interface BodyBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
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
  flight: Flight | null;
}

const walking = (body: Hero): Hero => ({ ...body, state: "walk" });

const setState = (body: Hero, state: "walk" | "idle"): void => {
  if (body.state !== state) Object.assign(body, { state, time: 0, fireTime: null });
};

const spawnFlight = (cfg: FlightJson | undefined): Flight | null => (cfg ? { cfg, lift: cfg.hoverLift, clock: 0, behindAge: 0 } : null);

const spawnBody = (e: Pick<Enemy, "spot" | "facing" | "hits" | "flight">): Hero => {
  const body = walking({ ...createHero(e.spot, "gun", e.hits), facing: e.facing });
  if (e.flight) body.y = e.spot[1] - e.flight.lift;
  return body;
};

const ground = (e: Enemy): number => (e.flight ? e.spot[1] : e.body.y);

export function bodyBox(e: Enemy, box: { width: number; height: number }): BodyBox {
  const { x, y } = e.body;
  if (!e.flight) return { left: x - box.width / 2, right: x + box.width / 2, top: y - box.height, bottom: y };
  const [halfW, halfH] = FLYER_HALF;
  return { left: x - halfW, right: x + halfW, top: y - halfH, bottom: y + halfH };
}

const floorAt = (grid: TileGrid, col: number, row: number): boolean =>
  (grid.solid(col, row) || grid.ladderTop(col, row)) && !grid.solid(col, row - 1);

function spanOf(x: number, open: (col: number) => boolean, half: number): [number, number] {
  let [left, right] = [Math.floor(x), Math.floor(x)];
  while (open(left - 1)) left--;
  while (open(right + 1)) right++;
  return [left + half, right + 1 - half];
}

function patrolOf(grid: TileGrid, shafts: Shaft[], [x, y]: [number, number]): [number, number] {
  const row = Math.round(y);
  const walkable = (col: number): boolean =>
    floorAt(grid, col, row) && !shafts.some((s) => (s.stops ?? [s.top, s.bottom]).includes(row) && col >= s.x && col < s.x + s.w);
  return spanOf(x, walkable, HALF_WIDTH);
}

function airOf(grid: TileGrid, [x, y]: [number, number], cfg: FlightJson): [number, number] {
  const rows = [Math.round(y) - 1, Math.floor(y - cfg.hoverLift)];
  const open = (col: number): boolean => col >= 0 && col < grid.width && rows.every((row) => !grid.solid(col, row));
  return spanOf(x, open, FLYER_HALF[0]);
}

function configuredPatrol(free: [number, number], cells: [number, number] | undefined, half: number): [number, number] {
  if (!cells) return free;
  return [Math.max(free[0], cells[0] + half), Math.min(free[1], cells[1] - half)];
}

export function createEnemy(json: EnemyJson, grid: TileGrid, shafts: Shaft[] = []): Enemy {
  const flight = spawnFlight(json.flight);
  const base = { spot: [json.x, json.y] as [number, number], facing: json.facing, hits: json.hits, flight };
  const free = json.flight ? airOf(grid, base.spot, json.flight) : patrolOf(grid, shafts, base.spot);
  return {
    ...base,
    respawnMs: json.respawnMs,
    reactMs: json.reactMs,
    burst: json.burst,
    pauseMs: json.pauseMs,
    patrol: configuredPatrol(free, json.patrol, json.flight ? FLYER_HALF[0] : HALF_WIDTH),
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

function inSight(e: Enemy, grid: TileGrid, hero: Hero, fog: Fog | null, sightCells: number, dir: number): boolean {
  const { body } = e;
  const dx = hero.x - body.x;
  if (hero.hidden || hero.energy <= 0 || Math.abs(hero.y - ground(e)) > SAME_FLOOR) return false;
  if (Math.sign(dx) !== dir || Math.abs(dx) > sightCells) return false;
  const row = Math.floor(ground(e) - 1);
  for (let col = Math.floor(Math.min(body.x, hero.x)); col <= Math.floor(Math.max(body.x, hero.x)); col++) {
    if (grid.solid(col, row) || (fog && !seenAt(fog, col, row))) return false;
  }
  return true;
}

const sees = (e: Enemy, grid: TileGrid, hero: Hero, fog: Fog | null, sightCells: number): boolean => inSight(e, grid, hero, fog, sightCells, e.body.facing);

function patrol(e: Enemy, clips: ClipSet, dt: number, scale = 1): void {
  const { body } = e;
  const walk = clips.walk;
  const speed = walk ? ((walk.travel ?? 0) / walk.duration) * scale : 0;
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
      setState(body, "idle");
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

function turnToHeroBehind(e: Enemy, f: Flight, grid: TileGrid, fog: Fog | null, hero: Hero, sightCells: number, dt: number): void {
  const behind = inSight(e, grid, hero, fog, sightCells, -e.body.facing);
  f.behindAge = behind ? f.behindAge + dt : 0;
  if (f.behindAge * 1000 < f.cfg.turnMs - 1e-6) return;
  e.body.facing = e.body.facing === 1 ? -1 : 1;
  f.behindAge = 0;
}

function fly(e: Enemy, f: Flight, grid: TileGrid, fog: Fog | null, hero: Hero, clips: ClipSet, sightCells: number, dt: number): number {
  const { body } = e;
  const { cfg } = f;
  f.clock += dt;
  turnToHeroBehind(e, f, grid, fog, hero, sightCells, dt);
  const seen = sees(e, grid, hero, fog, sightCells);
  const target = seen ? cfg.aimLift : cfg.hoverLift + cfg.wave.cells * Math.sin(2 * Math.PI * cfg.wave.hz * f.clock);
  const step = cfg.climb * dt;
  f.lift += Math.max(-step, Math.min(step, target - f.lift));
  body.y = e.spot[1] - f.lift;
  if (seen && Math.abs(f.lift - cfg.aimLift) < AIM_EPS) return shoot(e, dt);
  setState(body, "walk");
  if (!seen || Math.abs(hero.x - body.x) > cfg.closeCells) patrol(e, clips, dt, cfg.speedScale);
  return 0;
}

export function updateEnemy(e: Enemy, grid: TileGrid, fog: Fog | null, hero: Hero, clips: ClipSet, cfg: Pick<MovementConfig, "sightCells">, dt: number): number {
  e.body.time += dt;
  e.pauseLeft = Math.max(0, e.pauseLeft - dt);
  if (e.body.hitAge !== null) e.body.hitAge += dt;
  if (e.deadAge !== null) {
    e.deadAge += dt;
    if (e.respawnMs === null || e.deadAge * 1000 < e.respawnMs - 1e-6) return 0;
    e.flight = spawnFlight(e.flight?.cfg);
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
  if (e.flight) return fly(e, e.flight, grid, fog, hero, clips, cfg.sightCells, dt);
  if (sees(e, grid, hero, fog, cfg.sightCells)) return shoot(e, dt);
  setState(e.body, "walk");
  patrol(e, clips, dt);
  return 0;
}
