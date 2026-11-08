(() => {
const ENV_PAL = window.ENV.PALETTE;
const tones = (k, from, line) => Object.fromEntries([0, 1, 2, 3].map(i => [k + i, ENV_PAL[from + i]]).concat([[k + "Line", ENV_PAL[line]]]));
const COLORS = { ...tones("s", "m", "mLine"), ...tones("k", "c", "mLine"), ...tones("r", "b", "bLine"), ...tones("o", "a", "aLine") };
const MAT = { s: ["s0", "s1", "s2", "s3", "sLine"], k: ["k0", "k1", "k2", "k3", "kLine"], r: ["r0", "r1", "r2", "r3", "rLine"], o: ["o0", "o1", "o2", "o3", "oLine"] };

const BARREL = { x: 84, length: 120 };
const NOZZLE = 30;

const buildParts = length => [
  { name: "stock", x: -100, y: -58, w: 44, h: 26, mat: "s", tone: 0 },
  { name: "grip", x: -16, y: -18, w: 30, h: 50, mat: "s", tone: 0 },
  { name: "body", x: -58, y: -62, w: 142, h: 44, mat: "s", tone: 1 },
  { name: "bodyTop", x: -58, y: -62, w: 142, h: 10, mat: "s", tone: 2 },
  { name: "tank", x: -44, y: -116, w: 112, h: 54, mat: "r", tone: 2 },
  { name: "tankBack", x: -52, y: -110, w: 10, h: 42, mat: "s", tone: 2 },
  { name: "tankFront", x: 66, y: -110, w: 10, h: 42, mat: "s", tone: 2 },
  { name: "tankBand", x: 6, y: -118, w: 10, h: 58, mat: "s", tone: 1 },
  { name: "valve", x: 74, y: -84, w: 12, h: 24, mat: "k", tone: 2 },
  { name: "barrel", x: BARREL.x, y: -42, w: length, h: 24, mat: "s", tone: 2 },
  { name: "nozzle", x: BARREL.x + length, y: -52, w: NOZZLE, h: 44, mat: "k", tone: 2 },
  { name: "igniter", x: BARREL.x + length + 14, y: -9, w: 20, h: 7, mat: "k", tone: 1 }
];

const PILOT = {
  outer: [[0, 3.5], [0, -3.5], [5, -8], [8, -15], [7, -23], [11, -34], [14, -25], [19, -31], [21, -19], [18, -7], [11, 3]],
  mid: [[0, 2.8], [0, -2.8], [4, -6.5], [7, -12], [7, -18], [11, -24], [13, -17], [16, -19], [16, -10], [13, -3], [8, 2.5]],
  core: [[0.5, 2], [0.5, -2], [4, -4.5], [7, -9], [10, -13], [11, -7], [9, -1], [5, 2]],
  blue: [[0, 3], [0, -3], [3.5, -4], [6.5, -2.5], [6.5, 1.5], [3.5, 3]]
};
const PILOT_TOP = -34;
const PILOT_COLORS = { outer: "#c8401a", mid: ENV_PAL.a2, core: "#fff1c4", blue: "#3f7cff", glow: ENV_PAL.a2 };

const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;

function pilotLayer(ctx, pts, hex, alpha, fade) {
  const g = ctx.createLinearGradient(0, 4, 0, PILOT_TOP * fade);
  g.addColorStop(0, rgba(hex, alpha));
  g.addColorStop(0.55, rgba(hex, alpha * 0.85));
  g.addColorStop(1, rgba(hex, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i], [nx, ny] = pts[i + 1];
    ctx.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2);
  }
  ctx.lineTo(...pts[pts.length - 1]);
  ctx.closePath();
  ctx.fill();
}

function pilotFlame(ctx, length, simple) {
  ctx.save();
  ctx.translate(BARREL.x + length + NOZZLE + 4, -5.5);
  if (!simple) {
    const g = ctx.createRadialGradient(9, -10, 0, 9, -10, 28);
    g.addColorStop(0, rgba(PILOT_COLORS.glow, 0.35));
    g.addColorStop(1, rgba(PILOT_COLORS.glow, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(9, -10, 28, 0, Math.PI * 2); ctx.fill();
  }
  pilotLayer(ctx, PILOT.outer, PILOT_COLORS.outer, 0.95, 1);
  if (!simple) pilotLayer(ctx, PILOT.mid, PILOT_COLORS.mid, 0.95, 0.75);
  pilotLayer(ctx, PILOT.core, PILOT_COLORS.core, 1, 0.45);
  if (!simple) pilotLayer(ctx, PILOT.blue, PILOT_COLORS.blue, 0.9, 0.15);
  ctx.restore();
}

const MUZZLE = [BARREL.x + BARREL.length + NOZZLE, -30];
const core = window.GUN.model({ buildParts, mat: MAT, colors: COLORS, after: pilotFlame, barrel: BARREL, muzzle: MUZZLE });

const STEPS = [2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 2, 2, 2];
const LIFE = STEPS.length;
const SPAWN_TICKS = 2;
const FLAME = { grow: 9, base: 2, rise: 9, fade: 20, sway: 0.25, jitter: 0.15, billow: 0.55 };
const LAYERS = [["#ac2c0c", 1], ["#e86418", 0.82], ["#f09024", 0.64], ["#fce438", 0.44], ["#fcf0c4", 0.24]];
const BILLOWS = [[-0.55, -0.7, 0.6], [0.35, -0.55, 0.5], [-1.05, -0.2, 0.45]];
const travel = age => STEPS.slice(0, age).reduce((sum, s) => sum + s, 0);

function oval(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function tongue(ctx, x, rx, ry, curl, color) {
  const tip = [x - rx * 1.9, -ry * (0.2 + curl)];
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(...tip);
  ctx.quadraticCurveTo(x - rx * 0.9, -ry * 1.05, x, -ry);
  ctx.bezierCurveTo(x + rx * 0.75, -ry, x + rx, -ry * 0.45, x + rx, 0);
  ctx.bezierCurveTo(x + rx, ry * 0.6, x + rx * 0.6, ry, x, ry);
  ctx.quadraticCurveTo(x - rx, ry * 0.9, ...tip);
  ctx.fill();
}

function flame(ctx, age, seed, simple = false) {
  const u = Math.min(1, Math.max(1, age) / LIFE);
  const size = 1 + Math.sin(seed * 2.3) * FLAME.jitter;
  const r = (FLAME.base + FLAME.grow * Math.pow(u, 0.8)) * size;
  const curl = 0.3 + 0.3 * Math.sin(seed * 1.3 + age * 0.7);
  const hot = Math.max(1, Math.ceil(LAYERS.length * (1 - 0.7 * u)));
  const layers = LAYERS.slice(0, hot).filter((_, i) => !simple || i % 2 === 0);
  ctx.save();
  ctx.translate(0, -FLAME.rise * u * u + Math.cos(seed * 3.1) * r * FLAME.jitter);
  ctx.rotate(Math.sin(seed * 1.7 + age * 0.9) * FLAME.sway);
  if (age > FLAME.fade) ctx.globalAlpha *= Math.max(0.2, (LIFE + 1 - age) / (LIFE + 1 - FLAME.fade));
  if (u > FLAME.billow) {
    const k = (u - FLAME.billow) / (1 - FLAME.billow);
    for (const [bx, by, br] of simple ? BILLOWS.slice(0, 1) : BILLOWS) for (const [color, f] of layers.slice(0, 2)) oval(ctx, bx * r, by * r * k, br * r * f * k, br * r * f * 0.8 * k, color);
  }
  for (const [color, k] of layers) tongue(ctx, r * 0.3 * (1 - k), r * 1.15 * k, r * 0.8 * k, curl, color);
  ctx.restore();
}

function stream(ctx, tick, simple = false) {
  for (let k = Math.max(0, Math.ceil((tick - LIFE + 1) / SPAWN_TICKS) * SPAWN_TICKS); k <= tick; k += SPAWN_TICKS) {
    const age = tick - k + 1;
    ctx.save();
    ctx.translate(travel(age), 0);
    flame(ctx, age, k, simple);
    ctx.restore();
  }
}

const RANGE = travel(LIFE);

const HUD_K = 1.45;
const HUD_FLAME = [["#c8300c", 3.4, 3, 1.8], ["#f09024", 3, 2.3, 1.3], ["#fce438", 2.4, 1.5, 0.85], ["#fcf0c4", 1.7, 0.8, 0.45]];
function hudOvals(ctx, layers) {
  ctx.save();
  ctx.scale(HUD_K, HUD_K);
  for (const [color, x, rx, ry] of layers) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
const hudShot = ctx => hudOvals(ctx, HUD_FLAME);

window.FLAMETHROWER = { ...core, hudShot, LIFE, RANGE, flame, stream };
})();
