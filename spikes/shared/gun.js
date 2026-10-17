(() => {
const PALETTE = window.XBOT.PALETTE;

const PARTS = [
  { name: "grip", x: -14, y: -14, w: 26, h: 56, mat: "m", tone: 1 },
  { name: "stock", x: -176, y: -64, w: 30, h: 50, mat: "m", tone: 0 },
  { name: "handle", x: -70, y: -96, w: 120, h: 18, mat: "m", tone: 1 },
  { name: "handlePost", x: -70, y: -82, w: 16, h: 16, mat: "m", tone: 1 },
  { name: "handlePostFront", x: 34, y: -82, w: 16, h: 16, mat: "m", tone: 1 },
  { name: "receiver", x: -150, y: -70, w: 290, h: 60, mat: "m", tone: 2 },
  { name: "stripe", x: -40, y: -70, w: 16, h: 60, mat: "a", tone: 1 },
  { name: "feed", x: 40, y: -12, w: 64, h: 40, mat: "m", tone: 0 },
  { name: "barrelBack", x: 140, y: -62, w: 190, h: 44, mat: "m", tone: 0 },
  { name: "barrelTop", x: 140, y: -62, w: 194, h: 12, mat: "c", tone: 1 },
  { name: "barrelMid", x: 140, y: -46, w: 198, h: 12, mat: "c", tone: 2 },
  { name: "barrelLow", x: 140, y: -30, w: 194, h: 12, mat: "c", tone: 1 },
  { name: "ringRear", x: 160, y: -70, w: 18, h: 60, mat: "m", tone: 0 },
  { name: "ringFront", x: 300, y: -68, w: 16, h: 56, mat: "m", tone: 0 }
];

const MAT = { m: ["m0", "m1", "m2", "m3"], c: ["c0", "c1", "c2", "c3"], a: ["a0", "a1", "a2", "a3"] };
const MUZZLE = [338, -40];
const SUPPORT = [170, -2];

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

function drawMuzzle(ctx, { pal = PALETTE, lineW = 2 } = {}) {
  const t = ctx.getTransform();
  const lw = lineW / Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
  const disc = (x, y, r, fill) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = pal.mLine;
    ctx.lineWidth = lw;
    ctx.stroke();
  };
  disc(0, 0, 30, pal.m0);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    disc(Math.cos(a) * 18, Math.sin(a) * 18, 8, pal.c1);
    disc(Math.cos(a) * 18, Math.sin(a) * 18, 3.5, pal.mLine);
  }
  disc(0, 0, 6, pal.m2);
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

const CARRY = { arm: -28, fore: -44 };
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

window.GUN = { holdPoses, PARTS, MUZZLE, SUPPORT, draw, drawMuzzle, hook, toHook, muzzleInHook: toHook(MUZZLE), supportInHook: toHook(SUPPORT) };
})();
