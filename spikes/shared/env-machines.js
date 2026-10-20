(() => {
const { define, P } = window.ENV;
const { box, flat, poly, cylV, cylH, disc, rivets, hazard, glow, stroke, lw } = P;
const simple = () => window.ENV.simple;
const pal = () => window.ENV.pal;
const DOOR = window.C28_CONFIG?.cutscenes?.crowbarDoor?.palette || {};

function cable(ctx, pts, color, w = 1.5, outline = "mLine") {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    if (pts.length === 3) ctx.quadraticCurveTo(...pts[1], ...pts[2]);
    else if (pts.length === 4) ctx.bezierCurveTo(...pts[1], ...pts[2], ...pts[3]);
    else pts.slice(1).forEach(p => ctx.lineTo(...p));
  };
  if (lw(ctx)) {
    path();
    ctx.strokeStyle = pal()[outline] || outline;
    ctx.lineWidth = w + lw(ctx) * 2;
    ctx.stroke();
  }
  path();
  ctx.strokeStyle = pal()[color] || color;
  ctx.lineWidth = w;
  ctx.stroke();
  ctx.restore();
}

function ring(ctx, cx, cy, r, color, w = 1.2) {
  ctx.save();
  for (const [c, k] of [["mLine", w + lw(ctx) * 2], [color, w]]) {
    if (!k) continue;
    ctx.strokeStyle = pal()[c] || c;
    ctx.lineWidth = k;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function hash(a, b) {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function shape(pts, x, y, w, h) {
  return pts.map(([px, py]) => [x + px * w, y + py * h]);
}

const BOLT = [[0.58, 0], [0.18, 0.56], [0.46, 0.56], [0.34, 1], [0.82, 0.4], [0.54, 0.4], [0.72, 0]];

function greenPanel(ctx, x, y, s, inner) {
  box(ctx, x, y, s, s, "green", 0);
  flat(ctx, x, y, s, 1.5, "c1");
  flat(ctx, x, y, 1.5, s, "c1");
  flat(ctx, x + s - 1.5, y + 1.5, 1.5, s - 1.5, "g0");
  flat(ctx, x + 1.5, y + s - 1.5, s - 1.5, 1.5, "g0");
  const i = s * 0.22, n = s - i * 2;
  flat(ctx, x + i, y + i, n, n, "g1", "gLine");
  flat(ctx, x + i, y + i, n, 1, "g0");
  flat(ctx, x + i, y + i, 1, n, "g0");
  flat(ctx, x + i + 1, y + i + n - 1, n - 1, 1, "g3");
  flat(ctx, x + i + n - 1, y + i + 1, 1, n - 1, "g2");
  if (!simple()) for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) disc(ctx, x + 2.5 + a * (s - 5), y + 2.5 + b * (s - 5), 0.6, "g3");
  inner?.(x + i, y + i, n);
}

function boltIcon(ctx, x, y, n, color = "y2") {
  poly(ctx, shape(BOLT, x + n * 0.2, y + n * 0.12, n * 0.6, n * 0.76), color, 2, { line: true });
}

function wires(ctx, x, y, n) {
  flat(ctx, x + 1.5, y + 1.5, n - 3, 2, "m1", "mLine");
  const ends = [["a1", 0.25], ["y2", 0.5], ["neon", 0.75]];
  for (const [c, k] of ends) cable(ctx, [[x + n * k, y + 3], [x + n * (k - 0.3), y + n * 0.9], [x + n * (k + 0.1), y + n * 0.95]], c, 1);
}

define({
  id: "wireBox",
  box: [-3, -43, 25, 0],
  draw(ctx, state) {
    greenPanel(ctx, 0, -40, 22, (x, y, n) => {
      if (state === 0) return wires(ctx, x, y, n);
      boltIcon(ctx, x, y, n);
      if (!simple()) for (const k of [0.3, 0.6]) cable(ctx, [[x + n * k, y + n], [x + n * k + 1, y + n + 2.5]], "a1", 0.8);
    });
  }
});

define({
  id: "switchboard",
  box: [-3, -80, 30, 0],
  draw(ctx, state) {
    box(ctx, 0, -76, 26, 76, "concrete", 0, { vertical: true });
    box(ctx, -2, -78, 30, 5, "concrete", 1);
    box(ctx, -2, -5, 30, 5, "concrete", 1);
    if (!simple()) for (const y of [-62, -16]) flat(ctx, 2, y, 22, 0.8, "k0");
    greenPanel(ctx, 4, -54, 18, (x, y, n) => {
      if (state === 0) {
        flat(ctx, x + 1.5, y + 1.5, n - 3, 2, "m1", "mLine");
        for (const k of [0.3, 0.7]) cable(ctx, [[x + n * k, y + 3.5], [x + n * k - 0.5, y + 6]], "a1", 0.8);
        return;
      }
      wires(ctx, x, y, n);
    });
    const lit = state === 1;
    if (lit) glow(ctx, 19.5, -56.5, 7, "screen", 0.6);
    disc(ctx, 19.5, -56.5, 1.5, lit ? "screen" : "screenOff", "mLine");
  }
});

const TD = { x: 0, y: -60, w: 48, h: 53 };

function carriage(ctx) {
  const { x, y, w, h } = TD;
  flat(ctx, x - 10, y - 4, w + 20, h + 4, DOOR.wagon || "c1", "mLine");
  flat(ctx, x - 10, y - 4, w + 20, 3, "c2");
  flat(ctx, x - 10, y + h - 14, w + 20, 3, DOOR.stripe || "b2");
  flat(ctx, x - 10, y + h - 9, w + 20, 1.5, DOOR.wagonShade || "c0");
  flat(ctx, x - 10, y + h, w + 20, 7, "m0", "mLine");
  if (!simple()) {
    for (const bx of [-6, w + 2]) flat(ctx, bx, y + h + 2, 4, 3, "m2", "mLine");
    for (const [bx, by, bh] of [[-7, 10, 9], [w + 5, 22, 6], [w * 0.7, 4, 5]]) {
      flat(ctx, x + bx, y + by, 3, 2, "blood");
      flat(ctx, x + bx + 1, y + by + 2, 1, bh, "blood");
    }
  }
}

function leaf(ctx, x, w, left) {
  const { y, h } = TD;
  flat(ctx, x, y, w, h, DOOR.door || "c1", "mLine");
  flat(ctx, left ? x : x + w - 3, y, 3, h, DOOR.doorShade || "c0");
  flat(ctx, x + 6, y + 6, w - 12, 22, DOOR.window || "glass", "mLine");
  ctx.save();
  ctx.globalAlpha = 0.6;
  poly(ctx, [[x + 8, y + 6], [x + 11, y + 6], [x + 8, y + 28], [x + 6.5, y + 28]], DOOR.windowGlint || "m3", 2, { line: false });
  ctx.restore();
  flat(ctx, x + 4, y + h - 13, w - 8, 1.5, DOOR.doorShade || "c0");
}

function crowbar(ctx, cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.95);
  flat(ctx, -2, -1, 30, 2, DOOR.crowbar || "c2", "mLine");
  flat(ctx, -2, 0, 30, 1, DOOR.crowbarShade || "c0");
  poly(ctx, [[-2, -1], [-5, -2.5], [-6, -1], [-2, 1]], DOOR.crowbarShade || "c0", 2);
  ctx.restore();
}

function doorway(ctx, gap, open) {
  const { x, y, w, h } = TD, half = w / 2;
  flat(ctx, x, y, w, h, DOOR.interior || "hole");
  if (open) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    poly(ctx, [[x + 8, y + 2], [x + w - 8, y + 2], [x + w - 2, y + h], [x + 2, y + h]], DOOR.interiorLight || "y3", 2, { line: false });
    ctx.restore();
    flat(ctx, x + 10, y + 26, w - 20, 2, DOOR.interior || "hole");
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  leaf(ctx, x - gap / 2, half, true);
  leaf(ctx, x + half + gap / 2, half, false);
  ctx.restore();
  flat(ctx, x - 2, y - 2, w + 4, 2, DOOR.doorFrame || "m2", "mLine");
  flat(ctx, x - 2, y, 2, h, DOOR.doorFrame || "m2", "mLine");
  flat(ctx, x + w, y, 2, h, DOOR.doorFrame || "m2", "mLine");
}

define({
  id: "trainDoor",
  box: [-12, -66, 60, 0],
  draw(ctx, state) {
    carriage(ctx);
    doorway(ctx, [0, 3, TD.w / 2][state], state === 2);
    if (state === 1) crowbar(ctx, TD.w / 2 + 0.5, TD.y + 30);
  }
});

const CARRIAGE = { left: -95, right: 135 };

define({
  id: "trainCarriage",
  box: [-97, -66, 145, 0],
  draw(ctx, state) {
    const { y, h } = TD;
    const { left, right } = CARRIAGE;
    const w = right - left;
    flat(ctx, left, y - 4, w, h + 4, DOOR.wagon || "c1", "mLine");
    flat(ctx, left, y - 4, w, 3, "c2");
    flat(ctx, left, y + h - 14, w, 3, DOOR.stripe || "b2");
    flat(ctx, left, y + h - 9, w, 1.5, DOOR.wagonShade || "c0");
    flat(ctx, left, y + h, w, 7, "m0", "mLine");
    flat(ctx, left, y - 4, 4, h + 4, DOOR.wagonShade || "c0", "mLine");
    for (const wx of [left + 14, left + 52]) {
      flat(ctx, wx, y + 6, 22, 22, DOOR.window || "glass", "mLine");
      ctx.save();
      ctx.globalAlpha = 0.6;
      poly(ctx, [[wx + 2, y + 6], [wx + 5, y + 6], [wx + 2, y + 28], [wx + 0.5, y + 28]], DOOR.windowGlint || "m3", 2, { line: false });
      ctx.restore();
    }
    doorway(ctx, state === 1 ? TD.w / 2 : 0, state === 1);
    if (simple()) return;
    for (const bx of [left + 16, left + 46]) flat(ctx, bx, y + h + 2, 4, 3, "m2", "mLine");
    for (const [bx, by, bh] of [[left + 40, 8, 7], [left + 78, 30, 5]]) {
      flat(ctx, bx, y + by, 3, 2, "blood");
      flat(ctx, bx + 1, y + by + 2, 1, bh, "blood");
    }
  }
});

function pipeV(ctx, x, y, w, h, mat = "chrome", tone = 1) {
  cylV(ctx, x, y, w, h, mat, tone);
}

function pipeH(ctx, x, y, w, h, mat = "chrome", tone = 1) {
  cylH(ctx, x, y, w, h, mat, tone);
}

function collarV(ctx, x, y, w, mat = "chrome") {
  cylV(ctx, x - 1, y, w + 2, 2.5, mat, 2);
}

function collarH(ctx, x, y, h, mat = "chrome") {
  cylH(ctx, x, y - 1, 2.5, h + 2, mat, 2);
}

function handwheel(ctx, cx, cy, r) {
  ctx.save();
  ctx.lineCap = "round";
  for (const a of [0, Math.PI / 2]) cable(ctx, [[cx - Math.cos(a) * r, cy - Math.sin(a) * r], [cx + Math.cos(a) * r, cy + Math.sin(a) * r]], "c1", 0.9);
  ring(ctx, cx, cy, r, "c2", 1.3);
  disc(ctx, cx, cy, 1.4, "c1", "mLine");
  ctx.restore();
}

function spindle(ctx, cx, cy) {
  disc(ctx, cx, cy, 1.8, "c0", "mLine");
  flat(ctx, cx - 0.6, cy - 0.6, 1.2, 1.2, "m0");
}

const PIPE = "concrete";

define({
  id: "tapValveWheel",
  box: [-40, -96, 24, 0],
  draw(ctx, state) {
    const W = 18, x = 0, top = -92;
    poly(ctx, [[-40, top], [x + W, top], [x, top + W], [-40, top + W]], PIPE, 1);
    poly(ctx, [[x + W, top], [x + W, 0], [x, 0], [x, top + W]], PIPE, 1, { dir: [1, 0] });
    flat(ctx, -40, top + 4, 40 + W - 4, 1, "c2");
    flat(ctx, x + 4, top + W - 4, 1, -top - W + 4, "c2");
    if (!simple()) {
      for (const cx of [-28]) collarH(ctx, cx, top, W, PIPE);
      for (const cy of [-52, -10]) collarV(ctx, x, cy, W, PIPE);
    }
    flat(ctx, x - 1, -2, W + 2, 2, "m1", "mLine");
    if (state === 0) handwheel(ctx, x + W / 2, -30, 6);
    else spindle(ctx, x + W / 2, -30);
  }
});

function stream(ctx, x, y0, y1, w, t, color, dark, alpha = 0.75) {
  ctx.save();
  ctx.globalAlpha = alpha;
  flat(ctx, x, y0, w, y1 - y0, color);
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y0, w, y1 - y0);
  ctx.clip();
  const step = 7, off = (t * 40) % step;
  for (let i = 0, yy = y0 - step + off; yy < y1; yy += step, i++) {
    const k = (i % 3) / 3;
    flat(ctx, x + w * (0.15 + k * 0.5), yy, 1.2, 4, "c3");
    if (!simple()) flat(ctx, x + w * (0.7 - k * 0.4), yy + 3, 1, 3, dark);
  }
  ctx.restore();
  for (let i = 0; i < 4; i++) {
    const p = (t * 1.8 + i * 0.25) % 1;
    const dx = (i % 2 ? 1 : -1) * (2 + p * 6), dy = -4 * Math.sin(p * Math.PI);
    disc(ctx, x + w / 2 + dx, y1 - 1 + dy, 0.9, color);
  }
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = pal()[color] || color;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y1 - 0.5, w * 0.9, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

define({
  id: "waterPipe",
  box: [-24, -76, 30, 0],
  anim: true,
  draw(ctx, state, t) {
    flat(ctx, -24, -76, 54, 4, "m0", "mLine");
    flat(ctx, 2, -76, 20, 6, "hole");
    pipeH(ctx, -24, -70, 18, 8, "rust", 1);
    poly(ctx, [[-10, -70], [-6, -69], [-7, -66], [-9, -63], [-11, -66]], "hole", 2, { line: false });
    cylV(ctx, 4, -72, 16, 28, "rust", 1);
    collarV(ctx, 4, -60, 16, "rust");
    cylV(ctx, 2.5, -46, 19, 3, "rust", 2);
    flat(ctx, 7, -43, 10, 1.5, "hole");
    if (!simple()) {
      flat(ctx, 8, -66, 3, 5, "r3");
      flat(ctx, 14, -54, 2, 3, "r0");
    }
    if (state === 0) {
      stream(ctx, 7.5, -42, 0, 9, t, "g3", "y3", 0.5);
      return;
    }
    handwheel(ctx, 12, -52, 5);
    const p = (t * 0.7) % 1;
    disc(ctx, 12, -42 + p * 40, 0.9, "g3");
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = pal().g2;
    ctx.beginPath();
    ctx.ellipse(12, -0.5, 6, 1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
});

const TONGUE = [[0.5, 0], [0.62, 0.3], [0.9, 0.62], [0.95, 0.85], [0.75, 1], [0.25, 1], [0.05, 0.85], [0.12, 0.6], [0.4, 0.32]];

function tongue(ctx, x, base, w, h) {
  poly(ctx, shape(TONGUE, x, base - h, w, h), "armor", 1, { line: true });
  poly(ctx, shape(TONGUE, x + w * 0.2, base - h * 0.72, w * 0.6, h * 0.7), "a2", 2, { line: false });
  poly(ctx, shape(TONGUE, x + w * 0.35, base - h * 0.4, w * 0.3, h * 0.38), "y3", 2, { line: false });
}

define({
  id: "plasmaBarrier",
  box: [-6, -54, 30, 0],
  anim: true,
  draw(ctx, state, t) {
    if (state === 0) glow(ctx, 12, -22, 30, "a1", 0.45);
    if (state === 0) {
      for (const row of [0, 1]) {
        const base = row ? -22 : 0;
        for (let i = 0; i < 3; i++) {
          const f = Math.sin(t * 9 + i * 2.1 + row * 1.3) * 0.5 + Math.sin(t * 15.7 + i) * 0.5;
          const h = (row ? 25 : 22) * (0.85 + f * 0.15);
          tongue(ctx, 1 + i * 7.3 - 0.5, base, 8, h);
        }
      }
    } else if (!simple()) {
      for (const [x, w] of [[2, 6], [10, 5], [17, 6]]) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = pal().hole;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, -0.8, w, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    box(ctx, -1, -2.5, 26, 2.5, "steel", 1);
    for (let x = 2; x < 24; x += 4) flat(ctx, x, -2, 2, 1.2, state === 0 ? "y3" : "m0");
  }
});

define({
  id: "codeLock",
  box: [-2, -52, 24, 0],
  draw(ctx, state) {
    box(ctx, 0, -50, 22, 28, "rust", 1);
    flat(ctx, 0, -50, 22, 1.5, "r3");
    flat(ctx, 3, -47, 16, 6, state ? "screenOff" : "hole", "mLine");
    if (state) {
      flat(ctx, 5, -45, 6, 2, "screen");
      disc(ctx, 15.5, -44, 1, "screen");
    } else for (let i = 0; i < 4; i++) flat(ctx, 4.5 + i * 3.5, -44.5, 2, 1, "neon");
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      box(ctx, 4 + c * 5, -39 + r * 4, 4, 3, "steel", r === 3 && c === 2 ? 3 : 2);
    }
    const led = state ? "screen" : "neon";
    glow(ctx, 19, -24.5, 4, led, 0.6);
    disc(ctx, 19, -24.5, 1, led, "mLine");
    if (!simple()) rivets(ctx, 0, -23.5, 22, 7, "r3");
  }
});

const TANK = { x: 0, w: 96, roof: -124, top: -100, base: -28 };

function tank(ctx) {
  const { x, w, roof, top, base } = TANK;
  for (const lx of [4, 28, 56, 80]) poly(ctx, [[x + lx, base], [x + lx + 14, base], [x + lx + 16, 0], [x + lx - 2, 0]], "concrete", 1);
  box(ctx, x, top, w, base - top, "concrete", 2, { vertical: true });
  for (let y = top + 3; y < base - 2; y += simple() ? 8 : 5) {
    flat(ctx, x + 1, y, w - 2, 1.4, "k3");
    flat(ctx, x + 1, y + 2.6, w - 2, 1.2, "k0");
  }
  box(ctx, x + 14, top, 8, base - top, "concrete", 0, { vertical: true });
  for (const y of [top, base - 4]) box(ctx, x - 1, y, w + 2, 4, "concrete", 1);
  poly(ctx, [[x - 2, top], [x + w / 2, roof], [x + w + 2, top]], "steel", 2, { dir: [1, 0] });
  poly(ctx, [[x + w / 2 - 6, roof + 4], [x + w / 2, roof], [x + w / 2 + 6, roof + 4]], "m3", 2, { line: false });
  const t = window.ENV.P.text;
  t(ctx, "ACID", x + 54, top + 32, 15, "y1");
}

const OUT = { x: -40, w: 14, y: -84, valve: -34 };

function outlet(ctx, state) {
  const { x, w, y, valve } = OUT;
  pipeH(ctx, x + w, y, -x - w + 2, w, "concrete", 1);
  cylV(ctx, x, y, w, w, "concrete", 2);
  collarH(ctx, -8, y, w, "concrete");
  if (state === 0) {
    pipeV(ctx, x, y + w, w, valve - 4 - y - w, "concrete");
    pipeV(ctx, x, valve + 6, w, -valve - 10, "concrete");
    for (const yy of [valve - 4, valve + 6]) flat(ctx, x + 2, yy - 0.5, w - 4, 1, "hole");
  } else {
    pipeV(ctx, x, y + w, w, -y - w - 4, "concrete");
    box(ctx, x - 1.5, valve - 5, w + 3, 11, "steel", 2, { vertical: true });
    handwheel(ctx, x + w / 2, valve, 5.5);
  }
  cylV(ctx, x - 1, -5, w + 2, 3, "concrete", 1);
}

define({
  id: "acidTank",
  box: [-44, -128, 100, 30],
  anim: true,
  draw(ctx, state, t) {
    outlet(ctx, state);
    tank(ctx);
    const mx = OUT.x + 3, mw = OUT.w - 6;
    if (state === 2) {
      glow(ctx, OUT.x + OUT.w / 2, 4, 16, "acid", 0.35);
      stream(ctx, mx, -2, 30, mw, t, "acid", "acidDark");
    }
    if (state === 3) {
      flat(ctx, mx, -2, mw, 2, "acidDark");
      if (!simple()) for (const [dx, h] of [[1, 5], [4, 3]]) flat(ctx, mx + dx, -2, 1.2, h, "acid");
      flat(ctx, mx - 2, -0.8, mw + 4, 0.8, "acidDark");
    }
  }
});

const BEAM = { len: 168, h: 14, clampA: 62, clampB: 106, hub: -30, top: -100 };

function chain(ctx, x, y0, y1, t) {
  const step = 4, off = ((t * 8) % (step * 2));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 4, y0, 8, y1 - y0);
  ctx.clip();
  for (let y = y1 + off, i = 0; y > y0 - step * 2; y -= step, i++) {
    if (i % 2) flat(ctx, x - 0.6, y - step - 0.5, 1.2, step + 1, "c1", "mLine");
    else {
      ctx.beginPath();
      ctx.roundRect(x - 1.6, y - step - 0.5, 3.2, step + 1, 1.5);
      stroke(ctx, "c1", 1.6);
    }
  }
  ctx.restore();
}

function beam(ctx, snapped) {
  const { len, h, clampA, clampB, hub } = BEAM, mid = (clampA + clampB) / 2;
  cable(ctx, [[mid, hub], [clampA + 2, 0]], "c1", 1);
  if (snapped) cable(ctx, [[mid, hub], [mid + 9, hub + 9], [mid + 11, hub + 14]], "c1", 1);
  else cable(ctx, [[mid, hub], [clampB + 2, 0]], "c1", 1);
  cylV(ctx, mid - 1, hub, 2, -hub, "chrome", 2);
  disc(ctx, mid, hub, 2.2, "c2", "mLine");
  box(ctx, 0, 3, len, h - 6, "green", 0);
  if (!simple()) rivets(ctx, 0, h / 2, len, 8, "g2");
  for (const y of [0, h - 3]) box(ctx, 0, y, len, 3, "chrome", 1);
  for (const cx of [clampA, clampB]) box(ctx, cx, -1, 4.5, h + 2, "armor", 0, { vertical: true });
  box(ctx, len - 2, -0.5, 3, h + 1, "chrome", 2, { vertical: true });
  box(ctx, -1, -0.5, 3, h + 1, "chrome", 2, { vertical: true });
}

define({
  id: "crane",
  box: [-8, -100, 176, 30],
  anim: true,
  draw(ctx, state, t, size = {}) {
    const { clampA, clampB, hub } = BEAM, mid = (clampA + clampB) / 2;
    const ang = state === 0 ? 0.12 : state === 2 ? 0.035 * Math.sin(t * 1.6) : 0;
    chain(ctx, mid, size.top ?? BEAM.top, hub, state === 2 ? t : 0);
    ctx.save();
    ctx.translate(mid, hub);
    ctx.rotate(ang);
    ctx.translate(-mid, -hub);
    beam(ctx, state === 0);
    ctx.restore();
  }
});

function tube(ctx, x, y, h) {
  flat(ctx, x, y, 3, h, "plasma", "mLine");
  flat(ctx, x + 0.6, y, 0.8, h, "plasmaCore");
  flat(ctx, x + 2.2, y, 0.8, h, "water");
}

define({
  id: "cardDoor",
  box: [-24, -76, 28, 0],
  draw(ctx, state) {
    greenPanel(ctx, -22, -52, 18, (x, y, n) => boltIcon(ctx, x, y, n));
    box(ctx, -2, -76, 28, 4, "steel", 2);
    flat(ctx, 0, -72, 24, 72, "hole");
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -72, 24, 72);
    ctx.clip();
    const dy = state ? -64 : 0;
    box(ctx, 0, -72 + dy, 24, 72, "steel", 2, { vertical: true });
    for (let y = -66; y < -8; y += 14) flat(ctx, 1, y + dy, 22, 1, "m0");
    hazard(ctx, 0, -8 + dy, 24, 8, 3);
    ctx.restore();
    if (state) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      flat(ctx, 3, -3, 18, 3, "m1");
      ctx.restore();
    }
    for (const x of [-3.5, 24.5]) box(ctx, x, -72, 3, 72, "steel", 1, { vertical: true });
    tube(ctx, 4, -72, 64);
    tube(ctx, 17, -72, 64);
    for (const y of [-56, -28]) for (const x of [4, 17]) box(ctx, x - 1, y, 5, 3, "chrome", 1);
    flat(ctx, -2, -72, 2, 72, "m0");
  }
});

const LIFT = { w: 50, top: -104, travel: 72, rail: 18 };

function shaft(ctx, { w = LIFT.w, top = LIFT.top } = {}) {
  const rack = w / 2, railA = rack - 14, railB = rack + 14;
  for (const x of [railA, railB]) box(ctx, x - 1.5, top, 3, -top + 6, "concrete", 1, { vertical: true });
  box(ctx, rack - 2, top, 4, -top + 6, "concrete", 0, { vertical: true });
  for (let y = top + 2; y < 6; y += simple() ? 6 : 3.5) flat(ctx, rack - 3, y, 6, simple() ? 2 : 1.2, "k2");
}

function platform(ctx, py, w = LIFT.w) {
  const { rail } = LIFT;
  const rack = w / 2;
  poly(ctx, [[rack - 8, py + 7], [rack + 8, py + 7], [rack + 5, py + 13], [rack - 5, py + 13]], "steel", 1);
  if (!simple()) disc(ctx, rack, py + 9.5, 2, "c1", "mLine");
  hazard(ctx, 0, py + 3, w, 4, 3);
  box(ctx, 0, py, w, 3, "concrete", 2);
  for (const x of [1, w - 3]) box(ctx, x, py - rail, 2, rail, "concrete", 3, { vertical: true });
  box(ctx, 1, py - rail - 1, w - 2, 2, "concrete", 3);
  box(ctx, 1, py - rail / 2, w - 2, 1.5, "concrete", 2);
}

function liftAt(ctx, state, t, { w = LIFT.w, top = LIFT.top, py } = {}) {
  const { travel } = LIFT;
  const k = (t * 0.35) % 1;
  const y = py ?? (state === 1 ? -k * travel : state === 2 ? -(1 - k) * travel : 0);
  shaft(ctx, { w, top });
  platform(ctx, y, w);
}

define({
  id: "lift",
  box: [-4, -106, 54, 20],
  anim: true,
  draw(ctx, state, t, size) {
    liftAt(ctx, state, t, size);
  }
});

function screenNoise(ctx, x, y, w, h, t) {
  flat(ctx, x, y, w, h, "glass");
  if (simple()) return flat(ctx, x + 1, y + h / 2 - 0.5, w - 2, 1, "c1");
  const f = Math.floor(t * 14), n = 2;
  for (let i = 0; i < w / n; i++) for (let j = 0; j < h / n; j++) {
    const v = hash(i + j * 31, f);
    if (v > 0.55) flat(ctx, x + i * n, y + j * n, n, n, v > 0.85 ? "c3" : "c0");
  }
}

function controlBox(ctx, x, damaged, t) {
  box(ctx, x + 10, -32, 4, 32, "rust", 1, { vertical: true });
  box(ctx, x + 6, -2, 12, 2, "rust", 1);
  box(ctx, x, -44, 24, 13, "rust", 0);
  flat(ctx, x, -44, 24, 1.2, "r3");
  if (damaged) {
    screenNoise(ctx, x + 3, -41.5, 18, 8, t);
    cable(ctx, [[x + 15, -41], [x + 13, -38], [x + 16, -36], [x + 14, -34]], "c3", 0.5, "c3");
    cable(ctx, [[x + 20, -31], [x + 22, -26], [x + 21, -22]], "a1", 0.8);
    if (Math.floor(t * 6) % 5 === 0) glow(ctx, x + 21, -22, 4, "y3", 0.9);
    return;
  }
  flat(ctx, x + 3, -41.5, 18, 8, "hole", "mLine");
  poly(ctx, [[x + 7.5, -40.5], [x + 11, -34.5], [x + 4, -34.5]], "a1", 2);
  if (!simple()) for (const y of [-40, -37.5, -35]) flat(ctx, x + 12.5, y, 7, 1, "y1");
}

define({
  id: "liftPanel",
  box: [-2, -46, 26, 0],
  anim: true,
  draw(ctx, state, t) {
    controlBox(ctx, 0, state === 1, t);
  }
});

define({
  id: "damagedLift",
  box: [-4, -106, 84, 20],
  anim: true,
  draw(ctx, state, t) {
    liftAt(ctx, state === 2 ? 1 : 0, t);
    controlBox(ctx, 58, state === 0, t);
  }
});
})();
