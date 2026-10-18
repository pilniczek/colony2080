import { FIXED_STEP } from "../../engine/loop";
import type { ViewTransform } from "../../engine/render/view";
import { drawRig, shade, type HookDraw, type Palette } from "../../engine/rig/draw";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import type { MovementConfig } from "../hero/config";
import { HERO_SHOT, type Hero } from "../hero/hero";
import { SPIKE_K } from "../hero/gait";
import { heroScale, type HeroLook, type HitLook, type Rigs } from "../hero/look";
import { ceilingAbove, type Prop, type SandboxWorld } from "../level/sandboxLevel";
import { drawGun, FRONT_BARREL, gunHook, gunSlung } from "../robot/gun";
import { ROBOT } from "../robot/xbot";
import { muzzleInRig, SPARK_LIFE } from "../shots";

const DEG = Math.PI / 180;
const PILLAR_EVERY = 3;
const STAR = { radius: 14 / SPIKE_K, points: 10, inner: 0.35, outer: 0.6 };
const FLASH = { ahead: 4 / SPIKE_K, radius: 8 / SPIKE_K, k: 0.2 };
const IMPACT = { radius: 7, k: 0.3 };
const TRACER = { length: 14, width: 2 };
const BAG = { rope: 12, w: 32, h: 92 };

const COLORS = {
  skyTop: "#1b2629",
  skyBottom: "#0f1517",
  pillar: "#162022",
  slab: "#2d3a3c",
  slabTop: "#4a5c5f",
  rivet: "#1f2a2c",
  crate: "#5b4a32",
  crateLine: "#2a2016",
  barrel: "#6b3a1c",
  barrelLight: "#8c4c22",
  barrelBand: "#3a1e0e",
  item: "#3fa34a",
  itemLight: "#b8e0b0",
  panel: "#26363a",
  panelLine: "#4a5c5f",
  on: "#3fa34a",
  off: "#e0281e",
  target: "#3c4a4c",
  targetLine: "#1a2224",
  shaft: "#3a2a22",
  liftDeck: "#4a5c5f",
  liftStripe: "#e0b020",
  liftCage: "#6f878b",
  ladder: "#4a5c5f",
  shot: "#ff6a3a",
  emitterOff: "#3a2a22",
  spark: "#ffd76a",
};

interface Frame {
  ctx: CanvasRenderingContext2D;
  world: SandboxWorld;
  cell: number;
  unit: number;
  lineW: number;
}

const floorOf = (f: Frame, p: Prop): number => (p.y ?? f.world.spawn[1]) * f.cell;

function backdrop(f: Frame): void {
  const { ctx, world, cell } = f;
  const w = world.grid.width * cell;
  const h = world.grid.height * cell;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, COLORS.skyTop);
  g.addColorStop(1, COLORS.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = COLORS.pillar;
  for (let i = 0; i * PILLAR_EVERY < world.grid.width; i++) {
    const top = (2 + (i % 3) * 0.75) * cell;
    ctx.fillRect((i * PILLAR_EVERY + 0.5) * cell, top, 1.5 * cell, h - top);
  }
}

function tiles(f: Frame): void {
  const { ctx, world, cell, unit } = f;
  const { grid } = world;
  for (let row = 0; row < grid.height; row++) {
    for (let col = 0; col < grid.width; col++) {
      if (!grid.solid(col, row)) continue;
      ctx.fillStyle = COLORS.slab;
      ctx.fillRect(col * cell, row * cell, cell, cell);
      if (row === 0 || grid.solid(col, row - 1)) continue;
      ctx.fillStyle = COLORS.slabTop;
      ctx.fillRect(col * cell, row * cell, cell, 3 * unit);
      ctx.fillStyle = COLORS.rivet;
      for (let x = col * cell + 10 * unit; x < (col + 1) * cell; x += 28 * unit) ctx.fillRect(x, row * cell + 8 * unit, 2 * unit, 2 * unit);
    }
  }
}

