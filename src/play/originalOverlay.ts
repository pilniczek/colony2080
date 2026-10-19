import type { ViewTransform } from "../engine/render/view";
import type { Run } from "../game/run";
import { useSandbox } from "../sandbox/store";

const MAP_URL = "/docs/research/gamedata/png/maps/map_M11.png";
const MAP_CELL_PX = 24;
const ALPHA = 0.5;
const TOGGLE = "KeyO";

export type DrawOver = (ctx: CanvasRenderingContext2D, view: ViewTransform, cellPx: number) => void;

export function originalOverlay(run: Run): DrawOver {
  const image = new Image();
  image.src = MAP_URL;
  let on = false;
  addEventListener("keydown", (e) => {
    if (e.code === TOGGLE) on = !on;
  });
  Object.assign(window, {
    __teleport: (x: number, y: number) => Object.assign(run.hero, { x, y, vx: 0, vy: 0 }),
    __overlay: (show: boolean) => (on = show),
    __fog: (fog: boolean) => run.applyFog(fog),
    __pause: (paused: boolean) => useSandbox.setState({ paused }),
  });
  return (ctx, view, cellPx) => {
    if (!on || !image.complete || !image.naturalWidth) return;
    const k = cellPx / MAP_CELL_PX;
    ctx.save();
    ctx.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);
    ctx.globalAlpha = ALPHA;
    ctx.drawImage(image, 0, 0, image.naturalWidth * k, image.naturalHeight * k);
    ctx.restore();
  };
}
