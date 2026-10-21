import type { Hero } from "../hero/hero";

const SNAP_CELLS = 1;
const SNAP_SECONDS = 0.1;

export type Moment = Pick<Hero, "x" | "y" | "time" | "climb" | "state" | "hitAge">;

export const momentOf = ({ x, y, time, climb, state, hitAge }: Hero): Moment => ({ x, y, time, climb, state, hitAge });

const blend = (a: number, b: number, k: number, snap: number): number => (Math.abs(b - a) > snap ? b : a + (b - a) * k);

export function tween<T extends Hero>(prev: Moment, h: T, alpha: number): T {
  const steady = prev.state === h.state;
  return {
    ...h,
    x: blend(prev.x, h.x, alpha, SNAP_CELLS),
    y: blend(prev.y, h.y, alpha, SNAP_CELLS),
    time: steady ? blend(prev.time, h.time, alpha, SNAP_SECONDS) : h.time,
    climb: steady ? blend(prev.climb, h.climb, alpha, SNAP_CELLS) : h.climb,
    hitAge: prev.hitAge !== null && h.hitAge !== null ? blend(prev.hitAge, h.hitAge, alpha, SNAP_SECONDS) : h.hitAge,
  };
}
