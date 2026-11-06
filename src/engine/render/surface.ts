export type Surface = OffscreenCanvas | HTMLCanvasElement;

// Firefox draws an OffscreenCanvas onto a page canvas slowly on the main thread.
export const slowOffscreen = (agent: string): boolean => agent.includes("Firefox/");

const domOnMain = typeof document !== "undefined" && typeof navigator !== "undefined" && slowOffscreen(navigator.userAgent);

export function surface(w: number, h: number): Surface {
  if (typeof OffscreenCanvas !== "undefined" && !domOnMain) return new OffscreenCanvas(w, h);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

export const context2d = (s: Surface, options?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D =>
  s.getContext("2d", options) as CanvasRenderingContext2D;
