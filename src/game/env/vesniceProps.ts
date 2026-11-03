import { G } from "./grime";
import { P, TILE, type EnvAsset } from "./paint";
import { craneKey } from "./props";
import { PLANK, gateBlock, gateRuin, outside, planks, rectPts, shadow, smoke, spark, steelGate, within } from "./vesnice";

const { rng, color, flat, box, poly, cylV, cylH, disc, rivets, glow, stroke, shape, line, curve, slab, hazard, text } = P;
const { PI, sin, cos, min, max, floor } = Math;

type Pt = [number, number];

const simple = (): boolean => P.simple();

const scuff = (ctx: CanvasRenderingContext2D, x: number, w: number): void => {
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = color("hole");
  ctx.beginPath();
  ctx.ellipse(x + w / 2, -0.5, w / 2, 0.9, 0, 0, PI * 2);
  ctx.fill();
  ctx.restore();
  if (simple()) return;
  for (const [dx, s] of [[0.15, 1], [0.55, 0.8], [0.8, 1.2]] as Pt[]) flat(ctx, x + w * dx, -1.4 * s, s, s * 0.8, "k2");
};

const ellipse = (ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, fill: string, edge: string | null = null): void => {
  ctx.fillStyle = color(fill);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, PI * 2);
  ctx.fill();
  if (edge) stroke(ctx, edge);
};

const wire = (ctx: CanvasRenderingContext2D, pts: Pt[], c: string, w = 0.8): void => {
  line(ctx, pts, "mLine", w + 0.6);
  line(ctx, pts, c, w);
};

const ring = (ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, c: string, w = 1): void => {
  ctx.save();
  ctx.lineWidth = w;
  ctx.strokeStyle = color(c);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, PI * 2);
  ctx.stroke();
  ctx.restore();
};

const lamp = (ctx: CanvasRenderingContext2D, x: number, y: number, c: string, lit = true, r = 1.2, halo = 4): void => {
  if (lit && !simple()) glow(ctx, x, y, halo, c, 0.6);
  disc(ctx, x, y, r, lit ? c : "k0", "mLine");
};

const arcBolt = (ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, w: number, t: number, seed: number, c = "plasma", k = 1): void => {
  const r = rng(Math.floor(t * 18) + seed * 101);
  const pts: Pt[] = [];
  const n = Math.max(4, Math.round((y1 - y0) / 6));
  for (let i = 0; i <= n; i++) pts.push([x + (i === 0 || i === n ? 0 : (r() - 0.5) * w), y0 + ((y1 - y0) * i) / n]);
  line(ctx, pts, c, 1.8 * k);
  line(ctx, pts, "plasmaCore", 0.7 * k);
};

const beamColumn = (ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, w: number, t: number): void => {
  if (!simple()) glow(ctx, x, (y0 + y1) / 2, (y1 - y0) * 0.6, "plasma", 0.35);
  ctx.save();
  ctx.globalAlpha = 0.55;
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, "rgba(122,224,255,0)");
  g.addColorStop(0.5, color("plasma"));
  g.addColorStop(1, "rgba(122,224,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - w / 2, y0, w, y1 - y0);
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.8 + i / 3) % 1;
    ring(ctx, x, y1 + (y0 - y1) * k, w * 0.45, 1.2, "plasmaCore", 0.5);
  }
};

const POD_TOP = -72;

const podFrame = (ctx: CanvasRenderingContext2D, seed: number): void => {
  box(ctx, 0, -6, 48, 6, "steel", 1);
  box(ctx, 2, -8, 44, 2.4, "steel", 2);
  box(ctx, 9, -56, 30, 48, "rust", 0);
  if (!simple()) for (let y = -50; y < -10; y += 8) flat(ctx, 10, y, 28, 0.6, "r1");
  for (const x of [3, 39]) {
    box(ctx, x, -58, 6, 50, "steel", 2, { vertical: true });
    for (const y of [-46, -32, -18]) cylV(ctx, x - 1, y, 8, 3, "chrome", 2);
  }
  ellipse(ctx, 24, -8.6, 13, 2, "m1", "mLine");
  G.grain(ctx, G.rectRegion(ctx, 9, -56, 30, 48), seed, 0.55);
  G.rustPatch(ctx, 15, -16, 3, 2, seed + 1);
  for (const x of [3, 39]) {
    G.grain(ctx, G.rectRegion(ctx, x, -58, 6, 50), seed + 2 + x, 0.6);
    within(ctx, [[x, -58, 6, 50]], () => G.drips(ctx, x, -58, 6, 24, seed + 3 + x, 1));
  }
  const base = [[0, -6, 48, 6], [2, -8, 44, 2.4]] as const;
  G.grain(ctx, G.rectsRegion(ctx, base), seed + 4, 0.6);
  within(ctx, base, () => G.dirt(ctx, 0, -8, 48, 8, seed + 5, 0.7));
  G.chips(ctx, 2, -8, 44, seed + 6);
};

const podBox = (ctx: CanvasRenderingContext2D, x: number, y: number, lampColor: string, lit: boolean, seed: number): void => {
  box(ctx, x, y, 9, 13, "steel", 1);
  flat(ctx, x, y, 9, 1.4, "m3", "mLine");
  for (let k = y + 2.6; k < y + 7.4; k += simple() ? 2.4 : 1.2) flat(ctx, x + 1.2, k, 6.6, 0.6, "c2");
  flat(ctx, x + 1.2, y + 8.4, 4.4, 3, lit ? "screen" : "screenOff", "mLine");
  lamp(ctx, x + 7, y + 9.9, lampColor, lit, 0.9, 3);
  G.grain(ctx, G.rectRegion(ctx, x, y, 9, 13), seed, 0.6);
  G.chips(ctx, x, y, 9, seed + 1);
  within(ctx, [[x - 1, y + 13, 6, 5]], () => G.drips(ctx, x, y + 13, 9, 5, seed + 2, 1));
};

const podHood = (ctx: CanvasRenderingContext2D, lampColor: string, lit: boolean, seed: number): void => {
  const hood: Pt[] = [[0, POD_TOP], [48, POD_TOP], [40, -58], [8, -58]];
  poly(ctx, hood, "steel", 2);
  G.grain(ctx, G.polyRegion(ctx, hood), seed + 7, 0.6);
  flat(ctx, 0, POD_TOP, 48, 2.2, "m3", "mLine");
  if (!simple()) {
    rivets(ctx, 4, -68, 40, 6, "m3");
    flat(ctx, 12, -63, 24, 0.6, "m0");
  }
  box(ctx, 18, -58, 12, 3, "chrome", 1);
  G.chips(ctx, 0, POD_TOP, 48, seed + 8);
  within(ctx, [[3, -58, 6, 12], [39, -58, 6, 12]], () => G.drips(ctx, 2, -58, 44, 12, seed + 9, 3));
  lamp(ctx, 24, POD_TOP - 1.5, lampColor, lit);
  podBox(ctx, 40, -54, lampColor, lit, seed + 12);
};

type PodMode = "idle" | "off" | "working" | "damaged";

const POD_LAMP: Record<PodMode, string> = { working: "screen", off: "k1", idle: "a1", damaged: "neon" };

