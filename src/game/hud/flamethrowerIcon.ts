import { PALETTE } from "../env/paint";

const SCALE = 1.45;

const RECTS: [number, number, number, number, string][] = [
  [0.4, -6.2, 3, 2.2, "#55636a"],
  [5.4, -3.4, 2.2, 3.4, "#55636a"],
  [3.2, -6.6, 9.4, 3.2, "#8e9aa0"],
  [4.6, -8.6, 7.6, 2, PALETTE.b2 as string],
  [4.6, -8.6, 7.6, 0.6, PALETTE.b3 as string],
  [8, -8.6, 0.9, 2.2, "#c4ccd0"],
  [12.6, -6, 7.8, 1.8, "#c4ccd0"],
  [20.4, -6.8, 2.8, 3.4, "#dfe5e7"],
  [20.8, -3.4, 1.6, 0.7, PALETTE.a1 as string],
];

const FLAME = {
  y: -5.1,
  layers: [
    ["#c8300c", 26.6, 3, 1.8],
    ["#f09024", 26.2, 2.3, 1.3],
    ["#fce438", 25.6, 1.5, 0.85],
    ["#fcf0c4", 24.9, 0.8, 0.45],
  ] as [string, number, number, number][],
};

const flame = FLAME.layers.map(([fill, cx, rx, ry]) => `<ellipse cx="${cx}" cy="${FLAME.y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="none"/>`).join("");

const rects = RECTS.map(([x, y, w, h, fill]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${h < 1 ? ' stroke="none"' : ""}/>`).join("");

export const flamethrowerIcon = (x: number): string => `<g transform="translate(${x} 15.7) scale(${SCALE})" stroke="#202826" stroke-width=".2">${rects}${flame}</g>`;
