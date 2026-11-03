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
const ICON_BALL = { x: 25.4, y: -5.6, layers: [["#c8300c", 2.6, 1.8, 0], ["#f09024", 2, 1.3, 0.2], ["#fce438", 1.4, 0.9, 0.4], ["#fcf0c4", 0.8, 0.45, 0.6]] };
const ICON = { w: n(23.2 * ICON_SCALE), arcEnd: n((ICON_BALL.x + 2.6) * ICON_SCALE) };
const iconBall = ICON_BALL.layers.map(([fill, rx, ry, ahead]) => `<ellipse cx="${n(ICON_BALL.x + ahead)}" cy="${ICON_BALL.y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="none"/>`).join("");
const icon = x => `<g transform="translate(${x} 15.7) scale(${ICON_SCALE})" stroke="#202826" stroke-width=".2">${ICON_RECTS.map(([rx, ry, w, h, fill]) => `<rect x="${rx}" y="${ry}" width="${w}" height="${h}" fill="${fill}"${h < 1 ? ' stroke="none"' : ""}/>`).join("")}${iconBall}</g>`;

const SHOT = { cycle: 7, step: 24, lead: 12, frames: 6 };
const BALL = [["#ac2c0c", 7.5, 5, 0], ["#c8300c", 7, 4.4, 0], ["#e86418", 6.4, 3.8, 0.4], ["#f09024", 5.6, 3.2, 0.8], ["#f4b82c", 4.8, 2.6, 1.2], ["#fce438", 3.8, 2, 1.6], ["#fcf0c4", 2.4, 1.1, 2]];
const TAIL = [["#ac2c0c", 2.4, 1.8], ["#e86418", 1.4, 1]];

function oval(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function ball(ctx, x, y, simple) {
  for (const [color, rx, ry] of TAIL) oval(ctx, x - 10, y - 0.6, rx, ry, color);
  for (const [color, rx, ry, ahead] of simple ? BALL.filter((_, i) => i % 2 === 0) : BALL) oval(ctx, x + ahead, y, rx, ry, color);
}

function flash(ctx, simple) {
  ctx.save();
  ctx.globalAlpha = 0.55;
  oval(ctx, 2, 0, 6, 4, "#f09024");
  ctx.globalAlpha = 1;
  oval(ctx, 2, 0, simple ? 3 : 2.6, simple ? 2 : 1.6, "#fcf0c4");
  ctx.restore();
}

const shotFrame = tick => (tick % SHOT.cycle) - 1;

function shot(ctx, length, tick, simple = false) {
  const f = shotFrame(tick);
  if (f < 0) return;
  const x = SHOT.lead + f * SHOT.step;
  if (f === 0) flash(ctx, simple);
  if (x <= length) ball(ctx, x, 0, simple);
}

const RANGE = 6 * 24;
const SIGHT = { r: 4, side: 3, tick: 1.4, post: [5.2, 1.8], dot: 0.45, width: 0.7, idle: ["#e86418", 0.4], hit: ["#fce438", 0.9] };

function sight(ctx, hit = false, simple = false) {
  const [color, alpha] = hit ? SIGHT.hit : SIGHT.idle;
  const { r, side, tick, post, dot } = SIGHT;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = simple ? SIGHT.width * 1.4 : SIGHT.width;
  ctx.beginPath();
  ctx.moveTo(-r + tick, -side);
  ctx.lineTo(-r, -side);
  ctx.lineTo(-r, 0);
  ctx.arc(0, 0, r, Math.PI, 0, true);
  ctx.lineTo(r, -side);
  ctx.lineTo(r - tick, -side);
  ctx.moveTo(0, -post[0]);
  ctx.lineTo(0, -post[1]);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, dot, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const sized = fn => (ctx, opts = {}) => fn(ctx, { ...opts, barrel: opts.barrel ?? BARREL.length });

window.TOASTER = { ...core, draw: sized(core.draw), hook: sized(core.hook), slung: sized(core.slung), BARREL, MUZZLE, SUPPORT, muzzleInHook: toHook(MUZZLE), supportInHook: toHook(SUPPORT), holdPoses, ICON, icon, SHOT, shot, shotFrame, RANGE, sight };
})();
