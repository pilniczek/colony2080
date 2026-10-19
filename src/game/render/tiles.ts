export const TILE_PX = 512;

export type TileCoord = [number, number];

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

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

const id = (col: number, row: number): string => `${col},${row}`;

export class TileCache<T> {
  private key = "";
  private tiles = new Map<string, T>();

  get size(): number {
    return this.tiles.size;
  }

  has(col: number, row: number): boolean {
    return this.tiles.has(id(col, row));
  }

  sync(key: string, coords: TileCoord[], make: (col: number, row: number) => T, prefetch?: { tiles: TileCoord[]; budget: number }): [number, number, T][] {
    if (key !== this.key) {
      this.key = key;
      this.tiles.clear();
    }
    const kept = new Map<string, T>();
    const shown = coords.map(([col, row]): [number, number, T] => {
      const tile = this.tiles.get(id(col, row)) ?? make(col, row);
      kept.set(id(col, row), tile);
      return [col, row, tile];
    });
    let budget = prefetch?.budget ?? 0;
    for (const [col, row] of prefetch?.tiles ?? []) {
      const tile = kept.get(id(col, row)) ?? this.tiles.get(id(col, row));
      if (tile !== undefined) kept.set(id(col, row), tile);
      else if (budget > 0) {
        budget--;
        kept.set(id(col, row), make(col, row));
      }
    }
    this.tiles = kept;
    return shown;
  }
}
