(() => {
const ENV_PAL = window.ENV.PALETTE;
const COLORS = {
  g0: "#302c20", g1: "#545048", g2: "#7c7870", g3: "#a4a4a4", gLine: "#100c08",
  w0: "#7c7870", w1: "#b4acac", w2: "#e4ece0", w3: "#fcfcfc",
  r0: "#301c10", r1: "#4c3418", r2: "#7c5430", r3: "#a8744c",
  k0: ENV_PAL.c0, k1: ENV_PAL.c1, k2: ENV_PAL.c2, k3: ENV_PAL.c3
};
const MAT = { g: ["g0", "g1", "g2", "g3", "gLine"], w: ["w0", "w1", "w2", "w3", "gLine"], r: ["r0", "r1", "r2", "r3", "gLine"], k: ["k0", "k1", "k2", "k3", "gLine"] };

const BARREL = { x: 100, length: 132 };
const NOZZLE = 20;
const RING = { w: 14, gap: 26, from: 10 };

const rings = length => Array.from({ length: Math.floor((length - RING.from) / RING.gap) }, (_, i) =>
  ({ name: "ring" + i, x: BARREL.x + RING.from + i * RING.gap, y: -56, w: RING.w, h: 44, mat: "w", tone: 2 }));

const buildParts = length => [
  window.GUN.grip("g", 0),
  { name: "body", x: -64, y: -74, w: 164, h: 64, mat: "g", tone: 2 },
  { name: "bodyTop", x: -64, y: -74, w: 164, h: 12, mat: "w", tone: 2 },
  { name: "bodyLow", x: -64, y: -28, w: 164, h: 18, mat: "g", tone: 0 },
  { name: "tank", x: -44, y: -66, w: 34, h: 34, mat: "r", tone: 2 },
  { name: "valve", x: 6, y: -70, w: 18, h: 26, mat: "r", tone: 1 },
  { name: "collar", x: 64, y: -80, w: 24, h: 70, mat: "w", tone: 3 },
  { name: "barrel", x: BARREL.x, y: -50, w: length, h: 32, mat: "g", tone: 1 },
  { name: "barrelTop", x: BARREL.x, y: -50, w: length, h: 8, mat: "g", tone: 3 },
  ...rings(length),
  { name: "nozzle", x: BARREL.x + length, y: -58, w: NOZZLE, h: 48, mat: "k", tone: 2 }
];

function pilot(ctx, length, simple) {
  if (simple) return;
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = "#f09024";
  ctx.beginPath();
  ctx.ellipse(BARREL.x + length + NOZZLE + 4, -34, 7, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const MUZZLE = [BARREL.x + BARREL.length + NOZZLE, -34];
const core = window.GUN.model({ buildParts, mat: MAT, colors: COLORS, after: pilot, barrel: BARREL, muzzle: MUZZLE });

const BLOB = [["#c8300c", 12, 5.4], ["#f09024", 10.5, 4.4], ["#fce438", 8, 3.2]];
const STRIP = [["#ac2c0c", 12.5, 2.8], ["#e86418", 11, 2], ["#fce438", 8, 1]];
const RAG = [0.6, -0.5, 0.9, -0.2, 0.4, -0.8];

function oval(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function segment(ctx, x, layers, rag, simple) {
  for (const [color, rx, ry] of simple ? layers.filter((_, i) => i !== 1) : layers) oval(ctx, x, rag, rx, ry + Math.abs(rag) * 0.5, color);
}

function shot(ctx, length, tick, simple = false) {
  const { SHOT, shotFrame } = window.TOASTER;
  const f = shotFrame(tick);
  if (f < 0) return;
  for (let c = 0; c < SHOT.frames; c++) {
    const x = SHOT.lead + c * SHOT.step;
    if (x > length) break;
    segment(ctx, x, f === 0 ? BLOB : STRIP, f === 0 ? 0 : RAG[(c + f) % RAG.length], simple);
  }
}

const HUD_K = 1.45;
const HUD_JET = [["#c8300c", 3.4, 3.4, 2.4], ["#f09024", 3, 2.8, 1.8], ["#fce438", 2.6, 2, 1], ["#fcfcfc", 3.2, 2.8, 0.4]];

function hudShot(ctx) {
  ctx.save();
  ctx.scale(HUD_K, HUD_K);
  for (const [color, x, rx, ry] of HUD_JET) oval(ctx, x, 0, rx, ry, color);
  ctx.restore();
}

window.FLAMESTREAM = { ...core, get RANGE() { return window.TOASTER.RANGE; }, shot, hudShot };
})();
