(() => {
const { kit } = window.CUTSCENES;
const { buildSide, render: renderBot, locate, SIDE_AX, FOOT_Y, GAME_LINE } = window.XBOT;
const ENV = window.ENV;
const { P, PALETTE } = ENV;
const CFG = window.C28_CONFIG.cutscenes.takeTapHandle;
const { width: W, height: H, floorY: FLOOR, robot: RB, pipe: PIPE, wheel: WHEEL, close: CLOSE } = CFG.stage;
const palette = { ...CFG.palette };
const at = (name, t) => kit.sample(CFG.tracks, name, t);
const ORIGIN = new DOMPoint(0, 0);
const RAD = Math.PI / 180;
const LINE_W = 1.4;
const FULL_LINE_PX = 500;
const STAND = { hipNear: 0, kneeNear: 2, ankleNear: -1.4, hipFar: 0, kneeFar: 2, ankleFar: -1.4 };
const TAP = ENV.ASSETS.find(a => a.id === "tapHandle");
const TAP_CENTER = { x: 6, y: -5, r: 5.6 };
const STREAM_W = 46;
const recolor = color => Object.fromEntries(Object.keys(PALETTE).map(k => [k, color]));
const FLASH_PALETTE = recolor(palette.flash);
const SHADOW_PALETTE = recolor("#000000");

function gravelBed(seed, count, y0, y1, size) {
  const random = P.rng(seed);
  return Array.from({ length: count }, () => {
    const y = y0 + random() * (y1 - y0);
    const depth = (y - y0) / (y1 - y0);
    const w = size * (0.4 + depth) * (0.6 + random());
    return [random() * (W + 200) - 100, y, w, w * 0.3, random() < 0.35];
  });
}

const FAR_GRAVEL = gravelBed(28, 520, 560, 900, 14);
const NEAR_GRAVEL = gravelBed(29, 420, -20, 920, 34);

let lineW = LINE_W;

function lineFor(c, k) {
  const m = c.getTransform();
  const robotPx = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k * FOOT_Y;
  return Math.min(LINE_W, Math.max(GAME_LINE, LINE_W * robotPx / FULL_LINE_PX));
}

function layer(c, t, draw, pal = PALETTE) {
  ENV.draw(c, { draw: cc => draw(cc) }, { t, lines: lineW, palette: pal });
}

function center(a, b, c) {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  const q = p => p[0] * p[0] + p[1] * p[1];
  return [
    (q(a) * (b[1] - c[1]) + q(b) * (c[1] - a[1]) + q(c) * (a[1] - b[1])) / d,
    (q(a) * (c[0] - b[0]) + q(b) * (a[0] - c[0]) + q(c) * (b[0] - a[0])) / d
  ];
}

const chains = new Map();

function armChain(root, hook, keys) {
  const key = `${keys[0]} ${hook}`;
  const known = chains.get(root)?.[key];
  if (known) return known;
  const hand = (a, b) => {
    const p = locate(root, hook, { ...STAND, [keys[0]]: a, [keys[1]]: b }).transformPoint(ORIGIN);
    return [p.x, p.y];
  };
  const h = hand(0, 0);
  const chain = { h, s: center(h, hand(60, 0), hand(-60, 0)), e: center(h, hand(0, 60), hand(0, -60)) };
  chains.set(root, { ...chains.get(root), [key]: chain });
  return chain;
}

const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

function reach(root, hook, keys, target, bend) {
  const { h, s, e } = armChain(root, hook, keys);
  const l1 = Math.hypot(e[0] - s[0], e[1] - s[1]);
  const l2 = Math.hypot(h[0] - e[0], h[1] - e[1]);
  const d = Math.min(l1 + l2 - 1, Math.max(Math.abs(l1 - l2) + 1, Math.hypot(target[0] - s[0], target[1] - s[1])));
  const rest = Math.atan2(e[1] - s[1], e[0] - s[0]);
  const bent = Math.atan2(h[1] - e[1], h[0] - e[0]) - rest;
  const upper = Math.atan2(target[1] - s[1], target[0] - s[0]) + bend * Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const elbow = [s[0] + l1 * Math.cos(upper), s[1] + l1 * Math.sin(upper)];
  const lower = Math.atan2(target[1] - elbow[1], target[0] - elbow[0]);
  return { [keys[0]]: wrap(upper - rest) / RAD, [keys[1]]: wrap(lower - upper - bent) / RAD };
}

function toModel(m, x, y) {
  const p = m.inverse().transformPoint(new DOMPoint(x, y));
  return [p.x, p.y];
}

function placeRobot(c, root, m, pose) {
  c.save();
  c.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  renderBot(c, root, { pose, hooks: {}, lineW });
  c.restore();
}

let rigs = null;
const robots = () => rigs || (rigs = { full: buildSide({ farLimbs: true }), arm: buildSide({}) });

function fitStage(c, w, h) {
  c.fillStyle = "#000";
  c.fillRect(0, 0, w, h);
  const s = Math.min(w / W, h / H);
  c.translate((w - W * s) / 2, (h - H * s) / 2);
  c.scale(s, s);
  c.beginPath();
  c.rect(0, 0, W, H);
  c.clip();
}

function gravel(c, bed, lit) {
  for (const [x, y, w, h, bright] of bed) {
    c.fillStyle = bright ? lit : palette.gravel;
    c.fillRect(x, y, w, h);
  }
}

function pool(c, x, y, rx, ry, color, alpha) {
  c.save();
  c.translate(x, y);
  c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.globalAlpha = alpha;
  c.fillStyle = g;
  c.fillRect(-rx, -rx, 2 * rx, 2 * rx);
  c.restore();
}

function drawRoom(c) {
  c.fillStyle = palette.back;
  c.fillRect(-200, -200, W + 400, H + 400);
  c.fillStyle = palette.floor;
  c.fillRect(-200, 560, W + 400, H);
  pool(c, 860, 760, 760, 230, palette.floorLit, 0.9);
  gravel(c, FAR_GRAVEL, palette.gravelLit);
  P.shape(c, [[-200, -200], [360, -40], [360, 610], [-200, 920]], palette.wall);
  P.shape(c, [[250, -70], [360, -40], [360, 610], [250, 660]], palette.wallLit);
  for (const x of [40, 150, 250]) {
    const k = (x + 200) / 560;
    P.line(c, [[x, -200 + 160 * k], [x, 920 - 310 * k]], palette.seam, 4, "butt");
    for (let i = 1; i < 7; i++) P.disc(c, x + 12, -200 + 160 * k + i * (1120 - 470 * k) / 7, 4, palette.seam);
  }
  P.shape(c, [[-200, 520], [360, 430], [360, 455], [-200, 560]], palette.stain);
}

function drawPipe(c, t) {
  const { x, w, sleeveTop, bottom } = PIPE;
  const mid = x + w / 2;
  pool(c, mid + 50, PIPE.floor + 6, 170, 22, "#000000", 0.7);
  P.cylV(c, x, -120, w, sleeveTop + 130, "concrete", 2);
  P.cylV(c, x - 12, sleeveTop, w + 24, bottom - sleeveTop, "concrete", 1);
  for (const y of [sleeveTop - 6, bottom - 26]) P.box(c, x - 18, y, w + 36, 16, "concrete", 2, { vertical: true });
  P.flat(c, x + 18, 120, 8, 150, "k3");
  P.flat(c, x + 6, sleeveTop + 40, 10, bottom - sleeveTop - 80, "k2");
  c.fillStyle = PALETTE.hole;
  c.beginPath();
  c.ellipse(mid, bottom - 10, w / 2 - 14, 9, 0, 0, Math.PI * 2);
  c.fill();
  drawStream(c, mid, bottom - 8, at("flow", t), t);
}

function drawStream(c, mid, top, flow, t) {
  if (flow <= 0) {
    const fall = (t * 1.4) % 1;
    P.disc(c, mid, top + fall * (PIPE.floor - top), 5, palette.water);
    return;
  }
  const sw = STREAM_W * flow;
  c.save();
  c.globalAlpha = 0.7;
  P.flat(c, mid - sw / 2, top, sw, PIPE.floor - top, palette.water);
  c.restore();
  c.save();
  c.beginPath();
  c.rect(mid - sw / 2, top, sw, PIPE.floor - top);
  c.clip();
  const step = 46;
  const off = (t * 700) % step;
  for (let i = 0, y = top - step + off; y < PIPE.floor; y += step, i++) {
    const k = (i % 3) / 3;
    P.flat(c, mid - sw / 2 + sw * (0.15 + k * 0.5), y, 5, 24, "c3");
    P.flat(c, mid - sw / 2 + sw * (0.7 - k * 0.4), y + 18, 4, 18, palette.waterDark);
  }
  c.restore();
  c.save();
  c.globalAlpha = 0.75;
  c.fillStyle = palette.water;
  c.beginPath();
  c.ellipse(mid, PIPE.floor, sw * 1.4 + 10, 9, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
  for (let i = 0; i < 6; i++) {
    const p = (t * 2.2 + i / 6) % 1;
    const dx = (i % 2 ? 1 : -1) * (14 + p * 50) * flow;
    P.disc(c, mid + dx, PIPE.floor - 4 - 34 * Math.sin(p * Math.PI) * flow, 4, palette.water);
  }
}

function rimPoint(deg, x = WHEEL.x + 16, y = WHEEL.y) {
  return [x + WHEEL.r * WHEEL.depth * Math.sin(deg * RAD), y - WHEEL.r * Math.cos(deg * RAD)];
}

function drawWheel(c, t) {
  const { x, y, r, depth } = WHEEL;
  const cx = x + 16;
  P.box(c, PIPE.x + PIPE.w + 10, y - 10, cx - PIPE.x - PIPE.w - 6, 20, "steel", 2);
  const spin = at("wheel", t);
  for (let k = 0; k < 4; k++) {
    const [ex, ey] = rimPoint(spin + k * 90);
    P.beam(c, [cx, y], [ex, ey], 6, "chrome");
  }
  c.lineWidth = 14;
  c.strokeStyle = PALETTE.mLine;
  c.beginPath();
  c.ellipse(cx, y, r * depth, r, 0, 0, Math.PI * 2);
  c.stroke();
  c.lineWidth = 9;
  c.strokeStyle = PALETTE.c1;
  c.stroke();
  c.lineWidth = 3;
  c.strokeStyle = PALETTE.c3;
  c.beginPath();
  c.ellipse(cx, y, r * depth, r, 0, Math.PI * 1.1, Math.PI * 1.6);
  c.stroke();
  P.disc(c, cx, y, 9, "c0", "mLine");
}

function drawHero(c, t) {
  const { full } = robots();
  const K = RB.scale;
  const m = new DOMMatrix().translate(RB.x, FLOOR).rotate(at("lean", t)).scale(-K, K).translate(-SIDE_AX, -FOOT_Y);
  const pose = { ...STAND, arm: 0, fore: 0, armFar: 0, foreFar: 0 };
  const blend = at("reach", t);
  const grip = at("grip", t);
  const hold = (hook, keys, deg) => {
    const rest = armChain(full, hook, keys).h;
    const rim = toModel(m, ...rimPoint(deg));
    const target = [rest[0] + (rim[0] - rest[0]) * blend, rest[1] + (rim[1] - rest[1]) * blend];
    Object.assign(pose, reach(full, hook, keys, target, 1));
  };
  hold("hand", ["arm", "fore"], grip);
  hold("handFar", ["armFar", "foreFar"], grip + 180);
  pool(c, RB.x - 20, FLOOR + 4, 170, 18, "#000000", 0.6);
  placeRobot(c, full, m, pose);
}

function drawPumpRoom(c, t) {
  const z = at("camZ", t);
  c.translate(W / 2, H / 2);
  c.scale(z, z);
  c.translate(-W / 2, -H / 2);
  lineW = lineFor(c, RB.scale);
  layer(c, t, cc => {
    drawRoom(cc);
    drawPipe(cc, t);
    drawWheel(cc, t);
  });
  drawHero(c, t);
}

function drawTap(c, t, x, y, scale, tilt, spin, pal) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale * tilt);
  c.rotate(spin * RAD);
  c.translate(-TAP_CENTER.x, -TAP_CENTER.y);
  ENV.draw(c, TAP, { t, lines: lineW, palette: pal });
  c.restore();
}

function closeArm(c, side, target, blend) {
  const { arm } = robots();
  const k = CLOSE.arm;
  const shoulder = side < 0 ? [-260, 1120] : [W + 260, 1120];
  const { s } = armChain(arm, "hand", ["arm", "fore"]);
  const m = new DOMMatrix().translate(shoulder[0], shoulder[1]).rotate(side * 58).scale(-side * k, k).translate(-s[0], -s[1]);
  const off = [shoulder[0] - side * 120, shoulder[1] + 200];
  const goal = [off[0] + (target[0] - off[0]) * blend, off[1] + (target[1] - off[1]) * blend];
  const pose = { ...STAND, ...reach(arm, "hand", ["arm", "fore"], toModel(m, ...goal), -side) };
  placeRobot(c, arm, m, pose);
}

function drawGrid(c, g) {
  if (g <= 0) return;
  const x0 = 60, y0 = 50, x1 = W - 60, y1 = H - 50, step = 64;
  const reachY = y0 + (y1 - y0) * g;
  c.save();
  c.globalAlpha = 0.85;
  c.strokeStyle = palette.grid;
  c.lineWidth = 2;
  c.beginPath();
  for (let x = x0; x <= x1; x += step) {
    c.moveTo(x, y0);
    c.lineTo(x, reachY);
  }
  for (let y = y0; y <= reachY; y += step) {
    c.moveTo(x0, y);
    c.lineTo(x1, y);
  }
  c.stroke();
  c.restore();
}

function drawCloseUp(c, t) {
  lineW = LINE_W;
  const { x, y, rx, tilt } = CLOSE;
  const lift = at("lift", t);
  const scale = rx / TAP_CENTER.r * (1 + lift * 0.6);
  const cy = y + lift * 360;
  const squash = tilt * (1 - lift * 0.2);
  const spin = at("spin", t);
  layer(c, t, cc => {
    cc.fillStyle = palette.floor;
    cc.fillRect(0, 0, W, H);
    pool(cc, 820, 520, 900, 520, palette.floorLit, 0.75);
    gravel(cc, NEAR_GRAVEL, palette.gravelLit);
    P.shape(cc, [[1120, -10], [W + 10, -10], [W + 10, 330], [1300, 170]], palette.wall);
    P.poly(cc, [[500, -20], [1100, -20], [920, 400], [680, 400]], "concrete", 2, { dir: [1, 0] });
    P.poly(cc, [[560, 120], [1040, 120], [1024, 160], [576, 160]], "concrete", 1, { dir: [1, 0] });
    P.box(cc, 720, 360, 160, 60, "steel", 2, { vertical: true });
    P.cylV(cc, x - 18, 400, 36, y - 400, "chrome", 1);
    P.box(cc, x - 30, y - 16, 60, 26, "steel", 1, { vertical: true });
  });
  drawTap(c, t, x, cy + 22 * (1 + lift), scale, squash, spin, SHADOW_PALETTE);
  drawTap(c, t, x, cy, scale, squash, spin, at("flash", t) >= 0.5 ? FLASH_PALETTE : PALETTE);
  const hands = at("hands", t);
  if (hands > 0) for (const side of [-1, 1]) closeArm(c, side, [x + side * (scale * TAP_CENTER.r - 10), cy + 10], hands);
  drawGrid(c, at("grid", t));
}

function render(c, w, h, t) {
  c.save();
  fitStage(c, w, h);
  if (at("shot", t) === "A") drawPumpRoom(c, t);
  else drawCloseUp(c, t);
  c.restore();
}

window.CUTSCENES.takeTapHandle = {
  name: CFG.title,
  camera: CFG.camera,
  duration: CFG.duration,
  palette,
  render,
  ref: kit.filmRef("takeTapHandle", CFG.duration)
};
})();