const pod = (ctx: CanvasRenderingContext2D, mode: PodMode, t: number, seed: number): void => {
  podFrame(ctx, seed);
  if (mode === "working") beamColumn(ctx, 24, -55, -9, 24, t);
  if (mode === "idle" && !simple()) {
    ctx.save();
    ctx.globalAlpha = 0.25 + sin(t * 2) * 0.1;
    flat(ctx, 12, -55, 24, 46, "plasma");
    ctx.restore();
  }
  if (mode === "damaged") {
    const hole: Pt[] = [[14, -40], [20, -46], [26, -38], [22, -30], [16, -32]];
    G.scorch(ctx, hole, seed + 10);
    poly(ctx, hole, "hole", 2);
    G.rim(ctx, hole, seed + 11, "r3", "hole");
    line(ctx, [[30, -55], [32, -46], [29, -40], [31, -34]], "a1", 0.8);
    spark(ctx, 31, -34, t, 1);
    spark(ctx, 20, -56, t, 3);
  }
  podHood(ctx, POD_LAMP[mode], mode !== "off", seed);
};

const SOURCE_MODES: PodMode[] = ["idle", "off", "working"];

const TARGET_MODES: PodMode[] = ["damaged", "off", "working"];

const sourceTeleport: EnvAsset = {
  id: "sourceTeleport",
  box: [-2, -76, 51, 0],
  anim: true,
  draw(ctx, state, t) {
    pod(ctx, SOURCE_MODES[state] ?? "idle", t, 2100);
  },
};

const targetTeleport: EnvAsset = {
  id: "targetTeleport",
  box: [-2, -76, 51, 0],
  anim: true,
  draw(ctx, state, t) {
    pod(ctx, TARGET_MODES[state] ?? "damaged", t, 2120);
  },
};

const brokenTeleport: EnvAsset = {
  id: "brokenTeleport",
  box: [-4, -42, 54, 0],
  anim: true,
  draw(ctx, state, t) {
    box(ctx, 0, -6, 48, 6, "steel", 1);
    ellipse(ctx, 24, -6.6, 13, 1.6, "m0", "mLine");
    const shell: Pt[] = [[9, -6], [9, -26], [14, -31], [18, -24], [23, -33], [28, -22], [33, -28], [39, -20], [39, -6]];
    poly(ctx, shell, "rust", 0);
    ctx.save();
    G.polyRegion(ctx, shell)();
    ctx.clip();
    G.scorch(ctx, shell, 2160);
    ctx.restore();
    G.grain(ctx, G.polyRegion(ctx, shell), 2161, 0.7);
    G.inside(ctx, G.polyRegion(ctx, shell), () => G.rim(ctx, shell, 2162, "r3", "hole"));
    for (const [x, top] of [[3, -38], [39, -34]] as Pt[]) {
      poly(ctx, [[x, -6], [x, top + 3], [x + 2, top], [x + 4, top + 4], [x + 6, top + 1], [x + 6, -6]], "steel", 2, { dir: [1, 0] });
      cylV(ctx, x - 1, -20, 8, 3, "chrome", 2);
    }
    const debris: Pt[][] = [[[-2, 0], [4, -7], [12, -9], [10, -3], [14, 0]], [[38, 0], [41, -5], [49, -6], [52, 0]], [[0, -6], [48, -6], [48, 0], [0, 0]]];
    poly(ctx, debris[0]!, "steel", 1);
    poly(ctx, debris[1]!, "steel", 0);
    box(ctx, 16, -16, 16, 9, "steel", 0);
    if (state === 0) {
      flat(ctx, 18, -15, 12, 7, "g1", "gLine");
      for (let x = 19.5; x < 29; x += simple() ? 3 : 1.5) flat(ctx, x, -9.4, 0.5, 1.2, "y2");
      flat(ctx, 21, -13.6, 5, 3, "m0");
      if (!simple()) glow(ctx, 24, -11, 6, "screen", 0.25 + sin(t * 3) * 0.15);
    } else flat(ctx, 18, -15, 12, 7, "hole", "mLine");
    ctx.save();
    ctx.beginPath();
    for (const pts of debris) {
      ctx.moveTo(pts[0]![0], pts[0]![1]);
      for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
      ctx.closePath();
    }
    ctx.clip();
    G.grain(ctx, G.rectRegion(ctx, -2, -9, 54, 9), 2163, 0.6);
    G.dirt(ctx, -2, -9, 54, 9, 2164, 0.7);
    G.rustPatch(ctx, 8, -3, 3, 1.5, 2165);
    ctx.restore();
    podBox(ctx, 40, -32, POD_LAMP.damaged, state === 0 && floor(t * 3) % 2 === 0, 2166);
    line(ctx, [[30, -24], [33, -18], [30, -14]], "a1", 0.8);
    spark(ctx, 30, -14, t, 5);
  },
};

const teleportPad: EnvAsset = {
  id: "teleportPad",
  box: [-2, -76, 51, 0],
  anim: true,
  draw(ctx, _state, t) {
    pod(ctx, "working", t, 2140);
  },
};

const fuseScreen = (ctx: CanvasRenderingContext2D, x: number, y: number, state: number, t: number): void => {
  flat(ctx, x, y, 9, 4, state === 1 ? "screenOff" : "hole", "gLine");
  if (state === 1) return;
  const blink = Math.floor(t * 2) % 2;
  for (let i = 0; i < 3; i++) flat(ctx, x + 1 + i * 2.7, y + 0.8, 1.8, 2.4, i === 2 && blink ? "g1" : "screen");
};

const fuseBox: EnvAsset = {
  id: "fuseBox",
  box: [-6, -76, 30, 0],
  anim: true,
  draw(ctx, state, t) {
    box(ctx, 0, -72, 24, 72, "concrete", 1, { vertical: true });
    box(ctx, -2, -74, 28, 4, "concrete", 2);
    box(ctx, -2, -4, 28, 4, "concrete", 1);
    if (!simple()) for (const y of [-60, -24]) flat(ctx, 1, y, 22, 0.6, "k0");
    within(ctx, [[0, -72, 24, 72]], () => G.surface(ctx, 0, -70, 24, 66, 2180, { rise: 0.3, drip: 2, dripLen: 26 }));
    G.chips(ctx, -2, -74, 28, 2181);
    cylV(ctx, 10, -30, 4, 28, "steel", 1);
    box(ctx, 3, -46, 18, 17, "green", 1);
    flat(ctx, 3, -46, 18, 1.2, "g3");
    box(ctx, 4.6, -44.6, 14.8, 14.2, "green", 2);
    G.drips(ctx, 3, -29, 18, 8, 2182, 2);
    G.chips(ctx, 3, -46, 18, 2183, G.DIRT);
    fuseScreen(ctx, 7.6, -43, state, t);
    for (const x of [7, 11, 15]) {
      if (state === 1 && x === 11) {
        flat(ctx, x - 0.2, -37.8, 3, 6.2, "hole", "gLine");
        for (const y of [-37.8, -32.8]) flat(ctx, x + 0.3, y, 2, 1, "c1", "mLine");
        continue;
      }
      const fresh = state === 2 && x === 11;
      box(ctx, x, -37.4, 2.6, 5.4, fresh ? "yellow" : "chrome", 2, { vertical: true });
      if (fresh && !simple()) glow(ctx, x + 1.3, -34.6, 4, "y3", 0.4);
    }
    lamp(ctx, 19, -48.6, state === 1 ? "neon" : "screen", state !== 1 || Math.floor(t * 3) % 2 === 0);
  },
};

