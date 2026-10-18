import type { InputFrame } from "../../engine/input";
import { clamp } from "../../engine/anim/keyed";
import { moveBox, type Box } from "../../engine/world/collide";
import type { Projectile } from "../../engine/world/projectiles";
import { callLift, type Prop, type SandboxWorld } from "../level/sandboxLevel";
import { clipFor, type Clip, type ClipSet, type GaitName, type HeroState, type MovementConfig, type Weapon } from "./config";

export interface Hero {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  state: HeroState;
  time: number;
  rate: 1 | -1;
  weapon: Weapon;
  energy: number;
  shields: number;
  ammo: number;
  fallFrom: number;
  onGround: boolean;
  onLift: boolean;
  hidden: boolean;
  climb: number;
  gaitTime: number;
  fallGait: GaitName | null;
  landing: Landing | null;
  hitAge: number | null;
  running: boolean;
  fireTime: number | null;
}

export interface Landing {
  from: HeroState;
  time: number;
  age: number;
}

export type HeroEvent = { kind: "pickup" | "use" | "shot" | "punch" | "died"; x: number; y: number };

interface Step {
  h: Hero;
  input: InputFrame;
  world: SandboxWorld;
  cfg: MovementConfig;
  clips: ClipSet;
  dt: number;
  consume: (action: string) => boolean;
  prev: number;
  events: HeroEvent[];
}

type Handler = (s: Step) => void;

const EPS = 1e-3;
const SHOT_EPS = 1e-6;
const LADDER_REACH = 0.5;
const PIT_MARGIN = 2;
export const HERO_SHOT = "hero";

export function createHero(spawn: [number, number], weapon: Weapon, energy: number, shields = 0, ammo = 0): Hero {
  return {
    x: spawn[0],
    y: spawn[1],
    vx: 0,
    vy: 0,
    facing: 1,
    state: "idle",
    time: 0,
    rate: 1,
    weapon,
    energy,
    shields,
    ammo,
    fallFrom: spawn[1],
    onGround: true,
    onLift: false,
    hidden: false,
    climb: 0,
    gaitTime: 0,
    fallGait: null,
    landing: null,
    hitAge: null,
    running: false,
    fireTime: null,
  };
}

function clipOf(s: Step): Clip {
  const name = clipFor(s.h.state, s.h.weapon);
  const clip = s.clips[name];
  if (!clip) throw new Error(`clip ${name} is missing`);
  return clip;
}

const enter = (h: Hero, state: HeroState): void => {
  h.state = state;
  h.time = 0;
  h.rate = 1;
};

const crossed = (s: Step, t: number): boolean =>
  s.h.rate > 0 ? s.prev <= t && t < s.h.time : s.h.time < t && t <= s.prev;

const crossedLoop = (s: Step, t: number, duration: number): boolean =>
  Math.floor((s.h.time - t) / duration) > Math.floor((s.prev - t) / duration);

const finished = (s: Step): boolean => (s.h.rate > 0 ? s.h.time >= clipOf(s).duration : s.h.time <= 0);

type Jump = "standJump" | "walkJump" | "runJump" | "duckJump";

const isAirborne = (state: HeroState): boolean =>
  state === "fall" || state === "standJump" || state === "walkJump" || state === "runJump" || state === "duckJump";

const isGait = (state: HeroState): state is GaitName => state === "walk" || state === "run";

const isDead = (state: HeroState): boolean => state === "death" || state === "fallDeath" || state === "jumpDeath";

export const isDucked = (state: HeroState): boolean => state === "duck" || state === "duckAttack";

const boxOf = (h: Hero, cfg: MovementConfig): Box => ({ x: h.x, y: h.y, w: cfg.box.width, h: cfg.box.height });

function atLadderTop(s: Step): boolean {
  const { h, world } = s;
  const row = Math.round(h.y);
  return h.onGround && Math.abs(h.y - row) <= EPS && world.grid.ladderTop(Math.floor(h.x), row);
}

function touching(s: Step, kind: string): Prop | undefined {
  const { h, world, cfg } = s;
  return world.props.find((p) => {
    const y = p.y ?? world.spawn[1];
    const reach = (cfg.box.width + (p.width ?? 0)) / 2;
    return p.kind === kind && !p.taken && Math.abs(p.x - h.x) <= reach && y > h.y - cfg.floorHeightCells && y <= h.y + EPS;
  });
}

