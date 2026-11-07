window.ENEMIES = window.ENEMIES || {};
(() => {
const { P, MAT } = window.ENV;
const { PI, sin, cos, max, min, abs, hypot, atan2, acos, sqrt } = Math;

const SHARED_PALETTE = {
  jf0: "#b04010", jf1: "#f08a28", jf2: "#ffd070", jf3: "#ffffff",
  jSmoke: "#3a3632", jSpark: "#ffe8a0", jArc: "#9cd8ff", jScorch: "#0c0806"
};

const SPIDER_PALETTE = {
  ...SHARED_PALETTE,
  sh0: "#3a3020", sh1: "#615134", sh2: "#8c7a50", sh3: "#c4b282", shLine: "#120d06",
  sp0: "#25282a", sp1: "#3a403e", sp2: "#56605c", sp3: "#88928c",
  sl0: "#1c1f22", sl1: "#363c42", sl2: "#5a636a", sl3: "#9aa4aa", slLine: "#08090a",
  sEye: "#b4ff5a", sEyeGlow: "#6cff2a", sStripe: "#e06a1c", sStripeDark: "#22140a", sTip: "#ff3a28"
};

const POD_PALETTE = {
  ...SHARED_PALETTE,
  pc0: "#384046", pc1: "#78848a", pc2: "#b8c2c6", pc3: "#f0f6f8", pcLine: "#0b0f12",
  pg0: "#14301a", pg1: "#28522f", pg2: "#437c46", pg3: "#7cb070", pgLine: "#06120a",
  pf0: "#464c50", pf1: "#80888c", pf2: "#b0b8bc", pf3: "#dfe6e8",
  pGlass0: "#060c10", pGlass1: "#14242c", pGlass2: "#3a5866",
  pLight: "#ffb838", pLightGlow: "#ff9a1c", pVent: "#ff6a28"
};

const TROOPER_PALETTE = {
  ...SHARED_PALETTE,
  ta0: "#142c4a", ta1: "#244c78", ta2: "#3a70a6", ta3: "#88b8de", taLine: "#050c16",
  tm0: "#101418", tm1: "#1e252c", tm2: "#323c46", tm3: "#5c6a76", tmLine: "#05070a",
  tc0: "#4a5866", tc1: "#8494a2", tc2: "#b8c6d0", tc3: "#eef4f8",
  tb0: "#5a3c10", tb1: "#a07020", tb2: "#d8a438", tb3: "#f8dc8c",
  tVisor: "#4cf0ff", tVisorGlow: "#20c8ff", tCell: "#5ce8ff",
  tp0: "#1c48b8", tp1: "#3c9cff", tp2: "#b0f0ff", tp3: "#ffffff"
};

Object.assign(MAT, {
  spiderHull: ["sh0", "sh1", "sh2", "sh3", "shLine"],
  spiderPlate: ["sp0", "sp1", "sp2", "sp3", "shLine"],
  spiderLeg: ["sl0", "sl1", "sl2", "sl3", "slLine"],
  podChrome: ["pc0", "pc1", "pc2", "pc3", "pcLine"],
  podLeg: ["pg0", "pg1", "pg2", "pg3", "pgLine"],
  podFoot: ["pf0", "pf1", "pf2", "pf3", "pcLine"],
  troopArmor: ["ta0", "ta1", "ta2", "ta3", "taLine"],
  troopMetal: ["tm0", "tm1", "tm2", "tm3", "tmLine"],
  troopChrome: ["tc0", "tc1", "tc2", "tc3", "tmLine"],
  troopBrass: ["tb0", "tb1", "tb2", "tb3", "taLine"],
  troopCell: ["tCell", "tCell", "tCell", "tCell", "tmLine"],
  troopLens: ["tVisor", "tVisor", "tVisor", "tVisor", "tmLine"]
});

const FIRE = ["jf0", "jf1", "jf2", "jf3"];
const PLASMA = ["tp0", "tp1", "tp2", "tp3"];
const TICK_HZ = 32;
const FIRE_TICKS = 9;
const FAR = { brightness: 0.55, saturate: 0.85 };
const DEAD = { brightness: 0.42, saturate: 0.45 };
const WRECK = { brightness: 0.6, saturate: 0.55 };

const simple = () => window.ENV.simple;
const fireFrame = t => {
  const k = Math.floor(t * TICK_HZ);
  return k < FIRE_TICKS ? k : -1;
};
const frac = u => ((u % 1) + 1) % 1;
const mix = (a, b, k) => a + (b - a) * k;
const smooth = s => s * s * (3 - 2 * s);

function ellipse(ctx, cx, cy, rx, ry, fill, line = null, rot = 0) {
  ctx.fillStyle = P.color(fill);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rot, 0, PI * 2);
  ctx.fill();
  if (line) P.stroke(ctx, line);
}

function limb(ctx, a, b, wa, wb, mat, tone = 2) {
  const len = hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
  const t = P.tones(mat);
  const top = t[min(3, tone + 1)], mid = t[tone], low = t[max(0, tone - 1)];
  const half = max(wa, wb) / 2;
  const g = ctx.createLinearGradient(a[0] - nx * half, a[1] - ny * half, a[0] + nx * half, a[1] + ny * half);
  const [s0, s1] = simple() ? [0.3, 0.7] : [0.25, 0.68];
  for (const [at, c] of [[0, top], [s0, top], [s0, mid], [s1, mid], [s1, low], [1, low]]) g.addColorStop(at, c);
  ctx.fillStyle = g;
  P.path(ctx, [[a[0] - nx * wa / 2, a[1] - ny * wa / 2], [b[0] - nx * wb / 2, b[1] - ny * wb / 2], [b[0] + nx * wb / 2, b[1] + ny * wb / 2], [a[0] + nx * wa / 2, a[1] + ny * wa / 2]]);
  ctx.fill();
  P.stroke(ctx, mat);
}

function ik(hip, foot, l1, l2, pick) {
  const dx = foot[0] - hip[0], dy = foot[1] - hip[1];
  const d = min(hypot(dx, dy), l1 + l2 - 0.01);
  const base = atan2(dy, dx);
  const a = acos(max(-1, min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const k1 = [hip[0] + cos(base - a) * l1, hip[1] + sin(base - a) * l1];
  const k2 = [hip[0] + cos(base + a) * l1, hip[1] + sin(base + a) * l1];
  return pick(k1, k2) ? k1 : k2;
}

function stride(u, duty, len, lift) {
  const p = frac(u);
  if (p < duty) return [len / 2 - len * p / duty, 0];
  const s = (p - duty) / (1 - duty);
  return [-len / 2 + len * smooth(s), -lift * sin(PI * s)];
}

function muzzleFlash(ctx, x, y, k, size, keys = FIRE) {
  const heat = k === 0 ? 1 : max(0, 1 - k / 5);
  if (heat <= 0) return;
  const len = size * (1.5 + heat);
  if (!simple()) P.glow(ctx, x + len * 0.3, y, size * 2.8 * heat, keys[1], 0.55 * heat);
  P.shape(ctx, [[x, y - size * 0.75], [x + len * 0.5, y - size * 0.4], [x + len, y], [x + len * 0.5, y + size * 0.4], [x, y + size * 0.75]], keys[0]);
  for (const s of [-1, 1]) P.shape(ctx, [[x + size * 0.2, y], [x + size * 0.9, y + s * size * 1.4 * heat], [x + size * 0.75, y]], keys[1]);
  P.shape(ctx, [[x, y - size * 0.45], [x + len * 0.75, y], [x, y + size * 0.45]], keys[1]);
  ellipse(ctx, x + size * 0.4, y, size * 0.55 * heat + 0.2, size * 0.36 * heat + 0.2, heat > 0.5 ? keys[3] : keys[2]);
}

function smoke(ctx, x, y, t, n = 4, rise = 18, size = 3) {
  if (simple()) return;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const u = frac(t * 0.42 + i / n);
    ctx.globalAlpha = 0.42 * (1 - u) * min(1, u * 6);
    ellipse(ctx, x + sin(i * 2.3 + u * 3) * 2 + u * 3, y - u * rise, size * (0.6 + u * 1.4), size * (0.5 + u), "jSmoke");
  }
  ctx.restore();
}

function spark(ctx, x, y, t, seed) {
  const u = frac(t * 2.7 + seed * 0.37);
  if (u > 0.22) return;
  const r = 1.6 * (1 - u / 0.22) + 0.4;
  if (!simple()) P.glow(ctx, x, y, r * 3, "jf2", 0.6);
  for (let i = 0; i < 4; i++) {
    const a = i * PI / 2 + seed;
    P.line(ctx, [[x, y], [x + cos(a) * r, y + sin(a) * r]], "jSpark", 0.35);
  }
}

function arc(ctx, a, b, t, seed) {
  const u = frac(t * 3.1 + seed * 0.29);
  if (u > 0.4) return;
  const r = P.rng(seed * 97 + Math.floor(t * 18));
  const pts = [a];
  for (let i = 1; i < 6; i++) pts.push([mix(a[0], b[0], i / 6) + (r() - 0.5) * 2.6, mix(a[1], b[1], i / 6) + (r() - 0.5) * 2.6]);
  pts.push(b);
  if (!simple()) P.line(ctx, pts, "jArc", 1.4 * (1 - u));
  P.line(ctx, pts, "jf3", 0.4);
}

function scorch(ctx, pts, alpha = 0.75) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  P.shape(ctx, pts, "jScorch");
  ctx.restore();
}

function boom(ctx, age, size) {
  const { blast, BLAST_PX } = window.ENEMIES;
  ctx.save();
  ctx.scale(BLAST_PX * size, BLAST_PX * size);
  blast(ctx, age);
  ctx.restore();
}

function exploding(ctx, t, size, body, wreck) {
  const { BLAST } = window.ENEMIES;
  const age = t % BLAST.loop;
  ctx.save();
  if (age < BLAST.hideBody) body();
  else wreck();
  ctx.restore();
  boom(ctx, age, size);
}

const SPIDER = {
  T: 0.9, duty: 0.62, stride: 9, lift: 4.5,
  l1: 13.5, l2: 22,
  hips: [[-12, -18], [-4, -18.5], [4, -18.5], [11, -18]],
  feet: [-22, -10, 8, 21],
  far: { dx: 2.6, dy: -1.6, foot: -1 },
  muzzle: [26.5, -15.1],
  blast: 0.62
};

function spiderLeg(ctx, hip, foot) {
  const knee = ik(hip, foot, SPIDER.l1, SPIDER.l2, (a, b) => a[1] < b[1]);
  limb(ctx, hip, knee, 2.4, 1.9, "spiderLeg", 2);
  if (!simple()) P.line(ctx, [along(hip, knee, 0.15, 1.1), along(hip, knee, 0.8, 1.1)], "sl3", 0.35, "butt");
  limb(ctx, knee, foot, 1.7, 0.6, "spiderLeg", 1);
  P.disc(ctx, knee[0], knee[1], 1.35, "sl2", "slLine");
  if (!simple()) P.disc(ctx, knee[0], knee[1], 0.55, "sl0");
  P.disc(ctx, hip[0], hip[1], 1.5, "sl1", "slLine");
  P.line(ctx, [[foot[0] - 1, foot[1]], [foot[0] + 1.2, foot[1]]], "sl1", 0.7, "round");
}

function along(a, b, k, off = 0) {
  const len = hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [mix(a[0], b[0], k) - (b[1] - a[1]) / len * off, mix(a[1], b[1], k) + (b[0] - a[0]) / len * off];
}

function spiderFeet(mode, t) {
  const near = [], far = [];
  const spread = mode === "fire" ? 1.1 : 1;
  SPIDER.hips.forEach((h, i) => {
    const rest = SPIDER.feet[i] * spread;
    if (mode === "walk") {
      const a = stride(t / SPIDER.T + (i % 2) * 0.5, SPIDER.duty, SPIDER.stride, SPIDER.lift);
      const b = stride(t / SPIDER.T + ((i + 1) % 2) * 0.5, SPIDER.duty, SPIDER.stride, SPIDER.lift);
      near.push([rest + a[0], a[1]]);
      far.push([rest + SPIDER.far.dx + b[0], SPIDER.far.foot + b[1]]);
    } else {
      near.push([rest, 0]);
      far.push([rest + SPIDER.far.dx, SPIDER.far.foot]);
    }
  });
  return { near, far };
}

function spiderHull(ctx) {
  P.poly(ctx, [[-16, -15], [13, -15], [11, -12], [-14, -12]], "spiderLeg", 0);
  P.poly(ctx, [[-18.5, -23], [-15.5, -26.5], [9, -26.5], [13.5, -23.5], [14.5, -15.5], [-17.5, -14.5], [-19, -17]], "spiderHull", 2);
  P.poly(ctx, [[-13.5, -26.5], [-11.5, -29.2], [5, -29.2], [7.5, -26.5]], "spiderHull", 3);
  P.poly(ctx, [[-15, -22.3], [8.5, -22.3], [10.5, -18.4], [-15, -18.4]], "spiderPlate", 1);
  P.hazard(ctx, -16, -17.4, 26, 1.9, 2.2, { fill: "sStripe", dark: "sStripeDark", line: "shLine" });
  if (!simple()) {
    for (const x of [-12, -9.5, -7]) P.flat(ctx, x, -21.4, 1.1, 2.2, "sp0");
    for (const x of [-12, -6, 0]) P.disc(ctx, x, -28, 0.45, "sh0");
    P.line(ctx, [[-10, -28.6], [3.5, -28.6]], "sh3", 0.4, "butt");
    P.line(ctx, [[-1, -22.3], [0, -18.4]], "shLine", 0.4, "butt");
    P.flat(ctx, 2, -21.5, 4.5, 1.2, "sStripe");
  }
}

function spiderHead(ctx, eye = 1) {
  P.poly(ctx, [[8.5, -26.2], [14.5, -25.4], [19.5, -22], [19.5, -17.2], [14.5, -15.6], [8.5, -17.4]], "spiderPlate", 2);
  P.disc(ctx, 16.2, -21.6, 1.9, "sl0", "slLine");
  ctx.save();
  ctx.globalAlpha *= eye;
  if (!simple() && eye > 0) P.glow(ctx, 16.6, -21.4, 5, "sEyeGlow", 0.5);
  P.disc(ctx, 16.5, -21.6, 1.1, "sEye");
  P.disc(ctx, 18.4, -18.6, 0.7, "sEye");
  P.disc(ctx, 13.6, -18.4, 0.55, "sEye");
  if (!simple()) P.disc(ctx, 16.9, -22, 0.35, "jf3");
  ctx.restore();
}

function spiderGun(ctx, recoil) {
  P.poly(ctx, [[9.5, -17.5], [15.5, -17.5], [16.5, -14.5], [10, -13.2]], "spiderPlate", 1);
  P.box(ctx, 13 - recoil, -16.2, 13.5, 1.3, "spiderLeg", 2);
  P.box(ctx, 13 - recoil, -14.4, 12, 1.1, "spiderLeg", 1);
  P.box(ctx, 23.5 - recoil, -16.6, 2.6, 2, "spiderLeg", 1);
}

function spiderBody(ctx, mode, t) {
  const fire = mode === "fire" ? fireFrame(t % 1.1) : -1;
  const bob = mode === "walk" ? 0.6 * sin(4 * PI * t / SPIDER.T) : mode === "fire" ? 1.4 : 0.35 * sin(t * 2);
  const shake = fire >= 0 && fire < 4 ? 0.25 * (fire % 2 ? 1 : -1) : 0;
  const recoil = fire >= 0 ? max(0, 1.4 - fire * 0.35) : 0;
  const feet = spiderFeet(mode, t);
  const hip = (h, dx = 0, dy = 0) => [h[0] + dx + shake, h[1] + dy + bob];
  P.inShade(FAR, () => SPIDER.hips.forEach((h, i) => spiderLeg(ctx, hip(h, SPIDER.far.dx, SPIDER.far.dy), feet.far[i])));
  ctx.save();
  ctx.translate(shake, bob);
  P.line(ctx, [[-13, -28.5], [-17.5, -36.5]], "sl2", 0.55);
  const blink = frac(t * 0.8) < 0.5;
  P.disc(ctx, -17.5, -36.5, 0.7, blink ? "sTip" : "sl1");
  if (blink && !simple()) P.glow(ctx, -17.5, -36.5, 2.4, "sTip", 0.5);
  spiderGun(ctx, recoil);
  spiderHull(ctx);
  ctx.restore();
  SPIDER.hips.forEach((h, i) => spiderLeg(ctx, hip(h), feet.near[i]));
  ctx.save();
  ctx.translate(shake, bob);
  spiderHead(ctx, mode === "idle" ? 0.75 + 0.25 * sin(t * 3) : 1);
  ctx.restore();
  if (fire >= 0) muzzleFlash(ctx, SPIDER.muzzle[0] + shake - recoil, SPIDER.muzzle[1] + bob, fire, 2.4);
}

function spiderWreck(ctx, t) {
  P.inShade(DEAD, () => {
    P.inShade(FAR, () => {
      limb(ctx, [4, -4], [12, -11], 2.2, 1.8, "spiderLeg", 1);
      limb(ctx, [12, -11], [19, -1], 1.6, 0.6, "spiderLeg", 1);
      limb(ctx, [-10, -4], [-20, -1.5], 2.2, 1.6, "spiderLeg", 1);
    });
    ctx.save();
    ctx.translate(0, 12.5);
    ctx.rotate(-0.1);
    spiderGun(ctx, 0);
    spiderHull(ctx);
    spiderHead(ctx, 0);
    ctx.restore();
    limb(ctx, [-12, -3], [-17, -12], 2.4, 1.9, "spiderLeg", 2);
    limb(ctx, [-17, -12], [-21, -14.5], 1.7, 1.2, "spiderLeg", 1);
    limb(ctx, [6, -3], [15, -2.5], 2.4, 1.9, "spiderLeg", 2);
    limb(ctx, [15, -2.5], [27, -1], 1.6, 0.6, "spiderLeg", 1);
    limb(ctx, [-3, -2], [-9, -1], 2.4, 1.9, "spiderLeg", 2);
    for (const p of [[-17, -12], [15, -2.5], [6, -3]]) P.disc(ctx, p[0], p[1], 1.3, "sl2", "slLine");
  });
  scorch(ctx, [[-14, -14], [-6, -17.5], [3, -15], [5, -11], [-4, -9], [-12, -10]]);
  scorch(ctx, [[8, -15], [14, -13], [12, -9], [7, -10]], 0.6);
  smoke(ctx, -4, -16, t, 4, 20, 3);
  spark(ctx, 9, -12, t, 1);
  spark(ctx, -17, -12, t, 3);
}


const SPIDER_WALKER = {
  id: "spiderWalker",
  walkX: t => t * SPIDER.stride / (SPIDER.duty * SPIDER.T),
  box: { x: -27, y: -37, w: 57, h: 37 },
  draw(ctx, state, t) {
    if (state === 4) return spiderWreck(ctx, t);
    if (state === 3) return exploding(ctx, t, SPIDER.blast, () => spiderBody(ctx, "idle", t), () => spiderWreck(ctx, t));
    spiderBody(ctx, ["idle", "walk", "fire"][state], t);
  }
};

const POD = {
  T: 0.78, duty: 0.58, stride: 11, lift: 5,
  l1: 10.5, l2: 11.5, hip: [0, -19.5], far: { dx: 2, dy: -0.8, foot: -1 },
  ankle: [-3, -5], muzzle: [23, -24.6],
  blast: 0.78
};

function podShell(c) {
  c.moveTo(-13, -30.5);
  c.quadraticCurveTo(-13, -35, -6, -37);
  c.bezierCurveTo(4, -39.8, 14, -36, 19.5, -29);
  c.quadraticCurveTo(20.6, -26.6, 17, -25.2);
  c.bezierCurveTo(10, -22.2, -4, -22, -10, -24);
  c.quadraticCurveTo(-13.6, -25.6, -13, -30.5);
}

function podHull(ctx, { hot = 0, lights = 0, dead = false } = {}) {
  P.box(ctx, -16, -32, 3.4, 5.4, "podLeg", 1);
  P.flat(ctx, -16.4, -31, 0.8, 3.4, dead ? "pGlass0" : "pVent");
  if (!simple() && !dead) P.glow(ctx, -16.5, -29.3, 3, "pVent", 0.35);
  P.poly(ctx, [[-4, -37.4], [-2.2, -40.6], [3.4, -40.6], [4.6, -38.6]], "podChrome", 1);
  const g = ctx.createLinearGradient(0, -40, 0, -22);
  for (const [at, c] of [[0, "pc3"], [0.22, "pc2"], [0.55, "pc1"], [1, "pc0"]]) g.addColorStop(at, P.color(c));
  ctx.beginPath();
  podShell(ctx);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  P.stroke(ctx, "pcLine");
  ctx.save();
  ctx.beginPath();
  podShell(ctx);
  ctx.clip();
  const glass = ctx.createLinearGradient(0, -34, 0, -29.5);
  for (const [at, c] of [[0, "pGlass2"], [0.4, "pGlass1"], [1, "pGlass0"]]) glass.addColorStop(at, P.color(c));
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.moveTo(-9, -33.6);
  ctx.lineTo(11, -34.4);
  ctx.quadraticCurveTo(16.5, -33.4, 19.2, -29.6);
  ctx.quadraticCurveTo(14, -30.2, 11, -30.6);
  ctx.lineTo(-9, -30.4);
  ctx.closePath();
  ctx.fill();
  P.stroke(ctx, "pcLine");
  if (!dead) {
    for (let i = 0; i < 6; i++) {
      const x = -7 + i * 2.7;
      const on = frac(lights - i / 6) < 0.35 || hot > 0;
      P.flat(ctx, x, -32.6, 1.5, 1, on ? "pLight" : "pf0");
      if (on && !simple()) P.glow(ctx, x + 0.7, -32.1, 2.2, "pLightGlow", 0.35 + 0.4 * hot);
    }
    if (hot > 0) {
      ctx.save();
      ctx.globalAlpha *= hot * 0.85;
      ellipse(ctx, 15.5, -30.8, 4.5, 2.4, "jf1");
      ellipse(ctx, 16, -30.8, 2.4, 1.3, "jf3");
      ctx.restore();
    }
  }
  P.line(ctx, [[-2.5, -38.6], [-2.5, -22]], "pcLine", 0.4, "butt");
  P.line(ctx, [[-12, -27], [16, -26.6]], "pc0", 0.5, "butt");
  ctx.restore();
  if (!simple()) {
    P.curve(ctx, [[-6, -36.4], [4, -38.3], [13, -35.6], [17.5, -31.8]], "pc3", 0.8);
    ellipse(ctx, 6, -37.4, 2.6, 0.55, "jf3", null, -0.06);
    for (const x of [-10.5, -6.5]) P.disc(ctx, x, -26, 0.35, "pc0");
  }
}

function podGun(ctx, recoil) {
  P.poly(ctx, [[11, -26.5], [17.5, -26.5], [18.5, -23.2], [12, -22.4]], "podFoot", 1);
  P.box(ctx, 16.5 - recoil, -25.6, 6.6, 1.1, "podFoot", 2);
  P.box(ctx, 16.5 - recoil, -24, 5.6, 0.9, "podFoot", 1);
}

function podHips(ctx) {
  P.poly(ctx, [[-7.5, -24], [6.5, -24], [8.5, -19.8], [3.5, -16.6], [-5, -16.6], [-8.5, -19.8]], "podLeg", 2);
  if (!simple()) for (const x of [-4.5, -2, 0.5, 3]) P.flat(ctx, x, -22.8, 1, 2.4, "pg0");
}

function podLeg(ctx, hip, foot) {
  const ankle = [foot[0] + POD.ankle[0], foot[1] + POD.ankle[1]];
  const knee = ik(hip, ankle, POD.l1, POD.l2, (a, b) => a[0] > b[0]);
  limb(ctx, hip, knee, 8, 5.4, "podLeg", 2);
  P.poly(ctx, [along(hip, knee, 0.25, 4.2), along(hip, knee, 0.8, 3.2), along(hip, knee, 0.8, 0.6), along(hip, knee, 0.25, 0.6)], "podLeg", 3);
  if (!simple()) P.line(ctx, [along(hip, knee, 0.2, -1.4), along(hip, knee, 0.85, -1)], "pg3", 0.45, "butt");
  limb(ctx, knee, ankle, 5, 3.2, "podLeg", 1);
  P.disc(ctx, knee[0], knee[1], 2.4, "pf1", "pcLine");
  if (!simple()) P.disc(ctx, knee[0], knee[1], 0.8, "pf3");
  limb(ctx, ankle, [foot[0], foot[1] - 1.2], 2, 1.6, "podFoot", 2);
  P.disc(ctx, ankle[0], ankle[1], 1.3, "pf1", "pcLine");
  P.poly(ctx, [[foot[0] - 3, foot[1]], [foot[0] + 7, foot[1]], [foot[0] + 4.6, foot[1] - 2.6], [foot[0] - 1.4, foot[1] - 3.2]], "podFoot", 2);
  P.poly(ctx, [[foot[0] - 2.6, foot[1]], [foot[0] - 5, foot[1]], [foot[0] - 2, foot[1] - 2]], "podFoot", 1);
  P.disc(ctx, hip[0], hip[1], 2.8, "pg1", "pgLine");
  if (!simple()) P.disc(ctx, hip[0], hip[1], 1.1, "pf2");
}

function podFeet(mode, t) {
  if (mode !== "walk") {
    const crouch = mode === "fire" ? 1 : 0;
    return { near: [4.5 + crouch, 0], far: [-2.5 - crouch + POD.far.dx, POD.far.foot] };
  }
  const u = t / POD.T;
  const a = stride(u, POD.duty, POD.stride, POD.lift), b = stride(u + 0.5, POD.duty, POD.stride, POD.lift);
  return { near: [1.5 + a[0], a[1]], far: [1.5 + POD.far.dx + b[0], POD.far.foot + b[1]] };
}

function podBody(ctx, mode, t) {
  const fire = mode === "fire" ? fireFrame(t % 1.2) : -1;
  const u = t / POD.T;
  const bob = mode === "walk" ? 0.9 + 0.9 * cos(4 * PI * u) : mode === "fire" ? 1.6 : 0.5 + 0.4 * sin(t * 2.2);
  const pitch = mode === "walk" ? 0.035 * sin(2 * PI * u) : mode === "fire" ? 0.05 : 0;
  const recoil = fire >= 0 ? max(0, 1 - fire * 0.25) : 0;
  const feet = podFeet(mode, t);
  const hip = [POD.hip[0] - recoil * 0.6, POD.hip[1] + bob];
  P.inShade(FAR, () => podLeg(ctx, [hip[0] + POD.far.dx, hip[1] + POD.far.dy], feet.far));
  ctx.save();
  ctx.translate(hip[0], hip[1]);
  ctx.rotate(pitch);
  ctx.translate(-POD.hip[0], -POD.hip[1]);
  podHips(ctx);
  podGun(ctx, recoil);
  podHull(ctx, { hot: fire >= 0 ? max(0, 1 - fire / 4) : 0, lights: t * (mode === "walk" ? 1.6 : 0.8) });
  if (fire >= 0) muzzleFlash(ctx, POD.muzzle[0] - recoil, POD.muzzle[1], fire, 2.8);
  ctx.restore();
  podLeg(ctx, hip, feet.near);
}

function podWreck(ctx, t) {
  P.inShade(WRECK, () => {
    P.inShade(FAR, () => {
      limb(ctx, [3, -8], [11, -3.5], 4.6, 3.4, "podLeg", 1);
      limb(ctx, [11, -3.5], [16, -1.2], 3, 2.2, "podLeg", 1);
    });
    limb(ctx, [-2, -7], [-11, -3], 5, 3.6, "podLeg", 2);
    limb(ctx, [-11, -3], [-18, -1.2], 3.2, 2.2, "podLeg", 1);
    P.poly(ctx, [[-21, 0], [-14, 0], [-15.5, -2.4], [-20, -2.6]], "podFoot", 1);
    ctx.save();
    ctx.translate(0, 16.5);
    ctx.rotate(0.14);
    podGun(ctx, 0);
    podHull(ctx, { dead: true });
    ctx.restore();
    P.disc(ctx, -11, -3, 2, "pf1", "pcLine");
  });
  scorch(ctx, [[-10, -14], [-4, -20], [4, -21], [10, -18], [14, -13], [6, -11], [0, -14], [-6, -10]]);
  scorch(ctx, [[-1, -21], [2, -24.5], [6, -21.5], [9, -24], [8, -19]], 0.9);
  P.line(ctx, [[-2, -21], [1, -17], [-1, -14], [2, -11]], "jScorch", 0.6);
  smoke(ctx, 2, -20, t, 4, 22, 3.4);
  arc(ctx, [-1, -20], [-8, -11], t, 1);
  arc(ctx, [6, -21], [13, -2], t + 0.3, 2);
  spark(ctx, 9, -18, t, 5);
}


const POD_WALKER = {
  id: "podWalker",
  walkX: t => t * POD.stride / (POD.duty * POD.T),
  box: { x: -21, y: -41, w: 45, h: 41 },
  draw(ctx, state, t) {
    if (state === 4) return podWreck(ctx, t);
    if (state === 3) return exploding(ctx, t, POD.blast, () => podBody(ctx, "idle", t), () => podWreck(ctx, t));
    podBody(ctx, ["idle", "walk", "fire"][state], t);
  }
};

const TROOPER_SUPPORT = [150, -26];
const TROOPER_MUZZLE = [322, -46];
const TROOPER_FIRE_LOOP = 1.1;
const TROOPER_BURST = { shots: 9, every: 0.035 };
const TROOPER_HIT_LOOP = 1.2;
const ARMS = {
  ready: { arm: -18, fore: -54 },
  hit: { arm: -62, fore: -50 }
};
const stance = () => ({
  ready: window.GAIT.legs(2, [-8, 14, -4], [13, 6, -17]),
  hit: window.GAIT.legs(-13, [3, 22, -10], [-33, 8, 8])
});
const ARMOUR = [["head", "helmet"], ["arm", "pauldron"], ["armFar", "pauldronFar"], ["fore", "vambrace"], ["foreFar", "vambraceFar"]];
const trooperRigs = {};

function findNode(node, name) {
  if (node.k !== "g") return null;
  if (node.name === name) return node;
  for (const kid of node.kids) {
    const hit = findNode(kid, name);
    if (hit) return hit;
  }
  return null;
}

function trooperRig() {
  const key = simple() ? "lod" : "full";
  if (trooperRigs[key]) return trooperRigs[key];
  const { buildSide, locate, solve } = window.XBOT;
  const root = buildSide({ farLimbs: true, propBehindArm: true, enemy: true, lod: simple() });
  for (const [group, hook] of ARMOUR) findNode(root, group).kids.push({ k: "hook", name: hook });
  const grip = window.GUN.toHook(TROOPER_SUPPORT);
  const legs = stance();
  const holds = {}, poses = {};
  for (const [name, arms] of Object.entries(ARMS)) {
    const far = solve(root, "handFar", arms, ["armFar", "foreFar"], [[-160, 40], [-150, 30]], locate(root, "hand", arms).transformPoint(new DOMPoint(...grip)));
    holds[name] = { ...arms, ...far };
    poses[name] = name === "ready" ? carry(legs[name], holds[name]) : { ...legs[name], ...holds[name] };
  }
  return (trooperRigs[key] = { root, poses, holds });
}

function carry(pose, hold) {
  const b = pose.body ?? 0;
  return { ...pose, arm: hold.arm - b, fore: hold.fore, armFar: hold.armFar - b, foreFar: hold.foreFar };
}

function shotTick(t) {
  const shot = Math.floor(t / TROOPER_BURST.every);
  return shot < TROOPER_BURST.shots ? (t - shot * TROOPER_BURST.every) * TICK_HZ : -1;
}

const rigPals = new Map();

function rigPalette() {
  const p = window.ENV.pal;
  const sig = Object.keys(TROOPER_PALETTE).map(k => p[k]).join();
  let out = rigPals.get(sig);
  if (!out) {
    out = {
      ...window.XBOT.PALETTE,
      a0: p.ta0, a1: p.ta1, a2: p.ta2, a3: p.ta3, aLine: p.taLine,
      m0: p.tm0, m1: p.tm1, m2: p.tm2, m3: p.tm3, mLine: p.tmLine,
      c0: p.tc0, c1: p.tc1, c2: p.tc2, c3: p.tc3,
      visor: p.tVisor, badge: p.tb2, trefoil: p.tm0, screen: p.tCell, hole: p.tm0
    };
    rigPals.set(sig, out);
  }
  return out;
}

function blendPose(a, b, k) {
  const out = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) out[key] = mix(a[key] ?? 0, b[key] ?? 0, k);
  return out;
}

