import { describe, expect, it, vi } from "vitest";
import { stopOnPause, stopOnSkip, stopWhenHidden, warmOnUnlock } from "./voices";

const mixer = () => ({ stopAll: vi.fn(), unlock: vi.fn(), warm: vi.fn() });

describe("stopOnSkip", () => {
  it("skipped film stops world voices", () => {
    const m = mixer();
    stopOnSkip(m, "skipped");
    expect(m.stopAll).toHaveBeenCalledExactlyOnceWith("world");
  });

  it("playing or ended film keeps voices", () => {
    const m = mixer();
    stopOnSkip(m, "playing");
    stopOnSkip(m, "ended");
    expect(m.stopAll).not.toHaveBeenCalled();
  });
});

describe("stopOnPause", () => {
  it("loop pauses -> world voices stop", () => {
    const m = mixer();
    stopOnPause(m, false, true);
    expect(m.stopAll).toHaveBeenCalledExactlyOnceWith("world");
  });

  it("staying paused, resuming or running keeps voices", () => {
    const m = mixer();
    stopOnPause(m, true, true);
    stopOnPause(m, true, false);
    stopOnPause(m, false, false);
    expect(m.stopAll).not.toHaveBeenCalled();
  });
});

describe("stopWhenHidden", () => {
  it("hidden tab stops world voices, visible keeps them", () => {
    const m = mixer();
    stopWhenHidden(m, false);
    expect(m.stopAll).not.toHaveBeenCalled();
    stopWhenHidden(m, true);
    expect(m.stopAll).toHaveBeenCalledExactlyOnceWith("world");
  });
});

describe("warmOnUnlock", () => {
  it("unlocks on every call and warms each id once, one per idle callback", () => {
    const m = mixer();
    const idle: (() => void)[] = [];
    const unlock = warmOnUnlock(m, ["a", "b"], (task) => idle.push(task));
    unlock();
    unlock();
    expect(m.unlock).toHaveBeenCalledTimes(2);
    expect(m.warm).not.toHaveBeenCalled();
    expect(idle).toHaveLength(1);
    idle.shift()!();
    expect(m.warm.mock.calls).toEqual([["a"]]);
    idle.shift()!();
    expect(m.warm.mock.calls).toEqual([["a"], ["b"]]);
    idle.shift()!();
    expect(idle).toHaveLength(0);
    expect(m.warm).toHaveBeenCalledTimes(2);
  });
});
