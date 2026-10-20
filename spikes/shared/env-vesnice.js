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