const electricCabinet: EnvAsset = {
  id: "electricCabinet",
  box: [-2, -78, 100, 0],
  draw(ctx, state) {
    slab(ctx, 0, -72, 96, 72, "concrete", 2);
    flat(ctx, -1, -75, 98, 4, "k3", "kLine");
    flat(ctx, 0, -3, 96, 3, "k0", "kLine");
    within(ctx, [[0, -72, 96, 72]], () => G.surface(ctx, 0, -71, 96, 68, 2200, { rise: 0.35, drip: 5, dripLen: 30 }));
    G.chips(ctx, -1, -75, 98, 2201);
    G.grain(ctx, G.rectRegion(ctx, -1, -75, 98, 4), 2204, 1);
    G.dirt(ctx, -1, -75, 98, 4, 2205, 0.6);
    within(ctx, [[-1, -75, 98, 4], [0, -72, 96, 72]], () => {
      for (const [x, r] of [[14, 3], [52, 4], [84, 2.6]] as Pt[]) G.rustPatch(ctx, x, -73, r, 1.2, 2206 + x);
      G.drips(ctx, -1, -71, 98, 12, 2207, 7);
    });
    G.chips(ctx, -1, -72, 98, 2208, G.DIRT);
    for (const x of [6, 70]) {
      box(ctx, x, -60, 20, 50, "steel", 1);
      for (let y = -56; y < -12; y += simple() ? 8 : 4) flat(ctx, x + 2, y, 16, 1.8, "m3");
      G.grain(ctx, G.rectRegion(ctx, x, -60, 20, 50), 2202 + x, 0.6);
      G.rustPatch(ctx, x + 14, -14, 2.5, 1.5, 2203 + x);
    }
    box(ctx, 32, -58, 32, 56, "steel", 0);
    if (state === 0) {
      box(ctx, 34, -56, 28, 54, "chrome", 1);
      flat(ctx, 34, -56, 28, 1.4, "c3");
      G.grain(ctx, G.rectRegion(ctx, 34, -56, 28, 54), 2210, 0.6);
      G.drips(ctx, 34, -56, 28, 22, 2211, 3);
      G.dirt(ctx, 34, -56, 28, 54, 2212, 0.25);
      shape(ctx, [[48, -46], [53.4, -36.4], [42.6, -36.4]], "hazardDark", "kLine");
      shape(ctx, [[48, -44.2], [51.8, -37.4], [44.2, -37.4]], "hazard");
      shape(ctx, [[48.6, -43], [46.2, -39.8], [48, -39.8], [47.2, -37.8], [50, -40.8], [48.2, -40.8], [49.2, -43]], "hazardDark");
      box(ctx, 56, -30, 3, 7, "steel", 2);
      lamp(ctx, 57.5, -33, "neon");
    } else {
      flat(ctx, 34, -56, 28, 54, "hole", "mLine");
      for (const y of [-46, -34, -22]) flat(ctx, 36, y, 24, 1.4, "m2", "mLine");
      for (const [x, y] of [[40, -45], [50, -45], [40, -33], [50, -21]] as Pt[]) box(ctx, x, y - 5, 2.6, 5, "chrome", 2, { vertical: true });
      flat(ctx, 50, -38.4, 2.6, 5, "m0");
      poly(ctx, [[34, -56], [26, -60], [26, 2], [34, -2]], "chrome", 0, { dir: [1, 0] });
      G.grain(ctx, G.polyRegion(ctx, [[34, -56], [26, -60], [26, 2], [34, -2]]), 2213, 0.6);
      lamp(ctx, 57.5, -60, "screen");
    }
  },
};

const TRACK_R = 6.6;
const ROAD_WHEELS = [66, 83, 100, 117, 134];

const roadWheel = (ctx: CanvasRenderingContext2D, x: number, seed: number): void => {
  const y = -TRACK_R;
  ellipse(ctx, x, y, 5.6, 5.6, "m1", "kLine");
  ellipse(ctx, x, y, 4.2, 4.2, "m2", "mLine");
  ellipse(ctx, x, y, 1.8, 1.8, "m1", "mLine");
  if (!simple()) for (let i = 0; i < 6; i++) flat(ctx, x + cos((i / 6) * PI * 2) * 3 - 0.4, y + sin((i / 6) * PI * 2) * 3 - 0.4, 0.8, 0.8, "m3");
  G.inside(ctx, G.polyRegion(ctx, circle(x, y, 5.6)), () => {
    G.rustPatch(ctx, x + 1.6, y - 2.4, 1.6, 1, seed);
    G.dirt(ctx, x - 5.6, y - 2, 11.2, 7.6, seed + 1, 0.7);
  });
};

const track = (ctx: CanvasRenderingContext2D): void => {
  const x0 = 52, x1 = 150, h = TRACK_R * 2;
  const belt: Pt[] = [[x0 + TRACK_R, -h], [x1 - TRACK_R, -h], [x1, -TRACK_R], [x1 - TRACK_R, 0], [x0 + TRACK_R, 0], [x0, -TRACK_R]];
  shape(ctx, belt, "k1", "kLine");
  ellipse(ctx, x0 + TRACK_R, -TRACK_R, TRACK_R, TRACK_R, "k1", "kLine");
  ellipse(ctx, x1 - TRACK_R, -TRACK_R, TRACK_R, TRACK_R, "k1", "kLine");
  if (!simple()) for (let x = x0 + TRACK_R; x < x1 - TRACK_R; x += 3) {
    flat(ctx, x, -h, 1.6, 1.2, "k3");
    flat(ctx, x + 1.5, -1.2, 1.6, 1.2, "k3");
  }
  ellipse(ctx, x0 + TRACK_R, -TRACK_R, 4.4, 4.4, "m2", "mLine");
  if (!simple()) for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PI * 2;
    flat(ctx, x0 + TRACK_R + cos(a) * 4.6 - 0.6, -TRACK_R + sin(a) * 4.6 - 0.6, 1.2, 1.2, "m1");
  }
  disc(ctx, x0 + TRACK_R, -TRACK_R, 1.6, "c1", "mLine");
  ellipse(ctx, x1 - TRACK_R, -TRACK_R, 4.4, 4.4, "m2", "mLine");
  disc(ctx, x1 - TRACK_R, -TRACK_R, 1.6, "m1", "mLine");
  for (const x of ROAD_WHEELS) roadWheel(ctx, x, 2269 + x);
  G.grain(ctx, G.polyRegion(ctx, belt), 2280, 0.8);
  G.inside(ctx, G.polysRegion(ctx, [belt, circle(x0 + TRACK_R, -TRACK_R, TRACK_R), circle(x1 - TRACK_R, -TRACK_R, TRACK_R)]), () => {
    G.dirt(ctx, x0, -h, x1 - x0, h, 2281, 0.9);
    G.rustPatch(ctx, 92, -11.4, 3, 0.8, 2282);
  });
};

const CANNON_BODY: Pt[] = [[56, -16], [60, -48], [76, -60], [138, -60], [148, -48], [146, -16]];

