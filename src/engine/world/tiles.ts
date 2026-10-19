export class TileGrid {
  readonly width: number;
  readonly height: number;

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
    return tile === "#" || tile === "|";
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
