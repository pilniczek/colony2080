import { context2d, surface, type Surface } from "../../engine/render/surface";
import type { Pose } from "../../engine/rig/pose";
import { ROBOT } from "../robot/xbot";

const FIGURE_BYTES = 48 * 1024 * 1024;
const SEEN_KEPT = 1024;
const ROT_STEP = 0.5;
const MOVE_STEP = 0.5;
const SCALE_STEP = 0.01;
const BOX = { x0: -480, y0: -300, x1: ROBOT.AX * 2 + 480, y1: ROBOT.FOOT_Y + 160 };

interface Sprite {
  image: Surface;
  x: number;
  y: number;
  bytes: number;
}

const sprites = new Map<string, Sprite>();
const seen = new Set<string>();
let bytes = 0;
let scratch: Surface | null = null;

const ids = new WeakMap<object, number>();
let lastId = 0;

const idOf = (o: object): number => {
  let id = ids.get(o);
  if (id === undefined) ids.set(o, (id = ++lastId));
  return id;
};

const step = (v: number | undefined, size: number): number => Math.round((v ?? 0) / size);

export function poseKey(pose: Pose): string {
  let key = "";
  for (const name in pose) {
    const v = pose[name];
    if (typeof v === "number") key += `${name}${step(v, ROT_STEP)};`;
    else if (v) {
      key += `${name}${step(v.rot, ROT_STEP)},${step(v.dx, MOVE_STEP)},${step(v.dy, MOVE_STEP)},${step(v.sx ?? 1, SCALE_STEP)},${step(v.sy ?? 1, SCALE_STEP)}`;
      key += v.tint ? `,${v.tint.brightness ?? 1},${v.tint.saturate ?? 1};` : ";";
    }
  }
  return key;
}

export const figureKey = (owners: object[], pose: Pose, extra: string): string => `${owners.map(idOf).join(",")}|${extra}|${poseKey(pose)}`;

const corners = (m: DOMMatrix): { x0: number; y0: number; x1: number; y1: number } => {
  const xs = [BOX.x0, BOX.x1].flatMap((x) => [m.a * x + m.c * BOX.y0, m.a * x + m.c * BOX.y1]);
  const ys = [BOX.x0, BOX.x1].flatMap((x) => [m.b * x + m.d * BOX.y0, m.b * x + m.d * BOX.y1]);
  return { x0: Math.floor(Math.min(...xs)) - 1, y0: Math.floor(Math.min(...ys)) - 1, x1: Math.ceil(Math.max(...xs)) + 1, y1: Math.ceil(Math.max(...ys)) + 1 };
};

const inked = (data: Uint8ClampedArray, w: number, h: number): { x0: number; y0: number; x1: number; y1: number } | null => {
  let [x0, y0, x1, y1] = [w, h, -1, -1];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!data[(y * w + x) * 4 + 3]) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      y1 = y;
    }
  }
  return x1 < 0 ? null : { x0, y0, x1: x1 + 1, y1: y1 + 1 };
};

function build(m: DOMMatrix, draw: (ctx: CanvasRenderingContext2D) => void): Sprite | null {
  const box = corners(m);
  const [w, h] = [box.x1 - box.x0, box.y1 - box.y0];
  if (!scratch || scratch.width < w || scratch.height < h) scratch = surface(Math.max(w, scratch?.width ?? 0), Math.max(h, scratch?.height ?? 0));
  const s = context2d(scratch, { willReadFrequently: true });
  s.setTransform(1, 0, 0, 1, 0, 0);
  s.clearRect(0, 0, w, h);
  s.setTransform(m.a, m.b, m.c, m.d, -box.x0, -box.y0);
  draw(s);
  const ink = inked(s.getImageData(0, 0, w, h).data, w, h);
  if (!ink) return null;
  const image = surface(ink.x1 - ink.x0, ink.y1 - ink.y0);
  context2d(image).drawImage(scratch, ink.x0, ink.y0, image.width, image.height, 0, 0, image.width, image.height);
  return { image, x: box.x0 + ink.x0, y: box.y0 + ink.y0, bytes: image.width * image.height * 4 };
}

function keep(key: string, sprite: Sprite): void {
  sprites.set(key, sprite);
  bytes += sprite.bytes;
  for (const [old, s] of sprites) {
    if (bytes <= FIGURE_BYTES) break;
    sprites.delete(old);
    bytes -= s.bytes;
  }
}

export function drawFigure(ctx: CanvasRenderingContext2D, key: string | null, draw: (ctx: CanvasRenderingContext2D) => void): void {
  if (key === null || (typeof OffscreenCanvas === "undefined" && typeof document === "undefined")) return draw(ctx);
  const m = ctx.getTransform();
  const full = `${key}|${m.a.toFixed(4)},${m.b.toFixed(4)},${m.c.toFixed(4)},${m.d.toFixed(4)}`;
  let sprite = sprites.get(full);
  if (sprite) {
    sprites.delete(full);
    sprites.set(full, sprite);
  } else if (seen.has(full)) {
    sprite = build(m, draw) ?? undefined;
    if (!sprite) return;
    seen.delete(full);
    keep(full, sprite);
  } else {
    if (seen.size >= SEEN_KEPT) seen.clear();
    seen.add(full);
    return draw(ctx);
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(sprite.image, Math.round(m.e) + sprite.x, Math.round(m.f) + sprite.y);
  ctx.restore();
}
