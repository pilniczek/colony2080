import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Fog } from "../fog";
import { drawFog } from "./fog";

interface FakeCanvas {
  width: number;
  height: number;
  getContext: () => CanvasRenderingContext2D;
}

const fakeContext = (calls: string[]): CanvasRenderingContext2D =>
  new Proxy({} as Record<string, unknown>, {
    get: (target, key: string) => {
      if (key in target) return target[key];
      if (key === "createImageData") return (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) });
      if (key === "createPattern") return () => ({});
      return () => {
        calls.push(key);
      };
    },
    set: (target, key: string, value) => {
      target[key] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;

const fog = (width: number, height: number): Fog =>
  ({
    cfg: { color: "#0a1013", opacity: 0.97, rememberedOpacity: 0.6, scanlineColor: "#1e2c32", scanlineGapPx: 3 },
    width,
    height,
    revealed: new Uint8Array(width * height),
    seen: new Uint8Array(width * height),
    version: 0,
  }) as unknown as Fog;

describe("drawFog", () => {
  let canvases: FakeCanvas[];
  let calls: string[];

  beforeEach(() => {
    canvases = [];
    calls = [];
    vi.stubGlobal("document", {
      createElement: () => {
        const canvas: FakeCanvas = { width: 300, height: 150, getContext: () => fakeContext(calls) };
        canvases.push(canvas);
        return canvas;
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const view = { scale: 2, offsetX: -3000, offsetY: -1000 };
  const window = { x: 40, y: 100, w: 1600, h: 900 };

  it("never makes a canvas larger than the game window", () => {
    const main = fakeContext([]);
    drawFog(main, fog(160, 80), view, 24, window);
    expect(canvases.length).toBeGreaterThan(0);
    for (const canvas of canvases) expect(canvas.width * canvas.height).toBeLessThanOrEqual(window.w * window.h);
  });

  it("rebuilds the cell mask only when the fog version changes", () => {
    const main = fakeContext([]);
    const f = fog(160, 80);
    drawFog(main, f, view, 24, window);
    drawFog(main, f, { ...view, offsetX: -3100 }, 24, window);
    expect(calls.filter((c) => c === "putImageData")).toHaveLength(1);
    f.version++;
    drawFog(main, f, view, 24, window);
    expect(calls.filter((c) => c === "putImageData")).toHaveLength(2);
  });

  it("keeps one window canvas across frames of the same size", () => {
    const main = fakeContext([]);
    const f = fog(160, 80);
    drawFog(main, f, view, 24, window);
    const made = canvases.length;
    f.version++;
    drawFog(main, f, { ...view, offsetY: -1200 }, 24, window);
    expect(canvases.length).toBe(made);
  });

  it("repaints the window only when the fog or the view changes", () => {
    const main = fakeContext([]);
    const f = fog(160, 80);
    drawFog(main, f, view, 24, window);
    drawFog(main, f, view, 24, window);
    expect(calls.filter((c) => c === "clearRect")).toHaveLength(1);
    drawFog(main, f, { ...view, offsetX: -3001 }, 24, window);
    expect(calls.filter((c) => c === "clearRect")).toHaveLength(2);
  });
});