function ladders(f: Frame): void {
  const { ctx, world, cell, unit } = f;
  const { grid } = world;
  ctx.fillStyle = COLORS.ladder;
  for (let col = 0; col < grid.width; col++) {
    for (let row = 0; row < grid.height; row++) {
      if (!grid.ladderTop(col, row)) continue;
      let end = row;
      while (grid.at(col, end) === "H") end++;
      const cx = (col + 0.5) * cell;
      const [top, bottom] = [row * cell, end * cell];
      ctx.fillRect(cx - 28 * unit, top, 5 * unit, bottom - top);
      ctx.fillRect(cx + 23 * unit, top, 5 * unit, bottom - top);
      for (let y = bottom - 16 * unit; y > top; y -= 22 * unit) ctx.fillRect(cx - 28 * unit, y, 56 * unit, 3 * unit);
    }
  }
}

function lift(f: Frame, alpha: number): void {
  const { ctx, world, cell, unit } = f;
  const l = world.lift;
  const left = l.x * cell;
  const right = (l.x + l.w) * cell;
  const y = (l.y - l.vy * (1 - alpha) * FIXED_STEP) * cell;
  ctx.fillStyle = COLORS.shaft;
  ctx.fillRect(left - 14 * unit, l.top * cell, 10 * unit, (l.bottom - l.top) * cell);
  ctx.fillRect(right + 4 * unit, l.top * cell, 10 * unit, (l.bottom - l.top) * cell);
  ctx.fillStyle = COLORS.liftDeck;
  ctx.fillRect(left, y, right - left, 8 * unit);
  ctx.fillStyle = COLORS.liftStripe;
  for (let x = left; x < right; x += 16 * unit) ctx.fillRect(x, y + 2 * unit, Math.min(8 * unit, right - x), 4 * unit);
  ctx.fillStyle = COLORS.liftCage;
  ctx.fillRect(left, y - 40 * unit, 3 * unit, 40 * unit);
  ctx.fillRect(right - 3 * unit, y - 40 * unit, 3 * unit, 40 * unit);
  ctx.fillRect(left, y - 40 * unit, right - left, 3 * unit);
}

function box(f: Frame, p: Prop, w: number, h: number, fill: string, line: string): void {
  const { ctx, unit } = f;
  const x = p.x * f.cell - w / 2;
  const y = floorOf(f, p);
  const inset = 0.75 * unit;
  ctx.fillStyle = fill;
  ctx.fillRect(x, y - h, w, h);
  ctx.strokeStyle = line;
  ctx.lineWidth = 1.5 * unit;
  ctx.strokeRect(x + inset, y - h + inset, w - 2 * inset, h - 2 * inset);
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + w, y);
  ctx.moveTo(x + w, y - h);
  ctx.lineTo(x, y);
  ctx.stroke();
}

const crate = (f: Frame, p: Prop): void => box(f, p, (p.width ?? 1) * f.cell, (p.height ?? 1) * f.cell, COLORS.crate, COLORS.crateLine);

const target = (f: Frame, p: Prop): void => box(f, p, 40 * f.unit, 70 * f.unit, COLORS.target, COLORS.targetLine);

function barrel(f: Frame, p: Prop): void {
  const { ctx, cell, unit } = f;
  const w = (p.width ?? 1) * cell;
  const h = (p.height ?? 1) * cell;
  const x = p.x * cell - w / 2;
  const y = floorOf(f, p);
  ctx.fillStyle = COLORS.barrel;
  ctx.fillRect(x, y - h, w, h);
  ctx.fillStyle = COLORS.barrelLight;
  ctx.fillRect(x + w * 0.15, y - h, w * 0.2, h);
  ctx.fillStyle = COLORS.barrelBand;
  for (const k of [0.2, 0.8]) ctx.fillRect(x, y - h * k - 2 * unit, w, 4 * unit);
}

function item(f: Frame, p: Prop): void {
  if (p.taken) return;
  const { ctx, cell, unit } = f;
  const x = p.x * cell;
  const y = floorOf(f, p);
  ctx.fillStyle = COLORS.item;
  ctx.fillRect(x - 6 * unit, y - 8 * unit, 12 * unit, 8 * unit);
  ctx.fillStyle = COLORS.itemLight;
  ctx.fillRect(x - 6 * unit, y - 8 * unit, 12 * unit, 2 * unit);
}

function panel(f: Frame, p: Prop): void {
  const { ctx, cell, unit } = f;
  const x = p.x * cell;
  const y = floorOf(f, p);
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(x - 17 * unit, y - 26 * unit, 34 * unit, 52 * unit);
  ctx.strokeStyle = COLORS.panelLine;
  ctx.lineWidth = unit;
  ctx.strokeRect(x - 17 * unit, y - 26 * unit, 34 * unit, 52 * unit);
  ctx.fillStyle = p.on ? COLORS.on : COLORS.off;
  ctx.fillRect(x + 3 * unit, y - 20 * unit, 8 * unit, 8 * unit);
}

