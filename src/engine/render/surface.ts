export type Surface = OffscreenCanvas | HTMLCanvasElement;

export function surface(w: number, h: number): Surface {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

export const context2d = (s: Surface, options?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D =>
  s.getContext("2d", options) as CanvasRenderingContext2D;
