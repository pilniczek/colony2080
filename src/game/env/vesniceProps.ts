import { G } from "./grime";
import { P, type EnvAsset, type Size } from "./paint";
import { blob, boulder, concreteBlock, ellipse, flame, PLANK, planks, RUIN, shadow, smoke, spark } from "./vesnice";

const { rng, flat, box, poly, cylV, disc, rivets, glow, stroke, shape, line, curve, hazard, text } = P;
const { PI, sin, min, max, round, floor } = Math;

type Pt = [number, number];

const simple = (): boolean => P.simple();

const lamp = (ctx: CanvasRenderingContext2D, x: number, y: number, c: string, lit = true): void => {
  if (lit && !simple()) glow(ctx, x, y, 5, c, 0.6);
  disc(ctx, x, y, 1.4, lit ? c : "k0", "mLine");
};

const bolt = (ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, w: number, t: number, seed: number, k = 1): void => {
  const r = rng(floor(t * 18) + seed * 101);
  const n = max(4, round((y1 - y0) / 7));
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) pts.push([x + (i === 0 || i === n ? 0 : (r() - 0.5) * w), y0 + ((y1 - y0) * i) / n]);
  line(ctx, pts, "plasma", 2.4 * k);
  line(ctx, pts, "plasmaCore", 0.9 * k);
};

const padPlate = (ctx: CanvasRenderingContext2D, w: number, lit: boolean, seed: number): void => {
  box(ctx, 2, -8, w - 4, 8, "steel", 1);
  for (let y = -6.5; y < -1; y += 2.2) flat(ctx, 8, y, w - 16, 1, lit ? "#8ab4c0" : "m3");
  if (lit && !simple()) glow(ctx, w / 2, -6, w * 0.4, "plasma", 0.25);
  hazard(ctx, 2, -2, w - 4, 2, 3);
  G.grain(ctx, G.rectRegion(ctx, 2, -8, w - 4, 8), seed);
};

const emitter = (ctx: CanvasRenderingContext2D, cx: number, y: number, lit: boolean, broken: boolean): void => {
  poly(ctx, [[cx - 14, y], [cx + 14, y], [cx + 8, y + 12], [cx - 8, y + 12]], "chrome", 1);
  flat(ctx, cx - 8, y + 12, 16, 3, broken ? "k0" : lit ? "plasma" : "m1", "mLine");
  if (lit && !simple()) glow(ctx, cx, y + 16, 14, "plasma", 0.45);
  if (broken) {
    shape(ctx, [[cx + 2, y + 2], [cx + 12, y + 1], [cx + 9, y + 8], [cx + 4, y + 7]], "hole");
    G.rim(ctx, [[cx + 2, y + 2], [cx + 12, y + 1], [cx + 9, y + 8], [cx + 4, y + 7]], 901, "c2", "mLine");
  }
};

const teleporter = (ctx: CanvasRenderingContext2D, w: number, mode: number, t: number, seed: number): void => {
  const lit = mode === 2;
  const broken = mode === 0;
  box(ctx, 0, -96, 12, 88, "olive", 1, { vertical: true });
  box(ctx, -4, -104, 20, 10, "olive", 2);
  box(ctx, 10, -100, w * 0.5, 9, "steel", 2);
  rivets(ctx, 10, -95.5, w * 0.5, 6, "m3");
  cylV(ctx, w * 0.5 - 4, -94, 8, 12, "steel", 2);
  emitter(ctx, w * 0.5, -82, lit, broken);
  padPlate(ctx, w, lit, seed);
  flat(ctx, 2, -60, 8, 14, "k0", "kLine");
  lamp(ctx, 6, -56, broken ? "neon" : lit ? "screen" : "y1", broken ? floor(t * 3) % 2 === 0 : true);
  if (!simple()) for (const y of [-52, -49]) flat(ctx, 3, y, 6, 0.8, "m2");
  if (lit) {
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.15 * sin(t * 7);
    shape(ctx, [[w * 0.5 - 8, -66], [w * 0.5 + 8, -66], [w * 0.5 + 18, -8], [w * 0.5 - 18, -8]], "plasma");
    ctx.restore();
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.8 + i / 4) % 1;
      flat(ctx, w * 0.5 - 12 - k * 4, -10 - k * 52, 24 + k * 8, 0.8, "plasmaCore");
    }
  }
  if (broken) spark(ctx, w * 0.5 + 8, -72, t, seed);
  G.grain(ctx, G.rectRegion(ctx, 0, -96, 12, 88), seed + 1);
  G.grain(ctx, G.rectRegion(ctx, 10, -100, w * 0.5, 9), seed + 3);
  G.drips(ctx, 0, -96, 12, 40, seed + 2, 2);
};

