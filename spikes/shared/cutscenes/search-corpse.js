(() => {
const { kit } = window.CUTSCENES;
const { rect, LINE_W, asset } = kit;
const { buildFront, render: renderBot, AX } = window.XBOT;
const CFG = window.C28_CONFIG.cutscenes.searchCorpse;
const ST = CFG.stage;
const W = ST.width, H = ST.height;
const palette = { ...CFG.palette };
const at = kit.track(CFG.tracks);
const BLOCK_WIDTHS = [150, 210, 120, 180, 240, 140, 200, 170];
const BLOCK_H = 74;
const ITEM_GAP = 9;
let robot = null;
let ctx;
let lineW = LINE_W;

function drawWall() {
  rect(ctx, -400, -400, W + 800, ST.wallBase + 400, palette.wall);
  for (let row = 0; row * BLOCK_H < ST.wallBase + 400; row++) {
    const y = -400 + row * BLOCK_H;
    let x = -400 - (row % 3) * 60;
    for (let i = row; x < W + 400; i++) {
      const w = BLOCK_WIDTHS[i % BLOCK_WIDTHS.length];
      rect(ctx, x + 4, y + 4, w - 8, BLOCK_H - 8, i % 3 === 0 ? palette.wallLit : palette.block);
      rect(ctx, x + 4, y + BLOCK_H - 14, w - 8, 10, palette.wallDark);
      x += w;
    }
  }
  rect(ctx, -400, 300, W + 800, 42, palette.pipeDark);
  rect(ctx, -400, 300, W + 800, 16, palette.pipe);
  rect(ctx, -400, 304, W + 800, 5, palette.pipeLit);
  rect(ctx, 1130, -400, 150, ST.wallBase + 400, palette.panel);
  rect(ctx, 1130, -400, 22, ST.wallBase + 400, palette.panelDark);
  rect(ctx, 1258, -400, 22, ST.wallBase + 400, palette.panelDark);
  for (let y = 40; y < ST.wallBase; y += 120) {
    ctx.fillStyle = palette.rivet;
    ctx.beginPath();
    ctx.arc(1205, y, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  rect(ctx, -400, ST.wallBase - 70, W + 800, 70, palette.skirt);
  rect(ctx, -400, ST.wallBase - 70, W + 800, 8, palette.wallLit);
}

function drawFloor() {
  rect(ctx, -400, ST.wallBase, W + 800, H - ST.wallBase + 400, palette.floor);
  rect(ctx, -400, ST.wallBase, W + 800, 30, palette.floorLit);
  ctx.strokeStyle = palette.grate;
  ctx.lineWidth = 4;
  ctx.beginPath();
  const vx = W / 2, vy = ST.wallBase - 600;
  for (let x = -1600; x <= W + 1600; x += 110) {
    const k = (ST.wallBase - vy) / (H + 400 - vy);
    ctx.moveTo(vx + (x - vx) * k, ST.wallBase);
    ctx.lineTo(x, H + 400);
  }
  for (let y = ST.wallBase + 24, g = 24; y < H + 400; g *= 1.35, y += g) {
    ctx.moveTo(-400, y);
    ctx.lineTo(W + 400, y);
  }
  ctx.stroke();
}

function drawShadow(t) {
  const lean = at("lean", t);
  kit.shadow(ctx, ST.robotX + 360 + lean * 12, ST.wallBase - 120 + at("crouch", t) * 120, 170, 260, 0.35, palette.shadow, 0.2);
}

function drawItems(c) {
  const k = ST.itemScale;
  const m = c.getTransform();
  c.save();
  c.rotate(-Math.atan2(m.b, m.a));
  c.scale(k, k);
  c.translate(-7, -3);
  window.ENV.draw(c, asset("card"), { lines: lineW });
  c.translate(ITEM_GAP, 2);
  window.ENV.draw(c, asset("holoPlan"), { lines: lineW });
  c.restore();
}

function drawRobot(t, front) {
  robot ??= buildFront({ rightArmFirst: true });
  const crouch = at("crouch", t);
  const k = ST.robotScale;
  const pose = {
    body: { rot: at("lean", t), sy: 1 - ST.squash * crouch },
    armL: at("armL", t), foreL: at("foreL", t),
    armR: at("armR", t), foreR: at("foreR", t),
    face: at("head", t)
  };
  const holding = at("taken", t) >= 1;
  ctx.save();
  if (front) {
    const [x, y, w, h] = ST.handFront;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
  }
  kit.feet(ctx, ST.robotX + crouch * ST.crouchX, ST.floorY + crouch * ST.crouchY, k, k, AX);
  renderBot(ctx, robot, { pose, hooks: { handR: holding ? drawItems : null }, lineW });
  ctx.restore();
}

function drawCorpse(t) {
  ctx.save();
  ctx.translate(ST.corpseX, ST.corpseY);
  ctx.scale(-ST.corpseScale, ST.corpseScale);
  window.ENV.draw(ctx, asset("corpse"), { state: at("taken", t) >= 1 ? 1 : 0, lines: lineW });
  ctx.restore();
}

function render(c, w, h, t) {
  ctx = c;
  ctx.save();
  kit.fitStage(ctx, w, h, W, H);
  const z = at("camZ", t);
  kit.camera(ctx, W, H, at("camX", t), at("camY", t), z);
  lineW = kit.lineFor(ctx, ST.robotScale);
  drawWall();
  drawFloor();
  drawShadow(t);
  drawRobot(t, false);
  drawCorpse(t);
  if (at("handFront", t) >= 1) drawRobot(t, true);
  ctx.restore();
}

window.CUTSCENES.searchCorpse = {
  name: CFG.title,
  camera: CFG.camera,
  duration: CFG.duration,
  palette,
  render,
  ref: kit.filmRef("searchCorpse", CFG.duration)
};
})();
