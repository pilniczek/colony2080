import { clamp } from "../engine/anim/keyed";
import { apply } from "../engine/math/mat2d";
import { locate } from "../engine/rig/pose";
import type { Pt } from "../engine/rig/tree";
import { fogEdge, visible } from "./fog";
import type { ClipSet, MovementConfig } from "./hero/config";
import type { Hero, HeroEvent } from "./hero/hero";
import { createRigs, heroLook, heroScale, type HeroLook, type Rigs } from "./hero/look";
import { bodyBox, hitEnemy, isDead, shotBox, type Enemy } from "./level/enemy";
import { startFilm, type Flame, type Prop, type SandboxWorld, type Strike } from "./level/sandboxLevel";
import { repelHero, updateGuard } from "./level/guards";
import { flyMissile, launchMissile } from "./level/missiles";
import { live, tick } from "./level/projectile";
import { flyRocket, launchRocket } from "./level/rockets";
import { applyEffects, say, unseen } from "./level/tasks";
import { heroHolds, MUZZLE_IN_HOOK } from "./robot/gun";
import { TOASTER_MUZZLE_IN_HOOK, TOASTER_WEAPON } from "./robot/toaster";
import { FLAME_LIFE, FLAME_STEPS, FLAMETHROWER_MUZZLE_IN_HOOK, FLAMETHROWER_WEAPON } from "./robot/flamethrower";
import { kindOf } from "./robot/kinds";
import { cue } from "./sound/cues";
import { explode } from "./sound/triggers";
import { ROBOT } from "./robot/xbot";

const DEG = Math.PI / 180;

export const SPARK_LIFE = 0.15;

type Holds = ReturnType<typeof heroHolds>;

let simRigs: { rigs: Rigs; hold: Holds; toasterHold: Holds; flameHold: Holds } | null = null;

const sim = () => {
  if (!simRigs) {
    const rigs = createRigs(true);
    simRigs = { rigs, hold: heroHolds(rigs.side, rigs.front), toasterHold: heroHolds(rigs.side, rigs.front, TOASTER_WEAPON), flameHold: heroHolds(rigs.side, rigs.front, FLAMETHROWER_WEAPON) };
  }
  return simRigs;
};

export function muzzleInRig(look: HeroLook, rigs: Rigs, local: Pt = MUZZLE_IN_HOOK): Pt | null {
  if (look.gun !== "hand") return null;
  const front = look.view === "front";
  const mat = locate(front ? rigs.front : rigs.side, front ? "handL" : "hand", look.pose);
  return mat ? apply(mat, local) : null;
}

export function heroMuzzle(h: Hero, clips: ClipSet, cfg: MovementConfig): Pt {
  const { rigs, hold } = sim();
  return rigPoint(h, heroLook(h, clips, rigs, hold, cfg), rigs, MUZZLE_IN_HOOK, cfg);
}

function toasterMuzzle(h: Hero, clips: ClipSet, cfg: MovementConfig): Pt {
  const { rigs, toasterHold } = sim();
  return rigPoint(h, heroLook(h, clips, rigs, toasterHold, cfg), rigs, TOASTER_MUZZLE_IN_HOOK, cfg);
}

function flameMuzzle(h: Hero, clips: ClipSet, cfg: MovementConfig): Pt {
  const { rigs, flameHold } = sim();
  return rigPoint(h, heroLook(h, clips, rigs, flameHold, cfg), rigs, FLAMETHROWER_MUZZLE_IN_HOOK, cfg);
}

function rigPoint(h: Hero, look: HeroLook, rigs: Rigs, inHand: Pt, cfg: MovementConfig): Pt {
  const local = muzzleInRig(look, rigs, inHand);
  if (!local) return [h.x, h.y - cfg.box.height / 2];
  const scale = heroScale(cfg);
  const anchor = look.view === "side" ? ROBOT.SIDE_AX : ROBOT.AX;
  const [x, y] = [(local[0] - anchor) * scale, (local[1] - ROBOT.FOOT_Y) * scale];
  const [cos, sin] = [Math.cos(look.rot * DEG), Math.sin(look.rot * DEG)];
  const [rx, ry] = [x * cos - y * sin, x * sin + y * cos];
  const cell = cfg.cellPx;
  return [h.x + ((look.flip ? -rx : rx) / cell), h.y + (look.lift * scale + ry) / cell];
}

