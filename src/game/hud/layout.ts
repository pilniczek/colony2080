import type { Rect } from "../geometry";
import { ITEMS } from "../items";

export type Span = [number, number];

export const HUD_H = 200;
export const HUD_MIN_W = 320;
export const CONTENT_SCALE = 0.75;
export const BAR_H = 20.4 * 0.8 * 0.9;
export const FRAME_W = 1.5;
export const PANEL_EDGE = 0.9;
export const SIDE_ART = { w: 11, bottom: 192, scale: 2 / 3 };
const SIDE_W = SIDE_ART.w * SIDE_ART.scale;
export const VIEW_BOX = { left: SIDE_W, top: BAR_H, right: SIDE_W, bottom: FRAME_W };

const EDGE = 0;
const GAP = 2;
const PANEL_INSET = 0.4;
const PLATE_PAD = PANEL_EDGE - PANEL_INSET;
const ITEM_SCALE = 0.8 * CONTENT_SCALE;
export const HAND_DRAWN = { w: 12, h: 13 };
export const HAND_BOX = { w: HAND_DRAWN.w * ITEM_SCALE, h: HAND_DRAWN.h * ITEM_SCALE };
export const HAND_INK_H = 13.3;
export const SPEAKER_INK_H = 8.2;
export const ICON_H = HAND_INK_H * ITEM_SCALE * 0.9;
export const HAND_SCALE = ICON_H / HAND_INK_H;
export const SPEAKER_H = ICON_H * 0.7;
export const SPEAKER_SCALE = SPEAKER_H / SPEAKER_INK_H;
export const SPEAKER_INK = { left: 4.4, right: 4.65 };
export const SPEAKER_W = (SPEAKER_INK.left + SPEAKER_INK.right) * SPEAKER_SCALE;
const MAP_INK_HALF = 4.5;
export const MAP_W = 2 * MAP_INK_HALF * SPEAKER_SCALE;
export const READOUT_SIZE = 5.6 * CONTENT_SCALE;
export const MONO_ADVANCE = 0.54;
const LONGEST_NAME = Math.max(...Object.values(ITEMS).map((item) => item.name.length));
const ICON_W = Math.max(HAND_BOX.w, ...Object.values(ITEMS).map((item) => HAND_BOX.w * item.icon.scale));
export const WEAPON_W = [35, 20, 45.5].map((w) => w * CONTENT_SCALE);
export const WEAPON_GAP = 12 * CONTENT_SCALE;
export const SLOT = { pad: WEAPON_GAP, iconW: ICON_W, gap: WEAPON_GAP };
const INVENTORY_W = 2 * SLOT.pad + SLOT.iconW + SLOT.gap + LONGEST_NAME * READOUT_SIZE * MONO_ADVANCE;
export const TOGGLE_W = ICON_H * 0.9;
const TOGGLE_GAP = WEAPON_GAP;
export const BADGE_W = 48 * CONTENT_SCALE;

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
  map: number;
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
const TOGGLES_W = SPEAKER_W + TOGGLE_W + MAP_W + 4 * TOGGLE_GAP;

export function topBar(W: number): TopBar {
  const inv = invAt(W);
  const togglesX = inv - 2 * PLATE_PAD - GAP - TOGGLES_W;
  const sound = togglesX + TOGGLE_GAP;
  const run = sound + SPEAKER_W + TOGGLE_GAP;
  const map = run + TOGGLE_W + TOGGLE_GAP;
  const gridX = EDGE + PLATE_PAD;
  const gridW = WEAPONS_GRID_W;
  const weaponsEnd = gridX + gridW + PLATE_PAD;
  const togglesStart = togglesX - PLATE_PAD;
  const badgeEnd = togglesStart - GAP;
  const badge = (weaponsEnd + GAP + badgeEnd) / 2 - BADGE_W / 2;
  const togglesGap: Span = [togglesX + TOGGLES_W + PLATE_PAD, inv - PLATE_PAD];
  const gaps: Span[] = [[0, EDGE], [weaponsEnd, weaponsEnd + GAP], [badgeEnd, togglesStart], togglesGap, [W - EDGE, W]];
  const plates = gaps.slice(1).map(([a], i): Span => [gaps[i]![1], a]);
  const weapons = WEAPON_W.map((_, i) => gridX + WEAPON_GAP * (i + 1) + WEAPON_W.slice(0, i).reduce((a, b) => a + b, 0));
  return { inv, invW: INVENTORY_W, togglesX, togglesW: TOGGLES_W, sound, run, map, gridX, badge, gridW, weapons, gaps, plates };
}