export const sourceTeleport: EnvAsset = {
  id: "sourceTeleport",
  box: [-6, -108, 100, 2],
  anim: true,
  draw(ctx, state, t) {
    teleporter(ctx, 96, state === 2 ? 2 : state === 0 ? 0 : 1, t, 910);
  },
};

export const targetTeleport: EnvAsset = {
  id: "targetTeleport",
  box: [-6, -108, 124, 2],
  anim: true,
  draw(ctx, state, t) {
    teleporter(ctx, 120, state === 1 ? 2 : 0, t, 920);
  },
};

export const teleportPad: EnvAsset = {
  id: "teleportPad",
  box: [-6, -80, 126, 2],
  anim: true,
  draw(ctx, _state, t) {
    for (const x of [0, 108]) {
      box(ctx, x, -64, 12, 60, "steel", 1, { vertical: true });
      box(ctx, x - 2, -70, 16, 8, "olive", 2);
      const k = 0.5 + 0.5 * sin(t * 5 + x);
      if (!simple()) glow(ctx, x + 6, -54, 6 + k * 3, "plasma", 0.4);
      disc(ctx, x + 6, -54, 2, "plasma", "mLine");
      G.grain(ctx, G.rectRegion(ctx, x, -64, 12, 60), 930 + x);
    }
    padPlate(ctx, 120, true, 931);
    if (!simple()) {
      ctx.save();
      ctx.globalAlpha = 0.12 + 0.06 * sin(t * 4);
      flat(ctx, 14, -60, 92, 52, "plasma");
      ctx.restore();
    }
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.6 + i / 3) % 1;
      flat(ctx, 16, -10 - k * 46, 88, 0.7, "plasmaCore");
    }
  },
};

export const brokenTeleport: EnvAsset = {
  id: "brokenTeleport",
  box: [-4, -70, 148, 2],
  anim: true,
  draw(ctx, state, t) {
    box(ctx, 4, -8, 136, 8, "steel", 1);
    for (let y = -6.5; y < -1; y += 2.2) flat(ctx, 12, y, 120, 1, "m1");
    const shell: Pt[] = [[30, -8], [26, -40], [38, -54], [52, -46], [60, -58], [76, -50], [90, -58], [104, -42], [112, -8]];
    shape(ctx, shell, "m1", "mLine");
    shape(ctx, [[40, -8], [38, -34], [52, -40], [70, -36], [92, -42], [100, -8]], "hole");
    G.scorch(ctx, [[40, -12], [38, -34], [52, -40], [70, -36], [92, -42], [100, -12]], 941);
    G.rim(ctx, [[40, -8], [38, -34], [52, -40], [70, -36], [92, -42], [100, -8]], 942, "c2", "mLine");
    for (const [x, y, a] of [[20, -4, 0.4], [118, -3, -0.3], [128, -5, 0.8]] as [number, number, number][]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      flat(ctx, -6, -2, 12, 3, "m2", "mLine");
      ctx.restore();
    }
    if (state === 0) {
      flat(ctx, 58, -24, 22, 14, "#1e5a2a", "gLine");
      if (!simple()) for (let i = 0; i < 4; i++) flat(ctx, 60 + i * 5, -22, 3, 2, "y2");
      line(ctx, [[60, -14], [66, -18], [76, -16]], "y1", 0.7);
    }
    spark(ctx, 50, -34, t, 4);
    if (!simple()) smoke(ctx, 76, -30, t, 2, 18);
    G.grain(ctx, G.polyRegion(ctx, shell), 943);
  },
};

