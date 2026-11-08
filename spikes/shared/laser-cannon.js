(() => {
const ENV_PAL = window.ENV.PALETTE;
const COLORS = {
  g0: "#302c20", g1: "#545048", g2: "#7c7870", g3: "#a4a4a4", gLine: "#100c08",
  w0: "#7c7870", w1: "#b4acac", w2: "#e4ece0", w3: "#fcfcfc",
  r0: "#301c10", r1: "#4c3418", r2: "#7c5430", r3: "#a8744c",
  b0: "#202448", b1: "#2c4058", b2: "#5c8cc4", b3: "#c4ecfc",
  k0: ENV_PAL.c0, k1: ENV_PAL.c1, k2: ENV_PAL.c2, k3: ENV_PAL.c3
};
const MAT = { g: ["g0", "g1", "g2", "g3", "gLine"], w: ["w0", "w1", "w2", "w3", "gLine"], r: ["r0", "r1", "r2", "r3", "gLine"], b: ["b0", "b1", "b2", "b3", "gLine"], k: ["k0", "k1", "k2", "k3", "gLine"] };

const BARREL = { x: 100, length: 128 };
const LENS = 16;

const buildParts = length => [
  window.GUN.grip("g", 0),
  { name: "body", x: -60, y: -72, w: 160, h: 62, mat: "g", tone: 2 },
  { name: "bodyTop", x: -60, y: -72, w: 160, h: 12, mat: "w", tone: 2 },
  { name: "bodyLow", x: -60, y: -28, w: 160, h: 18, mat: "g", tone: 0 },
  { name: "scopeMount", x: -14, y: -86, w: 16, h: 14, mat: "g", tone: 1 },
  { name: "scope", x: -40, y: -100, w: 72, h: 16, mat: "k", tone: 1 },
  { name: "scopeLens", x: 32, y: -100, w: 6, h: 16, mat: "b", tone: 3 },
  { name: "cellRear", x: BARREL.x + 6, y: -62, w: 26, h: 44, mat: "r", tone: 2 },
  { name: "cellFront", x: BARREL.x + 44, y: -62, w: 26, h: 44, mat: "r", tone: 2 },
  { name: "rail", x: BARREL.x, y: -40, w: length, h: 22, mat: "w", tone: 1 },
  { name: "railTop", x: BARREL.x, y: -40, w: length, h: 6, mat: "w", tone: 3 },
  { name: "lens", x: BARREL.x + length, y: -48, w: LENS, h: 34, mat: "b", tone: 2 }
];

function charge(ctx, length, simple) {
  if (simple) return;
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = COLORS.b3;
  ctx.beginPath();
  ctx.ellipse(BARREL.x + length + LENS + 4, -31, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const MUZZLE = [BARREL.x + BARREL.length + LENS, -31];
const core = window.GUN.model({ buildParts, mat: MAT, colors: COLORS, after: charge, barrel: BARREL, muzzle: MUZZLE });

const BOLT = [[COLORS.b1, 1, 1], [COLORS.b3, 0.8, 0.7], ["#fcfcfc", 0.6, 0.4]];
const THIN = [[12, 3.6], [14, 3], [12, 2.6], [10, 2], [16, 1.2], [8, 1]];

function oval(ctx, x, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function bolt(ctx, x, f, simple) {
  const [rx, ry] = THIN[f];
  for (const [color, kx, ky] of simple ? BOLT.slice(1) : BOLT) oval(ctx, x, rx * kx, ry * ky, color);
}

function shot(ctx, length, tick, simple = false) {
  const { SHOT, shotFrame } = window.TOASTER;
  const f = shotFrame(tick);
  if (f < 0) return;
  const x = SHOT.lead + f * SHOT.step;
  if (f === 0) {
    oval(ctx, 2, 9, 8, COLORS.b1);
    oval(ctx, 2, 7.5, 7, "#fcfcfc");
  }
  if (x <= length) bolt(ctx, x, f, simple);
}

const HUD_K = 1.45;
const HUD_BOLT = [["#20248c", 4.4, 4.4, 2], [COLORS.b2, 3.8, 3.6, 1.5], [COLORS.b3, 3, 2.6, 1], ["#fcfcfc", 2.4, 1.6, 0.5]];

function hudShot(ctx) {
  ctx.save();
  ctx.scale(HUD_K, HUD_K);
  for (const [color, x, rx, ry] of HUD_BOLT) oval(ctx, x, rx, ry, color);
  ctx.restore();
}

window.LASER_CANNON = { ...core, get RANGE() { return window.TOASTER.RANGE; }, shot, hudShot };
})();
