import { whenIdle } from "../../engine/idle";
import { context2d, slowOffscreen } from "../../engine/render/surface";
import { resizeCanvas } from "../../engine/render/view";
import { loadFilms } from "../cutscene";
import { drawRobotView } from "../cutscene/robotView";
import { drawSecurityCam } from "../cutscene/securityCam";
import type { FogConfig } from "../fog";
import type { Rect } from "../geometry";
import type { SandboxWorld } from "../level/sandboxLevel";
import { createKit, paintFrame, type FrameState, type Over, type Target, type Tune } from "./frame";
import type { FromRenderer, ToRenderer } from "./renderWorker";
import { syncer } from "./sync";

export type RenderMode = "main" | "worker";

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

const LAYER_STYLE = "position:fixed;inset:0;width:100vw;height:100vh;display:block;pointer-events:none";

export function renderModeOf(search: string, canvas: HTMLCanvasElement, agent = navigator.userAgent): RenderMode {
  const asked = new URLSearchParams(search).get("render");
  const workerWorks = typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined" && "transferControlToOffscreen" in canvas;
  if (!workerWorks || asked === "main") return "main";
  return asked === "worker" || !slowOffscreen(agent) ? "worker" : "main";
}

function overlayCanvas(under: Element): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = LAYER_STYLE;
  under.parentNode!.insertBefore(canvas, under.nextSibling);
  return canvas;
}

function mainPainter(canvas: HTMLCanvasElement, world: SandboxWorld, over?: Over): Painter {
  const target: Target = { ctx: context2d(canvas, { alpha: false }), w: canvas.width, h: canvas.height };
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

function workerPainter(canvas: HTMLCanvasElement, world: SandboxWorld, fogCfg: FogConfig, over: Over | undefined, fallback: (reason: string) => void): Painter {
  const overlay = over ? overlayCanvas(canvas) : null;
  const overCtx = overlay?.getContext("2d") ?? null;
  const top = canvas.transferControlToOffscreen();
  const worker = new Worker(new URL("./renderWorker.ts", import.meta.url), { type: "module" });
  const sync = syncer();
  const send = (message: ToRenderer, transfer: Transferable[] = []): void => worker.postMessage(message, transfer);
  let [w, h] = [1, 1];
  let busy = false;
  let frames = 0;
  let thumb: ImageBitmap | null = null;
  let failed = false;
  const fail = (reason: string): void => {
    if (failed) return;
    failed = true;
    worker.terminate();
    overlay?.remove();
    fallback(reason);
  };
  worker.onmessage = ({ data }: MessageEvent<FromRenderer>) => {
    if (data.kind === "done") busy = false;
    else if (data.kind === "thumb") {
      thumb?.close();
      thumb = data.image;
    } else fail(data.reason);
  };
  worker.onerror = (e) => fail(e.message);
  send({ kind: "init", source: world.source, fogCfg, top }, [top]);
  return {
    mode: "worker",
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

export function createPainter(canvas: HTMLCanvasElement, world: SandboxWorld, fogCfg: FogConfig, over: Over | undefined, onFallback: (painter: Painter) => void): Painter {
  if (renderModeOf(location.search, canvas) === "main") return mainPainter(canvas, world, over);
  return workerPainter(canvas, world, fogCfg, over, (reason) => {
    const fresh = canvas.cloneNode() as HTMLCanvasElement;
    canvas.replaceWith(fresh);
    console.warn(`render worker failed, drawing on the main thread: ${reason}`);
    onFallback(mainPainter(fresh, world, over));
  });
}
