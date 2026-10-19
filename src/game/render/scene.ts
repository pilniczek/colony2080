import { span } from "../../engine/anim/keyed";
import { FIXED_STEP } from "../../engine/loop";
import type { ViewTransform } from "../../engine/render/view";
import { drawRig, shade, type HookDraw, type Palette } from "../../engine/rig/draw";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import type { Projectile } from "../../engine/world/projectiles";
import type { MovementConfig } from "../hero/config";
import type { Hero } from "../hero/hero";
import { SPIKE_K } from "../hero/gait";
import { heroScale, spikeUnit, type GunModel, type HeroLook, type HitLook, type Rigs } from "../hero/look";
import type { Rect } from "../geometry";
import type { Enemy } from "../level/enemy";
import type { SandboxWorld } from "../level/sandboxLevel";
import { drawEBlaster, eblasterHook, eblasterSlung } from "../robot/eblaster";
import { drawGun, FRONT_BARREL, gunHook, gunSlung } from "../robot/gun";
import { ROBOT } from "../robot/xbot";
import { muzzleInRig, SPARK_LIFE } from "../shots";
import { drawEnvironment } from "./environment";

const DEG = Math.PI / 180;
const STAR = { radius: 14 / SPIKE_K, points: 10, inner: 0.35, outer: 0.6 };
const FLASH = { ahead: 4 / SPIKE_K, radius: 8 / SPIKE_K, k: 0.2 };
const IMPACT = { radius: 7, k: 0.3 };
const TRACER = { length: 14, width: 2 };
const DUST = { back: 30, up: 6, radius: 18 };
const DROPPED_GUN = { ahead: 24, slide: 20, up: 9 };
const ENEMY_PALETTE: Palette = { ...shade(ROBOT.palette, { brightness: 1.1, saturate: 0 }), visor: ROBOT.palette.visor! };
const BLAST = { grow: 0.25, hideBody: 0.45, center: -84, spin: 3.2, pull: [0.75, 1.1], fade: [0.9, 1.2], ring: [0.95, 1.45], ringRadius: 72, ringWidth: 11, swirl: 0.16, size: 1.6 } as const;
const FIREBALLS: [number, number, number, number][] = [
  [6, -96, 0, 22],
  [-14, -72, 0.08, 26],
  [22, -60, 0.16, 24],
  [-4, -116, 0.24, 30],
  [-26, -100, 0.3, 24],
  [18, -128, 0.36, 28],
  [0, -84, 0.4, 36],
  [-18, -40, 0.46, 22],
  [24, -36, 0.5, 20],
];
const MODELS = {
  gun: { draw: drawGun, hook: gunHook, slung: gunSlung },
  blaster: { draw: drawEBlaster, hook: eblasterHook, slung: eblasterSlung },
} satisfies Record<GunModel, unknown>;
const SCRAP: [number, number][] = [[-34, 0], [-26, -8], [-14, -10], [-8, -18], [2, -12], [10, -22], [18, -12], [28, -10], [36, 0]];

const COLORS = {
  shot: "#ff6a3a",
  spark: "#ffd76a",
  blastCore: "#fff3b0",
  blastMid: "#ffb030",
  blastEdge: "#e8641a",
  blastOut: "rgba(150,40,10,0)",
  vortex: "#d8301c",
  scrap: "#5d6668",
  scrapLight: "#a9b3b5",
};

interface Frame {
  ctx: CanvasRenderingContext2D;
  world: SandboxWorld;
  cell: number;
  unit: number;
  lineW: number;
}

function projectiles(f: Frame, alpha: number): void {
  const { world, cell } = f;
  for (const p of world.projectiles) {
    const x = (p.x - p.vx * (1 - alpha) * FIXED_STEP) * cell;
    const y = p.y * cell;
    tracer(f, p, x, y);
  }
}

function tracer(f: Frame, p: Projectile, x: number, y: number): void {
  const { ctx, unit, cell } = f;
  const dir = Math.sign(p.vx);
  const length = TRACER.length * unit;
  const origin = (p.originX ?? p.x) * cell;
  if ((x - origin) * dir <= 0) return;
  const tail = dir > 0 ? Math.max(x - length, origin) : Math.min(x + length, origin);
  ctx.strokeStyle = COLORS.spark;
  ctx.lineWidth = TRACER.width * unit;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(tail, y);
  ctx.stroke();
}

function impacts(f: Frame): void {
  const { ctx, world, cell, unit } = f;
  for (const s of world.sparks) star(ctx, [s.x * cell, s.y * cell], IMPACT.radius * unit, IMPACT.k + (1 - IMPACT.k) * (s.age / SPARK_LIFE));
}

