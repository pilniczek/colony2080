(() => {
const ARC = { e0: "#202488", e1: "#3a52c4", e2: "#6084a4", e3: "#b8dcf4", eLine: "#0c1040", glow: "#7ae0ff", grey: "#c4cccc", core: "#f4f4f4" };

const BARREL = window.GUN.BARREL;
const PRONG = 48;
const COILS = 4;

const buildParts = length => {
  const end = BARREL.x + length;
  const coilStep = (length - PRONG - 24) / COILS;
  return [
    window.GUN.grip("m", 1),
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
const MAT = { ...window.GUN.MAT, e: ["e0", "e1", "e2", "e3", "eLine"] };

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

const core = window.GUN.model({ buildParts, mat: MAT, colors: ARC, after: emitter });

const buildTop = length => {
  const end = BARREL.x + length;
  const coilStep = (length - PRONG - 24) / COILS;
  return [
    { name: "stock", x: -78, y: -12, w: 20, h: 24, mat: "m", tone: 0 },
    { name: "receiver", x: -60, y: -24, w: 130, h: 48, mat: "c", tone: 1 },
    { name: "stripe", x: -14, y: -24, w: 12, h: 48, mat: "e", tone: 1 },
    { name: "cell", x: -44, y: -14, w: 92, h: 28, mat: "m", tone: 1 },
    { name: "cellWindow", x: -34, y: -5, w: 72, h: 10, mat: "e", tone: 2 },
    { name: "neck", x: BARREL.x, y: -15, w: length - PRONG + 4, h: 30, mat: "c", tone: 2 },
    { name: "core", x: BARREL.x, y: -4, w: length - PRONG + 4, h: 8, mat: "e", tone: 2 },
    ...Array.from({ length: COILS }, (_, i) => ({ name: "coil" + i, x: BARREL.x + 14 + i * coilStep, y: -26, w: 12, h: 52, mat: "m", tone: 0 })),
    { name: "prongBase", x: end - PRONG - 4, y: -20, w: 14, h: 40, mat: "m", tone: 0 },
    { name: "prong", x: end - PRONG, y: -12, w: PRONG, h: 24, mat: "c", tone: 1 },
    { name: "prongSlot", x: end - PRONG + 8, y: -3, w: PRONG - 8, h: 6, mat: "e", tone: 2 }
  ];
};

const TOP_ARC = [[-14, -9], [-6, -5], [-12, -1], [-4, 3], [-12, 7], [-6, 10]];

function topEmitter(ctx, length, simple) {
  const end = BARREL.x + length;
  const pts = TOP_ARC.map(([x, y]) => [end + x, y]);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 0.5;
  stroke(ctx, pts, ARC.glow, 14);
  ctx.globalAlpha = 1;
  stroke(ctx, pts, ARC.e1, 6);
  stroke(ctx, pts, ARC.core, simple ? 2.6 : 2);
  ctx.restore();
}

const top = window.GUN.model({ buildParts: buildTop, mat: MAT, colors: ARC, after: topEmitter });
const TOP_BOX = [-78, -26, BARREL.x + BARREL.length, 26];

const FRAMES = 6;
const TICK_HZ = 32;
const BEAM_H = 24;

function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function mix(seed) {
  let h = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return (h ^ (h >>> 16)) >>> 11;
}

const frameAt = t => Math.floor(t * TICK_HZ) % FRAMES;

function bolt(length, frame) {
  const r = rng(frame + 1);
  const count = r() < 0.5 ? 2 : 3;
  return Array.from({ length: count }, (_, k) => {
    const pts = [[0, 0]];
    let x = 0, side = k % 2 ? 1 : -1;
    while (x < length) {
      x = Math.min(length, x + 5 + r() * 5);
      side = -side;
      pts.push([x, x === length ? 0 : side * (1 + r() * 3.5)]);
    }
    return pts;
  });
}

const LAYERS = [[ARC.e0, 5, 0.55], [ARC.e2, 3, 1], [ARC.grey, 1.8, 1], [ARC.core, 1, 1]];

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
  const dy = Math.floor(rng(mix(seed))() * 3) - 1;
  const strands = bolt(length, frame).map(pts => pts.map(([x, y], i) => [x, i > 1 ? y + dy : y]));
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const [color, width, alpha] of LAYERS) {
    ctx.globalAlpha = alpha;
    for (const pts of strands) stroke(ctx, pts, color, width);
  }
  ctx.globalAlpha = 1;
  knot(ctx);
  ctx.restore();
}

const HUD_BEAM = { reach: 11.5, scale: 0.5, frame: 2 };

function hudShot(ctx) {
  const { reach, scale, frame } = HUD_BEAM;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const strands = bolt(reach / scale, frame).map(pts => pts.map(([x, y]) => [x * scale, y * scale]));
  for (const [color, width, alpha] of LAYERS) {
    ctx.globalAlpha = alpha;
    for (const pts of strands) stroke(ctx, pts, color, width * scale);
  }
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = ARC.glow;
  ctx.beginPath();
  ctx.arc(0, 0, 4 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  stroke(ctx, [[-1.5, -1.5], [1.5, 1.5]], ARC.core, scale);
  stroke(ctx, [[-1.5, 1.5], [1.5, -1.5]], ARC.core, scale);
  ctx.restore();
}

window.EBLASTER = { ...core, drawTop: top.draw, TOP_BOX, FRAMES, TICK_HZ, BEAM_H, beam, frameAt, hudShot };
})();
