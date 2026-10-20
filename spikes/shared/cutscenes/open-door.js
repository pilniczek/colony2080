(() => {
const { kit } = window.CUTSCENES;
const { XBOT } = window;
const CFG = window.C28_CONFIG.cutscenes.openDoor;
const W = CFG.stage.width, H = CFG.stage.height, HORIZON = CFG.stage.horizon;
const RB = CFG.robot;
const LINE = 1.4;
const MIN_LINE = 0.6;
const DUSK = { brightness: 0.82, saturate: 0.9 };
const EDGE = 16;
const palette = { ...CFG.palette };
const at = kit.track(CFG.tracks);

const CLOUDS = kit.bank(11, 24, -150, 1900, -40, HORIZON - 60, 180, 360, 16, 30);
const STREAKS = kit.bank(5, 9, 0, 1600, HORIZON + 20, 200, 120, 300, 2, 4);
let rig = null;
let ctx;

function sky() {
  kit.rowFill(ctx, c => {
    const g = c.createLinearGradient(0, 0, 0, HORIZON);
    g.addColorStop(0, palette.sky0);
    g.addColorStop(0.4, palette.sky1);
    g.addColorStop(0.75, palette.sky2);
    g.addColorStop(0.92, palette.glow);
    g.addColorStop(1, palette.sun);
    c.fillStyle = g;
    c.fillRect(-200, -200, W + 400, HORIZON + 200);
    const ground = c.createLinearGradient(0, HORIZON, 0, H);
    ground.addColorStop(0, palette.glow);
    ground.addColorStop(0.35, palette.ground);
    ground.addColorStop(1, palette.groundFar);
    c.fillStyle = ground;
    c.fillRect(-200, HORIZON, W + 400, H - HORIZON + 200);
  });
  const [sx, sy, sr] = CFG.stage.sun;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(1, 0.32);
  const sun = ctx.createRadialGradient(0, 0, 0, 0, 0, sr);
  sun.addColorStop(0, palette.sun);
  sun.addColorStop(0.35, palette.glow);
  sun.addColorStop(1, palette.glow + "00");
  ctx.fillStyle = sun;
  ctx.fillRect(-sr, -sr, sr * 2, sr * 2);
  ctx.restore();
  for (const [x, y, w, h] of STREAKS) {
    ctx.globalAlpha = 0.45;
    kit.oval(ctx, x, y, w, h, palette.sun);
  }
  for (const [x, y, w, h] of CLOUDS) kit.cloud(ctx, x, y, w, h, Math.min(1, 0.25 + y / HORIZON), palette.cloudLit, palette.cloud);
}

function drawRobot(t, lineW) {
  rig ??= XBOT.buildFront({});
  const pose = {
    body: { dy: at("breathe", t) },
    head: at("head", t),
    armL: at("armL", t),
    foreL: at("foreL", t),
    armR: at("armR", t),
    foreR: at("foreR", t)
  };
  ctx.save();
  ctx.translate(RB.x, RB.y);
  ctx.scale(RB.scale, RB.scale);
  ctx.translate(-XBOT.AX, 0);
  XBOT.render(ctx, rig, { pal: XBOT.shade(XBOT.PALETTE, DUSK), pose, lineW });
  ctx.restore();
}

function drawDoor(t) {
  const x = at("door", t);
  if (x >= W) return;
  ctx.fillStyle = palette.door;
  ctx.fillRect(x, -200, W + 400 - x, H + 400);
  ctx.fillStyle = palette.doorEdge;
  ctx.fillRect(x, -200, EDGE, H + 400);
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = palette.doorTube;
  ctx.fillRect(x + 6, -200, 3, H + 400);
  ctx.fillStyle = palette.glow;
  ctx.fillRect(x, -200, 2, H + 400);
  ctx.globalAlpha = 1;
}

function render(c, w, h, t) {
  ctx = c;
  ctx.save();
  const s = kit.fitStage(ctx, w, h, W, H);
  const z = at("camZ", t);
  kit.camera(ctx, W, H, W / 2, H / 2, z);
  const lineW = Math.max(MIN_LINE, LINE * s * z);
  sky();
  drawRobot(t, lineW);
  drawDoor(t);
  ctx.restore();
}

window.CUTSCENES.openDoor = {
  name: CFG.title,
  camera: CFG.camera,
  duration: CFG.duration,
  palette,
  render,
  ref: kit.filmRef("openDoor", CFG.duration)
};
})();