export const castsShadow = (hero: Hero, look: HeroLook): boolean => hero.onGround && look.view !== "back";

function shadow(f: Frame, hero: Hero, look: HeroLook): void {
  if (!castsShadow(hero, look)) return;
  const { ctx, cell, unit } = f;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(hero.x * cell, hero.y * cell, 30 * unit, 3.5 * unit, 0, 0, Math.PI * 2);
  ctx.fill();
}

export const rigFor = (look: HeroLook, rigs: Rigs): GroupNode =>
  look.view === "side" ? rigs.side : look.view === "front" ? rigs.front : rigs.climber;

function fireball(f: Frame, x: number, y: number, radius: number, alpha: number): void {
  const { ctx } = f;
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, COLORS.blastCore);
  g.addColorStop(0.45, COLORS.blastMid);
  g.addColorStop(0.8, COLORS.blastEdge);
  g.addColorStop(1, COLORS.blastOut);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function swirlBall(f: Frame, x: number, y: number, radius: number, angle: number, alpha: number): void {
  const { ctx } = f;
  fireball(f, x, y, radius, alpha);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = COLORS.blastEdge;
  ctx.lineWidth = radius * BLAST.swirl;
  ctx.lineCap = "round";
  for (const [k, from, sweep] of [[0.62, 0, 1.3], [0.34, Math.PI, 1.1]] as const) {
    ctx.beginPath();
    ctx.arc(x, y, radius * k, angle + from, angle + from + Math.PI * sweep);
    ctx.stroke();
  }
  ctx.restore();
}

function vortexRing(f: Frame, x: number, y: number, age: number): void {
  const { ctx, unit } = f;
  const u = span(age, BLAST.ring[0], BLAST.ring[1]);
  if (u <= 0 || u >= 1) return;
  const angle = BLAST.spin * 1.5 * age;
  ctx.save();
  ctx.globalAlpha *= 1 - u;
  ctx.strokeStyle = COLORS.vortex;
  ctx.lineWidth = BLAST.ringWidth * (1 - u * 0.8) * unit;
  ctx.lineCap = "round";
  const radius = BLAST.ringRadius * (0.7 + 0.5 * u) * unit;
  for (let i = 0; i < 3; i++) {
    const from = angle + (i * 2 * Math.PI) / 3;
    ctx.beginPath();
    ctx.arc(x, y, radius * (1 - 0.08 * i), from, from + Math.PI * (0.55 - 0.25 * u));
    ctx.stroke();
  }
  ctx.restore();
}

function blast(f: Frame, body: Hero, age: number): void {
  const { cell, unit } = f;
  const [cx, cy] = [body.x * cell, body.y * cell + BLAST.center * unit];
  const angle = body.facing * BLAST.spin * age;
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  const pull = 1 - 0.85 * span(age, BLAST.pull[0], BLAST.pull[1]);
  const alpha = 1 - span(age, BLAST.fade[0], BLAST.fade[1]);
  FIREBALLS.forEach(([dx, dy, start, r], i) => {
    const t = age - start;
    if (t < 0 || alpha <= 0) return;
    const [ox, oy] = [body.facing * dx * BLAST.size * unit, (dy - BLAST.center) * BLAST.size * unit];
    const [x, y] = [cx + (ox * cos - oy * sin) * pull, cy + (ox * sin + oy * cos) * pull];
    const grow = Math.min(1, t / BLAST.grow) * (1 + 0.4 * (1 - pull));
    swirlBall(f, x, y, r * BLAST.size * unit * (0.3 + 0.7 * grow), angle * 1.6 + i, alpha);
  });
  vortexRing(f, cx, cy, age);
}

function scrap(f: Frame, body: Hero): void {
  const { ctx, cell, unit } = f;
  const [x, y] = [body.x * cell, body.y * cell];
  ctx.fillStyle = COLORS.scrap;
  ctx.beginPath();
  for (const [dx, dy] of SCRAP) ctx.lineTo(x + body.facing * dx * unit, y + dy * unit);
  ctx.fill();
  ctx.fillStyle = COLORS.scrapLight;
  for (const [dx, dy, w] of [[-12, -9, 6], [8, -18, 4], [20, -10, 5]] as const) ctx.fillRect(x + body.facing * dx * unit, y + dy * unit, w * unit, 2 * unit);
}

function enemyFigure(f: Frame, enemy: Enemy, look: HeroLook, rigs: Rigs, scale: number, fireRate: number): void {
  const age = enemy.deadAge;
  if (age === null || age < BLAST.hideBody) {
    shadow(f, enemy.body, look);
    heroFigure(f, enemy.body, look, rigs, scale, firing(enemy.body, fireRate), ENEMY_PALETTE);
  } else scrap(f, enemy.body);
  if (age !== null) blast(f, enemy.body, age);
}

