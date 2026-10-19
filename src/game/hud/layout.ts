export type Span = [number, number];

export const HUD_H = 200;
export const HUD_MIN_W = 320;
export const VIEW_BOX = { left: 11, top: 27, right: 11, bottom: 8 };

const EDGE = 1.2;
const GAP = 2;
const PLATE_PAD = 3.5;
const INVENTORY_W = 46.5;
const RUN_W = 14;
const BADGE_PLATE: Span = [-4, 52.4];
const BADGE_SPAN = BADGE_PLATE[1] + GAP + PLATE_PAD;
const BADGE_GAPS: Span[] = [[BADGE_PLATE[0] - GAP, BADGE_PLATE[0]], [BADGE_PLATE[1], BADGE_PLATE[1] + GAP]];
const GRID_MARGIN = 4.4;
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
  invW: number;
  run: number;
  runW: number;
  gridX: number;
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

const invAt = (W: number): number => W - EDGE - PLATE_PAD - INVENTORY_W;
const runAt = (W: number): number => invAt(W) - 2 * PLATE_PAD - GAP - RUN_W;
const badgeAt = (W: number): number => runAt(W) - BADGE_SPAN;

export function topBar(W: number): TopBar {
  const inv = invAt(W);
  const run = runAt(W);
  const badge = badgeAt(W);
  const runGap: Span = [run + RUN_W + PLATE_PAD, inv - PLATE_PAD];
  const badgeGaps = BADGE_GAPS.map(([a, b]): Span => [badge + a, badge + b]);
  const fixedEnd = badgeAt(HUD_MIN_W) + BADGE_GAPS[0]![0];
  const empty: Span = [fixedEnd + GAP, badgeGaps[0]![0]];
  const wide = empty[1] - empty[0] >= MIN_EMPTY;
  const gaps: Span[] = [[0, EDGE], ...(wide ? [[fixedEnd, empty[0]] as Span] : []), ...badgeGaps, runGap, [W - EDGE, W]];
  const plates = gaps.slice(1).map(([a], i): Span => [gaps[i]![1], a]);
  const gridX = EDGE + GRID_MARGIN;
  const gridW = plates[0]![1] - GRID_MARGIN - gridX;
  return { inv, invW: INVENTORY_W, run, runW: RUN_W, gridX, badge, gridW, gaps, plates, empty: wide ? empty : null };
}
