import type { Rect } from "../geometry";

export const TILE_PX = 512;

export type TileCoord = [number, number];

const span = (from: number, size: number, tile: number, margin: number, limit: number): [number, number] => [
  Math.max(0, Math.floor(from / tile) - margin),
  Math.min(Math.ceil(limit / tile) - 1, Math.ceil((from + size) / tile) - 1 + margin),
];

export function visibleTiles(view: Rect, tile: number, margin: number, limits: { w: number; h: number }): TileCoord[] {
  const [c0, c1] = span(view.x, view.w, tile, margin, limits.w);
  const [r0, r1] = span(view.y, view.h, tile, margin, limits.h);
  const tiles: TileCoord[] = [];
  for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) tiles.push([col, row]);
  return tiles;
}

export function nearestFirst(tiles: TileCoord[], view: Rect, tile: number): TileCoord[] {
  const cx = view.x + view.w / 2;
  const cy = view.y + view.h / 2;
  const far = ([col, row]: TileCoord): number => Math.hypot((col + 0.5) * tile - cx, (row + 0.5) * tile - cy);
  return [...tiles].sort((a, b) => far(a) - far(b));
}

const id = (col: number, row: number): string => `${col},${row}`;

export class TileCache<T> {
  private key = "";
  private tiles = new Map<string, T>();
  private dropped = new Map<string, T>();
  private home = new Set<string>();

  constructor(
    private readonly keep = 0,
    private readonly release: (tile: T) => void = () => {},
    private readonly keepHome = false,
  ) {}

  get size(): number {
    return this.tiles.size;
  }

  has(col: number, row: number): boolean {
    return this.tiles.has(id(col, row));
  }

  sync(key: string, coords: TileCoord[], make: (col: number, row: number) => T, prefetch?: { tiles: TileCoord[]; budget: number; more?: () => boolean }): [number, number, T][] {
    if (key !== this.key) {
      this.key = key;
      for (const tile of [...this.tiles.values(), ...this.dropped.values()]) this.release(tile);
      this.tiles.clear();
      this.dropped.clear();
      this.home = new Set(this.keepHome ? coords.map(([col, row]) => id(col, row)) : []);
    }
    const kept = new Map<string, T>();
    let missed = false;
    const shown = coords.map(([col, row]): [number, number, T] => {
      let tile = this.reuse(col, row);
      if (tile === undefined) {
        missed = true;
        tile = make(col, row);
      }
      kept.set(id(col, row), tile);
      return [col, row, tile];
    });
    let budget = missed ? 0 : (prefetch?.budget ?? 0);
    for (const [col, row] of prefetch?.tiles ?? []) {
      const tile = kept.get(id(col, row)) ?? this.reuse(col, row);
      if (tile !== undefined) kept.set(id(col, row), tile);
      else if (!missed && (budget > 0 || prefetch?.more?.())) {
        budget--;
        kept.set(id(col, row), make(col, row));
      }
    }
    for (const [at, tile] of [...this.tiles].reverse()) if (!kept.has(at)) this.drop(at, tile);
    this.tiles = kept;
    return shown;
  }

  private reuse(col: number, row: number): T | undefined {
    const at = id(col, row);
    const tile = this.tiles.get(at) ?? this.dropped.get(at);
    this.dropped.delete(at);
    return tile;
  }

  private drop(at: string, tile: T): void {
    this.dropped.set(at, tile);
    let spare = [...this.dropped.keys()].filter((old) => !this.home.has(old)).length - this.keep;
    for (const [old, stale] of this.dropped) {
      if (spare <= 0) break;
      if (this.home.has(old)) continue;
      this.dropped.delete(old);
      this.release(stale);
      spare--;
    }
  }
}
