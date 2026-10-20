(() => {
const { kit } = window.CUTSCENES;
const { buildSide, buildBack, buildFront, render: renderBot, locate, AX, SIDE_AX, FOOT_Y, GAME_LINE } = window.XBOT;
const CFG = window.C28_CONFIG.cutscenes.hullCover;
const S = CFG.stage;
const W = S.width, H = S.height;
const palette = { ...CFG.palette };
const at = (name, t) => kit.sample(CFG.tracks, name, t);
const LINE_W = 1.4;
const FULL_LINE_PX = 500;
const FIRE_AT = CFG.tracks.fire[1][0];
const COVER = [8, -38, 20, 12];
const side = buildSide({ farLimbs: true, propBehindArm: true });
const back = buildBack({});
const { CARRY, CARRY_FAR } = window.GUN.holdPoses(side, buildFront({}));
const ship = window.ENV.ASSETS.find(a => a.id === "crashedShip");
const part = window.ENV.ASSETS.find(a => a.id === "shipPart");
const shipPalette = window.XBOT.shade(window.ENV.PALETTE, { brightness: S.shipShade });
const plate = { draw: c => window.ENV.P.box(c, -COVER[2] / 2, -COVER[3] / 2, COVER[2], COVER[3], "steel", 2) };

function random(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = random(S.seed);
const rocks = [];
for (let i = 0; i < 26; i++) {
  const x = -600 + i * 120 + pick() * 60, w = 120 + pick() * 160, top = -40 + pick() * 120, low = 180 + pick() * 220;
  rocks.push({ pts: [[x, top], [x + w, top + pick() * 60], [x + w * (0.7 + pick() * 0.3), low], [x + w * pick() * 0.3, low - pick() * 80]], tone: 1 + Math.floor(pick() * 3) });
}

let ctx;

function lineFor(k) {
  const m = ctx.getTransform();
  const robotPx = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k * FOOT_Y;
  return Math.min(LINE_W, Math.max(GAME_LINE, LINE_W * robotPx / FULL_LINE_PX));
}

function poly(pts, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

function drawHangar(view, shift) {
  ctx.fillStyle = palette.dark;
  ctx.fillRect(-1000, -1000, 3600, 3000);
  for (const r of rocks) poly(r.pts.map(([x, y]) => [x + shift, y]), palette["rock" + r.tone]);
  const hz = view.horizon;
  ctx.fillStyle = palette.floorFar;
  ctx.fillRect(-1000, hz - 30, 3600, 30);
  ctx.fillStyle = palette.floor;
  ctx.fillRect(-1000, hz, 3600, 2000);
  ctx.beginPath();
  for (let i = 1; i < 16; i++) {
    const y = hz + 520 / (0.5 + i * 0.45) - 40;
    if (y <= hz) continue;
    ctx.moveTo(-1000, y);
    ctx.lineTo(2600, y);
  }
  for (let k = -14; k <= 14; k++) {
    ctx.moveTo(800 + shift * 0.3 + k * 30, hz);
    ctx.lineTo(800 + shift * 0.3 + k * 420, hz + 1400);
  }
  ctx.strokeStyle = palette.floorLine;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawShip(view, state) {
  ctx.save();
  ctx.translate(view.shipX, view.shipY);
  ctx.scale(view.shipScale, view.shipScale);
  window.ENV.draw(ctx, ship, { state, lines: LINE_W, palette: shipPalette });
  ctx.restore();
}

function shadow(x, y, rx, ry) {
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = palette.shadow;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

const legUp = r => [{ sy: 1 - 0.5 * r }, { dy: -85 * r }];

function drawWalk(t) {
  const V = S.walk;
  drawHangar(V, 0);
  drawShip(V, 0);
  const k = at("walkScale", t);
  const x = at("walkX", t), y = at("walkY", t);
  const swing = Math.sin(2 * Math.PI * t / V.stepSeconds);
  const [thighL, shinL] = legUp(V.lift * Math.max(0, swing));
  const [thighR, shinR] = legUp(V.lift * Math.max(0, -swing));
  const pose = { body: { dy: -V.bob * Math.abs(swing) }, thighL, shinL, thighR, shinR, armL: -V.swing * swing, armR: -V.swing * swing };
  shadow(x, y, 230 * k, 26 * k);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.translate(-AX, -FOOT_Y);
  const lineW = lineFor(k);
  renderBot(ctx, back, { pose, lineW });
  window.GUN.slung(ctx, { lineW });
  ctx.restore();
}

function drawFlash(m, on) {
  if (!on) return;
  const tip = m.transformPoint(new DOMPoint(window.GUN.muzzleInHook[0], window.GUN.muzzleInHook[1]));
  const ahead = m.transformPoint(new DOMPoint(window.GUN.muzzleInHook[0], window.GUN.muzzleInHook[1] + 1));
  const dx = ahead.x - tip.x, dy = ahead.y - tip.y, len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const star = [];
  for (let i = 0; i < 12; i++) {
    const a = Math.atan2(uy, ux) + i * Math.PI / 6, r = i % 2 ? 22 : i === 0 ? 90 : 48;
    star.push([tip.x + ux * 20 + Math.cos(a) * r, tip.y + uy * 20 + Math.sin(a) * r]);
  }
  poly(star, palette.flashEdge);
  ctx.fillStyle = palette.flash;
  ctx.beginPath();
  ctx.arc(tip.x + ux * 24, tip.y + uy * 24, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.flashCore;
  ctx.beginPath();
  ctx.arc(tip.x + ux * 22, tip.y + uy * 22, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = palette.flash;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(tip.x + ux * 120, tip.y + uy * 120);
  ctx.lineTo(tip.x + ux * (120 + S.tracer), tip.y + uy * (120 + S.tracer));
  ctx.stroke();
}

function drawHits(view, t, frame) {
  if (at("hits", t) < 0.5) return;
  const cx = view.shipX + (COVER[0] + COVER[2] / 2) * view.shipScale, cy = view.shipY + (COVER[1] + COVER[3] / 2) * view.shipScale;
  const spark = random(frame + 7);
  ctx.strokeStyle = palette.spark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = spark() * Math.PI * 2, r0 = 10 + spark() * 20, r1 = r0 + 30 + spark() * 50;
    const ox = (spark() - 0.5) * COVER[2] * view.shipScale * 0.8, oy = (spark() - 0.5) * COVER[3] * view.shipScale * 0.8;
    ctx.moveTo(cx + ox + Math.cos(a) * r0, cy + oy + Math.sin(a) * r0);
    ctx.lineTo(cx + ox + Math.cos(a) * r1, cy + oy + Math.sin(a) * r1);
  }
  ctx.stroke();
}

function drawDebris(view, t) {
  const k = view.shipScale;
  const cx = view.shipX + (COVER[0] + COVER[2] / 2) * k, cy = view.shipY + (COVER[1] + COVER[3] / 2) * k;
  const drop = at("partDrop", t);
  if (at("cover", t) >= 0.5) {
    ctx.save();
    ctx.translate(cx, cy + drop * S.partDrop);
    ctx.scale(S.partScale, S.partScale);
    ctx.rotate(drop * 0.6);
    ctx.translate(-9, 6);
    window.ENV.draw(ctx, part, { state: 1, lines: LINE_W, palette: shipPalette });
    ctx.restore();
  }
  const fly = at("coverFly", t);
  if (fly <= 0 || fly >= 1) return;
  const [vx, vy, g] = S.coverFly;
  ctx.save();
  ctx.translate(cx + vx * fly, cy + vy * fly + g * fly * fly / 2);
  ctx.rotate(fly * 7);
  ctx.scale(k, k);
  window.ENV.draw(ctx, plate, { lines: LINE_W, palette: shipPalette });
  ctx.restore();
}

function drawAim(t) {
  const V = S.aim;
  const z = at("camZ", t);
  ctx.translate(W / 2 - at("camX", t) * z, H / 2 - at("camY", t) * z);
  ctx.scale(z, z);
  drawHangar(V, 420);
  const cover = at("cover", t) >= 0.5 ? 1 : 0;
  drawShip(V, cover);
  drawDebris(V, t);
  const raise = at("raise", t);
  const firing = at("fire", t) >= 0.5;
  const frame = Math.floor((t - FIRE_AT) / S.flashSeconds);
  const on = firing && frame % 2 === 0;
  const kick = on ? -3 : 0;
  const pose = { arm: CARRY.arm * raise + kick, fore: CARRY.fore * raise, armFar: CARRY_FAR.armFar * raise + kick, foreFar: CARRY_FAR.foreFar * raise };
  const m = new DOMMatrix().translate(V.x, V.floorY).scale(V.scale).translate(-SIDE_AX, -FOOT_Y);
  shadow(V.x, V.floorY, 200 * V.scale, 22 * V.scale);
  ctx.save();
  ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  const lineW = lineFor(V.scale);
  renderBot(ctx, side, { pose, hooks: { hand: c => window.GUN.hook(c, { lineW }) }, lineW });
  ctx.restore();
  drawFlash(m.multiply(locate(side, "hand", pose)), on);
  if (firing) drawHits(V, t, frame);
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
  if (at("shot", t) === "A") drawWalk(t); else drawAim(t);
  ctx.restore();
}

window.CUTSCENES.hullCover = { name: CFG.title, camera: CFG.camera, duration: CFG.duration, palette, render, ref: kit.filmRef("hullCover", CFG.duration) };
})();
