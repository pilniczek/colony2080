(() => {
const { kit } = window.CUTSCENES;
const { rect, poly, STAND, LINE_W, asset } = kit;
const { buildSide, render: renderBot, SIDE_AX, FOOT_Y } = window.XBOT;
const CFG = window.C28_CONFIG.cutscenes.pullWires;
const ENV = window.ENV;
const W = CFG.stage.width, H = CFG.stage.height, FLOOR = CFG.stage.floorY;
const BRICK = CFG.stage.brick;
const K = CFG.robot.scale, X = CFG.robot.x;
const BOX = CFG.box;
const INSET = 22 * 0.22, INNER = 22 - INSET * 2, PANEL_TOP = -40;
const palette = { ...CFG.palette };
const at = kit.track(CFG.tracks);
let lineW = LINE_W;
const rigs = {};
let ctx;

const random = seed => kit.random(seed * 2654435761 >>> 0);

function drawWall() {
  rect(ctx, -200, -200, 2000, 1400, palette.wall);
  for (let row = 0, y = -200; y < 1200; row++, y += BRICK.h) {
    rect(ctx, -200, y + 3, 2000, 3, palette.brickLight);
    rect(ctx, -200, y, 2000, 3, palette.brickLine);
    for (let x = -200 + (row % 2) * BRICK.w / 2; x < 1800; x += BRICK.w) rect(ctx, x, y, 3, BRICK.h, palette.brickLine);
  }
  const px = CFG.stage.pipeX;
  rect(ctx, px - 30, -200, 60, 1400, palette.pipeDark);
  rect(ctx, px - 24, -200, 48, 1400, palette.pipe);
  rect(ctx, px - 14, -200, 12, 1400, palette.pipeLight);
  for (let y = 40; y < 1200; y += 360) {
    rect(ctx, px - 36, y, 72, 22, palette.pipeDark);
    rect(ctx, px - 32, y + 3, 64, 8, palette.pipe);
  }
}

function drawDoor(angle) {
  const a = angle * Math.PI / 180;
  const x0 = INSET, y0 = PANEL_TOP + INSET;
  const x1 = x0 + INNER * Math.cos(a);
  const spread = INNER * 0.18 * Math.sin(a);
  const pts = [[x0, y0], [x1, y0 - spread], [x1, y0 + INNER + spread], [x0, y0 + INNER]];
  const pal = ENV.PALETTE;
  ctx.lineJoin = "round";
  ctx.lineWidth = lineW / Math.sqrt(Math.abs(ctx.getTransform().a * ctx.getTransform().d));
  ctx.strokeStyle = pal.gLine;
  poly(ctx, pts, Math.cos(a) > 0 ? pal.g2 : palette.doorBack);
  ctx.stroke();
  if (Math.cos(a) > 0.2) {
    const k = Math.cos(a);
    poly(ctx, [[x0 + 1.5 * k, y0 + 1.5], [x1 - 1.5 * k, y0 - spread + 1.5], [x1 - 1.5 * k, y0 + INNER + spread - 1.5], [x0 + 1.5 * k, y0 + INNER - 1.5]], pal.g1);
    ctx.fillStyle = pal.c1;
    ctx.beginPath();
    ctx.arc(x0 + (x1 - x0) * 0.82, y0 + INNER / 2, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBox(t) {
  const s = BOX.scale;
  ctx.save();
  ctx.translate(BOX.x, BOX.y - PANEL_TOP * s);
  ctx.scale(s, s);
  ctx.globalAlpha = 0.35;
  rect(ctx, 1.5, PANEL_TOP + 2.5, 22, 22, palette.shadow);
  ctx.globalAlpha = 1;
  ENV.draw(ctx, asset("wireBox"), { state: at("torn", t) >= 0.5 ? 1 : 0, lines: lineW });
  drawDoor(at("door", t));
  ctx.restore();
}

function boxCenter() {
  return [BOX.x + (INSET + INNER / 2) * BOX.scale, BOX.y + (INSET + INNER / 2) * BOX.scale];
}

function drawSparks(t) {
  const flash = at("flash", t);
  const arcs = at("arcs", t);
  if (flash <= 0 && arcs <= 0) return;
  const [cx, cy] = boxCenter();
  const frame = Math.floor(t * 24);
  if (flash > 0) {
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 260);
    glow.addColorStop(0, palette.spark);
    glow.addColorStop(0.25, palette.sparkGlow);
    glow.addColorStop(1, "rgba(255, 242, 168, 0)");
    ctx.globalAlpha = flash;
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 260, cy - 260, 520, 520);
    ctx.globalAlpha = 1;
  }
  if (arcs <= 0) return;
  const rnd = random(frame + 1);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < 4; i++) {
    const dir = rnd() * Math.PI * 2;
    const len = 60 + rnd() * 90;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let k = 1; k <= 4; k++) {
      const d = len * k / 4;
      const off = (rnd() - 0.5) * 36;
      ctx.lineTo(cx + Math.cos(dir) * d - Math.sin(dir) * off, cy + Math.sin(dir) * d + Math.cos(dir) * off);
    }
    ctx.strokeStyle = palette.arc;
    ctx.lineWidth = 7 * arcs;
    ctx.stroke();
    ctx.strokeStyle = palette.spark;
    ctx.lineWidth = 3 * arcs;
    ctx.stroke();
  }
}

function doorEdge(t) {
  const a = at("door", t) * Math.PI / 180;
  return [BOX.x + (INSET + INNER * Math.cos(a)) * BOX.scale, BOX.y + (INSET + INNER / 2) * BOX.scale];
}

function section(c, fill, line) {
  const r = BOX.section;
  c.save();
  c.lineJoin = "round";
  c.lineWidth = lineW / Math.sqrt(Math.abs(c.getTransform().a * c.getTransform().d));
  c.strokeStyle = line;
  poly(c, [[-r, -r], [r, -r], [r, r], [-r, r]], fill);
  c.stroke();
  c.restore();
}

function heldWires(c) {
  c.save();
  c.scale(BOX.gripScale, BOX.gripScale);
  c.translate(...BOX.gripAt);
  ENV.draw(c, asset("wires"), { lines: lineW });
  c.restore();
}

function drawRobot(t) {
  const hold = at("grip", t) >= 0.5 ? "grip" : "reach";
  const side = rigs[hold] ??= buildSide({ farLimbs: true, hold });
  const grip = rigs.grip ??= buildSide({ farLimbs: true, hold: "grip" });
  const lean = -at("lean", t);
  const m = new DOMMatrix().translate(X, FLOOR).rotate(lean).scale(-K, K).translate(-SIDE_AX, -FOOT_Y);
  const pose = { ...STAND, arm: at("arm", t), fore: at("fore", t), armFar: -6, foreFar: -14, head: at("head", t) };
  const onDoor = at("doorHold", t);
  if (onDoor > 0) {
    const held = kit.reach(grip, "rod", ["arm", "fore"], kit.toModel(m, ...doorEdge(t)), 1);
    pose.arm += (held.arm - pose.arm) * onDoor;
    pose.fore += (held.fore - pose.fore) * onDoor;
  }
  const pal = ENV.PALETTE;
  const rod = hold !== "grip" ? null
    : at("wire", t) >= 0.5 ? heldWires
    : at("cable", t) >= 0.5 ? c => section(c, pal.a1, pal.aLine)
    : c => section(c, pal.g2, pal.gLine);
  ctx.save();
  kit.feet(ctx, X, FLOOR, -K, K, SIDE_AX, lean * Math.PI / 180);
  renderBot(ctx, side, { pose, hooks: { rod }, lineW });
  ctx.restore();
}

function render(c, w, h, t) {
  ctx = c;
  ctx.save();
  kit.fitStage(ctx, w, h, W, H);
  const z = at("camZ", t);
  const sh = at("shake", t);
  const cx = at("camX", t) + Math.sin(t * 90) * sh;
  const cy = at("camY", t) + Math.cos(t * 77) * sh;
  kit.camera(ctx, W, H, cx, cy, z);
  lineW = kit.lineFor(ctx, K);
  drawWall();
  drawBox(t);
  drawRobot(t);
  drawSparks(t);
  ctx.restore();
}

window.CUTSCENES.pullWires = { name: CFG.title, camera: CFG.camera, duration: CFG.duration, palette, render, ref: kit.filmRef("pullWires", CFG.duration) };
})();