export const fuseBox: EnvAsset = {
  id: "fuseBox",
  box: [-4, -100, 124, 0],
  anim: true,
  draw(ctx, state, t) {
    concreteBlock(ctx, 0, -96, 22, 96, 950);
    concreteBlock(ctx, 98, -96, 22, 96, 951);
    concreteBlock(ctx, 0, -100, 120, 14, 952);
    flat(ctx, 22, -86, 76, 86, "#121410", "kLine");
    for (const y of [-70, -40]) {
      flat(ctx, 22, y, 76, 6, RUIN[2], RUIN[4]);
      if (!simple()) flat(ctx, 24, y + 1.5, 72, 1.5, "#6a5a2a");
    }
    box(ctx, 48, -66, 24, 44, "green", 1);
    flat(ctx, 51, -62, 18, 9, state === 1 ? "#141a14" : "#0a140a", "gLine");
    const on = state !== 1;
    if (on) {
      const k = floor(t * 2) % 2;
      for (let i = 0; i < 3; i++) text(ctx, "8", 54 + i * 6, -57.5, 7, k && i === 1 ? "screenOff" : "screen");
    } else {
      line(ctx, [[52, -61], [58, -55], [55, -59], [66, -54]], "c2", 0.6);
    }
    flat(ctx, 54, -48, 12, 20, "k0", "kLine");
    if (state === 2) {
      box(ctx, 57, -46, 6, 16, "chrome", 2);
      flat(ctx, 57, -40, 6, 3, "y2");
    } else if (state === 1) {
      shape(ctx, [[55, -46], [64, -44], [62, -32], [56, -31]], "hole");
      spark(ctx, 60, -40, t, 2);
    }
    if (!simple()) for (const x of [26, 86]) for (let y = -32; y < -8; y += 4) flat(ctx, x, y, 8, 2, "m2");
    G.drips(ctx, 0, -86, 120, 30, 953, 6, false);
    G.dirt(ctx, 0, -100, 120, 100, 954, 0.25);
  },
};

export const electricCabinet: EnvAsset = {
  id: "electricCabinet",
  box: [-4, -80, 124, 0],
  draw(ctx, state) {
    for (const x of [0, 96]) {
      box(ctx, x, -48, 24, 48, "steel", 1);
      for (let k = 0; k < 4; k++) flat(ctx, x + 3 + k * 5.5, -44, 3, 40, "c0", "mLine");
    }
    box(ctx, 24, -72, 72, 72, "steel", 2);
    flat(ctx, 24, -72, 72, 8, "k2", "kLine");
    if (!simple()) {
      line(ctx, [[30, -70], [34, -66], [38, -70], [42, -65]], "#6ab4e8", 1.2);
      line(ctx, [[80, -70], [84, -65], [88, -69]], "#6ab4e8", 1.2);
    }
    if (state === 1) {
      flat(ctx, 30, -62, 60, 58, "#0a0c0c", "mLine");
      for (const y of [-54, -40, -26]) flat(ctx, 34, y, 52, 2, "m2");
      flat(ctx, 54, -48, 12, 16, "k0", "kLine");
      poly(ctx, [[30, -62], [18, -58], [18, -6], [30, -4]], "steel", 3);
      poly(ctx, [[90, -62], [102, -58], [102, -6], [90, -4]], "steel", 1);
    } else {
      flat(ctx, 30, -62, 29, 58, "m2", "mLine");
      flat(ctx, 61, -62, 29, 58, "m2", "mLine");
      flat(ctx, 50, -44, 20, 20, "#1c3a2a", "gLine");
      shape(ctx, [[61, -41], [55, -33], [60, -33], [57, -27], [65, -36], [60, -36], [63, -41]], "y2");
      box(ctx, 57, -22, 6, 8, "chrome", 2);
      ctx.beginPath();
      ctx.arc(60, -22, 2.6, PI, 0);
      stroke(ctx, "c2", 1.6);
    }
    rivets(ctx, 24, -68, 72, 8, "m3");
    G.surface(ctx, 24, -72, 72, 72, 960, { drip: 4 });
    G.rustPatch(ctx, 36, -10, 4, 2, 961);
  },
};

