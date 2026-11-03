import { whenIdle } from "../../engine/idle";
import { context2d } from "../../engine/render/surface";
import { resizeCanvas } from "../../engine/render/view";
import { loadFilms } from "../cutscene";
import { drawRobotView } from "../cutscene/robotView";
import { drawSecurityCam } from "../cutscene/securityCam";
import type { FogConfig } from "../fog";
import type { Rect } from "../geometry";
import type { SandboxWorld } from "../level/sandboxLevel";
import { createKit, paintFrame, type FrameState, type Over, type Target, type Tune } from "./frame";
import { glLayersWork } from "./gl";
import type { FromRenderer, Layers, ToRenderer } from "./renderWorker";
import { syncer } from "./sync";

export type RenderMode = "main" | "worker" | "gl";

export interface Painter {
  readonly mode: RenderMode;
  readonly w: number;
  readonly h: number;
  fit(dpr: number): void;
  paint(state: FrameState, tune: Tune, paused: boolean): void;
  picture(window: Rect, quality: number): string;
  warm(w: number, h: number): void;
}

const CACHE_PASSES = 2;
const PICTURE_W = 96;
const THUMB_EVERY = 30;
const pictureSize = (window: Rect): { w: number; h: number } => ({ w: PICTURE_W, h: Math.max(1, Math.round((PICTURE_W * window.h) / window.w)) });

function jpeg(quality: number, size: { w: number; h: number }, draw: (ctx: CanvasRenderingContext2D) => void): string {
  const out = document.createElement("canvas");
  out.width = size.w;
  out.height = size.h;
  const ctx = out.getContext("2d");
  if (ctx) draw(ctx);
  return out.toDataURL("image/jpeg", quality);
}

export const SLOW_FRAME_MS = 50;
export const SLOW_FRAMES = 100;

export function slowWatch(): (ms: number) => boolean {
  let run = 0;
  return (ms) => (run = ms >= SLOW_FRAME_MS ? run + 1 : 0) >= SLOW_FRAMES;
}

const LAYER_STYLE = "position:fixed;inset:0;width:100vw;height:100vh;display:block;pointer-events:none";

export function renderModeOf(search: string, canvas: HTMLCanvasElement): RenderMode {
  const asked = new URLSearchParams(search).get("render");
  const workerWorks = typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined" && "transferControlToOffscreen" in canvas;
  if (asked === "main" || !workerWorks) return "main";
  if (asked === "worker") return "worker";
  return glLayersWork() ? "gl" : "worker";
}

function layerCanvas(before: Element, after = false): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = LAYER_STYLE;
  before.parentNode!.insertBefore(canvas, after ? before.nextSibling : before);
  return canvas;
}

function mainPainter(canvas: HTMLCanvasElement, world: SandboxWorld, over?: Over): Painter {
  const target: Target = { ctx: context2d(canvas, { alpha: false }), w: canvas.width, h: canvas.height, gl: null };
  const kit = createKit();
  return {
    mode: "main",
    get w() {
      return canvas.width;
    },
    get h() {
      return canvas.height;
    },
    fit(dpr) {
      resizeCanvas(canvas, dpr);
      target.w = canvas.width;
      target.h = canvas.height;
    },
    paint(state, tune) {
      paintFrame(target, world, state, kit, tune, over);
    },
    picture(window, quality) {
      const size = pictureSize(window);
      return jpeg(quality, size, (ctx) => ctx.drawImage(canvas, window.x, window.y, window.w, window.h, 0, 0, size.w, size.h));
    },
    warm(w, h) {
      const scratch = document.createElement("canvas");
      scratch.width = Math.max(1, Math.round(w));
      scratch.height = Math.max(1, h);
      const ctx = scratch.getContext("2d");
      if (!ctx) return;
      void loadFilms().then((films) => {
        whenIdle(() => {
          for (let pass = 0; pass < CACHE_PASSES; pass++) {
            drawSecurityCam(ctx, scratch.width, scratch.height, 0, "");
            drawRobotView(ctx, scratch.width, scratch.height, 0);
          }
        });
        for (const film of films) whenIdle(() => {
          for (let pass = 0; pass < CACHE_PASSES; pass++) film.render(ctx, scratch.width, scratch.height, 0);
        });
      });
    },
  };
}

