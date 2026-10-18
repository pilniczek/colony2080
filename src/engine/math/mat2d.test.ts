import { expect, it } from "vitest";
import { apply, determinant, identity, parseTransform, rotate, scale, translate } from "./mat2d";

const close = (p: [number, number], x: number, y: number) => {
  expect(p[0]).toBeCloseTo(x, 9);
  expect(p[1]).toBeCloseTo(y, 9);
};

it("rotates 90 degrees counter-clockwise in math axes", () => {
  close(apply(rotate(identity(), 90), [1, 0]), 0, 1);
});

it("post-multiplies like DOMMatrix", () => {
  close(apply(rotate(translate(identity(), 10, 0), 90), [1, 0]), 10, 1);
  close(apply(translate(rotate(identity(), 90), 10, 0), [0, 0]), 0, 10);
});

it("parses chained transforms", () => {
  close(apply(parseTransform("translate(10 0) rotate(90 0 0)"), [1, 0]), 10, 1);
  close(apply(parseTransform("scale(2)"), [1, 1]), 2, 2);
  close(apply(parseTransform("scale(2,3)"), [1, 1]), 2, 3);
  close(apply(parseTransform("rotate(90 5 5)"), [6, 5]), 5, 6);
});

it("parses empty input as identity", () => {
  expect(parseTransform(null)).toEqual(identity());
  expect(parseTransform("")).toEqual(identity());
});

it("computes determinant", () => {
  expect(determinant(scale(identity(), 2, 3))).toBe(6);
});
