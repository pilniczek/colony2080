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

const MUZZLE = [BARREL.x + BARREL.length + CAP, -41];
const BAND = { y: -60, h: 37 };
const core = window.GUN.model({ buildParts, mat: MAT, colors: COLORS, after: heat, barrel: BARREL, muzzle: MUZZLE, band: BAND });

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

const HUD_K = 1.45;
const HUD_BALL = [["#c8300c", 2.2, 2.6, 1.8], ["#f09024", 2.4, 2, 1.3], ["#fce438", 2.6, 1.4, 0.9], ["#fcf0c4", 2.8, 0.8, 0.45]];
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
const hudShot = ctx => hudOvals(ctx, HUD_BALL);

window.TOASTER = { ...core, hudShot, SHOT, shot, shotFrame, RANGE, sight };
})();
