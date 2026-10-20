export class TileGrid {
  readonly width: number;
  readonly height: number;
  private readonly blocks = new Set<number>();
  private readonly seeThrough = new Set<number>();

  constructor(private readonly rows: string[]) {
    this.height = rows.length;
    this.width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  }

  at(col: number, row: number): string {
    if (col < 0 || col >= this.width || row < 0) return "#";
    if (row >= this.height) return ".";
    return this.rows[row]?.[col] ?? ".";
  }

  solid(col: number, row: number): boolean {
    const tile = this.at(col, row);
    return tile === "#" || tile === "|" || this.blocks.has(this.key(col, row));
  }

  opaque(col: number, row: number): boolean {
    return this.solid(col, row) && !this.seeThrough.has(this.key(col, row));
  }

  block(col: number, row: number, on: boolean, seeThrough = false): void {
    const key = this.key(col, row);
    if (on) this.blocks.add(key);
    else this.blocks.delete(key);
    if (on && seeThrough) this.seeThrough.add(key);
    else this.seeThrough.delete(key);
  }

  clearBlocks(): void {
    this.blocks.clear();
    this.seeThrough.clear();
  }

  private key(col: number, row: number): number {
    return row * this.width + col;
  }

  wall(col: number, row: number): boolean {
    return this.at(col, row) === "#";
  }

  ladderAt(x: number, y: number): boolean {
    return this.at(Math.floor(x), Math.floor(y)) === "H";
  }

  ladderTop(col: number, row: number): boolean {
    return this.at(col, row) === "H" && this.at(col, row - 1) !== "H";
  }

  floor(col: number, row: number): boolean {
    return this.at(col, row) === "=";
  }

  oneWay(col: number, row: number): boolean {
    return this.floor(col, row) || this.ladderTop(col, row);
  }
}
