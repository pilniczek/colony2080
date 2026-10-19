import { FIXED_STEP } from "../../engine/loop";
import { ASSETS, type AssetId } from "../env/assets";
import { drawAsset, TILE, type Size } from "../env/paint";
import type { MovementConfig } from "../hero/config";
import { RUNG, spikeUnit } from "../hero/look";
import type { Rect } from "../hud/layout";
import { ITEMS } from "../items";
import type { Lift, Prop, SandboxWorld, Scenery } from "../level/sandboxLevel";
import { TileCache, TILE_PX, visibleTiles } from "./tiles";

const SKY_H = 170;
const SKY_W = 320;
const LIFT_HEAD = 32;
const LADDER_W = 56;
const HAZE = "rgba(26, 12, 8, 0.45)";

const PROP_ASSETS: Record<string, AssetId> = { crate: "crate", barrel: "barrel", panel: "switchboard" };

const TILE_MARGIN = 1;
const PREFETCH_PER_FRAME = 1;

const layers = new WeakMap<SandboxWorld, Record<string, TileCache<HTMLCanvasElement>>>();

interface Env {
  ctx: CanvasRenderingContext2D;
  world: SandboxWorld;
  cell: number;
  unit: number;
  lines: number;
  screen: Rect;
}

function place(e: Env, id: AssetId, x: number, y: number, scale: number, state = 0, size?: Size): void {
  const { ctx } = e;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  drawAsset(ctx, ASSETS[id], { state, t: 0, lod: true, lines: e.lines, size });
  ctx.restore();
}

const k = (e: Env): number => e.cell / TILE;

const put = (e: Env, id: AssetId, x: number, y: number, state = 0, size?: Size): void => place(e, id, x, y, k(e), state, size);

const px = (e: Env, size: number): number => size / k(e);

function sky(e: Env): void {
  const { world, cell } = e;
  const h = world.grid.height * cell;
  const scale = h / SKY_H;
  for (let x = 0; x < world.grid.width * cell; x += SKY_W * scale) place(e, world.sky, x, h, scale);
}

function haze(e: Env): void {
  const { ctx, world, cell } = e;
  ctx.fillStyle = HAZE;
  ctx.fillRect(0, 0, world.grid.width * cell, world.grid.height * cell);
}

function render(e: Env, scale: number, paint: (off: Env) => void, size: { w: number; h: number }, col: number, row: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(TILE_PX, size.w - col * TILE_PX);
  canvas.height = Math.min(TILE_PX, size.h - row * TILE_PX);
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.translate(-col * TILE_PX, -row * TILE_PX);
  ctx.scale(scale, scale);
  paint({ ...e, ctx });
  return canvas;
}

function cached(e: Env, name: string, paint: (off: Env) => void): void {
  const { ctx, world, cell, unit, lines, screen } = e;
  const t = ctx.getTransform();
  const scale = Math.hypot(t.a, t.b);
  const x = Math.round(t.e);
  const y = Math.round(t.f);
  const size = { w: Math.ceil(world.grid.width * cell * scale), h: Math.ceil(world.grid.height * cell * scale) };
  const own = layers.get(world) ?? {};
  layers.set(world, own);
  const cache = (own[name] ??= new TileCache());
  const view = { x: screen.x - x, y: screen.y - y, w: screen.w, h: screen.h };
  const ahead = { tiles: visibleTiles(view, TILE_PX, TILE_MARGIN, size), budget: PREFETCH_PER_FRAME };
  const key = `${scale}|${lines}|${cell}|${unit}`;
  const make = (col: number, row: number): HTMLCanvasElement => render(e, scale, paint, size, col, row);
  const tiles = cache.sync(key, visibleTiles(view, TILE_PX, 0, size), make, ahead);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, x, y);
  for (const [col, row, canvas] of tiles) ctx.drawImage(canvas, col * TILE_PX, row * TILE_PX);
  ctx.restore();
}

function below(e: Env): void {
  sky(e);
  scenery(e, e.world.backdrop);
  haze(e);
  terrain(e);
}

function above(e: Env): void {
  ladders(e);
  scenery(e, e.world.dressing);
}

function scenery(e: Env, items: Scenery[]): void {
  for (const s of items) put(e, s.asset, s.x * e.cell, (s.y ?? e.world.spawn[1]) * e.cell, s.state ?? 0);
}

function terrain(e: Env): void {
  const { cell } = e;
  const { walls, ledges, girders } = e.world.terrain;
  for (const r of walls) put(e, "brickWall", r.col * cell, (r.row + r.h) * cell, 0, { w: px(e, r.w * cell), h: px(e, r.h * cell) });
  for (const r of ledges) put(e, "streetWalkway", r.col * cell, r.row * cell, 0, { w: px(e, r.w * cell) });
  for (const r of girders) put(e, "girderBridge", r.col * cell, (r.row + 1) * cell, 0, { w: px(e, r.w * cell) });
}

function lift(e: Env, l: Lift, alpha: number): void {
  const { cell } = e;
  const y = (l.y - l.vy * (1 - alpha) * FIXED_STEP) * cell;
  const size = { w: px(e, l.w * cell), top: px(e, (l.top - l.bottom) * cell - LIFT_HEAD), py: px(e, y - l.bottom * cell) };
  put(e, "lift", l.x * cell, l.bottom * cell, 0, size);
}

function ladders(e: Env): void {
  const { cell, unit } = e;
  const { grid } = e.world;
  for (let col = 0; col < grid.width; col++) {
    for (let row = 0; row < grid.height; row++) {
      if (!grid.ladderTop(col, row)) continue;
      let end = row;
      while (grid.at(col, end) === "H") end++;
      const size = { h: px(e, (end - row) * cell), w: px(e, LADDER_W * unit), rung: px(e, RUNG * unit) };
      put(e, "ladder", (col + 0.5) * cell - (LADDER_W / 2) * unit, end * cell, 0, size);
    }
  }
}

function prop(e: Env, p: Prop): void {
  const icon = p.kind === "item" && !p.taken ? ITEMS[p.item!]!.icon : null;
  const id = p.kind === "item" ? icon?.asset : PROP_ASSETS[p.kind];
  if (!id) return;
  const [left, , right] = ASSETS[id].box;
  put(e, id, p.x * e.cell - ((left + right) / 2) * k(e), (p.y ?? e.world.spawn[1]) * e.cell, icon?.state ?? (p.kind === "panel" && p.on ? 1 : 0));
}

export function drawEnvironment(
  ctx: CanvasRenderingContext2D,
  world: SandboxWorld,
  cfg: MovementConfig,
  alpha: number,
  lines: number,
  screen: Rect = { x: 0, y: 0, w: ctx.canvas.width, h: ctx.canvas.height },
): void {
  const e: Env = { ctx, world, cell: cfg.cellPx, unit: spikeUnit(cfg), lines, screen };
  cached(e, "below", below);
  for (const l of e.world.lifts) lift(e, l, alpha);
  cached(e, "above", above);
  for (const p of world.props) prop(e, p);
}