function ladderBottom(s: Step): number {
  const { h, world } = s;
  const col = Math.floor(h.x);
  let row = Math.floor(h.y - EPS);
  if (world.grid.at(col, row) !== "H") row++;
  while (world.grid.at(col, row) === "H") row++;
  return row;
}

function enterLadder(s: Step): void {
  const { h } = s;
  enter(h, "ladder");
  h.fireTime = null;
  h.x = Math.floor(h.x) + 0.5;
  h.climb = ladderBottom(s) - h.y;
  h.vx = 0;
  h.vy = 0;
  h.onGround = false;
  h.onLift = false;
}

const travelSpeed = (clip: Clip): number => (clip.travel ?? 0) / clip.duration;

function launch(s: Step, state: Jump): { height: number; speed: number } {
  const { cfg, clips } = s;
  if (state === "runJump") return { height: cfg.jump.runHeight, speed: cfg.jump.runSpeed };
  if (state === "walkJump") return { height: cfg.jump.walkHeight, speed: clips.walk ? travelSpeed(clips.walk) : 0 };
  return { height: cfg.jump.standHeight, speed: 0 };
}

function jump(s: Step, state: Jump): void {
  const { h, cfg } = s;
  const { height, speed } = launch(s, state);
  h.gaitTime = isGait(h.state) ? h.time : 0;
  enter(h, state);
  h.fallFrom = h.y;
  h.vx = h.facing * speed;
  h.vy = -Math.sqrt(2 * cfg.gravity * height);
  h.onGround = false;
  h.onLift = false;
}

type Death = "fallDeath" | "death" | "jumpDeath";

const deathOf = (h: Hero): Death => (isAirborne(h.state) ? "jumpDeath" : "death");

function die(h: Hero, state: Death, events: HeroEvent[]): void {
  enter(h, state);
  if (state !== "jumpDeath") {
    h.vx = 0;
    h.vy = 0;
  }
  h.hidden = false;
  h.fireTime = null;
  events.push({ kind: "died", x: h.x, y: h.y });
}

export function kill(h: Hero): HeroEvent[] {
  const events: HeroEvent[] = [];
  if (isDead(h.state)) return events;
  h.energy = 0;
  die(h, deathOf(h), events);
  return events;
}

export function damage(h: Hero, cfg: MovementConfig): HeroEvent[] {
  const events: HeroEvent[] = [];
  if (h.hidden || isDead(h.state)) return events;
  h.energy = Math.max(0, h.energy - cfg.energy.hit);
  h.hitAge = 0;
  if (h.energy > 0) return events;
  if (h.shields > 0) {
    h.shields -= 1;
    h.energy = cfg.energy.max;
  } else die(h, deathOf(h), events);
  return events;
}

function gait(s: Step): void {
  const { h, input } = s;
  if (input.dir === 0) return h.state === "idle" ? undefined : enter(h, "idle");
  if (input.dir !== h.facing) {
    h.facing = input.dir;
    if (h.state === "idle") return;
  }
  const next = h.running ? "run" : "walk";
  if (h.state !== next) enter(h, next);
}

function emit(s: Step, kind: HeroEvent["kind"]): void {
  s.events.push({ kind, x: s.h.x, y: s.h.y });
}

const emptyGun = (h: Hero): boolean => h.weapon === "gun" && h.ammo <= 0;

function shoot(s: Step): void {
  s.h.ammo -= 1;
  emit(s, "shot");
}

function pullTrigger(s: Step): void {
  s.h.fireTime = 0;
  shoot(s);
}

function gunFire(s: Step): void {
  const { h, input, cfg, dt } = s;
  if (h.weapon !== "gun" || !input.held.has("shoot") || h.ammo <= 0) {
    h.fireTime = null;
    return;
  }
  if (h.fireTime === null) {
    s.consume("shoot");
    return pullTrigger(s);
  }
  const shots = (t: number): number => Math.floor(t * cfg.fireRate + SHOT_EPS);
  if (shots(h.fireTime) > shots(h.fireTime - dt)) shoot(s);
}