interface Ray {
  from: number;
  y: number;
  dir: -1 | 1;
  end: number;
}

const ahead = (dir: number, a: number, b: number): number => (dir > 0 ? Math.max(a, b) : Math.min(a, b));

const nearer = (dir: number, a: number, b: number): number => ahead(-dir, a, b);

const spark = (world: SandboxWorld, x: number, y: number): void => {
  world.sparks.push({ x, y, age: 0 });
};

function wallBetween(world: SandboxWorld, from: number, to: number, y: number, dir: -1 | 1): number | null {
  const row = Math.floor(y);
  for (let col = Math.floor(from); dir > 0 ? col <= Math.floor(to) : col >= Math.floor(to); col += dir) {
    if (world.grid.solid(col, row)) return dir > 0 ? col : col + 1;
  }
  return null;
}

function sightEdge(world: SandboxWorld, x: number, y: number, dir: -1 | 1, reach: number): number {
  return world.fog ? nearer(dir, fogEdge(world.fog, x, y, dir), reach) : reach;
}

function openRay(world: SandboxWorld, h: Hero, y: number, cfg: MovementConfig): { ray: Ray; wall: number | null } {
  const reach = h.x + h.facing * cfg.sightCells;
  const wall = wallBetween(world, h.x, reach, y, h.facing);
  const end = nearer(h.facing, sightEdge(world, h.x, y, h.facing, reach), wall ?? reach);
  return { ray: { from: h.x, y, dir: h.facing, end }, wall };
}

const across = (ray: Ray, left: number, right: number): boolean =>
  Math.max(ray.from, ray.end) >= left && Math.min(ray.from, ray.end) <= right;

const faceOf = (ray: Ray, left: number, right: number): number => (ray.dir > 0 ? Math.max(ray.from, left) : Math.min(ray.from, right));

type Span = [number, number];

function enemyFace(enemy: Enemy, cfg: MovementConfig, ray: Ray, span?: Span): number | null {
  if (isDead(enemy)) return null;
  const { left, right, top, bottom } = span ? bodyBox(enemy, cfg.box) : shotBox(enemy, cfg.box);
  const [y0, y1] = span ?? [ray.y, ray.y];
  if (y1 < top || y0 > bottom || !across(ray, left, right)) return null;
  return faceOf(ray, left, right);
}

const sparkY = (enemy: Enemy, cfg: MovementConfig, y: number): number => {
  const { top, bottom } = bodyBox(enemy, cfg.box);
  return clamp(y, top, bottom);
};

const shootable = (prop: Prop): boolean => !!prop.shootable && (prop.hitsTaken ?? 0) < prop.shootable.hits;

type Hit = Strike | "beam";

function propFace(prop: Prop, ray: Ray, hit: Hit): number | null {
  const only = prop.shootable?.by;
  if (!shootable(prop) || (only !== undefined && only !== hit)) return null;
  const half = (prop.width ?? 1) / 2;
  const floor = prop.y ?? 0;
  if (ray.y < floor - (prop.height ?? 1) || ray.y > floor || !across(ray, prop.x - half, prop.x + half)) return null;
  return faceOf(ray, prop.x - half, prop.x + half);
}

export function hitShootable(world: SandboxWorld, prop: Prop, by: Strike = "shot"): void {
  const { shootable: spec } = prop;
  if (!spec || !shootable(prop)) return;
  prop.hitsTaken = (prop.hitsTaken ?? 0) + 1;
  if (prop.hitsTaken < spec.hits) return;
  prop.state = spec.state;
  prop.brokenAge = 0;
  if (prop.fires) explode(world);
  applyEffects(world, spec);
  startFilm(world, spec.cutscene?.[by]);
}

