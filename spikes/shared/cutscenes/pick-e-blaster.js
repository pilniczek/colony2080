(() => {
const { kit } = window.CUTSCENES;
const { random } = kit;
const { buildHand, render: renderBot } = window.XBOT;
const CFG = window.C28_CONFIG.cutscenes.pickEBlaster;
const S = CFG.stage;
const W = S.width, H = S.height;
const palette = { ...CFG.palette };
const at = kit.track(CFG.tracks);
const hand = buildHand({ view: "palm", pose: "carry", forearm: true });
const HAND_AT = [88, 438];
const PALM_UP = [88, 470];
const EDGE = [70, 130];
const STRIPE = 60;

const pick = random(S.seed);
const blots = [];
for (let i = 0; i < S.blots; i++) blots.push({ x: -300 + pick() * 2200, y: -200 + pick() * 1300, rx: 20 + pick() * 110, ry: 10 + pick() * 50, dark: pick() < 0.5 });

let ctx;

function drawFloor() {
  ctx.fillStyle = palette.floor;
  ctx.fillRect(-400, -400, W + 800, H + 800);
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
  ctx.strokeStyle = palette.joint;
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let x = -S.slab; x < W + 2 * S.slab; x += S.slab) {
    ctx.moveTo(x, EDGE[1]);
    ctx.lineTo(x, H + 400);
  }
  for (let y = EDGE[1] + S.slab; y < H + 400; y += S.slab) {
    ctx.moveTo(-400, y);
    ctx.lineTo(W + 400, y);
  }
  ctx.stroke();
  ctx.fillStyle = palette.floorLight;
  ctx.fillRect(-400, EDGE[1], W + 800, 8);
  ctx.fillStyle = palette.stripeDark;
  ctx.fillRect(-400, EDGE[0], W + 800, EDGE[1] - EDGE[0]);
  ctx.fillStyle = palette.stripe;
  ctx.beginPath();
  for (let x = -400; x < W + 400; x += STRIPE * 2) {
    ctx.moveTo(x, EDGE[1]);
    ctx.lineTo(x + STRIPE, EDGE[1]);
    ctx.lineTo(x + STRIPE * 2, EDGE[0]);
    ctx.lineTo(x + STRIPE, EDGE[0]);
    ctx.closePath();
  }
  ctx.fill();
  ctx.fillStyle = palette.joint;
  ctx.fillRect(-400, -400, W + 800, EDGE[0] + 400);
}

function drawShadow() {
  const [dx, dy, alpha] = S.shadow;
  const [x0, , x1] = window.EBLASTER.TOP_BOX;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = palette.shadow;
  ctx.beginPath();
  ctx.ellipse(dx, S.itemY + dy, (x1 - x0) * S.near / 2, 60, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHands(lineW) {
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * S.spread, 0);
    ctx.scale(-side, -1);
    ctx.translate(PALM_UP[0] - HAND_AT[0], PALM_UP[1] - HAND_AT[1]);
    ctx.rotate(-Math.PI / 2);
    ctx.translate(-PALM_UP[0], -PALM_UP[1]);
    renderBot(ctx, hand, { lineW });
    ctx.restore();
  }
}

function drawBlaster(lineW) {
  const [x0, , x1] = window.EBLASTER.TOP_BOX;
  ctx.save();
  ctx.translate(0, S.itemY);
  ctx.scale(S.near, S.near);
  ctx.translate(-(x0 + x1) / 2, 0);
  window.EBLASTER.drawTop(ctx, { lineW });
  ctx.restore();
}

function render(c, w, h, t) {
  ctx = c;
  ctx.save();
  kit.fitStage(ctx, w, h, W, H);
  ctx.save();
  ctx.translate(at("panX", t), at("panY", t));
  drawFloor();
  ctx.restore();
  const k = S.scale * at("grow", t);
  ctx.save();
  ctx.translate(W / 2, S.palmY + (at("lift", t) + at("bob", t)) * S.scale);
  ctx.rotate(at("tilt", t) * Math.PI / 180);
  ctx.scale(k, k);
  const lineW = kit.lineFor(ctx, 1);
  drawShadow();
  drawHands(lineW);
  drawBlaster(lineW);
  ctx.restore();
  ctx.restore();
}

window.CUTSCENES.pickEBlaster = { name: CFG.title, camera: CFG.camera, duration: CFG.duration, palette, render, ref: kit.filmRef("pickEBlaster", CFG.duration) };
})();
