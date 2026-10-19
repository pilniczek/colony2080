(() => {
const PALETTE = window.XBOT.PALETTE;
const ARC = { e0: "#202488", e1: "#3a52c4", e2: "#6084a4", e3: "#b8dcf4", eLine: "#0c1040", glow: "#7ae0ff", grey: "#c4cccc", core: "#f4f4f4" };

const BARREL = { x: 70, length: 196 };
const PRONG = 48;
const COILS = 4;

const buildParts = length => {
  const end = BARREL.x + length;
  const coilStep = (length - PRONG - 24) / COILS;
  return [
    { name: "grip", x: -14, y: -14, w: 26, h: 56, mat: "m", tone: 1 },
    { name: "stock", x: -78, y: -60, w: 20, h: 42, mat: "m", tone: 0 },
    { name: "cell", x: -44, y: -90, w: 92, h: 22, mat: "m", tone: 1 },
    { name: "cellWindow", x: -34, y: -86, w: 72, h: 10, mat: "e", tone: 2 },
    { name: "receiver", x: -60, y: -72, w: 130, h: 62, mat: "c", tone: 1 },
    { name: "stripe", x: -14, y: -72, w: 12, h: 62, mat: "e", tone: 1 },
    { name: "pack", x: 14, y: -10, w: 46, h: 34, mat: "m", tone: 0 },
    { name: "packLight", x: 22, y: -2, w: 30, h: 8, mat: "e", tone: 2 },
    { name: "neck", x: BARREL.x, y: -58, w: length - PRONG + 4, h: 36, mat: "c", tone: 2 },
    { name: "core", x: BARREL.x, y: -44, w: length - PRONG + 4, h: 8, mat: "e", tone: 2 },
    ...Array.from({ length: COILS }, (_, i) => ({ name: "coil" + i, x: BARREL.x + 14 + i * coilStep, y: -66, w: 12, h: 52, mat: "m", tone: 0 })),
    { name: "prongBase", x: end - PRONG - 4, y: -74, w: 14, h: 68, mat: "m", tone: 0 },
    { name: "prongTop", x: end - PRONG, y: -74, w: PRONG, h: 12, mat: "c", tone: 1 },
    { name: "prongLow", x: end - PRONG, y: -18, w: PRONG, h: 12, mat: "c", tone: 1 }
  ];
};
const partSets = new Map();
const partsFor = length => partSets.get(length) || partSets.set(length, buildParts(length)).get(length);
const PARTS = partsFor(BARREL.length);

const MAT = { m: ["m0", "m1", "m2", "m3", "mLine"], c: ["c0", "c1", "c2", "c3", "mLine"], e: ["e0", "e1", "e2", "e3", "eLine"] };
const muzzleAt = length => [BARREL.x + length + 2, -40];
const MUZZLE = muzzleAt(BARREL.length);
const SUPPORT = [BARREL.x - 6, -10];

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

const lineScale = ctx => {
  const t = ctx.getTransform();
  return 1 / Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
};

function part(ctx, p, pal, lineW, simple) {
  const [c0, c1, c2, c3, line] = MAT[p.mat].map(k => pal[k] ?? ARC[k]);
  ctx.fillStyle = bandFill(ctx, p, [c0, c1, c2, c3], simple);
  ctx.fillRect(p.x, p.y, p.w, p.h);
  if (lineW) {
    ctx.strokeStyle = line;
    ctx.lineWidth = lineW * lineScale(ctx);
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }
}

const EMITTER_ARC = [[-6, -62], [2, -54], [-4, -46], [4, -40], [-4, -34], [2, -26], [-6, -18]];

function stroke(ctx, pts, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.stroke();
}

function emitter(ctx, length, simple) {
  const end = BARREL.x + length;
  const pts = EMITTER_ARC.map(([x, y]) => [end + x, y]);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 0.5;
  stroke(ctx, pts, ARC.glow, 16);
  ctx.globalAlpha = 1;
  stroke(ctx, pts, ARC.e1, 8);
  if (!simple) stroke(ctx, pts, ARC.grey, 5);
  stroke(ctx, pts, ARC.core, simple ? 3 : 2.4);
  ctx.restore();
}

function draw(ctx, { pal = PALETTE, lineW = 1.4, simple = false, barrel = BARREL.length } = {}) {
  for (const p of partsFor(barrel)) part(ctx, p, pal, lineW, simple);
  emitter(ctx, barrel, simple);
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

let slungAt = null;

function slung(ctx, opts) {
  slungAt ||= window.XBOT.locate(window.XBOT.buildBack(), "back");
  ctx.save();
  ctx.transform(slungAt.a, slungAt.b, slungAt.c, slungAt.d, slungAt.e, slungAt.f);
  hook(ctx, opts);
  ctx.restore();
}

const FRAMES = 6;
const TICK_HZ = 32;
const BEAM_H = 24;

function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

const frameAt = t => Math.floor(t * TICK_HZ) % FRAMES;

function bolt(length, frame) {
  const r = rng(frame + 1);
  const main = [[0, 0]];
  const forks = [];
  let x = 0, side = r() < 0.5 ? 1 : -1;
  while (x < length) {
    x = Math.min(length, x + 5 + r() * 5);
    side = -side;
    const y = x === length ? 0 : side * (1.5 + r() * 2.5);
    main.push([x, y]);
    if (x < length - 8 && r() < 0.3) {
      const dir = y < 0 ? -1 : 1;
      const a = [x + 3 + r() * 4, y + dir * (2 + r() * 2)];
      forks.push([[x, y], a, [a[0] + 3 + r() * 4, a[1] - dir * (1 + r() * 2)]]);
    }
  }
  return { main, forks };
}

function knot(ctx) {
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = ARC.glow;
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  stroke(ctx, [[-3, -3], [3, 3]], ARC.core, 1);
  stroke(ctx, [[-3, 3], [3, -3]], ARC.core, 1);
}

function beam(ctx, length, frame, seed) {
  const { main, forks } = bolt(length, frame);
  const dy = Math.floor(rng(seed)() * 3) - 1;
  ctx.save();
  ctx.translate(0, dy);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 0.55;
  stroke(ctx, main, ARC.e0, 5);
  for (const f of forks) stroke(ctx, f, ARC.e0, 3);
  ctx.globalAlpha = 1;
  stroke(ctx, main, ARC.e2, 3);
  for (const f of forks) stroke(ctx, f, ARC.e2, 1.4);
  stroke(ctx, main, ARC.grey, 1.8);
  for (const f of forks) stroke(ctx, f, ARC.grey, 0.6);
  stroke(ctx, main, ARC.core, 1);
  knot(ctx);
  ctx.restore();
}

const ICON = { body: 34, arcEnd: 57 };

const icon = x => `<g transform="translate(${x} 5.2)" stroke="#202826" stroke-width=".3">
  <rect x="6" y="4" width="3" height="7" rx=".5" fill="#8e9aa0"/><rect x="9" y="4" width="6" height="2.6" fill="#55636a"/><rect x="10" y="4.8" width="4" height=".9" fill="#6084a4" stroke="none"/>
  <rect x="0" y="-.2" width="3" height="4" rx=".5" fill="#8e9aa0"/><rect x="2" y="-1" width="17" height="5" rx=".6" fill="#c4ccd0"/>
  <rect x="5.5" y="-2.4" width="10" height="1.6" rx=".4" fill="#8e9aa0"/><rect x="6.5" y="-2" width="8" height=".8" fill="#7ae0ff" stroke="none"/>
  <rect x="8" y="-1" width="1.4" height="5" fill="#6084a4"/><path d="M2.6 0H18.4" stroke="#eef2f2" stroke-width=".4"/>
  <rect x="19" y=".6" width="11" height="2.8" fill="#dfe5e7"/><rect x="19" y="1.6" width="11" height=".8" fill="#6084a4" stroke="none"/>
  ${[20.2, 23.2, 26.2].map(c => `<rect x="${c}" y=".1" width="1.2" height="3.8" fill="#55636a"/>`).join("")}
  <rect x="29.4" y="-.4" width="1.2" height="4.8" fill="#55636a"/><rect x="30.4" y="-.4" width="3.6" height="1.1" fill="#c4ccd0"/><rect x="30.4" y="3.3" width="3.6" height="1.1" fill="#c4ccd0"/></g>
  <g transform="translate(${x} 5.2)" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path d="M33.4 .4L34.6 1.3L33.6 2L34.6 2.7L33.4 3.6" stroke="#7ae0ff" stroke-width=".9"/>
  <path d="M34 2L37 .6L40 3.2L43.5 .9L46.5 3.4L50 1.2L53 2.8L${ICON.arcEnd} 2" stroke="#3a52c4" stroke-width="1.6" opacity=".75"/>
  <path d="M34 2L37 .6L40 3.2L43.5 .9L46.5 3.4L50 1.2L53 2.8L${ICON.arcEnd} 2" stroke="#f4f4f4" stroke-width=".5"/></g>`;

window.EBLASTER = { PARTS, MUZZLE, SUPPORT, FRAMES, TICK_HZ, BEAM_H, ARC, ICON, draw, hook, slung, toHook, muzzleAt, muzzleInHook: toHook(MUZZLE), supportInHook: toHook(SUPPORT), beam, frameAt, icon };
})();
