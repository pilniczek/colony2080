(() => {
const { kit } = window.CUTSCENES;
const { asset } = kit;
const { XBOT, ENV } = window;
const CFG = window.C28_CONFIG.cutscenes.repairLift;
const W = CFG.stage.width, H = CFG.stage.height;
const RB = CFG.robot;
const LINE = 1.4;
const MIN_LINE = 0.6;
const BACKLIT = { brightness: 0.42, saturate: 0.8 };
const BOX = [[-60, 510], [1012, 426], [1028, 432], [1072, 960], [-60, 960]];
const BOX_SIDE = [[1012, 426], [1028, 432], [1072, 960], [1046, 960]];
const LAMP = [962, 600, 18, 26];
const palette = { ...CFG.palette };
const at = kit.track(CFG.tracks);

const CLOUDS = kit.bank(7, 26, -150, 1900, -40, 620, 160, 340, 18, 34);
let rig = null;
let ctx;

function sky() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, palette.sky0);
  g.addColorStop(0.35, palette.sky1);
  g.addColorStop(0.62, palette.sky2);
  g.addColorStop(0.82, palette.glow);
  g.addColorStop(1, palette.sun);
  ctx.fillStyle = g;
  ctx.fillRect(-200, -200, W + 400, H + 400);
  const [sx, sy, sr] = CFG.stage.sun;
  const sun = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
  sun.addColorStop(0, palette.sun);
  sun.addColorStop(0.3, palette.glow);
  sun.addColorStop(1, palette.glow + "00");
  ctx.fillStyle = sun;
  ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  for (const [x, y, w, h] of CLOUDS) kit.cloud(ctx, x, y, w, h, Math.min(1, 0.3 + y / 700), palette.cloudLit, palette.cloud);
}

function controllerHook(t, lineW) {
  const k = RB.controllerScale;
  return (c) => {
    c.save();
    c.rotate((at("wrist", t) * Math.PI) / 180);
    c.scale(k, k);
    c.translate(-8, 5);
    ENV.draw(c, asset("controller"), { state: 0, lines: lineW });
    c.restore();
  };
}

function drawRobot(t, lineW) {
  rig ??= XBOT.buildFront({});
  const pose = {
    body: { dy: at("crouch", t) },
    head: at("head", t),
    armR: at("armR", t),
    foreR: at("foreR", t),
    armL: at("armL", t),
    foreL: at("foreL", t)
  };
  const pal = { ...XBOT.shade(XBOT.PALETTE, BACKLIT), visor: XBOT.PALETTE.visor };
  ctx.save();
  ctx.translate(RB.x, RB.y);
  ctx.scale(RB.scale, RB.scale);
  ctx.translate(-XBOT.AX, 0);
  XBOT.render(ctx, rig, { pal, pose, hooks: { handR: controllerHook(t, lineW) }, lineW });
  ctx.restore();
}

function drawBox(t, lineW) {
  kit.poly(ctx, BOX, palette.box);
  kit.poly(ctx, BOX_SIDE, palette.boxSide);
  ctx.strokeStyle = palette.boxRim;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(BOX[0][0], BOX[0][1]);
  ctx.lineTo(BOX[1][0], BOX[1][1]);
  ctx.lineTo(BOX[2][0], BOX[2][1]);
  ctx.stroke();
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = palette.boxGlow;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(BOX[2][0], BOX[2][1]);
  ctx.lineTo(BOX[3][0], BOX[3][1]);
  ctx.stroke();
  ctx.globalAlpha = 1;
  const lit = at("lit", t) >= 0.5;
  const [lx, ly, lw, lh] = LAMP;
  const on = lit || Math.floor(t * 9) % 3 === 0;
  ctx.fillStyle = on ? (lit ? palette.lampOn : palette.lampOff) : palette.boxSide;
  ctx.fillRect(lx, ly, lw, lh);
  if (on) {
    ctx.globalAlpha = lit ? 0.35 : 0.2;
    kit.oval(ctx, lx + lw / 2, ly + lh / 2, lw * 1.6, lh * 1.1, lit ? palette.lampOn : palette.lampOff);
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = palette.boxRim;
  ctx.lineWidth = lineW;
  ctx.strokeRect(lx, ly, lw, lh);
}

function render(c, w, h, t) {
  ctx = c;
  ctx.save();
  const s = kit.fitStage(ctx, w, h, W, H);
  const z = at("camZ", t);
  kit.camera(ctx, W, H, at("camX", t), at("camY", t), z);
  const lineW = Math.max(MIN_LINE, LINE * s * z);
  sky();
  drawRobot(t, lineW);
  drawBox(t, lineW);
  ctx.restore();
}

window.CUTSCENES.repairLift = {
  name: CFG.title,
  camera: CFG.camera,
  duration: CFG.duration,
  palette,
  render,
  ref: kit.filmRef("repairLift", CFG.duration)
};
})();
