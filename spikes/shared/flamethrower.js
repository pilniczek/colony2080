(() => {
const ENV_PAL = window.ENV.PALETTE;
const tones = (k, from, line) => Object.fromEntries([0, 1, 2, 3].map(i => [k + i, ENV_PAL[from + i]]).concat([[k + "Line", ENV_PAL[line]]]));
const COLORS = { ...tones("s", "m", "mLine"), ...tones("k", "c", "mLine"), ...tones("r", "b", "bLine"), ...tones("o", "a", "aLine") };
const MAT = { s: ["s0", "s1", "s2", "s3", "sLine"], k: ["k0", "k1", "k2", "k3", "kLine"], r: ["r0", "r1", "r2", "r3", "rLine"], o: ["o0", "o1", "o2", "o3", "oLine"] };

const BARREL = { x: 84, length: 120 };
const NOZZLE = 30;

const buildParts = length => [
  { name: "stock", x: -100, y: -58, w: 44, h: 26, mat: "s", tone: 0 },
  { name: "grip", x: -16, y: -14, w: 30, h: 46, mat: "s", tone: 0 },
  { name: "body", x: -58, y: -62, w: 142, h: 44, mat: "s", tone: 1 },
  { name: "bodyTop", x: -58, y: -62, w: 142, h: 10, mat: "s", tone: 2 },
  { name: "tank", x: -44, y: -116, w: 112, h: 54, mat: "r", tone: 2 },
  { name: "tankBack", x: -52, y: -110, w: 10, h: 42, mat: "s", tone: 2 },
  { name: "tankFront", x: 66, y: -110, w: 10, h: 42, mat: "s", tone: 2 },
  { name: "tankBand", x: 6, y: -118, w: 10, h: 58, mat: "s", tone: 1 },
  { name: "valve", x: 74, y: -84, w: 12, h: 24, mat: "k", tone: 2 },
  { name: "barrel", x: BARREL.x, y: -52, w: length, h: 24, mat: "s", tone: 2 },
  { name: "nozzle", x: BARREL.x + length, y: -62, w: NOZZLE, h: 44, mat: "k", tone: 2 },
  { name: "pilot", x: BARREL.x + length + 4, y: -18, w: 20, h: 8, mat: "o", tone: 2 }
];

function pilotFlame(ctx, length, simple) {
  if (simple) return;
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = ENV_PAL.a2;
  ctx.beginPath();
  ctx.ellipse(BARREL.x + length + NOZZLE + 4, -14, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const core = window.GUN.model({ buildParts, mat: MAT, colors: COLORS, after: pilotFlame });
const MUZZLE = [BARREL.x + BARREL.length + NOZZLE, -40];
const SUPPORT = [BARREL.x + 22, -28];
const BAND = { y: -62, h: 44 };
const SCAN = { x: -600, w: 1600 };
const toHook = pt => [-pt[1], pt[0]];

function silhouetteEdge(root, hookName, pose) {
  const { locate, render } = window.XBOT;
  const canvas = document.createElement("canvas");
  canvas.width = SCAN.w;
  canvas.height = BAND.h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const toGun = locate(root, hookName, pose).multiply(new DOMMatrix([0, 1, -1, 0, 0, 0])).inverse();
  ctx.setTransform(new DOMMatrix().translate(-SCAN.x, -BAND.y).multiply(toGun));
  render(ctx, root, { pose, lineW: 0 });
  const { data } = ctx.getImageData(0, 0, SCAN.w, BAND.h);
  let edge = -Infinity;
  for (let i = 3; i < data.length; i += 4) if (data[i]) edge = Math.max(edge, (i >> 2) % SCAN.w);
  return edge + SCAN.x;
}

const CARRY = { arm: 22, fore: -94 };
const FRONT_CARRY = { armL: -24, foreL: -66 };

function holdPoses(side, front) {
  const { locate, solve } = window.XBOT;
  const grip = toHook(SUPPORT);
  const CARRY_FAR = solve(side, "handFar", CARRY, ["armFar", "foreFar"], [[-160, 40], [-150, 30]], locate(side, "hand", CARRY).transformPoint(new DOMPoint(...grip)));
  const FRONT_CARRY_R = solve(front, "handR", FRONT_CARRY, ["armR", "foreR"], [[-40, 120], [-60, 150]], locate(front, "handL", FRONT_CARRY).transformPoint(new DOMPoint(...grip)));
  const clear = silhouetteEdge(front, "handL", { ...FRONT_CARRY, ...FRONT_CARRY_R }) + BAND.h;
  const FRONT_BARREL = Math.max(BARREL.length, Math.ceil(BARREL.length + clear - MUZZLE[0]));
  return { CARRY, CARRY_FAR, FRONT_CARRY, FRONT_CARRY_R, FRONT_BARREL };
}

const ICON_SCALE = 1.45;
const ICON_RECTS = [
  [0.4, -6.2, 3, 2.2, "#55636a"],
  [5.4, -3.4, 2.2, 3.4, "#55636a"],
  [3.2, -6.6, 9.4, 3.2, "#8e9aa0"],
  [4.6, -8.6, 7.6, 2, ENV_PAL.b2],
  [4.6, -8.6, 7.6, 0.6, ENV_PAL.b3],
  [8, -8.6, 0.9, 2.2, "#c4ccd0"],
  [12.6, -6, 7.8, 1.8, "#c4ccd0"],
  [20.4, -6.8, 2.8, 3.4, "#dfe5e7"],
  [20.8, -3.4, 1.6, 0.7, ENV_PAL.a1]
];
const n = v => +v.toFixed(2);
const ICON_FLAME = { y: -5.1, layers: [["#c8300c", 26.6, 3, 1.8], ["#f09024", 26.2, 2.3, 1.3], ["#fce438", 25.6, 1.5, 0.85], ["#fcf0c4", 24.9, 0.8, 0.45]] };
const ICON = { w: n(23.2 * ICON_SCALE), arcEnd: n(29.6 * ICON_SCALE) };
const iconFlame = ICON_FLAME.layers.map(([fill, cx, rx, ry]) => `<ellipse cx="${cx}" cy="${ICON_FLAME.y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="none"/>`).join("");
const icon = x => `<g transform="translate(${x} 15.7) scale(${ICON_SCALE})" stroke="#202826" stroke-width=".2">${ICON_RECTS.map(([rx, ry, w, h, fill]) => `<rect x="${rx}" y="${ry}" width="${w}" height="${h}" fill="${fill}"${h < 1 ? ' stroke="none"' : ""}/>`).join("")}${iconFlame}</g>`;

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
const sized = fn => (ctx, opts = {}) => fn(ctx, { ...opts, barrel: opts.barrel ?? BARREL.length });

window.FLAMETHROWER = { ...core, draw: sized(core.draw), hook: sized(core.hook), slung: sized(core.slung), BARREL, MUZZLE, muzzleInHook: toHook(MUZZLE), holdPoses, ICON, icon, LIFE, RANGE, flame, stream };
})();
