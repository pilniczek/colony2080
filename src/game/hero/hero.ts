import type { InputFrame } from "../../engine/input";
import { moveBox, type Box } from "../../engine/world/collide";
import { ITEMS } from "../items";
import { BONUS_NAMES, callLift, fallLimit, floorsOf, liftAt, liftGoes, onGround, pickUp, startFilm, type Lift, type Prop, type SandboxWorld } from "../level/sandboxLevel";
import { inCover } from "../level/cover";
import { openTask, pending, runUse, say, tried } from "../level/tasks";
import { padEnabled, padHint, padUnder, ridePad } from "../level/teleports";
import { cue } from "../sound/cues";
import type { SoundId } from "../sound";
import { step as footsteps } from "../sound/triggers";
import { footContacts } from "./gait";
import { clipFor, holdsGun, type BonusKind, type Clip, type ClipSet, type GaitName, type HeroState, type MovementConfig, type Weapon } from "./config";

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

export type HeroEvent = { kind: "pickup" | "use" | "shot" | "beam" | "punch" | "shield" | "died" | "respawned"; x: number; y: number };

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
const PIT_MARGIN = 2;

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

export const isDead = (state: HeroState): boolean => state === "death" || state === "fallDeath" || state === "jumpDeath";

export const isDucked = (state: HeroState): boolean => state === "duck" || state === "duckAttack";

const boxOf = (h: Hero, cfg: MovementConfig): Box => ({ x: h.x, y: h.y, w: cfg.box.width, h: cfg.box.height });

const onMovingLift = ({ h, world, cfg }: Step): boolean => h.onLift && liftAt(world, h, cfg)?.target != null;

const nearest = (h: Hero, props: Prop[]): Prop | undefined =>
  props.reduce<Prop | undefined>((best, p) => (best && Math.abs(best.x - h.x) <= Math.abs(p.x - h.x) ? best : p), undefined);

function over(world: SandboxWorld, h: Hero, cfg: MovementConfig, p: Prop): boolean {
  const y = p.y ?? world.spawn[1];
  return USABLE.includes(p.kind) && onGround(p, h, world.flags, world.bonus) && Math.abs(p.x - h.x) <= (cfg.box.width + (p.width ?? 0)) / 2 && y > h.y - cfg.floorHeightCells && y < h.y + EPS;
}

function usable(s: Step): Prop | undefined {
  const { h, world, cfg } = s;
  return nearest(h, world.props.filter((p) => over(world, h, cfg, p)));
}

function touchedItem(s: Step, kinds: string[]): Prop | undefined {
  const { h, world, cfg } = s;
  return nearest(h, world.props.filter((p) => {
    const y = p.y ?? world.spawn[1];
    const reach = Math.max(cfg.pickReach, (cfg.box.width + (p.width ?? 0)) / 2);
    return kinds.includes(p.kind) && onGround(p, h, world.flags, world.bonus) && Math.abs(p.x - h.x) <= reach && h.y > y - cfg.box.height && h.y <= y + EPS;
  }));
}

const USABLE = ["panel", "object"];
const PICKED_BY_ENTER = ["item", "weapon"];
const itemToPick = (s: Step): boolean => s.input.pressed.has("useItem") && touchedItem(s, PICKED_BY_ENTER) !== undefined;

const travelSpeed = (clip: Clip): number => (clip.travel ?? 0) / clip.duration;

function launch(s: Step, state: Jump): { height: number; speed: number } {
  const { cfg, clips } = s;
  if (state === "runJump") return { height: cfg.jump.runHeight, speed: cfg.jump.runSpeed };
  if (state === "walkJump") return { height: cfg.jump.walkHeight, speed: clips.walk ? travelSpeed(clips.walk) : 0 };
  return { height: cfg.jump.standHeight, speed: 0 };
}

