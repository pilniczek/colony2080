import type { Hero } from "./hero/hero";

export interface FogConfig {
  enabled: boolean;
  widthCells: number;
  rowsAbove: number;
  rowsBelow: number;
  followRate: number;
  color: string;
  opacity: number;
  scanlineColor: string;
  scanlineGapPx: number;
}

export interface SightRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface Fog {
  cfg: FogConfig;
  anchorY: number;
  width: number;
  height: number;
  revealed: Uint8Array;
  version: number;
}

export function loadFog(json: unknown): FogConfig {
  const { fogOfWar } = json as { fogOfWar: FogConfig };
  return { ...fogOfWar };
}

export function sightRect(cfg: FogConfig, x: number, anchorY: number): SightRect {
  const half = cfg.widthCells / 2;
  return { left: x - half, right: x + half, top: anchorY - cfg.rowsAbove, bottom: anchorY + cfg.rowsBelow };
}

export const revealedAt = (fog: Fog, col: number, row: number): boolean =>
  col >= 0 && col < fog.width && row >= 0 && row < fog.height && fog.revealed[row * fog.width + col] === 1;

function reveal(fog: Fog, r: SightRect): void {
  let added = false;
  for (let row = Math.max(0, Math.ceil(r.top - 0.5)); row < Math.min(fog.height, Math.floor(r.bottom + 0.5)); row++) {
    for (let col = Math.max(0, Math.ceil(r.left - 0.5)); col < Math.min(fog.width, Math.floor(r.right + 0.5)); col++) {
      const i = row * fog.width + col;
      if (fog.revealed[i]) continue;
      fog.revealed[i] = 1;
      added = true;
    }
  }
  if (added) fog.version++;
}

export function createFog(cfg: FogConfig, hero: Pick<Hero, "x" | "y">, grid: { width: number; height: number }): Fog {
  const fog = { cfg, anchorY: hero.y, width: grid.width, height: grid.height, revealed: new Uint8Array(grid.width * grid.height), version: 0 };
  reveal(fog, sightRect(cfg, hero.x, hero.y));
  return fog;
}

const settled = (h: Hero): boolean => h.onGround || h.state === "ladder";

export function updateFog(fog: Fog, h: Hero, heroHeight: number, dt: number): void {
  const { cfg } = fog;
  const outside = h.y > fog.anchorY + cfg.rowsBelow || h.y - heroHeight < fog.anchorY - cfg.rowsAbove;
  if (settled(h) || outside) fog.anchorY += (h.y - fog.anchorY) * Math.min(1, cfg.followRate * dt);
  reveal(fog, sightRect(cfg, h.x, fog.anchorY));
}

export const visible = (fog: Fog, x: number, y: number): boolean => revealedAt(fog, Math.floor(x), Math.floor(y));

export function fogEdge(fog: Fog, x: number, y: number, dir: number): number {
  const row = Math.floor(y);
  if (row < 0 || row >= fog.height) return dir * Infinity;
  let col = Math.floor(x);
  if (!revealedAt(fog, col, row)) return -dir * Infinity;
  while (revealedAt(fog, col + dir, row)) col += dir;
  const next = col + dir;
  if (next < 0 || next >= fog.width) return dir * Infinity;
  return dir > 0 ? next : col;
}