function trooperWalk(t) {
  const { pose, drop, x } = window.GAIT.walkAt(t);
  return { pose: carry(pose, trooperRig().holds.ready), drop, x };
}

function withLines(ctx, lines, draw) {
  const m = ctx.getTransform();
  const base = P.lw(ctx) * sqrt(abs(m.a * m.d - m.b * m.c));
  const palette = window.ENV.pal, lod = simple();
  window.ENV.draw(ctx, { draw }, { palette, lines, lod });
  window.ENV.draw(ctx, { draw() {} }, { palette, lines: base, lod });
}

function rifle(ctx, fire) {
  const s = simple();
  P.box(ctx, -130, -74, 84, 44, "troopMetal", 1);
  if (!s) P.box(ctx, -118, -66, 48, 20, "troopMetal", 0);
  P.box(ctx, -16, -34, 26, 60, "troopMetal", 1);
  P.box(ctx, 34, -34, 38, 50, "troopMetal", 0);
  P.box(ctx, -50, -90, 184, 62, "troopArmor", 2);
  P.box(ctx, 128, -84, 132, 34, "troopMetal", 1);
  P.box(ctx, 128, -48, 178, 12, "troopChrome", 2);
  P.box(ctx, 128, -94, 152, 9, "troopChrome", 1);
  P.box(ctx, 300, -58, 22, 26, "troopMetal", 0);
  if (!s) for (const x of [144, 170, 196, 222]) P.flat(ctx, x, -78, 12, 22, "tm0");
  P.box(ctx, -8, -76, 70, 28, "troopMetal", 0);
  P.box(ctx, -2, -68, 58, 12, "troopCell", 2);
  if (!s) {
    P.glow(ctx, 27, -62, 60, "tCell", 0.35);
    for (const x of [12, 26, 40]) P.flat(ctx, x, -68, 3, 12, "tm1");
  }
  P.box(ctx, -44, -29, 172, 6, "troopBrass", 2);
  P.box(ctx, 6, -118, 76, 26, "troopMetal", 2);
  P.box(ctx, 76, -114, 8, 18, "troopLens", 2);
  if (fire >= 0) muzzleFlash(ctx, TROOPER_MUZZLE[0], TROOPER_MUZZLE[1], fire, 34, PLASMA);
}

