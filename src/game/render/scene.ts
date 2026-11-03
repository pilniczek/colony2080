import { span } from "../../engine/anim/keyed";
import type { ViewTransform } from "../../engine/render/view";
import { drawRig, shade, type HookDraw, type Palette } from "../../engine/rig/draw";
import type { GroupNode, Pt } from "../../engine/rig/tree";
import type { MovementConfig } from "../hero/config";
import { isDead, type Hero } from "../hero/hero";
import { SPIKE_K } from "../hero/gait";
import { heroScale, spikeUnit, type GunModel, type HeroLook, type HitLook, type Rigs } from "../hero/look";
import type { Rect } from "../geometry";
import { bodyBox, boxSeen, type Enemy } from "../level/enemy";
import { visible, type Fog } from "../fog";
import { coverClips } from "../level/cover";
import type { SandboxWorld } from "../level/sandboxLevel";
import { ASSETS } from "../env/assets";
import { BLAST, drawBlast, drawScrap, inBlastUnits } from "../env/blast";
import { drawAsset, PALETTE, TILE } from "../env/paint";
import { drawEBlaster, EBLASTER_COLORS, eblasterHook, eblasterSlung } from "../robot/eblaster";
import { drawGun, FRONT_BARREL, gunHook, gunSlung } from "../robot/gun";
import { drawToaster, TOASTER_COLORS, TOASTER_FRONT_BARREL, toasterHook, toasterSlung } from "../robot/toaster";
import type { Dying, EnemyKind, KindWeapon } from "../robot/kinds";
import { MUZZLE_IN_HOOK } from "../robot/weaponModel";
import { ROBOT } from "../robot/xbot";
import { muzzleInRig, SPARK_LIFE, toasterSight } from "../shots";
import { drawFigure, figureKey } from "./figures";
import { drawProjectiles } from "./projectiles";
import { BEAM_FRAMES, drawBeam } from "./beam";
import { drawToasterShot, drawToasterSight } from "./toasterShot";
import { drawEnvironment } from "./environment";

const DEG = Math.PI / 180;
const STAR = { radius: 14 / SPIKE_K, points: 10, inner: 0.35, outer: 0.6 };
const FLASH = { ahead: 4 / SPIKE_K, radius: 8 / SPIKE_K, k: 0.2 };
const IMPACT = { radius: 7, k: 0.3 };
const DUST = { back: 30, up: 6, radius: 18 };
const DROPPED_GUN = { ahead: 24, slide: 20, up: 9 };
const MODELS = {
  gun: { draw: drawGun, hook: gunHook, slung: gunSlung },
  blaster: { draw: drawEBlaster, hook: eblasterHook, slung: eblasterSlung },
  toaster: { draw: drawToaster, hook: toasterHook, slung: toasterSlung },
} satisfies Record<GunModel, unknown>;
const HERO_PALETTE: Palette = { ...EBLASTER_COLORS, ...TOASTER_COLORS, ...ROBOT.palette };

const FRONT_BARRELS: Record<GunModel, number> = { gun: FRONT_BARREL, blaster: FRONT_BARREL, toaster: TOASTER_FRONT_BARREL };
const LASER = { color: "#ff2a1a", width: 1, glow: 4, glowAlpha: 0.3 };
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
  if (world.bonus === "toaster") drawToasterShot(ctx, Math.abs(b.end - b.x) * TILE, b.tick, true);
  else drawBeam(ctx, Math.abs(b.end - b.x) * TILE, b.tick % BEAM_FRAMES, b.tick);
  ctx.restore();
}

const aimsToaster = (hero: Hero, look: HeroLook): boolean =>
  look.gun === "hand" && look.hand === "toaster" && !hero.hidden && !isDead(hero.state);

