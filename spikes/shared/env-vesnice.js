(() => {
const { define, P } = window.ENV;
const { rng, path, color, flat, box, poly, cylV, cylH, disc, rivets, glow, stroke, tones, shape, line, curve, beam, slab, mesh, truss, hazard, text } = P;
const { PI, sin, cos, min, max, abs } = Math;

const simple = () => window.ENV.simple;
const { TILE } = window.ENV;

function scuff(ctx, x, w) {
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = color("hole");
  ctx.beginPath();
  ctx.ellipse(x + w / 2, -0.5, w / 2, 0.9, 0, 0, PI * 2);
  ctx.fill();
  ctx.restore();
  if (simple()) return;
  for (const [dx, s] of [[0.15, 1], [0.55, 0.8], [0.8, 1.2]]) flat(ctx, x + w * dx, -1.4 * s, s, s * 0.8, "k2");
}

function shadow(ctx, cx, w, alpha = 0.4) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color("hole");
  ctx.beginPath();
  ctx.ellipse(cx, -0.4, w / 2, 0.9, 0, 0, PI * 2);
  ctx.fill();
  ctx.restore();
}

function ellipse(ctx, cx, cy, rx, ry, fill, line = null) {
  ctx.fillStyle = color(fill);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, PI * 2);
  ctx.fill();
  if (line) stroke(ctx, line);
}

function wire(ctx, pts, c, w = 0.8) {
  line(ctx, pts, "mLine", w + 0.6);
  line(ctx, pts, c, w);
}

function smoke(ctx, x, y, t, n = 3, h = 22) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const k = (t * 0.35 + i / n) % 1;
    ctx.globalAlpha = 0.22 * (1 - k);
    ellipse(ctx, x + sin(t * 1.3 + i * 2) * 2 + k * 5, y - k * h, 2 + k * 5, 1.6 + k * 3.5, k < 0.3 ? "k1" : "k2");
  }
  ctx.restore();
}

function flame(ctx, x, base, w, h, t, seed = 0) {
  const f = 0.85 + sin(t * 11 + seed * 2.3) * 0.08 + sin(t * 17.3 + seed) * 0.07;
  const tip = h * f, lean = sin(t * 6 + seed) * w * 0.12;
  const pts = (k, s) => [[x + w * (0.5 - s / 2), base], [x + w * (0.5 - s / 2) + w * 0.05, base - tip * k * 0.45], [x + w / 2 + lean * k - w * s * 0.18, base - tip * k * 0.75], [x + w / 2 + lean * k, base - tip * k], [x + w / 2 + lean * k + w * s * 0.2, base - tip * k * 0.7], [x + w * (0.5 + s / 2) - w * 0.04, base - tip * k * 0.4], [x + w * (0.5 + s / 2), base]];
  shape(ctx, pts(1, 1), "a0", "aLine");
  shape(ctx, pts(0.78, 0.72), "a1");
  shape(ctx, pts(0.52, 0.46), "a2");
  if (!simple()) shape(ctx, pts(0.3, 0.24), "y3");
}

function hash(a, b) {
  const s = sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function ring(ctx, cx, cy, rx, ry, c, w = 1) {
  ctx.save();
  ctx.lineWidth = w;
  ctx.strokeStyle = color(c);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, PI * 2);
  ctx.stroke();
  ctx.restore();
}

function lamp(ctx, x, y, c, lit = true) {
  if (lit && !simple()) glow(ctx, x, y, 4, c, 0.6);
  disc(ctx, x, y, 1.2, lit ? c : "k0", "mLine");
}

function spark(ctx, x, y, t, seed = 0) {
  if (Math.floor(t * 7 + seed) % 4) return;
  const r = rng(Math.floor(t * 7) + seed * 13);
  if (!simple()) glow(ctx, x, y, 5, "y3", 0.8);
  for (let i = 0; i < 4; i++) {
    const a = r() * PI * 2, l = 2 + r() * 3;
    line(ctx, [[x, y], [x + cos(a) * l, y + sin(a) * l]], "y3", 0.5);
  }
}

function arcBolt(ctx, x, y0, y1, w, t, seed, c = "plasma", k = 1) {
  const r = rng(Math.floor(t * 18) + seed * 101);
  const pts = [];
  const n = Math.max(4, Math.round((y1 - y0) / 6));
  for (let i = 0; i <= n; i++) pts.push([x + (i === 0 || i === n ? 0 : (r() - 0.5) * w), y0 + (y1 - y0) * i / n]);
  line(ctx, pts, c, 1.8 * k);
  line(ctx, pts, "plasmaCore", 0.7 * k);
}

function beamColumn(ctx, x, y0, y1, w, t) {
  if (!simple()) glow(ctx, x, (y0 + y1) / 2, (y1 - y0) * 0.6, "plasma", 0.35);
  ctx.save();
  ctx.globalAlpha = 0.55;
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, "rgba(122,224,255,0)");
  g.addColorStop(0.5, color("plasma"));
  g.addColorStop(1, "rgba(122,224,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - w / 2, y0, w, y1 - y0);
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.8 + i / 3) % 1;
    ring(ctx, x, y1 + (y0 - y1) * k, w * 0.45, 1.2, "plasmaCore", 0.5);
  }
}

const POD_TOP = -72;

function podFrame(ctx) {
  box(ctx, 0, -6, 48, 6, "steel", 1);
  box(ctx, 2, -8, 44, 2.4, "steel", 2);
  box(ctx, 9, -56, 30, 48, "rust", 0);
  if (!simple()) for (let y = -50; y < -10; y += 8) flat(ctx, 10, y, 28, 0.6, "r1");
  for (const x of [3, 39]) {
    box(ctx, x, -58, 6, 50, "steel", 2, { vertical: true });
    for (const y of [-46, -32, -18]) cylV(ctx, x - 1, y, 8, 3, "chrome", 2);
  }
  ellipse(ctx, 24, -8.6, 13, 2, "m1", "mLine");
}

function podHood(ctx, lampColor, lit) {
  poly(ctx, [[0, POD_TOP], [48, POD_TOP], [40, -58], [8, -58]], "steel", 2);
  flat(ctx, 0, POD_TOP, 48, 2.2, "m3", "mLine");
  if (!simple()) {
    rivets(ctx, 4, -68, 40, 6, "m3");
    flat(ctx, 12, -63, 24, 0.6, "m0");
  }
  box(ctx, 18, -58, 12, 3, "chrome", 1);
  box(ctx, 41, -54, 6, 7, "steel", 0);
  if (!simple()) for (let y = -53; y < -48; y += 1.4) flat(ctx, 41.6, y, 4.8, 0.6, "c2");
  lamp(ctx, 24, POD_TOP - 1.5, lampColor, lit);
}

function pod(ctx, mode, t) {
  podFrame(ctx);
  if (mode === "working") beamColumn(ctx, 24, -55, -9, 24, t);
  if (mode === "idle" && !simple()) {
    ctx.save();
    ctx.globalAlpha = 0.25 + sin(t * 2) * 0.1;
    flat(ctx, 12, -55, 24, 46, "plasma");
    ctx.restore();
  }
  if (mode === "damaged") {
    poly(ctx, [[14, -40], [20, -46], [26, -38], [22, -30], [16, -32]], "hole", 2);
    line(ctx, [[30, -55], [32, -46], [29, -40], [31, -34]], "a1", 0.8);
    spark(ctx, 31, -34, t, 1);
    spark(ctx, 20, -56, t, 3);
  }
  podHood(ctx, mode === "working" ? "screen" : mode === "off" ? "k1" : mode === "idle" ? "a1" : "neon", mode !== "off");
}

define({
  id: "sourceTeleport",
  box: [-2, -76, 50, 0],
  anim: true,
  draw(ctx, state, t) {
    pod(ctx, ["idle", "off", "working"][state], t);
  }
});

define({
  id: "targetTeleport",
  box: [-2, -76, 50, 0],
  anim: true,
  draw(ctx, state, t) {
    pod(ctx, state ? "working" : "damaged", t);
  }
});

