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
import { createRigs, heroLook, type Rigs } from "../hero/look";
import type { Enemy } from "../level/enemy";
import type { SandboxWorld } from "../level/sandboxLevel";
import { holdPoses, type HoldPoses } from "../robot/gun";
import { kindOf } from "../robot/kinds";
import { askTiles, mapTiles } from "./environment";
import { drawFog, seenPath } from "./fog";
import type { FogLayer, MapLayer } from "./gl";
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
}

export interface Target {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  gl: { back: CanvasRenderingContext2D; map: MapLayer; fog: FogLayer } | null;
}

export function createKit(): Kit {
  const rigs = createRigs(true);
  return { rigs, hold: holdPoses(rigs.side, rigs.front) };
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

function paintGame(target: Target, world: SandboxWorld, s: GameFrame, kit: Kit, { cfg, clips }: Tune, over?: Over): void {
  const { ctx, gl } = target;
  const look = heroLook(s.hero, clips, kit.rigs, kit.hold, cfg);
  const enemies = s.enemies.map((enemy) => {
    const kind = kindOf(enemy.kind);
    return { enemy, look: heroLook(enemy.body, kind.clips ? { ...clips, ...kind.clips } : clips, kind.rigs, kind.hold, cfg), kind };
  });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (gl) {
    ctx.clearRect(0, 0, target.w, target.h);
    gl.back.setTransform(1, 0, 0, 1, 0, 0);
    gl.back.clearRect(0, 0, target.w, target.h);
    clipTo(gl.back, s.window);
    gl.map.draw(mapTiles(world, cfg, s.lines, s.view, s.window), s.window, { x: s.view.offsetX, y: s.view.offsetY, w: world.grid.width * cfg.cellPx * s.view.scale, h: world.grid.height * cfg.cellPx * s.view.scale });
    gl.fog.draw(world.fog, s.view, cfg.cellPx, s.window, s.span ?? undefined);
  } else fillBlack(target);
  clipTo(ctx, s.window);
  const sight = world.fog && seenPath(world.fog, cfg.cellPx);
  const veil = (): void => {
    if (!gl && world.fog) drawFog(ctx, world.fog, s.view, cfg.cellPx, s.window, s.span ?? undefined);
  };
  drawScene(ctx, world, s.hero, look, kit.rigs, cfg, s.view, s.alpha, enemies, sight, s.lines, s.window, veil, gl?.back);
  drawOverlays(ctx, world, s.hero, look, kit.rigs, cfg, s.view, s.overlays, [s.window.x, s.window.y], s.lines);
  over?.(ctx, s.view, cfg.cellPx);
  if (s.map) drawMap(ctx, world, s.hero, cfg.box.height, s.window, s.map.coords);
  ctx.restore();
  gl?.back.restore();
}

export type Over = (ctx: CanvasRenderingContext2D, view: ViewTransform, cellPx: number) => void;

export function paintFrame(target: Target, world: SandboxWorld, state: FrameState, kit: Kit, tune: Tune, over?: Over): void {
  if (state.kind === "game") paintGame(target, world, state, kit, tune, over);
  else if (state.kind === "film") paintFilm(target, world, state, tune);
  else fillBlack(target);
}
