(() => {
const ENV_PAL = window.ENV.PALETTE;
const HEAT = { h0: ENV_PAL.hole, h1: ENV_PAL.hole, h2: ENV_PAL.hole, h3: ENV_PAL.hole, hLine: ENV_PAL.hole };
const tones = (k, from, line) => Object.fromEntries([0, 1, 2, 3].map(i => [k + i, ENV_PAL[from + i]]).concat([[k + "Line", ENV_PAL[line]]]));
const COLORS = { ...HEAT, ...tones("s", "m", "mLine"), ...tones("k", "c", "mLine"), ...tones("o", "a", "aLine"), y0: ENV_PAL.y0, y1: ENV_PAL.y1, y2: ENV_PAL.y2, y3: ENV_PAL.y3, yLine: ENV_PAL.yLine };
const MAT = { s: ["s0", "s1", "s2", "s3", "sLine"], k: ["k0", "k1", "k2", "k3", "kLine"], o: ["o0", "o1", "o2", "o3", "oLine"], h: ["h0", "h1", "h2", "h3", "hLine"], y: ["y0", "y1", "y2", "y3", "yLine"] };

const BARREL = { x: 74, length: 153 };
const CAP = 21;
const COIL = { first: 16, step: 19.8, w: 8 };

const buildParts = length => [
  { name: "grip", x: -18, y: -13, w: 34, h: 45, mat: "s", tone: 0 },
  { name: "body", x: -50, y: -73, w: 124, h: 63, mat: "k", tone: 1 },
  { name: "bodyTop", x: -50, y: -73, w: 124, h: 13, mat: "k", tone: 2 },
  { name: "heatSlot", x: -23, y: -81, w: 60, h: 12, mat: "h", tone: 0 },
  { name: "filament", x: -18, y: -79, w: 50, h: 5, mat: "o", tone: 2 },
  { name: "hazard", x: -37, y: -47, w: 45, h: 16, mat: "y", tone: 2 },
  { name: "barrel", x: BARREL.x, y: -60, w: length, h: 37, mat: "s", tone: 1 },
  ...Array.from({ length: Math.max(0, Math.floor((length - COIL.first - COIL.w) / COIL.step) + 1) }, (_, i) => ({ name: "coil" + i, x: BARREL.x + COIL.first + i * COIL.step, y: -60, w: COIL.w, h: 37, mat: "o", tone: 1 })),
  { name: "cap", x: BARREL.x + length, y: -68, w: CAP, h: 53, mat: "k", tone: 2 }
];

function heat(ctx, length, simple) {
  if (simple) return;
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = ENV_PAL.a2;
  ctx.beginPath();
  ctx.ellipse(7, -80, 30, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const core = window.GUN.model({ buildParts, mat: MAT, colors: COLORS, after: heat });
const MUZZLE = [BARREL.x + BARREL.length + CAP, -41];
const SUPPORT = [BARREL.x + 14, -23];
const BAND = { y: -60, h: 37 };
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
  [3, -3.4, 2.6, 3.4, "#55636a"],
  [0.6, -8, 9.4, 4.8, "#c4ccd0"],
  [0.6, -8, 9.4, 1, "#eef2f2"],
  [2.6, -8.6, 4.6, 0.9, "#0c0806"],
  [3, -8.5, 3.8, 0.4, ENV_PAL.a2],
  [1.6, -6, 3.4, 1.2, ENV_PAL.hazard],
  [10, -7, 11.6, 2.8, "#8e9aa0"],
  ...[11.2, 12.7, 14.2, 15.7, 17.2, 18.7, 20.2].map(x => [x, -7, 0.6, 2.8, ENV_PAL.a1]),
  [21.6, -7.6, 1.6, 4, "#dfe5e7"]
];
const n = v => +v.toFixed(2);
const ICON = { w: n(23.2 * ICON_SCALE), arcEnd: n(23.2 * ICON_SCALE) };
const icon = x => `<g transform="translate(${x} 15) scale(${ICON_SCALE})" stroke="#202826" stroke-width=".2">${ICON_RECTS.map(([rx, ry, w, h, fill]) => `<rect x="${rx}" y="${ry}" width="${w}" height="${h}" fill="${fill}"${h < 1 ? ' stroke="none"' : ""}/>`).join("")}</g>`;

const sized = fn => (ctx, opts = {}) => fn(ctx, { ...opts, barrel: opts.barrel ?? BARREL.length });

window.TOASTER = { ...core, draw: sized(core.draw), hook: sized(core.hook), slung: sized(core.slung), BARREL, MUZZLE, SUPPORT, muzzleInHook: toHook(MUZZLE), supportInHook: toHook(SUPPORT), holdPoses, ICON, icon };
})();