define({
  id: "brokenTeleport",
  box: [-4, -42, 54, 0],
  anim: true,
  draw(ctx, state, t) {
    box(ctx, 0, -6, 48, 6, "steel", 1);
    ellipse(ctx, 24, -6.6, 13, 1.6, "m0", "mLine");
    poly(ctx, [[9, -6], [9, -26], [14, -31], [18, -24], [23, -33], [28, -22], [33, -28], [39, -20], [39, -6]], "rust", 0);
    for (const [x, top] of [[3, -38], [39, -34]]) {
      poly(ctx, [[x, -6], [x, top + 3], [x + 2, top], [x + 4, top + 4], [x + 6, top + 1], [x + 6, -6]], "steel", 2, { dir: [1, 0] });
      cylV(ctx, x - 1, -20, 8, 3, "chrome", 2);
    }
    poly(ctx, [[-2, 0], [4, -7], [12, -9], [10, -3], [14, 0]], "steel", 1);
    poly(ctx, [[38, 0], [41, -5], [49, -6], [52, 0]], "steel", 0);
    box(ctx, 16, -16, 16, 9, "steel", 0);
    if (state === 0) {
      flat(ctx, 18, -15, 12, 7, "g1", "gLine");
      for (let x = 19.5; x < 29; x += simple() ? 3 : 1.5) flat(ctx, x, -9.4, 0.5, 1.2, "y2");
      flat(ctx, 21, -13.6, 5, 3, "m0");
      if (!simple()) glow(ctx, 24, -11, 6, "screen", 0.25 + sin(t * 3) * 0.15);
    } else flat(ctx, 18, -15, 12, 7, "hole", "mLine");
    line(ctx, [[30, -24], [33, -18], [30, -14]], "a1", 0.8);
    spark(ctx, 30, -14, t, 5);
  }
});

define({
  id: "teleportPad",
  box: [-2, -76, 50, 0],
  anim: true,
  draw(ctx, state, t) {
    pod(ctx, "working", t);
  }
});

function fuseScreen(ctx, x, y, state, t) {
  flat(ctx, x, y, 9, 4, state === 1 ? "screenOff" : "hole", "gLine");
  if (state === 1) return;
  const blink = Math.floor(t * 2) % 2;
  for (let i = 0; i < 3; i++) flat(ctx, x + 1 + i * 2.7, y + 0.8, 1.8, 2.4, i === 2 && blink ? "g1" : "screen");
}

define({
  id: "fuseBox",
  box: [-6, -76, 30, 0],
  anim: true,
  draw(ctx, state, t) {
    box(ctx, 0, -72, 24, 72, "concrete", 1, { vertical: true });
    box(ctx, -2, -74, 28, 4, "concrete", 2);
    box(ctx, -2, -4, 28, 4, "concrete", 1);
    if (!simple()) for (const y of [-60, -24]) flat(ctx, 1, y, 22, 0.6, "k0");
    cylV(ctx, 10, -30, 4, 28, "steel", 1);
    box(ctx, 3, -46, 18, 17, "green", 1);
    flat(ctx, 3, -46, 18, 1.2, "g3");
    box(ctx, 4.6, -44.6, 14.8, 14.2, "green", state === 1 ? 0 : 2);
    fuseScreen(ctx, 7.6, -43, state, t);
    if (state === 1) {
      poly(ctx, [[5, -37], [10, -38], [12, -34], [9, -31], [5, -32]], "hole", 2);
      for (const [x, y] of [[13.6, -36], [16, -34]]) flat(ctx, x, y, 1.4, 3, "c1", "mLine");
      poly(ctx, [[19, -45], [24, -47], [24.4, -32], [19.6, -31]], "green", 1);
      line(ctx, [[10, -33], [12, -28], [10, -24]], "a1", 0.7);
      spark(ctx, 10, -24, t, 2);
    } else {
      for (const x of [7, 11, 15]) {
        box(ctx, x, -37.4, 2.6, 5.4, state === 2 && x === 11 ? "yellow" : "chrome", 2, { vertical: true });
        if (state === 2 && x === 11 && !simple()) glow(ctx, x + 1.3, -34.6, 4, "y3", 0.4);
      }
    }
    lamp(ctx, 19, -48.6, state === 1 ? "neon" : "screen", state !== 1 || Math.floor(t * 3) % 2 === 0);
  }
});

define({
  id: "electricCabinet",
  box: [-2, -78, 100, 0],
  draw(ctx, state) {
    slab(ctx, 0, -72, 96, 72, "concrete", 2);
    flat(ctx, -1, -75, 98, 4, "k3", "kLine");
    flat(ctx, 0, -3, 96, 3, "k0", "kLine");
    for (const x of [6, 70]) {
      box(ctx, x, -60, 20, 50, "steel", 1);
      for (let y = -56; y < -12; y += simple() ? 8 : 4) flat(ctx, x + 2, y, 16, 1.8, "m3");
    }
    for (const x of [10, 74]) {
      poly(ctx, [[x + 4, -70], [x, -64], [x + 4, -64], [x + 1, -58], [x + 8, -66], [x + 4, -66], [x + 7, -70]], "water", 2);
    }
    box(ctx, 32, -58, 32, 56, "steel", 0);
    if (state === 0) {
      box(ctx, 34, -56, 28, 54, "chrome", 1);
      flat(ctx, 34, -56, 28, 1.4, "c3");
      flat(ctx, 44, -44, 8, 8, "hazard", "yLine");
      poly(ctx, [[48.6, -43], [45.6, -39.6], [48, -39.6], [47, -37], [50.4, -40.6], [48, -40.6], [49.4, -43]], "hazardDark", 2, { line: false });
      box(ctx, 56, -30, 3, 7, "steel", 2);
      lamp(ctx, 57.5, -33, "neon");
    } else {
      flat(ctx, 34, -56, 28, 54, "hole", "mLine");
      for (const y of [-46, -34, -22]) flat(ctx, 36, y, 24, 1.4, "m2", "mLine");
      for (const [x, y] of [[40, -45], [50, -45], [40, -33], [50, -21]]) box(ctx, x, y - 5, 2.6, 5, "chrome", 2, { vertical: true });
      flat(ctx, 50, -38.4, 2.6, 5, "m0");
      poly(ctx, [[34, -56], [26, -60], [26, 2], [34, -2]], "chrome", 0, { dir: [1, 0] });
      lamp(ctx, 57.5, -60, "screen");
    }
  }
});

define({
  id: "cannon",
  box: [-14, -78, 150, 0],
  anim: true,
  draw(ctx, state, t) {
    const age = t % 1.6;
    const kick = state === 1 ? max(0, 1 - age * 3) * 6 : 0;
    box(ctx, 56, -14, 80, 10, "steel", 1);
    for (const x of [64, 84, 104, 124]) {
      ellipse(ctx, x, -6, 6, 6, "m0", "mLine");
      ellipse(ctx, x, -6, 2.6, 2.6, "m2", "mLine");
    }
    flat(ctx, 58, -16, 76, 2.4, "m3", "mLine");
    poly(ctx, [[96, -16], [130, -16], [138, -2], [128, -2]], "chrome", 0);
    ctx.save();
    ctx.translate(kick, 0);
    cylH(ctx, 6, -45, 66, 7, "chrome", 1);
    cylH(ctx, 0, -46.6, 9, 10.2, "chrome", 0);
    if (!simple()) for (const x of [2, 5]) flat(ctx, x, -45.4, 1.2, 7.8, "hole");
    cylH(ctx, 40, -47, 8, 11, "chrome", 2);
    cylH(ctx, 50, -36, 30, 4, "steel", 2);
    ctx.restore();
    poly(ctx, [[66, -16], [70, -52], [84, -62], [118, -62], [126, -50], [124, -16]], "chrome", 1);
    poly(ctx, [[84, -62], [118, -62], [116, -56], [88, -56]], "chrome", 2, { line: false });
    poly(ctx, [[70, -52], [84, -62], [88, -56], [76, -48]], "c3", 2, { line: false });
    box(ctx, 92, -50, 22, 14, "chrome", 0);
    if (!simple()) {
      rivets(ctx, 72, -20, 50, 6, "c3");
      for (let x = 95; x < 112; x += 3) flat(ctx, x, -48, 1.2, 10, "m1");
      flat(ctx, 100, -32, 14, 3, "hazard", "yLine");
    }
    poly(ctx, [[118, -50], [130, -46], [130, -24], [124, -20]], "steel", 1, { dir: [1, 0] });
    if (state === 1 && age < 0.5) {
      const k = 1 - age * 2;
      glow(ctx, -6, -42, 18 * k + 6, "a2", 0.8 * k);
      poly(ctx, [[1, -48], [-10 * k - 4, -52], [-6, -44], [-14 * k - 6, -41], [-6, -38], [-10 * k - 4, -32], [1, -36]], "a1", 2);
      poly(ctx, [[1, -45], [-6 * k - 2, -44], [-8 * k - 3, -41], [-6 * k - 2, -38], [1, -38]], "y3", 2, { line: false });
    }
    if (state === 1 && !simple()) {
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const k = min(1, age * 1.2 + i * 0.12);
        ctx.globalAlpha = 0.45 * (1 - k);
        ellipse(ctx, -4 - k * 10 + i * 3, -42 - k * 18 - i * 4, 4 + k * 8, 3 + k * 5, "k2");
      }
      ctx.restore();
    }
  }
});