function helmet(ctx) {
  const s = simple();
  P.poly(ctx, [[274, 70], [276, 30], [288, 12], [320, 6], [364, 8], [390, 24], [396, 48], [396, 54], [352, 54], [344, 70], [300, 78]], "troopArmor", 2);
  P.poly(ctx, [[288, 12], [320, 6], [364, 8], [358, 18], [302, 22]], "troopArmor", 3, { line: false });
  P.poly(ctx, [[340, 50], [398, 48], [400, 66], [340, 68]], "troopMetal", 0);
  P.flat(ctx, 348, 53, 52, 10, "tVisor");
  if (!s) P.glow(ctx, 388, 58, 30, "tVisorGlow", 0.55);
  P.line(ctx, [[276, 46], [342, 50]], "tb2", 5, "butt");
  P.poly(ctx, [[268, 32], [252, 10], [260, 8], [280, 26]], "troopMetal", 1);
}

function pauldron(ctx) {
  const s = simple();
  P.poly(ctx, [[236, 130], [266, 104], [320, 96], [366, 110], [388, 146], [384, 196], [360, 216], [300, 224], [250, 212], [230, 176]], "troopArmor", 2);
  P.poly(ctx, [[254, 124], [300, 108], [348, 116], [366, 140], [300, 138]], "troopArmor", 3, { line: false });
  P.curve(ctx, [[234, 182], [260, 210], [300, 220], [360, 212], [384, 192]], "tb2", 8);
  if (!s) for (const x of [262, 338]) P.disc(ctx, x, 164, 6, "tb1", "taLine");
}

