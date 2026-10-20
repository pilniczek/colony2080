(() => {
const { kit } = window.CUTSCENES;
const { buildFront, render: renderBot, FOOT_Y, AX, GAME_LINE } = window.XBOT;
const CFG = window.C28_CONFIG.cutscenes.pickEBlaster;
const S = CFG.stage;
const W = S.width, H = S.height, FLOOR = S.floorY, K = S.robotScale;
const palette = { ...CFG.palette };
const at = (name, t) => kit.sample(CFG.tracks, name, t);
const LINE_W = 1.4;
const FULL_LINE_PX = 500;
const root = buildFront({});

function random(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = random(S.seed);
const blots = [];
for (let i = 0; i < S.blots; i++) blots.push({ x: -300 + pick() * 2200, y: 100 + pick() * 520, rx: 30 + pick() * 120, ry: 12 + pick() * 40, dark: pick() < 0.5 });

let ctx;

function lineFor() {
  const m = ctx.getTransform();
  const robotPx = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * K * FOOT_Y;
  return Math.min(LINE_W, Math.max(GAME_LINE, LINE_W * robotPx / FULL_LINE_PX));
}

function drawWall() {
  ctx.fillStyle = palette.wallDark;
  ctx.fillRect(-1000, -1000, 3600, 3000);
  ctx.fillStyle = palette.wall;
  ctx.fillRect(-1000, S.lightY + 30, 3600, S.railY[0] - S.lightY - 30);
  for (const dark of [false, true]) {
    ctx.beginPath();
    for (const b of blots) {
      if (b.dark !== dark) continue;
      ctx.moveTo(b.x + b.rx, b.y);
      ctx.ellipse(b.x, b.y, b.rx, b.ry, 0, 0, Math.PI * 2);
    }
    ctx.fillStyle = dark ? palette.blotDark : palette.blot;
    ctx.fill();
  }
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = palette.lightGlow;
  ctx.beginPath();
  ctx.moveTo(-400, S.lightY);
  ctx.lineTo(2000, S.lightY);
  ctx.lineTo(2300, S.lightY + 260);
  ctx.lineTo(-700, S.lightY + 260);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.light;
  ctx.fillRect(-400, S.lightY - 12, 2400, 24);
  const [r0, r1] = S.railY;
  ctx.fillStyle = palette.rail;
  ctx.fillRect(-1000, r0, 3600, r1 - r0);
  ctx.fillStyle = palette.railLight;
  ctx.fillRect(-1000, r0, 3600, 8);
  ctx.fillRect(-1000, r0 + (r1 - r0) / 2, 3600, 6);
  ctx.fillStyle = palette.floor;
  ctx.fillRect(-1000, r1, 3600, 2000);
}

function blasterHook(c) {
  c.save();
  c.scale(-1, 1);
  window.EBLASTER.hook(c, { lineW: LINE_W });
  c.restore();
}

function drawRobot(t) {
  const grow = at("foreGrow", t);
  const pose = {
    body: { dy: at("bob", t) },
    armL: at("armL", t),
    armR: at("armR", t),
    foreR: { rot: at("foreR", t), sx: grow, sy: grow }
  };
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = palette.shadow;
  ctx.beginPath();
  ctx.ellipse(S.robotX, FLOOR, 260 * K, 22 * K, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.translate(S.robotX, FLOOR);
  ctx.scale(K, K);
  ctx.translate(-AX, -FOOT_Y);
  renderBot(ctx, root, { pose, hooks: { handR: blasterHook }, lineW: lineFor() });
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
  drawWall();
  drawRobot(t);
  ctx.restore();
}

window.CUTSCENES.pickEBlaster = { name: CFG.title, camera: CFG.camera, duration: CFG.duration, palette, render, ref: kit.filmRef("pickEBlaster", CFG.duration) };
})();
