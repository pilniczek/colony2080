import { describe, expect, it } from "vitest";
import { drawRig } from "./draw";
import { createBuilder } from "./tree";

const recorder = () => {
  const fills: string[] = [];
  const noop = () => undefined;
  const ctx = {
    fillStyle: "",
    globalAlpha: 1,
    save: noop,
    restore: noop,
    transform: noop,
    translate: noop,
    rotate: noop,
    scale: noop,
    beginPath: noop,
    ellipse: noop,
    fill() {
      fills.push(this.fillStyle);
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, fills };
};

const rig = () => {
  const b = createBuilder(null);
  const root = b.root();
  const body = b.G(root, null, undefined, undefined, { dim: 0.5 });
  b.E(b.G(body, null, "head", [0, 0]), 0, 0, 10, 10, "a1");
  b.E(body, 0, 0, 10, 10, "a1");
  b.E(root, 0, 0, 10, 10, "a1");
  return root;
};

describe("drawRig", () => {
  it("tints a joint subtree after the group dim and leaves siblings alone", () => {
    const { ctx, fills } = recorder();
    drawRig(ctx, rig(), { palette: { a1: "#c0c0c0" }, pose: { head: { tint: { brightness: 2 } } } });
    expect(fills).toEqual(["#c0c0c0", "#606060", "#c0c0c0"]);
  });

  it("draws plain colours without a tint", () => {
    const { ctx, fills } = recorder();
    drawRig(ctx, rig(), { palette: { a1: "#c0c0c0" } });
    expect(fills).toEqual(["#606060", "#606060", "#c0c0c0"]);
  });
});