function jump(s: Step, state: Jump): void {
  const { h, cfg } = s;
  if (inCover(s.world.props, h.x, cfg.box.width / 2, h.y)) return;
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

function spend(h: Hero, cfg: MovementConfig, amount: number, events: HeroEvent[]): void {
  h.energy = Math.max(0, h.energy - amount);
  if (h.energy > 0) return;
  if (h.shields > 0) {
    h.shields -= 1;
    h.energy = cfg.energy.max;
    events.push({ kind: "shield", x: h.x, y: h.y });
  } else die(h, deathOf(h), events);
}

export function damage(h: Hero, cfg: MovementConfig): HeroEvent[] {
  const events: HeroEvent[] = [];
  if (h.hidden || isDead(h.state)) return events;
  h.hitAge = 0;
  spend(h, cfg, cfg.energy.hit * cfg.damageScale, events);
  return events;
}

export function drain(h: Hero, cfg: MovementConfig, amount: number): HeroEvent[] {
  const events: HeroEvent[] = [];
  if (!isDead(h.state)) spend(h, cfg, amount * cfg.damageScale, events);
  return events;
}

const runs = (h: Hero, cfg: MovementConfig): boolean => h.running && !(h.hitAge !== null && h.hitAge * 1000 < cfg.hitSlowMs);

function gait(s: Step): void {
  const { h, input } = s;
  if (input.dir === 0) return h.state === "idle" ? undefined : enter(h, "idle");
  if (input.dir !== h.facing) {
    h.facing = input.dir;
    if (h.state === "idle") return;
  }
  const next = runs(h, s.cfg) ? "run" : "walk";
  if (h.state !== next) enter(h, next);
}

function emit(s: Step, kind: HeroEvent["kind"]): void {
  s.events.push({ kind, x: s.h.x, y: s.h.y });
}

export const bonusAmmo = (world: SandboxWorld, cfg: MovementConfig): number => cfg[world.bonus].ammo;

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
    if (s.world.bonus === "blaster") {
      h.blaster = ammoOf(h, "blaster") - 1;
      cue(s.world, "beam", 8000);
    }
    return emit(s, "beam");
  }
  h.ammo -= 1;
  cue(s.world, "gunShot", 15000);
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
  if (!s.input.pressed.has("useItem") || itemToPick(s)) return false;
  const prop = usable(s);
  if (!prop || !s.consume("useItem")) return false;
  const cutscene = prop.kind === "panel" ? undefined : openTask(s.world, prop)?.cutscene;
  if (!cutscene) {
    enter(s.h, "use");
    return true;
  }
  startFilm(s.world, cutscene, prop);
  return true;
}

export function halt(h: Hero): void {
  enter(h, "idle");
  h.vx = 0;
  h.fireTime = null;
}

function act(s: Step): boolean {
  if (use(s)) return true;
  if (!s.consume("shoot") && !(s.h.weapon === "fists" && s.input.held.has("shoot"))) return false;
  startAttack(s, s.input.held.has("down") ? "duckAttack" : "attack");
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
  const [fists, gun, blaster] = ["weapon1", "weapon2", "weapon3"].map((slot) => s.consume(slot));
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
  if (!input.held.has("down")) return false;
  s.consume("down");
  enter(h, "duck");
  return true;
}

const upHeld = (s: Step): boolean => s.consume("up") || (s.input.held.has("up") && s.h.landing?.age === 0);

function standUp(s: Step, from: Jump): boolean {
  if (liftPress(s)) return false;
  if (padPress(s)) return true;
  if (!upHeld(s)) return false;
  jump(s, from);
  return true;
}

function idle(s: Step): void {
  const { input } = s;
  if (standUp(s, "standJump")) return;
  if (act(s) || stance(s)) return;
  if (input.dir !== 0) gait(s);
}

function liftPress(s: Step): boolean {
  if (!s.input.pressed.has("useItem") || usable(s) || itemToPick(s) || !(rideLift(s) || callFromPanel(s))) return false;
  s.consume("useItem");
  return true;
}