const cannon: EnvAsset = {
  id: "cannon",
  box: [-14, -78, 160, 0],
  anim: true,
  draw(ctx, state, t) {
    const age = t % 1.6;
    const kick = state === 1 ? max(0, 1 - age * 3) * 6 : 0;
    shadow(ctx, 100, 104, 0.5);
    track(ctx);
    box(ctx, 54, -18, 94, 5, "steel", 1);
    G.grain(ctx, G.rectRegion(ctx, 54, -18, 94, 5), 2260, 0.6);
    G.dirt(ctx, 54, -18, 94, 5, 2261, 0.6);
    flat(ctx, 52, -15.4, 96, 2, "m3", "mLine");
    ctx.save();
    ctx.translate(kick, 0);
    cylH(ctx, 6, -45, 66, 7, "chrome", 1);
    cylH(ctx, 0, -46.6, 9, 10.2, "chrome", 0);
    if (!simple()) for (const x of [2, 5]) flat(ctx, x, -45.4, 1.2, 7.8, "hole");
    cylH(ctx, 40, -47, 8, 11, "chrome", 2);
    cylH(ctx, 50, -36, 30, 4, "steel", 2);
    const barrel = [[6, -45, 66, 7], [0, -46.6, 9, 10.2], [40, -47, 8, 11], [50, -36, 30, 4]] as const;
    G.grain(ctx, G.rectsRegion(ctx, barrel), 2262, 0.5);
    within(ctx, barrel, () => G.rustPatch(ctx, 30, -43, 3, 1.4, 2263));
    ctx.restore();
    poly(ctx, CANNON_BODY, "steel", 1);
    poly(ctx, [[76, -60], [138, -60], [136, -54], [80, -54]], "steel", 2, { line: false });
    poly(ctx, [[60, -48], [76, -60], [80, -54], [66, -44]], "m3", 2, { line: false });
    box(ctx, 98, -50, 26, 14, "steel", 0);
    if (!simple()) {
      rivets(ctx, 62, -27, 82, 7, "m3");
      for (let x = 101; x < 122; x += 3) flat(ctx, x, -48, 1.2, 10, "m0");
    }
    hazard(ctx, 58, -22, 88, 5, 4);
    poly(ctx, [[138, -50], [152, -46], [152, -24], [146, -20]], "steel", 1, { dir: [1, 0] });
    G.grain(ctx, G.polyRegion(ctx, CANNON_BODY), 2264, 0.6);
    ctx.save();
    G.polyRegion(ctx, CANNON_BODY)();
    ctx.clip();
    G.drips(ctx, 62, -58, 82, 24, 2265, 6);
    ctx.restore();
    G.rustPatch(ctx, 128, -32, 5, 2.5, 2266);
    G.chips(ctx, 76, -60, 62, 2267);
    G.inside(ctx, G.polyRegion(ctx, CANNON_BODY), () => G.dirt(ctx, 56, -48, 92, 32, 2268, 0.3));
    if (state === 1 && age < 0.5) {
      const k = 1 - age * 2;
      glow(ctx, -6, -42, 18 * k + 6, "a2", 0.8 * k);
      poly(ctx, [[1, -48], [-10 * k - 4, -52], [-6, -44], [-14 * k - 6, -41], [-6, -38], [-10 * k - 4, -32], [1, -36]], "a1", 2);
      poly(ctx, [[1, -45], [-6 * k - 2, -44], [-8 * k - 3, -41], [-6 * k - 2, -38], [1, -38]], "y3", 2, { line: false });
    }
    if (state === 1 && !simple()) {
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const k = min(1, age * 1.2 + i * 0.12);
        ctx.globalAlpha = 0.45 * (1 - k);
        ellipse(ctx, -4 - k * 10 + i * 3, -42 - k * 18 - i * 4, 4 + k * 8, 3 + k * 5, "k2");
      }
      ctx.restore();
    }
  },
};

const BAR_TOP = -150;

const hangerBar = (ctx: CanvasRenderingContext2D, top: number): void => {
  const bar = [[8, top, 8, -96 - top]] as const;
  box(ctx, 8, top, 8, -96 - top, "steel", 1, { vertical: true });
  flat(ctx, 11, top, 1.4, -96 - top, "m3");
  if (!simple()) for (let y = top + 10; y < -100; y += 12) disc(ctx, 12, y, 0.9, "m2", "mLine");
  box(ctx, 2, top, 20, 5, "steel", 1);
  for (const x of [5, 19]) disc(ctx, x, top + 2.5, 1, "m2", "mLine");
  box(ctx, 5, -101, 14, 5, "steel", 1);
  for (const x of [8, 16]) disc(ctx, x, -98.5, 0.9, "m2", "mLine");
  const mount = [...bar, [2, top, 20, 5], [5, -101, 14, 5]] as const;
  G.grain(ctx, G.rectsRegion(ctx, mount), 2245, 0.6);
  within(ctx, mount, () => {
    for (let y = top + 8, i = 0; y < -110; y += 40, i++) {
      G.drips(ctx, 8, y, 8, 14, 2247 + i, 2);
      if (i % 2 === 0) G.rustPatch(ctx, 12, y + 18, 2.4, 4, 2248 + i);
    }
    G.drips(ctx, 5, -97, 14, 4, 2246, 2);
  });
};

const energyBarrier: EnvAsset = {
  id: "energyBarrier",
  box: [-4, BAR_TOP, 28, 0],
  anim: true,
  draw(ctx, state, t, size) {
    const on = state === 0;
    hangerBar(ctx, size?.top ?? BAR_TOP);
    if (on && !simple()) glow(ctx, 12, -48, 30, "plasma", 0.25 + sin(t * 13) * 0.06);
    if (on) {
      arcBolt(ctx, 12, -86, -4, 10, t, 1);
      arcBolt(ctx, 12, -86, -4, 8, t + 0.37, 2, "plasma", 0.6);
    }
    box(ctx, 0, -96, 24, 10, "steel", 1);
    box(ctx, 6, -86, 12, 3, "chrome", 1);
    flat(ctx, 2, -94, 20, 2, "hazard", "yLine");
    G.grain(ctx, G.rectsRegion(ctx, [[0, -96, 24, 10], [6, -86, 12, 3]]), 2240, 0.6);
    G.chips(ctx, 0, -96, 24, 2241);
    within(ctx, [[0, -96, 24, 10], [6, -86, 12, 3]], () => G.drips(ctx, 0, -92, 24, 10, 2242, 2));
    box(ctx, 4, -4, 16, 4, "steel", 1);
    box(ctx, 8, -6, 8, 2.4, "chrome", 1);
    const foot = [[4, -4, 16, 4], [8, -6, 8, 2.4]] as const;
    G.grain(ctx, G.rectsRegion(ctx, foot), 2243, 0.6);
    within(ctx, foot, () => G.dirt(ctx, 4, -6, 16, 6, 2244, 0.7));
    lamp(ctx, 12, -84, "plasma", on);
  },
};

const stick = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void => {
  box(ctx, x, y, w, h, "brick", 2, { vertical: w < h });
  if (!simple()) flat(ctx, x + (w < h ? w * 0.2 : 0.4), y + (w < h ? 0.4 : h * 0.2), w < h ? w * 0.2 : w - 0.8, w < h ? h - 0.8 : h * 0.2, "b3");
};

const fireBarricade: EnvAsset = {
  id: "fireBarricade",
  box: [-30, -76, 52, 0],
  anim: true,
  draw(ctx, state, t) {
    if (state === 1) {
      gateRuin(ctx, 24, 2290);
      if (!simple()) smoke(ctx, 40, -30, t, 3, 30);
      return;
    }
    gateBlock(ctx, 24, 2284);
    steelGate(ctx, 0, 2286);
  },
};