export const cannon: EnvAsset = {
  id: "cannon",
  box: [-30, -80, 196, 0],
  anim: true,
  draw(ctx, state, t) {
    shadow(ctx, 96, 160, 0.5);
    poly(ctx, [[40, 0], [60, -30], [150, -30], [176, 0]], "steel", 1);
    for (const x of [64, 100, 136]) disc(ctx, x, -10, 9, "m1", "mLine");
    if (!simple()) for (const x of [64, 100, 136]) disc(ctx, x, -10, 3, "m3");
    box(ctx, 70, -56, 90, 28, "steel", 2);
    poly(ctx, [[86, -56], [96, -72], [146, -72], [160, -56]], "steel", 3);
    box(ctx, 0, -50, 74, 12, "chrome", 1);
    box(ctx, -6, -52, 12, 16, "steel", 1);
    for (const x of [24, 48]) flat(ctx, x, -50, 3, 12, "c0");
    box(ctx, 150, -46, 30, 16, "olive", 1);
    hazard(ctx, 72, -34, 86, 5, 4);
    flat(ctx, 112, -66, 22, 6, "#0c0e0e", "mLine");
    rivets(ctx, 70, -53, 90, 7, "m3");
    if (state === 1) {
      const k = (t * 3) % 1;
      if (k < 0.45) {
        const s = 1 - k / 0.45;
        if (!simple()) glow(ctx, -18, -44, 30 * s + 10, "a2", 0.7);
        poly(ctx, [[-6, -54], [-30 - 20 * s, -62], [-18, -48], [-44 - 26 * s, -44], [-18, -40], [-30 - 20 * s, -26], [-6, -34]], "a1", 2, { line: false });
        poly(ctx, [[-6, -49], [-22 - 16 * s, -44], [-6, -39]], "y3", 2, { line: false });
      }
      smoke(ctx, -10, -50, t, 3, 26);
    }
    G.grain(ctx, G.rectRegion(ctx, 70, -56, 90, 28), 970);
    G.grain(ctx, G.rectRegion(ctx, 0, -50, 74, 12), 973);
    G.grain(ctx, G.polyRegion(ctx, [[40, 0], [60, -30], [150, -30], [176, 0]]), 974);
    G.drips(ctx, 70, -56, 90, 20, 971, 6);
    G.rustPatch(ctx, 120, -40, 6, 3, 972);
  },
};

export const ammoDepot: EnvAsset = {
  id: "ammoDepot",
  box: [-2, -66, 146, 0],
  anim: true,
  draw(ctx, _state, t, { w = 144 }: Size = {}) {
    const n = max(1, floor(w / 48));
    for (let i = 0; i < n; i++) {
      const x = i * 48;
      flat(ctx, x + 2, -22, 20, 10, "#22261c", "kLine");
      flat(ctx, x + 4, -20, 16, 6, "#141610", "kLine");
      if (!simple()) text(ctx, "AMMO", x + 12, -17, 4, "#6a6a52");
      for (const k of [0, 1]) {
        flat(ctx, x + 3 + k * 9, -10, 8, 10, "#2c3024", "kLine");
        ellipse(ctx, x + 7 + k * 9, -10, 4, 1.4, "#5a4a1e");
      }
      concreteBlock(ctx, x + 24, -44, 22, 44, 980 + i);
      flat(ctx, x + 22, -50, 26, 6, "k1", "kLine");
      for (let k = 0; k < 2; k++) flame(ctx, x + 24 + k * 11, -50, 11, 16, t, i * 3 + k);
      G.drips(ctx, x + 24, -44, 22, 18, 985 + i, 2);
    }
    G.dirt(ctx, 0, -50, w, 50, 989, 0.3);
  },
};

