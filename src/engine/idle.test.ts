import { describe, expect, it, vi } from "vitest";
import { runIdleJob, whenIdle } from "./idle";

describe("whenIdle", () => {
  it("runs nothing until an idle job is due", () => {
    const task = vi.fn();
    whenIdle(task);
    expect(task).not.toHaveBeenCalled();
    runIdleJob();
    expect(task).toHaveBeenCalledOnce();
  });

  it("runs one queued task per idle job, oldest first", () => {
    const order: string[] = [];
    whenIdle(() => order.push("a"));
    whenIdle(() => order.push("b"));
    runIdleJob();
    expect(order).toEqual(["a"]);
    runIdleJob();
    runIdleJob();
    expect(order).toEqual(["a", "b"]);
  });
});
