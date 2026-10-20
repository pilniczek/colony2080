import { FIXED_STEP } from "../../engine/loop";
import { ASSETS, type AssetId } from "../env/assets";
import { drawAsset, TILE, type Size } from "../env/paint";
import { guardHidden, guardLook } from "../level/guards";
import type { MovementConfig } from "../hero/config";
import type { Hero } from "../hero/hero";
import { RUNG, spikeUnit } from "../hero/look";
import type { Rect } from "../geometry";
import { ITEMS } from "../items";
import type { Rect as CellRect, Run } from "../level/terrain";
import { onGround, type Lift, type Prop, type SandboxWorld, type Scenery } from "../level/sandboxLevel";
import { nearestFirst, TileCache, TILE_PX, visibleTiles } from "./tiles";

const SKY_H = 170;
const SKY_W = 320;
const LIFT_HEAD = 32;
const LADDER_W = 56;
const HAZE = "rgba(26, 12, 8, 0.45)";

const PROP_ASSETS: Record<string, AssetId> = { crate: "crate", barrel: "barrel", panel: "switchboard", weapon: "eBlaster" };


const TILE_MARGIN = 1;
const PREFETCH_PER_FRAME = 1;
const DROPPED_KEPT = 40;
const CULL_PAD_CELLS = 1;

const layers = new WeakMap<SandboxWorld, Record<string, TileCache<HTMLCanvasElement>>>();

type Lookup = (col: number, row: number) => readonly unknown[];

const indexes = new WeakMap<SandboxWorld, { key: string; lookups: Map<string, Lookup> }>();

interface LadderRun {
  col: number;
  row: number;
  end: number;
}

const ladderRuns = new WeakMap<SandboxWorld, LadderRun[]>();

export interface Env {
  ctx: CanvasRenderingContext2D;
  world: SandboxWorld;
  hero: Pick<Hero, "blaster">;
  cell: number;
  unit: number;
  lines: number;
  screen: Rect;
  clip?: Rect;
  tile?: { col: number; row: number; px: number };
}

export function bucketByTile<T>(items: readonly T[], boxOf: (item: T) => Rect, tilePx: number): (col: number, row: number) => T[] {
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const { x, y, w, h } = boxOf(item);
    for (let row = Math.floor(y / tilePx); row <= Math.floor((y + h) / tilePx); row++) {
      for (let col = Math.floor(x / tilePx); col <= Math.floor((x + w) / tilePx); col++) {
        const id = `${col},${row}`;
        const bucket = buckets.get(id);
        if (bucket) bucket.push(item);
        else buckets.set(id, [item]);
      }
    }
  }
  return (col, row) => buckets.get(`${col},${row}`) ?? [];
}

function pick<T>(e: Env, name: string, items: readonly T[], boxOf: (e: Env, item: T) => Rect): readonly T[] {
  const { tile, world, cell } = e;
  if (!tile) return items;
  const key = `${cell}|${tile.px}`;
  let own = indexes.get(world);
  if (own?.key !== key) {
    own = { key, lookups: new Map() };
    indexes.set(world, own);
  }
  let lookup = own.lookups.get(name);
  if (!lookup) {
    const pad = CULL_PAD_CELLS * cell + 1;
    lookup = bucketByTile(items, (item) => {
      const { x, y, w, h } = boxOf(e, item);
      return { x: x - pad, y: y - pad, w: w + 2 * pad, h: h + 2 * pad };
    }, tile.px);
    own.lookups.set(name, lookup);
  }
  return lookup(tile.col, tile.row) as readonly T[];
}

const near = (e: Env, { x, y, w, h }: Rect): boolean => {
  const { clip } = e;
  const pad = CULL_PAD_CELLS * e.cell;
  return !clip || (x - pad < clip.x + clip.w && x + w + pad > clip.x && y - pad < clip.y + clip.h && y + h + pad > clip.y);
};

const columns = (e: Env, step: number, count: number): [number, number] => {
  const { clip } = e;
  if (!clip) return [0, count];
  const pad = CULL_PAD_CELLS * e.cell;
  return [Math.max(0, Math.floor((clip.x - pad) / step)), Math.min(count, Math.ceil((clip.x + clip.w + pad) / step))];
};