function vambrace(ctx) {
  P.poly(ctx, [[258, 300], [366, 296], [372, 352], [262, 356]], "troopArmor", 2, { dir: [1, 0] });
  P.line(ctx, [[260, 330], [370, 327]], "tb2", 6, "butt");
}

function powerCell(ctx) {
  const s = simple();
  ctx.save();
  ctx.transform(0, 1, -1, 0, 0, 0);
  P.box(ctx, -70, -20, 170, 44, "troopMetal", 1);
  P.box(ctx, -56, -32, 142, 12, "troopChrome", 2);
  P.flat(ctx, -40, -10, 110, 12, "tCell");
  if (!s) P.glow(ctx, 15, -4, 70, "tCell", 0.3);
  for (const x of [-60, 90]) P.line(ctx, [[x, -32], [x, 24]], "tb2", 8, "butt");
  ctx.restore();
}

function trooperRigDraw(ctx, pose, { fire = -1, armed = true } = {}) {
  const { root } = trooperRig();
  const m = ctx.getTransform();
  const lineW = P.lw(ctx) * sqrt(abs(m.a * m.d - m.b * m.c)) * (simple() ? window.XBOT.GAME_LINE : 1.4);
  const armour = draw => () => withLines(ctx, lineW, draw);
  const far = draw => armour(() => P.inShade(FAR, draw));
  const hooks = {
    helmet: armour(() => helmet(ctx)),
    pauldron: armour(() => pauldron(ctx)),
    pauldronFar: far(() => pauldron(ctx)),
    vambrace: armour(() => vambrace(ctx)),
    vambraceFar: far(() => vambrace(ctx)),
    back: armour(() => powerCell(ctx))
  };
  if (armed) hooks.hand = armour(() => {
    ctx.save();
    ctx.transform(0, 1, -1, 0, 0, 0);
    rifle(ctx, fire);
    ctx.restore();
  });
  window.XBOT.render(ctx, root, { pal: rigPalette(), pose, hooks, lineW, simple: simple() });
}

