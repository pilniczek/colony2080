(() => {
const PALETTE = window.XBOT.PALETTE;

const GRIP_PTS = [[14, -14], [-16, -14], [-34, 52], [-6, 52]];
function grip(mat, tone) {
  const xs = GRIP_PTS.map(p => p[0]), ys = GRIP_PTS.map(p => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { name: "grip", x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y, pts: GRIP_PTS, mat, tone };
}

const BARREL = { x: 70, length: 196 };
const buildParts = length => [
  grip("m", 1),
  { name: "stock", x: -82, y: -64, w: 22, h: 50, mat: "m", tone: 0 },
  { name: "handle", x: -36, y: -96, w: 72, h: 18, mat: "m", tone: 1 },
  { name: "handlePost", x: -36, y: -82, w: 14, h: 16, mat: "m", tone: 1 },
  { name: "handlePostFront", x: 22, y: -82, w: 14, h: 16, mat: "m", tone: 1 },
  { name: "receiver", x: -60, y: -70, w: 130, h: 60, mat: "m", tone: 2 },
  { name: "stripe", x: -14, y: -70, w: 14, h: 60, mat: "a", tone: 1 },
  { name: "feed", x: 14, y: -12, w: 48, h: 40, mat: "m", tone: 0 },
  { name: "barrelBack", x: BARREL.x, y: -62, w: length - 6, h: 44, mat: "m", tone: 0 },
  { name: "barrelTop", x: BARREL.x, y: -62, w: length, h: 12, mat: "c", tone: 1 },
  { name: "barrelMid", x: BARREL.x, y: -46, w: length, h: 12, mat: "c", tone: 2 },
  { name: "barrelLow", x: BARREL.x, y: -30, w: length, h: 12, mat: "c", tone: 1 },
  { name: "ringRear", x: BARREL.x + 18, y: -70, w: 18, h: 60, mat: "m", tone: 0 },
  { name: "ringFront", x: BARREL.x + length - 34, y: -68, w: 16, h: 56, mat: "m", tone: 0 }
];
const MAT = { m: ["m0", "m1", "m2", "m3", "mLine"], c: ["c0", "c1", "c2", "c3", "mLine"], a: ["a0", "a1", "a2", "a3", "aLine"] };

const fills = new WeakMap();

function bandFill(ctx, p, tones, simple) {
  const key = tones.join() + simple;
  const hit = fills.get(p);
  if (hit && hit.key === key) return hit.fill;
  const top = tones[Math.min(3, p.tone + 1)], mid = tones[p.tone], low = tones[Math.max(0, p.tone - 1)];
  const stops = simple
    ? [[0, top], [0.28, top], [0.28, mid], [0.74, mid], [0.74, low], [1, low]]
    : [[0, top], [0.1, top], [0.1, tones[3]], [0.1 + Math.max(1 / p.h, 0.08), tones[3]], [0.1 + Math.max(1 / p.h, 0.08), top], [0.28, top], [0.28, mid], [0.74, mid], [0.74, low], [1, low]];
  const fill = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
  for (const [at, color] of stops) fill.addColorStop(at, color);
  fills.set(p, { key, fill });
  return fill;
}

function toHook(pt) {
  return [-pt[1], pt[0]];
}

const CARRY = { arm: 22, fore: -94 };
const FRONT_CARRY = { armL: 0, foreL: -90 };
const FRONT_REACH = [40, 140];
const FRONT_SUPPORT = [164, -20];
const BOTH_ARMS = { grip: [0, 60], support: [0, 90] };

function frontGrip(front, gripX) {
  const { locate } = window.XBOT;
  const m = locate(front, "handL", FRONT_CARRY);
  const det = m.a * m.d - m.b * m.c;
  const miss = fore => {
    const h = locate(front, "handR", { ...FRONT_CARRY, armR: 0, foreR: fore });
    return Math.abs((m.d * (h.e - m.e) - m.c * (h.f - m.f)) / det - gripX);
  };
  let coarse = FRONT_REACH[0];
  for (let f = FRONT_REACH[0]; f <= FRONT_REACH[1]; f++) if (miss(f) < miss(coarse)) coarse = f;
  let best = coarse;
  for (let i = -20; i <= 20; i++) if (miss(coarse + i / 20) < miss(best)) best = coarse + i / 20;
  return { armR: 0, foreR: best };
}
function bothArms(front) {
  const { locate } = window.XBOT;
  const poseOf = (a, t) => ({ armL: -a, foreL: -90 + a, armR: t, supportR: -t });
  const fit = a => {
    const p = locate(front, "handL", poseOf(a, 0)).transformPoint(new DOMPoint(...toHook(FRONT_SUPPORT)));
    const at = t => locate(front, "support", poseOf(a, t));
    let [lo, hi] = BOTH_ARMS.support;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (at(mid).e > p.x) lo = mid;
      else hi = mid;
    }
    const m = at(lo);
    return { t: lo, miss: Math.hypot(m.e - p.x, m.f - p.y) };
  };
  const scan = (from, to, step) => {
    let best = null;
    for (let a = from; a <= to; a += step) {
      const f = fit(a);
      if (!best || f.miss < best.miss) best = { a, ...f };
    }
    return best;
  };
  const coarse = scan(BOTH_ARMS.grip[0], BOTH_ARMS.grip[1], 1);
  const best = scan(coarse.a - 1, coarse.a + 1, 0.05);
  const pose = poseOf(best.a, best.t);
  return { FRONT_CARRY: { armL: pose.armL, foreL: pose.foreL }, FRONT_CARRY_R: { armR: pose.armR, foreR: 0, supportR: pose.supportR }, miss: best.miss };
}

function model({ buildParts, mat = MAT, colors = {}, after = null, barrel: own = BARREL, muzzle = MUZZLE }) {
  const partSets = new Map();
  const partsFor = length => partSets.get(length) || partSets.set(length, buildParts(length)).get(length);

  function part(ctx, p, pal, lineW, simple) {
    const [c0, c1, c2, c3, line] = mat[p.mat].map(k => pal[k] ?? colors[k]);
    ctx.fillStyle = bandFill(ctx, p, [c0, c1, c2, c3], simple);
    if (p.pts) {
      ctx.beginPath();
      p.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
    } else ctx.fillRect(p.x, p.y, p.w, p.h);
    if (lineW) {
      const t = ctx.getTransform();
      ctx.strokeStyle = line;
      ctx.lineWidth = lineW / Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
      if (p.pts) ctx.stroke();
      else ctx.strokeRect(p.x, p.y, p.w, p.h);
    }
  }

  function draw(ctx, { pal = PALETTE, lineW = 1.4, simple = false, barrel = own.length, loaded = true } = {}) {
    for (const p of partsFor(barrel)) part(ctx, p, pal, lineW, simple);
    if (after) after(ctx, barrel, simple, { pal, lineW, loaded });
  }

  function hook(ctx, opts) {
    ctx.save();
    ctx.transform(0, 1, -1, 0, 0, 0);
    draw(ctx, opts);
    ctx.restore();
  }

  function holdPoses(side, front) {
    const { locate, solve } = window.XBOT;
    const grip = toHook(SUPPORT);
    const far = solve(side, "handFar", CARRY, ["armFar", "foreFar"], [[-160, 40], [-150, 30]], locate(side, "hand", CARRY).transformPoint(new DOMPoint(...grip)));
    const CARRY_FAR = { ...far, supportFar: window.XBOT.SIDE_FORE_TURN - far.armFar - far.foreFar };
    const front2 = window.XBOT.locate(front, "support") ? bothArms(front) : { FRONT_CARRY, FRONT_CARRY_R: frontGrip(front, grip[0]) };
    return { CARRY, CARRY_FAR, FRONT_CARRY: front2.FRONT_CARRY, FRONT_CARRY_R: front2.FRONT_CARRY_R };
  }

  return { PARTS: partsFor(own.length), BARREL: own, MUZZLE: muzzle, draw, hook, toHook, muzzleInHook: toHook(muzzle), holdPoses };
}

const MUZZLE = [BARREL.x + BARREL.length + 2, -40];
const SUPPORT = [BARREL.x + 14, -10];
const core = model({ buildParts });

window.GUN = { ...core, model, grip, MAT };
})();
