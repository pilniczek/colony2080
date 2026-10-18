import config from "@config/robots/xbot.json";
import { describe, expect, it } from "vitest";
import { locate } from "../../engine/rig/pose";
import type { GroupNode, RigNode } from "../../engine/rig/tree";
import { buildBack, buildFront, buildSide } from "./xbot";

const groupNames = (node: RigNode, out = new Set<string>()): Set<string> => {
  if (node.k !== "g") return out;
  if (node.name != null) out.add(node.name);
  for (const kid of node.kids) groupNames(kid, out);
  return out;
};

const partCount = (node: RigNode): number =>
  node.k === "part" ? 1 : node.k === "g" ? node.kids.reduce((n, kid) => n + partCount(kid), 0) : 0;

const views: [keyof typeof config.joints, () => GroupNode][] = [
  ["front", () => buildFront()],
  ["side", () => buildSide({ farLimbs: true })],
  ["back", () => buildBack()],
  ["front", () => buildFront({ enemy: true })],
  ["side", () => buildSide({ farLimbs: true, enemy: true })],
  ["back", () => buildBack({ enemy: true })],
];

describe.each(views)("%s view", (view, build) => {
  it("names every config joint as a group", () => {
    const names = groupNames(build());
    for (const j of config.joints[view]) expect(names, j).toContain(j);
  });

  it("finds every config hook with an empty pose", () => {
    const root = build();
    for (const h of config.hooks[view]) expect(locate(root, h, {}), h).not.toBeNull();
  });
});

it("drops small parts in game LOD", () => {
  expect(partCount(buildSide({ lod: true }))).toBeLessThan(partCount(buildSide()));
});

it.each([
  ["front", (enemy: boolean) => buildFront({ enemy })],
  ["side", (enemy: boolean) => buildSide({ farLimbs: true, badge: true, enemy })],
  ["back", (enemy: boolean) => buildBack({ enemy })],
])("drops hero detail from the %s enemy", (_, build) => {
  expect(partCount(build(true))).toBeLessThan(partCount(build(false)));
});
