(() => {
const { kit } = window.CUTSCENES;
const { buildSide, render: renderBot, locate } = window.XBOT;
const { random, LINE_W } = kit;
const FW = kit.FILM.w, FH = kit.FILM.h;
const SHOULDER = [300, 150];
const NEAR = 18;
const FAR = 46;
const GLYPH = [3, 5];

const mul = (m, n) => ({
  a: m.a * n.a + m.c * n.b, b: m.b * n.a + m.d * n.b,
  c: m.a * n.c + m.c * n.d, d: m.b * n.c + m.d * n.d,
  e: m.a * n.e + m.c * n.f + m.e, f: m.b * n.e + m.d * n.f + m.f
});

function invert({ a, b, c, d, e, f }) {
  const k = a * d - b * c;
  return { a: d / k, b: -b / k, c: -c / k, d: a / k, e: (c * f - d * e) / k, f: (b * e - a * f) / k };
}

const move = (x, y) => ({ a: 1, b: 0, c: 0, d: 1, e: x, f: y });
const turn = deg => {
  const r = deg * Math.PI / 180;
  return { a: Math.cos(r), b: Math.sin(r), c: -Math.sin(r), d: Math.cos(r), e: 0, f: 0 };
};
const grow = (x, y) => ({ a: x, b: 0, c: 0, d: y, e: 0, f: 0 });
const plain = ({ a, b, c, d, e, f }) => ({ a, b, c, d, e, f });

function pickupFilm(id, CFG) {
  const S = CFG.stage;
  const palette = { ...CFG.palette };
  const at = kit.track(CFG.tracks);
  const item = kit.asset(S.item);
  const flashPalette = kit.recolor(palette.flash);
  const scanPalette = Object.fromEntries(Object.keys(window.ENV.PALETTE).map(k => [k, k.endsWith("Line") ? palette.panelLine : palette.panelItem]));
  const root = buildSide({ propBehindArm: true });
  const blades = [];
  const pick = random(S.seed);
  const yaw0 = S.yaw * Math.PI / 180;
  const zNear = S.height * S.focal / (FH - S.horizon), zFar = S.height * S.focal / -S.horizon;
  for (let i = 0; i < S.blades; i++) {
    const z = zNear * 0.95 + pick() * (zFar - zNear * 0.95), x = (pick() - 0.5) * 2.4 * z * FW / 2 / S.focal;
    blades.push({ u: x * Math.cos(yaw0) + z * Math.sin(yaw0), v: -x * Math.sin(yaw0) + z * Math.cos(yaw0), h: 0.12 + pick() * 0.3, lean: (pick() - 0.5) * 0.9, tone: Math.floor(pick() * 3) });
  }
  const glyphs = [];
  for (let row = 0; row < S.glyphRows; row++) {
    const count = 3 + Math.floor(pick() * 6);
    for (let col = 0; col < count; col++) {
      const dots = [];
      for (let i = 0; i < GLYPH[0] * GLYPH[1]; i++) if (pick() < 0.45) dots.push(i);
      glyphs.push({ row, col, dots });
    }
  }
  const ground = kit.stillLayer();
  const grid = kit.stillLayer();
  let ctx;

  function camera(t) {
    const yaw = (S.yaw + at("yaw", t)) * Math.PI / 180;
    return { cos: Math.cos(yaw), sin: Math.sin(yaw), pan: at("pan", t) };
  }

  function project(cam, u, v) {
    const x = u * cam.cos - v * cam.sin + cam.pan;
    const z = u * cam.sin + v * cam.cos;
    return [FW / 2 + x * S.focal / z, S.horizon + S.height * S.focal / z, z];
  }

  function span(base, slope, lo, hi) {
    const a = (NEAR - base) / slope, b = (FAR - base) / slope;
    return [Math.max(lo, Math.min(a, b)), Math.min(hi, Math.max(a, b))];
  }

  function tileLines(cam, across, along, shift) {
    for (let k = -30; k <= 30; k++) {
      const [v0, v1] = span((k + shift) * cam.sin, cam.cos, -10, 60);
      if (v0 >= v1) continue;
      const a = project(cam, k + shift, v0), b = project(cam, k + shift, v1);
      across.moveTo(a[0], a[1]); across.lineTo(b[0], b[1]);
    }
    for (let k = -10; k <= 60; k++) {
      const [u0, u1] = span((k + shift) * cam.cos, cam.sin, -30, 30);
      if (u0 >= u1) continue;
      const a = project(cam, u0, k + shift), b = project(cam, u1, k + shift);
      along.moveTo(a[0], a[1]); along.lineTo(b[0], b[1]);
    }
  }

  function drawTiles(c, cam) {
    c.fillStyle = palette.tile;
    c.fillRect(0, 0, FW, FH);
    const strokes = [["tileShade", S.inset, S.edge], ["tileLight", -S.inset, S.edge], ["grout", 0, S.grout]];
    for (const [tone, shift, width] of strokes) {
      const across = new Path2D(), along = new Path2D();
      tileLines(cam, across, along, shift);
      c.strokeStyle = palette[tone];
      c.lineWidth = width;
      c.stroke(across);
      c.stroke(along);
    }
  }

  function drawGrass(c, cam) {
    c.fillStyle = palette.soil;
    c.fillRect(0, 0, FW, FH);
    const tris = [];
    for (const b of blades) {
      const [x, y, z] = project(cam, b.u, b.v);
      if (z < NEAR || x < -40 || x > FW + 40 || y < -40 || y > FH + 80) continue;
      const k = S.focal / z;
      const h = b.h * k, w = 0.035 * k;
      tris.push([b.tone, x - w, x + w, y, x + b.lean * h, y - h]);
    }
    ["grass0", "grass1", "grass2"].forEach((tone, i) => {
      c.fillStyle = palette[tone];
      for (const [k, x0, x1, y, tx, ty] of tris) {
        if (k !== i) continue;
        c.beginPath();
        c.moveTo(x0, y); c.lineTo(x1, y); c.lineTo(tx, ty); c.closePath();
        c.fill();
      }
    });
  }

  function drawGround(t) {
    const cam = camera(t);
    ground(ctx, [cam.cos, cam.sin, cam.pan], c => (S.ground === "tiles" ? drawTiles : drawGrass)(c, cam));
  }

  function robotAt(t) {
    const k = at("robotK", t);
    return { k, m: mul(mul(move(at("robotX", t), at("robotY", t)), grow(-k, k)), move(-SHOULDER[0], -SHOULDER[1])), pose: { arm: at("arm", t), fore: at("fore", t) } };
  }

  const handAt = robot => mul(robot.m, plain(locate(root, "hand", robot.pose)));

  function itemMatrix(t) {
    const grip = handAt(robotAt(S.gripAt));
    const [x0, y0, x1, y1] = item.box;
    const ground = mul(mul(mul(move(grip.e + S.itemOffset[0], grip.f + S.itemOffset[1]), turn(S.itemTilt)), grow(S.itemFlip ? -S.itemScale : S.itemScale, S.itemScale)), move(-(x0 + x1) / 2, -(y0 + y1) / 2));
    if (t < S.gripAt) return ground;
    return mul(mul(handAt(robotAt(t)), invert(grip)), ground);
  }

  function drawItem(t) {
    const m = itemMatrix(t);
    const lift = at("shadow", t);
    if (lift > 0) {
      const grip = itemMatrix(S.gripAt);
      kit.shadow(ctx, grip.e + S.shadow[0], grip.f + S.shadow[1], S.shadow[2], S.shadow[3], 0.45 * lift, palette.shadow);
    }
    ctx.save();
    ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
    window.ENV.draw(ctx, item, { state: S.itemState, t, lines: LINE_W, palette: at("flash", t) >= 0.5 ? flashPalette : window.ENV.PALETTE });
    ctx.restore();
  }

  function drawRobot(t) {
    const robot = robotAt(t);
    ctx.save();
    ctx.transform(robot.m.a, robot.m.b, robot.m.c, robot.m.d, robot.m.e, robot.m.f);
    renderBot(ctx, root, { pose: robot.pose, lineW: kit.lineFor(ctx, robot.k) });
    ctx.restore();
  }

  function drawGrid(t) {
    const wipe = at("grid", t);
    if (wipe <= 0) return;
    const [x0, y0, x1, y1] = S.gridBox;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + 2 * (x1 - x0) * wipe, y0);
    ctx.lineTo(x0, y0 + 2 * (y1 - y0) * wipe);
    ctx.closePath();
    ctx.clip();
    grid(ctx, [], c => {
      c.beginPath();
      for (let x = x0; x <= x1 + 0.5; x += S.gridCell) { c.moveTo(x, y0); c.lineTo(x, y1); }
      for (let y = y0; y <= y1 + 0.5; y += S.gridCell) { c.moveTo(x0, y); c.lineTo(x1, y); }
      c.strokeStyle = palette.scan;
      c.lineWidth = 3;
      c.stroke();
    });
    ctx.restore();
  }

  function drawPanel(t) {
    const [x, y, w, h] = S.panel;
    ctx.fillStyle = palette.panel;
    ctx.fillRect(x, y, w, h);
    ctx.beginPath();
    for (let ly = y + 14; ly < y + h; ly += 22) { ctx.moveTo(x, ly); ctx.lineTo(x + w, ly); }
    for (let lx = x + 20; lx < x + w; lx += 40) { ctx.moveTo(lx, y); ctx.lineTo(lx, y + h); }
    ctx.strokeStyle = palette.panelLine;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    ctx.globalAlpha = 1;
    const [ix0, iy0, ix1, iy1] = item.box;
    const k = Math.min(w * 0.6 / (ix1 - ix0), h * 0.6 / (iy1 - iy0));
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(at("panelSpin", t) * Math.PI / 180);
    ctx.scale(k, k);
    ctx.translate(-(ix0 + ix1) / 2, -(iy0 + iy1) / 2);
    window.ENV.draw(ctx, item, { state: S.itemState, t, lines: 1, palette: scanPalette });
    ctx.restore();
    const scan = y + h * ((t * S.panelScan) % 1);
    ctx.fillStyle = palette.panelLine;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(x, scan, w, 6);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = palette.panelLine;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
  }

  function drawWave(t) {
    const [x, y, w, h] = S.wave;
    const n = 48, frame = Math.floor(t * S.waveRate);
    const noise = random(frame * 97 + 13);
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const env = Math.sin(Math.PI * i / n) * (0.4 + 0.6 * Math.abs(Math.sin(i * 0.7 + frame)));
      const py = y + h / 2 + (noise() - 0.5) * h * env;
      if (i) ctx.lineTo(x + w * i / n, py); else ctx.moveTo(x, py);
    }
    ctx.strokeStyle = palette.scan;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function drawGlyphs(t) {
    const rows = Math.floor(at("glyphs", t));
    if (rows <= 0) return;
    const [x0, y0, dot, rowH, colW] = S.glyphBox;
    const p = new Path2D();
    for (const g of glyphs) {
      if (g.row >= rows) continue;
      const gx = x0 + g.col * colW, gy = y0 + g.row * rowH;
      for (const i of g.dots) p.rect(gx + (i % GLYPH[0]) * dot, gy + Math.floor(i / GLYPH[0]) * dot, dot * 0.8, dot * 0.8);
    }
    ctx.fillStyle = palette.scan;
    ctx.fill(p);
  }

  function render(c, w, h, t) {
    ctx = c;
    ctx.save();
    kit.fitStage(ctx, w, h, FW, FH);
    drawGround(t);
    drawItem(t);
    drawRobot(t);
    drawGrid(t);
    drawGlyphs(t);
    drawPanel(t);
    drawWave(t);
    ctx.restore();
  }

  return { name: CFG.title, camera: CFG.camera, duration: CFG.duration, palette, render, ref: kit.filmRef(id, CFG.duration) };
}

window.CUTSCENES.pickupFilm = pickupFilm;
window.CUTSCENES.pickController = pickupFilm("pickController", window.C28_CONFIG.cutscenes.pickController);
})();
