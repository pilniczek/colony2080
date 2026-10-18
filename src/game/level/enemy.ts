import { createHero, type Hero } from "../hero/hero";

export interface EnemyJson {
  x: number;
  facing: -1 | 1;
  hits: number;
  respawnMs: number;
}

export interface Enemy {
  body: Hero;
  spot: [number, number];
  facing: -1 | 1;
  hits: number;
  respawnMs: number;
  deadAge: number | null;
}

const spawnBody = (e: Pick<Enemy, "spot" | "facing" | "hits">): Hero => ({ ...createHero(e.spot, "gun", e.hits), facing: e.facing });

export function createEnemy(json: EnemyJson, floorY: number): Enemy {
  const base = { spot: [json.x, floorY] as [number, number], facing: json.facing, hits: json.hits };
  return { ...base, respawnMs: json.respawnMs, body: spawnBody(base), deadAge: null };
}

export const isDead = (e: Enemy): boolean => e.deadAge !== null;

export function hitEnemy(e: Enemy): boolean {
  if (isDead(e)) return false;
  e.body.energy -= 1;
  e.body.hitAge = 0;
  if (e.body.energy <= 0) e.deadAge = 0;
  return true;
}

export function updateEnemy(e: Enemy, dt: number): void {
  e.body.time += dt;
  if (e.body.hitAge !== null) e.body.hitAge += dt;
  if (e.deadAge === null) return;
  e.deadAge += dt;
  if (e.deadAge * 1000 < e.respawnMs - 1e-6) return;
  e.body = spawnBody(e);
  e.deadAge = null;
}
