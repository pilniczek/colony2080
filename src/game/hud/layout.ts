import { ITEMS } from "../items";

export type Span = [number, number];

export const HUD_H = 200;
export const HUD_MIN_W = 320;
export const VIEW_BOX = { left: 11, top: 20.4, right: 11, bottom: 8 };

const EDGE = 0;
const GAP = 2;
const PLATE_PAD = 3.5;
const RUN_W = 18;
export const HAND_SCALE = 0.8;
export const HAND_DRAWN = { w: 12, h: 13 };
export const HAND_BOX = { w: HAND_DRAWN.w * HAND_SCALE, h: HAND_DRAWN.h * HAND_SCALE };
export const READOUT_SIZE = 5.6;
const MONO_ADVANCE = 0.54;
const LONGEST_NAME = Math.max(...Object.values(ITEMS).map((item) => item.name.length));
const ICON_W = Math.max(HAND_BOX.w, ...Object.values(ITEMS).map((item) => HAND_BOX.w * item.icon.scale));
export const SLOT = { pad: PLATE_PAD, iconW: ICON_W, gap: 2 };
const INVENTORY_W = 2 * SLOT.pad + SLOT.iconW + SLOT.gap + LONGEST_NAME * READOUT_SIZE * MONO_ADVANCE;
export const WEAPON_W = [35, 20, 57];
const GRID_MARGIN = 4.4;
const WEAPON_GAP = 12;
const BADGE_WINDOW_HALF = 24;

export interface HudFit {
  W: number;
  H: number;
  unit: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TopBar {
  inv: number;
  invW: number;
  run: number;
  runW: number;
  gridX: number;
  badge: number;
  gridW: number;
  weapons: number[];
  gaps: Span[];
  plates: Span[];
}

export function hudFit(width: number, height: number): HudFit {
  const W = Math.max(HUD_MIN_W, (HUD_H * width) / height);
  const H = Math.max(HUD_H, (HUD_MIN_W * height) / width);
  return { W, H, unit: height / H };
}

export function viewRect({ W, H, unit }: HudFit): Rect {
  return {
    x: VIEW_BOX.left * unit,
    y: VIEW_BOX.top * unit,
    w: (W - VIEW_BOX.left - VIEW_BOX.right) * unit,
    h: (H - VIEW_BOX.top - VIEW_BOX.bottom) * unit,
  };
}

const invAt = (W: number): number => W - EDGE - PLATE_PAD - INVENTORY_W;
const runAt = (W: number): number => invAt(W) - 2 * PLATE_PAD - GAP - RUN_W;
const WEAPONS_GRID_W = WEAPON_W.reduce((a, b) => a + b, 0) + (WEAPON_W.length + 1) * WEAPON_GAP;

export function topBar(W: number): TopBar {
  const inv = invAt(W);
  const run = runAt(W);
  const gridX = EDGE + GRID_MARGIN;
  const gridW = WEAPONS_GRID_W;
  const weaponsEnd = gridX + gridW + GRID_MARGIN;
  const runPlateStart = run - PLATE_PAD;
  const badgeEnd = runPlateStart - GAP;
  const badge = (weaponsEnd + GAP + badgeEnd) / 2 - BADGE_WINDOW_HALF;
  const runGap: Span = [run + RUN_W + PLATE_PAD, inv - PLATE_PAD];
  const gaps: Span[] = [[0, EDGE], [weaponsEnd, weaponsEnd + GAP], [badgeEnd, runPlateStart], runGap, [W - EDGE, W]];
  const plates = gaps.slice(1).map(([a], i): Span => [gaps[i]![1], a]);
  const weapons = WEAPON_W.map((_, i) => gridX + WEAPON_GAP * (i + 1) + WEAPON_W.slice(0, i).reduce((a, b) => a + b, 0));
  return { inv, invW: INVENTORY_W, run, runW: RUN_W, gridX, badge, gridW, weapons, gaps, plates };
}