function nearestProp(world: SandboxWorld, ray: Ray, hit: Hit): { prop: Prop; face: number } | null {
  let best: { prop: Prop; face: number } | null = null;
  for (const prop of world.props) {
    if (unseen(world, prop)) continue;
    const face = propFace(prop, ray, hit);
    if (face !== null && (!best || Math.abs(face - ray.from) < Math.abs(best.face - ray.from))) best = { prop, face };
  }
  return best;
}

function harm(world: SandboxWorld, enemy: Enemy, damage: number, react?: boolean): void {
  if (hitEnemy(enemy, damage, react) && isDead(enemy)) explode(world);
}

function strike(world: SandboxWorld, cfg: MovementConfig, ray: Ray, damage: number, by: Strike, span?: Span): boolean {
  let struck: { enemy: Enemy; face: number } | null = null;
  for (const enemy of world.enemies) {
    const face = enemyFace(enemy, cfg, ray, span);
    if (face !== null && (!struck || Math.abs(face - ray.from) < Math.abs(struck.face - ray.from))) struck = { enemy, face };
  }
  const prop = nearestProp(world, ray, by);
  if (prop && (!struck || Math.abs(prop.face - ray.from) < Math.abs(struck.face - ray.from))) {
    hitShootable(world, prop.prop, by);
    spark(world, prop.face, ray.y);
    return true;
  }
  if (!struck) return false;
  harm(world, struck.enemy, damage);
  spark(world, struck.face, sparkY(struck.enemy, cfg, ray.y));
  return true;
}

export function fireShots(world: SandboxWorld, h: Hero, events: HeroEvent[], clips: ClipSet, cfg: MovementConfig): void {
  for (const e of events) {
    if (e.kind !== "shot") continue;
    const { ray, wall } = openRay(world, h, heroMuzzle(h, clips, cfg)[1], cfg);
    if (!strike(world, cfg, ray, cfg.shot.damage, "shot") && wall === ray.end) spark(world, wall, ray.y);
  }
}

const BEAM_EPS = 1e-6;

interface BeamLine {
  x: number;
  y: number;
  end: number;
  prop: Prop | null;
}

function beamLine(world: SandboxWorld, h: Hero, clips: ClipSet, cfg: MovementConfig): BeamLine {
  const [x, y] = heroMuzzle(h, clips, cfg);
  const { ray } = openRay(world, h, y, cfg);
  const end = ahead(h.facing, x, ray.end);
  const prop = nearestProp(world, { ...ray, end }, "beam");
  return prop ? { x, y, end: ahead(h.facing, x, prop.face), prop: prop.prop } : { x, y, end, prop: null };
}

function burn(world: SandboxWorld, h: Hero, line: BeamLine, cfg: MovementConfig): void {
  if (line.prop) {
    hitShootable(world, line.prop);
    spark(world, line.end, line.y);
  }
  const ray: Ray = { from: h.x, y: line.y, dir: h.facing, end: line.end };
  const burned = new Set<Enemy>();
  for (const enemy of world.enemies) {
    const face = enemyFace(enemy, cfg, ray);
    if (face === null) continue;
    harm(world, enemy, cfg.blaster.damage, !world.beamHits.has(enemy));
    if (!isDead(enemy)) burned.add(enemy);
    spark(world, ahead(h.facing, line.x, face), sparkY(enemy, cfg, line.y));
  }
  world.beamHits = burned;
}

function toasterReach(world: SandboxWorld, h: Hero, [x, y]: Pt, cfg: MovementConfig): { ray: Ray; end: number } {
  const { ray } = openRay(world, h, y, cfg);
  return { ray, end: ahead(h.facing, x, nearer(h.facing, ray.end, h.x + h.facing * cfg.toaster.range)) };
}

