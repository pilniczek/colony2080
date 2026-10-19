import { apply } from "../engine/math/mat2d";
import { locate } from "../engine/rig/pose";
import type { Pt } from "../engine/rig/tree";
import { stepProjectiles, type Projectile } from "../engine/world/projectiles";
import { fogEdge, visible } from "./fog";
import type { ClipSet, MovementConfig } from "./hero/config";
import { HERO_SHOT, type Hero, type HeroEvent } from "./hero/hero";
import { createRigs, heroLook, heroScale, type HeroLook, type Rigs } from "./hero/look";
import { ENEMY_SHOT, hitEnemy, isDead, type Enemy } from "./level/enemy";
import type { Prop, SandboxWorld } from "./level/sandboxLevel";
import { applyBlocks, say } from "./level/tasks";
import { holdPoses, MUZZLE_IN_HOOK } from "./robot/gun";
import { ROBOT } from "./robot/xbot";

const DEG = Math.PI / 180;

export const SPARK_LIFE = 0.15;

let simRigs: { rigs: Rigs; hold: ReturnType<typeof holdPoses> } | null = null;

const sim = () => {
  if (!simRigs) {
    const rigs = createRigs(true);
    simRigs = { rigs, hold: holdPoses(rigs.side, rigs.front) };
  }
  return simRigs;
};

export function muzzleInRig(look: HeroLook, rigs: Rigs): Pt | null {
  if (look.gun !== "hand") return null;
  const front = look.view === "front";
  const mat = locate(front ? rigs.front : rigs.side, front ? "handL" : "hand", look.pose);
  return mat ? apply(mat, MUZZLE_IN_HOOK) : null;
}

export function heroMuzzle(h: Hero, clips: ClipSet, cfg: MovementConfig): Pt {
  const { rigs, hold } = sim();
  const look = heroLook(h, clips, rigs, hold, cfg);
  const local = muzzleInRig(look, rigs);
  if (!local) return [h.x, h.y - cfg.box.height / 2];
  const scale = heroScale(cfg);
  const anchor = look.view === "side" ? ROBOT.SIDE_AX : ROBOT.AX;
  const [x, y] = [(local[0] - anchor) * scale, (local[1] - ROBOT.FOOT_Y) * scale];
  const [cos, sin] = [Math.cos(look.rot * DEG), Math.sin(look.rot * DEG)];
  const [rx, ry] = [x * cos - y * sin, x * sin + y * cos];
  const cell = cfg.cellPx;
  return [h.x + ((look.flip ? -rx : rx) / cell), h.y + (look.lift * scale + ry) / cell];
}

const wallFace = (p: Projectile): number => (p.vx > 0 ? Math.floor(p.x) : Math.floor(p.x) + 1);

function wallBetween(world: SandboxWorld, from: number, p: Projectile): number | null {
  const dir = Math.sign(p.vx);
  if (dir === 0) return null;
  const row = Math.floor(p.y);
  for (let col = Math.floor(from); dir > 0 ? col <= Math.floor(p.x) : col >= Math.floor(p.x); col += dir) {
    if (world.grid.solid(col, row)) return dir > 0 ? col : col + 1;
  }
  return null;
}

function enemyFace(enemy: Enemy, cfg: MovementConfig, from: number, p: Projectile): number | null {
  if (p.tag !== HERO_SHOT || isDead(enemy)) return null;
  const { x, y } = enemy.body;
  const half = cfg.box.width / 2 + p.r;
  if (p.y < y - cfg.box.height - p.r || p.y > y + p.r) return null;
  const [lo, hi] = [Math.min(from, p.x), Math.max(from, p.x)];
  if (hi < x - half || lo > x + half) return null;
  return p.vx > 0 ? Math.max(from, x - half) : Math.min(from, x + half);
}

const shootable = (prop: Prop): boolean => !!prop.shootable && (prop.hitsTaken ?? 0) < prop.shootable.hits;

function propFace(prop: Prop, from: number, p: Projectile): number | null {
  if (p.tag !== HERO_SHOT || !shootable(prop)) return null;
  const half = (prop.width ?? 1) / 2;
  const floor = prop.y ?? 0;
  if (p.y < floor - (prop.height ?? 1) || p.y > floor) return null;
  const [lo, hi] = [Math.min(from, p.x), Math.max(from, p.x)];
  if (hi < prop.x - half || lo > prop.x + half) return null;
  return p.vx > 0 ? Math.max(from, prop.x - half) : Math.min(from, prop.x + half);
}

export function hitShootable(world: SandboxWorld, prop: Prop): void {
  const { shootable: spec } = prop;
  if (!spec || !shootable(prop)) return;
  prop.hitsTaken = (prop.hitsTaken ?? 0) + 1;
  if (prop.hitsTaken < spec.hits) return;
  prop.state = spec.state;
  for (const flag of spec.gives ?? []) world.flags.add(flag);
  applyBlocks(world);
  if (spec.subtitle) say(world, spec.subtitle);
}

