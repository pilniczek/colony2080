import type { TileGrid } from "../../engine/world/tiles";
import { FLYER_HULL } from "../env/flyer";
import { TILE } from "../env/paint";
import { seenAt, type Fog } from "../fog";
import type { ClipSet, MovementConfig } from "../hero/config";
import { createHero, type Hero } from "../hero/hero";
import type { KeepOut } from "./cover";

export const SAME_FLOOR = 0.5;
const HALF_WIDTH = 0.35;
const AIM_EPS = 0.02;

export const FLYER_HALF: [number, number] = [FLYER_HULL.w / 2 / TILE, FLYER_HULL.h / 2 / TILE];

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
  wave: { cells: number; hz: number };
}

export interface Flight {
  cfg: FlightJson;
  lift: number;
  clock: number;
  engaged: boolean;
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
  tracking: boolean;
  pauseLeft: number;
  flight: Flight | null;
}

const walking = (body: Hero): Hero => ({ ...body, state: "walk" });

const setState = (body: Hero, state: "walk" | "idle"): void => {
  if (body.state !== state) Object.assign(body, { state, time: 0, fireTime: null });
};

const spawnFlight = (cfg: FlightJson | undefined): Flight | null => (cfg ? { cfg, lift: cfg.hoverLift, clock: 0, engaged: false } : null);

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

export function shotBox(e: Enemy, box: { width: number; height: number }): BodyBox {
  const body = bodyBox(e, box);
  return e.flight ? { ...body, bottom: e.spot[1] } : body;
}

const floorAt = (grid: TileGrid, col: number, row: number): boolean =>
  (grid.solid(col, row) || grid.oneWay(col, row)) && !grid.solid(col, row - 1);

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

function keptOut(patrol: [number, number], [x, y]: [number, number], keepOut: KeepOut[], half: number): [number, number] {
  let [left, right] = patrol;
  for (const { y: floor, span } of keepOut) {
    if (Math.abs(floor - y) > 1 || span[1] + half <= left || span[0] - half >= right) continue;
    if (x < (span[0] + span[1]) / 2) right = Math.min(right, span[0] - half);
    else left = Math.max(left, span[1] + half);
  }
  return [left, right];
}

