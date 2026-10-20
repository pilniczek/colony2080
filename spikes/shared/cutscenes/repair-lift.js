(() => {
const { kit } = window.CUTSCENES;
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
const at = (name, t) => kit.sample(CFG.tracks, name, t);
const asset = (id) => ENV.ASSETS.find((a) => a.id === id);

function cloudBank(seed, n, top, depth) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const list = [];
  for (let i = 0; i < n; i++) list.push([rnd() * 1900 - 150, top + rnd() * depth, 160 + rnd() * 340, 18 + rnd() * 34]);
  return list;
}

const CLOUDS = cloudBank(7, 26, -40, 620);
let rig = null;
let ctx;

function poly(pts, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

function oval(x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

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
  for (const [x, y, w, h] of CLOUDS) {
    ctx.globalAlpha = Math.min(1, 0.3 + y / 700);
    oval(x + w * 0.08, y + h * 0.35, w * 0.5, h * 0.6, palette.cloudLit);
    ctx.globalAlpha = 1;
    oval(x, y, w * 0.5, h * 0.5, palette.cloud);
    oval(x - w * 0.22, y - h * 0.3, w * 0.28, h * 0.45, palette.cloud);
  }
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
  poly(BOX, palette.box);
  poly(BOX_SIDE, palette.boxSide);
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
    oval(lx + lw / 2, ly + lh / 2, lw * 1.6, lh * 1.1, lit ? palette.lampOn : palette.lampOff);
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = palette.boxRim;
  ctx.lineWidth = lineW;
  ctx.strokeRect(lx, ly, lw, lh);
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
