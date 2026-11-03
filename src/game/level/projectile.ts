import type { TileGrid } from "../../engine/world/tiles";
import type { MovementConfig } from "../hero/config";
import { isDead, type Hero } from "../hero/hero";

export interface Projectile {
  x: number;
  y: number;
  heading: number;
  speed: number;
  hits: number;
  trail: [number, number, number][];
  trailLife: number;
  age: number;
  ended: number | null;
  burst: boolean;
}

export type Box = MovementConfig["box"];

export const BOOM_LIFE = 1.2;
const TRAIL_STEP = 0.08;

export const projectile = (x: number, y: number, heading: number, speed: number, hits: number, trailMs: number): Projectile => ({
  x,
  y,
  heading,
  speed,
  hits,
  trail: [[x, y, 0]],
  trailLife: trailMs / 1000,
  age: 0,
  ended: null,
  burst: false,
});

export const targetable = (hero: Hero): boolean => !isDead(hero.state) && !hero.hidden;

export function advance(p: Projectile, dt: number): number {
  const step = p.speed * dt;
  p.x += Math.cos(p.heading) * step;
  p.y += Math.sin(p.heading) * step;
  const last = p.trail[p.trail.length - 1]!;
  if (Math.hypot(p.x - last[0], p.y - last[1]) >= TRAIL_STEP) p.trail.push([p.x, p.y, p.age]);
  return step;
}

export function strike(p: Projectile, from: [number, number], grid: TileGrid, hero: Hero, box: Box): { hit: boolean; wall: boolean } {
  const hit = targetable(hero) && Math.abs(p.x - hero.x) <= box.width / 2 && p.y <= hero.y && p.y >= hero.y - box.height;
  const wall = !hit && grid.solid(Math.floor(p.x), Math.floor(p.y));
  if (wall) [p.x, p.y] = from;
  return { hit, wall };
}

export function end(p: Projectile, burst: boolean): void {
  p.ended = 0;
  p.burst = burst;
}

export function tick<T extends Projectile>(p: T, dt: number, fly: (p: T) => { hits: number; burst: boolean }): { hits: number; burst: boolean } {
  p.age += dt;
  if (p.ended === null) return fly(p);
  p.ended += dt;
  return { hits: 0, burst: false };
}

export const live = (p: Projectile): boolean => p.ended === null || p.ended < Math.max(p.burst ? BOOM_LIFE : 0, p.trailLife);
