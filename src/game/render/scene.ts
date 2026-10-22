import { span } from "../../engine/anim/keyed";
import type { ViewTransform } from "../../engine/render/view";
import { drawRig, shade, type HookDraw, type Palette } from "../../engine/rig/draw";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import type { MovementConfig } from "../hero/config";
import { isDead, type Hero } from "../hero/hero";
import { SPIKE_K } from "../hero/gait";
import { heroScale, spikeUnit, type GunModel, type HeroLook, type HitLook, type Rigs } from "../hero/look";
import type { Rect } from "../geometry";
import { bodyBox, type BodyBox, type Enemy } from "../level/enemy";
import { seenAt, visible, type Fog } from "../fog";
import { coverClips } from "../level/cover";
import type { SandboxWorld } from "../level/sandboxLevel";
import { ASSETS } from "../env/assets";
import { BLAST, drawBlast, drawScrap, inBlastUnits } from "../env/blast";
import { drawAsset, PALETTE, TILE } from "../env/paint";
import { drawEBlaster, eblasterHook, eblasterSlung } from "../robot/eblaster";
import { drawGun, FRONT_BARREL, gunHook, gunSlung } from "../robot/gun";
import { ROBOT } from "../robot/xbot";
import { muzzleInRig, SPARK_LIFE } from "../shots";
import { BEAM_FRAMES, drawBeam } from "./beam";
import { drawEnvironment } from "./environment";

const DEG = Math.PI / 180;
const STAR = { radius: 14 / SPIKE_K, points: 10, inner: 0.35, outer: 0.6 };
const FLASH = { ahead: 4 / SPIKE_K, radius: 8 / SPIKE_K, k: 0.2 };
const IMPACT = { radius: 7, k: 0.3 };
const DUST = { back: 30, up: 6, radius: 18 };
const DROPPED_GUN = { ahead: 24, slide: 20, up: 9 };
const ENEMY_PALETTE: Palette = { ...shade(ROBOT.palette, { brightness: 1.1, saturate: 0 }), visor: ROBOT.palette.visor! };
const MODELS = {
  gun: { draw: drawGun, hook: gunHook, slung: gunSlung },
  blaster: { draw: drawEBlaster, hook: eblasterHook, slung: eblasterSlung },
} satisfies Record<GunModel, unknown>;
const FLYER_HIT = { flash: 0.25, glow: 0.6, steps: 16 };

const COLORS = {
  spark: "#ffd76a",
};

interface Frame {
  ctx: CanvasRenderingContext2D;
  world: SandboxWorld;
  cell: number;
  unit: number;
  lineW: number;
  lines: number;
}

function beam(f: Frame): void {
  const { ctx, world, cell } = f;
  const b = world.beam;
  if (!b) return;
  const k = cell / TILE;
  ctx.save();
  ctx.translate(b.x * cell, b.y * cell);
  ctx.scale(b.facing * k, k);
  drawBeam(ctx, Math.abs(b.end - b.x) * TILE, b.tick % BEAM_FRAMES, b.tick);
  ctx.restore();
}

function impacts(f: Frame): void {
  const { ctx, world, cell, unit } = f;
  for (const s of world.sparks) star(ctx, [s.x * cell, s.y * cell], IMPACT.radius * unit, IMPACT.k + (1 - IMPACT.k) * (s.age / SPARK_LIFE));
}

export const castsShadow = (hero: Hero, look: HeroLook): boolean => hero.onGround && look.view !== "back";

export const feetSeen = (fog: Fog | null, body: Pick<Hero, "x" | "y">): boolean => !fog || visible(fog, body.x, body.y - 0.001);

export function boxSeen(fog: Fog | null, box: BodyBox): boolean {
  if (!fog) return true;
  for (let row = Math.floor(box.top); row < box.bottom; row++)
    for (let col = Math.floor(box.left); col < box.right; col++) if (seenAt(fog, col, row)) return true;
  return false;
}

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

function blast(f: Frame, body: Hero, age: number, centered = false): void {
  const { ctx, cell, unit } = f;
  inBlastUnits(ctx, body.x * cell, body.y * cell - (centered ? BLAST.center * unit : 0), unit, () => drawBlast(ctx, age, body.facing));
}

function scrap(f: Frame, body: Hero): void {
  const { ctx, cell, unit } = f;
  inBlastUnits(ctx, body.x * cell, body.y * cell, unit, () => drawScrap(ctx, body.facing));
}

function flyerFigure(f: Frame, { body, flight, deadAge }: Enemy): void {
  const { ctx, cell, lines } = f;
  if (deadAge === null || deadAge < BLAST.hideBody) {
    const k = cell / TILE;
    ctx.save();
    ctx.translate(body.x * cell, body.y * cell);
    ctx.scale(body.facing * k, k);
    const flash = body.hitAge === null ? 0 : Math.round((1 - span(body.hitAge, 0, FLYER_HIT.flash)) * FLYER_HIT.steps) / FLYER_HIT.steps;
    const palette = flash > 0 ? shade(PALETTE, { brightness: 1 + flash * FLYER_HIT.glow, saturate: 1 + flash }) : PALETTE;
    const fire = body.fireTime;
    drawAsset(ctx, ASSETS.flyer, { state: fire === null ? 0 : 1, t: fire ?? flight?.clock ?? 0, lod: true, lines, palette });
    ctx.restore();
  }
  if (deadAge !== null) blast(f, body, deadAge, true);
}