const dynamiteWall: EnvAsset = {
  id: "dynamiteWall",
  box: [-4, -76, 34, 0],
  anim: true,
  draw(ctx, state, t) {
    steelGate(ctx, 0, 2296);
    if (state === 1) {
      for (const x of [6, 9, 12]) stick(ctx, x, -14, 3, 14);
      for (const y of [-11, -4]) flat(ctx, 5.6, y, 9.8, 1.4, "k1", "kLine");
      box(ctx, 7.6, -9, 5.2, 3.6, "steel", 1);
      lamp(ctx, 11.4, -7.2, "neon", Math.floor(t * 3) % 2 === 0);
      wire(ctx, [[10, -9], [11, -16], [16, -12], [20, -2], [30, -0.6]], "y2");
    }
  },
};

const anchor = (ctx: CanvasRenderingContext2D, x: number, flip: boolean): void => {
  ctx.save();
  ctx.translate(x, 0);
  if (flip) ctx.scale(-1, 1);
  box(ctx, 0, 0, TILE, 7, "steel", 2);
  poly(ctx, [[0, 7], [TILE, 7], [TILE - 4, 12], [8, 12]], "steel", 0);
  box(ctx, 2, -3, 8, 3, "steel", 1);
  if (!simple()) rivets(ctx, 0, 3.5, TILE, 6, "m3");
  const body: Pt[][] = [rectPts(0, 0, TILE, 7), [[0, 7], [TILE, 7], [TILE - 4, 12], [8, 12]], rectPts(2, -3, 8, 3)];
  G.grain(ctx, G.polysRegion(ctx, body), 2300 + x, 0.6);
  G.inside(ctx, G.polysRegion(ctx, body), () => G.drips(ctx, 0, 3, TILE, 9, 2301 + x, 2));
  G.chips(ctx, 0, 0, TILE, 2302 + x);
  ctx.restore();
};

const powerBridge: EnvAsset = {
  id: "powerBridge",
  box: [-4, -6, 292, 14],
  draw(ctx, state) {
    anchor(ctx, 0, false);
    anchor(ctx, 288, true);
    if (state === 0) {
      box(ctx, TILE, 0.4, 240, 2.6, "chrome", 2);
      if (!simple()) for (let x = TILE + 12; x < 264; x += 24) flat(ctx, x, 0.8, 1, 1.6, "c0");
      G.grain(ctx, G.rectRegion(ctx, TILE, 0.4, 240, 2.6), 2310, 0.5);
      within(ctx, [[TILE, 0.4, 240, 2.6]], () => {
        for (const x of [62, 150, 221]) G.rustPatch(ctx, x, 1.7, 3, 0.9, 2311 + x);
      });
      return;
    }
    poly(ctx, [[TILE, 0.4], [TILE + 10, 1.6], [TILE + 9, 3.4], [TILE, 3]], "chrome", 1);
    poly(ctx, [[264, 0.4], [254, 2.8], [255, 4.2], [264, 3]], "chrome", 1);
    G.inside(ctx, G.polysRegion(ctx, [[[TILE, 0.4], [TILE + 10, 1.6], [TILE + 9, 3.4], [TILE, 3]], [[264, 0.4], [254, 2.8], [255, 4.2], [264, 3]]]), () => {
      G.rustPatch(ctx, TILE + 4, 2, 2.5, 1, 2312);
      G.rustPatch(ctx, 260, 2, 2.5, 1, 2313);
    });
  },
};

const WALKER: Pt[][] = [
  [[0.5, -2.2], [-0.3, 1]],
  [[-0.3, 1], [0.9, 2.8], [1.2, 5]],
  [[-0.3, 1], [-1.3, 2.9], [-2.8, 4.4]],
  [[0.3, -1.4], [1.6, 0], [2.2, 1.4]],
  [[0.3, -1.4], [-0.9, -0.1], [-1.6, 1.2]],
];

const circle = (cx: number, cy: number, r: number, n = 20): Pt[] => Array.from({ length: n }, (_, i): Pt => [cx + cos((i / n) * PI * 2) * r, cy + sin((i / n) * PI * 2) * r]);

const noWalkingSign = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void => {
  disc(ctx, x, y, r + 0.5, "m1", "kLine");
  disc(ctx, x, y, r, "fs2");
  disc(ctx, x, y, r * 0.78, "c3");
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(r / 6.4, r / 6.4);
  disc(ctx, 0.9, -3.6, 1.05, "k0");
  for (const limb of WALKER) line(ctx, limb, "k0", 1.15);
  flat(ctx, 0.9, 4.6, 1.4, 0.5, "k0");
  flat(ctx, -3.4, 4.1, 1.2, 0.5, "k0");
  ctx.restore();
  line(ctx, [[x - r * 0.56, y - r * 0.56], [x + r * 0.56, y + r * 0.56]], "fs1", r * 0.17, "butt");
  ctx.save();
  ctx.globalAlpha = 0.24;
  disc(ctx, x, y, r, "c1");
  ctx.restore();
  const face = G.polyRegion(ctx, circle(x, y, r));
  G.grain(ctx, face, 1024, 0.75);
  ctx.save();
  face();
  ctx.clip();
  G.dirt(ctx, x - r, y - r, r * 2, r * 2, 1025, 0.45);
  G.rustPatch(ctx, x + r * 0.62, y + r * 0.5, r * 0.28, r * 0.2, 1026);
  G.rustPatch(ctx, x - r * 0.7, y - r * 0.2, r * 0.16, r * 0.14, 1027);
  if (!simple()) {
    line(ctx, [[x - r * 0.5, y + r * 0.3], [x - r * 0.1, y + r * 0.42]], "m2", 0.3);
    line(ctx, [[x + r * 0.1, y - r * 0.62], [x + r * 0.42, y - r * 0.5]], "m2", 0.3);
  }
  ctx.restore();
  G.drips(ctx, x - r * 0.3, y + r * 0.8, r * 0.6, r * 1.4, 1028, 2);
  disc(ctx, x, y - r * 0.9, 0.5, "m3", "mLine");
};

const bridgeGuardPost: EnvAsset = {
  id: "bridgeGuardPost",
  box: [-54, -152, 30, 0],
  draw(ctx, state) {
    planks(ctx, -2, -144, 26, 144, 1020, true);
    const window = rectPts(2, -128, 18, 14);
    flat(ctx, 2, -128, 18, 14, "#0a0806", PLANK[4]);
    shape(ctx, [[-6, -144], [11, -152], [28, -144]], PLANK[2], PLANK[4]);
    flat(ctx, -4, -146, 30, 3, PLANK[3], PLANK[4]);
    box(ctx, -6, -40, 8, 40, "steel", 1, { vertical: true });
    const up = state === 1;
    ctx.save();
    ctx.translate(-2, -34);
    ctx.rotate(up ? PI / 2.2 : 0);
    flat(ctx, -46, -2.5, 46, 5, "k3", "kLine");
    for (let x = -42; x < -2; x += 10) flat(ctx, x, -2.5, 5, 5, "neon");
    ctx.restore();
    flat(ctx, 10.4, -102, 1.2, 4, "m1", "mLine");
    noWalkingSign(ctx, 11, -94, 7);
    within(ctx, [[-2, -144, 26, 144]], () => outside(ctx, [window], () => G.drips(ctx, -2, -144, 26, 60, 1021, 3)));
    G.rustPatch(ctx, -2, -18, 2.5, 4, 1022);
    G.chips(ctx, -4, -146, 30, 1023, G.DIRT);
  },
};

