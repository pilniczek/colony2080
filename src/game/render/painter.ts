import { whenIdle } from "../../engine/idle";
import { context2d } from "../../engine/render/surface";
import { resizeCanvas } from "../../engine/render/view";
import { loadFilms } from "../cutscene";
import { drawRobotView } from "../cutscene/robotView";
import { drawSecurityCam } from "../cutscene/securityCam";
import type { Rect } from "../geometry";
import type { SandboxWorld } from "../level/sandboxLevel";
import { createKit, paintFrame, type FrameState, type Over, type Target, type Tune } from "./frame";

export interface Painter {
  readonly w: number;
  readonly h: number;
  fit(dpr: number): void;
  paint(state: FrameState, tune: Tune): void;
  picture(window: Rect, quality: number): string;
  warm(w: number, h: number): void;
}

const CACHE_PASSES = 2;
const PICTURE_W = 96;
const pictureSize = (window: Rect): { w: number; h: number } => ({ w: PICTURE_W, h: Math.max(1, Math.round((PICTURE_W * window.h) / window.w)) });

function jpeg(quality: number, size: { w: number; h: number }, draw: (ctx: CanvasRenderingContext2D) => void): string {
  const out = document.createElement("canvas");
  out.width = size.w;
  out.height = size.h;
  const ctx = out.getContext("2d");
  if (ctx) draw(ctx);
  return out.toDataURL("image/jpeg", quality);
}

export function createPainter(canvas: HTMLCanvasElement, world: SandboxWorld, over?: Over): Painter {
  const target: Target = { ctx: context2d(canvas, { alpha: false }), w: canvas.width, h: canvas.height };
  const kit = createKit();
  return {
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