export function toasterSight(world: SandboxWorld, h: Hero, look: HeroLook, rigs: Rigs, cfg: MovementConfig): { x: number; y: number; end: number } {
  const muzzle = rigPoint(h, look, rigs, TOASTER_MUZZLE_IN_HOOK, cfg);
  const { ray, end } = toasterReach(world, h, muzzle, cfg);
  const prop = nearestProp(world, { ...ray, end }, "beam");
  return { x: muzzle[0], y: muzzle[1], end: prop ? ahead(h.facing, muzzle[0], prop.face) : end };
}

function toasterLine(world: SandboxWorld, h: Hero, clips: ClipSet, cfg: MovementConfig): BeamLine {
  const [x, y] = toasterMuzzle(h, clips, cfg);
  const { ray, end } = toasterReach(world, h, [x, y], cfg);
  const prop = nearestProp(world, { ...ray, end }, "beam");
  return prop ? { x, y, end: ahead(h.facing, x, prop.face), prop: prop.prop } : { x, y, end, prop: null };
}

function toast(world: SandboxWorld, h: Hero, line: BeamLine, cfg: MovementConfig): boolean {
  let hit = false;
  if (line.prop) {
    hitShootable(world, line.prop);
    spark(world, line.end, line.y);
    hit = true;
  }
  const ray: Ray = { from: h.x, y: line.y, dir: h.facing, end: line.end };
  for (const enemy of world.enemies) {
    const face = enemyFace(enemy, cfg, ray);
    if (face === null) continue;
    harm(world, enemy, cfg.toaster.damage, true);
    spark(world, ahead(h.facing, line.x, face), sparkY(enemy, cfg, line.y));
    hit = true;
  }
  return hit;
}

function fireToaster(world: SandboxWorld, h: Hero, ticks: number, clips: ClipSet, cfg: MovementConfig, clock = 0): void {
  const { cycle, hitFrame, ammoFrame } = cfg.toaster;
  let frame = world.beam?.cycle ?? 0;
  let drawn = world.beam?.tick ?? 0;
  let line = toasterLine(world, h, clips, cfg);
  const released = h.fireTime === null;
  for (let i = 0; i < ticks; i++) {
    if (frame === ammoFrame) h.blaster = Math.max(0, (h.blaster ?? 0) - 1);
    frame = (frame + 1) % cycle;
    drawn = frame;
    if (frame === 1) cue(world, "laser", 12000);
    if (frame >= hitFrame && toast(world, h, line, cfg)) {
      frame = 0;
      line = toasterLine(world, h, clips, cfg);
    }
    if (released && frame === 0) {
      world.beam = null;
      return;
    }
  }
  const { x, y, end } = line;
  world.beam = { x, y, end, facing: h.facing, tick: drawn, cycle: frame, clock };
}

function flightTicks(world: SandboxWorld, dt: number, cfg: MovementConfig): { ticks: number; clock: number } {
  const t = (world.beam?.clock ?? 0) + dt * cfg.blaster.tickHz;
  const ticks = Math.floor(t + BEAM_EPS);
  return { ticks, clock: Math.max(0, t - ticks) };
}

const inFlight = (world: SandboxWorld, h: Hero): boolean => world.bonus === "toaster" && h.weapon === "blaster" && !!world.beam?.cycle;

const FLAME_PX = 24;

function flameStop(world: SandboxWorld, f: Flame): Prop | "wall" | null {
  if (world.grid.solid(Math.floor(f.x), Math.floor(f.y)) || (world.fog && !visible(world.fog, f.x, f.y))) return "wall";
  return world.props.find((p) => shootable(p) && Math.abs(p.x - f.x) <= (p.width ?? 1) / 2 && f.y <= (p.y ?? 0) && f.y >= (p.y ?? 0) - (p.height ?? 1)) ?? null;
}

function advanceFlame(world: SandboxWorld, h: Hero, f: Flame): boolean {
  f.age += 1;
  if (f.age > FLAME_LIFE) return false;
  const carried = h.onGround && Math.sign(h.vx) === f.facing ? 2 : 1;
  f.x += (f.facing * carried * FLAME_STEPS[f.age - 1]!) / FLAME_PX;
  const stop = flameStop(world, f);
  if (stop && stop !== "wall") {
    hitShootable(world, stop);
    spark(world, f.x, f.y);
  }
  return !stop;
}

