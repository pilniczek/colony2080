import { describe, expect, it } from "vitest";
import { FixedLoop } from "./loop";

function make() {
  const updates: number[] = [];
  const alphas: number[] = [];
  const loop = new FixedLoop({
    step: 1 / 60,
    maxSteps: 5,
    update: (dt) => updates.push(dt),
    render: (alpha) => alphas.push(alpha),
  });
  return { loop, updates, alphas };
}

describe("FixedLoop", () => {
  it("runs whole steps and renders the remainder", () => {
    const { loop, updates, alphas } = make();
    loop.advance(0.05);
    expect(updates).toEqual([1 / 60, 1 / 60, 1 / 60]);
    expect(alphas).toHaveLength(1);
    expect(alphas[0]).toBeGreaterThanOrEqual(0);
    expect(alphas[0]).toBeLessThan(0.01);
  });

  it("clamps long frames to maxSteps and drops leftover time", () => {
    const { loop, updates } = make();
    loop.advance(10);
    expect(updates).toHaveLength(5);
    loop.advance(0.001);
    expect(updates).toHaveLength(5);
  });

  it("runs no updates while paused", () => {
    const { loop, updates } = make();
    loop.paused = true;
    loop.advance(1);
    expect(updates).toHaveLength(0);
  });

  it("stepOnce runs exactly one update while paused", () => {
    const { loop, updates } = make();
    loop.paused = true;
    loop.stepOnce();
    expect(updates).toEqual([1 / 60]);
  });

  it("scales time", () => {
    const { loop, updates } = make();
    loop.timeScale = 0.5;
    loop.advance(1 / 30);
    expect(updates).toHaveLength(1);
  });

  it("drives itself from the raf callback and stops", () => {
    const { loop, updates } = make();
    let pending: FrameRequestCallback | null = null;
    const raf = (cb: FrameRequestCallback) => {
      pending = cb;
      return 1;
    };
    loop.start(raf);
    pending!(0);
    pending!(50);
    expect(updates).toHaveLength(3);
    loop.stop();
    const before = updates.length;
    pending!(200);
    expect(updates).toHaveLength(before);
  });

  it("restarting before a pending frame fires leaves a single tick chain", () => {
    const { loop, updates } = make();
    const pending: FrameRequestCallback[] = [];
    const raf = (cb: FrameRequestCallback) => pending.push(cb);
    loop.start(raf);
    const stale = pending[0]!;
    loop.stop();
    loop.start(raf);
    const fresh = pending[1]!;
    stale(0);
    expect(pending).toHaveLength(2);
    fresh(0);
    expect(pending).toHaveLength(3);
    pending[2]!(1000 / 60);
    expect(updates).toHaveLength(1);
  });
});
