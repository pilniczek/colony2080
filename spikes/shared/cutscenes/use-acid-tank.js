(() => {
const { kit } = window.CUTSCENES;
const { drawTap, drawGrid } = window.CUTSCENES.takeTapHandle.art;
const { STAND, LINE_W, asset } = kit;
const { buildSide } = window.XBOT;
const ENV = window.ENV;
const { P, PALETTE } = ENV;
const CFG = window.C28_CONFIG.cutscenes.useAcidTank;
const { width: W, height: H, close: CLOSE, melt: MELT } = CFG.stage;
const palette = { ...CFG.palette };
const at = kit.track(CFG.tracks);
const TAP = asset("tapHandle");
const GUARD = asset("acidGuard");
const TAP_CENTER = { x: 6, y: -5, r: 5.6 };
const GUARD_TOP = 41;
const SHADOW_PALETTE = kit.recolor("#000000");
const channel = (hex, i) => parseInt(hex.slice(i, i + 2), 16);
const mixHex = (a, b, k) => "#" + [1, 3, 5].map(i => Math.round(channel(a, i) * (1 - k) + channel(b, i) * k).toString(16).padStart(2, "0")).join("");
const LIFTED = Object.fromEntries(Object.entries(PALETTE).map(([name, hex]) => [name, mixHex(hex, palette.lift, 0.22)]));
const RIM_PALETTE = kit.recolor(palette.rim);
const RIMS = [[-5, -6]];
const rotted = k => Object.fromEntries(Object.entries(LIFTED).map(([name, hex]) => [name, mixHex(hex, palette.rot, k)]));

let lineW = LINE_W;
const valveBack = kit.stillLayer();

let armRig = null;
const robotArm = () => armRig || (armRig = buildSide({}));

function pour(c, mid, top, bottom, w, t) {
  if (w <= 0) return;
  kit.pool(c, mid, (top + bottom) / 2, w * 2.2, (bottom - top) / 2, palette.acidBright, 0.5);
  c.save();
  c.globalAlpha = 0.85;
  P.flat(c, mid - w / 2, top, w, bottom - top, palette.acidBright);
  c.restore();
  c.save();
  c.beginPath();
  c.rect(mid - w / 2, top, w, bottom - top);
  c.clip();
  const step = 40;
  const off = (t * 760) % step;
  for (let i = 0, y = top - step + off; y < bottom; y += step, i++) {
    const k = (i % 3) / 3;
    P.flat(c, mid - w / 2 + w * (0.15 + k * 0.5), y, w * 0.12, 22, "c3");
    P.flat(c, mid - w / 2 + w * (0.7 - k * 0.4), y + 16, w * 0.1, 16, "acidDark");
  }
  c.restore();
}

function closeArm(c, side, target) {
  const arm = robotArm();
  const k = CLOSE.arm;
  const shoulder = side < 0 ? [-260, 1120] : [W + 260, 1120];
  const { s } = kit.armChain(arm, "hand", ["arm", "fore"]);
  const m = new DOMMatrix().translate(shoulder[0], shoulder[1]).rotate(side * 58).scale(-side * k, k).translate(-s[0], -s[1]);
  const pose = { ...STAND, ...kit.reach(arm, "hand", ["arm", "fore"], kit.toModel(m, ...target), -side) };
  kit.placeRobot(c, arm, m, { pose, hooks: {}, lineW });
}

function valveBackdrop(cc) {
  const { x, y } = CLOSE;
  cc.fillStyle = palette.back;
  cc.fillRect(0, 0, W, H);
  P.shape(cc, [[-10, -10], [W + 10, -10], [W + 10, 70], [-10, 140]], palette.under);
  P.poly(cc, [[560, -20], [1040, -20], [905, 250], [695, 250]], "concrete", 2, { dir: [1, 0] });
  P.poly(cc, [[600, 70], [1000, 70], [985, 104], [615, 104]], "concrete", 1, { dir: [1, 0] });
  P.box(cc, 700, 240, 200, 80, "steel", 2, { vertical: true });
  P.cylV(cc, x - 24, 320, 48, y - 320, "chrome", 1);
  P.box(cc, x - 34, y - 22, 68, 28, "steel", 1, { vertical: true });
  P.beam(cc, [-60, 780], [W + 60, 650], 80, "rust");
  P.beam(cc, [-60, 900], [W + 60, 830], 90, "rust");
  P.poly(cc, [[1290, 560], [1450, 520], [1500, H + 10], [1270, H + 10]], "rust", 1);
}

function drawValve(c, t) {
  lineW = LINE_W;
  const { x, y, rx, tilt } = CLOSE;
  const bring = at("bring", t);
  const scale = rx / TAP_CENTER.r * (1 + bring * 0.7);
  const cy = y + bring * 420;
  const spin = at("spin", t);
  valveBack(c, [], b => kit.layer(b, t, valveBackdrop, lineW));
  c.save();
  c.globalAlpha = 0.6;
  drawTap(c, t, x, cy - 16 * (1 + bring), scale, tilt, spin, SHADOW_PALETTE, lineW);
  c.restore();
  drawTap(c, t, x, cy, scale, tilt, spin, PALETTE, lineW);
  if (at("flash", t) >= 0.5) P.shape(c, [[x - 110, 250], [x + 110, 250], [x + 70, y + 8], [x - 70, y + 8]], palette.flash);
  kit.layer(c, t, cc => pour(cc, x, y + 6, H + 20, 44 * at("pour", t), t), lineW);
  const r = scale * TAP_CENTER.r - 12;
  for (const side of [-1, 1]) {
    const a = (side < 0 ? 180 : 0) + spin * 0.6;
    closeArm(c, side, [x + r * Math.cos(a * kit.RAD), cy + r * tilt * Math.sin(a * kit.RAD) + 10]);
  }
  drawGrid(c, at("grid", t));
}

function drawMeltRoom(c) {
  const { floorY } = MELT;
  c.fillStyle = palette.wall;
  c.fillRect(-200, -200, W + 400, floorY + 200);
  for (let x = -40; x < W + 200; x += 210) P.line(c, [[x, -200], [x, floorY]], palette.seam, 6, "butt");
  P.line(c, [[-200, 330], [W + 200, 330]], palette.seam, 5, "butt");
  c.fillStyle = palette.floor;
  c.fillRect(-200, floorY, W + 400, H);
  P.line(c, [[-200, floorY + 2], [W + 200, floorY + 2]], palette.floorEdge, 5, "butt");
}

function drawOutlet(c, t) {
  const { pipeX, pipeW, outlet } = MELT;
  P.cylV(c, pipeX - pipeW / 2, -60, pipeW, outlet + 60, "concrete", 2);
  P.box(c, pipeX - 56, outlet - 120, 112, 70, "steel", 2, { vertical: true });
  P.cylV(c, pipeX - pipeW / 2 - 6, outlet - 14, pipeW + 12, 18, "concrete", 1);
  c.save();
  c.translate(pipeX + 60, outlet - 85);
  c.scale(5, 5);
  c.translate(-TAP_CENTER.x, -TAP_CENTER.y);
  TAP.draw(c, 0, t);
  c.restore();
}

function drawFumes(c, x, top, k, t) {
  if (k <= 0) return;
  c.save();
  for (let i = 0; i < 7; i++) {
    const rise = (t * 0.6 + i / 7) % 1;
    c.globalAlpha = 0.6 * (1 - rise) * k;
    c.fillStyle = PALETTE.fume;
    c.beginPath();
    c.ellipse(x - 150 + i * 50 + Math.sin(i * 2.3 + t) * 20, top - rise * 260, 30 + rise * 60, 20 + rise * 40, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function drawDrips(c, x, top, bottom, k, t) {
  if (k <= 0) return;
  for (let i = 0; i < 9; i++) {
    const dx = -170 + i * 42 + Math.sin(i * 3.1) * 12;
    const fall = (t * 0.9 + i * 0.37) % 1;
    const y = top + 10 + fall * (bottom - top - 10) * k;
    P.line(c, [[x + dx, top + 6], [x + dx + 2, y]], palette.acidBright, 8);
    P.disc(c, x + dx + 2, y + 4, 8, palette.acidBright);
  }
}

function drawMelt(c, t) {
  const { x, guardX, floorY, guardScale, pipeX, outlet } = MELT;
  const z = at("camZ", t);
  c.translate(W / 2, H / 2);
  c.scale(z, z);
  c.translate(-at("camX", t), -at("camY", t));
  lineW = LINE_W;
  const sizzle = at("sizzle", t);
  const sag = at("sag", t);
  const wreck = at("wreck", t);
  const height = 1 - 0.45 * sag;
  const top = floorY - GUARD_TOP * guardScale * height;
  kit.layer(c, t, cc => {
    drawMeltRoom(cc);
    drawOutlet(cc, t);
    const puddle = at("puddle", t);
    kit.pool(cc, x, floorY + 6, 420 * puddle + 1, 40 * puddle + 1, PALETTE.acid, 0.6);
    cc.fillStyle = PALETTE.acidDark;
    cc.beginPath();
    cc.ellipse(x, floorY + 8, 300 * puddle + 1, 16 * puddle + 1, 0, 0, Math.PI * 2);
    cc.fill();
    kit.pool(cc, x, top + 80, 560, 440, palette.acidBright, 0.28 * at("pour", t));
  }, lineW);
  if (wreck > 0) {
    c.save();
    c.globalAlpha = wreck;
    c.translate(guardX, floorY);
    c.scale(guardScale, guardScale);
    ENV.draw(c, GUARD, { state: 1, t, lines: lineW, palette: LIFTED });
    c.restore();
  }
  if (wreck < 1) {
    c.save();
    c.globalAlpha = 1 - wreck;
    c.translate(guardX, floorY);
    c.rotate(sag * 2 * kit.RAD);
    c.scale(guardScale * (1 + 0.12 * sag), guardScale * height);
    for (const [dx, dy] of RIMS) {
      c.save();
      c.translate(dx / guardScale, dy / guardScale);
      ENV.draw(c, GUARD, { state: 0, t, lines: 0, palette: RIM_PALETTE });
      c.restore();
    }
    ENV.draw(c, GUARD, { state: 0, t, lines: lineW, palette: rotted(0.6 * sizzle) });
    c.restore();
  }
  const contact = wreck >= 1 ? floorY - 40 : top + 30;
  kit.layer(c, t, cc => {
    pour(cc, pipeX, outlet, contact, 40 * at("pour", t), t);
    drawDrips(cc, x, top + 20, floorY, sizzle * (1 - wreck), t);
    drawFumes(cc, x, top, sizzle, t);
  }, lineW);
}

function render(c, w, h, t) {
  c.save();
  kit.fitStage(c, w, h, W, H);
  if (at("shot", t) === "A") drawValve(c, t);
  else drawMelt(c, t);
  c.restore();
}

window.CUTSCENES.useAcidTank = {
  name: CFG.title,
  camera: CFG.camera,
  duration: CFG.duration,
  palette,
  render,
  ref: kit.filmRef("useAcidTank", CFG.duration)
};
})();
