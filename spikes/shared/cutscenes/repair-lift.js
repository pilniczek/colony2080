(() => {
const { kit } = window.CUTSCENES;
const { asset } = kit;
const { buildHand, render: renderBot, locate } = window.XBOT;
const ENV = window.ENV;
const CFG = window.C28_CONFIG.cutscenes.repairLift;
const W = CFG.stage.width, H = CFG.stage.height, FLOOR = CFG.stage.floor;
const PANEL = CFG.panel, S = PANEL.scale;
const HAND = CFG.hand;
const SEAT = [PANEL.x + PANEL.seat[0] * S, PANEL.y + PANEL.seat[1] * S];
const SCREEN = [PANEL.x + PANEL.screen[0] * S, PANEL.y + PANEL.screen[1] * S];
const FORE_LEN = 190;
const palette = { ...CFG.palette };
const at = kit.track(CFG.tracks);

const CLOUDS = kit.bank(7, 26, -150, 1900, -40, 620, 160, 340, 18, 34);
let lineW = kit.LINE_W;
let hands = null;
let ctx;

function sky() {
  kit.rowFill(ctx, c => {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, palette.sky0);
    g.addColorStop(0.35, palette.sky1);
    g.addColorStop(0.62, palette.sky2);
    g.addColorStop(0.82, palette.glow);
    g.addColorStop(1, palette.sun);
    c.fillStyle = g;
    c.fillRect(-200, -200, W + 400, H + 400);
  });
  const [sx, sy, sr] = CFG.stage.sun;
  const sun = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
  sun.addColorStop(0, palette.sun);
  sun.addColorStop(0.3, palette.glow);
  sun.addColorStop(1, palette.glow + "00");
  ctx.fillStyle = sun;
  ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  for (const [x, y, w, h] of CLOUDS) kit.cloud(ctx, x, y, w, h, Math.min(1, 0.3 + y / 700), palette.cloudLit, palette.cloud);
}

function drawRoof() {
  kit.rect(ctx, -200, FLOOR, W + 400, H - FLOOR + 200, palette.roof);
  kit.stroke(ctx, [[-200, FLOOR], [W + 200, FLOOR]], palette.roofRim, 3);
}

function drawPanel(t) {
  const lit = at("lit", t) >= 0.5;
  ctx.save();
  ctx.translate(PANEL.x, PANEL.y);
  ctx.scale(S, S);
  ENV.draw(ctx, asset("liftPanel"), { state: lit ? 0 : 1, t, lines: lineW });
  ctx.restore();
  const glow = at("glow", t);
  if (glow <= 0) return;
  const [x, y] = SCREEN;
  const r = 9 * S;
  const halo = ctx.createRadialGradient(x, y, 0, x, y, r);
  halo.addColorStop(0, palette.lampOn);
  halo.addColorStop(1, palette.lampOn + "00");
  ctx.globalAlpha = 0.5 * glow;
  ctx.fillStyle = halo;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

function controllerAt(t) {
  if (at("placed", t) >= 0.5) return SEAT;
  return [SEAT[0] + at("carryX", t), SEAT[1] + at("carryY", t)];
}

function drawController(t) {
  const [x, y] = controllerAt(t);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(S, S);
  ENV.draw(ctx, asset("controller"), { state: 0, lines: lineW });
  ctx.restore();
}

function drawHand(t) {
  hands ??= {
    pinch: buildHand({ view: "thumb", pose: "pinch", forearm: true }),
    reach: buildHand({ view: "thumb", pose: "reach", forearm: true })
  };
  const placed = at("placed", t) >= 0.5;
  const grip = locate(hands.pinch, "item").transformPoint(new DOMPoint(...HAND.pinchAt));
  const [cx, cy] = controllerAt(t);
  const base = ctx.getTransform();
  const held = c => {
    c.save();
    c.setTransform(base);
    drawController(t);
    c.restore();
  };
  ctx.save();
  ctx.translate(cx + HAND.grip[0] * S + at("handX", t), cy + HAND.grip[1] * S + at("handY", t));
  ctx.rotate((at("rot", t) + HAND.turn) * Math.PI / 180);
  ctx.scale(HAND.scale, HAND.scale);
  ctx.translate(-grip.x, -grip.y);
  if (placed) {
    ctx.translate(...HAND.palm);
    ctx.rotate(-Math.PI / 2);
    ctx.translate(-HAND.palm[0], -HAND.palm[1]);
  }
  renderBot(ctx, placed ? hands.reach : hands.pinch, { hooks: { item: placed ? null : held }, lineW });
  ctx.restore();
}

function render(c, w, h, t) {
  ctx = c;
  ctx.save();
  kit.fitStage(ctx, w, h, W, H);
  kit.camera(ctx, W, H, at("camX", t), at("camY", t), at("camZ", t));
  lineW = kit.lineFor(ctx, HAND.scale, FORE_LEN);
  sky();
  drawRoof();
  drawPanel(t);
  if (at("placed", t) >= 0.5 && at("lit", t) < 0.5) drawController(t);
  drawHand(t);
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