define({
  id: "energyBarrier",
  box: [-4, -98, 28, 0],
  anim: true,
  draw(ctx, state, t) {
    const on = state === 0;
    if (on && !simple()) glow(ctx, 12, -48, 30, "plasma", 0.25 + sin(t * 13) * 0.06);
    if (on) {
      arcBolt(ctx, 12, -86, -4, 10, t, 1);
      arcBolt(ctx, 12, -86, -4, 8, t + 0.37, 2, "plasma", 0.6);
    }
    box(ctx, 0, -96, 24, 10, "steel", 1);
    box(ctx, 6, -86, 12, 3, "chrome", 1);
    flat(ctx, 2, -94, 20, 2, "hazard", "yLine");
    box(ctx, 4, -4, 16, 4, "steel", 1);
    box(ctx, 8, -6, 8, 2.4, "chrome", 1);
    lamp(ctx, 12, -84, "plasma", on);
  }
});

function coilStack(ctx, x, y, w, n) {
  cylV(ctx, x + w * 0.3, y - 4, w * 0.4, n * 7 + 8, "steel", 0);
  for (let i = 0; i < n; i++) cylV(ctx, x, y + i * 7, w, 5, "chrome", 2);
  for (let i = 0; i < 3; i++) {
    const cy = y - 6 - i * 4;
    poly(ctx, [[x + w * 0.2, cy], [x + w * 0.8, cy], [x + w * 0.7, cy - 3], [x + w * 0.3, cy - 3]], "c1", 2);
  }
}

define({
  id: "transformer",
  box: [-4, -170, 172, 0],
  anim: true,
  draw(ctx, state, t) {
    slab(ctx, 0, -120, 168, 120, "concrete", 1);
    flat(ctx, -2, -124, 172, 5, "k3", "kLine");
    for (const [x, w] of [[8, 46], [62, 46], [116, 44]]) {
      box(ctx, x, -110, w, 56, "green", 1);
      box(ctx, x + 4, -106, w - 8, 48, "green", 0);
      if (!simple()) for (let y = -100; y < -60; y += 6) flat(ctx, x + 6, y, w - 12, 1, "g2");
    }
    coilStack(ctx, 16, -160, 26, 5);
    coilStack(ctx, 70, -160, 26, 5);
    for (const x of [124, 140, 156]) {
      cylV(ctx, x - 3, -138, 6, 14, "chrome", 1);
      for (let i = 0; i < 3; i++) cylV(ctx, x - 4.4, -138 + i * 4.4, 8.8, 2.2, "chrome", 2);
    }
    line(ctx, [[124, -138], [104, -150], [83, -162]], "mLine", 1.2);
    line(ctx, [[140, -138], [124, -158], [83, -164]], "mLine", 1.2);
    box(ctx, 8, -48, 152, 6, "steel", 1);
    for (const x of [14, 46, 80, 114, 148]) cylV(ctx, x, -42, 6, 42, "chrome", 1);
    hazard(ctx, 0, -8, 168, 4, 5);
    box(ctx, 120, -40, 34, 26, "steel", 0);
    flat(ctx, 124, -36, 26, 8, "screenOff", "gLine");
    if (!simple()) for (let i = 0; i < 4; i++) flat(ctx, 126 + i * 6, -33 - abs(sin(t * 3 + i)) * 3, 3, 1 + abs(sin(t * 3 + i)) * 3, "screen");
    lamp(ctx, 128, -20, "screen", Math.floor(t * 2) % 2 === 0);
    lamp(ctx, 136, -20, "a1");
  }
});

const LIGHT = [-0.6, -0.8];
const ROCK = ["#2a2620", "#4a4436", "#6e6450", "#9a8e74"];

function facets(ctx, pts, cx, cy, t, edge) {
  pts.forEach((a, i) => {
    const b = pts[(i + 1) % pts.length];
    const nx = b[1] - a[1], ny = a[0] - b[0], n = Math.hypot(nx, ny) || 1;
    const d = (nx * LIGHT[0] + ny * LIGHT[1]) / n;
    ctx.fillStyle = color(d > 0.6 ? t[3] : d > 0.05 ? t[2] : d > -0.55 ? t[1] : t[0]);
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = P.lw(ctx, 0.6);
    ctx.stroke();
  });
  path(ctx, pts);
  stroke(ctx, edge);
}

function boulder(ctx, cx, cy, r, seed, t = ROCK) {
  const rnd = rng(seed);
  const n = simple() ? 6 : 7 + Math.floor(rnd() * 3);
  const a0 = rnd() * PI;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = a0 + i * 2 * PI / n + (rnd() - 0.5) * 0.4;
    const k = r * (0.8 + rnd() * 0.25);
    return [cx + cos(a) * k * 1.15, cy + sin(a) * k * 0.8];
  });
  facets(ctx, pts, cx + r * 0.25, cy + r * 0.2, t, "kLine");
}

function braced(ctx, x, y, w, h) {
  box(ctx, x, y, w, h, "steel", 1);
  if (!simple()) {
    line(ctx, [[x + 3, y + 3], [x + w - 3, y + h - 3]], "m2", 2.2);
    line(ctx, [[x + w - 3, y + 3], [x + 3, y + h - 3]], "m0", 2.2);
  }
  flat(ctx, x + 1, y + 1, w - 2, 1, "m3");
  if (!simple()) for (const [dx, dy] of [[2.5, 2.5], [w - 2.5, 2.5], [2.5, h - 2.5], [w - 2.5, h - 2.5]]) disc(ctx, x + dx, y + dy, 0.6, "m3");
}

function blockWall(ctx, x, y, w, h) {
  for (let yy = y; yy < y + h; yy += TILE) {
    for (let xx = x; xx < x + w; xx += TILE / 2) braced(ctx, xx, yy, TILE / 2, TILE - 3);
    flat(ctx, x, yy + TILE - 3, w, 3, "y1", "yLine");
  }
}


define({
  id: "cliffBlocks",
  box: [0, 0, 72, 24],
  draw(ctx, state, t, { w = 72, h = TILE } = {}) {
    blockWall(ctx, 0, 0, w, h);
  }
});

function grass(ctx, x, w, seed) {
  const r = rng(seed);
  flat(ctx, x, -3, w, 4, "r1");
  const pts = [[x, 1]];
  for (let i = x; i <= x + w; i += simple() ? 3 : 1.5) pts.push([i, -3 - r() * (simple() ? 2 : 4)], [i + 0.75, -2]);
  pts.push([x + w, 1]);
  shape(ctx, pts, "o1");
  if (simple()) return;
  for (let i = 0; i < w / 3; i++) {
    const gx = x + r() * w;
    line(ctx, [[gx, -1], [gx + (r() - 0.5) * 3, -4 - r() * 3]], r() > 0.5 ? "o3" : "g2", 0.5);
  }
}

define({
  id: "grassyWalkway",
  box: [0, -8, 144, 25],
  draw(ctx, state, t, { w = 144 } = {}) {
    box(ctx, 0, 0, w, 24, "steel", 0);
    for (let x = 0; x < w; x += TILE) {
      line(ctx, [[x + 2, 5], [x + TILE - 2, 19]], "mLine", 3);
      line(ctx, [[x + 2, 5], [x + TILE - 2, 19]], "m2", 2);
      line(ctx, [[x + TILE - 2, 5], [x + 2, 19]], "mLine", 3);
      line(ctx, [[x + TILE - 2, 5], [x + 2, 19]], "m1", 2);
      flat(ctx, x, 3, 1.5, 18, "m3");
    }
    box(ctx, 0, 0, w, 4, "rust", 1);
    box(ctx, 0, 19, w, 5, "steel", 2);
    rivets(ctx, 0, 21.5, w, 6, "m3");
    grass(ctx, 0, w, 7);
  }
});

