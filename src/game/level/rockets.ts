import type { Pt } from "../../engine/rig/tree";
import type { TileGrid } from "../../engine/world/tiles";
import type { Hero } from "../hero/hero";
import type { RocketJson } from "./enemy";
import { advance, end, projectile, strike, type Box, type Projectile } from "./projectile";

export interface Rocket extends Projectile {
  kind: "rocket";
  range: number;
  flown: number;
}

export const launchRocket = ([x, y]: Pt, facing: 1 | -1, { speed, hits, range, trailMs }: RocketJson): Rocket => ({
  ...projectile(x, y, facing > 0 ? 0 : Math.PI, speed, hits, trailMs),
  kind: "rocket",
  range,
  flown: 0,
});

export function flyRocket(r: Rocket, grid: TileGrid, hero: Hero, box: Box, dt: number): { hits: number; burst: boolean } {
  const from: [number, number] = [r.x, r.y];
  r.flown += advance(r, dt);
  const { hit, wall } = strike(r, from, grid, hero, box);
  const burst = hit || wall || r.flown >= r.range;
  if (burst) end(r, true);
  return { hits: hit ? r.hits : 0, burst };
}