function padPress(s: Step): boolean {
  const { world, h } = s;
  const pad = s.input.pressed.has("useItem") && !itemToPick(s) ? padUnder(world, h) : null;
  if (!pad) return false;
  const enabled = padEnabled(world, pad);
  const prop = usable(s);
  if (prop && (openTask(world, prop) || (!enabled && pending(world, prop)))) return false;
  s.consume("useItem");
  if (!enabled) {
    world.flags.add(tried(pad.id));
    const hint = padHint(world);
    if (hint) say(world, hint);
    return true;
  }
  ridePad(h, pad);
  cue(world, "teleport", 13000);
  halt(h);
  return true;
}

function rideLift({ h, world, cfg }: Step): boolean {
  const lift = deckUnder(h, world, cfg);
  if (!lift || !liftGoes(lift, rideDir(lift))) return false;
  if (lift.enabledBy !== undefined && !world.flags.has(lift.enabledBy)) refuseLift(world, lift.enabledBy, lift.hint);
  else if (onDeck(h.x, lift, cfg)) startRide(world, lift);
  else world.boarding = lift;
  return true;
}

function refuseLift(world: SandboxWorld, enabledBy: string, hint: string | undefined): void {
  world.flags.add(tried(enabledBy.slice(enabledBy.indexOf(":") + 1)));
  if (hint) say(world, hint);
}

const rideDir = (lift: Lift): -1 | 1 => (lift.y > lift.top ? -1 : 1);

function startRide(world: SandboxWorld, lift: Lift): void {
  const dir = lift.target === null ? rideDir(lift) : lift.target > lift.y ? -1 : 1;
  lift.target = null;
  callLift(lift, dir, world.flags);
  cue(world, "liftStart", 8000);
}

function deckUnder(h: Hero, world: SandboxWorld, cfg: MovementConfig): Lift | null {
  const lift = h.onGround ? liftAt(world, h, cfg) : null;
  return lift && (h.onLift || Math.abs(lift.y - h.y) < EPS) ? lift : null;
}

function onDeck(x: number, lift: Lift, cfg: MovementConfig): boolean {
  const half = cfg.box.width / 2;
  return x - half >= lift.x - EPS && x + half <= lift.x + lift.w + EPS;
}

function board(s: Step): void {
  const { h, world, input, cfg } = s;
  const lift = world.boarding;
  if (!lift) return;
  const idleOrGait = h.state === "idle" || isGait(h.state);
  if (input.dir !== 0 || input.pressed.size > 0 || !h.onGround || !idleOrGait || world.cutscene || !deckUnder(h, world, cfg)) {
    world.boarding = null;
    return;
  }
  if (!onDeck(h.x, lift, cfg)) {
    s.input = { ...input, dir: h.x < lift.x + lift.w / 2 ? 1 : -1 };
    return;
  }
  world.boarding = null;
  halt(h);
  startRide(world, lift);
}

function callFromPanel({ h, world, cfg }: Step): boolean {
  const lift = h.onLift ? undefined : world.lifts.find((l) => atPanel(h, l, cfg));
  if (!lift) return false;
  const stop = lift.stops.find((row) => Math.abs(row - h.y) < EPS)!;
  if (lift.target === stop || (lift.target === null && Math.abs(lift.y - h.y) < EPS)) return false;
  if (lift.enabledBy !== undefined && !world.flags.has(lift.enabledBy)) {
    refuseLift(world, lift.enabledBy, lift.hint);
    return true;
  }
  lift.target = stop;
  cue(world, "liftStart", 8000);
  return true;
}

function atPanel(h: Hero, lift: Lift, cfg: MovementConfig): boolean {
  const half = cfg.box.width / 2;
  const beside = h.x - half < lift.x - EPS ? h.x + half > lift.x - 1 : h.x + half > lift.x + lift.w + EPS && h.x - half < lift.x + lift.w + 1;
  return beside && lift.stops.some((row) => Math.abs(row - h.y) < EPS);
}

