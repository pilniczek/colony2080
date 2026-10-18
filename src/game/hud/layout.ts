export type Span = [number, number];

export const HUD_H = 200;
export const HUD_MIN_W = 320;
export const VIEW_BOX = { left: 16, top: 27, right: 16, bottom: 8 };

const EDGE = 3.6;
const GAP = 3.6;
const INVENTORY_W = 62.5;
const BADGE_SPAN = 59.5;
const BADGE_GAPS: Span[] = [[-7.6, -4], [52.4, 56]];
const GRID_INSET = 18.4;
const MIN_EMPTY = 8;

export interface HudFit {
  W: number;
  unit: number;
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TopBar {
  inv: number;
  badge: number;
  gridW: number;
  gaps: Span[];
  plates: Span[];
  empty: Span | null;
}

export function hudFit(width: number, height: number): HudFit {
  const W = Math.max(HUD_MIN_W, (HUD_H * width) / height);
  const unit = Math.min(height / HUD_H, width / W);
  return { W, unit, x: (width - W * unit) / 2, y: (height - HUD_H * unit) / 2 };
}

export function viewRect({ W, unit, x, y }: HudFit): Rect {
  return {
    x: x + VIEW_BOX.left * unit,
    y: y + VIEW_BOX.top * unit,
    w: (W - VIEW_BOX.left - VIEW_BOX.right) * unit,
    h: (HUD_H - VIEW_BOX.top - VIEW_BOX.bottom) * unit,
  };
}

const badgeAt = (W: number): number => W - EDGE - INVENTORY_W - BADGE_SPAN;

export function topBar(W: number): TopBar {
  const inv = W - EDGE - INVENTORY_W;
  const badge = badgeAt(W);
  const badgeGaps = BADGE_GAPS.map(([a, b]): Span => [badge + a, badge + b]);
  const fixedEnd = badgeAt(HUD_MIN_W) + BADGE_GAPS[0]![0];
  const empty: Span = [fixedEnd + GAP, badgeGaps[0]![0]];
  const wide = empty[1] - empty[0] >= MIN_EMPTY;
  const gaps: Span[] = [[0, EDGE], ...(wide ? [[fixedEnd, empty[0]] as Span] : []), ...badgeGaps, [W - EDGE, W]];
  const plates = gaps.slice(1).map(([a], i): Span => [gaps[i]![1], a]);
  const gridW = plates[0]![1] - GRID_INSET;
  return { inv, badge, gridW, gaps, plates, empty: wide ? empty : null };
}