function post(ctx, x, h, broken = false) {
  if (broken) {
    poly(ctx, [[x, 0], [x, -14], [x + 5, -20], [x + 9, -13], [x + 15, -22], [x + 20, -15], [x + 24, -18], [x + 24, 0]], "concrete", 1);
    for (const [cx, r, s] of [[x - 6, 4, 3], [x + 30, 5, 4], [x + 12, 3, 5]]) boulder(ctx, cx, -r * 0.7, r, s, ["k0", "k1", "k2", "k3"]);
    flat(ctx, x + 2, -12, 20, 2, "#2a1a10");
    return;
  }
  box(ctx, x, -h, TILE, h, "steel", 1, { vertical: true });
  box(ctx, x + 2, -h + 2, TILE - 4, 20, "steel", 0);
  flat(ctx, x + 4, -h + 4, TILE - 8, 16, "glass", "mLine");
  hazard(ctx, x, -h + 24, TILE, 3, 3);
  for (let y = -h + 32; y < -6; y += 6) flat(ctx, x + 2, y, TILE - 4, 3, "c1", "mLine");
}

function brazier(ctx, x, t, seed) {
  box(ctx, x + 2, -26, 20, 26, "concrete", 1, { vertical: true });
  flat(ctx, x + 2, -26, 20, 2, "k3");
  box(ctx, x, -48, 24, 22, "rust", 0);
  flat(ctx, x + 2, -46, 20, 14, "#2a0c04");
  if (!simple()) glow(ctx, x + 12, -40, 16, "a1", 0.45);
  flame(ctx, x + 2, -32, 9, 18, t, seed);
  flame(ctx, x + 11, -32, 10, 22, t, seed + 1);
  flat(ctx, x, -34, 24, 3, "rust");
  flat(ctx, x - 1, -49, 26, 2.4, "r2", "rLine");
}

function sandbags(ctx, x, w) {
  for (let i = 0; i < w / 10 - 0.5; i++) {
    const bx = x + 1 + i * 10;
    poly(ctx, [[bx, 0], [bx + 0.6, -5], [bx + 2, -6], [bx + 8, -6], [bx + 9.4, -5], [bx + 10, 0]], "olive", 1);
  }
}

function fireRow(ctx, x, n, t, pair = 1) {
  let cx = x;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < pair; j++) { brazier(ctx, cx, t, i * 3 + j); cx += TILE; }
    if (i < n - 1) {
      box(ctx, cx, -36, TILE, 8, "concrete", 2);
      flat(ctx, cx + 3, -34.4, TILE - 6, 4.8, "k1", "kLine");
      if (!simple()) for (let k = 0; k < 4; k++) flat(ctx, cx + 5 + k * 3.8, -33.4, 2, 2.8, "c2");
      sandbags(ctx, cx, TILE);
      cx += TILE;
    }
  }
}

define({
  id: "fireBarricade",
  box: [-8, -80, 196, 0],
  anim: true,
  draw(ctx, state, t) {
    fireRow(ctx, 24, 3, t, 1);
    post(ctx, 0, 72, state === 1);
    if (state === 1 && !simple()) smoke(ctx, 12, -18, t, 3, 30);
  }
});

define({
  id: "dynamiteWall",
  box: [-4, -80, 220, 0],
  anim: true,
  draw(ctx, state, t) {
    fireRow(ctx, 24, 3, t, 2);
    post(ctx, 0, 72);
    if (state === 1) {
      for (const x of [6, 9, 12]) stick(ctx, x, -14, 3, 14);
      for (const y of [-11, -4]) flat(ctx, 5.6, y, 9.8, 1.4, "k1", "kLine");
      box(ctx, 7.6, -9, 5.2, 3.6, "steel", 1);
      lamp(ctx, 11.4, -7.2, "neon", Math.floor(t * 3) % 2 === 0);
      wire(ctx, [[10, -9], [11, -16], [16, -12], [20, -2], [30, -0.6]], "y2");
    }
  }
});

function anchor(ctx, x, flip) {
  ctx.save();
  ctx.translate(x, 0);
  if (flip) ctx.scale(-1, 1);
  box(ctx, 0, 0, TILE, 7, "steel", 2);
  poly(ctx, [[0, 7], [TILE, 7], [TILE - 4, 12], [8, 12]], "steel", 0);
  box(ctx, 2, -3, 8, 3, "steel", 1);
  if (!simple()) rivets(ctx, 0, 3.5, TILE, 6, "m3");
  ctx.restore();
}

define({
  id: "powerBridge",
  box: [-4, -6, 292, 14],
  draw(ctx, state) {
    anchor(ctx, 0, false);
    anchor(ctx, 288, true);
    if (state === 0) {
      box(ctx, TILE, 0.4, 240, 2.6, "chrome", 2);
      if (!simple()) for (let x = TILE + 12; x < 264; x += 24) flat(ctx, x, 0.8, 1, 1.6, "c0");
      return;
    }
    poly(ctx, [[TILE, 0.4], [TILE + 10, 1.6], [TILE + 9, 3.4], [TILE, 3]], "chrome", 1);
    poly(ctx, [[264, 0.4], [254, 2.8], [255, 4.2], [264, 3]], "chrome", 1);
  }
});

define({
  id: "rockCliff",
  box: [0, -218, 128, 0],
  draw(ctx) {
    blockWall(ctx, 0, -216, 72, 216);
    shape(ctx, [[66, 0], [66, -216], [90, -216], [100, -150], [104, -80], [112, -30], [116, 0]], "#1a1612", "kLine");
    const rocks = [];
    const r = rng(21);
    for (let y = -206; y < 0; y += 13) {
      const reach = 96 + (216 + y) / 216 * 22;
      for (let x = 70 + r() * 8; x < reach; x += 18 + r() * 6) rocks.push([x, y + r() * 6, 11 + r() * 5, rocks.length + 1]);
    }
    for (const [cx, cy, r, seed] of rocks) boulder(ctx, cx, cy, r, seed);
  }
});

define({
  id: "overheadPipeline",
  box: [-4, -22, 292, 4],
  draw(ctx, state, t, { w = 288 } = {}) {
    for (let x = 24; x < w; x += 96) {
      slab(ctx, x, -20, 24, 10, "concrete", 2);
      for (const dx of [8, 16]) line(ctx, [[x + dx, -10], [x + dx, -3]], "m2", 1.6);
    }
    cylH(ctx, 0, -8, w, 2.4, "chrome", 1);
    cylH(ctx, 0, -4, w, 2.4, "chrome", 1);
    for (let x = 6; x < w; x += 48) {
      hazard(ctx, x, -9.4, 14, 2, 2.4, { fill: "a1", line: "aLine" });
      hazard(ctx, x, -5.4, 14, 2, 2.4, { fill: "a1", line: "aLine" });
      for (const dx of [0, 13]) disc(ctx, x + dx, -6.8, 0.8, "c2", "mLine");
    }
  }
});

function tank(ctx, x, w, h) {
  cylV(ctx, x, -h, w, h, "rust", 1);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x + w / 2, -h, w / 2, 8, 0, PI, 0);
  ctx.closePath();
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  const [r0, r1, r2, r3] = tones("rust");
  g.addColorStop(0, r3); g.addColorStop(0.4, r2); g.addColorStop(1, r0);
  ctx.fillStyle = g;
  ctx.fill();
  stroke(ctx, "rust");
  ctx.restore();
  for (const y of [-h + 6, -h / 2, -6]) {
    flat(ctx, x, y - 1, w, 2, "r0", "rLine");
    rivets(ctx, x, y - 3, w, 4, "r3");
  }
  box(ctx, x + w / 2 - 6, -h - 11, 12, 4, "steel", 1);
  box(ctx, x + w / 2 - 4, -h - 14, 8, 3, "steel", 2);
  flat(ctx, x + 6, -h + 14, 12, 8, "y2", "yLine");
  if (!simple()) text(ctx, "T", x + 12, -h + 18, 6, "hazardDark");
}

define({
  id: "storageTank",
  box: [-2, -88, 126, 0],
  anim: true,
  draw(ctx, state, t) {
    tank(ctx, 0, 48, 64);
    for (const [x, w] of [[52, 6], [62, 6]]) cylV(ctx, x, -84, w, 84, "steel", 1);
    for (const y of [-70, -40]) {
      box(ctx, 50, y, 20, 4, "steel", 2);
      hazard(ctx, 51, y + 5, 18, 2.4, 3);
    }
    lamp(ctx, 60, -76, "a1", sin(t * 3) > 0);
    lamp(ctx, 60, -46, "screen", sin(t * 3 + 1.5) > 0);
    tank(ctx, 74, 48, 64);
  }
});

