(() => {
const { kit } = window.CUTSCENES;
const { random, LINE_W } = kit;
const { buildFront, render: renderBot, AX } = window.XBOT;
const CFG = window.C28_CONFIG.cutscenes.pickEBlaster;
const S = CFG.stage;
const W = S.width, H = S.height, FLOOR = S.floorY, K = S.robotScale;
const palette = { ...CFG.palette };
const at = kit.track(CFG.tracks);
const root = buildFront({});

const pick = random(S.seed);
const blots = [];
for (let i = 0; i < S.blots; i++) blots.push({ x: -300 + pick() * 2200, y: 100 + pick() * 520, rx: 30 + pick() * 120, ry: 12 + pick() * 40, dark: pick() < 0.5 });

let ctx;

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
  kit.shadow(ctx, S.robotX, FLOOR, 260 * K, 22 * K, 0.4, palette.shadow);
  ctx.save();
  kit.feet(ctx, S.robotX, FLOOR, K, K, AX);
  renderBot(ctx, root, { pose, hooks: { handR: blasterHook }, lineW: kit.lineFor(ctx, K) });
  ctx.restore();
}

function render(c, w, h, t) {
  ctx = c;
  ctx.save();
  kit.fitStage(ctx, w, h, W, H);
  const z = at("camZ", t);
  kit.camera(ctx, W, H, at("camX", t), at("camY", t), z);
  drawWall();
  drawRobot(t);
  ctx.restore();
}

window.CUTSCENES.pickEBlaster = { name: CFG.title, camera: CFG.camera, duration: CFG.duration, palette, render, ref: kit.filmRef("pickEBlaster", CFG.duration) };
})();
