import { apply } from "../engine/math/mat2d";
import { locate } from "../engine/rig/pose";
import type { Pt } from "../engine/rig/tree";
import { stepProjectiles, type Projectile } from "../engine/world/projectiles";
import type { ClipSet, MovementConfig } from "./hero/config";
import { SPIKE_K } from "./hero/gait";
import { HERO_SHOT, type Hero, type HeroEvent } from "./hero/hero";
import { createRigs, heroLook, heroScale, type HeroLook, type Rigs } from "./hero/look";
import { ceilingAbove, type Prop, type SandboxWorld } from "./level/sandboxLevel";
import { holdPoses, MUZZLE_IN_HOOK } from "./robot/gun";
import { ROBOT } from "./robot/xbot";

const DEG = Math.PI / 180;

export const SPARK_LIFE = 0.15;
export const TARGET_WIDTH = 40;
export const BAG = { rope: 12, w: 32, h: 92 };

let simRigs: { rigs: Rigs; hold: ReturnType<typeof holdPoses> } | null = null;

const sim = () => {
  if (!simRigs) {
    const rigs = createRigs(true);
    simRigs = { rigs, hold: holdPoses(rigs.side, rigs.front) };
  }
  return simRigs;
};

export const spikeCells = (cfg: MovementConfig): number => heroScale(cfg) / (SPIKE_K * cfg.cellPx);

export function muzzleInRig(look: HeroLook, rigs: Rigs): Pt | null {
  if (look.gun !== "hand") return null;
  const front = look.view === "front";
  const mat = locate(front ? rigs.front : rigs.side, front ? "handL" : "hand", look.pose);
  return mat ? apply(mat, MUZZLE_IN_HOOK) : null;
}

export function heroMuzzle(h: Hero, clips: ClipSet, cfg: MovementConfig): Pt {
  const { rigs, hold } = sim();
  const look = heroLook(h, clips, rigs, hold);
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
  const row = Math.floor(p.y);
  for (let col = Math.floor(from); dir > 0 ? col <= Math.floor(p.x) : col >= Math.floor(p.x); col += dir) {
    if (world.grid.solid(col, row)) return dir > 0 ? col : col + 1;
  }
  return null;
}

export function fireShots(world: SandboxWorld, h: Hero, events: HeroEvent[], clips: ClipSet, cfg: MovementConfig): void {
  for (const e of events) {
    if (e.kind !== "shot") continue;
    const [x, y] = heroMuzzle(h, clips, cfg);
    const bullet = { x, y, vx: h.facing * cfg.shot.speed, r: cfg.shot.radius, tag: HERO_SHOT };
    const face = wallBetween(world, h.x, bullet) ?? propHit(world, bullet, h.x, cfg);
    if (face === null) world.projectiles.push(bullet);
    else world.sparks.push({ x: face, y, age: 0 });
  }
}

interface Span {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function blocker(world: SandboxWorld, p: Prop, cfg: MovementConfig): Span | null {
  if (p.kind === "bag") {
    const k = spikeCells(cfg);
    const top = ceilingAbove(world, p) + BAG.rope * k;
    return { left: p.x - (BAG.w / 2) * k, right: p.x + (BAG.w / 2) * k, top, bottom: top + BAG.h * k };
  }
  const size =
    p.kind === "target"
      ? { w: TARGET_WIDTH * spikeCells(cfg), h: cfg.heroHeightCells }
      : p.kind === "crate" || p.kind === "barrel"
        ? { w: p.width ?? 1, h: p.height ?? 1 }
        : null;
  if (!size) return null;
  const bottom = p.y ?? world.spawn[1];
  return { left: p.x - size.w / 2, right: p.x + size.w / 2, top: bottom - size.h, bottom };
}

function propHit(world: SandboxWorld, p: Projectile, from: number, cfg: MovementConfig): number | null {
  let hit: number | null = null;
  for (const prop of world.props) {
    const s = blocker(world, prop, cfg);
    if (!s || p.y < s.top || p.y > s.bottom) continue;
    const face = p.vx > 0 ? s.left : s.right;
    const crossed = p.vx > 0 ? from <= face && p.x >= face : from >= face && p.x <= face;
    if (crossed && (hit === null || Math.abs(face - from) < Math.abs(hit - from))) hit = face;
  }
  return hit;
}


export function stepShots(world: SandboxWorld, cfg: MovementConfig, dt: number): void {
  world.sparks = world.sparks.filter((s) => (s.age += dt) < SPARK_LIFE);
  const from = new Map(world.projectiles.map((p) => [p, p.x]));
  const alive = new Set(stepProjectiles(world.projectiles, world.grid, dt));
  const { width, height } = world.grid;
  world.projectiles = world.projectiles.filter((p) => {
    const inside = p.x >= 0 && p.x < width && p.y >= 0 && p.y < height;
    if (!alive.has(p)) {
      if (inside) world.sparks.push({ x: wallFace(p), y: p.y, age: 0 });
      return false;
    }
    if (p.tag !== HERO_SHOT) return true;
    const face = propHit(world, p, from.get(p)!, cfg);
    if (face === null) return true;
    world.sparks.push({ x: face, y: p.y, age: 0 });
    return false;
  });
}