function sightEdge(world: SandboxWorld, x: number, p: Projectile): number {
  const fog = world.fog ? fogEdge(world.fog, x, p.y, Math.sign(p.vx)) : p.vx * Infinity;
  const end = p.endX ?? p.vx * Infinity;
  return p.vx > 0 ? Math.min(fog, end) : Math.max(fog, end);
}

const beyond = (p: Projectile, x: number, edge: number): boolean => (x - edge) * Math.sign(p.vx) > 0;

const seen = (world: SandboxWorld, x: number, y: number): boolean => !world.fog || visible(world.fog, x, y);

function nearestProp(world: SandboxWorld, from: number, p: Projectile, edge: number): { prop: Prop; face: number } | null {
  let best: { prop: Prop; face: number } | null = null;
  for (const prop of world.props) {
    const face = propFace(prop, from, p);
    if (face === null || beyond(p, face, edge)) continue;
    if (!best || Math.abs(face - from) < Math.abs(best.face - from)) best = { prop, face };
  }
  return best;
}

function strike(world: SandboxWorld, cfg: MovementConfig, from: number, p: Projectile, edge: number, damage = 1, shots = false): boolean {
  let struck: { enemy: Enemy; face: number } | null = null;
  for (const enemy of world.enemies) {
    const face = enemyFace(enemy, cfg, from, p);
    if (face === null || beyond(p, face, edge)) continue;
    if (!struck || Math.abs(face - from) < Math.abs(struck.face - from)) struck = { enemy, face };
  }
  const prop = shots ? nearestProp(world, from, p, edge) : null;
  if (prop && (!struck || Math.abs(prop.face - from) < Math.abs(struck.face - from))) {
    hitShootable(world, prop.prop);
    world.sparks.push({ x: prop.face, y: p.y, age: 0 });
    return true;
  }
  if (!struck) return false;
  hitEnemy(struck.enemy, damage);
  world.sparks.push({ x: struck.face, y: p.y, age: 0 });
  return true;
}

function launch(world: SandboxWorld, cfg: MovementConfig, from: number, bullet: Projectile): void {
  const edge = sightEdge(world, bullet.x, bullet);
  if (strike(world, cfg, from, bullet, edge, cfg.shot.damage, true)) return;
  const face = wallBetween(world, from, bullet);
  if (face === null) world.projectiles.push(bullet);
  else if (!beyond(bullet, face, edge)) world.sparks.push({ x: face, y: bullet.y, age: 0 });
}

export function fireShots(world: SandboxWorld, h: Hero, events: HeroEvent[], clips: ClipSet, cfg: MovementConfig): void {
  for (const e of events) {
    if (e.kind !== "shot") continue;
    const [x, y] = heroMuzzle(h, clips, cfg);
    const bullet = { x, y, vx: h.facing * cfg.shot.speed, r: cfg.shot.radius, tag: HERO_SHOT, originX: x, endX: h.x + h.facing * cfg.sightCells };
    launch(world, cfg, h.x, bullet);
  }
}

export function landPunches(world: SandboxWorld, h: Hero, events: HeroEvent[], cfg: MovementConfig): void {
  for (const e of events) {
    if (e.kind !== "punch") continue;
    const x = h.x + h.facing * (cfg.punch.reach - cfg.box.width / 2);
    const fist = { x, y: h.y - cfg.box.duckHeight / 2, vx: h.facing, r: 0, tag: HERO_SHOT };
    strike(world, cfg, h.x, fist, sightEdge(world, h.x, fist), cfg.punch.damage);
  }
}

export function fireEnemy(world: SandboxWorld, cfg: MovementConfig, clips: ClipSet, enemy: Enemy, count: number): void {
  const { body } = enemy;
  for (let i = 0; i < count; i++) {
    const [x, y] = heroMuzzle(body, clips, cfg);
    if (!seen(world, x, y)) continue;
    launch(world, cfg, body.x, { x: body.x, y, vx: body.facing * cfg.shot.speed, r: cfg.shot.radius, tag: ENEMY_SHOT, originX: x, endX: body.x + body.facing * cfg.sightCells });
  }
}

export function stepShots(world: SandboxWorld, cfg: MovementConfig, dt: number): void {
  world.sparks = world.sparks.filter((s) => (s.age += dt) < SPARK_LIFE);
  const from = new Map(world.projectiles.map((p) => [p, p.x]));
  const alive = new Set(stepProjectiles(world.projectiles, world.grid, dt));
  const { width, height } = world.grid;
  world.projectiles = world.projectiles.filter((p) => {
    const edge = sightEdge(world, from.get(p)!, p);
    if (strike(world, cfg, from.get(p)!, p, edge, cfg.shot.damage, true)) return false;
    const inside = p.x >= 0 && p.x < width && p.y >= 0 && p.y < height;
    if (!alive.has(p) && inside && !beyond(p, wallFace(p), edge)) world.sparks.push({ x: wallFace(p), y: p.y, age: 0 });
    return alive.has(p) && !beyond(p, p.x, edge);
  });
}
