import type { TileGrid } from "./tiles";

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  r: number;
}

export function stepProjectiles(list: Projectile[], grid: TileGrid, dt: number): Projectile[] {
  const alive: Projectile[] = [];
  for (const p of list) {
    p.x += p.vx * dt;
    const inside = p.x >= 0 && p.x < grid.width && p.y >= 0 && p.y < grid.height;
    if (inside && !grid.solid(Math.floor(p.x), Math.floor(p.y))) alive.push(p);
  }
  return alive;
}