function scorch(world: SandboxWorld, flames: Flame[], cfg: MovementConfig): void {
  const { reach, damage } = cfg.flamethrower;
  const burned = new Set<Enemy>();
  for (const enemy of world.enemies) {
    if (isDead(enemy)) continue;
    const { top, bottom } = shotBox(enemy, cfg.box);
    const col = Math.floor(enemy.body.x);
    const near = flames.filter((f) => Math.abs(Math.floor(f.x) - col) <= reach && f.y >= top && f.y <= bottom);
    if (!near.length) continue;
    harm(world, enemy, near.length * damage, !world.beamHits.has(enemy));
    if (!isDead(enemy)) burned.add(enemy);
    spark(world, near[near.length - 1]!.x, near[near.length - 1]!.y);
  }
  world.beamHits = burned;
}

function fireFlames(world: SandboxWorld, h: Hero, ticks: number, clips: ClipSet, cfg: MovementConfig, dt: number): void {
  const { spawnTicks, soundTicks } = cfg.flamethrower;
  const firing = h.weapon === "blaster" && h.fireTime !== null;
  const flames = world.beam?.flames ?? [];
  const flight = firing ? { ticks, clock: 0 } : flightTicks(world, dt, cfg);
  let tick = firing ? (world.beam?.tick ?? 0) : 0;
  const [x, y] = flameMuzzle(h, clips, cfg);
  let live = flames;
  for (let i = 0; i < flight.ticks; i++) {
    if (firing && (h.blaster ?? 0) > 0 && tick % spawnTicks === 0) {
      live.push({ x, y, facing: h.facing, age: 0, seed: tick });
      h.blaster = (h.blaster ?? 0) - 1;
      if (tick % soundTicks === 0) cue(world, "flame", 6500);
    }
    if (firing) tick += 1;
    live = live.filter((f) => advanceFlame(world, h, f));
    scorch(world, live, cfg);
  }
  if (!firing && !live.length) {
    world.beam = null;
    world.beamHits.clear();
    return;
  }
  world.beam = { x, y, end: x, facing: h.facing, tick, clock: flight.clock, flames: live };
}

export function fireBeam(world: SandboxWorld, h: Hero, events: HeroEvent[], clips: ClipSet, cfg: MovementConfig, dt = 0): void {
  const ticks = events.filter((e) => e.kind === "beam").length;
  if (world.bonus === "flamethrower") return fireFlames(world, h, ticks, clips, cfg, dt);
  if (!ticks && h.fireTime === null && inFlight(world, h)) {
    const flight = flightTicks(world, dt, cfg);
    return fireToaster(world, h, flight.ticks, clips, cfg, flight.clock);
  }
  if (!ticks && (h.weapon !== "blaster" || h.fireTime === null)) {
    world.beam = null;
    world.beamHits.clear();
    return;
  }
  if (world.bonus === "toaster") return fireToaster(world, h, ticks, clips, cfg);
  let line = beamLine(world, h, clips, cfg);
  for (let i = 0; i < ticks; i++) {
    burn(world, h, line, cfg);
    if (line.prop && !shootable(line.prop)) line = beamLine(world, h, clips, cfg);
  }
  const { x, y, end } = line;
  world.beam = { x, y, end, facing: h.facing, tick: Math.floor((h.fireTime ?? 0) * cfg.blaster.tickHz + BEAM_EPS) };
}

export const BONUS_LOW = "flag:bonusLow";
export const BONUS_LOW_TEXT: Record<SandboxWorld["bonus"], string> = {
  blaster: "E-Blaster ammo is running low. Save it: some obstacles fall only to the E-Blaster.",
  toaster: "Toaster ammo is running low. Save it: some obstacles fall only to the Toaster.",
  flamethrower: "Flamethrower ammo is running low. Save it: some obstacles fall only to the Flamethrower.",
};