export const fireBarricade: EnvAsset = {
  id: "fireBarricade",
  box: [-14, -150, 62, 0],
  anim: true,
  draw(ctx, state, t) {
    if (state === 1) {
      const heap: Pt[] = [[-10, 0], [-6, -10], [4, -16], [16, -12], [28, -20], [40, -10], [48, 0]];
      G.scorch(ctx, heap, 991);
      shape(ctx, heap, "k1", "kLine");
      for (let i = 0; i < 5; i++) boulder(ctx, -4 + i * 11, -5 - (i % 2) * 4, 6, 4, 992 + i);
      smoke(ctx, 18, -14, t, 3, 30);
      return;
    }
    const plates: [number, number, number, number, string][] = [[0, -120, 24, 120, "steel"], [24, -96, 22, 96, "rust"], [-10, -70, 14, 70, "rust"]];
    for (const [x, y, w, h, m] of plates) {
      box(ctx, x, y, w, h, m, 1, { vertical: true });
      rivets(ctx, x, y + 4, w, 6, m === "rust" ? "r3" : "m3");
    }
    for (let y = -110; y < -6; y += 22) {
      line(ctx, [[0, y], [24, y + 14]], "mLine", 2.6);
      line(ctx, [[0, y], [24, y + 14]], "m3", 1.2);
    }
    for (const [x, y, a] of [[-6, -122, -0.5], [12, -126, 0.1], [30, -100, 0.6]] as [number, number, number][]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      poly(ctx, [[-2, 0], [0, -12], [2, 0]], "steel", 3);
      ctx.restore();
    }
    cylV(ctx, 4, -132, 16, 12, "rust", 1);
    flame(ctx, 2, -132, 20, 20, t, 3);
    hazard(ctx, 0, -60, 24, 6, 4);
    for (const [x, y, w, h] of plates) G.grain(ctx, G.rectRegion(ctx, x, y, w, h), 993 + x);
    G.drips(ctx, -10, -120, 56, 50, 994, 6);
    G.rustPatch(ctx, 34, -40, 5, 3, 995);
  },
};

export const dynamiteWall: EnvAsset = {
  id: "dynamiteWall",
  box: [-4, -124, 28, 0],
  draw(ctx, state) {
    box(ctx, 0, -120, 24, 120, "steel", 1, { vertical: true });
    flat(ctx, 3, -112, 18, 70, "m1", "mLine");
    for (let y = -40; y < 0; y += 6) flat(ctx, 2, y, 20, 2.4, "m3", "mLine");
    for (const y of [-118, -6]) box(ctx, -2, y, 28, 4, "steel", 2);
    rivets(ctx, 0, -116, 24, 5, "m3");
    hazard(ctx, 3, -46, 18, 4, 3);
    if (state === 1) {
      for (let i = 0; i < 4; i++) box(ctx, 5 + i * 3.6, -86, 3.2, 20, "armor", 0, { vertical: true });
      flat(ctx, 4, -80, 16, 2, "k0");
      curve(ctx, [[12, -66], [16, -58], [10, -48], [18, -36]], "y1", 0.8);
      box(ctx, 14, -40, 6, 4, "concrete", 1);
    }
    G.surface(ctx, 0, -120, 24, 120, 1000, { drip: 3 });
  },
};