const RIG_PX = (1.9 * window.ENV.TILE) / (window.XBOT.FOOT_Y - Object.fromEntries(window.XBOT.LEVELS).head);

function trooperFigure(ctx, pose, { drop = 0, ...opts } = {}) {
  ctx.save();
  ctx.scale(RIG_PX, RIG_PX);
  ctx.translate(-window.XBOT.SIDE_AX, -window.XBOT.FOOT_Y + drop);
  trooperRigDraw(ctx, pose, opts);
  ctx.restore();
}

function caveTrooperRig(ctx, pose, { palette, lines = 1, lod = false, fire = -1 } = {}) {
  window.ENV.draw(ctx, { draw: () => trooperRigDraw(ctx, pose, { fire }) }, { palette, lines, lod });
}

function shadow(ctx, w) {
  ctx.save();
  ctx.globalAlpha *= 0.4;
  ellipse(ctx, 0, 0, w, 1.3, "#000");
  ctx.restore();
}

function hitAmount(t) {
  const u = (t % TROOPER_HIT_LOOP) / TROOPER_HIT_LOOP;
  if (u < 0.12) return smooth(u / 0.12);
  if (u < 0.4) return 1;
  if (u < 0.85) return 1 - smooth((u - 0.4) / 0.45);
  return 0;
}

