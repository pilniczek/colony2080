import type { InputFrame } from "../../engine/input";
import { clamp } from "../../engine/anim/keyed";
import { moveBox, type Box } from "../../engine/world/collide";
import type { Projectile } from "../../engine/world/projectiles";
import { callLift, type Prop, type SandboxWorld } from "../level/sandboxLevel";
import { clipFor, type Clip, type ClipSet, type HeroState, type MovementConfig, type Weapon } from "./config";

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
  fallFrom: number;
  onGround: boolean;
  onLift: boolean;
  hidden: boolean;
  climb: number;
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

export function createHero(spawn: [number, number], weapon: Weapon, energy: number): Hero {
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
    fallFrom: spawn[1],
    onGround: true,
    onLift: false,
    hidden: false,
    climb: 0,
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

const eventTime = (clip: Clip, name: string): number => clip.events?.find(([, n]) => n === name)?.[0] ?? 0;

const viewSwitch = (clip: Clip): number => clip.view?.find(([t]) => t > 0)?.[0] ?? clip.duration / 2;

const isJump = (state: HeroState): boolean => state === "standJump" || state === "runJump";

const isAirborne = (state: HeroState): boolean => state === "fall" || isJump(state);

const isDead = (state: HeroState): boolean => state === "death" || state === "fallDeath";

const isDucked = (state: HeroState): boolean => state === "duck" || state === "duckAttack";

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

function enterLadder(h: Hero): void {
  enter(h, "ladder");
  h.x = Math.floor(h.x) + 0.5;
  h.vx = 0;
  h.vy = 0;
  h.onGround = false;
  h.onLift = false;
}

function jump(h: Hero, state: "standJump" | "runJump"): void {
  enter(h, state);
  h.fallFrom = h.y;
}

function die(h: Hero, state: "fallDeath" | "death", events: HeroEvent[]): void {
  enter(h, state);
  h.vx = 0;
  h.vy = 0;
  h.hidden = false;
  events.push({ kind: "died", x: h.x, y: h.y });
}

export function kill(h: Hero): HeroEvent[] {
  const events: HeroEvent[] = [];
  if (isDead(h.state)) return events;
  h.energy = 0;
  die(h, "death", events);
  return events;
}

export function damage(h: Hero, cfg: MovementConfig): HeroEvent[] {
  const events: HeroEvent[] = [];
  if (h.hidden || isDead(h.state)) return events;
  h.energy = Math.max(0, h.energy - cfg.energy.hit);
  if (h.energy === 0) die(h, "death", events);
  else if (!isAirborne(h.state)) enter(h, "hit");
  return events;
}

function gait(s: Step): void {
  const { h, input } = s;
  if (input.dir === 0) return enter(h, "idle");
  if (input.dir !== h.facing) return enter(h, "turn");
  const next = input.held.has("runModifier") ? "run" : "walk";
  if (h.state !== next) enter(h, next);
}

function emit(s: Step, kind: HeroEvent["kind"]): void {
  s.events.push({ kind, x: s.h.x, y: s.h.y });
}

function startAttack(s: Step, state: "attack" | "duckAttack"): void {
  enter(s.h, state);
  if (s.h.weapon === "gun") emit(s, "shot");
}

function act(s: Step): boolean {
  const { h } = s;
  const panel = touching(s, "panel");
  if (panel && s.consume("useItem")) {
    enter(h, "use");
    panel.on = !panel.on;
    emit(s, "use");
    return true;
  }
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
  return gun ? "gun" : fists ? "fists" : null;
}

function stance(s: Step, slot: Weapon | null): boolean {
  const { h, input, world } = s;
  if (slot && slot !== h.weapon) {
    switchWeapon(s, slot);
    return true;
  }
  if (input.held.has("hide") && !(h.onLift && world.lift.target !== null)) {
    enter(h, "hide");
    return true;
  }
  if (h.onLift || !input.held.has("down")) return false;
  s.consume("down");
  enter(h, touching(s, "item") ? "kneel" : "duck");
  return true;
}

function idle(s: Step): void {
  const { h, input, world } = s;
  const slot = weaponSlot(s);
  if (h.onLift) {
    if (s.consume("up")) callLift(world.lift, -1);
    else if (s.consume("down")) callLift(world.lift, 1);
  } else if (s.consume("up")) {
    return world.grid.ladderAt(h.x, h.y - LADDER_REACH) ? enterLadder(h) : jump(h, "standJump");
  } else if (input.held.has("down") && atLadderTop(s)) {
    return enterLadder(h);
  }
  if (act(s) || stance(s, slot)) return;
  if (input.dir !== 0) gait(s);
}

function moving(s: Step): void {
  if (s.consume("up") && s.h.state === "run") return jump(s.h, "runJump");
  if (act(s)) return;
  gait(s);
}

function turn(s: Step): void {
  if (crossed(s, viewSwitch(clipOf(s)))) s.h.facing = s.h.facing === 1 ? -1 : 1;
  if (finished(s)) enter(s.h, "idle");
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
  if (s.consume("shoot")) startAttack(s, "duckAttack");
}

function leaveAttack(s: Step): void {
  if (s.h.state === "duckAttack") crouch(s);
  else gait(s);
}

function attack(s: Step): void {
  const { h, input, cfg } = s;
  if (h.weapon === "gun") {
    const shots = (t: number): number => Math.floor(t * cfg.fireRate + SHOT_EPS);
    if (shots(h.time) > shots(s.prev)) emit(s, "shot");
    if (!input.held.has("shoot")) leaveAttack(s);
    return;
  }
  const clip = clipOf(s);
  if (h.time < (clip.cancelAt ?? clip.duration)) return;
  if (!input.held.has("shoot") || input.dir !== 0) leaveAttack(s);
}

function hide(s: Step): void {
  const { h, input } = s;
  const clip = clipOf(s);
  if (crossed(s, viewSwitch(clip))) h.hidden = h.rate > 0;
  if (h.rate < 0) return toIdle(s);
  if (input.held.has("hide")) return;
  h.rate = -1;
  h.time = Math.min(h.time, clip.duration);
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
  const dir = (input.held.has("down") ? 1 : 0) - (input.held.has("up") ? 1 : 0);
  if (dir === 0) return;
  const r = moveBox(boxOf(h, cfg), 0, dir * cfg.ladderSpeed * dt, world.grid, [world.lift], { ignoreOneWay: true });
  h.climb += Math.abs(r.y - h.y);
  h.y = r.y;
  if (dir > 0 && r.hitY) return leaveLadder(h);
  if (dir < 0 && !world.grid.ladderAt(h.x, h.y - EPS)) {
    h.y = Math.floor(h.y - EPS) + 1;
    leaveLadder(h);
  }
}

function leaveLadder(h: Hero): void {
  enter(h, "idle");
  h.onGround = true;
}

function respawn(s: Step): void {
  const { h, world, cfg } = s;
  if (h.time * 1000 >= cfg.respawnMs) Object.assign(h, createHero(world.spawn, h.weapon, cfg.energy.max));
}

const none: Handler = () => {};

const transitions: Partial<Record<HeroState, Handler>> = {
  idle,
  walk: moving,
  run: moving,
  turn,
  standJump: none,
  runJump: none,
  fall: none,
  land: toIdle,
  ladder,
  duck,
  duckAttack: attack,
  kneel: toIdle,
  use: toIdle,
  hide,
  attack,
  weaponSwitch,
  hit: toIdle,
  fallDeath: respawn,
  death: respawn,
};

const launchHeight = (state: HeroState, cfg: MovementConfig): number =>
  state === "runJump" ? cfg.jump.runHeight : cfg.jump.standHeight;

function pickup(s: Step): void {
  const item = touching(s, "item");
  if (!item) return;
  item.taken = true;
  emit(s, "pickup");
}

function clipEvents(s: Step): void {
  const { h, cfg } = s;
  const clip = clipOf(s);
  for (const [t, name] of clip.events ?? []) {
    if (!(clip.loop ? crossedLoop(s, t, clip.duration) : crossed(s, t))) continue;
    if (name === "pickup") pickup(s);
    if (name === "punch") emit(s, "punch");
    if (name === "launch") {
      h.vy = -Math.sqrt(2 * cfg.gravity * launchHeight(h.state, cfg));
      h.onGround = false;
      h.onLift = false;
    }
  }
}

function horizontalSpeed(s: Step): number {
  const { h, cfg } = s;
  if (h.state === "walk" || h.state === "run") {
    const clip = clipOf(s);
    return (h.facing * (clip.travel ?? 0)) / clip.duration;
  }
  return h.state === "runJump" ? h.facing * cfg.jump.runSpeed : 0;
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
      enter(h, "fall");
      h.fallFrom = startY;
    }
    return;
  }
  const landed = h.state === "fall" || (isJump(h.state) && h.time > eventTime(clipOf(s), "launch"));
  if (!landed) return;
  if (h.y - h.fallFrom > cfg.fallDeathCells) die(h, "fallDeath", s.events);
  else enter(h, "land");
}

function fallDead(s: Step): void {
  const { h, world } = s;
  h.vx = 0;
  physics(s);
  const pit = world.grid.height + PIT_MARGIN;
  if (h.y <= pit) return;
  h.y = pit;
  h.vy = 0;
}

function overlaps(p: Projectile, box: Box): boolean {
  const dx = p.x - clamp(p.x, box.x - box.w / 2, box.x + box.w / 2);
  const dy = p.y - clamp(p.y, box.y - box.h, box.y);
  return dx * dx + dy * dy < p.r * p.r;
}

function projectileHits(s: Step): void {
  const { h, world, cfg } = s;
  const box = { ...boxOf(h, cfg), h: isDucked(h.state) ? cfg.box.duckHeight : cfg.box.height };
  world.projectiles = world.projectiles.filter((p) => {
    if (h.hidden || isDead(h.state) || !overlaps(p, box)) return true;
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
