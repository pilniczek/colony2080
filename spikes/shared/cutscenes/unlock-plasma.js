(() => {
const { kit } = window.CUTSCENES;
const { buildSide, render: renderBot, GAME_LINE } = window.XBOT;
const CFG = window.C28_CONFIG.cutscenes.unlockPlasma;
const ENV = window.ENV;
const W = CFG.stage.width, H = CFG.stage.height, GRID = CFG.stage.grid;
const LOCK = CFG.lock, S = LOCK.scale;
const HAND = CFG.hand;
const DECODER = [LOCK.x + (LOCK.decoderAt[0] - 11) * S, LOCK.y + (LOCK.decoderAt[1] + 36) * S];
const HAND_HOOK = [312, 438];
const FORE_LEN = 190;
const palette = { ...CFG.palette };
const at = (name, t) => kit.sample(CFG.tracks, name, t);
const asset = id => ENV.ASSETS.find(a => a.id === id);
const LINE_W = 1.4;
const FULL_LINE_PX = 500;
let lineW = LINE_W;
let forearm = null;
let speckles = null;
let ctx;

function lineFor(c) {
  const m = c.getTransform();
  const handPx = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * HAND.scale * FORE_LEN;
  return Math.min(LINE_W, Math.max(GAME_LINE, LINE_W * handPx / FULL_LINE_PX));
}

function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function poly(pts, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

function random(seed) {
  let a = seed * 2654435761 >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function findGroup(node, name) {
  if (node.k !== "g") return null;
  if (node.name === name) return node;
  for (const kid of node.kids) {
    const hit = findGroup(kid, name);
    if (hit) return hit;
  }
  return null;
}

function drawWall() {
  rect(-200, -200, 2000, 1300, palette.wall);
  speckles ??= (() => {
    const rnd = random(2080);
    return Array.from({ length: CFG.stage.speckles }, () => [-100 + rnd() * 1800, -100 + rnd() * 1100, 6 + rnd() * 14, 4 + rnd() * 8, rnd() < 0.5]);
  })();
  for (const [x, y, w, h, dark] of speckles) rect(x, y, w, h, dark ? palette.speckDark : palette.speckLight);
  const x0 = LOCK.x - 11 * S, y0 = LOCK.y - 14 * S;
  ctx.globalAlpha = 0.8;
  poly([[x0 + 22 * S, y0 + 2 * S], [x0 + 34 * S, y0 + 6 * S], [x0 + 36 * S, y0 + 40 * S], [x0 + 6 * S, y0 + 42 * S], [x0 + 2 * S, y0 + 34 * S], [x0 + 22 * S, y0 + 34 * S]], palette.shadow);
  ctx.globalAlpha = 1;
}

function drawLock(t) {
  ctx.save();
  ctx.translate(LOCK.x - 11 * S, LOCK.y + 36 * S);
  ctx.scale(S, S);
  ENV.draw(ctx, asset("codeLock"), { state: at("open", t) >= 0.5 ? 1 : 0, lines: lineW });
  ctx.restore();
}

function decoderAt(t) {
  if (at("placed", t) >= 0.5) return DECODER;
  return [DECODER[0] + at("carryX", t), DECODER[1] + at("carryY", t)];
}

function drawDecoder(t) {
  const [x, y] = decoderAt(t);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S, S);
  ENV.draw(ctx, asset("decoder"), { lines: lineW });
  const led = at("led", t);
  if (led > 0) {
    const glow = ctx.createRadialGradient(3.5, -6.5, 0, 3.5, -6.5, 5);
    glow.addColorStop(0, at("open", t) >= 0.5 ? ENV.PALETTE.screen : ENV.PALETTE.neonGlow);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.globalAlpha = 0.8 * led;
    ctx.fillStyle = glow;
    ctx.fillRect(-1.5, -11.5, 10, 10);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawHand(t) {
  forearm ??= { k: "g", m: null, kids: findGroup(buildSide(), "fore").kids };
  const [dx, dy] = decoderAt(t);
  const x = dx + HAND.grip[0] + at("handX", t);
  const y = dy + HAND.grip[1] + at("handY", t);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(at("rot", t) * Math.PI / 180);
  ctx.scale(HAND.scale, HAND.scale);
  ctx.translate(-HAND_HOOK[0], -HAND_HOOK[1]);
  renderBot(ctx, forearm, { lineW });
  ctx.restore();
}

function drawHud(t) {
  const grid = at("grid", t);
  if (grid > 0) {
    ctx.globalAlpha = 0.75 * grid;
    for (let x = 40; x < W; x += GRID) rect(x, 0, 2, H, palette.grid);
    for (let y = 30; y < H; y += GRID) rect(0, y, W, 2, palette.grid);
    ctx.globalAlpha = 1;
  }
  rect(56, 40, 300, 170, palette.monitorEdge);
  rect(62, 46, 288, 158, palette.monitor);
  rect(130, 80, 150, 100, palette.monitorInk);
  rect(136, 86, 138, 88, palette.monitor);
  ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 5));
  rect(206, 100, 56, 60, at("open", t) >= 0.5 ? ENV.PALETTE.screen : palette.monitorGlow);
  ctx.globalAlpha = 1;
  const tick = Math.floor(t * 8);
  for (let row = 0; row < 14; row++) {
    const rnd = random(row * 31 + tick);
    for (let col = 0; col < 4; col++) if (rnd() < 0.6) rect(60 + col * 34, 260 + row * 22, 10 + rnd() * 18, 8, palette.readout);
  }
  for (let col = 0; col < 6; col++) {
    const rnd = random(col * 17 + tick);
    if (rnd() < 0.7) rect(1300 + col * 40, 50, 14 + rnd() * 20, 10, palette.readout);
  }
}

function render(c, w, h, t) {
  ctx = c;
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  const s = Math.min(w / W, h / H);
  ctx.translate((w - W * s) / 2, (h - H * s) / 2);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();
  ctx.save();
  const z = at("camZ", t);
  ctx.translate(W / 2 - at("camX", t) * z, H / 2 - at("camY", t) * z);
  ctx.scale(z, z);
  lineW = lineFor(ctx);
  drawWall();
  drawLock(t);
  drawDecoder(t);
  drawHand(t);
  ctx.restore();
  drawHud(t);
  ctx.restore();
}

window.CUTSCENES.unlockPlasma = { name: CFG.title, camera: CFG.camera, duration: CFG.duration, palette, render, ref: kit.filmRef("unlockPlasma", CFG.duration) };
})();
