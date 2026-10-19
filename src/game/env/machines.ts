import { P, type EnvAsset, type Size } from "./paint";

const { box, flat, poly, disc, hazard, glow, lw } = P;

type Pt = [number, number];
type PanelInner = (x: number, y: number, n: number) => void;

const cable = (ctx: CanvasRenderingContext2D, pts: Pt[], color: string, w = 1.5, outline = "mLine"): void => {
  const pal = P.pal();
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const trace = (): void => {
    const [first, ...rest] = pts as [Pt, ...Pt[]];
    ctx.beginPath();
    ctx.moveTo(first[0], first[1]);
    if (pts.length === 3) ctx.quadraticCurveTo(pts[1]![0], pts[1]![1], pts[2]![0], pts[2]![1]);
    else if (pts.length === 4) ctx.bezierCurveTo(pts[1]![0], pts[1]![1], pts[2]![0], pts[2]![1], pts[3]![0], pts[3]![1]);
    else rest.forEach((p) => ctx.lineTo(p[0], p[1]));
  };
  if (lw(ctx)) {
    trace();
    ctx.strokeStyle = pal[outline] || outline;
    ctx.lineWidth = w + lw(ctx) * 2;
    ctx.stroke();
  }
  trace();
  ctx.strokeStyle = pal[color] || color;
  ctx.lineWidth = w;
  ctx.stroke();
  ctx.restore();
};

const greenPanel = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, inner: PanelInner): void => {
  box(ctx, x, y, s, s, "green", 0);
  flat(ctx, x, y, s, 1.5, "c1");
  flat(ctx, x, y, 1.5, s, "c1");
  flat(ctx, x + s - 1.5, y + 1.5, 1.5, s - 1.5, "g0");
  flat(ctx, x + 1.5, y + s - 1.5, s - 1.5, 1.5, "g0");
  const i = s * 0.22;
  const n = s - i * 2;
  flat(ctx, x + i, y + i, n, n, "g1", "gLine");
  flat(ctx, x + i, y + i, n, 1, "g0");
  flat(ctx, x + i, y + i, 1, n, "g0");
  flat(ctx, x + i + 1, y + i + n - 1, n - 1, 1, "g3");
  flat(ctx, x + i + n - 1, y + i + 1, 1, n - 1, "g2");
  if (!P.simple()) {
    for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]] as Pt[]) disc(ctx, x + 2.5 + a * (s - 5), y + 2.5 + b * (s - 5), 0.6, "g3");
  }
  inner(x + i, y + i, n);
};

const wires = (ctx: CanvasRenderingContext2D, x: number, y: number, n: number): void => {
  flat(ctx, x + 1.5, y + 1.5, n - 3, 2, "m1", "mLine");
  const ends: [string, number][] = [["a1", 0.25], ["y2", 0.5], ["neon", 0.75]];
  for (const [c, k] of ends) cable(ctx, [[x + n * k, y + 3], [x + n * (k - 0.3), y + n * 0.9], [x + n * (k + 0.1), y + n * 0.95]], c, 1);
};

export const switchboard: EnvAsset = {
  id: "switchboard",
  box: [-3, -80, 30, 0],
  draw(ctx, state) {
    box(ctx, 0, -76, 26, 76, "concrete", 0, { vertical: true });
    box(ctx, -2, -78, 30, 5, "concrete", 1);
    box(ctx, -2, -5, 30, 5, "concrete", 1);
    if (!P.simple()) for (const y of [-62, -16]) flat(ctx, 2, y, 22, 0.8, "k0");
    greenPanel(ctx, 4, -54, 18, (x, y, n) => {
      if (state === 0) {
        flat(ctx, x + 1.5, y + 1.5, n - 3, 2, "m1", "mLine");
        for (const k of [0.3, 0.7]) cable(ctx, [[x + n * k, y + 3.5], [x + n * k - 0.5, y + 6]], "a1", 0.8);
        return;
      }
      wires(ctx, x, y, n);
    });
    const lit = state === 1;
    if (lit) glow(ctx, 19.5, -56.5, 7, "screen", 0.6);
    disc(ctx, 19.5, -56.5, 1.5, lit ? "screen" : "screenOff", "mLine");
    if (lit) cable(ctx, [[13, -36], [12, -24], [6, -18], [2, -6]], "y1", 1.2);
  },
};

const LIFT = { w: 50, top: -104, travel: 72, rail: 18 };

const shaft = (ctx: CanvasRenderingContext2D, w: number, top: number): void => {
  const rack = w / 2;
  for (const x of [rack - 14, rack + 14]) box(ctx, x - 1.5, top, 3, -top + 6, "concrete", 1, { vertical: true });
  box(ctx, rack - 2, top, 4, -top + 6, "concrete", 0, { vertical: true });
  const simple = P.simple();
  for (let y = top + 2; y < 6; y += simple ? 6 : 3.5) flat(ctx, rack - 3, y, 6, simple ? 2 : 1.2, "k2");
};

const platform = (ctx: CanvasRenderingContext2D, py: number, w: number): void => {
  const { rail } = LIFT;
  const rack = w / 2;
  poly(ctx, [[rack - 8, py + 7], [rack + 8, py + 7], [rack + 5, py + 13], [rack - 5, py + 13]], "steel", 1);
  if (!P.simple()) disc(ctx, rack, py + 9.5, 2, "c1", "mLine");
  hazard(ctx, 0, py + 3, w, 4, 3);
  box(ctx, 0, py, w, 3, "concrete", 2);
  for (const x of [1, w - 3]) box(ctx, x, py - rail, 2, rail, "concrete", 3, { vertical: true });
  box(ctx, 1, py - rail - 1, w - 2, 2, "concrete", 3);
  box(ctx, 1, py - rail / 2, w - 2, 1.5, "concrete", 2);
};

export const lift: EnvAsset = {
  id: "lift",
  box: [-4, -106, 54, 20],
  anim: true,
  draw(ctx, state, t, { w = LIFT.w, top = LIFT.top, py }: Size) {
    const k = (t * 0.35) % 1;
    const y = py ?? (state === 1 ? -k * LIFT.travel : state === 2 ? -(1 - k) * LIFT.travel : 0);
    shaft(ctx, w, top);
    platform(ctx, y, w);
  },
};

export const machineAssets: EnvAsset[] = [switchboard, lift];