function moving(s: Step): void {
  const { h } = s;
  if (takeCover(s)) return;
  if (liftPress(s)) return enter(h, "idle");
  if (padPress(s)) return;
  if (upHeld(s)) return jump(s, h.state === "run" ? "runJump" : "walkJump");
  if (holdsGun(h.weapon)) gunFire(s);
  if (use(s)) return;
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

function duckOrStand(s: Step): void {
  const { h, input } = s;
  const down = input.held.has("down");
  if (down === (h.state === "duckAttack")) return;
  if (down) s.consume("down");
  h.state = down ? "duckAttack" : "attack";
}

function attack(s: Step): void {
  const { h, input } = s;
  if (takeCover(s)) return;
  duckOrStand(s);
  if (holdsGun(h.weapon)) {
    const ducked = h.state === "duckAttack";
    if (ducked && input.dir !== 0) h.facing = input.dir;
    if (standUp(s, ducked ? "duckJump" : "standJump")) return;
    gunFire(s);
    if (h.fireTime === null || (!ducked && input.dir !== 0)) leaveAttack(s);
    return;
  }
  const clip = clipOf(s);
  if (!input.held.has("shoot") && h.time >= (clip.cancelAt ?? clip.duration)) leaveAttack(s);
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
  const auto = emptyWeapon(h);
  if (auto) arm(h, fallbackWeapon(h));
  const slot = weaponSlot(s);
  const picked = slot !== null && slot !== h.weapon;
  if (auto || picked) click(s);
  if (!picked) return;
  if (h.state === "hide") switchWeapon(s, slot);
  else arm(h, slot);
}

const click = (s: Step): void => cue(s.world, "click", 20000, 45, "ui");

function arm(h: Hero, weapon: Weapon): void {
  h.weapon = weapon;
  h.switchTo = weapon;
  h.fireTime = null;
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
  duck,
  duckAttack: attack,
  use: toIdle,
  hide,
  attack,
  weaponSwitch,
  fallDeath: respawn,
  death: respawn,
  jumpDeath: respawn,
};

export const BONUS_TEXT: Record<BonusKind, string> = {
  ammo: "You found ammunition.",
  energy: "You found an energy cell. Energy refilled.",
  shield: "You found a shield unit. One more shield is ready.",
};

const BONUS_SOUND: Record<BonusKind, [SoundId, number]> = { ammo: ["click", 9000], energy: ["power", 20000], shield: ["power", 16000] };

export function takeBonus(s: Pick<Step, "h" | "world" | "cfg">, kind: BonusKind): void {
  const { h, world, cfg } = s;
  const { add, cap } = cfg.bonuses[kind];
  if (kind === "ammo") h.ammo = Math.max(h.ammo, Math.min(cap, h.ammo + add));
  if (kind === "energy") h.energy = Math.max(h.energy, Math.min(cap, h.energy + add));
  if (kind === "shield") h.shields = Math.max(h.shields, Math.min(cap, h.shields + add));
  cue(world, ...BONUS_SOUND[kind]);
}

function pickup(s: Step): void {
  if (isDead(s.h.state) || s.h.hidden || s.world.cutscene) return;
  const prop = touchedItem(s, ["bonus"]) ?? (itemToPick(s) ? touchedItem(s, PICKED_BY_ENTER) : undefined);
  if (!prop || (prop.kind !== "bonus" && !s.consume("useItem"))) return;
  if (prop.kind === "weapon") {
    s.world.bonus = prop.weapon ?? "blaster";
    s.h.blaster = bonusAmmo(s.world, s.cfg);
    if (s.h.state !== "weaponSwitch") arm(s.h, "blaster");
    say(s.world, prop.pickupText ?? `Picked up ${BONUS_NAMES[s.world.bonus]}`);
  } else if (prop.kind === "bonus") {
    prop.taken = true;
    takeBonus(s, prop.bonus!);
    say(s.world, prop.pickupText ?? BONUS_TEXT[prop.bonus!]);
  } else {
    prop.taken = true;
    pickUp(s.world, prop.item!);
    say(s.world, prop.pickupText ?? `Picked up ${ITEMS[prop.item!]!.name}`);
  }
  startFilm(s.world, prop.cutscene);
  emit(s, "pickup");
}

function press(s: Step): void {
  const prop = usable(s);
  if (!prop) return;
  if (prop.kind === "panel") prop.on = !prop.on;
  else runUse(s.world, prop);
  emit(s, "use");
}

function clipEvents(s: Step): void {
  const clip = clipOf(s);
  for (const [t, name] of clip.events ?? []) {
    if (!(clip.loop ? crossedLoop(s, t, clip.duration) : crossed(s, t))) continue;
    if (name === "use") press(s);
    if (name !== "punch") continue;
    cue(s.world, "punch", 13000);
    emit(s, "punch");
  }
}

function horizontalSpeed(s: Step): number {
  const { h } = s;
  if (isAirborne(h.state)) return h.vx;
  if (!isGait(h.state)) return 0;
  return h.facing * travelSpeed(clipOf(s));
}

function risingDeck({ h, world, cfg, dt }: Step): Lift | undefined {
  const half = cfg.box.width / 2;
  return world.lifts.find((l) => l.vy < 0 && h.vy > l.vy && h.x + half > l.x && h.x - half < l.x + l.w && h.y > l.y && h.y <= l.y - l.vy * dt + EPS);
}

const enters = (props: Prop[], h: Hero, to: { x: number; y: number }, half: number): boolean =>
  !inCover(props, h.x, half, h.y) && inCover(props, to.x, half, to.y);

function physics(s: Step): void {
  const { h, world, cfg, dt } = s;
  const box = boxOf(h, cfg);
  const carrier = h.onLift ? liftAt(world, h, cfg) : null;
  if (carrier) box.y = moveBox(box, 0, carrier.vy * dt, world.grid, world.lifts, { ignoreOneWay: true }).y;
  const deck = carrier ? undefined : risingDeck(s);
  if (deck) {
    box.y = deck.y;
    h.vy = Math.max(h.vy, 0);
  }
  const vy = Math.min(h.vy + cfg.gravity * dt, cfg.maxFallSpeed);
  const dx = h.vx * dt;
  const r = moveBox(box, dx, ((h.vy + vy) / 2) * dt, world.grid, floorsOf(world));
  if (!h.onGround && enters(world.props, h, r, cfg.box.width / 2)) {
    r.x = h.x;
    h.vx = 0;
  }
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
  if (!world.immortal && h.y - h.fallFrom > fallLimit(world, cfg)) return die(h, "fallDeath", s.events);
  const landing = { from: h.state, time: h.time, age: 0 };
  if (h.fireTime !== null && s.input.held.has("down")) return enter(h, "duckAttack");
  if (h.fireTime !== null && s.input.dir === 0) return enter(h, "attack");
  enter(h, s.input.dir === 0 ? "idle" : runs(h, cfg) ? "run" : "walk");
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

function stepSounds(s: Step): void {
  const { h } = s;
  if (!isGait(h.state) || h.fireTime !== null) return;
  const { duration } = clipOf(s);
  footsteps(s.world, footContacts(s.prev / duration, h.time / duration));
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

function enemyHits(s: Step): void {
  const { h, world, cfg } = s;
  const hits = world.immortal ? 0 : world.heroHits;
  world.heroHits = 0;
  for (let i = 0; i < hits; i++) s.events.push(...damage(h, cfg));
  if (hits > 0 && h.state === "runJump") h.vx = h.facing * launch(s, "walkJump").speed;
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
  const before = h.state;
  h.time += dt * h.rate;
  if (h.hitAge !== null) h.hitAge += dt;
  if (h.landing) h.landing.age += dt;
  if (h.fireTime !== null) h.fireTime += dt;
  if (consume("runToggle")) h.running = !h.running;
  quickSwitch(s);
  board(s);
  clipEvents(s);
  transitions[h.state]?.(s);
  if (isDead(h.state)) fallDead(s);
  else {
    const startY = h.y;
    h.vx = horizontalSpeed(s);
    physics(s);
    settle(s, startY);
  }
  if (h.state === before) stepSounds(s);
  pickup(s);
  enemyHits(s);
  return s.events;
}