function workerPainter(canvas: HTMLCanvasElement, world: SandboxWorld, fogCfg: FogConfig, gl: boolean, over: Over | undefined, fallback: (reason: string, slow: boolean) => void): Painter {
  const extra = gl ? { map: layerCanvas(canvas), back: layerCanvas(canvas), fog: layerCanvas(canvas) } : {};
  const overlay = over ? layerCanvas(canvas, true) : null;
  const overCtx = overlay?.getContext("2d") ?? null;
  const offscreen = (c: HTMLCanvasElement): OffscreenCanvas => c.transferControlToOffscreen();
  const layers: Layers = { top: offscreen(canvas), ...Object.fromEntries(Object.entries(extra).map(([name, c]) => [name, offscreen(c)])) };
  const worker = new Worker(new URL("./renderWorker.ts", import.meta.url), { type: "module" });
  const sync = syncer();
  const send = (message: ToRenderer, transfer: Transferable[] = []): void => worker.postMessage(message, transfer);
  let [w, h] = [1, 1];
  let busy = false;
  let frames = 0;
  let thumb: ImageBitmap | null = null;
  let failed = false;
  let sentAt: number | null = null;
  const slow = slowWatch();
  const fail = (reason: string, tooSlow = false): void => {
    if (failed) return;
    failed = true;
    worker.terminate();
    for (const c of [...Object.values(extra), overlay]) c?.remove();
    fallback(reason, tooSlow);
  };
  worker.onmessage = ({ data }: MessageEvent<FromRenderer>) => {
    if (data.kind === "done") {
      busy = false;
      if (gl && sentAt !== null && slow(performance.now() - sentAt)) fail(`gl frames took over ${SLOW_FRAME_MS} ms`, true);
    } else if (data.kind === "thumb") {
      thumb?.close();
      thumb = data.image;
    } else fail(data.reason);
  };
  worker.onerror = (e) => fail(e.message);
  send({ kind: "init", source: world.source, fogCfg, layers }, Object.values(layers));
  return {
    mode: gl ? "gl" : "worker",
    get w() {
      return w;
    },
    get h() {
      return h;
    },
    fit(dpr) {
      w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (overlay) resizeCanvas(overlay, dpr);
    },
    paint(state, tune, paused) {
      if (overCtx && overlay) {
        overCtx.setTransform(1, 0, 0, 1, 0, 0);
        overCtx.clearRect(0, 0, overlay.width, overlay.height);
        if (state.kind === "game" && over) {
          overCtx.save();
          overCtx.beginPath();
          overCtx.rect(state.window.x, state.window.y, state.window.w, state.window.h);
          overCtx.clip();
          over(overCtx, state.view, tune.cfg.cellPx);
          overCtx.restore();
        }
      }
      if (busy || failed) return;
      busy = true;
      frames++;
      sentAt = state.kind === "game" && !paused ? performance.now() : null;
      const wantThumb = state.kind === "game" && !state.map && frames % THUMB_EVERY === 1;
      send({ kind: "frame", w, h, state, sync: sync(world, tune), paused, thumb: wantThumb && state.kind === "game" ? pictureSize(state.window) : null });
    },
    picture(window, quality) {
      const size = pictureSize(window);
      return jpeg(quality, size, (ctx) => {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, size.w, size.h);
        if (thumb) ctx.drawImage(thumb, 0, 0, size.w, size.h);
      });
    },
    warm(ww, wh) {
      send({ kind: "warm", w: ww, h: wh });
    },
  };
}

function startWorker(canvas: HTMLCanvasElement, world: SandboxWorld, fogCfg: FogConfig, gl: boolean, over: Over | undefined, onFallback: (painter: Painter) => void): Painter {
  return workerPainter(canvas, world, fogCfg, gl, over, (reason, slow) => {
    const fresh = canvas.cloneNode() as HTMLCanvasElement;
    canvas.replaceWith(fresh);
    if (slow && gl) {
      console.warn(`${reason}, drawing in the worker with Canvas 2D`);
      onFallback(startWorker(fresh, world, fogCfg, false, over, onFallback));
    } else {
      console.warn(`render worker failed, drawing on the main thread: ${reason}`);
      onFallback(mainPainter(fresh, world, over));
    }
  });
}

export function createPainter(canvas: HTMLCanvasElement, world: SandboxWorld, fogCfg: FogConfig, over: Over | undefined, onFallback: (painter: Painter) => void): Painter {
  const mode = renderModeOf(location.search, canvas);
  if (mode === "main") return mainPainter(canvas, world, over);
  return startWorker(canvas, world, fogCfg, mode === "gl", over, onFallback);
}