function trooperBody(ctx, mode, t) {
  const { poses } = trooperRig();
  shadow(ctx, 14);
  if (mode === "walk") {
    const { pose, drop } = trooperWalk(t);
    return trooperFigure(ctx, pose, { drop });
  }
  if (mode === "fire") {
    return trooperFigure(ctx, poses.ready, { fire: shotTick(t % TROOPER_FIRE_LOOP) });
  }
  if (mode === "hit") {
    const k = hitAmount(t);
    const u = (t % TROOPER_HIT_LOOP) / TROOPER_HIT_LOOP;
    const flash = u < 0.18 ? { brightness: 1 + 1.2 * (1 - u / 0.18), saturate: 0.6 } : null;
    const pose = blendPose(poses.ready, poses.hit, k);
    if (flash) {
      pose.chest = { rot: 0, tint: flash };
      pose.head = { rot: -8 * k, tint: flash };
    }
    ctx.save();
    ctx.translate(-4 * k, 0);
    trooperFigure(ctx, pose);
    ctx.restore();
    return;
  }
  trooperFigure(ctx, { ...poses.ready, head: sin(t * 2.2) * 1.5 });
}

const WRECK_LIFT = 8;
const wreckPose = () => ({ ...window.GAIT.legs(0, [-4, 6, 36], [6, 4, 30]), head: -22, arm: 24, fore: 12, armFar: 14, foreFar: 18 });

