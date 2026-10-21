const SOLID = 1;
const WALL = 2;
const FLOOR = 4;
const LADDER = 8;
const BLOCKED = 16;
const SEE_THROUGH = 32;

const TILE_FLAGS: Record<string, number> = { "#": SOLID | WALL, "|": SOLID, "=": FLOOR, H: LADDER };

export class TileGrid {
  readonly width: number;
  readonly height: number;
  private readonly flags: Uint8Array;
  private changes = 0;

  constructor(private readonly rows: string[]) {
    this.height = rows.length;
    this.width = rows.reduce((max, row) => Math.max(max, row.length), 0);
    this.flags = new Uint8Array(this.width * this.height);
    rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) this.flags[r * this.width + c] = TILE_FLAGS[row[c]!] ?? 0;
    });
  }

  get version(): number {
    return this.changes;
  }

  at(col: number, row: number): string {
    if (col < 0 || col >= this.width || row < 0) return "#";
    if (row >= this.height) return ".";
    return this.rows[row]?.[col] ?? ".";
  }

  private flagsAt(col: number, row: number): number {
    if (col < 0 || col >= this.width || row < 0) return SOLID | WALL;
    if (row >= this.height) return 0;
    return this.flags[row * this.width + col]!;
  }

  solid(col: number, row: number): boolean {
    return (this.flagsAt(col, row) & (SOLID | BLOCKED)) !== 0;
  }

  opaque(col: number, row: number): boolean {
    const f = this.flagsAt(col, row);
    return (f & (SOLID | BLOCKED)) !== 0 && (f & SEE_THROUGH) === 0;
  }

  block(col: number, row: number, on: boolean, seeThrough = false): void {
    if (col < 0 || col >= this.width || row < 0 || row >= this.height) return;
    const i = row * this.width + col;
    const next = (this.flags[i]! & ~(BLOCKED | SEE_THROUGH)) | (on ? BLOCKED | (seeThrough ? SEE_THROUGH : 0) : 0);
    if (next === this.flags[i]) return;
    this.flags[i] = next;
    this.changes++;
  }

  clearBlocks(): void {
    for (let i = 0; i < this.flags.length; i++) this.flags[i]! &= ~(BLOCKED | SEE_THROUGH);
    this.changes++;
  }

  wall(col: number, row: number): boolean {
    return (this.flagsAt(col, row) & WALL) !== 0;
  }

  ladderAt(x: number, y: number): boolean {
    return (this.flagsAt(Math.floor(x), Math.floor(y)) & LADDER) !== 0;
  }

  ladderTop(col: number, row: number): boolean {
    return (this.flagsAt(col, row) & LADDER) !== 0 && (this.flagsAt(col, row - 1) & LADDER) === 0;
  }

  floor(col: number, row: number): boolean {
    return (this.flagsAt(col, row) & FLOOR) !== 0;
  }

  oneWay(col: number, row: number): boolean {
    return this.floor(col, row) || this.ladderTop(col, row);
  }
}