function startAttack(s: Step, state: "attack" | "duckAttack"): void {
  if (emptyGun(s.h)) return;
  enter(s.h, state);
  if (s.h.weapon === "gun") pullTrigger(s);
}

function use(s: Step): boolean {
  const panel = touching(s, "panel");
  if (!panel || !s.consume("useItem")) return false;
  enter(s.h, "use");
  panel.on = !panel.on;
  emit(s, "use");
  return true;
}

function act(s: Step): boolean {
  if (use(s)) return true;
  if (!s.consume("shoot")) return false;
  startAttack(s, "attack");
  return true;
}

function switchWeapon(s: Step, weapon: Weapon): void {
  const { h } = s;
  enter(h, "weaponSwitch");
  if (weapon === "gun") return;
  h.rate = -1;
  h.time = clipOf(s).duration;
}

function weaponSlot(s: Step): Weapon | null {
  const [gun, fists] = ["weapon1", "weapon2", "weapon3"].map((slot) => s.consume(slot));
  return gun && s.h.ammo > 0 ? "gun" : fists ? "fists" : null;
}

function takeCover(s: Step): boolean {
  const { h, input, world } = s;
  if (!input.held.has("hide") || (h.onLift && world.lift.target !== null)) return false;
  enter(h, "hide");
  h.hidden = true;
  h.fireTime = null;
  return true;
}

function stance(s: Step, slot: Weapon | null): boolean {
  const { h, input } = s;
  if (slot && slot !== h.weapon) {
    switchWeapon(s, slot);
    return true;
  }
  if (takeCover(s)) return true;
  if (h.onLift || !input.held.has("down")) return false;
  s.consume("down");
  enter(h, touching(s, "item") ? "kneel" : "duck");
  return true;
}

function standUp(s: Step, from: Jump): boolean {
  const { h, world } = s;
  if (h.onLift) {
    const dir = liftCall(s);
    if (dir !== null) callLift(world.lift, dir);
    return false;
  }
  if (!s.consume("up")) return false;
  if (world.grid.ladderAt(h.x, h.y - LADDER_REACH)) enterLadder(s);
  else jump(s, from);
  return true;
}

function idle(s: Step): void {
  const { h, input } = s;
  const slot = weaponSlot(s);
  if (standUp(s, "standJump")) return;
  if (!h.onLift && input.held.has("down") && atLadderTop(s)) return enterLadder(s);
  if (emptyGun(h)) return switchWeapon(s, "fists");
  if (act(s) || stance(s, slot)) return;
  if (input.dir !== 0) gait(s);
}

function liftCall(s: Step): -1 | 1 | null {
  return s.consume("up") ? -1 : s.consume("down") ? 1 : null;
}

function moving(s: Step): void {
  const { h, world } = s;
  if (takeCover(s)) return;
  if (h.state === "walk" && h.onLift) {
    const dir = liftCall(s);
    if (dir !== null) {
      enter(h, "idle");
      return callLift(world.lift, dir);
    }
  }
  if (s.consume("up")) {
    if (world.grid.ladderAt(h.x, h.y - LADDER_REACH)) return enterLadder(s);
    return jump(s, h.state === "run" ? "runJump" : "walkJump");
  }
  if (h.weapon === "gun") {
    gunFire(s);
    if (use(s)) return;
  } else if (act(s)) return;
  gait(s);
  if (h.fireTime !== null && h.state === "idle") enter(h, "attack");
}

function airborne(s: Step): void {
  const { h, input } = s;
  gunFire(s);
  if (input.dir === 0 || input.dir === h.facing) return;
  h.facing = input.dir;
  h.vx = -h.vx;
}

function toIdle(s: Step): void {
  if (finished(s)) enter(s.h, "idle");
}

function crouch(s: Step): void {
  if (!s.input.held.has("down")) return enter(s.h, "idle");
  enter(s.h, "duck");
  s.h.time = clipOf(s).duration;
}

function duck(s: Step): void {
  if (!s.input.held.has("down")) return enter(s.h, "idle");
  if (s.consume("up")) return jump(s, "duckJump");
  if (s.consume("shoot")) startAttack(s, "duckAttack");
}

function leaveAttack(s: Step): void {
  if (s.h.state === "duckAttack") crouch(s);
  else gait(s);
}

