import { PALETTE } from "../env/paint";

const SCALE = 1.45;

const RECTS: [number, number, number, number, string][] = [
  [3, -3.4, 2.6, 3.4, "#55636a"],
  [0.6, -8, 9.4, 4.8, "#c4ccd0"],
  [0.6, -8, 9.4, 1, "#eef2f2"],
  [2.6, -8.6, 4.6, 0.9, "#0c0806"],
  [3, -8.5, 3.8, 0.4, PALETTE.a2 as string],
  [1.6, -6, 3.4, 1.2, PALETTE.hazard as string],
  [10, -7, 11.6, 2.8, "#8e9aa0"],
  ...[11.2, 12.7, 14.2, 15.7, 17.2, 18.7, 20.2].map((x): [number, number, number, number, string] => [x, -7, 0.6, 2.8, PALETTE.a1 as string]),
  [21.6, -7.6, 1.6, 4, "#dfe5e7"],
];

const num = (n: number): number => +n.toFixed(2);

const BALL = {
  x: 25.4,
  y: -5.6,
  layers: [
    ["#c8300c", 2.6, 1.8, 0],
    ["#f09024", 2, 1.3, 0.2],
    ["#fce438", 1.4, 0.9, 0.4],
    ["#fcf0c4", 0.8, 0.45, 0.6],
  ] as [string, number, number, number][],
};

const ball = BALL.layers.map(([fill, rx, ry, ahead]) => `<ellipse cx="${num(BALL.x + ahead)}" cy="${BALL.y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="none"/>`).join("");

const rects = RECTS.map(([x, y, w, h, fill]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${h < 1 ? ' stroke="none"' : ""}/>`).join("");

export const toasterIcon = (x: number): string => `<g transform="translate(${x} 15.7) scale(${SCALE})" stroke="#202826" stroke-width=".2">${rects}${ball}</g>`;
