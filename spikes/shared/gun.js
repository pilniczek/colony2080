(() => {
const PALETTE = window.XBOT.PALETTE;

const BARREL = { x: 70, length: 196 };
const PARTS = [
  { name: "grip", x: -14, y: -14, w: 26, h: 56, mat: "m", tone: 1 },
  { name: "stock", x: -82, y: -64, w: 22, h: 50, mat: "m", tone: 0 },
  { name: "handle", x: -36, y: -96, w: 72, h: 18, mat: "m", tone: 1 },
  { name: "handlePost", x: -36, y: -82, w: 14, h: 16, mat: "m", tone: 1 },
  { name: "handlePostFront", x: 22, y: -82, w: 14, h: 16, mat: "m", tone: 1 },
  { name: "receiver", x: -60, y: -70, w: 130, h: 60, mat: "m", tone: 2 },
  { name: "stripe", x: -14, y: -70, w: 14, h: 60, mat: "a", tone: 1 },
  { name: "feed", x: 14, y: -12, w: 48, h: 40, mat: "m", tone: 0 },
  { name: "barrelBack", x: BARREL.x, y: -62, w: BARREL.length - 6, h: 44, mat: "m", tone: 0 },
  { name: "barrelTop", x: BARREL.x, y: -62, w: BARREL.length, h: 12, mat: "c", tone: 1 },
  { name: "barrelMid", x: BARREL.x, y: -46, w: BARREL.length, h: 12, mat: "c", tone: 2 },
  { name: "barrelLow", x: BARREL.x, y: -30, w: BARREL.length, h: 12, mat: "c", tone: 1 },
  { name: "ringRear", x: BARREL.x + 18, y: -70, w: 18, h: 60, mat: "m", tone: 0 },
  { name: "ringFront", x: BARREL.x + BARREL.length - 34, y: -68, w: 16, h: 56, mat: "m", tone: 0 }
];

const MAT = { m: ["m0", "m1", "m2", "m3"], c: ["c0", "c1", "c2", "c3"], a: ["a0", "a1", "a2", "a3"] };
const MUZZLE = [BARREL.x + BARREL.length + 2, -40];
const SUPPORT = [BARREL.x + 40, -2];

function part(ctx, p, pal, lineW, simple) {
  const tones = MAT[p.mat].map(k => pal[k]);
  ctx.fillStyle = tones[p.tone];
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.fillStyle = tones[Math.min(3, p.tone + 1)];
  ctx.fillRect(p.x, p.y, p.w, p.h * 0.28);
  if (!simple) {
    ctx.fillStyle = tones[3];
    ctx.fillRect(p.x, p.y + p.h * 0.1, p.w, Math.max(1, p.h * 0.08));
  }
  ctx.fillStyle = tones[Math.max(0, p.tone - 1)];
  ctx.fillRect(p.x, p.y + p.h * 0.74, p.w, p.h * 0.26);
  if (lineW) {
    const t = ctx.getTransform();
    ctx.strokeStyle = pal.mLine;
    ctx.lineWidth = lineW / Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }
}

function draw(ctx, { pal = PALETTE, lineW = 2, simple = false } = {}) {
  for (const p of PARTS) part(ctx, p, pal, lineW, simple);
}

function toHook(pt) {
  return [-pt[1], pt[0]];
}

function hook(ctx, opts) {
  ctx.save();
  ctx.transform(0, 1, -1, 0, 0, 0);
  draw(ctx, opts);
  ctx.restore();
}

function slung(ctx, opts) {
  ctx.save();
  ctx.translate(330, 236);
  ctx.rotate(-0.95);
  ctx.translate(-40, -60);
  hook(ctx, opts);
  ctx.restore();
}

const CARRY = { arm: 0, fore: -72 };
const FRONT_CARRY = { armL: -24, foreL: -66 };

function holdPoses(side, front) {
  const { locate, solve } = window.XBOT;
  const grip = toHook(SUPPORT);
  return {
    CARRY,
    CARRY_FAR: solve(side, "handFar", CARRY, ["armFar", "foreFar"], [[-160, 40], [-150, 30]], locate(side, "hand", CARRY).transformPoint(new DOMPoint(...grip))),
    FRONT_CARRY,
    FRONT_CARRY_R: solve(front, "handR", FRONT_CARRY, ["armR", "foreR"], [[-40, 120], [-60, 150]], locate(front, "handL", FRONT_CARRY).transformPoint(new DOMPoint(...grip)))
  };
}

window.GUN = { holdPoses, slung, PARTS, MUZZLE, SUPPORT, draw, hook, toHook, muzzleInHook: toHook(MUZZLE), supportInHook: toHook(SUPPORT) };
})();
