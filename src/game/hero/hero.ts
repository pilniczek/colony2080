import type { InputFrame } from "../../engine/input";
import { clamp } from "../../engine/anim/keyed";
import { moveBox, type Box } from "../../engine/world/collide";
import type { Projectile } from "../../engine/world/projectiles";
import { ITEMS } from "../items";
import { callLift, liftAt, onGround, pickUp, type Lift, type Prop, type SandboxWorld } from "../level/sandboxLevel";
import { runUse, say } from "../level/tasks";
import { clipFor, holdsGun, type Clip, type ClipSet, type GaitName, type HeroState, type MovementConfig, type Weapon } from "./config";

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
  switchTo: Weapon;
  energy: number;
  shields: number;
  ammo: number;
  blaster: number | null;
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

export type HeroEvent = { kind: "pickup" | "use" | "shot" | "beam" | "punch" | "died" | "respawned"; x: number; y: number };

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

export function createHero(
  spawn: [number, number],
  weapon: Weapon,
  energy: number,
  shields = 0,
  ammo = 0,
  running = false,
  blaster: number | null = null,
): Hero {
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
    switchTo: weapon,
    energy,
    shields,
    ammo,
    blaster,
    fallFrom: spawn[1],
    onGround: true,
    onLift: false,
    hidden: false,
    climb: 0,
    gaitTime: 0,
    fallGait: null,
    landing: null,
    hitAge: null,
    running,
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

const onMovingLift = ({ h, world, cfg }: Step): boolean => h.onLift && liftAt(world, h, cfg)?.target != null;

function atLadderTop(s: Step): boolean {
  const { h, world } = s;
  const row = Math.round(h.y);
  return h.onGround && Math.abs(h.y - row) <= EPS && world.grid.ladderTop(Math.floor(h.x), row);
}

function touching(s: Step, ...kinds: string[]): Prop | undefined {
  const { h, world, cfg } = s;
  const inReach = world.props.filter((p) => {
    const y = p.y ?? world.spawn[1];
    const reach = (cfg.box.width + (p.width ?? 0)) / 2;
    return kinds.includes(p.kind) && onGround(p, h) && Math.abs(p.x - h.x) <= reach && y > h.y - cfg.floorHeightCells && y <= h.y + EPS;
  });
  return inReach.reduce<Prop | undefined>((best, p) => (best && Math.abs(best.x - h.x) <= Math.abs(p.x - h.x) ? best : p), undefined);
}

const USABLE = ["panel", "object"];
const PICKABLE = ["item", "weapon"];

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
  if (onMovingLift(s)) return;
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

const ammoOf = (h: Hero, weapon: Weapon): number => (weapon === "gun" ? h.ammo : weapon === "blaster" ? (h.blaster ?? 0) : 0);

const emptyWeapon = (h: Hero): boolean => holdsGun(h.weapon) && ammoOf(h, h.weapon) <= 0;

const fallbackWeapon = (h: Hero): Weapon => {
  const other = h.weapon === "gun" ? "blaster" : "gun";
  return ammoOf(h, other) > 0 ? other : "fists";
};

const fireRate = ({ h, cfg }: Step): number => (h.weapon === "blaster" ? cfg.blaster.tickHz : cfg.fireRate);

function shoot(s: Step): void {
  const { h } = s;
  if (h.weapon === "blaster") {
    h.blaster = ammoOf(h, "blaster") - 1;
    return emit(s, "beam");
  }
  h.ammo -= 1;
  emit(s, "shot");
}

function pullTrigger(s: Step): void {
  s.h.fireTime = 0;
  shoot(s);
}

function gunFire(s: Step): void {
  const { h, input, dt } = s;
  if (!holdsGun(h.weapon) || !input.held.has("shoot") || emptyWeapon(h)) {
    h.fireTime = null;
    return;
  }
  if (h.fireTime === null) {
    s.consume("shoot");
    return pullTrigger(s);
  }
  const rate = fireRate(s);
  const shots = (t: number): number => Math.floor(t * rate + SHOT_EPS);
  if (shots(h.fireTime) > shots(h.fireTime - dt)) shoot(s);
}

function startAttack(s: Step, state: "attack" | "duckAttack"): void {
  if (emptyWeapon(s.h)) return;
  enter(s.h, state);
  if (holdsGun(s.h.weapon)) pullTrigger(s);
}

function use(s: Step): boolean {
  if (!touching(s, ...USABLE) || !s.consume("useItem")) return false;
  enter(s.h, "use");
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
  const holster = holdsGun(h.weapon);
  enter(h, "weaponSwitch");
  h.switchTo = weapon;
  if (!holster) return;
  h.rate = -1;
  h.time = clipOf(s).duration;
}

function weaponSlot(s: Step): Weapon | null {
  const { h } = s;
  const [gun, fists, blaster] = ["weapon1", "weapon2", "weapon3"].map((slot) => s.consume(slot));
  if (gun && ammoOf(h, "gun") > 0) return "gun";
  if (fists) return "fists";
  return blaster && ammoOf(h, "blaster") > 0 ? "blaster" : null;
}

function takeCover(s: Step): boolean {
  const { h, input } = s;
  if (!input.held.has("hide") || onMovingLift(s)) return false;
  enter(h, "hide");
  h.hidden = true;
  h.fireTime = null;
  return true;
}

function stance(s: Step): boolean {
  const { h, input } = s;
  if (takeCover(s)) return true;
  if (h.onLift || !input.held.has("down")) return false;
  s.consume("down");
  enter(h, touching(s, ...PICKABLE) ? "kneel" : "duck");
  return true;
}

function standUp(s: Step, from: Jump): boolean {
  const { h, world, cfg } = s;
  if (h.onLift) {
    const dir = liftCall(s);
    const lift = liftAt(world, h, cfg);
    if (dir !== null && lift) requestLift(s, lift, dir);
    return false;
  }
  if (!s.consume("up")) return false;
  if (world.grid.ladderAt(h.x, h.y - LADDER_REACH)) enterLadder(s);
  else jump(s, from);
  return true;
}

function idle(s: Step): void {
  const { h, input } = s;
  if (standUp(s, "standJump")) return;
  if (!h.onLift && input.held.has("down") && atLadderTop(s)) return enterLadder(s);
  if (act(s) || stance(s)) return;
  if (input.dir !== 0) gait(s);
}

function requestLift(s: Step, lift: Lift, dir: -1 | 1): void {
  if (!callLift(lift, dir, s.world.flags) && lift.hint) say(s.world, lift.hint);
}

function liftCall(s: Step): -1 | 1 | null {
  return s.consume("up") ? -1 : s.consume("down") ? 1 : null;
}

function moving(s: Step): void {
  const { h, world, cfg } = s;
  if (takeCover(s)) return;
  if (h.state === "walk" && h.onLift) {
    const dir = liftCall(s);
    if (dir !== null) {
      enter(h, "idle");
      const lift = liftAt(world, h, cfg);
      if (lift) requestLift(s, lift, dir);
      return;
    }
  }
  if (s.consume("up")) {
    if (world.grid.ladderAt(h.x, h.y - LADDER_REACH)) return enterLadder(s);
    return jump(s, h.state === "run" ? "runJump" : "walkJump");
  }
  if (holdsGun(h.weapon)) {
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
  if (holdsGun(h.weapon)) {
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
  if (input.dir !== 0) h.facing = input.dir;
  if (input.held.has("hide")) return;
  h.hidden = false;
  enter(h, "idle");
  if (input.held.has("shoot")) startAttack(s, "attack");
}

function drawNext(h: Hero): void {
  h.weapon = h.switchTo;
  h.rate = 1;
  h.time = 0;
}

function weaponSwitch(s: Step): void {
  const { h, input } = s;
  const target = h.switchTo;
  const drawAt = clipOf(s).gun?.find(([, g]) => g === "hand")?.[0] ?? 0;
  if (crossed(s, drawAt) && (h.rate > 0 || !holdsGun(target))) h.weapon = target;
  if (h.rate < 0 && finished(s) && holdsGun(target)) drawNext(h);
  const cut = !input.held.has("hide") || input.dir !== 0 || ["shoot", "up", "down"].some((a) => input.held.has(a));
  if (!cut && !finished(s)) return;
  h.weapon = target;
  if (takeCover(s)) return;
  h.hidden = false;
  enter(h, "idle");
}

function quickSwitch(s: Step): void {
  const { h } = s;
  if (isDead(h.state) || h.state === "weaponSwitch") return;
  if (emptyWeapon(h)) arm(h, fallbackWeapon(h));
  const slot = weaponSlot(s);
  if (!slot || slot === h.weapon) return;
  if (h.state === "hide") switchWeapon(s, slot);
  else arm(h, slot);
}

function arm(h: Hero, weapon: Weapon): void {
  h.weapon = weapon;
  h.switchTo = weapon;
  h.fireTime = null;
}

function ladder(s: Step): void {
  const { h, input, world, cfg, dt } = s;
  s.consume("up");
  s.consume("down");
  if (input.dir !== 0) return dropOffLadder(s, input.dir);
  const dir = (input.held.has("down") ? 1 : 0) - (input.held.has("up") ? 1 : 0);
  if (dir === 0) return;
  const r = moveBox(boxOf(h, cfg), 0, dir * cfg.ladderSpeed * dt, world.grid, world.lifts, { ignoreOneWay: true });
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
  if (h.time * 1000 < cfg.respawnMs) return;
  Object.assign(h, createHero(world.spawn, h.weapon, cfg.energy.max, cfg.energy.shields, h.ammo, h.running, h.blaster));
  emit(s, "respawned");
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
  const prop = touching(s, ...PICKABLE);
  if (!prop) return;
  prop.taken = true;
  if (prop.kind === "weapon") {
    s.h.blaster = s.cfg.blaster.ammo;
    say(s.world, "Picked up E-Blaster");
  } else {
    pickUp(s.world, prop.item!);
    say(s.world, `Picked up ${ITEMS[prop.item!]!.name}`);
  }
  emit(s, "pickup");
}

function press(s: Step): void {
  const prop = touching(s, ...USABLE);
  if (!prop) return;
  if (prop.kind === "panel") prop.on = !prop.on;
  else runUse(s.world, prop);
  emit(s, "use");
}

function clipEvents(s: Step): void {
  const clip = clipOf(s);
  for (const [t, name] of clip.events ?? []) {
    if (!(clip.loop ? crossedLoop(s, t, clip.duration) : crossed(s, t))) continue;
    if (name === "pickup") pickup(s);
    if (name === "use") press(s);
    if (name === "punch") emit(s, "punch");
  }
}

function horizontalSpeed(s: Step): number {
  const { h } = s;
  if (isAirborne(h.state)) return h.vx;
  if (!isGait(h.state)) return 0;
  return h.facing * travelSpeed(clipOf(s));
}

function keepOnDeck(from: number, to: number, lift: Lift, cfg: MovementConfig): number {
  const half = cfg.box.width / 2;
  return Math.min(Math.max(to, Math.min(from, lift.x + half)), Math.max(from, lift.x + lift.w - half));
}

function physics(s: Step): void {
  const { h, world, cfg, dt } = s;
  const box = boxOf(h, cfg);
  const carrier = h.onLift ? liftAt(world, h, cfg) : null;
  if (carrier) box.y = moveBox(box, 0, carrier.vy * dt, world.grid, world.lifts).y;
  const vy = Math.min(h.vy + cfg.gravity * dt, cfg.maxFallSpeed);
  const dx = carrier?.target != null ? keepOnDeck(h.x, h.x + h.vx * dt, carrier, cfg) - h.x : h.vx * dt;
  const r = moveBox(box, dx, ((h.vy + vy) / 2) * dt, world.grid, world.lifts);
  h.x = r.x;
  h.y = r.y;
  h.vy = (r.hitY && vy < 0) || (r.onGround && vy > 0) ? 0 : vy;
  h.onGround = r.onGround && h.vy >= 0;
  h.onLift = h.onGround && world.lifts.some((l) => l === r.platform);
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
  quickSwitch(s);
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