define({
  id: "watchtower",
  box: [-6, -176, 82, 0],
  draw(ctx) {
    const leg = (a, b) => { line(ctx, [a, b], "rLine", 5); line(ctx, [a, b], "r2", 3.4); };
    const brace = (a, b) => { line(ctx, [a, b], "rLine", 3); line(ctx, [a, b], "r1", 1.8); };
    for (let i = 0; i < 4; i++) {
      const y0 = -i * 32, y1 = y0 - 32;
      const xl = k => 4 + (-k / 136) * 14, xr = k => 68 - (-k / 136) * 14;
      brace([xl(y0), y0 - 2], [xr(y1), y1 + 2]);
      if (!simple()) brace([xr(y0), y0 - 2], [xl(y1), y1 + 2]);
      line(ctx, [[xl(y1), y1], [xr(y1), y1]], "rLine", 3);
      line(ctx, [[xl(y1), y1], [xr(y1), y1]], "r2", 1.8);
    }
    leg([4, 0], [18, -136]);
    leg([68, 0], [54, -136]);
    leg([36, 0], [36, -136]);
    box(ctx, 8, -140, 56, 5, "rust", 2);
    box(ctx, 12, -170, 48, 30, "rust", 1);
    if (!simple()) for (let x = 16; x < 60; x += 5) flat(ctx, x, -168, 0.8, 27, "r0");
    flat(ctx, 18, -164, 36, 8, "hole", "rLine");
    box(ctx, 8, -174, 56, 5, "rust", 3);
    line(ctx, [[60, -142], [72, -142]], "rLine", 3);
    line(ctx, [[60, -142], [72, -142]], "r2", 1.8);
  }
});

define({
  id: "bridgeGuardPost",
  box: [-12, -78, 56, 0],
  anim: true,
  draw(ctx, state, t) {
    sandbags(ctx, 0, 30);
    poly(ctx, [[3, -6], [4, -11], [6, -12], [12, -12], [13.4, -11], [14, -6]], "olive", 2);
    poly(ctx, [[15, -6], [16, -11], [18, -12], [24, -12], [25.4, -11], [26, -6]], "olive", 1);
    box(ctx, 32, -40, 8, 40, "steel", 1, { vertical: true });
    box(ctx, 30, -42, 12, 4, "steel", 2);
    const away = state === 1;
    box(ctx, 34, -50, 10, 7, "steel", 0);
    lamp(ctx, 39, -46.5, away ? "screen" : "neon", away || Math.floor(t * 2) % 2 === 0);
    ctx.save();
    ctx.translate(30, -34);
    ctx.rotate(away ? PI / 2.2 : 0);
    box(ctx, -40, -2, 40, 4, "chrome", 2);
    for (let x = -36; x < -2; x += 8) flat(ctx, x, -2, 4, 4, "neon");
    ctx.restore();
    flat(ctx, 42, -30, 8, 10, "k3", "kLine");
    flat(ctx, 43.4, -27, 5.2, 1.2, "neon");
    flat(ctx, 43.4, -24.4, 5.2, 1.2, "neon");
  }
});

function blob(cx, cy, rx, ry, seed, n = 14) {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = i / n * 2 * PI, k = 0.65 + r() * 0.5;
    return [cx + cos(a) * rx * k, cy + sin(a) * ry * k];
  });
}

const JUNGLE = ["#0c1410", "#16241a", "#24382a", "#3c5440", "#5e7660"];

function canopy(ctx, cx, cy, w, seed) {
  const r = rng(seed);
  for (let i = 0; i < (simple() ? 4 : 8); i++) {
    const x = cx + (r() - 0.5) * w, y = cy + (r() - 0.5) * w * 0.3;
    shape(ctx, blob(x, y, w * 0.32, w * 0.16, seed * 10 + i), JUNGLE[1 + (i % 2)]);
    if (!simple()) shape(ctx, blob(x - w * 0.06, y - w * 0.05, w * 0.18, w * 0.07, seed * 20 + i), JUNGLE[3]);
  }
}

function palm(ctx, x, h, lean, seed) {
  curve(ctx, [[x, 0], [x + lean * 0.4, -h * 0.5], [x + lean, -h]], JUNGLE[0], 4);
  const r = rng(seed);
  for (let i = 0; i < 7; i++) {
    const a = PI + i / 6 * PI + (r() - 0.5) * 0.3, l = 22 + r() * 12;
    const tip = [x + lean + cos(a) * l, -h + sin(a) * l * 0.5 + l * 0.25];
    curve(ctx, [[x + lean, -h], [x + lean + cos(a) * l * 0.5, -h + sin(a) * l * 0.5 - 4], tip], JUNGLE[2], 2.4);
  }
}

function fern(ctx, x, h, seed) {
  const r = rng(seed);
  for (let i = 0; i < (simple() ? 5 : 9); i++) {
    const a = -PI / 2 + (i / 8 - 0.5) * 2.4, l = h * (0.7 + r() * 0.4);
    const tip = [x + cos(a) * l, -h * 0.05 + sin(a) * l];
    shape(ctx, [[x - 1.5, 0], [x + cos(a) * l * 0.5 - 2, sin(a) * l * 0.5], tip, [x + cos(a) * l * 0.5 + 2, sin(a) * l * 0.5], [x + 1.5, 0]], i % 2 ? JUNGLE[3] : JUNGLE[2]);
  }
}

function ruinWall(ctx, x, w, h, seed) {
  const r = rng(seed);
  const top = [[x, -h * (0.7 + r() * 0.3)]];
  for (let i = 1; i < 6; i++) top.push([x + w * i / 6, -h * (0.55 + r() * 0.45)]);
  top.push([x + w, -h * (0.6 + r() * 0.4)]);
  shape(ctx, [[x, 0], ...top, [x + w, 0]], "#7c8270");
  ctx.save();
  path(ctx, [[x, 0], ...top, [x + w, 0]]);
  ctx.clip();
  flat(ctx, x, -h, w, h * 0.3, "#949a86");
  flat(ctx, x + w * 0.7, -h, w * 0.3, h, "#5e6454");
  flat(ctx, x, -14, w, 2, "#a08a40");
  ctx.restore();
}

define({
  id: "villageBackdrop",
  box: [0, -170, 320, 0],
  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -170, 320, 170);
    ctx.clip();
    flat(ctx, 0, -170, 320, 170, "#1c1a12");
    for (const [x, w] of [[30, 30], [110, 22], [200, 34], [270, 26]]) flat(ctx, x, -150, w * 0.18, 150, JUNGLE[0]);
    canopy(ctx, 50, -150, 150, 1);
    canopy(ctx, 230, -150, 170, 2);
    canopy(ctx, 150, -175, 120, 3);
    palm(ctx, 90, 120, 14, 4);
    palm(ctx, 250, 130, -10, 5);
    ruinWall(ctx, 0, 130, 75, 6);
    ruinWall(ctx, 200, 90, 70, 7);
    ruinWall(ctx, 296, 30, 80, 8);
    shape(ctx, blob(158, -44, 36, 20, 9), JUNGLE[1]);
    for (const [x, h, seed] of [[60, 34, 10], [140, 28, 11], [170, 40, 12], [240, 30, 13], [300, 26, 14], [20, 24, 15]]) {
      ctx.save();
      ctx.translate(0, -24);
      fern(ctx, x, h, seed);
      ctx.restore();
    }
    flat(ctx, 0, -26, 320, 18, JUNGLE[1]);
    if (!simple()) for (let x = 0; x < 320; x += 6) flat(ctx, x, -27 - (x * 7 % 5), 2, 4, JUNGLE[2]);
    flat(ctx, 0, -8, 320, 8, "#1a1008");
    for (let x = 4; x < 320; x += 14) flat(ctx, x, -6, 8, 3, "a0");
    ctx.restore();
  }
});

function windows(ctx, x, y, cols, rows, w, h, gap, seed) {
  const r = rng(seed);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const wx = x + i * (w + gap), wy = y + j * (h + gap);
    flat(ctx, wx, wy, w, h, "glass", "kLine");
    if (!simple()) {
      flat(ctx, wx + w / 2 - 0.5, wy, 1, h, "c1");
      flat(ctx, wx, wy + h / 2 - 0.5, w, 1, "c1");
    }
    if (r() < 0.3) shape(ctx, [[wx + 1, wy + 1], [wx + w * 0.7, wy + 1], [wx + w * 0.3, wy + h * 0.6], [wx + 1, wy + h * 0.8]], "hole");
  }
}

