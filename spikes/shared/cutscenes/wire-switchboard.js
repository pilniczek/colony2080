(() => {
const { kit } = window.CUTSCENES;
const { buildSide, render: renderBot, SIDE_AX, FOOT_Y, GAME_LINE } = window.XBOT;
const CFG = window.C28_CONFIG.cutscenes.wireSwitchboard;
const METRO = window.C28_CONFIG.cutscenes.crowbarDoor.palette;
const ENV = window.ENV;
const W = CFG.stage.width, H = CFG.stage.height, FLOOR = CFG.stage.floorY, PLATFORM = CFG.stage.platformY;
const PILLAR_X = CFG.stage.pillarX;
const K = CFG.robot.scale, ENV_K = CFG.robot.envScale;
const PILLAR_S = K * ENV_K;
const LUNGE = CFG.lunge;
const palette = { ...METRO, ...CFG.palette };
const at = (name, t) => kit.sample(CFG.tracks, name, t);
const asset = id => ENV.ASSETS.find(a => a.id === id);
const STAND = { hipNear: 0, kneeNear: 2, ankleNear: -1.4, hipFar: 0, kneeFar: 2, ankleFar: -1.4 };
const LINE_W = 1.4;
const FULL_LINE_PX = 500;
let lineW = LINE_W;
let side = null;
let ctx;

function lineFor(c) {
  const m = c.getTransform();
  const robotPx = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * K * FOOT_Y;
  return Math.min(LINE_W, Math.max(GAME_LINE, LINE_W * robotPx / FULL_LINE_PX));
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

function drawTunnel() {
  rect(-400, -400, 2400, 1600, palette.tunnel);
  rect(-400, 120, 2400, 600, palette.wall);
  rect(-400, -400, 2400, 520, palette.ceiling);
  ctx.globalAlpha = 0.07;
  for (let x = 100; x < 1900; x += 420) poly([[x - 18, 118], [x + 18, 118], [x + 130, 720], [x - 130, 720]], palette.lampCone);
  ctx.globalAlpha = 1;
  for (let x = 100; x < 1900; x += 420) rect(x - 22, 104, 44, 12, palette.lamp);
}

function drawWagon() {
  poly([[-400, 170], [590, 170], [620, 200], [620, 700], [-400, 700]], palette.wagon);
  rect(-400, 630, 1020, 70, palette.wagonShade);
  rect(-400, 550, 1020, 26, palette.stripe);
  poly([[-400, 170], [590, 170], [620, 200], [-400, 200]], palette.wagonShade);
  rect(600, 200, 20, 500, palette.wagonShade);
  for (const x of [-250, 20, 330]) {
    rect(x, 270, 200, 190, palette.window);
    ctx.globalAlpha = 0.6;
    poly([[x + 24, 270], [x + 90, 270], [x + 14, 460], [x, 460]], palette.windowGlint);
    ctx.globalAlpha = 1;
  }
}

function drawPlatform() {
  rect(-400, PLATFORM, 2400, 600, palette.platform);
  rect(-400, PLATFORM + 7, 2400, 12, palette.safety);
  for (let x = -400; x < 2000; x += 160) rect(x, PLATFORM + 19, 4, 600, palette.platformLine);
  rect(-400, PLATFORM + 95, 2400, 3, palette.platformLine);
}

function drawPillar(t) {
  const base = FLOOR - 30;
  rect(PILLAR_X, -400, 26 * PILLAR_S, base - 70 * PILLAR_S + 400, palette.pillarTop);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = palette.shadow;
  ctx.beginPath();
  ctx.ellipse(PILLAR_X + 13 * PILLAR_S, base + 4, 16 * PILLAR_S, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.translate(PILLAR_X, base);
  ctx.scale(PILLAR_S, PILLAR_S);
  ENV.draw(ctx, asset("switchboard"), { state: at("lit", t) >= 0.5 ? 1 : 0, lines: lineW });
  ctx.restore();
}

function drawRobot(t) {
  side ??= buildSide({ farLimbs: true });
  const k = at("lunge", t);
  const pose = { arm: at("arm", t), fore: at("fore", t), armFar: at("armFar", t), foreFar: at("foreFar", t), head: at("head", t) };
  for (const name in STAND) pose[name] = STAND[name] + (LUNGE[name] - STAND[name]) * k;
  const wires = asset("wires");
  const hooks = {
    hand: at("wire", t) >= 0.5 ? c => {
      c.save();
      c.scale(ENV_K, ENV_K);
      c.translate(-9, 6);
      ENV.draw(c, wires, { lines: lineW });
      c.restore();
    } : null
  };
  const x = at("x", t);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = palette.shadow;
  ctx.beginPath();
  ctx.ellipse(x, FLOOR + 4, 150, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.translate(x, FLOOR);
  ctx.rotate(-at("lean", t) * Math.PI / 180);
  ctx.scale(-K, K);
  ctx.translate(-SIDE_AX, -FOOT_Y + CFG.robot.lungeDrop * k);
  renderBot(ctx, side, { pose, hooks, lineW });
  ctx.restore();
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
  const z = at("camZ", t);
  ctx.translate(W / 2 - at("camX", t) * z, H / 2 - at("camY", t) * z);
  ctx.scale(z, z);
  lineW = lineFor(ctx);
  drawTunnel();
  drawWagon();
  drawPlatform();
  drawPillar(t);
  drawRobot(t);
  ctx.restore();
}

window.CUTSCENES.wireSwitchboard = { name: CFG.title, camera: CFG.camera, duration: CFG.duration, palette, render, ref: kit.filmRef("wireSwitchboard", CFG.duration) };
})();
