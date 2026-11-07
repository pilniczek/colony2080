import type { Pt } from "../../engine/rig/tree";
import { PALETTE } from "../env/paint";
import { FLAMETHROWER_COLORS, FLAMETHROWER_PARTS, PILOT, PILOT_AT } from "../robot/flamethrower";

const SCALE = 1.45;
const K = 0.068;
const PILOT_COLORS = { outer: "#c8401a", mid: PALETTE.a2 as string, core: "#fff1c4", blue: "#3f7cff" };

const n = (v: number): number => +v.toFixed(2);
const ix = (x: number): number => n(0.4 + (x + 100) * K);
const iy = (y: number): number => n((y - 32) * K);
const rect = (x: number, y: number, w: number, h: number, fill: string, line = true): string =>
  `<rect x="${ix(x)}" y="${iy(y)}" width="${n(w * K)}" height="${n(h * K)}" fill="${fill}"${line ? "" : ' stroke="none"'}/>`;

const parts = FLAMETHROWER_PARTS.map(
  (p) => rect(p.x, p.y, p.w, p.h, FLAMETHROWER_COLORS[p.mat + p.tone] as string) + rect(p.x, p.y, p.w, p.h * 0.28, FLAMETHROWER_COLORS[p.mat + Math.min(3, p.tone + 1)] as string, false),
).join("");

const at = ([x, y]: Pt): string => `${ix(PILOT_AT[0] + x)} ${iy(PILOT_AT[1] + y)}`;
const pathOf = (pts: Pt[]): string =>
  `M${at(pts[0]!)}${pts
    .slice(1, -1)
    .map((p, i) => `Q${at(p)} ${at([(p[0] + pts[i + 2]![0]) / 2, (p[1] + pts[i + 2]![1]) / 2])}`)
    .join("")}L${at(pts[pts.length - 1]!)}Z`;

const flame = (["outer", "mid", "core", "blue"] as const).map((k) => `<path d="${pathOf(PILOT[k])}" fill="${PILOT_COLORS[k]}" stroke="none"/>`).join("");

export const flamethrowerIcon = (x: number): string => `<g transform="translate(${x} 15.7) scale(${SCALE})" stroke="#202826" stroke-width=".2">${parts}${flame}</g>`;