function attack(s: Step): void {
  const { h, input } = s;
  if (takeCover(s)) return;
  if (h.weapon === "gun") {
    const ducked = h.state === "duckAttack";
    if (ducked && input.dir !== 0) h.facing = input.dir;
    if (standUp(s, ducked ? "duckJump" : "standJump")) return;
    gunFire(s);
    if (h.fireTime === null || (!ducked && input.dir !== 0)) leaveAttack(s);
    return;
  }
  const clip = clipOf(s);
  if (h.time < (clip.cancelAt ?? clip.duration)) return;
  if (!input.held.has("shoot") || input.dir !== 0) leaveAttack(s);
}

function hide(s: Step): void {
  const { h, input } = s;
  if (input.held.has("hide")) return;
  h.hidden = false;
  enter(h, "idle");
}

function weaponSwitch(s: Step): void {
  const { h } = s;
  const drawAt = clipOf(s).gun?.find(([, g]) => g === "hand")?.[0] ?? 0;
  if (crossed(s, drawAt)) h.weapon = h.rate > 0 ? "gun" : "fists";
  toIdle(s);
}

function ladder(s: Step): void {
  const { h, input, world, cfg, dt } = s;
  s.consume("up");
  s.consume("down");
  if (input.dir !== 0) return dropOffLadder(s, input.dir);
  const dir = (input.held.has("down") ? 1 : 0) - (input.held.has("up") ? 1 : 0);
  if (dir === 0) return;
  const r = moveBox(boxOf(h, cfg), 0, dir * cfg.ladderSpeed * dt, world.grid, [world.lift], { ignoreOneWay: true });
  h.climb -= r.y - h.y;
  h.y = r.y;
  if (dir > 0 && r.hitY) return leaveLadder(h);
  if (dir < 0 && !world.grid.ladderAt(h.x, h.y - EPS)) {
    h.y = Math.floor(h.y - EPS) + 1;
    leaveLadder(h);
  }
}

function dropOffLadder(s: Step, facing: -1 | 1): void {
  const { h, clips } = s;
  h.facing = facing;
  enter(h, "fall");
  h.fallGait = null;
  h.gaitTime = 0;
  h.fallFrom = h.y;
  h.vx = h.facing * (clips.walk ? travelSpeed(clips.walk) : 0);
  h.vy = 0;
}

function leaveLadder(h: Hero): void {
  enter(h, "idle");
  h.onGround = true;
}

function respawn(s: Step): void {
  const { h, world, cfg } = s;
  if (h.time * 1000 >= cfg.respawnMs) Object.assign(h, createHero(world.spawn, h.weapon, cfg.energy.max, cfg.energy.shields, h.ammo));
}

const transitions: Partial<Record<HeroState, Handler>> = {
  idle,
  walk: moving,
  run: moving,
  standJump: airborne,
  walkJump: airborne,
  runJump: airborne,
  duckJump: airborne,
  fall: airborne,
  ladder,
  duck,
  duckAttack: attack,
  kneel: toIdle,
  use: toIdle,
  hide,
  attack,
  weaponSwitch,
  fallDeath: respawn,
  death: respawn,
  jumpDeath: respawn,
};

function pickup(s: Step): void {
  const item = touching(s, "item");
  if (!item) return;
  item.taken = true;
  emit(s, "pickup");
}

function clipEvents(s: Step): void {
  const clip = clipOf(s);
  for (const [t, name] of clip.events ?? []) {
    if (!(clip.loop ? crossedLoop(s, t, clip.duration) : crossed(s, t))) continue;
    if (name === "pickup") pickup(s);
    if (name === "punch") emit(s, "punch");
  }
}

function horizontalSpeed(s: Step): number {
  const { h } = s;
  if (isAirborne(h.state)) return h.vx;
  if (!isGait(h.state)) return 0;
  return h.facing * travelSpeed(clipOf(s));
}

function physics(s: Step): void {
  const { h, world, cfg, dt } = s;
  const box = boxOf(h, cfg);
  if (h.onLift) box.y = moveBox(box, 0, world.lift.vy * dt, world.grid, [world.lift]).y;
  const vy = Math.min(h.vy + cfg.gravity * dt, cfg.maxFallSpeed);
  const r = moveBox(box, h.vx * dt, ((h.vy + vy) / 2) * dt, world.grid, [world.lift]);
  h.x = r.x;
  h.y = r.y;
  h.vy = (r.hitY && vy < 0) || (r.onGround && vy > 0) ? 0 : vy;
  h.onGround = r.onGround && h.vy >= 0;
  h.onLift = h.onGround && r.platform === world.lift;
}