export const energyBarrier: EnvAsset = {
  id: "energyBarrier",
  box: [-14, -156, 132, 2],
  anim: true,
  draw(ctx, state, t) {
    box(ctx, 96, -150, 14, 150, "steel", 1, { vertical: true });
    box(ctx, 0, -150, 110, 12, "steel", 2);
    line(ctx, [[60, -138], [96, -100]], "mLine", 4);
    line(ctx, [[60, -138], [96, -100]], "m2", 2.4);
    rivets(ctx, 0, -144, 110, 8, "m3");
    box(ctx, 2, -138, 20, 14, "chrome", 1);
    box(ctx, -2, -6, 28, 6, "steel", 1);
    const on = state === 0;
    for (const y of [-124, -6]) {
      flat(ctx, 6, y, 12, 3, on ? "plasma" : "m1", "mLine");
      if (on && !simple()) glow(ctx, 12, y + 1, 12, "plasma", 0.5);
    }
    if (on) for (let k = 0; k < 2; k++) bolt(ctx, 12, -121, -6, 10, t, k, 1 - k * 0.4);
    lamp(ctx, 103, -140, on ? "neon" : "k2", on);
    hazard(ctx, 96, -20, 14, 6, 3);
    G.grain(ctx, G.rectRegion(ctx, 96, -150, 14, 150), 1010, 0.6);
    G.grain(ctx, G.rectRegion(ctx, 0, -150, 110, 12), 1012, 0.6);
    G.drips(ctx, 0, -138, 110, 20, 1011, 5);
  },
};

export const powerBridge: EnvAsset = {
  id: "powerBridge",
  box: [-4, -12, 292, 14],
  anim: true,
  draw(ctx, state, t) {
    if (state === 1) {
      for (const [x, d] of [[0, 1], [288, -1]] as Pt[]) {
        flat(ctx, min(x, x + d * 22), 0, 22, 4, "c0", "mLine");
        line(ctx, [[x + d * 22, 2], [x + d * 30, 10]], "m2", 1.4);
        spark(ctx, x + d * 22, 2, t, x);
      }
      return;
    }
    flat(ctx, 0, 0, 288, 3.6, "c0", "mLine");
    flat(ctx, 0, 0, 288, 1, "c2");
    for (let x = 6; x < 288; x += 12) line(ctx, [[x, 3.6], [x + 6, 9], [x + 12, 3.6]], "m2", 0.8);
    flat(ctx, 0, 9, 288, 1.4, "m1", "mLine");
    const k = (t * 1.4) % 1;
    if (!simple()) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      flat(ctx, 0, 1.2, 288, 1, "plasma");
      ctx.restore();
      glow(ctx, k * 288, 2, 10, "plasma", 0.6);
    }
    for (const x of [0, 280]) box(ctx, x, -4, 8, 14, "steel", 2);
  },
};

export const bridgeGuardPost: EnvAsset = {
  id: "bridgeGuardPost",
  box: [-54, -152, 30, 0],
  anim: true,
  draw(ctx, state, t) {
    planks(ctx, -2, -144, 26, 144, 1020, true);
    flat(ctx, 2, -128, 18, 14, "#0a0806", PLANK[4]);
    shape(ctx, [[-6, -144], [11, -152], [28, -144]], PLANK[2], PLANK[4]);
    flat(ctx, -4, -146, 30, 3, PLANK[3], PLANK[4]);
    box(ctx, -6, -40, 8, 40, "steel", 1, { vertical: true });
    const up = state === 1;
    ctx.save();
    ctx.translate(-2, -34);
    ctx.rotate(up ? -PI / 2.2 : 0);
    flat(ctx, -46, -2.5, 46, 5, "k3", "kLine");
    for (let x = -42; x < -2; x += 10) flat(ctx, x, -2.5, 5, 5, "neon");
    ctx.restore();
    lamp(ctx, 11, -136, up ? "screen" : "neon", up || floor(t * 2) % 2 === 0);
    flat(ctx, 2, -100, 18, 10, "y1", "yLine");
    if (!simple()) text(ctx, "STOP", 11, -95, 5, "k0");
    G.drips(ctx, -2, -144, 26, 60, 1021, 3);
  },
};