const BONE = ["#34322a", "#5e5a4a", "#8c8670", "#b4ac92"] as const;

const bone = (ctx: CanvasRenderingContext2D, pts: Pt[], w: number): void => {
  line(ctx, pts, "kLine", w + 1);
  line(ctx, pts, BONE[2], w);
  if (!simple()) line(ctx, pts.map(([x, y]): Pt => [x, y - w * 0.22]), BONE[3], w * 0.3);
};

const knob = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void => disc(ctx, x, y, r, BONE[2], "kLine");

const CRANIUM: Pt[] = [[1.4, -1.2], [0.2, -4], [0.8, -7.2], [3, -9.6], [6.2, -10.8], [8.6, -10.6], [10, -11.4], [11.2, -10.6], [12, -9.4], [11, -8.6], [9.4, -7], [9.6, -4.6], [8, -2.4], [5, -0.8]];
const JAW: Pt[] = [[8.6, -4.2], [9.8, -6.8], [11, -8.2], [12.6, -8.8], [13.6, -8.4], [13.4, -7.4], [11.6, -6.6], [10.6, -4.4], [9.6, -3.4]];
const PELVIS: Pt[] = [[29.6, -1.4], [29.8, -5.2], [31, -8.4], [33.2, -9], [35.2, -7.2], [35.6, -4.4], [34.6, -1.2], [32, -0.6]];
const STERNUM: Pt[] = [[15.6, -8.6], [17, -9.4], [23.4, -8.2], [24.6, -7.2], [23.2, -7], [17, -7.8]];
const SCAPULA: Pt[] = [[13.6, -1.2], [14.4, -4.4], [17.6, -3], [20, -1.4], [17, -0.8]];
const RIBS = 7;

const vertebrae = (ctx: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number, r: number): void => {
  bone(ctx, [[x0, y0], [x1, y1]], r * 1.1);
  if (simple()) return;
  const n = Math.max(2, Math.round((x1 - x0) / (r * 1.8)));
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    disc(ctx, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, r * 0.8, BONE[2], "kLine");
    flat(ctx, x0 + (x1 - x0) * k - 0.25, y0 + (y1 - y0) * k - r * 1.4, 0.5, r * 0.8, BONE[1]);
  }
};

const ribs = (ctx: CanvasRenderingContext2D, near: boolean): void => {
  for (let i = 0; i < RIBS; i++) {
    const x = 15 + i * 1.8;
    const top = -9.4 + i * 0.25 + (i > 4 ? (i - 4) * 0.7 : 0);
    const end = i < 5 ? 17 + i * 1.3 : 20.6 + i * 1.5;
    const pts: Pt[] = [[x, -2.2], [x - 1.4 + i * 0.1, top + 2.4], [x + 0.6, top], [end, top + 0.6 + (i > 4 ? 1.4 : 0)]];
    curve(ctx, pts, "kLine", near ? 1.5 : 1.3);
    curve(ctx, pts, near ? BONE[2] : BONE[1], near ? 0.8 : 0.6);
  }
};

const skeleton = (ctx: CanvasRenderingContext2D, seed: number): void => {
  bone(ctx, [[33.4, -2.6], [41.4, -2.2]], 1.3);
  bone(ctx, [[41.4, -1.9], [48.6, -1.6]], 1.1);
  line(ctx, [[42, -1], [48.4, -0.8]], BONE[1], 0.5);
  ribs(ctx, false);
  disc(ctx, 41.4, -2.1, 1.3, BONE[1], "kLine");
  shape(ctx, SCAPULA, BONE[1], "kLine");
  vertebrae(ctx, 9.4, 14.2, -3.4, -2.6, 0.9);
  vertebrae(ctx, 14.2, 26, -2.4, -2.2, 0.85);
  vertebrae(ctx, 26, 30.6, -2.4, -3, 1.05);
  ribs(ctx, true);
  shape(ctx, STERNUM, BONE[2], "kLine");
  bone(ctx, [[15.8, -8.4], [14.6, -5.2]], 0.8);
  shape(ctx, PELVIS, BONE[2], "kLine");
  ellipse(ctx, 33.4, -2.8, 1.1, 0.8, "hole");
  if (!simple()) curve(ctx, [[30.6, -6.6], [32.4, -8], [34.4, -7.2]], BONE[3], 0.5);
  bone(ctx, [[14.8, -4.4], [19, -2.4], [22.6, -1.4]], 1.2);
  knob(ctx, 14.8, -4.4, 1.3);
  knob(ctx, 22.6, -1.5, 1);
  bone(ctx, [[22.8, -1.8], [28.6, -1.6]], 0.6);
  bone(ctx, [[22.8, -0.9], [28.6, -0.9]], 0.75);
  for (const [dx, dy] of [[0, -1.8], [0.4, -1.2], [0.2, -0.6]] as Pt[]) bone(ctx, [[29 + dx, -1.3], [31.6 + dx, dy - 0.2], [33 + dx, dy + 0.1]], 0.4);
  disc(ctx, 29.2, -1.3, 0.9, BONE[2], "kLine");
  knob(ctx, 34, -4.6, 1.6);
  bone(ctx, [[34, -4.6], [37.4, -10.4], [39.6, -15.6]], 1.7);
  bone(ctx, [[41.2, -14.8], [43.4, -8.4], [45, -2.6]], 0.6);
  bone(ctx, [[40.2, -15.2], [42.2, -8.6], [43.8, -2.6]], 1.2);
  knob(ctx, 40, -15.6, 1.8);
  disc(ctx, 40.8, -16.4, 0.9, BONE[3], "kLine");
  shape(ctx, [[43, -3.4], [45.4, -3.6], [45.6, -1.6], [43.8, -0.4], [42.2, -0.6], [42.4, -2]], BONE[2], "kLine");
  for (const [dy, end] of [[-1.6, 50.4], [-1.1, 50.8], [-0.6, 50.2]] as Pt[]) bone(ctx, [[45.4, dy - 0.4], [48.6, dy], [end, dy + 0.3]], 0.42);
  ctx.save();
  ctx.translate(10, -1);
  ctx.scale(0.78, 0.78);
  ctx.translate(-10, 1);
  shape(ctx, CRANIUM, BONE[2], "kLine");
  if (!simple()) shape(ctx, [[2, -7], [3.6, -9.2], [6.4, -10.2], [5, -8.6], [3, -6.4]], BONE[3]);
  shape(ctx, JAW, BONE[2], "kLine");
  ellipse(ctx, 8.2, -8.8, 1.5, 1.1, "hole");
  shape(ctx, [[10.2, -10.6], [11, -10.8], [10.8, -9.8]], "hole");
  ellipse(ctx, 6.6, -4.6, 0.9, 0.7, "hole");
  if (!simple()) {
    for (let x = 11.2; x < 13.2; x += 0.6) flat(ctx, x, -9.6 + (x - 11.2) * 0.35, 0.35, 0.9, BONE[3]);
    curve(ctx, [[1.6, -5.4], [4.4, -6.4], [7.4, -6.6]], BONE[1], 0.4);
  }
  G.grain(ctx, G.polyRegion(ctx, CRANIUM), seed, 0.9);
  ctx.restore();
  G.grain(ctx, G.polyRegion(ctx, PELVIS), seed + 1, 0.9);
  G.grain(ctx, G.polyRegion(ctx, STERNUM), seed + 3, 0.7);
  within(ctx, [[0, -1.6, 51, 1.6]], () => G.dirt(ctx, 0, -5, 51, 5, seed + 2, 0.55));
  if (!simple()) for (const [x, w] of [[1, 3], [16, 4], [30, 2.4], [42, 3]] as Pt[]) flat(ctx, x, -0.9, w, 0.9, "g1");
};