define({
  id: "villageHouse",
  box: [-4, -126, 220, 0],
  draw(ctx) {
    const top = [[0, -96], [10, -104], [22, -100], [30, -112], [130, -112]];
    shape(ctx, [[0, 0], ...top, [130, -116], [212, -116], [212, 0]], "k2", "kLine");
    flat(ctx, 128, -120, 86, 5, "k3", "kLine");
    flat(ctx, 0, -6, 212, 6, "k1", "kLine");
    for (const x of [0, 66, 128, 198]) {
      box(ctx, x, -110, 14, 110, "concrete", 2, { vertical: true });
    }
    windows(ctx, 18, -94, 4, 3, 9, 9, 3, 1);
    windows(ctx, 84, -94, 3, 3, 9, 9, 3, 2);
    windows(ctx, 146, -100, 4, 4, 9, 9, 3, 3);
    shape(ctx, [[82, -112], [90, -120], [100, -114], [112, -124], [122, -112]], "k2", "kLine");
    shape(ctx, [[86, -112], [94, -100], [104, -108], [114, -98], [120, -112]], "hole");
    if (!simple()) {
      for (const [x, y] of [[96, -112], [104, -116], [110, -110]]) line(ctx, [[x, y], [x + 2, y - 6]], "r2", 0.7);
      for (const y of [-58, -32]) flat(ctx, 14, y, 52, 1, "k1");
    }
    box(ctx, 88, -40, 26, 40, "steel", 0);
    flat(ctx, 92, -36, 18, 32, "hole", "mLine");
    for (let x = 146; x < 196; x += 12) box(ctx, x, -24, 8, 18, "concrete", 1, { vertical: true });
  }
});

function plankWall(ctx, x, y, w, h) {
  box(ctx, x, y, w, h, "rust", 1);
  if (!simple()) for (let yy = y + 4; yy < y + h; yy += 4) flat(ctx, x, yy, w, 0.6, "r0");
}

define({
  id: "stiltBuilding",
  box: [-4, -212, 244, 0],
  draw(ctx) {
    for (const x of [24, 108, 192]) {
      box(ctx, x, -112, 20, 112, "rust", 1, { vertical: true });
      box(ctx, x - 2, -8, 24, 8, "concrete", 1);
    }
    if (!simple()) {
      line(ctx, [[44, -100], [108, -40]], "rLine", 3);
      line(ctx, [[44, -100], [108, -40]], "r1", 1.8);
    }
    box(ctx, 0, -120, 240, 10, "rust", 2);
    plankWall(ctx, 6, -192, 228, 72);
    for (const y of [-182, -150]) {
      flat(ctx, 6, y - 4, 228, 3, "r3", "rLine");
      for (let x = 14; x < 226; x += 24) {
        flat(ctx, x, y, 18, 20, "hole", "rLine");
        flat(ctx, x + 1, y + 1, 16, 2, "r0");
        if (!simple()) for (let k = 0; k < 4; k++) flat(ctx, x + 2 + k * 4, y + 17, 1, 3, "r2");
      }
    }
    box(ctx, 0, -196, 240, 6, "rust", 3);
    for (const x of [16, 52, 96, 140, 176, 220]) {
      box(ctx, x, -210, 3, 14, "rust", 2, { vertical: true });
      poly(ctx, [[x - 1, -210], [x + 1.5, -214], [x + 4, -210]], "rust", 2);
    }
    for (const x of [0, 236]) box(ctx, x, -196, 4, 86, "rust", 2, { vertical: true });
  }
});

const GUARD_PAL = {
  a0: "#3a3418", a1: "#5c5428", a2: "#7e7440", a3: "#b0a468", aLine: "#141008",
  m0: "#1c2018", m1: "#30362a", m2: "#4a5040", m3: "#6e7460", mLine: "#0a0c08",
  c0: "#5a5c50", c1: "#8a8c7c", c2: "#b4b4a2", c3: "#e0e0cc",
  badge: "#7e7440", trefoil: "#141008", visor: "#e0281e", screen: "#3fa34a", hole: "#120e08"
};
const GUARD_H = 60;
const GUARD_WIDE = 1.18;
const GUARD_POSE = { hipNear: -14, kneeNear: 18, ankleNear: -4, hipFar: 12, kneeFar: 6, ankleFar: -16, body: 3 };
const RIFLE_SUPPORT = [40, -14];
const RIFLE_MUZZLE = [262, -44];
const guardRigs = {};
let rifleModel = null;

function rifleParts() {
  return [
    { name: "stock", x: -96, y: -60, w: 70, h: 30, mat: "m", tone: 1 },
    { name: "grip", x: -14, y: -24, w: 22, h: 50, mat: "m", tone: 0 },
    { name: "receiver", x: -40, y: -66, w: 130, h: 40, mat: "m", tone: 2 },
    { name: "mag", x: 30, y: -30, w: 26, h: 54, mat: "m", tone: 0 },
    { name: "scope", x: -10, y: -88, w: 70, h: 18, mat: "c", tone: 1 },
    { name: "barrel", x: 90, y: -56, w: 160, h: 18, mat: "c", tone: 1 },
    { name: "guard", x: 90, y: -62, w: 70, h: 30, mat: "m", tone: 1 },
    { name: "brake", x: 240, y: -60, w: 22, h: 26, mat: "m", tone: 0 }
  ];
}

function guardRig() {
  const key = simple() ? "lod" : "full";
  if (guardRigs[key]) return guardRigs[key];
  const { buildSide, locate, solve } = window.XBOT;
  rifleModel ||= window.GUN.model({ buildParts: rifleParts });
  const root = buildSide({ enemy: true, lod: simple(), farLimbs: true });
  const carry = { ...GUARD_POSE, arm: -8, fore: -76 };
  const grip = window.GUN.toHook(RIFLE_SUPPORT);
  const far = solve(root, "handFar", carry, ["armFar", "foreFar"], [[-160, 40], [-150, 30]], locate(root, "hand", carry).transformPoint(new DOMPoint(...grip)));
  return (guardRigs[key] = { root, pose: { ...carry, ...far } });
}

function muzzleFlash(ctx, x, y, k) {
  if (!simple()) glow(ctx, x + 20, y, 70 * k + 20, "a2", 0.7);
  poly(ctx, [[x, y - 14], [x + 50 * k + 20, y - 26], [x + 30, y - 6], [x + 80 * k + 30, y], [x + 30, y + 6], [x + 50 * k + 20, y + 26], [x, y + 14]], "a1", 2, { line: false });
  poly(ctx, [[x, y - 8], [x + 40 * k + 14, y], [x, y + 8]], "y3", 2, { line: false });
}

function backpack(ctx) {
  ctx.save();
  ctx.transform(0, 1, -1, 0, 0, 0);
  box(ctx, -40, -10, 150, 80, "olive", 1);
  box(ctx, -30, 60, 130, 24, "olive", 0);
  ctx.restore();
}

function guardFigure(ctx, fire, tint) {
  const { root, pose } = guardRig();
  const { render, FOOT_Y, SIDE_AX, shade } = window.XBOT;
  const k = GUARD_H / (FOOT_Y - 2);
  const pal = tint ? shade(GUARD_PAL, tint) : GUARD_PAL;
  ctx.save();
  ctx.scale(k * GUARD_WIDE, k);
  ctx.translate(-SIDE_AX, -FOOT_Y);
  const t = ctx.getTransform();
  const lineW = P.lw(ctx) * Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
  const hand = c => {
    c.save();
    c.transform(0, 1, -1, 0, 0, 0);
    rifleModel.draw(c, { pal, lineW, simple: simple() });
    if (fire >= 0) {
      c.translate(RIFLE_MUZZLE[0], RIFLE_MUZZLE[1]);
      c.scale(1.6, 1.6);
      muzzleFlash(c, 0, 0, fire);
    }
    c.restore();
  };
  render(ctx, root, { pal, pose, hooks: { hand, back: backpack }, lineW, simple: simple() });
  ctx.restore();
}