function toasterCross(f: Frame, hero: Hero, look: HeroLook, rigs: Rigs, cfg: MovementConfig): void {
  const { ctx, world, cell } = f;
  if (!aimsToaster(hero, look)) return;
  const { y, end } = toasterSight(world, hero, look, rigs, cfg);
  const k = cell / TILE;
  ctx.save();
  ctx.translate(end * cell, y * cell);
  ctx.scale(k, k);
  drawToasterSight(ctx, world.beam !== null, true);
  ctx.restore();
}

function impacts(f: Frame): void {
  const { ctx, world, cell, unit } = f;
  for (const s of world.sparks) star(ctx, [s.x * cell, s.y * cell], IMPACT.radius * unit, IMPACT.k + (1 - IMPACT.k) * (s.age / SPARK_LIFE));
}

export const castsShadow = (hero: Hero, look: HeroLook): boolean => hero.onGround && look.view !== "back";

export const feetSeen = (fog: Fog | null, body: Pick<Hero, "x" | "y">): boolean => !fog || visible(fog, body.x, body.y - 0.001);

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

const fireOf = (body: Hero): number | null => (body.state === "attack" ? body.fireTime : null);

function laserFrom(f: Frame, body: Hero, look: HeroLook, kind: EnemyKind, scale: number): Pt | null {
  if (!kind.laser || fireOf(body) === null) return null;
  const { ctx } = f;
  const world = ctx.getTransform().inverse();
  ctx.save();
  toRigSpace(ctx, body, look, f.cell, scale);
  const local = muzzleInRig(look, kind.rigs, kind.laser);
  const at = local && world.multiply(ctx.getTransform()).transformPoint(new DOMPoint(local[0], local[1]));
  ctx.restore();
  return at ? [at.x, at.y] : null;
}

function dyingLook(body: Hero, look: HeroLook, dying: Dying, age: number): [Hero, HeroLook] {
  const k = Math.min(1, age / dying.seconds);
  return [{ ...body, x: body.x - body.facing * dying.back * k, y: body.y - dying.up * k }, { ...look, pose: { ...look.pose, ...dying.pose } }];
}

function enemyFigure(f: Frame, enemy: Enemy, look: HeroLook, kind: EnemyKind, scale: number, fireRate: number): Pt | null {
  if (enemy.flight) {
    flyerFigure(f, enemy);
    return null;
  }
  const age = enemy.deadAge;
  const alive = age === null || age < BLAST.hideBody;
  const [body, pose] = age !== null && kind.dying ? dyingLook(enemy.body, look, kind.dying, age) : [enemy.body, look];
  if (alive) {
    if (feetSeen(f.world.fog, enemy.body)) shadow(f, enemy.body, look);
    const flash = !!kind.muzzle && firing(enemy.body, fireRate);
    const fire = fireOf(enemy.body);
    heroFigure(f, body, pose, kind.rigs, scale, flash, kind.palette, kind.hooks?.(pose, f.lineW, fire), kind.muzzle, kind.weapon, kind.hooks && fire !== null ? null : kind);
  } else if (!kind.dying) scrap(f, enemy.body);
  if (age !== null) blast(f, body, age);
  return alive && age === null ? laserFrom(f, enemy.body, look, kind, scale) : null;
}

function lasers(f: Frame, from: Pt[], hero: Hero, height: number): void {
  const { ctx, cell, unit } = f;
  const to: Pt = [hero.x * cell, (hero.y - height * 0.6) * cell];
  ctx.save();
  ctx.strokeStyle = LASER.color;
  ctx.lineCap = "round";
  for (const [x, y] of from) {
    ctx.globalAlpha = LASER.glowAlpha;
    ctx.lineWidth = LASER.glow * unit;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(...to);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = LASER.width * unit;
    ctx.stroke();
  }
  ctx.restore();
}