export function createEnemy(json: EnemyJson, grid: TileGrid, shafts: Shaft[] = [], keepOut: KeepOut[] = []): Enemy {
  const flight = spawnFlight(json.flight);
  const half = json.flight ? FLYER_HALF[0] : HALF_WIDTH;
  const spot: [number, number] = [json.x, json.y];
  const free = json.flight ? airOf(grid, spot, json.flight) : patrolOf(grid, shafts, spot);
  const patrol = keptOut(configuredPatrol(free, json.patrol, half), spot, keepOut, half);
  const base = { spot: [Math.min(patrol[1], Math.max(patrol[0], json.x)), json.y] as [number, number], facing: json.facing, hits: json.hits, flight };
  return {
    ...base,
    respawnMs: json.respawnMs,
    reactMs: json.reactMs,
    burst: json.burst,
    pauseMs: json.pauseMs,
    patrol,
    body: spawnBody(base),
    deadAge: null,
    alertAge: null,
    tracking: false,
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

export interface Watch {
  x: number;
  ground: number;
  facing: -1 | 1;
}

export function seesHero({ x, ground, facing }: Watch, grid: TileGrid, hero: Hero, fog: Fog | null, sightCells: number): boolean {
  const dx = hero.x - x;
  if (hero.hidden || hero.energy <= 0 || Math.abs(hero.y - ground) > SAME_FLOOR) return false;
  if (Math.sign(dx) !== facing || Math.abs(dx) > sightCells) return false;
  const row = Math.floor(ground - 1);
  for (let col = Math.floor(Math.min(x, hero.x)); col <= Math.floor(Math.max(x, hero.x)); col++) {
    if (grid.solid(col, row) || (fog && !seenAt(fog, col, row))) return false;
  }
  return true;
}

const sees = (e: Enemy, grid: TileGrid, hero: Hero, fog: Fog | null, sightCells: number): boolean =>
  seesHero({ x: e.body.x, ground: ground(e), facing: e.body.facing }, grid, hero, fog, sightCells);

const inReach = (e: Enemy, grid: TileGrid, hero: Hero, fog: Fog | null, sightCells: number): boolean =>
  hero.x !== e.body.x && seesHero({ x: e.body.x, ground: ground(e), facing: hero.x > e.body.x ? 1 : -1 }, grid, hero, fog, sightCells);

function track(e: Enemy, grid: TileGrid, hero: Hero, fog: Fog | null, sightCells: number): void {
  if (sees(e, grid, hero, fog, sightCells)) e.tracking = true;
  else if (e.tracking && inReach(e, grid, hero, fog, sightCells)) e.alertAge ??= 0;
  else e.tracking = false;
}

export function burstStep(time: number, dt: number, burst: Burst): { time: number; fired: number; done: boolean } {
  const rate = (burst.shots - 1) / (burst.ms / 1000);
  const before = Math.floor(time * rate + 1e-9);
  const after = time + dt;
  const total = Math.min(burst.shots - 1, Math.floor(after * rate + 1e-9));
  return { time: after, fired: total - before, done: total === burst.shots - 1 };
}

function blockedSpan(e: Enemy, grid: TileGrid, [left, right]: [number, number]): [number, number] {
  const half = e.flight ? FLYER_HALF[0] : HALF_WIDTH;
  const { x, y } = e.body;
  const row = Math.floor(y - 0.5);
  let high = Math.floor(x) + 1;
  while (high - half < right && !grid.solid(high, row)) high++;
  let low = Math.floor(x) - 1;
  while (low + 1 + half > left && !grid.solid(low, row)) low--;
  return [Math.max(left, Math.min(low + 1 + half, x)), Math.min(right, Math.max(high - half, x))];
}

function patrol(e: Enemy, grid: TileGrid, clips: ClipSet, dt: number, scale = 1): void {
  const { body } = e;
  const walk = clips.walk;
  const speed = walk ? ((walk.travel ?? 0) / walk.duration) * scale : 0;
  const [left, right] = blockedSpan(e, grid, e.patrol);
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
  const step = burstStep(body.fireTime ?? 0, dt, burst);
  body.fireTime = step.time;
  if (step.done) {
    Object.assign(body, { state: "idle", time: 0, fireTime: null });
    e.pauseLeft = e.pauseMs / 1000;
  }
  return step.fired;
}

function fly(e: Enemy, f: Flight, grid: TileGrid, fog: Fog | null, hero: Hero, clips: ClipSet, sightCells: number, dt: number): number {
  const { body } = e;
  const { cfg } = f;
  f.clock += dt;
  const seen = sees(e, grid, hero, fog, sightCells);
  const target = seen || f.engaged ? cfg.aimLift : cfg.hoverLift + cfg.wave.cells * Math.sin(2 * Math.PI * cfg.wave.hz * f.clock);
  const step = cfg.climb * dt;
  f.lift += Math.max(-step, Math.min(step, target - f.lift));
  body.y = e.spot[1] - f.lift;
  f.engaged ||= seen && Math.abs(f.lift - cfg.aimLift) < AIM_EPS;
  if (seen && Math.abs(f.lift - cfg.aimLift) < AIM_EPS) return shoot(e, dt);
  setState(body, "walk");
  if (!seen || Math.abs(hero.x - body.x) > cfg.closeCells) patrol(e, grid, clips, dt, cfg.speedScale);
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
    e.tracking = false;
    e.pauseLeft = 0;
    return 0;
  }
  track(e, grid, hero, fog, cfg.sightCells);
  if (e.alertAge !== null && (e.alertAge += dt) * 1000 >= e.reactMs - 1e-6) {
    if (hero.x !== e.body.x) e.body.facing = hero.x > e.body.x ? 1 : -1;
    e.alertAge = null;
  }
  if (e.flight) return fly(e, e.flight, grid, fog, hero, clips, cfg.sightCells, dt);
  if (sees(e, grid, hero, fog, cfg.sightCells)) return shoot(e, dt);
  setState(e.body, "walk");
  patrol(e, grid, clips, dt);
  return 0;
}
