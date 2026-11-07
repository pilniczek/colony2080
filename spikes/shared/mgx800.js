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

const core = window.GUN.model({ buildParts, mat: MAT, colors: COLORS, after: idleGlow });
const MUZZLE = [BARREL.x + BARREL.length + EMITTER, -60];
const SUPPORT = [BARREL.x + 14, -44];
const BAND = { y: -90, h: 60 };
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

const CARRY = { arm: 0, fore: -72 };
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
  [0.4, -7, 7.6, 3.6, "#64605c"],
  [0.4, -7, 7.6, 0.8, "#a8aca8"],
  [5.4, -3.4, 2.2, 3.4, "#55636a"],
  [8, -8.4, 8.6, 6.4, "#a8aca8"],
  [8, -3.6, 8.6, 1.6, "#2c3838"],
  [11.4, -8.4, 2.2, 6.4, "#fcfcfc"],
  [16.6, -6.4, 5.2, 2.6, "#8e9aa0"],
  [18.6, -6.8, 1, 3.4, COLORS.b2],
  [21.8, -7.2, 1.6, 4.2, "#dfe5e7"]
];
const n = v => +v.toFixed(2);
const ICON_BURST = { x: 25.6, y: -5.1 };
const ICON = { w: n(23.4 * ICON_SCALE), arcEnd: n((ICON_BURST.x + 3.6) * ICON_SCALE) };
const crescentPath = (x, y, r) => `M${n(x - r * 0.3)} ${n(y - r)}Q${n(x + r * 1.5)} ${y} ${n(x - r * 0.3)} ${n(y + r)}Q${n(x + r * 0.5)} ${y} ${n(x - r * 0.3)} ${n(y - r)}Z`;
const iconBurst = `<path d="${crescentPath(ICON_BURST.x, ICON_BURST.y, 3.4)}" fill="${COLORS.b2}" stroke="none"/><path d="${crescentPath(ICON_BURST.x + 0.4, ICON_BURST.y, 2.4)}" fill="#fcfcfc" stroke="none"/>`;
const icon = x => `<g transform="translate(${x} 15.7) scale(${ICON_SCALE})" stroke="#202826" stroke-width=".2">${ICON_RECTS.map(([rx, ry, w, h, fill]) => `<rect x="${rx}" y="${ry}" width="${w}" height="${h}" fill="${fill}"${h < 1 ? ' stroke="none"' : ""}/>`).join("")}${iconBurst}</g>`;

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

const sized = fn => (ctx, opts = {}) => fn(ctx, { ...opts, barrel: opts.barrel ?? BARREL.length });

window.MGX800 = { ...core, draw: sized(core.draw), hook: sized(core.hook), slung: sized(core.slung), BARREL, MUZZLE, muzzleInHook: toHook(MUZZLE), holdPoses, ICON, icon, SHOT, RANGE, shot };
})();
