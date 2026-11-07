(() => {
const ENV_PAL = window.ENV.PALETTE;
const COLORS = {
  g0: "#2c3838", g1: "#64605c", g2: "#a8aca8", g3: "#c4cccc", gLine: "#141818",
  w0: "#a8aca8", w1: "#c4cccc", w2: "#e8ecec", w3: "#fcfcfc",
  b0: "#2c5c74", b1: "#4c94b4", b2: "#7cc4e4", b3: "#c4ecfc",
  k0: ENV_PAL.c0, k1: ENV_PAL.c1, k2: ENV_PAL.c2, k3: ENV_PAL.c3
};
const MAT = { g: ["g0", "g1", "g2", "g3", "gLine"], w: ["w0", "w1", "w2", "w3", "gLine"], b: ["b0", "b1", "b2", "b3", "gLine"], k: ["k0", "k1", "k2", "k3", "gLine"] };

const BARREL = { x: 112, length: 104 };
const EMITTER = 22;

const buildParts = length => [
  { name: "stock", x: -132, y: -84, w: 126, h: 56, mat: "g", tone: 1 },
  { name: "stockTop", x: -132, y: -84, w: 126, h: 11, mat: "g", tone: 2 },
  { name: "grip", x: -16, y: -14, w: 30, h: 46, mat: "g", tone: 0 },
  { name: "body", x: -6, y: -104, w: 118, h: 90, mat: "g", tone: 2 },
  { name: "bodyLow", x: -6, y: -38, w: 118, h: 24, mat: "g", tone: 0 },
  { name: "band", x: 40, y: -104, w: 30, h: 90, mat: "w", tone: 2 },
  { name: "vent", x: 82, y: -92, w: 20, h: 40, mat: "k", tone: 0 },
  { name: "barrel", x: BARREL.x, y: -76, w: length, h: 32, mat: "g", tone: 1 },
  { name: "barrelTop", x: BARREL.x, y: -76, w: length, h: 8, mat: "g", tone: 3 },
  { name: "coil", x: BARREL.x + length * 0.45, y: -82, w: 14, h: 44, mat: "b", tone: 2 },
  { name: "emitter", x: BARREL.x + length, y: -90, w: EMITTER, h: 60, mat: "k", tone: 2 }
];

function idleGlow(ctx, length, simple) {
  if (simple) return;
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = COLORS.b2;
  ctx.beginPath();
  ctx.ellipse(BARREL.x + length + EMITTER + 5, -60, 10, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const MUZZLE = [BARREL.x + BARREL.length + EMITTER, -60];
const BAND = { y: -90, h: 60 };
const core = window.GUN.model({ buildParts, mat: MAT, colors: COLORS, after: idleGlow, barrel: BARREL, muzzle: MUZZLE, band: BAND });

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

window.MGX800 = { ...core, SHOT, RANGE, shot };
})();