const REMAINS_SCALE = 0.65;

const smoulderingRemains: EnvAsset = {
  id: "smoulderingRemains",
  box: [-3, -13, 36, 0],
  anim: true,
  draw(ctx, state, t) {
    ctx.save();
    ctx.scale(REMAINS_SCALE, REMAINS_SCALE);
    G.scorch(ctx, [[0, 0], [6, -0.8], [24, -1.2], [44, -0.8], [51, 0]], 2320);
    shadow(ctx, 25, 51, 0.5);
    skeleton(ctx, 2321);
    if (state === 0) {
      flat(ctx, 31.6, -1.4, 3.6, 1, "y2", "yLine");
      ellipse(ctx, 31.6, -0.9, 1.2, 1.1, "y1", "yLine");
      if (!simple()) glow(ctx, 32.6, -1.2, 4, "y3", 0.35 + sin(t * 4) * 0.15);
    }
    ctx.restore();
  },
};

const smallKey: EnvAsset = {
  id: "smallKey",
  box: craneKey.box,
  draw(ctx, state, t, size) {
    craneKey.draw(ctx, state ? 2 : 0, t, size);
  },
};

const walkieTalkie: EnvAsset = {
  id: "walkieTalkie",
  box: [-2, -18, 12, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 10);
    shadow(ctx, 5, 9);
    cylV(ctx, 6.6, -17.4, 1.2, 6, "steel", 1);
    disc(ctx, 7.2, -17.6, 0.8, "m2", "mLine");
    box(ctx, 1, -12, 8, 12, "steel", 1);
    box(ctx, 1.6, -11.4, 6.8, 4, "steel", 0);
    if (!simple()) for (let y = -10.6; y < -7.6; y += 1) flat(ctx, 2.4, y, 5.2, 0.45, "m3");
    flat(ctx, 2.2, -6.4, 5.6, 2.4, "screenOff", "mLine");
    if (!simple()) flat(ctx, 2.6, -5.9, 2.4, 0.5, "screen");
    disc(ctx, 3, -2.2, 0.7, "neon", "mLine");
    disc(ctx, 6.6, -2.2, 0.9, "c1", "mLine");
    box(ctx, 9, -9, 1.2, 4, "steel", 0);
  },
};

const detonator: EnvAsset = {
  id: "detonator",
  box: [-2, -20, 20, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 18);
    shadow(ctx, 8, 18);
    box(ctx, 2, -9, 12, 9, "rust", 2);
    box(ctx, 1.4, -10, 13.2, 1.8, "rust", 3);
    flat(ctx, 3.4, -6.4, 6, 3, "hazard", "yLine");
    if (!simple()) for (let x = 3.8; x < 9; x += 1.6) flat(ctx, x, -6.4, 0.6, 3, "hazardDark");
    disc(ctx, 11.6, -5, 1, "c2", "mLine");
    disc(ctx, 11.6, -2.6, 1, "c2", "mLine");
    box(ctx, 7.4, -17, 1.4, 7.2, "chrome", 2, { vertical: true });
    box(ctx, 3.6, -18.6, 9, 1.8, "chrome", 1);
    disc(ctx, 3.8, -17.7, 0.9, "neon", "mLine");
    disc(ctx, 12.4, -17.7, 0.9, "neon", "mLine");
    wire(ctx, [[12.6, -4.8], [16, -3.6], [17.4, -0.6]], "neon");
    wire(ctx, [[12.6, -2.4], [15.4, -1.2], [18, -0.4]], "y2");
  },
};

const projectile: EnvAsset = {
  id: "projectile",
  box: [-2, -9, 28, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 26);
    shadow(ctx, 12, 24);
    box(ctx, 1, -7.6, 3, 7.4, "yellow", 0);
    box(ctx, 3, -7, 12, 6.2, "yellow", 1);
    if (!simple()) for (const x of [6, 12]) flat(ctx, x, -7, 0.6, 6.2, "y0");
    box(ctx, 15, -7.4, 2, 7, "rust", 1);
    poly(ctx, [[17, -7], [21, -6.6], [24.6, -4.6], [25.4, -3.8], [24.6, -3], [21, -1], [17, -0.6]], "steel", 2);
    if (!simple()) {
      flat(ctx, 3.4, -6.4, 11, 0.6, "y3");
      flat(ctx, 18, -6.2, 4, 0.5, "m3");
    }
    flat(ctx, 19, -4.6, 1.2, 1.6, "neon");
  },
};

const fuse: EnvAsset = {
  id: "fuse",
  box: [-2, -7, 16, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 14);
    shadow(ctx, 7, 14);
    box(ctx, 3, -5.6, 8, 5.2, "chrome", 2);
    if (!simple()) flat(ctx, 4.4, -4.2, 5, 1.6, "neon");
    for (const x of [0.6, 11]) {
      box(ctx, x, -6, 2.4, 6, "yellow", 1);
      if (!simple()) flat(ctx, x + 0.4, -5.4, 0.5, 4.8, "y3");
    }
    flat(ctx, -0.6, -3.6, 1.4, 1.2, "y1", "yLine");
    flat(ctx, 13.2, -3.6, 1.4, 1.2, "y1", "yLine");
  },
};

const dynamite: EnvAsset = {
  id: "dynamite",
  box: [-2, -16, 20, 0],
  draw(ctx, state) {
    if (state === 1) return scuff(ctx, 0, 16);
    shadow(ctx, 8, 16);
    if (state === 2) {
      for (const x of [3, 6, 9]) stick(ctx, x, -14, 3, 14);
      for (const y of [-11, -4]) flat(ctx, 2.6, y, 9.8, 1.4, "k1", "kLine");
      box(ctx, 4.6, -9, 5.2, 3.6, "steel", 1);
      disc(ctx, 8.4, -7.2, 0.6, "neon");
      wire(ctx, [[7.2, -9], [8, -14], [12, -15], [15, -8], [17, -1]], "y2");
      return;
    }
    stick(ctx, 1, -3.4, 13, 3.2);
    stick(ctx, 2, -6.4, 13, 3.2);
    stick(ctx, 1.4, -9.2, 13, 3.2);
    for (const x of [4, 10.6]) flat(ctx, x, -9.4, 1.4, 9.2, "k1", "kLine");
    wire(ctx, [[14.4, -7.6], [16.4, -9], [18, -7.4]], "k3", 0.6);
  },
};

const TRACES: [Pt, Pt][] = [[[2, -2], [6, -7]], [[5, -1.4], [12, -1.4]], [[9, -7.6], [13, -4]], [[3.6, -6], [8, -6]]];