function enemyFigure(f: Frame, enemy: Enemy, look: HeroLook, rigs: Rigs, scale: number, fireRate: number): void {
  if (enemy.flight) return flyerFigure(f, enemy);
  const age = enemy.deadAge;
  if (age === null || age < BLAST.hideBody) {
    if (feetSeen(f.world.fog, enemy.body)) shadow(f, enemy.body, look);
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

export function weaponHooks(look: HeroLook, lineW: number): Record<string, HookDraw> {
  const front = look.view === "front";
  const hooks: Record<string, HookDraw> = {};
  if (look.gun === "hand") hooks[front ? "handL" : "hand"] = (c, pal) => MODELS[look.hand].hook(c, pal, { lineW, simple: true, barrel: front ? FRONT_BARREL : undefined });
  return hooks;
}

function heroFigure(f: Frame, hero: Hero, look: HeroLook, rigs: Rigs, scale: number, flash: boolean, base: Palette = ROBOT.palette): void {
  const { ctx, cell, lineW } = f;
  const palette = look.tint ? shade(base, { brightness: 1 - look.tint * 0.68, saturate: 1 - look.tint * 0.7 }) : base;
  const hooks = weaponHooks(look, lineW);
  if (look.gun === "dropped") droppedGun(f, hero, look, scale, palette);
  ctx.save();
  toRigSpace(ctx, hero, look, cell, scale);
  drawRig(ctx, rigFor(look, rigs), { palette, pose: look.pose, hooks, lineW, simple: true });
  if (look.gun === "slung") MODELS[look.hand].slung(ctx, palette, { lineW, simple: true });
  if (flash) muzzleFlash(ctx, look, rigs);
  if (look.hit) hitStar(ctx, look.hit);
  ctx.restore();
  if (look.dust !== null) landingDust(f, hero, look.dust);
}

const SHADOW_ROW = 0.2;

export const heroBehindEnemies = (hero: Hero): boolean => hero.hidden;

export const viewCells = (view: ViewTransform, screen: Rect, cell: number): Rect => {
  const unit = view.scale * cell;
  return { x: (screen.x - view.offsetX) / unit, y: (screen.y - view.offsetY) / unit, w: screen.w / unit, h: screen.h / unit };
};

export const visibleEnemies = (enemies: Enemy[], view: Rect, margin: number): Enemy[] =>
  enemies.filter(
    ({ body }) =>
      body.x >= view.x - margin && body.x <= view.x + view.w + margin && body.y >= view.y - margin && body.y <= view.y + view.h + margin,
  );

export interface EnemyView {
  enemy: Enemy;
  look: HeroLook;
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
  enemyViews: EnemyView[],
  enemyRigs: Rigs,
  sight: Path2D | null = null,
  lines = 1,
  screen?: Rect,
  veil: () => void = () => {},
): void {
  const scale = heroScale(cfg);
  const unit = spikeUnit(cfg);
  const f: Frame = { ctx, world, cell: cfg.cellPx, unit, lineW: unit * view.scale * ROBOT.gameLine, lines };
  ctx.save();
  ctx.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);
  ctx.beginPath();
  ctx.rect(0, 0, world.grid.width * f.cell, world.grid.height * f.cell);
  ctx.clip();
  drawEnvironment(ctx, world, hero, cfg, alpha, lines, screen);
  veil();
  const drawHero = (): void => {
    const clips = coverClips(world.props, hero.x, hero.y);
    ctx.save();
    if (clips.length) {
      ctx.beginPath();
      ctx.rect(0, 0, world.grid.width * f.cell, world.grid.height * f.cell);
      for (const c of clips) ctx.rect(c.x[0] * f.cell, c.top * f.cell, (c.x[1] - c.x[0]) * f.cell, (c.floor + SHADOW_ROW - c.top) * f.cell);
      ctx.clip("evenodd");
    }
    shadow(f, hero, look);
    heroFigure(f, hero, look, rigs, scale, firing(hero, cfg.fireRate));
    if (isDead(hero.state)) blast(f, hero, hero.time);
    ctx.restore();
  };
  const behind = heroBehindEnemies(hero);
  if (behind) drawHero();
  enemyViews
    .filter(({ enemy }) => boxSeen(world.fog, bodyBox(enemy, cfg.box)))
    .forEach(({ enemy, look: enemyLook }) => enemyFigure(f, enemy, enemyLook, enemyRigs, scale, cfg.fireRate));
  if (!behind) drawHero();
  if (sight) ctx.clip(sight);
  beam(f);
  impacts(f);
  ctx.restore();
}
