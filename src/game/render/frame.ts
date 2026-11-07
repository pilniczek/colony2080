import type { ViewTransform } from "../../engine/render/view";
import { filmOf, loadFilm, type CutsceneId } from "../cutscene";
import { lookAt } from "../cutscene/looks";
import { drawRobotView } from "../cutscene/robotView";
import { drawSecurityCam } from "../cutscene/securityCam";
import { drawSkipHint } from "../cutscene/skipHint";
import type { SightSpan } from "../fog";
import type { Rect } from "../geometry";
import type { ClipSet, MovementConfig } from "../hero/config";
import type { Hero } from "../hero/hero";
import { createRigs, heroLook, type HeroLook, type Rigs } from "../hero/look";
import type { Enemy } from "../level/enemy";
import type { BonusWeapon, SandboxWorld } from "../level/sandboxLevel";
import { heroHolds, type HoldPoses } from "../robot/gun";
import { TOASTER_WEAPON } from "../robot/toaster";
import { FLAMETHROWER_WEAPON } from "../robot/flamethrower";
import { kindOf } from "../robot/kinds";
import { askTiles } from "./environment";
import { drawFog, seenPath } from "./fog";
import { drawMap } from "./map";
import { drawOverlays, type OverlayFlags } from "./overlays";
import { drawScene } from "./scene";

export interface GameFrame {
  kind: "game";
  alpha: number;
  hero: Hero;
  enemies: Enemy[];
  view: ViewTransform;
  window: Rect;
  lines: number;
  span: SightSpan | null;
  overlays: OverlayFlags;
  map: { coords: boolean } | null;
}

export interface FilmFrame {
  kind: "film";
  id: CutsceneId;
  t: number;
  width: number;
  skip: string;
  ask: { view: ViewTransform; window: Rect; lines: number };
}

export type FrameState = GameFrame | FilmFrame | { kind: "black" };

export interface Tune {
  cfg: MovementConfig;
  clips: ClipSet;
}

export interface Kit {
  rigs: Rigs;
  hold: HoldPoses;
  bonusHolds: Record<OwnHold, HoldPoses>;
}

type OwnHold = Exclude<BonusWeapon, "blaster">;

export function bonusLook(world: SandboxWorld, hero: Hero, look: (hold: HoldPoses) => HeroLook, kit: Pick<Kit, "hold" | "bonusHolds">): HeroLook {
  const { bonus } = world;
  if (bonus === "blaster") return look(kit.hold);
  const seen = look(hero.weapon === "blaster" ? kit.bonusHolds[bonus] : kit.hold);
  return seen.hand === "blaster" ? { ...seen, hand: bonus } : seen;
}

export interface Target {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
}

export function createKit(): Kit {
  const rigs = createRigs(true);
  return { rigs, hold: heroHolds(rigs.side, rigs.front), bonusHolds: { toaster: heroHolds(rigs.side, rigs.front, TOASTER_WEAPON), flamethrower: heroHolds(rigs.side, rigs.front, FLAMETHROWER_WEAPON) } };
}

function fillBlack({ ctx, w, h }: Target): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
}

function paintFilm(target: Target, world: SandboxWorld, { id, t, width, skip, ask }: FilmFrame, { cfg }: Tune): void {
  fillBlack(target);
  askTiles(world, cfg, ask.lines, ask.view, ask.window);
  const film = filmOf(id);
  if (!film) {
    void loadFilm(id);
    return;
  }
  const { ctx, h } = target;
  film.render(ctx, width, h, t);
  if (lookAt(id, t) === "robot") drawRobotView(ctx, width, h, t);
  else drawSecurityCam(ctx, width, h, t, film.camera);
  drawSkipHint(ctx, width, h, skip);
}

const clipTo = (ctx: CanvasRenderingContext2D, { x, y, w, h }: Rect): void => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
};

export const ENEMY_POSE_HZ = 60;

const atPoseRate = (body: Hero): Hero => ({
  ...body,
  time: Math.floor(body.time * ENEMY_POSE_HZ) / ENEMY_POSE_HZ,
  gaitTime: Math.floor(body.gaitTime * ENEMY_POSE_HZ) / ENEMY_POSE_HZ,
});

function paintGame(target: Target, world: SandboxWorld, s: GameFrame, kit: Kit, { cfg, clips }: Tune, over?: Over): void {
  const { ctx } = target;
  const look = bonusLook(world, s.hero, (hold) => heroLook(s.hero, clips, kit.rigs, hold, cfg), kit);
  const enemies = s.enemies.map((enemy) => {
    const kind = kindOf(enemy.kind);
    return { enemy, look: heroLook(atPoseRate(enemy.body), kind.clips ? { ...clips, ...kind.clips } : clips, kind.rigs, kind.hold, cfg), kind };
  });
  fillBlack(target);
  clipTo(ctx, s.window);
  const sight = world.fog && seenPath(world.fog, cfg.cellPx);
  const veil = (): void => {
    if (world.fog) drawFog(ctx, world.fog, s.view, cfg.cellPx, s.window, s.span ?? undefined);
  };
  drawScene(ctx, world, s.hero, look, kit.rigs, cfg, s.view, s.alpha, enemies, sight, s.lines, s.window, veil);
  drawOverlays(ctx, world, s.hero, look, kit.rigs, cfg, s.view, s.overlays, [s.window.x, s.window.y], s.lines);
  over?.(ctx, s.view, cfg.cellPx);
  if (s.map) drawMap(ctx, world, s.hero, cfg.box.height, s.window, s.map.coords);
  ctx.restore();
}

export type Over = (ctx: CanvasRenderingContext2D, view: ViewTransform, cellPx: number) => void;

export function paintFrame(target: Target, world: SandboxWorld, state: FrameState, kit: Kit, tune: Tune, over?: Over): void {
  if (state.kind === "game") paintGame(target, world, state, kit, tune, over);
  else if (state.kind === "film") paintFilm(target, world, state, tune);
  else fillBlack(target);
}
