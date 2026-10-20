import type { Rect } from "../geometry";
import { ITEMS } from "../items";

export type Span = [number, number];

export const HUD_H = 200;
export const HUD_MIN_W = 320;
export const VIEW_BOX = { left: 11, top: 20.4, right: 11, bottom: 8 };

const EDGE = 0;
const GAP = 2;
const PLATE_PAD = 3.5;
const ITEM_SCALE = 0.8;
export const HAND_DRAWN = { w: 12, h: 13 };
export const HAND_BOX = { w: HAND_DRAWN.w * ITEM_SCALE, h: HAND_DRAWN.h * ITEM_SCALE };
export const HAND_INK_H = 13.3;
export const RUN_INK_H = 11.55;
export const SPEAKER_INK_H = 8.9;
export const ICON_H = HAND_INK_H * ITEM_SCALE * 0.9;
export const HAND_SCALE = ICON_H / HAND_INK_H;
export const RUN_SCALE = ICON_H / RUN_INK_H;
export const SPEAKER_SCALE = ICON_H / SPEAKER_INK_H;
export const READOUT_SIZE = 5.6;
const MONO_ADVANCE = 0.54;
const LONGEST_NAME = Math.max(...Object.values(ITEMS).map((item) => item.name.length));
const ICON_W = Math.max(HAND_BOX.w, ...Object.values(ITEMS).map((item) => HAND_BOX.w * item.icon.scale));
export const SLOT = { pad: PLATE_PAD, iconW: ICON_W, gap: 2 };
const INVENTORY_W = 2 * SLOT.pad + SLOT.iconW + SLOT.gap + LONGEST_NAME * READOUT_SIZE * MONO_ADVANCE;
export const WEAPON_W = [35, 20, 57];
const GRID_MARGIN = 4.4;
const WEAPON_GAP = 12;
export const TOGGLE_W = 12.5;
const TOGGLE_GAP = 2;
const BADGE_WINDOW_HALF = 24;

export interface HudFit {
  W: number;
  H: number;
  unit: number;
}

export interface TopBar {
  inv: number;
  invW: number;
  togglesX: number;
  togglesW: number;
  sound: number;
  run: number;
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
const WEAPONS_GRID_W = WEAPON_W.reduce((a, b) => a + b, 0) + (WEAPON_W.length + 1) * WEAPON_GAP;
const TOGGLES_W = 2 * TOGGLE_W + 3 * TOGGLE_GAP;

export function topBar(W: number): TopBar {
  const inv = invAt(W);
  const togglesX = inv - 2 * PLATE_PAD - GAP - TOGGLES_W;
  const sound = togglesX + TOGGLE_GAP;
  const run = sound + TOGGLE_W + TOGGLE_GAP;
  const gridX = EDGE + GRID_MARGIN;
  const gridW = WEAPONS_GRID_W;
  const weaponsEnd = gridX + gridW + GRID_MARGIN;
  const togglesStart = togglesX - PLATE_PAD;
  const badgeEnd = togglesStart - GAP;
  const badge = (weaponsEnd + GAP + badgeEnd) / 2 - BADGE_WINDOW_HALF;
  const togglesGap: Span = [togglesX + TOGGLES_W + PLATE_PAD, inv - PLATE_PAD];
  const gaps: Span[] = [[0, EDGE], [weaponsEnd, weaponsEnd + GAP], [badgeEnd, togglesStart], togglesGap, [W - EDGE, W]];
  const plates = gaps.slice(1).map(([a], i): Span => [gaps[i]![1], a]);
  const weapons = WEAPON_W.map((_, i) => gridX + WEAPON_GAP * (i + 1) + WEAPON_W.slice(0, i).reduce((a, b) => a + b, 0));
  return { inv, invW: INVENTORY_W, togglesX, togglesW: TOGGLES_W, sound, run, gridX, badge, gridW, weapons, gaps, plates };
}
