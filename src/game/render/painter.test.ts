import { afterEach, describe, expect, it, vi } from "vitest";
import { renderModeOf } from "./painter";

const FIREFOX = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0";
const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";
const canvas = { transferControlToOffscreen: () => null } as unknown as HTMLCanvasElement;

describe("renderModeOf", () => {
  afterEach(() => vi.unstubAllGlobals());

  const withWorkers = (): void => {
    vi.stubGlobal("Worker", class {});
    vi.stubGlobal("OffscreenCanvas", class {});
  };

  it("draws in the worker in Chrome", () => {
    withWorkers();
    expect(renderModeOf("", canvas, CHROME)).toBe("worker");
  });

  it("draws on the main thread in Firefox, unless the URL asks for the worker", () => {
    withWorkers();
    expect(renderModeOf("", canvas, FIREFOX)).toBe("main");
    expect(renderModeOf("?render=worker", canvas, FIREFOX)).toBe("worker");
  });

  it("draws on the main thread when asked or without workers", () => {
    withWorkers();
    expect(renderModeOf("?render=main", canvas, CHROME)).toBe("main");
    vi.stubGlobal("Worker", undefined);
    expect(renderModeOf("?render=worker", canvas, CHROME)).toBe("main");
  });
});