export const smoulderingRemains: EnvAsset = {
  id: "smoulderingRemains",
  box: [-4, -40, 52, 0],
  anim: true,
  draw(ctx, state, t) {
    shadow(ctx, 24, 46, 0.5);
    const burnt = ["#1c1a18", "#34302c", "#4e4842", "#6e665c"];
    shape(ctx, [[0, 0], [4, -8], [14, -12], [24, -10], [36, -14], [46, -6], [48, 0]], burnt[1] as string, "kLine");
    shape(ctx, blob(14, -14, 8, 5, 1030, 9), burnt[2] as string, "kLine");
    disc(ctx, 12, -15, 1.6, state === 0 ? "a1" : "k0");
    line(ctx, [[22, -10], [32, -20], [40, -18]], burnt[3] as string, 2);
    for (const x of [6, 18, 30, 40]) flat(ctx, x, -6, 4, 2, burnt[0] as string);
    if (state === 0) {
      if (!simple()) glow(ctx, 30, -6, 8, "y3", 0.3 + 0.2 * sin(t * 4));
      flat(ctx, 28, -7, 5, 1.6, "y2");
    }
    for (let i = 0; i < 3; i++) {
      const g = 0.5 + 0.5 * sin(t * 6 + i * 2);
      disc(ctx, 8 + i * 13, -3, 1.2, g > 0.5 ? "a1" : "a0");
    }
    smoke(ctx, 20, -12, t, 3, 26);
    G.grain(ctx, G.rectRegion(ctx, 0, -20, 48, 20), 1031);
  },
};

const itemBox = (ctx: CanvasRenderingContext2D, w: number, h: number, mat: string): void => {
  shadow(ctx, 0, w + 2, 0.4);
  box(ctx, -w / 2, -h, w, h, mat, 2);
};

const item = (id: string, box0: [number, number, number, number], draw: (ctx: CanvasRenderingContext2D, t: number) => void, anim = false): EnvAsset => ({
  id,
  box: box0,
  anim,
  draw(ctx, state, t) {
    if (state === 0) draw(ctx, t);
  },
});

export const smallKey = item("smallKey", [-8, -6, 8, 1], (ctx) => {
  shadow(ctx, 0, 12, 0.35);
  ctx.beginPath();
  ctx.arc(-4, -2.6, 2.4, 0, PI * 2);
  stroke(ctx, "y2", 1.6);
  flat(ctx, -1.6, -3.2, 8, 1.4, "y2", "yLine");
  flat(ctx, 3.6, -1.8, 1.2, 1.6, "y2");
  flat(ctx, 5.4, -1.8, 1.2, 1.2, "y2");
});

export const walkieTalkie = item("walkieTalkie", [-6, -20, 6, 1], (ctx) => {
  itemBox(ctx, 8, 13, "olive");
  flat(ctx, 2, -19, 1.2, 6, "k0");
  flat(ctx, -2.8, -11.5, 5.6, 3, "screenOff", "gLine");
  for (const y of [-7, -5, -3]) flat(ctx, -2.5, y, 5, 0.8, "o0");
});

export const detonator = item("detonator", [-9, -18, 9, 1], (ctx) => {
  itemBox(ctx, 14, 8, "olive");
  flat(ctx, -0.8, -16, 1.6, 8, "c1", "mLine");
  flat(ctx, -4, -17, 8, 2, "neon", "mLine");
  flat(ctx, 3, -6, 2, 2, "neon");
});

export const projectileCrate = item("projectileCrate", [-14, -18, 14, 1], (ctx) => {
  itemBox(ctx, 26, 16, "olive");
  flat(ctx, -13, -9, 26, 1.4, "o0");
  hazard(ctx, -10, -14, 8, 3, 2);
  if (!simple()) text(ctx, "AMMO", 5, -12.5, 3.4, "k0");
  G.grain(ctx, G.rectRegion(ctx, -13, -16, 26, 16), 1040);
});

export const projectile = item("projectile", [-12, -8, 14, 1], (ctx) => {
  shadow(ctx, 0, 22, 0.35);
  cylV(ctx, -10, -6, 16, 6, "olive", 2);
  poly(ctx, [[6, -6], [12, -3], [6, 0]], "chrome", 2);
  flat(ctx, -10, -6, 3, 6, "y1", "yLine");
});