const beamOnlyLeft = (world: SandboxWorld): boolean => world.props.some((p) => p.shootable?.by === "beam" && p.state !== p.shootable.state);

export function warnLowBonus(world: SandboxWorld, h: Hero, cfg: MovementConfig): void {
  if (h.blaster === null || h.blaster >= cfg[world.bonus].lowWarn || world.flags.has(BONUS_LOW) || !beamOnlyLeft(world)) return;
  world.flags.add(BONUS_LOW);
  say(world, BONUS_LOW_TEXT[world.bonus]);
}

export function landPunches(world: SandboxWorld, h: Hero, events: HeroEvent[], cfg: MovementConfig): void {
  for (const e of events) {
    if (e.kind !== "punch") continue;
    const fist = h.x + h.facing * (cfg.punch.reach - cfg.box.width / 2);
    const y = h.y - cfg.box.duckHeight / 2;
    const height = h.state === "duckAttack" ? cfg.box.duckHeight : cfg.box.height;
    const ray: Ray = { from: h.x, y, dir: h.facing, end: sightEdge(world, h.x, y, h.facing, fist) };
    strike(world, cfg, ray, cfg.punch.damage, "punch", [h.y - height, h.y]);
  }
}

function enemyFire(world: SandboxWorld, sound: "laser" | "cannon", count: number, damage = 1): void {
  world.heroHits += count * damage;
  for (let i = 0; i < count; i++) cue(world, sound, 15000);
}

function launcherTip({ body, kind }: Enemy, clips: ClipSet, cfg: MovementConfig): Pt {
  const { launch: inHand, rigs, hold, clips: own } = kindOf(kind);
  if (!inHand) return [body.x, body.y - cfg.box.height / 2];
  return rigPoint(body, heroLook(body, own ? { ...clips, ...own } : clips, rigs, hold, cfg), rigs, inHand, cfg);
}

export function fireEnemy(world: SandboxWorld, enemy: Enemy, count: number, clips: ClipSet, cfg: MovementConfig): void {
  const { rocket, missiles, body } = enemy;
  if (!rocket && !missiles) return enemyFire(world, enemy.flight ? "laser" : "cannon", count, enemy.damage);
  for (let i = 0; i < count; i++) {
    if (rocket) world.projectiles.push(launchRocket(launcherTip(enemy, clips, cfg), body.facing, rocket));
    if (missiles) world.projectiles.push(launchMissile([body.x + body.facing * missiles.muzzle[0]!, body.y - missiles.muzzle[1]!], body.facing, missiles));
    cue(world, "takeoff", 15000);
  }
}

export function stepProjectiles(world: SandboxWorld, hero: Hero, cfg: MovementConfig, dt: number): void {
  for (const p of world.projectiles) {
    const { hits, burst } =
      p.kind === "rocket"
        ? tick(p, dt, (r) => flyRocket(r, world.grid, hero, cfg.box, dt))
        : tick(p, dt, (m) => flyMissile(m, world.grid, world.fog, hero, cfg.box, dt));
    world.heroHits += hits;
    if (burst) explode(world);
  }
  world.projectiles = world.projectiles.filter(live);
}

function repelled(world: SandboxWorld, hits: number): void {
  if (!hits) return;
  world.heroHits += hits;
  cue(world, "cannon", 15000);
}

export function fireGuards(world: SandboxWorld, hero: Hero, cfg: MovementConfig, dt: number): void {
  for (const prop of world.props) {
    if (prop.fires) enemyFire(world, "cannon", updateGuard(prop, world.grid, world.fog, hero, cfg.sightCells, dt));
    if (prop.repels) repelled(world, repelHero(prop, world, hero, cfg, dt));
  }
}

export function ageSparks(world: SandboxWorld, dt: number): void {
  world.sparks = world.sparks.filter((s) => (s.age += dt) < SPARK_LIFE);
}
