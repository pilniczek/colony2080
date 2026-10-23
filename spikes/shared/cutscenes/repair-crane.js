(() => {
const { kit } = window.CUTSCENES;
const { poly, stroke, oval, asset } = kit;
const { XBOT, ENV } = window;
const CFG = window.C28_CONFIG.cutscenes.repairCrane;
const ST = CFG.stage;
const W = ST.width, H = ST.height;
const RB = CFG.robot, CR = CFG.crane, WALK = CFG.walk;
const LINE = 1.4;
const MIN_LINE = 0.6;
const LIT = { brightness: 0.9, saturate: 1 };
const DUSK = { brightness: 0.85, saturate: 0.95 };
const BEAM_MID = 84, CHAIN_TOP = -100;
const HANG = [BEAM_MID, CHAIN_TOP - CR.hang];
const palette = { ...CFG.palette };
const at = kit.track(CFG.tracks);

const ROOF_CLOUDS = kit.bank(13, 30, 600, 2400, -360, 640, 200, 380, 18, 32);
const HILL_CLOUDS = kit.bank(17, 24, -150, 1900, -40, ST.horizon - 80, 180, 360, 16, 30);
const STREAKS = kit.bank(19, 10, -200, 2200, 120, 500, 160, 320, 6, 10);
const HILL = [[-100, 900], [-100, 640], [300, 560], [650, 522], [900, 516], [1200, 546], [1700, 620], [1700, 900]];
const RIDGE = [[-100, 600], [400, 540], [800, 560], [1200, 498], [1700, 560], [1700, 700], [-100, 700]];
const FACETS = [[[300, 560], [650, 522], [560, 600], [260, 640]], [[650, 522], [900, 516], [820, 570]], [[-100, 680], [260, 640], [180, 760], [-100, 800]]];
const CRACKS = [[[560, 600], [600, 700], [560, 820]], [[820, 570], [900, 660]], [[1200, 546], [1150, 640], [1260, 760]]];
const FRONDS = [[-40, 960, 520, 520, 18, 1], [180, 960, 300, 700, 12, 0.7]];
const POSTS = [[-300, 50], [60, 50], [380, 40]];
let rigs = null;
let ctx;
const backdrop = kit.stillLayer();

function onto(c, draw) {
  const prev = ctx;
  ctx = c;
  draw();
  ctx = prev;
}

const robots = () => (rigs ??= { side: XBOT.buildSide({ farLimbs: true }), front: XBOT.buildFront({}), back: XBOT.buildBack({}) });

function sky(horizon, clouds) {
  kit.rowFill(ctx, c => {
    const g = c.createLinearGradient(0, horizon - 900, 0, horizon);
    g.addColorStop(0, palette.sky0);
    g.addColorStop(0.4, palette.sky1);
    g.addColorStop(0.75, palette.sky2);
    g.addColorStop(0.92, palette.glow);
    g.addColorStop(1, palette.sun);
    c.fillStyle = g;
    c.fillRect(-1000, -1000, 4600, horizon + 1000);
  });
  const [sx, sy, sr] = ST.sun;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(1, 0.4);
  const sun = ctx.createRadialGradient(0, 0, 0, 0, 0, sr);
  sun.addColorStop(0, palette.sun);
  sun.addColorStop(0.35, palette.glow);
  sun.addColorStop(1, palette.glow + "00");
  ctx.fillStyle = sun;
  ctx.fillRect(-sr, -sr, sr * 2, sr * 2);
  ctx.restore();
  for (const [x, y, w, h] of clouds) kit.cloud(ctx, x, y, w, h, Math.min(1, 0.25 + (y - horizon + 900) / 900), palette.cloudLit, palette.cloud);
}

function lineFor(c) {
  return Math.max(MIN_LINE, LINE * kit.unitScale(c));
}

function walkPose(base, t, stride) {
  const lift = Math.sin(t * Math.PI * 2 * WALK.rate) * stride;
  const swing = lift * 0.25;
  return {
    lift,
    pose: { ...base, body: { dy: -Math.abs(lift) * 0.3 }, armL: base.armL + swing, armR: base.armR + swing }
  };
}

function walker(rig, pose, pal, lineW, lift) {
  const [[lx, lw], [rx, rw]] = WALK.legs;
  const legs = [[lx, lw, Math.max(0, lift)], [rx, rw, Math.max(0, -lift)]];
  for (const [x, w, up] of legs) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, WALK.cut, w, 500);
    ctx.clip();
    ctx.translate(x + w / 2, WALK.cut);
    ctx.scale(1 + up * 0.004, 1);
    ctx.translate(-(x + w / 2), -WALK.cut - up);
    XBOT.render(ctx, rig, { pal, pose, lineW });
    ctx.restore();
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(-400, -400, 1440, 1400);
  ctx.rect(lx, WALK.cut, lw, 500);
  ctx.rect(rx, WALK.cut, rw, 500);
  ctx.clip("evenodd");
  XBOT.render(ctx, rig, { pal, pose, lineW });
  ctx.restore();
}

function craneFrame(t) {
  return { x: at("craneX", t), y: at("craneY", t), a: (at("craneSwing", t) * Math.PI) / 180, k: at("craneK", t) };
}

function cranePoint(f, px, py) {
  const dx = (px - HANG[0]) * f.k, dy = (py - HANG[1]) * f.k;
  return [f.x + dx * Math.cos(f.a) - dy * Math.sin(f.a), f.y + dx * Math.sin(f.a) + dy * Math.cos(f.a)];
}

function drawCrane(f) {
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(f.a);
  ctx.scale(f.k, f.k);
  ctx.translate(-HANG[0], -HANG[1]);
  const lineW = lineFor(ctx);
  stroke(ctx, [[BEAM_MID, HANG[1] - 400], [BEAM_MID, CHAIN_TOP]], ENV.PALETTE.c0, 2.4);
  stroke(ctx, [[BEAM_MID, HANG[1] - 400], [BEAM_MID, CHAIN_TOP]], ENV.PALETTE.c1, 1.2);
  ENV.draw(ctx, asset("crane"), { state: 1, lines: lineW });
  ctx.restore();
}

function drawCity() {
  ctx.fillStyle = palette.void;
  ctx.fillRect(ST.cityX - 400, ST.cityY - 2, 3000, 1000);
  ctx.save();
  ctx.translate(ST.cityX, ST.cityY);
  ctx.scale(ST.cityScale, ST.cityScale);
  ctx.beginPath();
  ctx.rect(0, -110, 320, 110);
  ctx.clip();
  ENV.draw(ctx, asset("skyBackground"), { state: 0, lines: lineFor(ctx) });
  ctx.restore();
}

function drawTowers() {
  ctx.fillStyle = palette.brick;
  ctx.fillRect(480, -600, 600, 1170);
  ctx.fillStyle = palette.mortar;
  for (let y = -600; y < 570; y += 26) ctx.fillRect(480, y, 600, 3);
  ctx.fillStyle = palette.brickLit;
  ctx.fillRect(560, -600, 64, 1170);
  ctx.fillRect(1010, -600, 70, 1170);
  ctx.fillStyle = palette.woodDark;
  ctx.fillRect(-420, -600, 900, 1170);
  for (const [x, w] of POSTS) {
    ctx.fillStyle = palette.wood;
    ctx.fillRect(x, -600, w, 1170);
    ctx.fillStyle = palette.woodLit;
    ctx.fillRect(x + w - 10, -600, 10, 1170);
  }
  for (const y of [-300, 60]) {
    stroke(ctx, [[-250, y], [60, y + 340]], palette.wood, 30);
    stroke(ctx, [[60, y], [-250, y + 340]], palette.wood, 30);
    stroke(ctx, [[110, y], [380, y + 340]], palette.wood, 26);
    stroke(ctx, [[380, y], [110, y + 340]], palette.wood, 26);
  }
  ctx.fillStyle = palette.woodLit;
  ctx.fillRect(-420, -60, 900, 40);
  ctx.fillRect(-420, 380, 900, 30);
}

function drawDeck() {
  const top = ST.deckTop, front = ST.deckFront, right = ST.deckRight;
  poly(ctx, [[-600, top], [right, top], [right - 90, front], [-600, front]], palette.deck);
  for (const [x, y, w, h] of STREAKS) if (y > 0 && x - 400 + w < right - 90) oval(ctx, x - 400, top + (y - 120) * 0.38, w, h * 0.6, palette.deckStreak);
  poly(ctx, [[-600, top], [right, top], [right - 4, top + 10], [-600, top + 10]], palette.deckLit);
  poly(ctx, [[-600, front], [right - 90, front], [right - 90, 1200], [-600, 1200]], palette.deckFront);
  poly(ctx, [[right - 90, front], [right, top], [right, top + 60], [right - 90, 1200]], palette.deckSide);
}

function roofHero(t, f) {
  const { side, front, back } = robots();
  const kind = String(at("pose", t));
  const k = at("heroK", t);
  ctx.save();
  if (kind === "side") {
    kit.feet(ctx, RB.x, RB.y, -k, k, XBOT.SIDE_AX);
    const pose = { arm: at("armB", t), fore: at("foreB", t) };
    const turn = (at("keyTurn", t) * Math.PI) / 180;
    const hand = (c) => {
      c.save();
      c.rotate(turn);
      c.scale(RB.keyScale, RB.keyScale);
      c.translate(-4, 3);
      ENV.draw(c, asset("craneKey"), { state: 0, lines: lineFor(c) });
      c.restore();
    };
    XBOT.render(ctx, side, { pal: XBOT.shade(XBOT.PALETTE, LIT), pose, hooks: { hand }, lineW: lineFor(ctx) });
  } else if (kind === "front") {
    const [bx, by] = cranePoint(craneFrame(5.8), RB.aboardX, 0);
    const w = at("walk", t);
    kit.feet(ctx, RB.x + (bx - RB.x) * w, RB.y + (by - RB.y) * w, k, k, XBOT.AX);
    const base = { armL: at("armL", t), foreL: at("foreL", t), armR: at("armR", t), foreR: at("foreR", t) };
    const { lift, pose } = walkPose(base, t, at("stride", t));
    walker(front, pose, XBOT.shade(XBOT.PALETTE, LIT), lineFor(ctx), lift);
  } else {
    const [x, y] = cranePoint(f, RB.aboardX, 0);
    const aboard = (k * f.k) / CFG.tracks.craneK[0][1];
    kit.feet(ctx, x, y, aboard, aboard, XBOT.AX, f.a);
    XBOT.render(ctx, back, { pal: XBOT.shade(XBOT.PALETTE, LIT), pose: { armL: 10, armR: -10 }, lineW: lineFor(ctx) });
  }
  ctx.restore();
}

function drawPanel() {
  ctx.save();
  ctx.translate(CR.panelX, RB.y);
  ctx.scale(CR.panelScale, CR.panelScale);
  ENV.draw(ctx, asset("craneMast"), { lines: lineFor(ctx), size: { h: 200 } });
  ctx.restore();
}

function roofShot(t) {
  const f = craneFrame(t);
  backdrop(ctx, ["roof"], c => onto(c, () => {
    sky(ST.deckTop, ROOF_CLOUDS);
    drawCity();
    drawTowers();
    drawDeck();
    drawPanel();
  }));
  const aboard = String(at("pose", t)) === "back";
  if (!aboard) roofHero(t, f);
  drawCrane(f);
  if (aboard) roofHero(t, f);
}

function frond(x, y, len, rise, leaves, k) {
  const tipX = x + len, tipY = y - rise;
  const cx = x + len * 0.2, cy = y - rise * 1.1;
  ctx.strokeStyle = palette.leaf;
  ctx.lineWidth = 8 * k;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(cx, cy, tipX, tipY);
  ctx.stroke();
  for (let i = 1; i <= leaves; i++) {
    const u = i / (leaves + 1), v = 1 - u;
    const px = v * v * x + 2 * u * v * cx + u * u * tipX;
    const py = v * v * y + 2 * u * v * cy + u * u * tipY;
    const dir = Math.atan2(2 * v * (cy - y) + 2 * u * (tipY - cy), 2 * v * (cx - x) + 2 * u * (tipX - cx));
    const side = i % 2 ? 1 : -1;
    const size = (1 - u * 0.6) * 46 * k;
    const a = dir + side * 0.9;
    oval(ctx, px + Math.cos(a) * size, py + Math.sin(a) * size, size, size * 0.32, i % 3 ? palette.leaf : palette.leafLit, a);
  }
}

function hillShot(t) {
  backdrop(ctx, ["hill"], c => onto(c, () => {
    sky(ST.horizon, HILL_CLOUDS);
    poly(ctx, RIDGE, palette.ridge);
    poly(ctx, HILL, palette.rock);
    for (const f of FACETS) poly(ctx, f, palette.rockLit);
    for (const k of CRACKS) stroke(ctx, k, palette.rockDark, 6);
  }));
  const { front } = robots();
  ctx.save();
  kit.feet(ctx, at("walkerX", t), at("walkerY", t), at("walkerK", t), at("walkerK", t), XBOT.AX);
  const base = { armL: at("armL", t), foreL: at("foreL", t), armR: at("armR", t), foreR: at("foreR", t) };
  const { lift, pose } = walkPose(base, t, at("stride", t));
  walker(front, pose, XBOT.shade(XBOT.PALETTE, DUSK), lineFor(ctx), lift);
  ctx.restore();
  ctx.save();
  ctx.translate(at("plantShift", t), -at("plantShift", t) * 0.4);
  for (const [x, y, len, rise, leaves, k] of FRONDS) frond(x, y, len, rise, leaves, k);
  ctx.restore();
}

function render(c, w, h, t) {
  ctx = c;
  ctx.save();
  kit.fitStage(ctx, w, h, W, H);
  if (String(at("shot", t)) === "hill") hillShot(t);
  else {
    const z = at("camZ", t);
    kit.camera(ctx, W, H, at("camX", t), at("camY", t), z);
    roofShot(t);
  }
  ctx.restore();
}

window.CUTSCENES.repairCrane = {
  name: CFG.title,
  camera: CFG.camera,
  duration: CFG.duration,
  palette,
  render,
  ref: kit.filmRef("repairCrane", CFG.duration)
};
})();