function bag(f: Frame, p: Prop): void {
  const { ctx, cell, unit } = f;
  const x = p.x * cell;
  const top = ceilingAbove(f.world, p) * cell;
  ctx.fillStyle = COLORS.slabTop;
  ctx.fillRect(x - unit, top, 2 * unit, BAG.rope * unit);
  ctx.fillStyle = COLORS.barrel;
  ctx.fillRect(x - (BAG.w / 2) * unit, top + BAG.rope * unit, BAG.w * unit, BAG.h * unit);
  ctx.fillStyle = COLORS.barrelBand;
  ctx.fillRect(x - 16 * unit, top + 32 * unit, 32 * unit, 4 * unit);
  ctx.fillRect(x - 16 * unit, top + 80 * unit, 32 * unit, 4 * unit);
}

const PROPS: Record<string, (f: Frame, p: Prop) => void> = { crate, barrel, item, panel, bag, target };

function emitter(f: Frame): void {
  const { ctx, world, cell, unit } = f;
  const e = world.emitter;
  const x = e.x * cell;
  const y = e.y * cell;
  ctx.fillStyle = COLORS.target;
  ctx.fillRect(x - 14 * unit, y - 14 * unit, 28 * unit, 28 * unit);
  ctx.fillStyle = COLORS.liftCage;
  ctx.fillRect(e.dir < 0 ? x - 30 * unit : x + 14 * unit, y - 4 * unit, 16 * unit, 8 * unit);
  ctx.fillStyle = e.on ? COLORS.off : COLORS.emitterOff;
  ctx.fillRect(x - 4 * unit, y - 10 * unit, 8 * unit, 8 * unit);
}

