export class TileGrid {
  readonly width: number;
  readonly height: number;
  private readonly blocks = new Set<number>();

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

  block(col: number, row: number, on: boolean): void {
    if (on) this.blocks.add(this.key(col, row));
    else this.blocks.delete(this.key(col, row));
  }

  clearBlocks(): void {
    this.blocks.clear();
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
}
