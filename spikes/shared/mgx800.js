(() => {
const ENV_PAL = window.ENV.PALETTE;
const COLORS = {
  g0: "#2c3838", g1: "#64605c", g2: "#a8aca8", g3: "#c4cccc", gLine: "#141818",
  w0: "#a8aca8", w1: "#c4cccc", w2: "#e8ecec", w3: "#fcfcfc",
  b0: "#2c5c74", b1: "#4c94b4", b2: "#7cc4e4", b3: "#c4ecfc",
  k0: ENV_PAL.c0, k1: ENV_PAL.c1, k2: ENV_PAL.c2, k3: ENV_PAL.c3
};
const MAT = { g: ["g0", "g1", "g2", "g3", "gLine"], w: ["w0", "w1", "w2", "w3", "gLine"], b: ["b0", "b1", "b2", "b3", "gLine"], k: ["k0", "k1", "k2", "k3", "gLine"] };

const BARREL = { x: 100, length: 140 };
const EMITTER = 22;

const RING = { first: 12, step: 18, w: 7 };

const buildParts = length => [
  { name: "grip", x: -16, y: -14, w: 30, h: 46, mat: "g", tone: 0 },
  { name: "body", x: -52, y: -76, w: 152, h: 62, mat: "g", tone: 2 },
  { name: "bodyTop", x: -52, y: -76, w: 152, h: 12, mat: "g", tone: 3 },
  { name: "bodyLow", x: -52, y: -30, w: 152, h: 16, mat: "g", tone: 0 },
  { name: "band", x: 22, y: -80, w: 26, h: 70, mat: "w", tone: 2 },
  { name: "vent", x: 66, y: -64, w: 22, h: 26, mat: "k", tone: 0 },
  { name: "barrel", x: BARREL.x, y: -55, w: length, h: 37, mat: "g", tone: 1 },
  { name: "barrelTop", x: BARREL.x, y: -55, w: length, h: 8, mat: "g", tone: 3 },
  ...Array.from({ length: Math.max(0, Math.floor((length - RING.first - RING.w) / RING.step) + 1) }, (_, i) => ({ name: "ring" + i, x: BARREL.x + RING.first + i * RING.step, y: -57, w: RING.w, h: 41, mat: "b", tone: 2 })),
  { name: "emitter", x: BARREL.x + length, y: -63, w: EMITTER, h: 53, mat: "k", tone: 2 }
];

function idleGlow(ctx, length, simple) {
  if (simple) return;
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = COLORS.b2;
  ctx.beginPath();
  ctx.ellipse(BARREL.x + length + EMITTER + 5, -36, 10, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const MUZZLE = [BARREL.x + BARREL.length + EMITTER, -36];
const core = window.GUN.model({ buildParts, mat: MAT, colors: COLORS, after: idleGlow, barrel: BARREL, muzzle: MUZZLE });

const SHOT = { cycle: 4, step: 36, lead: 8, r: 7 };
const RANGE = 9 * 24;

function crescent(ctx, x, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.3, -r);
  ctx.quadraticCurveTo(x + r * 1.5, 0, x - r * 0.3, r);
  ctx.quadraticCurveTo(x + r * 0.5, 0, x - r * 0.3, -r);
  ctx.fill();
}

function bolt(ctx, x, simple) {
  ctx.save();
  if (!simple) {
    ctx.globalAlpha = 0.35;
    crescent(ctx, x - 6, SHOT.r * 1.2, COLORS.b1);
    ctx.globalAlpha = 1;
  }
  crescent(ctx, x, SHOT.r, COLORS.b2);
  crescent(ctx, x + 1.2, SHOT.r * 0.7, COLORS.w3);
  ctx.restore();
}

function shot(ctx, length, tick, simple = false) {
  const age = tick % SHOT.cycle;
  if (age === 0 && !simple) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = COLORS.b3;
    ctx.beginPath();
    ctx.ellipse(3, 0, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (let k = 0; ; k++) {
    const x = SHOT.lead + (age + k * SHOT.cycle) * SHOT.step;
    if (x > length) break;
    bolt(ctx, x, simple);
  }
}

const HUD_K = 1.45;
const HUD_BURST = [[COLORS.b2, 2.2, 3.4], ["#fcfcfc", 2.6, 2.4]];

function hudShot(ctx) {
  ctx.save();
  ctx.scale(HUD_K, HUD_K);
  for (const [color, x, r] of HUD_BURST) crescent(ctx, x, r, color);
  ctx.restore();
}

window.MGX800 = { ...core, SHOT, RANGE, shot, hudShot };
})();