function droppedGun(f: Frame, hero: Hero, look: HeroLook, scale: number, palette: Palette, weapon: KindWeapon): void {
  const { ctx, cell, unit, lineW } = f;
  const ahead = DROPPED_GUN.ahead - DROPPED_GUN.slide * look.gunSlide;
  ctx.save();
  ctx.translate(hero.x * cell + hero.facing * ahead * unit, hero.y * cell - DROPPED_GUN.up * unit);
  ctx.scale(scale * hero.facing, scale);
  weapon.draw(ctx, { palette, lineW, simple: true });
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

function muzzleFlash(ctx: CanvasRenderingContext2D, look: HeroLook, rigs: Rigs, local: Pt): void {
  const muzzle = muzzleInRig(look, rigs, local);
  if (muzzle) star(ctx, [muzzle[0] + FLASH.ahead, muzzle[1]], FLASH.radius, FLASH.k);
}

export function weaponHooks(look: HeroLook, lineW: number): Record<string, HookDraw> {
  const front = look.view === "front";
  const hooks: Record<string, HookDraw> = {};
  if (look.gun === "hand") hooks[front ? "handL" : "hand"] = (c, pal) => MODELS[look.hand].hook(c, pal, { lineW, simple: true, barrel: front ? FRONT_BARRELS[look.hand] : undefined });
  return hooks;
}

function heroFigure(
  f: Frame,
  hero: Hero,
  look: HeroLook,
  rigs: Rigs,
  scale: number,
  flash: boolean,
  base: Palette = HERO_PALETTE,
  hooks: Record<string, HookDraw> = weaponHooks(look, f.lineW),
  muzzle: Pt = MUZZLE_IN_HOOK,
  weapon: KindWeapon = MODELS[look.hand],
  owner: object | null = rigs,
): void {
  const { ctx, cell, lineW } = f;
  const palette = look.tint ? shade(base, { brightness: 1 - look.tint * 0.68, saturate: 1 - look.tint * 0.7 }) : base;
  if (look.gun === "dropped") droppedGun(f, hero, look, scale, palette, weapon);
  ctx.save();
  toRigSpace(ctx, hero, look, cell, scale);
  const rig = rigFor(look, rigs);
  const key = owner && !look.hit ? figureKey([owner, rig, palette], look.pose, `${look.gun}${look.hand}${lineW}`) : null;
  drawFigure(ctx, key, (c) => {
    drawRig(c, rig, { palette, pose: look.pose, hooks, lineW, simple: true });
    if (look.gun === "slung") weapon.slung(c, palette, { lineW, simple: true });
  });
  if (flash) muzzleFlash(ctx, look, rigs, muzzle);
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
  kind: EnemyKind;
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
  sight: Path2D | null = null,
  lines = 1,
  screen?: Rect,
  veil: () => void = () => {},
  back?: CanvasRenderingContext2D,
): void {
  const scale = heroScale(cfg);
  const unit = spikeUnit(cfg);
  const f: Frame = { ctx, world, cell: cfg.cellPx, unit, lineW: unit * view.scale * ROBOT.gameLine, lines };
  const inWorld = (c: CanvasRenderingContext2D): void => {
    c.save();
    c.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);
    c.beginPath();
    c.rect(0, 0, world.grid.width * f.cell, world.grid.height * f.cell);
    c.clip();
  };
  if (back) {
    inWorld(back);
    drawEnvironment(back, world, hero, cfg, alpha, lines, screen, false);
    back.restore();
  }
  inWorld(ctx);
  if (!back) drawEnvironment(ctx, world, hero, cfg, alpha, lines, screen);
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
  const lasing = enemyViews
    .filter(({ enemy }) => boxSeen(world.fog, bodyBox(enemy, cfg.box)))
    .map(({ enemy, look: enemyLook, kind }) => enemyFigure(f, enemy, enemyLook, kind, scale, cfg.fireRate))
    .filter((p): p is Pt => p !== null);
  if (!behind) drawHero();
  if (sight) ctx.clip(sight);
  lasers(f, lasing, hero, cfg.box.height);
  drawProjectiles(ctx, world.projectiles, f.cell, f.unit);
  beam(f);
  toasterCross(f, hero, look, rigs, cfg);
  impacts(f);
  ctx.restore();
}