function projectiles(f: Frame, alpha: number): void {
  const { ctx, world, cell, unit } = f;
  ctx.fillStyle = COLORS.shot;
  for (const p of world.projectiles) {
    const x = (p.x - p.vx * (1 - alpha) * FIXED_STEP) * cell;
    const y = p.y * cell;
    if (p.tag === HERO_SHOT) {
      tracer(f, x, y, Math.sign(p.vx));
      continue;
    }
    ctx.strokeStyle = COLORS.shot;
    ctx.lineWidth = 2 * unit;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - Math.sign(p.vx) * 16 * unit, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, p.r * cell, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tracer(f: Frame, x: number, y: number, dir: number): void {
  const { ctx, unit } = f;
  ctx.strokeStyle = COLORS.spark;
  ctx.lineWidth = TRACER.width * unit;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - dir * TRACER.length * unit, y);
  ctx.stroke();
}

function impacts(f: Frame): void {
  const { ctx, world, cell, unit } = f;
  for (const s of world.sparks) star(ctx, [s.x * cell, s.y * cell], IMPACT.radius * unit, IMPACT.k + (1 - IMPACT.k) * (s.age / SPARK_LIFE));
}

function groundBelow(f: Frame, x: number, y: number): number | null {
  const { grid, lift: l } = f.world;
  let ground: number | null = null;
  for (let row = Math.ceil(y - 1e-3); row < grid.height && ground === null; row++) if (grid.solid(Math.floor(x), row)) ground = row;
  const overLift = x >= l.x && x <= l.x + l.w && l.y >= y - 1e-3;
  return overLift && (ground === null || l.y < ground) ? l.y : ground;
}

function shadow(f: Frame, hero: Hero, look: HeroLook): void {
  if (look.view === "back") return;
  const ground = groundBelow(f, hero.x, hero.y);
  if (ground === null) return;
  const { ctx, cell, unit } = f;
  const height = Math.max(0, ground - hero.y) * cell;
  const k = Math.max(0, 1 - height / (60 * unit));
  ctx.fillStyle = `rgba(0,0,0,${0.35 * k})`;
  ctx.beginPath();
  ctx.ellipse(hero.x * cell, ground * cell, 30 * unit * Math.max(0.4, k), 3.5 * unit, 0, 0, Math.PI * 2);
  ctx.fill();
}

export const rigFor = (look: HeroLook, rigs: Rigs): GroupNode =>
  look.view === "side" ? rigs.side : look.view === "front" ? rigs.front : rigs.climber;

function droppedGun(f: Frame, hero: Hero, scale: number, palette: Palette): void {
  const { ctx, cell, unit, lineW } = f;
  ctx.save();
  ctx.translate(hero.x * cell + hero.facing * 24 * unit, hero.y * cell - 9 * unit);
  ctx.scale(scale * hero.facing, scale);
  drawGun(ctx, { palette, lineW, simple: true });
  ctx.restore();
}

export function toRigSpace(ctx: CanvasRenderingContext2D, hero: Hero, look: HeroLook, cell: number, scale: number): void {
  ctx.translate(hero.x * cell, hero.y * cell + look.lift * scale);
  if (look.flip) ctx.scale(-1, 1);
  if (look.rot) ctx.rotate(look.rot * DEG);
  ctx.scale(scale, scale);
  ctx.translate(look.view === "side" ? -ROBOT.SIDE_AX : -ROBOT.AX, -ROBOT.FOOT_Y);
}

function star(ctx: CanvasRenderingContext2D, [x, y]: Pt, radius: number, k: number): void {
  if (k >= 1) return;
  ctx.save();
  ctx.globalAlpha *= 1 - k;
  ctx.fillStyle = COLORS.spark;
  ctx.beginPath();
  for (let i = 0; i < STAR.points; i++) {
    const a = (i * 2 * Math.PI) / STAR.points;
    const r = radius * (i % 2 ? STAR.inner : STAR.outer + k);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.fill();
  ctx.restore();
}

const hitStar = (ctx: CanvasRenderingContext2D, hit: HitLook): void => star(ctx, hit.star, STAR.radius, hit.spark);

const firing = (hero: Hero, fireRate: number): boolean =>
  hero.weapon === "gun" && (hero.state === "attack" || hero.state === "duckAttack") && Math.floor(hero.time * fireRate) % 2 === 0;

function muzzleFlash(ctx: CanvasRenderingContext2D, look: HeroLook, rigs: Rigs): void {
  const muzzle = muzzleInRig(look, rigs);
  if (muzzle) star(ctx, [muzzle[0] + FLASH.ahead, muzzle[1]], FLASH.radius, FLASH.k);
}

function heroFigure(f: Frame, hero: Hero, look: HeroLook, rigs: Rigs, scale: number, fireRate: number): void {
  const { ctx, cell, lineW } = f;
  const palette = look.tint ? shade(ROBOT.palette, { brightness: 1 - look.tint * 0.68, saturate: 1 - look.tint * 0.7 }) : ROBOT.palette;
  const front = look.view === "front";
  const gun: HookDraw = (c, pal) => gunHook(c, pal, { lineW, simple: true, barrel: front ? FRONT_BARREL : undefined });
  const hooks: Record<string, HookDraw> = {};
  if (look.gun === "hand") hooks[front ? "handL" : "hand"] = gun;
  if (look.gun === "dropped") droppedGun(f, hero, scale, palette);
  ctx.save();
  toRigSpace(ctx, hero, look, cell, scale);
  drawRig(ctx, rigFor(look, rigs), { palette, pose: look.pose, hooks, lineW, simple: true });
  if (look.gun === "slung") gunSlung(ctx, palette, { lineW, simple: true });
  if (firing(hero, fireRate)) muzzleFlash(ctx, look, rigs);
  if (look.hit) hitStar(ctx, look.hit);
  ctx.restore();
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  world: SandboxWorld,
  hero: Hero,
  look: HeroLook,
  rigs: Rigs,
  cfg: MovementConfig,
  view: ViewTransform,
  alpha: number,
): void {
  const scale = heroScale(cfg);
  const unit = scale / SPIKE_K;
  const f: Frame = { ctx, world, cell: cfg.cellPx, unit, lineW: unit * view.scale };
  ctx.save();
  ctx.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);
  ctx.beginPath();
  ctx.rect(0, 0, world.grid.width * f.cell, world.grid.height * f.cell);
  ctx.clip();
  backdrop(f);
  tiles(f);
  lift(f, alpha);
  ladders(f);
  for (const p of world.props) PROPS[p.kind]?.(f, p);
  emitter(f);
  shadow(f, hero, look);
  heroFigure(f, hero, look, rigs, scale, cfg.fireRate);
  projectiles(f, alpha);
  impacts(f);
  ctx.restore();
}