function settle(s: Step, startY: number): void {
  const { h, world, cfg } = s;
  if (h.y > world.grid.height + PIT_MARGIN) return die(h, "fallDeath", s.events);
  if (!h.onGround) {
    if (!isAirborne(h.state)) {
      h.fallGait = isGait(h.state) ? h.state : null;
      h.gaitTime = h.fallGait ? h.time : 0;
      enter(h, "fall");
      h.fallFrom = startY;
    }
    return;
  }
  if (!isAirborne(h.state)) return;
  if (h.y - h.fallFrom > cfg.fallDeathCells) return die(h, "fallDeath", s.events);
  const landing = { from: h.state, time: h.time, age: 0 };
  if (h.fireTime !== null && s.input.held.has("down")) return enter(h, "duckAttack");
  if (h.fireTime !== null && s.input.dir === 0) return enter(h, "attack");
  enter(h, s.input.dir === 0 ? "idle" : h.running ? "run" : "walk");
  h.landing = landing;
  resumeGait(s, landing);
  if (h.state === "idle") idle(s);
  else moving(s);
  if (h.state === "duck") h.time = clipOf(s).duration;
}

function resumeGait(s: Step, landing: Landing): void {
  const { h, clips } = s;
  const gait = landing.from === "fall" ? h.fallGait : clips[clipFor(landing.from, h.weapon)]?.gait;
  const from = gait && clips[gait];
  if (!from || !isGait(h.state)) return;
  const u = (h.gaitTime + landing.time) / from.duration;
  h.time = (u - Math.floor(u)) * clipOf(s).duration;
}

function slide(s: Step): number {
  const { h, cfg, dt } = s;
  if (h.state !== "jumpDeath") return 0;
  if (!h.onGround) return h.vx;
  const speed = Math.max(0, Math.abs(h.vx) - (cfg.jump.runSpeed / cfg.deathSlide) * dt);
  return speed && Math.sign(h.vx) * speed;
}

function fallDead(s: Step): void {
  const { h, world } = s;
  h.vx = slide(s);
  physics(s);
  const pit = world.grid.height + PIT_MARGIN;
  if (h.y <= pit) return;
  h.y = pit;
  h.vy = 0;
}

function overlaps(p: Projectile, box: Box, dt: number): boolean {
  const from = p.x - p.vx * dt;
  const [lo, hi] = [Math.min(from, p.x), Math.max(from, p.x)];
  const dx = Math.max(0, box.x - box.w / 2 - hi, lo - (box.x + box.w / 2));
  const dy = p.y - clamp(p.y, box.y - box.h, box.y);
  return dx * dx + dy * dy < p.r * p.r;
}

function projectileHits(s: Step): void {
  const { h, world, cfg, dt } = s;
  const box = boxOf(h, cfg);
  world.projectiles = world.projectiles.filter((p) => {
    if (p.tag === HERO_SHOT || h.hidden || isDead(h.state) || !overlaps(p, box, dt)) return true;
    s.events.push(...damage(h, cfg));
    return false;
  });
}

export function updateHero(
  h: Hero,
  input: InputFrame,
  world: SandboxWorld,
  cfg: MovementConfig,
  clips: ClipSet,
  dt: number,
  consume: (action: string) => boolean,
): HeroEvent[] {
  const s: Step = { h, input, world, cfg, clips, dt, consume, prev: h.time, events: [] };
  h.time += dt * h.rate;
  if (h.hitAge !== null) h.hitAge += dt;
  if (h.landing) h.landing.age += dt;
  if (h.fireTime !== null) h.fireTime += dt;
  if (consume("runToggle")) h.running = !h.running;
  clipEvents(s);
  transitions[h.state]?.(s);
  if (isDead(h.state)) fallDead(s);
  else if (h.state !== "ladder") {
    const startY = h.y;
    h.vx = horizontalSpeed(s);
    physics(s);
    settle(s, startY);
  }
  projectileHits(s);
  return s.events;
}