define({
  id: "bridgeGuard",
  box: [-30, -64, 60, 0],
  anim: true,
  draw(ctx, state, t) {
    shadow(ctx, 0, 34, 0.45);
    if (state === 2) {
      ctx.save();
      ctx.translate(30, -9);
      ctx.rotate(-PI / 2);
      guardFigure(ctx, -1, { brightness: 0.55, saturate: 0.5 });
      ctx.restore();
      if (!simple()) {
        smoke(ctx, -4, -10, t, 3, 24);
        spark(ctx, 6, -6, t, 4);
      }
      return;
    }
    const ph = (t * 4) % 1;
    guardFigure(ctx, state === 1 && ph < 0.4 ? 1 - ph / 0.4 : -1);
  }
});

define({
  id: "smoulderingRemains",
  box: [-4, -30, 52, 0],
  anim: true,
  draw(ctx, state, t) {
    const burnt = ["#1e1c1a", "#3e3a36", "#6a645c", "#a8a49c"];
    shadow(ctx, 24, 48, 0.55);
    flat(ctx, 2, -1.4, 44, 1.4, "#1a1410");
    poly(ctx, [[8, 0], [9, -5], [22, -6.4], [30, -5.6], [31, 0]], burnt[1], 2, { line: false });
    path(ctx, [[8, 0], [9, -5], [22, -6.4], [30, -5.6], [31, 0]]);
    stroke(ctx, "kLine");
    for (let i = 0; i < 5; i++) {
      const x = 11 + i * 3.6;
      line(ctx, [[x, -5.4], [x + 1.2, -9.4 + (i % 2)], [x + 2.4, -5.8]], "kLine", 1.5);
      line(ctx, [[x, -5.4], [x + 1.2, -9.4 + (i % 2)], [x + 2.4, -5.8]], burnt[3], 0.8);
    }
    poly(ctx, [[30, 0], [31, -6], [37, -7.8], [42, -5.6], [42.6, 0]], burnt[2], 2, { line: false });
    path(ctx, [[30, 0], [31, -6], [37, -7.8], [42, -5.6], [42.6, 0]]);
    stroke(ctx, "kLine");
    flat(ctx, 36.6, -5.6, 4, 1.2, state ? "#3a1008" : "neon");
    line(ctx, [[2, -1], [5, -4.6], [8.6, -2.2]], "kLine", 2);
    line(ctx, [[2, -1], [5, -4.6], [8.6, -2.2]], burnt[2], 1.2);
    line(ctx, [[22, -5], [26, -14], [28.6, -16.4]], "kLine", 2.2);
    line(ctx, [[22, -5], [26, -14], [28.6, -16.4]], burnt[3], 1.2);
    for (const [dx, dy] of [[28.6, -16.4], [29.8, -15.4], [29.4, -17.6]]) line(ctx, [[28.6, -16.4], [dx + 1, dy - 0.6]], burnt[3], 0.6);
    const embers = [[14, -4], [19, -2.6], [26, -3.6], [34, -2], [40, -3]];
    embers.forEach(([x, y], i) => {
      const k = 0.5 + sin(t * 3 + i * 1.7) * 0.5;
      if (!simple()) glow(ctx, x, y, 3.5, "a1", 0.25 + k * 0.3);
      disc(ctx, x, y, 0.7, k > 0.5 ? "a2" : "a0");
    });
    if (state === 0) {
      flat(ctx, 44, -1.6, 3.6, 1, "y2", "yLine");
      ellipse(ctx, 44, -1.1, 1.2, 1.1, "y1", "yLine");
      if (!simple()) glow(ctx, 45, -1.4, 4, "y3", 0.35 + sin(t * 4) * 0.15);
    }
    if (!simple()) {
      smoke(ctx, 18, -6, t, 3, 20);
      smoke(ctx, 36, -7, t + 1.4, 2, 16);
    }
  }
});

define({
  id: "smallKey",
  box: [-2, -6, 12, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 10);
    ctx.save();
    ctx.translate(0, -1.6);
    ctx.beginPath();
    ctx.arc(2.2, -1.2, 2.1, 0, PI * 2);
    ctx.arc(2.2, -1.2, 0.8, 0, PI * 2, true);
    ctx.fillStyle = color("y1");
    ctx.fill("evenodd");
    stroke(ctx, "yLine");
    if (!simple()) flat(ctx, 1.2, -2.9, 1.4, 0.5, "y3");
    box(ctx, 4.2, -1.8, 5.6, 1.2, "yellow", 1);
    poly(ctx, [[6.6, -0.6], [7.4, -0.6], [7.4, 0.9], [6.6, 0.9]], "yellow", 0);
    poly(ctx, [[8.4, -0.6], [9.6, -0.6], [9.6, 1.4], [8.4, 0.8]], "yellow", 0);
    ctx.restore();
  }
});

define({
  id: "walkieTalkie",
  box: [-2, -18, 12, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 10);
    shadow(ctx, 5, 9);
    cylV(ctx, 6.6, -17.4, 1.2, 6, "steel", 1);
    disc(ctx, 7.2, -17.6, 0.8, "m2", "mLine");
    box(ctx, 1, -12, 8, 12, "steel", 1);
    box(ctx, 1.6, -11.4, 6.8, 4, "steel", 0);
    if (!simple()) for (let y = -10.6; y < -7.6; y += 1) flat(ctx, 2.4, y, 5.2, 0.45, "m3");
    flat(ctx, 2.2, -6.4, 5.6, 2.4, "screenOff", "mLine");
    if (!simple()) flat(ctx, 2.6, -5.9, 2.4, 0.5, "screen");
    disc(ctx, 3, -2.2, 0.7, "neon", "mLine");
    disc(ctx, 6.6, -2.2, 0.9, "c1", "mLine");
    box(ctx, 9, -9, 1.2, 4, "steel", 0);
  }
});

define({
  id: "detonator",
  box: [-2, -20, 20, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 18);
    shadow(ctx, 8, 18);
    box(ctx, 2, -9, 12, 9, "rust", 2);
    box(ctx, 1.4, -10, 13.2, 1.8, "rust", 3);
    flat(ctx, 3.4, -6.4, 6, 3, "hazard", "yLine");
    if (!simple()) for (let x = 3.8; x < 9; x += 1.6) flat(ctx, x, -6.4, 0.6, 3, "hazardDark");
    disc(ctx, 11.6, -5, 1, "c2", "mLine");
    disc(ctx, 11.6, -2.6, 1, "c2", "mLine");
    box(ctx, 7.4, -17, 1.4, 7.2, "chrome", 2, { vertical: true });
    box(ctx, 3.6, -18.6, 9, 1.8, "chrome", 1);
    disc(ctx, 3.8, -17.7, 0.9, "neon", "mLine");
    disc(ctx, 12.4, -17.7, 0.9, "neon", "mLine");
    wire(ctx, [[12.6, -4.8], [16, -3.6], [17.4, -0.6]], "neon");
    wire(ctx, [[12.6, -2.4], [15.4, -1.2], [18, -0.4]], "y2");
  }
});

define({
  id: "projectile",
  box: [-2, -9, 28, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 26);
    shadow(ctx, 12, 24);
    box(ctx, 1, -7.6, 3, 7.4, "yellow", 0);
    box(ctx, 3, -7, 12, 6.2, "yellow", 1);
    if (!simple()) for (const x of [6, 12]) flat(ctx, x, -7, 0.6, 6.2, "y0");
    box(ctx, 15, -7.4, 2, 7, "rust", 1);
    poly(ctx, [[17, -7], [21, -6.6], [24.6, -4.6], [25.4, -3.8], [24.6, -3], [21, -1], [17, -0.6]], "steel", 2);
    if (!simple()) {
      flat(ctx, 3.4, -6.4, 11, 0.6, "y3");
      flat(ctx, 18, -6.2, 4, 0.5, "m3");
    }
    flat(ctx, 19, -4.6, 1.2, 1.6, "neon");
  }
});

define({
  id: "fuse",
  box: [-2, -7, 16, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 14);
    shadow(ctx, 7, 14);
    box(ctx, 3, -5.6, 8, 5.2, "chrome", 2);
    if (!simple()) flat(ctx, 4.4, -4.2, 5, 1.6, "neon");
    for (const x of [0.6, 11]) {
      box(ctx, x, -6, 2.4, 6, "yellow", 1);
      if (!simple()) flat(ctx, x + 0.4, -5.4, 0.5, 4.8, "y3");
    }
    flat(ctx, -0.6, -3.6, 1.4, 1.2, "y1", "yLine");
    flat(ctx, 13.2, -3.6, 1.4, 1.2, "y1", "yLine");
  }
});

