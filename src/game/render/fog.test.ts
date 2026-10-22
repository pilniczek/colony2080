import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Fog } from "../fog";
import { TileGrid } from "../../engine/world/tiles";
import { drawFog, glideOf, hardEdges } from "./fog";

interface FakeCanvas {
  width: number;
  height: number;
  getContext: () => CanvasRenderingContext2D;
}

const fakeContext = (calls: string[], args: unknown[][] = []): CanvasRenderingContext2D =>
  new Proxy({} as Record<string, unknown>, {
    get: (target, key: string) => {
      if (key in target) return target[key];
      if (key === "createImageData") return (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) });
      if (key === "createPattern") return () => ({});
      return (...given: unknown[]) => {
        calls.push(key);
        args.push(given);
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
    seenCells: [],
    version: 0,
  }) as unknown as Fog;

describe("drawFog", () => {
  let canvases: FakeCanvas[];
  let calls: string[];
  let args: unknown[][];

  beforeEach(() => {
    canvases = [];
    calls = [];
    args = [];
    vi.stubGlobal("document", {
      createElement: () => {
        const canvas: FakeCanvas = { width: 300, height: 150, getContext: () => fakeContext(calls, args) };
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

  it("never makes a canvas larger than the game window plus its pan margin", () => {
    const main = fakeContext([]);
    drawFog(main, fog(160, 80), view, 24, window);
    expect(canvases.length).toBeGreaterThan(0);
    for (const canvas of canvases) expect(canvas.width * canvas.height).toBeLessThanOrEqual((window.w + 256) * (window.h + 256));
  });

  it("rebuilds the cell mask only when the fog version changes", () => {
    const main = fakeContext([]);
    const f = fog(160, 80);
    drawFog(main, f, view, 24, window);
    drawFog(main, f, { ...view, offsetX: -3100 }, 24, window);
    expect(calls.filter((c) => c === "putImageData")).toHaveLength(1);
    f.seenCells = [5];
    f.version++;
    drawFog(main, f, view, 24, window);
    expect(calls.filter((c) => c === "putImageData")).toHaveLength(2);
  });

  it("repaints only the cells the sight left or entered", () => {
    const main = fakeContext([]);
    const f = fog(160, 80);
    f.seenCells = [50 * 160 + 40];
    drawFog(main, f, view, 24, window);
    f.seenCells = [51 * 160 + 42];
    f.version++;
    drawFog(main, f, view, 24, window);
    const puts = args.filter((_, i) => calls[i] === "putImageData");
    expect(puts.at(-1)!.slice(1)).toEqual([0, 0, 40, 50, 3, 2]);
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

  it("repaints the window only when the fog changes or the view leaves its margin", () => {
    const main = fakeContext([]);
    const f = fog(160, 80);
    drawFog(main, f, view, 24, window);
    const clears = calls.filter((c) => c === "clearRect").length;
    drawFog(main, f, view, 24, window);
    expect(calls.filter((c) => c === "clearRect")).toHaveLength(clears);
    drawFog(main, f, { ...view, offsetX: -3100 }, 24, window);
    expect(calls.filter((c) => c === "clearRect")).toHaveLength(clears);
    drawFog(main, f, { ...view, offsetX: -3200 }, 24, window);
    expect(calls.filter((c) => c === "clearRect")).toHaveLength(clears + 1);
  });
});

describe("glideOf", () => {
  it("clears the sight edge cells by how much of them is in sight", () => {
    const f = fog(20, 4);
    for (let col = 5; col < 14; col++) {
      f.seen[20 + col] = 1;
      f.revealed[20 + col] = 1;
    }
    const glide = glideOf(f, { left: 4.75, right: 13.25, top: 1, bottom: 2 });
    expect(glide.get(20 + 4)).toBe(Math.round(0.75 * Math.round(0.97 * 255)));
    expect(glide.get(20 + 13)).toBe(Math.round(0.75 * Math.round(0.6 * 255)));
    expect(glide.size).toBe(2);
    expect(glideOf(f, { left: 4.75, right: 13.25, top: 0, bottom: 1 }).size).toBe(0);
  });
});

describe("hardEdges", () => {
  it("keeps the fog edge hard only where a floor or wall stops the sight", () => {
    const f = { ...fog(4, 4), grid: new TileGrid(["....", "##..", "....", "...."]) } as Fog;
    const seenRows = new Set([1, 2, 3]);
    const alpha = (i: number): number => (seenRows.has(Math.floor(i / 4)) ? 0 : 255);
    expect(hardEdges(f, alpha, { col: 0, row: 0, w: 4, h: 4 })).toEqual([
      [0, 1],
      [1, 1],
    ]);
  });
});