function place(e: Env, id: AssetId, x: number, y: number, scale: number, state = 0, size?: Size, t = 0): void {
  const { ctx } = e;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  drawAsset(ctx, ASSETS[id], { state, t, lod: true, lines: e.lines, size });
  ctx.restore();
}

const k = (e: Env): number => e.cell / TILE;

const put = (e: Env, id: AssetId, x: number, y: number, state = 0, size?: Size, t = 0): void => place(e, id, x, y, k(e), state, size, t);

const px = (e: Env, size: number): number => size / k(e);

function sky(e: Env): void {
  const { world, cell } = e;
  const h = world.grid.height * cell;
  const scale = h / SKY_H;
  const step = SKY_W * scale;
  const [from, to] = columns(e, step, Math.ceil((world.grid.width * cell) / step));
  for (let i = from; i < to; i++) place(e, world.sky, i * step, h, scale);
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
  const clip = { x: (col * TILE_PX) / scale, y: (row * TILE_PX) / scale, w: canvas.width / scale, h: canvas.height / scale };
  paint({ ...e, ctx, clip, tile: { col, row, px: TILE_PX / scale } });
  return canvas;
}

function free(canvas: HTMLCanvasElement): void {
  canvas.width = canvas.height = 0;
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
  const cache = (own[name] ??= new TileCache(DROPPED_KEPT, free, true));
  const view = { x: screen.x - x, y: screen.y - y, w: screen.w, h: screen.h };
  const ahead = { tiles: nearestFirst(visibleTiles(view, TILE_PX, TILE_MARGIN, size), view, TILE_PX), budget: PREFETCH_PER_FRAME };
  const key = `${scale}|${lines}|${cell}|${unit}`;
  const make = (col: number, row: number): HTMLCanvasElement => render(e, scale, paint, size, col, row);
  const tiles = cache.sync(key, visibleTiles(view, TILE_PX, 0, size), make, ahead);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, x, y);
  for (const [col, row, canvas] of tiles) ctx.drawImage(canvas, col * TILE_PX, row * TILE_PX);
  ctx.restore();
}

export function below(e: Env): void {
  sky(e);
  scenery(e, "backdrop", e.world.backdrop);
  haze(e);
  terrain(e);
  clipped(e, e.world.lifts.map((l) => baseBox(e, l)), false, () => scenery(e, "dressing", e.world.dressing));
}

export function above(e: Env): void {
  ladders(e);
  clipped(e, e.world.lifts.map((l) => shaftBox(e, l)), true, () => scenery(e, "dressing", e.world.dressing));
}

const shaftBox = ({ cell }: Env, l: Lift): Rect => ({ x: l.x * cell, y: l.top * cell - LIFT_HEAD, w: l.w * cell, h: (l.bottom + 1 - l.top) * cell + LIFT_HEAD });

const baseBox = ({ cell }: Env, l: Lift): Rect => ({ x: l.x * cell, y: l.bottom * cell, w: l.w * cell, h: cell });

function clipped(e: Env, boxes: Rect[], outside: boolean, paint: () => void): void {
  const { ctx, world, cell } = e;
  const hit = boxes.filter((b) => near(e, b));
  if (outside && !hit.length) return paint();
  if (!hit.length) return;
  ctx.save();
  ctx.beginPath();
  if (outside) ctx.rect(0, 0, world.grid.width * cell, world.grid.height * cell);
  for (const { x, y, w, h } of hit) ctx.rect(x, y, w, h);
  ctx.clip("evenodd");
  paint();
  ctx.restore();
}

const sceneryAt = (e: Env, s: Scenery): [number, number] => [s.x * e.cell, (s.y ?? e.world.spawn[1]) * e.cell];

const sceneryBox = (e: Env, s: Scenery): Rect => {
  const [x, y] = sceneryAt(e, s);
  const [left, boxTop, box, bottom] = ASSETS[s.asset].box;
  const right = s.w === undefined ? box : Math.max(box, s.w * TILE);
  const top = s.h === undefined ? boxTop : -s.h * TILE;
  const [l, r] = s.flip ? [-right, -left] : [left, right];
  return { x: x + l * k(e), y: y + top * k(e), w: (r - l) * k(e), h: (bottom - top) * k(e) };
};