function stick(ctx, x, y, w, h) {
  box(ctx, x, y, w, h, "brick", 2, { vertical: w < h });
  if (!simple()) flat(ctx, x + (w < h ? w * 0.2 : 0.4), y + (w < h ? 0.4 : h * 0.2), w < h ? w * 0.2 : w - 0.8, w < h ? h - 0.8 : h * 0.2, "b3");
}

define({
  id: "dynamite",
  box: [-2, -16, 20, 0],
  draw(ctx, state) {
    if (state === 1) return scuff(ctx, 0, 16);
    shadow(ctx, 8, 16);
    if (state === 2) {
      for (const x of [3, 6, 9]) stick(ctx, x, -14, 3, 14);
      for (const y of [-11, -4]) flat(ctx, 2.6, y, 9.8, 1.4, "k1", "kLine");
      box(ctx, 4.6, -9, 5.2, 3.6, "steel", 1);
      disc(ctx, 8.4, -7.2, 0.6, "neon");
      wire(ctx, [[7.2, -9], [8, -14], [12, -15], [15, -8], [17, -1]], "y2");
      return;
    }
    stick(ctx, 1, -3.4, 13, 3.2);
    stick(ctx, 2, -6.4, 13, 3.2);
    stick(ctx, 1.4, -9.2, 13, 3.2);
    for (const x of [4, 10.6]) flat(ctx, x, -9.4, 1.4, 9.2, "k1", "kLine");
    wire(ctx, [[14.4, -7.6], [16.4, -9], [18, -7.4]], "k3", 0.6);
  }
});

define({
  id: "navCircuit",
  box: [-2, -11, 18, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 16);
    shadow(ctx, 8, 16);
    poly(ctx, [[0, 0], [1.6, -9], [15, -9], [14.4, 0]], "green", 1, { dir: [1, 0] });
    if (!simple()) {
      ctx.save();
      ctx.strokeStyle = color("y2");
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      for (const [a, b] of [[[2, -2], [6, -7]], [[5, -1.4], [12, -1.4]], [[9, -7.6], [13, -4]], [[3.6, -6], [8, -6]]]) { ctx.moveTo(...a); ctx.lineTo(...b); }
      ctx.stroke();
      ctx.restore();
    }
    box(ctx, 4.2, -6.6, 4.6, 3.6, "steel", 0);
    box(ctx, 10, -7.6, 3, 2.4, "steel", 0);
    flat(ctx, 10.4, -4, 2.4, 1.8, "plasma", "mLine");
    for (let x = 4.6; x < 8.8; x += simple() ? 2 : 1) flat(ctx, x, -3, 0.4, 0.8, "y2");
    flat(ctx, 1, -1.2, 13, 1.2, "y1", "yLine");
  }
});

define({
  id: "toaster",
  box: [-2, -14, 28, 0],
  anim: true,
  draw(ctx, state, t) {
    if (state) return scuff(ctx, 0, 26);
    shadow(ctx, 12, 24);
    box(ctx, 2, -3, 4, 3, "steel", 0);
    box(ctx, 0.6, -11, 14, 8.6, "chrome", 1);
    box(ctx, 0.6, -12.2, 14, 1.6, "chrome", 2);
    const heat = 0.6 + sin(t * 5) * 0.25;
    for (const x of [3, 8]) {
      flat(ctx, x, -12, 3.4, 1, "hole");
      if (!simple()) glow(ctx, x + 1.7, -12, 3, "a1", heat * 0.6);
      flat(ctx, x + 0.4, -11.9, 2.6, 0.5, "a2");
    }
    box(ctx, 14.6, -9, 9, 4.4, "steel", 1);
    for (let x = 16; x < 23; x += simple() ? 3.2 : 1.6) flat(ctx, x, -9, 0.6, 4.4, "a1");
    box(ctx, 23.4, -9.6, 1.6, 5.6, "chrome", 2, { vertical: true });
    box(ctx, 9, -3, 3, 3, "steel", 1, { vertical: true });
    flat(ctx, 2, -8.6, 5, 1.6, "hazard", "yLine");
  }
});

define({
  id: "energyPickup",
  box: [-4, -18, 16, 0],
  anim: true,
  draw(ctx, state, t) {
    if (state) return scuff(ctx, 0, 12);
    const pulse = 0.5 + sin(t * 4) * 0.5;
    if (!simple()) glow(ctx, 6, -7, 10, "screen", 0.25 + pulse * 0.25);
    shadow(ctx, 6, 12);
    box(ctx, 1, -2, 10, 2, "steel", 1);
    box(ctx, 1, -14, 10, 2, "steel", 1);
    box(ctx, 4, -15.6, 4, 1.8, "chrome", 2);
    box(ctx, 1.8, -12, 8.4, 10, "green", 2, { vertical: true });
    poly(ctx, [[6.8, -11], [3.6, -6.4], [5.8, -6.4], [4.8, -3], [8.4, -7.8], [6.2, -7.8], [7.6, -11]], pulse > 0.5 ? "y3" : "y2", 2);
  }
});

define({
  id: "ammoPickup",
  box: [-2, -13, 22, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 20);
    shadow(ctx, 10, 20);
    for (let i = 0; i < (simple() ? 3 : 5); i++) {
      const x = 3 + i * (simple() ? 4.6 : 2.8);
      box(ctx, x, -12, 1.8, 3, "yellow", 2, { vertical: true });
      poly(ctx, [[x, -12], [x + 0.9, -13], [x + 1.8, -12]], "chrome", 2);
    }
    box(ctx, 1, -9.4, 18, 9.4, "olive", 1);
    box(ctx, 0.4, -10, 19.2, 1.8, "olive", 2);
    flat(ctx, 4, -6.6, 12, 3.6, "o0", "kLine");
    for (let i = 0; i < 3; i++) {
      const x = 5.6 + i * 3.6;
      flat(ctx, x, -6, 1.2, 2.4, "y2");
      poly(ctx, [[x, -6], [x + 0.6, -6.8], [x + 1.2, -6]], "y3", 2, { line: false });
    }
    flat(ctx, 8.6, -1.6, 2.8, 1.6, "m1", "mLine");
  }
});

define({
  id: "shieldPickup",
  box: [-4, -20, 18, 0],
  anim: true,
  draw(ctx, state, t) {
    if (state) return scuff(ctx, 0, 14);
    const bob = sin(t * 2.4) * 0.8;
    shadow(ctx, 7, 12);
    box(ctx, 2, -2.4, 10, 2.4, "steel", 1);
    if (!simple()) glow(ctx, 7, -11 + bob, 9, "plasma", 0.4);
    const shield = [[2.4, -16 + bob], [7, -18 + bob], [11.6, -16 + bob], [11, -9.4 + bob], [7, -5.4 + bob], [3, -9.4 + bob]];
    poly(ctx, shield, "denim", 2, { dir: [1, 1] });
    poly(ctx, shield.map(([x, y]) => [7 + (x - 7) * 0.62, -11.6 + bob + (y + 11.6 - bob) * 0.62]), "plasma", 2, { line: false });
    if (!simple()) flat(ctx, 6.4, -14.4 + bob, 1.2, 6, "plasmaCore");
    if (!simple()) flat(ctx, 4.4, -12 + bob, 5.2, 1.2, "plasmaCore");
  }
});

define({
  id: "projectileCrate",
  box: [-2, -24, 32, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 30);
    shadow(ctx, 15, 30);
    box(ctx, 1, -20, 28, 20, "olive", 1);
    for (let y = -15; y < 0; y += 5) flat(ctx, 1, y, 28, 0.5, "o0");
    for (const x of [1, 25.4]) box(ctx, x, -20, 3.6, 20, "olive", 2, { vertical: true });
    box(ctx, 0.4, -21.6, 29.2, 2.4, "olive", 3);
    box(ctx, 0.4, -2, 29.2, 2, "olive", 0);
    flat(ctx, 7, -15, 16, 9, "o0", "kLine");
    poly(ctx, [[8.4, -10.6], [17, -10.6], [20.6, -9.8], [21.4, -9.2], [20.6, -8.6], [17, -7.8], [8.4, -7.8]], "y2", 2, { line: false });
    if (!simple()) {
      flat(ctx, 8.4, -13.6, 13, 1.2, "y1");
      for (const x of [4.4, 25.6]) rivets(ctx, x - 1, -18, 2, 4, "o3");
    }
  }
});
})();
