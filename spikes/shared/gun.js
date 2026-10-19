(() => {
const PALETTE = window.XBOT.PALETTE;

const BARREL = { x: 70, length: 196 };
const buildParts = length => [
  { name: "grip", x: -14, y: -14, w: 26, h: 56, mat: "m", tone: 1 },
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

function model({ buildParts, mat = MAT, colors = {}, after = null }) {
  const partSets = new Map();
  const partsFor = length => partSets.get(length) || partSets.set(length, buildParts(length)).get(length);

  function part(ctx, p, pal, lineW, simple) {
    const [c0, c1, c2, c3, line] = mat[p.mat].map(k => pal[k] ?? colors[k]);
    ctx.fillStyle = bandFill(ctx, p, [c0, c1, c2, c3], simple);
    ctx.fillRect(p.x, p.y, p.w, p.h);
    if (lineW) {
      const t = ctx.getTransform();
      ctx.strokeStyle = line;
      ctx.lineWidth = lineW / Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
      ctx.strokeRect(p.x, p.y, p.w, p.h);
    }
  }

  function draw(ctx, { pal = PALETTE, lineW = 1.4, simple = false, barrel = BARREL.length } = {}) {
    for (const p of partsFor(barrel)) part(ctx, p, pal, lineW, simple);
    if (after) after(ctx, barrel, simple);
  }

  function hook(ctx, opts) {
    ctx.save();
    ctx.transform(0, 1, -1, 0, 0, 0);
    draw(ctx, opts);
    ctx.restore();
  }

  let slungAt = null;

  function slung(ctx, opts) {
    slungAt ||= window.XBOT.locate(window.XBOT.buildBack(), "back");
    ctx.save();
    ctx.transform(slungAt.a, slungAt.b, slungAt.c, slungAt.d, slungAt.e, slungAt.f);
    hook(ctx, opts);
    ctx.restore();
  }

  return { PARTS: partsFor(BARREL.length), MUZZLE, SUPPORT, draw, hook, slung, toHook, muzzleInHook: toHook(MUZZLE), supportInHook: toHook(SUPPORT) };
}

const MUZZLE = [BARREL.x + BARREL.length + 2, -40];
const SUPPORT = [BARREL.x - 6, -10];
const core = model({ buildParts });
const PARTS = core.PARTS;

const CARRY = { arm: 0, fore: -72 };
const FRONT_CARRY = { armL: -24, foreL: -66 };

const BAND = PARTS.find(p => p.name === "barrelBack");
const SCAN = { x: -600, w: 1600 };

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

function barrelFor(root, hookName, pose) {
  const clear = silhouetteEdge(root, hookName, pose) + BAND.h;
  return Math.max(BARREL.length, Math.ceil(BARREL.length + clear - MUZZLE[0]));
}

function holdPoses(side, front) {
  const { locate, solve } = window.XBOT;
  const grip = toHook(SUPPORT);
  const CARRY_FAR = solve(side, "handFar", CARRY, ["armFar", "foreFar"], [[-160, 40], [-150, 30]], locate(side, "hand", CARRY).transformPoint(new DOMPoint(...grip)));
  const FRONT_CARRY_R = solve(front, "handR", FRONT_CARRY, ["armR", "foreR"], [[-40, 120], [-60, 150]], locate(front, "handL", FRONT_CARRY).transformPoint(new DOMPoint(...grip)));
  return { CARRY, CARRY_FAR, FRONT_CARRY, FRONT_CARRY_R, FRONT_BARREL: barrelFor(front, "handL", { ...FRONT_CARRY, ...FRONT_CARRY_R }) };
}

window.GUN = { ...core, holdPoses, model, BARREL, MAT };
})();