function scenery(e: Env, name: string, items: Scenery[]): void {
  const { ctx } = e;
  for (const s of pick(e, name, items, sceneryBox)) {
    if (!near(e, sceneryBox(e, s))) continue;
    const [x, y] = sceneryAt(e, s);
    const size = s.w === undefined && s.h === undefined ? undefined : { w: s.w && s.w * TILE, h: s.h && s.h * TILE };
    if (!s.flip) {
      put(e, s.asset, x, y, s.state ?? 0, size);
      continue;
    }
    ctx.save();
    ctx.translate(x, 0);
    ctx.scale(-1, 1);
    put(e, s.asset, 0, y, s.state ?? 0, size);
    ctx.restore();
  }
}

const wallBox = ({ cell }: Env, r: CellRect): Rect => ({ x: r.col * cell, y: r.row * cell, w: r.w * cell, h: r.h * cell });

const runBox = ({ cell }: Env, r: Run): Rect => ({ x: r.col * cell, y: r.row * cell, w: r.w * cell, h: cell });

interface DrawnTerrain {
  walls: CellRect[];
  ledges: Run[];
  girders: Run[];
  landings: Run[];
  bases: Run[];
}

const drawnTerrains = new WeakMap<SandboxWorld, DrawnTerrain>();

const cutRuns = (runs: Run[], skip: ReadonlySet<string>): Run[] =>
  runs.flatMap(({ row, col, w }) => {
    const out: Run[] = [];
    let start = -1;
    for (let c = col; c <= col + w; c++) {
      const on = c < col + w && !skip.has(`${c},${row}`);
      if (on && start < 0) start = c;
      if (!on && start >= 0) {
        out.push({ row, col: start, w: c - start });
        start = -1;
      }
    }
    return out;
  });

export function drawnTerrain(world: SandboxWorld): DrawnTerrain {
  const known = drawnTerrains.get(world);
  if (known) return known;
  const skip = new Set<string>();
  for (const { col, row, w, h } of world.bare) for (let r = row; r < row + h; r++) for (let c = col; c < col + w; c++) skip.add(`${c},${r}`);
  const landings: Run[] = [];
  const bases: Run[] = [];
  for (const l of world.lifts) {
    for (const row of l.stops) {
      const open = new Set<string>();
      for (let c = l.x; c < l.x + l.w; c++) (world.grid.at(c, row) === "=" ? skip : open).add(`${c},${row}`);
      landings.push(...cutRuns([{ row, col: l.x, w: l.w }], open));
      if (row === l.bottom) bases.push(...cutRuns([{ row, col: l.x, w: l.w }], skip));
    }
  }
  const { walls, ledges, girders } = world.terrain;
  const touched = (r: CellRect): boolean => Array.from({ length: r.h }, (_, i) => r.row + i).some((row) => Array.from({ length: r.w }, (_, i) => r.col + i).some((col) => skip.has(`${col},${row}`)));
  const cutWalls = walls.flatMap((r) =>
    touched(r) ? cutRuns(Array.from({ length: r.h }, (_, i) => ({ row: r.row + i, col: r.col, w: r.w })), skip).map((run) => ({ ...run, h: 1 })) : [r],
  );
  const drawn = { walls: cutWalls, ledges: cutRuns(ledges, skip), girders: cutRuns(girders, skip), landings, bases };
  drawnTerrains.set(world, drawn);
  return drawn;
}