const navCircuit: EnvAsset = {
  id: "navCircuit",
  box: [-2, -11, 18, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 16);
    shadow(ctx, 8, 16);
    poly(ctx, [[0, 0], [1.6, -9], [15, -9], [14.4, 0]], "green", 1, { dir: [1, 0] });
    if (!simple()) {
      ctx.save();
      ctx.strokeStyle = color("y2");
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      for (const [a, b] of TRACES) {
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
      }
      ctx.stroke();
      ctx.restore();
    }
    box(ctx, 4.2, -6.6, 4.6, 3.6, "steel", 0);
    box(ctx, 10, -7.6, 3, 2.4, "steel", 0);
    flat(ctx, 10.4, -4, 2.4, 1.8, "plasma", "mLine");
    for (let x = 4.6; x < 8.8; x += simple() ? 2 : 1) flat(ctx, x, -3, 0.4, 0.8, "y2");
    flat(ctx, 1, -1.2, 13, 1.2, "y1", "yLine");
  },
};

const toaster: EnvAsset = {
  id: "toaster",
  box: [-2, -11, 28, 0],
  anim: true,
  draw(ctx, state, t) {
    if (state) return scuff(ctx, 0, 26);
    shadow(ctx, 12, 24);
    box(ctx, 3, -3.4, 2.6, 3.4, "steel", 0, { vertical: true });
    box(ctx, 0.6, -8, 9.4, 4.8, "chrome", 1);
    flat(ctx, 0.6, -8, 9.4, 1, "c2");
    const heat = 0.6 + sin(t * 5) * 0.25;
    flat(ctx, 2.6, -8.6, 4.6, 0.9, "hole");
    if (!simple()) glow(ctx, 4.9, -8.4, 2.6, "a1", heat * 0.6);
    flat(ctx, 3, -8.5, 3.8, 0.4, "a2");
    flat(ctx, 1.6, -6, 3.4, 1.2, "hazard", "yLine");
    box(ctx, 10, -7, 11.6, 2.8, "steel", 1);
    for (let x = 11.2; x < 21; x += simple() ? 3 : 1.5) flat(ctx, x, -7, 0.6, 2.8, "a1");
    box(ctx, 21.6, -7.6, 1.6, 4, "chrome", 2, { vertical: true });
    G.grain(ctx, G.rectsRegion(ctx, [[0.6, -8, 9.4, 4.8], [10, -7, 11.6, 2.8], [21.6, -7.6, 1.6, 4]]), 2340, 0.4);
    G.chips(ctx, 0.6, -8, 9.4, 2341);
  },
};

const energyPickup: EnvAsset = {
  id: "energyPickup",
  box: [-4, -18, 16, 0],
  anim: true,
  draw(ctx, state, t) {
    if (state) return scuff(ctx, 0, 12);
    const pulse = 0.5 + sin(t * 4) * 0.5;
    if (!simple()) glow(ctx, 6, -7, 10, "screen", 0.25 + pulse * 0.25);
    shadow(ctx, 6, 12);
    box(ctx, 1, -2, 10, 2, "steel", 1);
    box(ctx, 1, -14, 10, 2, "steel", 1);
    box(ctx, 4, -15.6, 4, 1.8, "chrome", 2);
    box(ctx, 1.8, -12, 8.4, 10, "green", 2, { vertical: true });
    poly(ctx, [[6.8, -11], [3.6, -6.4], [5.8, -6.4], [4.8, -3], [8.4, -7.8], [6.2, -7.8], [7.6, -11]], pulse > 0.5 ? "y3" : "y2", 2);
  },
};

const ammoPickup: EnvAsset = {
  id: "ammoPickup",
  box: [-2, -13, 22, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 20);
    shadow(ctx, 10, 20);
    for (let i = 0; i < (simple() ? 3 : 5); i++) {
      const x = 3 + i * (simple() ? 4.6 : 2.8);
      box(ctx, x, -12, 1.8, 3, "yellow", 2, { vertical: true });
      poly(ctx, [[x, -12], [x + 0.9, -13], [x + 1.8, -12]], "chrome", 2);
    }
    box(ctx, 1, -9.4, 18, 9.4, "olive", 1);
    box(ctx, 0.4, -10, 19.2, 1.8, "olive", 2);
    flat(ctx, 4, -6.6, 12, 3.6, "o0", "kLine");
    for (let i = 0; i < 3; i++) {
      const x = 5.6 + i * 3.6;
      flat(ctx, x, -6, 1.2, 2.4, "y2");
      poly(ctx, [[x, -6], [x + 0.6, -6.8], [x + 1.2, -6]], "y3", 2, { line: false });
    }
    flat(ctx, 8.6, -1.6, 2.8, 1.6, "m1", "mLine");
  },
};

const shieldPickup: EnvAsset = {
  id: "shieldPickup",
  box: [-4, -20, 18, 0],
  anim: true,
  draw(ctx, state, t) {
    if (state) return scuff(ctx, 0, 14);
    const bob = sin(t * 2.4) * 0.8;
    shadow(ctx, 7, 12);
    box(ctx, 2, -2.4, 10, 2.4, "steel", 1);
    if (!simple()) glow(ctx, 7, -11 + bob, 9, "plasma", 0.4);
    const shield: Pt[] = [[2.4, -16 + bob], [7, -18 + bob], [11.6, -16 + bob], [11, -9.4 + bob], [7, -5.4 + bob], [3, -9.4 + bob]];
    poly(ctx, shield, "denim", 2, { dir: [1, 1] });
    poly(ctx, shield.map(([x, y]): Pt => [7 + (x - 7) * 0.62, -11.6 + bob + (y + 11.6 - bob) * 0.62]), "plasma", 2, { line: false });
    if (!simple()) flat(ctx, 6.4, -14.4 + bob, 1.2, 6, "plasmaCore");
    if (!simple()) flat(ctx, 4.4, -12 + bob, 5.2, 1.2, "plasmaCore");
  },
};

const projectileCrate: EnvAsset = {
  id: "projectileCrate",
  box: [-2, -24, 32, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 30);
    shadow(ctx, 15, 30);
    box(ctx, 1, -20, 28, 20, "olive", 1);
    for (let y = -15; y < 0; y += 5) flat(ctx, 1, y, 28, 0.5, "o0");
    for (const x of [1, 25.4]) box(ctx, x, -20, 3.6, 20, "olive", 2, { vertical: true });
    box(ctx, 0.4, -21.6, 29.2, 2.4, "olive", 3);
    box(ctx, 0.4, -2, 29.2, 2, "olive", 0);
    hazard(ctx, 4.6, -5.4, 20.8, 3, 3);
    text(ctx, "AMMO", 15, -16, 2.6, "k0");
    flat(ctx, 8, -14, 14, 6.6, "o0", "kLine");
    poly(ctx, [[9.4, -11.9], [16.6, -11.9], [19.4, -11.3], [20.4, -10.7], [19.4, -10.1], [16.6, -9.5], [9.4, -9.5]], "y2", 2, { line: false });
    if (!simple()) flat(ctx, 9.4, -12.6, 9, 0.6, "y1");
    flat(ctx, 11.6, -11.9, 0.6, 2.4, "y0");
    if (!simple()) for (const x of [4.4, 25.6]) rivets(ctx, x - 1, -18, 2, 4, "o3");
  },
};

export const vesnicePropAssets: EnvAsset[] = [
  sourceTeleport, targetTeleport, teleportPad, brokenTeleport, fuseBox, electricCabinet, cannon, fireBarricade, dynamiteWall, energyBarrier, powerBridge, bridgeGuardPost,
  smoulderingRemains, smallKey, walkieTalkie, detonator, projectile, fuse, dynamite, navCircuit, toaster, energyPickup, ammoPickup, shieldPickup, projectileCrate,
];