function trooperWreck(ctx, t) {
  const k = RIG_PX;
  shadow(ctx, 24);
  ctx.save();
  ctx.translate(10, -1.6);
  ctx.rotate(-0.04);
  ctx.scale(k, k);
  P.inShade(DEAD, () => rifle(ctx, -1));
  ctx.restore();
  ctx.save();
  ctx.translate(-23, -WRECK_LIFT);
  ctx.rotate(PI / 2 - 0.06);
  P.inShade(WRECK, () => trooperFigure(ctx, wreckPose(), { armed: false }));
  ctx.restore();
  scorch(ctx, [[-14, -15], [-4, -18], [8, -17], [14, -13], [2, -11], [-10, -11]], 0.5);
  smoke(ctx, -10, -16, t, 4, 22, 3.6);
  spark(ctx, 6, -14, t, 2);
  spark(ctx, -16, -12, t, 6);
}


const CAVE_TROOPER = {
  id: "caveTrooper",
  box: { x: -24, y: -60, w: 64, h: 60 },
  draw(ctx, state, t) {
    if (state === 5) return trooperWreck(ctx, t);
    if (state === 4) return exploding(ctx, t, 1, () => trooperBody(ctx, "idle", t), () => trooperWreck(ctx, t));
    trooperBody(ctx, ["idle", "walk", "fire", "hit"][state], t);
  }
};

for (const [asset, box] of [[SPIDER_WALKER, [-27, -37, 57, 37]], [POD_WALKER, [-21, -41, 45, 41]], [CAVE_TROOPER, [-24, -60, 64, 60]]]) {
  window.ENV.define({ id: asset.id, box, anim: true, draw: (ctx, state, t) => asset.draw(ctx, state, t) });
}

Object.assign(window.ENEMIES, {
  SPIDER_WALKER, POD_WALKER, CAVE_TROOPER,
  SPIDER_PALETTE, POD_PALETTE, CAVE_TROOPER_PALETTE: TROOPER_PALETTE,
  caveTrooperWalk: trooperWalk, caveTrooperRig
});
})();
