import { apply } from "../engine/math/mat2d";
import { locate } from "../engine/rig/pose";
import type { Pt } from "../engine/rig/tree";
import { stepProjectiles, type Projectile } from "../engine/world/projectiles";
import { fogEdge, visible } from "./fog";
import type { ClipSet, MovementConfig } from "./hero/config";
import { HERO_SHOT, type Hero, type HeroEvent } from "./hero/hero";
import { createRigs, heroLook, heroScale, type HeroLook, type Rigs } from "./hero/look";
import { bodyBox, ENEMY_SHOT, FLYER_GUN, hitEnemy, isDead, type Enemy } from "./level/enemy";
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

type Span = [number, number];

function enemyFace(enemy: Enemy, cfg: MovementConfig, from: number, p: Projectile, span: Span = [p.y, p.y]): number | null {
  if (p.tag !== HERO_SHOT || isDead(enemy)) return null;
  const { left, right, top, bottom } = bodyBox(enemy, cfg.box);
  if (span[1] < top - p.r || span[0] > bottom + p.r) return null;
  const [lo, hi] = [Math.min(from, p.x), Math.max(from, p.x)];
  if (hi < left - p.r || lo > right + p.r) return null;
  return p.vx > 0 ? Math.max(from, left - p.r) : Math.min(from, right + p.r);
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

function strike(world: SandboxWorld, cfg: MovementConfig, from: number, p: Projectile, edge: number, damage = 1, shots = false, span?: Span): boolean {
  let struck: { enemy: Enemy; face: number } | null = null;
  for (const enemy of world.enemies) {
    const face = enemyFace(enemy, cfg, from, p, span);
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

const BEAM_EPS = 1e-6;

const ahead = (dir: number, a: number, b: number): number => (dir > 0 ? Math.max(a, b) : Math.min(a, b));

const nearer = (dir: number, a: number, b: number): number => ahead(-dir, a, b);

interface BeamLine {
  x: number;
  y: number;
  end: number;
  prop: Prop | null;
}

function beamLine(world: SandboxWorld, h: Hero, clips: ClipSet, cfg: MovementConfig): BeamLine {
  const [x, y] = heroMuzzle(h, clips, cfg);
  const reach = h.x + h.facing * cfg.sightCells;
  const ray = { x: reach, y, vx: h.facing, r: 0, tag: HERO_SHOT, endX: reach };
  const open = nearer(h.facing, sightEdge(world, x, ray), wallBetween(world, h.x, ray) ?? reach);
  const end = ahead(h.facing, x, open);
  const prop = nearestProp(world, h.x, { ...ray, x: end }, end);
  return prop ? { x, y, end: ahead(h.facing, x, prop.face), prop: prop.prop } : { x, y, end, prop: null };
}

function burn(world: SandboxWorld, h: Hero, line: BeamLine, cfg: MovementConfig): void {
  if (line.prop) {
    hitShootable(world, line.prop);
    world.sparks.push({ x: line.end, y: line.y, age: 0 });
  }
  const ray = { x: line.end, y: line.y, vx: h.facing, r: 0, tag: HERO_SHOT };
  const burned = new Set<Enemy>();
  for (const enemy of world.enemies) {
    const face = enemyFace(enemy, cfg, h.x, ray);
    if (face === null) continue;
    hitEnemy(enemy, cfg.blaster.damage, !world.beamHits.has(enemy));
    if (!isDead(enemy)) burned.add(enemy);
    world.sparks.push({ x: ahead(h.facing, line.x, face), y: line.y, age: 0 });
  }
  world.beamHits = burned;
}

export function fireBeam(world: SandboxWorld, h: Hero, events: HeroEvent[], clips: ClipSet, cfg: MovementConfig): void {
  const ticks = events.filter((e) => e.kind === "beam").length;
  if (!ticks && (h.weapon !== "blaster" || h.fireTime === null)) {
    world.beam = null;
    world.beamHits.clear();
    return;
  }
  let line = beamLine(world, h, clips, cfg);
  for (let i = 0; i < ticks; i++) {
    burn(world, h, line, cfg);
    if (line.prop && !shootable(line.prop)) line = beamLine(world, h, clips, cfg);
  }
  const { x, y, end } = line;
  world.beam = { x, y, end, facing: h.facing, tick: Math.floor((h.fireTime ?? 0) * cfg.blaster.tickHz + BEAM_EPS) };
}

export function landPunches(world: SandboxWorld, h: Hero, events: HeroEvent[], cfg: MovementConfig): void {
  for (const e of events) {
    if (e.kind !== "punch") continue;
    const x = h.x + h.facing * (cfg.punch.reach - cfg.box.width / 2);
    const fist = { x, y: h.y - cfg.box.duckHeight / 2, vx: h.facing, r: 0, tag: HERO_SHOT };
    const height = h.state === "duckAttack" ? cfg.box.duckHeight : cfg.box.height;
    strike(world, cfg, h.x, fist, sightEdge(world, h.x, fist), cfg.punch.damage, false, [h.y - height, h.y]);
  }
}

const enemyMuzzle = ({ body, flight }: Enemy, clips: ClipSet, cfg: MovementConfig): Pt =>
  flight ? [body.x + body.facing * FLYER_GUN[0], body.y + FLYER_GUN[1]] : heroMuzzle(body, clips, cfg);

export function fireEnemy(world: SandboxWorld, cfg: MovementConfig, clips: ClipSet, enemy: Enemy, count: number): void {
  const { body } = enemy;
  for (let i = 0; i < count; i++) {
    const [x, y] = enemyMuzzle(enemy, clips, cfg);
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
    const x0 = from.get(p)!;
    const edge = sightEdge(world, x0, p);
    if (strike(world, cfg, x0, p, edge, cfg.shot.damage, true)) return false;
    const inside = p.x >= 0 && p.x < width && p.y >= 0 && p.y < height;
    if (!alive.has(p) && inside && !beyond(p, wallFace(p), edge)) world.sparks.push({ x: wallFace(p), y: p.y, age: 0 });
    if (!alive.has(p) || x0 === p.endX || beyond(p, x0, edge)) return false;
    if (beyond(p, p.x, edge)) p.x = p.endX = edge;
    return true;
  });
}