function droppedGun(f: Frame, hero: Hero, look: HeroLook, scale: number, palette: Palette): void {
  const { ctx, cell, unit, lineW } = f;
  const ahead = DROPPED_GUN.ahead - DROPPED_GUN.slide * look.gunSlide;
  ctx.save();
  ctx.translate(hero.x * cell + hero.facing * ahead * unit, hero.y * cell - DROPPED_GUN.up * unit);
  ctx.scale(scale * hero.facing, scale);
  MODELS[look.hand].draw(ctx, { palette, lineW, simple: true });
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

function landingDust(f: Frame, hero: Hero, k: number): void {
  const { ctx, cell, unit } = f;
  star(ctx, [hero.x * cell - hero.facing * DUST.back * unit, hero.y * cell - DUST.up * unit], DUST.radius * unit, k);
}

const hitStar = (ctx: CanvasRenderingContext2D, hit: HitLook): void => star(ctx, hit.star, STAR.radius, hit.spark);

const firing = (hero: Hero, fireRate: number): boolean =>
  hero.weapon === "gun" && hero.fireTime !== null && Math.floor(hero.fireTime * fireRate) % 2 === 0;

function muzzleFlash(ctx: CanvasRenderingContext2D, look: HeroLook, rigs: Rigs): void {
  const muzzle = muzzleInRig(look, rigs);
  if (muzzle) star(ctx, [muzzle[0] + FLASH.ahead, muzzle[1]], FLASH.radius, FLASH.k);
}

function heroFigure(f: Frame, hero: Hero, look: HeroLook, rigs: Rigs, scale: number, flash: boolean, base: Palette = ROBOT.palette): void {
  const { ctx, cell, lineW } = f;
  const palette = look.tint ? shade(base, { brightness: 1 - look.tint * 0.68, saturate: 1 - look.tint * 0.7 }) : base;
  const front = look.view === "front";
  const gun: HookDraw = (c, pal) => MODELS[look.hand].hook(c, pal, { lineW, simple: true, barrel: front ? FRONT_BARREL : undefined });
  const hooks: Record<string, HookDraw> = {};
  if (look.gun === "hand") hooks[front ? "handL" : "hand"] = gun;
  if (look.gun === "dropped") droppedGun(f, hero, look, scale, palette);
  ctx.save();
  toRigSpace(ctx, hero, look, cell, scale);
  drawRig(ctx, rigFor(look, rigs), { palette, pose: look.pose, hooks, lineW, simple: true });
  if (look.gun === "slung") MODELS[look.back].slung(ctx, palette, { lineW, simple: true });
  if (flash) muzzleFlash(ctx, look, rigs);
  if (look.hit) hitStar(ctx, look.hit);
  ctx.restore();
  if (look.dust !== null) landingDust(f, hero, look.dust);
}

export const heroBehindEnemies = (hero: Hero): boolean => hero.hidden;

export function drawScene(
  ctx: CanvasRenderingContext2D,
  world: SandboxWorld,
  hero: Hero,
  look: HeroLook,
  rigs: Rigs,
  cfg: MovementConfig,
  view: ViewTransform,
  alpha: number,
  enemyLooks: HeroLook[],
  enemyRigs: Rigs,
  sight: Path2D | null = null,
  lines = 1,
  screen?: Rect,
): void {
  const scale = heroScale(cfg);
  const unit = spikeUnit(cfg);
  const f: Frame = { ctx, world, cell: cfg.cellPx, unit, lineW: unit * view.scale };
  ctx.save();
  ctx.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);
  ctx.beginPath();
  ctx.rect(0, 0, world.grid.width * f.cell, world.grid.height * f.cell);
  ctx.clip();
  drawEnvironment(ctx, world, cfg, alpha, lines, screen);
  const drawHero = (): void => {
    shadow(f, hero, look);
    heroFigure(f, hero, look, rigs, scale, firing(hero, cfg.fireRate));
  };
  const behind = heroBehindEnemies(hero);
  if (behind) drawHero();
  ctx.save();
  if (sight) ctx.clip(sight);
  world.enemies.forEach((enemy, i) => enemyFigure(f, enemy, enemyLooks[i]!, enemyRigs, scale, cfg.fireRate));
  ctx.restore();
  if (!behind) drawHero();
  if (sight) ctx.clip(sight);
  projectiles(f, alpha);
  impacts(f);
  ctx.restore();
}
