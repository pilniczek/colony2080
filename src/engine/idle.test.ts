import { afterEach, describe, expect, it, vi } from "vitest";
import { IDLE_TIMEOUT_MS, whenIdle } from "./idle";

describe("whenIdle", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("runs the task within a timeout even when the browser never goes idle", () => {
    const idle = vi.fn();
    vi.stubGlobal("requestIdleCallback", idle);
    const task = (): void => {};
    whenIdle(task);
    expect(idle).toHaveBeenCalledWith(task, { timeout: IDLE_TIMEOUT_MS });
  });
});
