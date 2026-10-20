(() => {
const { define, P } = window.ENV;
const { rng, path, color, flat, box, poly, cylV, cylH, disc, rivets, glow, stroke, tones, shape, line, curve, beam, slab, mesh, truss, hazard } = P;
const { PI, sin, cos, min, max, abs } = Math;

const simple = () => window.ENV.simple;

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
  box: [-2, -40, 50, 0],
  anim: true,
  draw(ctx, state, t) {
    box(ctx, 0, -5, 48, 5, "steel", 1);
    poly(ctx, [[4, -5], [8, -9], [40, -9], [44, -5]], "steel", 2);
    ellipse(ctx, 24, -9, 15, 2.2, "m0", "mLine");
    ellipse(ctx, 24, -9, 11, 1.6, "plasma");
    for (const x of [6, 38]) {
      box(ctx, x, -18, 4, 9, "steel", 2, { vertical: true });
      lamp(ctx, x + 2, -19.5, "plasma", sin(t * 4 + x) > -0.3);
    }
    beamColumn(ctx, 24, -38, -9, 20, t);
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
