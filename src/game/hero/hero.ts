import type { InputFrame } from "../../engine/input";
import { moveBox, type Box } from "../../engine/world/collide";
import { callLift, type SandboxWorld } from "../level/sandboxLevel";
import { clipFor, type Clip, type ClipSet, type HeroState, type MovementConfig, type Weapon } from "./config";

export interface Hero {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  state: HeroState;
  time: number;
  weapon: Weapon;
  energy: number;
  fallFrom: number;
  onGround: boolean;
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
    weapon,
    energy,
    fallFrom: spawn[1],
    onGround: true,
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
};

const crossed = (s: Step, t: number): boolean => s.prev <= t && t < s.h.time;

const finished = (s: Step): boolean => s.h.time >= clipOf(s).duration;

const eventTime = (clip: Clip, name: string): number => clip.events?.find(([, n]) => n === name)?.[0] ?? 0;

const isJump = (state: HeroState): boolean => state === "standJump" || state === "runJump";

const isAirborne = (state: HeroState): boolean => state === "fall" || isJump(state);

const boxOf = (h: Hero, cfg: MovementConfig): Box => ({ x: h.x, y: h.y, w: cfg.box.width, h: cfg.box.height });

function ridingLift(s: Step): boolean {
  const { h, world, cfg, dt } = s;
  const { lift } = world;
  const half = cfg.box.width / 2;
  const before = lift.y - lift.vy * dt;
  return h.onGround && Math.abs(h.y - before) <= EPS && h.x + half > lift.x && h.x - half < lift.x + lift.w;
}

function atLadderTop(s: Step): boolean {
  const { h, world } = s;
  const row = Math.round(h.y);
  return h.onGround && Math.abs(h.y - row) <= EPS && world.grid.ladderTop(Math.floor(h.x), row);
}

function enterLadder(h: Hero): void {
  enter(h, "ladder");
  h.x = Math.floor(h.x) + 0.5;
  h.vx = 0;
  h.vy = 0;
  h.onGround = false;
}

function jump(h: Hero, state: "standJump" | "runJump"): void {
  enter(h, state);
  h.fallFrom = h.y;
}

function die(s: Step, state: "fallDeath" | "death"): void {
  const { h } = s;
  enter(h, state);
  h.vx = 0;
  h.vy = 0;
  s.events.push({ kind: "died", x: h.x, y: h.y });
}

function gait(s: Step): void {
  const { h, input } = s;
  if (input.dir === 0) return enter(h, "idle");
  if (input.dir !== h.facing) return enter(h, "turn");
  const next = input.held.has("runModifier") ? "run" : "walk";
  if (h.state !== next) enter(h, next);
}

function idle(s: Step): void {
  const { h, input, world } = s;
  if (ridingLift(s)) {
    if (s.consume("up")) callLift(world.lift, -1);
    else if (s.consume("down")) callLift(world.lift, 1);
  } else if (s.consume("up")) {
    return world.grid.ladderAt(h.x, h.y - LADDER_REACH) ? enterLadder(h) : jump(h, "standJump");
  } else if (input.held.has("down") && atLadderTop(s)) {
    return enterLadder(h);
  }
  if (input.dir !== 0) gait(s);
}

function moving(s: Step): void {
  if (s.h.state === "run" && s.consume("up")) return jump(s.h, "runJump");
  gait(s);
}

function turn(s: Step): void {
  const clip = clipOf(s);
  const flipAt = clip.view?.find(([t]) => t > 0)?.[0] ?? clip.duration / 2;
  if (crossed(s, flipAt)) s.h.facing = s.h.facing === 1 ? -1 : 1;
  if (finished(s)) enter(s.h, "idle");
}

function land(s: Step): void {
  if (finished(s)) enter(s.h, "idle");
}

function ladder(s: Step): void {
  const { h, input, world, cfg, dt } = s;
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
  land,
  ladder,
  fallDeath: respawn,
  death: respawn,
};

const selfMoving = new Set<HeroState>(["ladder", "fallDeath", "death"]);

const launchHeight = (state: HeroState, cfg: MovementConfig): number =>
  state === "runJump" ? cfg.jump.runHeight : cfg.jump.standHeight;

function clipEvents(s: Step): void {
  const { h, cfg } = s;
  for (const [t, name] of clipOf(s).events ?? []) {
    if (!crossed(s, t)) continue;
    if (name === "launch") {
      h.vy = -Math.sqrt(2 * cfg.gravity * launchHeight(h.state, cfg));
      h.onGround = false;
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
  if (ridingLift(s)) box.y = moveBox(box, 0, world.lift.vy * dt, world.grid, [world.lift]).y;
  const vy = Math.min(h.vy + cfg.gravity * dt, cfg.maxFallSpeed);
  const r = moveBox(box, h.vx * dt, ((h.vy + vy) / 2) * dt, world.grid, [world.lift]);
  h.x = r.x;
  h.y = r.y;
  h.vy = (r.hitY && vy < 0) || (r.onGround && vy > 0) ? 0 : vy;
  h.onGround = r.onGround && h.vy >= 0;
}

function settle(s: Step, startY: number): void {
  const { h, world, cfg } = s;
  if (h.y > world.grid.height + PIT_MARGIN) return die(s, "fallDeath");
  if (!h.onGround) {
    if (!isAirborne(h.state)) {
      enter(h, "fall");
      h.fallFrom = startY;
    }
    h.fallFrom = Math.min(h.fallFrom, h.y);
    return;
  }
  const landed = h.state === "fall" || (isJump(h.state) && h.time > eventTime(clipOf(s), "launch"));
  if (!landed) return;
  if (h.y - h.fallFrom > cfg.fallDeathCells) die(s, "fallDeath");
  else enter(h, "land");
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
  h.time += dt;
  clipEvents(s);
  transitions[h.state]?.(s);
  if (selfMoving.has(h.state)) return s.events;
  const startY = h.y;
  h.vx = horizontalSpeed(s);
  physics(s);
  settle(s, startY);
  return s.events;
}
