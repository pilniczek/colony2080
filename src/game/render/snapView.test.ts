import { describe, expect, it } from "vitest";
import { snapView } from "./snapView";

describe("snapView", () => {
  it("rounds the offsets to device pixels and keeps the scale", () => {
    const v = snapView({ scale: 2.5, offsetX: 10.4, offsetY: -3.6 });
    expect(v.offsetX).toBe(10);
    expect(v.offsetY).toBe(-4);
    expect(v.scale).toBe(2.5);
  });
});
