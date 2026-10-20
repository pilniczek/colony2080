(() => {
const { kit } = window.CUTSCENES;
const { rect, poly, oval, LINE_W, asset } = kit;
const { buildFront, buildBack, render: renderBot, locate, FOOT_Y, AX } = window.XBOT;
const CFG = window.C28_CONFIG.cutscenes.tradeHoloPlan;
const ST = CFG.stage;
const DOOR = CFG.door;
const W = ST.width, H = ST.height;
const palette = { ...CFG.palette };
const at = kit.track(CFG.tracks);
const atDoor = kit.track(DOOR.tracks);
const HEAD_K = 2.3;
const ROBOT_X = 800;
const ROBOT_FEET = 1500;
const SHOULDER = [150, 130];
const PLAN_ROOMS = [
  [[0, 0], [1, 0], [1, 1], [0, 1]],
  [[0.35, 0], [0.35, 0.55], [0, 0.55]],
  [[0.35, 0.3], [0.7, 0.3], [0.7, 0]],
  [[0.7, 0.3], [0.7, 0.75], [1, 0.75]],
  [[0.35, 0.55], [0.55, 0.55], [0.55, 1]]
];
let ctx;
let lineW = LINE_W;
let rigs = null;

const robots = () => (rigs ??= { front: buildFront(), back: buildBack({ leftArmBehind: false }) });

function glow(x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function grit(x0, y0, w, h, light, dark) {
  for (let i = 0; i < 240; i++) {
    const x = x0 + (i * 733) % w, y = y0 + (i * 389) % h;
    rect(ctx, x, y, 6 + (i % 5) * 4, 4 + (i % 3) * 3, i % 2 ? dark : light);
  }
}

function begin(c, w, h) {
  ctx = c;
  ctx.save();
  kit.fitStage(ctx, w, h, W, H);
}

function drawItem(c, id, k) {
  const m = c.getTransform();
  c.save();
  c.rotate(-Math.atan2(m.b, m.a));
  c.scale(k, k);
  const [x0, y0, x1, y1] = asset(id).box;
  c.translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
  window.ENV.draw(c, asset(id), { state: DOOR.itemStates[id] ?? 0, lines: lineW });
  c.restore();
}

function drawFace(t) {
  const u = at("manTurn", t);
  const fx = u * 34;
  oval(ctx, -100 + fx * 0.4, 10, 18, 34, palette.skinDark);
  oval(ctx, 100 + fx * 0.4, 10, 18, 34, palette.skinDark);
  rect(ctx, -55, 90, 110, 120, palette.skinDark);
  poly(ctx, [[-170, 190], [170, 190], [230, 300], [-230, 300]], palette.collar);
  poly(ctx, [[-55, 170], [55, 170], [0, 230]], palette.collarDark);
  const face = [[-95, -80], [-90, -120], [-60, -140], [0, -146], [60, -140], [90, -120], [95, -80], [92, 10], [80, 70], [50, 110], [20, 126], [-20, 126], [-50, 110], [-80, 70], [-92, 10]];
  poly(ctx, face, palette.skin);
  poly(ctx, [[-95, -80], [-92, 10], [-80, 70], [-50, 110], [-20, 126], [-40, 90], [-62, 40], [-70, -40]], palette.skinDark);
  poly(ctx, [[60 + fx, -100], [90, -110], [92, 10], [76, 40]], palette.skinLit);
  poly(ctx, [[-95, -78], [-92, -118], [-60, -142], [0, -150], [60, -142], [92, -118], [95, -78], [80, -98], [40, -110], [0, -113], [-40, -110], [-80, -98]], palette.hair);
  poly(ctx, [[-95, -78], [-92, -118], [-60, -142], [-40, -110], [-80, -98]], palette.hairDark);
  rect(ctx, -74 + fx, -50, 54, 11, palette.skinDeep);
  rect(ctx, 20 + fx, -50, 54, 11, palette.skinDeep);
  oval(ctx, -44 + fx, -20, 9, 5, palette.skinDeep);
  oval(ctx, 44 + fx, -20, 9, 5, palette.skinDeep);
  poly(ctx, [[fx - 6, -14], [fx + 12, 42], [fx - 4, 52], [fx - 20, 46]], palette.skinDark);
  poly(ctx, [[fx - 24, 50], [fx - 46, 82], [fx - 40, 84], [fx - 18, 56]], palette.skinDark);
  poly(ctx, [[fx + 18, 52], [fx + 44, 82], [fx + 38, 84], [fx + 12, 58]], palette.skinDark);
  rect(ctx, fx - 32, 78, 64, 7, palette.lip);
  poly(ctx, [[-30, 104], [30, 104], [16, 120], [-16, 120]], palette.skinDark);
  const glare = at("glare", t);
  ctx.strokeStyle = palette.glassRim;
  ctx.lineWidth = 5;
  for (const side of [-1, 1]) {
    ctx.globalAlpha = 0.12 + glare * 0.78;
    oval(ctx, side * 44 + fx, -20, 32, 26, palette.glass);
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.ellipse(side * 44 + fx, -20, 32, 26, 0, 0, Math.PI * 2);
    ctx.moveTo(side * 76 + fx, -24);
    ctx.lineTo(side * 98 + fx * 0.4, -14);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-12 + fx, -24);
  ctx.quadraticCurveTo(fx, -32, 12 + fx, -24);
  ctx.stroke();
}

function drawHatch(t) {
  const [hx, hy, hw, hh] = ST.hatch;
  rect(ctx, -100, -100, W + 200, H + 200, palette.wall);
  grit(-100, -100, W + 200, H + 200, palette.wallLit, palette.wallDark);
  rect(ctx, hx, hy, hw, hh, palette.hole);
  ctx.save();
  ctx.beginPath();
  ctx.rect(hx, hy, hw, hh);
  ctx.clip();
  ctx.globalAlpha = 0.5;
  poly(ctx, [[hx + 200, hy], [hx + hw - 200, hy], [hx + hw, hy + hh], [hx, hy + hh]], palette.holeLight);
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.translate(at("manX", t), at("manY", t));
  ctx.scale(HEAD_K * at("manScale", t), HEAD_K * at("manScale", t));
  drawFace(t);
  ctx.restore();
  const px = hx + at("slide", t) * hw;
  rect(ctx, px, hy, hw, hh, palette.panel);
  for (let x = px + 60; x < px + hw; x += 160) {
    rect(ctx, x, hy, 50, hh, palette.panelLit);
    rect(ctx, x + 50, hy, 14, hh, palette.panelDark);
  }
  for (let y = hy + 40; y < hy + hh; y += hh - 80) for (let x = px + 30; x < px + hw; x += 80) oval(ctx, x, y, 7, 7, palette.rivet);
  rect(ctx, px, hy, 18, hh, palette.panelDark);
  ctx.restore();
  rect(ctx, hx - 20, hy - 20, hw + 40, 20, palette.wallDark);
  rect(ctx, hx - 20, hy, 20, hh, palette.wallDark);
  rect(ctx, hx, hy + hh, hw, 16, palette.wallLit);
}

function drawSky(t) {
  rect(ctx, 0, 0, W, H, palette.sky);
  const drift = (at("camY", t) - 1000) * 0.4;
  rect(ctx, 0, 560 + drift, W, 400, palette.skyLit);
  rect(ctx, 0, 0, W, 180 + drift, palette.skyDark);
  for (const [x, y, rx, ry] of [[200, 260, 320, 70], [900, 180, 420, 60], [1400, 340, 300, 80], [600, 480, 380, 50], [1250, 620, 360, 60]]) {
    oval(ctx, x, y + drift, rx, ry, palette.cloudDark);
    oval(ctx, x - 40, y - 18 + drift, rx * 0.7, ry * 0.55, palette.cloud);
  }
}

function drawHologram(hand, t) {
  const k = at("holo", t);
  if (k <= 0) return;
  const flicker = 0.85 + 0.15 * Math.sin(t * 47);
  const [hx, hy] = hand;
  const top = hy - 170, w = 190, h = 90;
  const corner = (u, v) => [hx - w / 2 + u * w + (1 - v) * 24 - 12, top + v * h];
  ctx.globalAlpha = 0.14 * k * flicker;
  poly(ctx, [[hx - 8, hy - 18], [hx + 8, hy - 18], corner(1, 1), corner(1, 0), corner(0, 0), corner(0, 1)], palette.holo);
  ctx.globalAlpha = 0.3 * k * flicker;
  poly(ctx, [corner(0, 0), corner(1, 0), corner(1, 1), corner(0, 1)], palette.holo);
  ctx.globalAlpha = 0.9 * k * flicker;
  ctx.strokeStyle = palette.holo;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const room of PLAN_ROOMS) room.forEach(([u, v], i) => (i ? ctx.lineTo(...corner(u, v)) : ctx.moveTo(...corner(u, v))));
  ctx.stroke();
  ctx.globalAlpha = 0.3 * k;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let v = 0.1; v < 1; v += 0.12) {
    ctx.moveTo(...corner(0, v));
    ctx.lineTo(...corner(1, v));
  }
  ctx.stroke();
  ctx.globalAlpha = k * (Math.sin(t * 9) > 0 ? 1 : 0.35);
  oval(ctx, ...corner(0.82, 0.86), 4, 3, palette.holoCore);
  ctx.globalAlpha = 1;
  glow(hx, hy - 18, 26, palette.holo, 0.6 * k);
}

function drawHolo(t) {
  const { front } = robots();
  drawSky(t);
  const z = at("camZ", t);
  kit.camera(ctx, W, H, ROBOT_X, at("camY", t), z);
  lineW = kit.lineFor(ctx, ST.robotScale);
  const pose = { armL: at("armL", t), foreL: at("foreL", t) };
  const m = new DOMMatrix().translate(ROBOT_X, ROBOT_FEET).scale(ST.robotScale).translate(-AX, -FOOT_Y);
  kit.placeRobot(ctx, front, m, { pose, hooks: { handL: c => drawItem(c, "holoPlan", ST.itemScale) }, lineW });
  const shoulder = m.transformPoint(new DOMPoint(...SHOULDER));
  const lamp = at("lamp", t);
  oval(ctx, shoulder.x, shoulder.y, 9, 9, palette.lamp);
  glow(shoulder.x, shoulder.y, 70, palette.lamp, 0.8 * lamp);
  const hand = locate(front, "handL", pose, m).transformPoint(kit.ORIGIN);
  drawHologram([hand.x, hand.y], t);
}

function drawManArm(t, item) {
  const reach = atDoor("reach", t);
  if (reach <= 0) return;
  const bx = DOOR.hinge + 180, by = 580;
  const hx = bx + reach * DOOR.manReach, hy = 550;
  poly(ctx, [[bx - 80, by - 50], [hx - 10, hy - 32], [hx - 10, hy + 30], [bx - 80, by + 60]], palette.sleeve);
  poly(ctx, [[bx - 80, by + 14], [hx - 10, hy + 8], [hx - 10, hy + 30], [bx - 80, by + 60]], palette.sleeveDark);
  oval(ctx, hx + 22, hy, 34, 24, palette.skin);
  poly(ctx, [[hx + 30, hy - 20], [hx + 74, hy - 12], [hx + 74, hy + 2], [hx + 40, hy + 4]], palette.skinDark);
  if (item) {
    ctx.save();
    ctx.translate(hx + 40, hy - 6);
    drawItem(ctx, item, DOOR.itemScale * DOOR.robotScale);
    ctx.restore();
  }
}

function drawLeaf(t) {
  const a = atDoor("swing", t) * Math.PI * 0.53;
  const { hinge, leafWidth: L, top } = DOOR;
  const fx = hinge + L * Math.cos(a), ft = top - 110 * Math.sin(a), fb = H + 200;
  const edge = 30 * Math.sin(a);
  poly(ctx, [[hinge, top], [fx, ft], [fx, fb], [hinge, fb]], Math.cos(a) >= 0 ? palette.door : palette.doorDark);
  if (Math.cos(a) >= 0) {
    for (let k = 0.15; k < 1; k += 0.2) {
      const x = hinge + (fx - hinge) * k, y = top + (ft - top) * k;
      poly(ctx, [[x, y + 30], [x + (fx - hinge) * 0.06, y + 30 - 6 * Math.sin(a)], [x + (fx - hinge) * 0.06, fb], [x, fb]], palette.doorLit);
    }
  }
  poly(ctx, [[fx, ft], [fx - edge, ft + 6], [fx - edge, fb], [fx, fb]], palette.doorEdge);
}

function drawDoorRobot(t, item) {
  const { back } = robots();
  const pose = { armL: atDoor("armL", t), foreL: atDoor("foreL", t), armR: 10, foreR: 20 };
  const x = DOOR.robotX + atDoor("robotShift", t);
  ctx.globalAlpha = 0.45;
  oval(ctx, x + 230, 520, 200, 420, palette.shadow);
  ctx.globalAlpha = 1;
  ctx.save();
  kit.feet(ctx, x, DOOR.robotY, DOOR.robotScale, DOOR.robotScale, AX);
  renderBot(ctx, back, { pose, hooks: { handL: item ? c => drawItem(c, item, DOOR.itemScale) : null }, lineW });
  ctx.restore();
}

function doorShot(c, w, h, t, items) {
  begin(c, w, h);
  ctx.translate(W / 2 - atDoor("camX", t), 0);
  lineW = kit.lineFor(ctx, DOOR.robotScale);
  const swapped = atDoor("swap", t) >= 1;
  rect(ctx, -200, -100, W + 400, H + 200, palette.plaster);
  grit(-200, -100, W + 400, H + 200, palette.plasterLit, palette.plasterDark);
  rect(ctx, DOOR.hinge - 26, DOOR.top - 26, DOOR.leafWidth + 52, H, palette.plasterDark);
  rect(ctx, DOOR.hinge, DOOR.top, DOOR.leafWidth, H, palette.hole);
  ctx.globalAlpha = 0.35;
  poly(ctx, [[DOOR.hinge + 120, DOOR.top], [DOOR.hinge + DOOR.leafWidth, DOOR.top], [DOOR.hinge + DOOR.leafWidth, H], [DOOR.hinge + 300, H]], palette.holeLight);
  ctx.globalAlpha = 1;
  drawManArm(t, swapped ? items.manAfter : items.manBefore);
  drawLeaf(t);
  drawDoorRobot(t, swapped ? items.robotAfter : items.robotBefore);
  ctx.restore();
}

function render(c, w, h, t) {
  if (t >= ST.doorStart) return doorShot(c, w, h, t - ST.doorStart, CFG.items);
  begin(c, w, h);
  if (t < ST.holoStart) drawHatch(t);
  else drawHolo(t);
  ctx.restore();
}

window.CUTSCENES.tradeHoloPlan = {
  name: CFG.title,
  camera: CFG.camera,
  duration: CFG.duration,
  palette,
  render,
  doorShot,
  ref: kit.filmRef("tradeHoloPlan", CFG.duration)
};
})();