export const fuse = item("fuse", [-6, -6, 6, 1], (ctx) => {
  shadow(ctx, 0, 10, 0.35);
  box(ctx, -3, -4, 6, 4, "concrete", 3);
  for (const x of [-5, 3]) flat(ctx, x, -3.5, 2, 3, "c1", "mLine");
  flat(ctx, -1, -4, 2, 4, "neon");
});

export const dynamite: EnvAsset = {
  id: "dynamite",
  box: [-10, -12, 10, 1],
  draw(ctx, state) {
    if (state === 1) return;
    shadow(ctx, 0, 16, 0.35);
    for (let i = 0; i < 3; i++) box(ctx, -7 + i * 4.6, -9, 4.2, 9, "armor", 0, { vertical: true });
    flat(ctx, -7.5, -6, 14.6, 1.8, "k0");
    curve(ctx, [[0, -9], [2, -12], [5, -11]], "y1", 0.6);
  },
};

export const navCircuit = item("navCircuit", [-9, -6, 9, 1], (ctx) => {
  shadow(ctx, 0, 16, 0.35);
  flat(ctx, -8, -4, 16, 4, "#1e5a2a", "gLine");
  if (!simple()) for (let i = 0; i < 4; i++) flat(ctx, -6 + i * 3.6, -3.2, 2, 1.4, "y2");
  flat(ctx, -8, -1.2, 16, 1.2, "c0");
});

export const toaster = item("toaster", [-14, -12, 14, 1], (ctx) => {
  shadow(ctx, 0, 24, 0.4);
  box(ctx, -12, -8, 18, 7, "steel", 2);
  box(ctx, 4, -7, 10, 4, "chrome", 1);
  flat(ctx, -6, -11, 8, 3, "m1", "mLine");
  flat(ctx, -10, -1, 4, 1, "m0");
  for (let x = -10; x < 4; x += 3) flat(ctx, x, -6, 1.4, 3, "a1");
});

export const energyPickup = item("energyPickup", [-7, -16, 7, 1], (ctx, t) => {
  shadow(ctx, 0, 12, 0.4);
  box(ctx, -5, -13, 10, 13, "steel", 2);
  flat(ctx, -2, -15, 4, 2, "c1", "mLine");
  const k = 0.5 + 0.5 * sin(t * 4);
  flat(ctx, -3, -11, 6, 9, "screenOff");
  flat(ctx, -3, -2 - 9 * (0.6 + 0.4 * k), 6, 9 * (0.6 + 0.4 * k), "screen");
}, true);

export const ammoPickup = item("ammoPickup", [-10, -12, 10, 1], (ctx) => {
  itemBox(ctx, 18, 10, "olive");
  for (let i = 0; i < 4; i++) {
    cylV(ctx, -7 + i * 4, -15, 3, 6, "yellow", 1);
    flat(ctx, -7 + i * 4, -15, 3, 1.4, "a0");
  }
});

export const shieldPickup = item("shieldPickup", [-8, -18, 8, 1], (ctx, t) => {
  shadow(ctx, 0, 12, 0.4);
  const pts: Pt[] = [[-6, -16], [6, -16], [6, -8], [0, -1], [-6, -8]];
  if (!simple()) glow(ctx, 0, -9, 10, "plasma", 0.25 + 0.15 * sin(t * 3));
  shape(ctx, pts, "e1", "mLine");
  shape(ctx, [[-3.5, -13.5], [3.5, -13.5], [3.5, -8.5], [0, -4.5], [-3.5, -8.5]], "e2");
}, true);

export const vesnicePropAssets: EnvAsset[] = [
  sourceTeleport, targetTeleport, teleportPad, brokenTeleport, fuseBox, electricCabinet, cannon, ammoDepot, fireBarricade, dynamiteWall, energyBarrier,
  powerBridge, bridgeGuardPost, smoulderingRemains, smallKey, walkieTalkie, detonator, projectileCrate, projectile, fuse, dynamite, navCircuit, toaster,
  energyPickup, ammoPickup, shieldPickup,
];