function terrain(e: Env): void {
  const { cell } = e;
  const { walls, ledges, girders, landings, bases } = drawnTerrain(e.world);
  for (const r of pick(e, "walls", walls, wallBox)) {
    if (near(e, wallBox(e, r))) put(e, "brickWall", r.col * cell, (r.row + r.h) * cell, 0, { w: px(e, r.w * cell), h: px(e, r.h * cell) });
  }
  for (const r of pick(e, "bases", bases, runBox)) if (near(e, runBox(e, r))) put(e, "streetWalkway", r.col * cell, r.row * cell, 0, { w: px(e, r.w * cell) });
  for (const r of pick(e, "ledges", ledges, runBox)) if (near(e, runBox(e, r))) put(e, "streetWalkway", r.col * cell, r.row * cell, 0, { w: px(e, r.w * cell) });
  for (const r of pick(e, "girders", girders, runBox)) if (near(e, runBox(e, r))) put(e, "girderBridge", r.col * cell, (r.row + 1) * cell, 0, { w: px(e, r.w * cell) });
  for (const r of pick(e, "landings", landings, runBox)) if (near(e, runBox(e, r))) put(e, "liftLanding", r.col * cell, r.row * cell, 0, { w: px(e, r.w * cell) });
}

function lift(e: Env, l: Lift, alpha: number): void {
  const { cell } = e;
  const y = (l.y - l.vy * (1 - alpha) * FIXED_STEP) * cell;
  const size = { w: px(e, l.w * cell), top: px(e, (l.top - l.bottom) * cell - LIFT_HEAD), py: px(e, y - l.bottom * cell) };
  put(e, "lift", l.x * cell, l.bottom * cell, 0, size);
}

function runsOf(world: SandboxWorld): LadderRun[] {
  const known = ladderRuns.get(world);
  if (known) return known;
  const { grid } = world;
  const runs: LadderRun[] = [];
  for (let col = 0; col < grid.width; col++) {
    for (let row = 0; row < grid.height; row++) {
      if (!grid.ladderTop(col, row)) continue;
      let end = row;
      while (grid.at(col, end) === "H") end++;
      runs.push({ col, row, end });
    }
  }
  ladderRuns.set(world, runs);
  return runs;
}

const ladderBox = ({ cell }: Env, { col, row, end }: LadderRun): Rect => ({ x: col * cell, y: row * cell, w: cell, h: (end - row) * cell });

function ladders(e: Env): void {
  const { cell, unit } = e;
  for (const r of pick(e, "ladders", runsOf(e.world), ladderBox)) {
    if (!near(e, ladderBox(e, r))) continue;
    const size = { h: px(e, (r.end - r.row) * cell), w: px(e, LADDER_W * unit), rung: px(e, RUNG * unit) };
    put(e, "ladder", (r.col + 0.5) * cell - (LADDER_W / 2) * unit, r.end * cell, 0, size);
  }
}

export function prop(e: Env, p: Prop): void {
  if ((p.kind === "item" || p.kind === "weapon") && !onGround(p, e.hero, e.world.flags)) return;
  const icon = p.kind === "item" ? ITEMS[p.item!]!.icon : null;
  const id = p.kind === "item" ? icon?.asset : (p.asset ?? PROP_ASSETS[p.kind]);
  if (!id) return;
  const [left, , right] = ASSETS[id].box;
  const { dx = 0, dy = 0, top } = p.art ?? {};
  const look = guardLook(p);
  if (look === "gone" || guardHidden(p, e.world.flags)) return;
  const state = look?.state ?? icon?.state ?? (p.kind === "panel" && p.on ? 1 : (p.state ?? 0));
  const size = top === undefined ? undefined : { top: -px(e, top * e.cell) };
  put(e, id, (p.x + dx) * e.cell - ((left + right) / 2) * k(e), ((p.y ?? e.world.spawn[1]) + dy) * e.cell, state, size, look?.t ?? 0);
}

export function drawEnvironment(
  ctx: CanvasRenderingContext2D,
  world: SandboxWorld,
  hero: Pick<Hero, "blaster">,
  cfg: MovementConfig,
  alpha: number,
  lines: number,
  screen: Rect = { x: 0, y: 0, w: ctx.canvas.width, h: ctx.canvas.height },
): void {
  const e: Env = { ctx, world, hero, cell: cfg.cellPx, unit: spikeUnit(cfg), lines, screen };
  cached(e, "below", below);
  for (const l of e.world.lifts) lift(e, l, alpha);
  cached(e, "above", above);
  for (const p of world.props) prop(e, p);
}
