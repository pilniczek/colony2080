(() => {
const { kit } = window.CUTSCENES;
const { rect, poly, oval, stroke } = kit;
const CFG = window.C28_CONFIG.cutscenes.missionStart;
const { buildSide, buildFront, buildBack, render: renderBot, locate, shade, SIDE_AX, AX, PALETTE: BOT } = window.XBOT;
const W = CFG.stage.width, H = CFG.stage.height;
const palette = { ...CFG.palette };
const at = kit.track(CFG.tracks);
const DEG = Math.PI / 180;
const MONO = "Share Tech Mono, monospace";
let ctx;

const rng = seed => kit.random(seed + 0x6d2b79f5);

const STARS = kit.scatter(rng(11), 260, 0, 0, W, H);
const GRASS = kit.scatter(rng(23), 140, 0, 540, W, 360);
const CRACKS = kit.scatter(rng(37), 70, -600, 360, 3200, 600);
const DEBRIS = kit.scatter(rng(41), 26, -200, 520, 1500, 220);
const SKY_PUFFS = kit.scatter(rng(53), 40, -400, 20, 2600, 420);

function vertical(y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [k, c] of stops) g.addColorStop(k, c);
  return g;
}

function glowDisc(x, y, r, color, alpha) {
  ctx.globalAlpha = alpha;
  oval(ctx, x, y, r, r, color);
  ctx.globalAlpha = alpha * 0.5;
  oval(ctx, x, y, r * 1.8, r * 1.8, color);
  ctx.globalAlpha = 1;
}

const camera = (cx, cy, z) => kit.camera(ctx, W, H, cx, cy, z);

function veil(color, alpha) {
  if (alpha <= 0) return;
  ctx.globalAlpha = Math.min(1, alpha);
  rect(ctx, 0, 0, W, H, color);
  ctx.globalAlpha = 1;
}

const planetLayer = kit.stillLayer();
const fieldLayer = kit.stillLayer();

let rigs = null;
function robots() {
  if (rigs) return rigs;
  const side = buildSide({ farLimbs: true });
  const front = buildFront();
  const enemyFront = buildFront({ enemy: true });
  rigs = {
    side, front, enemyFront,
    sideLod: buildSide({ farLimbs: true, lod: true }),
    badge: buildSide({ farLimbs: true, badge: true }),
    back: buildBack(),
    hold: window.GUN.holdPoses(side, front)
  };
  return rigs;
}

const ENEMY = { ...shade(BOT, { brightness: 1.1, saturate: 0 }), visor: BOT.visor };
const tones = {};
function dimmed(base, key, k) {
  const id = key + k;
  return tones[id] || (tones[id] = shade(base, { brightness: k }));
}

let wire = null;
function wirePalette() {
  if (wire) return wire;
  wire = {};
  for (const key of Object.keys(BOT)) wire[key] = key.endsWith("Line") ? palette.wire : palette.wireFill;
  return wire;
}

function robot(root, x, floorY, k, { ax = SIDE_AX, pose = {}, pal = BOT, hooks = {}, simple = false, sx = 1, lineW = 0 } = {}) {
  ctx.save();
  kit.feet(ctx, x, floorY, k * sx, k, ax);
  renderBot(ctx, root, { pal, pose, hooks, lineW: lineW || kit.lineFor(ctx, k), simple });
  ctx.restore();
}

function walkPose(phase) {
  const s = Math.sin(phase), c = Math.cos(phase);
  return {
    hipNear: -22 * s, hipFar: 22 * s,
    kneeNear: 2 + 34 * Math.max(0, c), kneeFar: 2 + 34 * Math.max(0, -c),
    ankleNear: -1.4 - 10 * Math.max(0, c), ankleFar: -1.4 - 10 * Math.max(0, -c),
    arm: 16 * s, fore: -18, armFar: -16 * s, foreFar: -18
  };
}

function guard(x, floorY, k, pal) {
  const { enemyFront, hold } = robots();
  const pose = { ...hold.FRONT_CARRY, ...hold.FRONT_CARRY_R };
  const lineW = kit.lineFor(ctx, k);
  robot(enemyFront, x, floorY, k, {
    ax: AX, pose, pal, lineW,
    hooks: { handL: c => window.GUN.hook(c, { pal, lineW, barrel: hold.FRONT_BARREL }) }
  });
}

function stars(dx, dy) {
  ctx.fillStyle = palette.star;
  for (const [x, y, a, b] of STARS) {
    ctx.globalAlpha = 0.3 + a * 0.7;
    const s = b < 0.85 ? 2 : 4;
    ctx.fillRect(((x + dx) % W + W) % W, ((y + dy) % H + H) % H, s, s);
  }
  ctx.globalAlpha = 1;
}

function marchFile(file, fi, t) {
  const { sideLod, side } = robots();
  const pal = dimmed(BOT, "hero", file.dim);
  for (let i = 0; i < file.n; i++) {
    const x = file.x0 + i * file.gap + t * file.speed;
    if (x < -400 || x > 1820) continue;
    const phase = (t * CFG.march.cadence + i * 0.37 + fi * 0.5) * Math.PI * 2;
    const bob = Math.abs(Math.cos(phase)) * 10 * file.k;
    robot(file.lod ? sideLod : side, x, file.floorY - bob, file.k, { pose: walkPose(phase), pal, simple: file.lod });
  }
}

function march(t) {
  const M = CFG.march;
  ctx.save();
  camera(at("marchCamX", t), 470, at("marchZ", t));
  rect(ctx, -1200, -400, 4400, 960, palette.hangarWall);
  for (let x = -1100; x < 3000; x += 360) {
    rect(ctx, x, -400, 44, 960, palette.hangarPillar);
    rect(ctx, x, -400, 8, 960, palette.hangarPillarLit);
  }
  rect(ctx, -1200, 110, 4400, 26, palette.hangarBeam);
  rect(ctx, 1520, 250, 230, 310, palette.hatch);
  ctx.globalAlpha = 0.18;
  poly(ctx, [[1520, 560], [1750, 560], [1980, 760], [1300, 760]], palette.hatchGlow);
  ctx.globalAlpha = 1;
  rect(ctx, -1200, 560, 4400, 800, palette.plate);
  ctx.strokeStyle = palette.plateLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = -2400; x < 4400; x += 90) {
    ctx.moveTo(x, 560);
    ctx.lineTo(800 + (x - 800) * 2.6, 1300);
  }
  for (let d = 8; d < 800; d *= 1.35) {
    ctx.moveTo(-1200, 560 + d);
    ctx.lineTo(3200, 560 + d);
  }
  ctx.stroke();
  rect(ctx, -1200, 560, 4400, 6, palette.plateShine);
  marchFile(M.files[0], 0, t);
  for (const g of M.guards) guard(g.x, g.floorY, g.k, dimmed(ENEMY, "enemy", g.dim));
  marchFile(M.files[1], 1, t);
  ctx.restore();
  kit.rowFill(ctx, c => {
    c.fillStyle = vertical(0, H, [[0, "rgba(0,0,0,0.55)"], [0.45, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,0.35)"]]);
    c.fillRect(0, 0, W, H);
  });
}

function shipThrust(x, y, len, alpha) {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha * 0.45;
  poly(ctx, [[x, y - 9], [x - len, y - 3], [x - len, y + 3], [x, y + 9]], palette.thrustGlow);
  ctx.globalAlpha = alpha;
  rect(ctx, x - 3, y - 4, 4, 8, palette.thrust);
  ctx.globalAlpha = 1;
}

function sideShip(x, y, k, rot, state, thrust, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot * DEG);
  ctx.scale(k, k);
  window.ENV.draw(ctx, kit.asset("crashedShip"), { state, t });
  shipThrust(-8, -36, 40 + 30 * thrust, thrust);
  shipThrust(-8, -25, 40 + 30 * thrust, thrust);
  ctx.restore();
}

function hangar(t) {
  ctx.save();
  camera(at("hangCamX", t), 430, at("hangZ", t));
  rect(ctx, -1200, -600, 4600, 1900, palette.space);
  ctx.save();
  ctx.beginPath();
  ctx.rect(1250, -150, 1350, 790);
  ctx.clip();
  ctx.translate(1250, -150);
  stars(0, 0);
  ctx.restore();
  const planet = ctx.createRadialGradient(1700, 140, 40, 1820, 260, 380);
  planet.addColorStop(0, palette.planetLit);
  planet.addColorStop(0.55, palette.planet);
  planet.addColorStop(1, palette.planetDark);
  ctx.fillStyle = planet;
  ctx.beginPath();
  ctx.arc(1820, 260, 360, 0, Math.PI * 2);
  ctx.fill();
  rect(ctx, -1200, -600, 2450, 1240, palette.bayWall);
  rect(ctx, 1250, -600, 1350, 450, palette.bayWall);
  rect(ctx, 2600, -600, 1000, 1240, palette.bayWall);
  for (let x = -1100; x < 1250; x += 220) rect(ctx, x, -600, 10, 1240, palette.bayPanel);
  rect(ctx, -1200, 120, 2450, 12, palette.bayPanel);
  rect(ctx, 1230, -170, 20, 810, palette.railShade);
  rect(ctx, 2600, -170, 20, 810, palette.railShade);
  kit.rowFill(ctx, c => {
    c.fillStyle = vertical(640, 1300, [[0, palette.bayFloorFar], [1, palette.bayFloor]]);
    c.fillRect(-1200, 640, 4800, 700);
  });
  const lift = at("shipLift", t), go = at("shipGo", t);
  ctx.globalAlpha = 0.35 * Math.max(0, 1 - lift / 160);
  oval(ctx, 200 + go + 470, 650, 520, 22, palette.shadow);
  ctx.globalAlpha = 1;
  sideShip(200 + go, 640 - lift, 4.8, 0, 0, at("thrust", t), t);
  for (let x = 380; x < 3000; x += 340) rect(ctx, x, 600, 16, 260, palette.railShade);
  rect(ctx, 300, 590, 2700, 18, palette.rail);
  rect(ctx, 300, 604, 2700, 6, palette.railShade);
  ctx.restore();
  veil(palette.white, at("hangFlash", t));
}

function rearShip(x, y, k) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  poly(ctx, [[-520, 34], [-120, -6], [540, -70], [120, 22]], palette.wing);
  poly(ctx, [[-170, -90], [170, -90], [190, 80], [-190, 80]], palette.hull);
  poly(ctx, [[-170, -90], [170, -90], [150, -60], [-150, -60]], palette.hullTop);
  rect(ctx, -190, 60, 380, 20, palette.hullDark);
  rect(ctx, -118, -34, 236, 26, palette.thrust);
  rect(ctx, -118, 6, 236, 26, palette.thrust);
  ctx.globalAlpha = 0.3;
  rect(ctx, -150, -50, 300, 100, palette.thrustGlow);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function station(x, z) {
  ctx.save();
  ctx.translate(800, 450);
  ctx.scale(z, z);
  ctx.translate(-800 + x, -450);
  poly(ctx, [[-260, 330], [1480, 250], [1780, 420], [1780, 720], [-260, 780]], palette.station);
  poly(ctx, [[-260, 330], [1480, 250], [1640, 310], [-160, 390]], palette.stationTop);
  poly(ctx, [[-260, 690], [1780, 640], [1780, 720], [-260, 780]], palette.stationDark);
  rect(ctx, 960, 110, 120, 230, palette.stationTop);
  rect(ctx, 1040, 110, 40, 230, palette.station);
  rect(ctx, 1010, 20, 8, 90, palette.stationTop);
  poly(ctx, [[1180, 300], [1560, 280], [1560, 360], [1180, 390]], palette.stationDark);
  for (const [bx, by, bw, bh] of [[-100, 560, 420, 70], [700, 560, 380, 60], [1180, 470, 520, 90], [200, 640, 900, 50]]) {
    rect(ctx, bx, by, bw, bh, palette.stationDark);
    rect(ctx, bx, by, bw, 8, palette.stationTop);
  }
  for (let px = 1200; px < 1700; px += 90) {
    oval(ctx, px, 330, 40, 22, palette.stationTop);
    oval(ctx, px, 336, 40, 16, palette.station);
  }
  const r = rng(5);
  ctx.fillStyle = palette.stationLight;
  for (const row of [450, 520, 600]) for (let wx = -200; wx < 1740; wx += 46) if (r() < 0.55) ctx.fillRect(wx, row - (wx + 260) * 0.03, 24, 6);
  const pod = ctx.createRadialGradient(470, 430, 20, 520, 480, 170);
  pod.addColorStop(0, palette.pod);
  pod.addColorStop(1, palette.podDark);
  ctx.fillStyle = pod;
  ctx.beginPath();
  ctx.ellipse(520, 480, 190, 150, 0, 0, Math.PI * 2);
  ctx.fill();
  oval(ctx, 600, 500, 46, 46, palette.lens);
  oval(ctx, 612, 492, 16, 16, palette.white);
  ctx.restore();
}

function planetDisc(c, x, y, r) {
  const g = c.createRadialGradient(x + r * 0.5, y - r * 0.2, r * 0.1, x, y, r);
  g.addColorStop(0, palette.planetLit);
  g.addColorStop(0.5, palette.planet);
  g.addColorStop(1, palette.planetDark);
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

function orbit(t) {
  rect(ctx, 0, 0, W, H, palette.space);
  stars(at("stationX", t) * 0.05, 0);
  planetLayer(ctx, [], c => planetDisc(c, 330, 470, 520));
  if (t >= 16.6) rearShip(at("orbitShipX", t), at("orbitShipY", t), at("orbitShip", t) * 0.4);
  station(at("stationX", t), at("stationZ", t));
}

function frontShip(x, y, k, roll) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(roll * DEG);
  ctx.scale(k, k);
  poly(ctx, [[-520, 6], [-70, -34], [70, -34], [520, 6], [70, 18], [-70, 18]], palette.wing);
  oval(ctx, 0, 0, 120, 64, palette.hull);
  oval(ctx, 0, -22, 96, 34, palette.hullTop);
  oval(ctx, 0, -16, 52, 18, palette.glassLit);
  rect(ctx, -140, 30, 30, 50, palette.hullDark);
  rect(ctx, 110, 30, 30, 50, palette.hullDark);
  ctx.restore();
}

function shipAt(t) {
  return [at("sdX", t), at("sdY", t), at("sdZ", t)];
}

function field(c) {
  c.fillStyle = vertical(0, 540, [[0, palette.skyHigh], [0.5, palette.skyMid], [0.88, palette.skyLow], [1, palette.skyGlow]]);
  c.fillRect(0, 0, W, 540);
  poly(c, [[0, 540], [0, 520], [200, 512], [420, 522], [700, 508], [960, 520], [1200, 510], [1600, 522], [1600, 540]], palette.hills);
  c.fillStyle = vertical(540, H, [[0, palette.grassFar], [1, palette.grassNear]]);
  c.fillRect(0, 540, W, H - 540);
  for (const [x, y, a, b] of GRASS) {
    c.globalAlpha = 0.35;
    const d = (y - 540) / 360;
    oval(c, x, y, 30 + d * 160 * a, 3 + d * 18 * b, palette.grassSpot);
  }
  c.globalAlpha = 1;
}

function shotDown(t) {
  fieldLayer(ctx, [], field);
  for (const [x, y, a, b] of SKY_PUFFS) {
    ctx.globalAlpha = 0.18 + a * 0.2;
    oval(ctx, (x + t * 12) % 2200 - 300, y * 0.7, 160 + b * 260, 14 + a * 22, b < 0.5 ? palette.cloud : palette.cloudDark);
  }
  ctx.globalAlpha = 1;
  const hit = at("sdHit", t);
  if (hit > 0) {
    for (let i = 8; i >= 1; i--) {
      const tt = t - i * 0.08;
      if (tt < 23.12) continue;
      const [px, py, pz] = shipAt(tt);
      ctx.globalAlpha = 0.5 * (1 - i / 9);
      oval(ctx, px, py, 40 * pz + i * 14, 30 * pz + i * 10, palette.smoke);
    }
    ctx.globalAlpha = 1;
  }
  const [x, y, z] = shipAt(t);
  frontShip(x, y, z, at("sdRoll", t));
  const boom = at("sdBoom", t);
  if (boom > 0 && boom < 1) {
    ctx.globalAlpha = 0.7 * (1 - boom);
    oval(ctx, x, y, 60 + boom * 420, 40 + boom * 260, palette.fire);
    ctx.globalAlpha = 1;
  }
  if (hit > 0) {
    const f = 0.6 + 0.4 * Math.sin(t * 40);
    glowDisc(x + 80 * z, y + 10 * z, 40 * z * f, palette.fire, 0.8);
    oval(ctx, x + 80 * z, y + 10 * z, 16 * z, 16 * z, palette.fireHot);
  }
  veil(palette.white, at("sdFlash", t));
}

function hold(t) {
  ctx.save();
  camera(at("holdCamX", t), 450, 1);
  rect(ctx, -200, -100, 2000, 1100, palette.holdWall);
  for (let x = -160; x < 1800; x += 150) rect(ctx, x, -100, 34, 1100, palette.holdRib);
  rect(ctx, -200, 40, 2000, 30, palette.holdPipe);
  rect(ctx, -200, 820, 2000, 300, palette.holdRib);
  const { front } = robots();
  for (const r of CFG.hold.robots) {
    if (r.enemy) guard(r.x, r.floorY, r.k, dimmed(ENEMY, "enemy", 0.6));
    else robot(front, r.x, r.floorY, r.k, { ax: AX, pal: dimmed(BOT, "hero", 0.62) });
  }
  poly(ctx, [[1180, 380], [1740, 300], [1740, 1000], [1180, 1000]], palette.crate);
  poly(ctx, [[1180, 380], [1740, 300], [1740, 330], [1180, 410]], palette.crateTop);
  ctx.strokeStyle = palette.crateLine;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 1; i < 12; i++) {
    ctx.moveTo(1180, 410 + i * 18);
    ctx.lineTo(1740, 330 + i * 18);
  }
  ctx.stroke();
  ctx.restore();
  const flick = rng(Math.floor(t * 15))();
  veil(palette.black, 0.25 + flick * 0.25);
  veil(palette.white, at("holdFlash", t));
}

function sparks(x, y, t) {
  const r = rng(Math.floor(t * 24) + 7);
  ctx.lineCap = "round";
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, len = 20 + r() * 70, d = r() * 20;
    const sx = x + Math.cos(a) * d, sy = y + Math.sin(a) * d;
    ctx.strokeStyle = r() < 0.5 ? palette.spark : palette.sparkHot;
    ctx.lineWidth = 2 + r() * 3;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.lineCap = "butt";
}

function fall(t) {
  const sh = at("fallShake", t);
  ctx.save();
  ctx.translate(800 + Math.sin(t * 90) * sh, 450 + Math.cos(t * 77) * sh);
  ctx.rotate(-14 * DEG);
  rect(ctx, -1200, -900, 2400, 1800, palette.fallWall);
  ctx.strokeStyle = palette.fallLine;
  ctx.lineWidth = 8;
  ctx.beginPath();
  for (let x = -1200; x < 1200; x += 300) {
    ctx.moveTo(x, -900);
    ctx.lineTo(x, 900);
  }
  for (let y = -900; y < 900; y += 260) {
    ctx.moveTo(-1200, y);
    ctx.lineTo(1200, y);
  }
  ctx.stroke();
  const k = 2.3;
  ctx.translate(-120, at("fallDrop", t));
  ctx.rotate(at("fallAngle", t) * DEG);
  ctx.scale(k, k);
  ctx.translate(-SIDE_AX - 30, -150);
  const pose = { head: at("fallHead", t), arm: at("fallArm", t), fore: -30, armFar: 20, foreFar: -20, hipNear: -10, kneeNear: 20 };
  renderBot(ctx, robots().badge, { pose, lineW: kit.lineFor(ctx, 1) });
  if (at("sparks", t) > 0.5) {
    sparks(360, 100, t);
    sparks(250, 200, t + 0.5);
  }
  ctx.restore();
  veil(palette.white, at("fallFlash", t));
}

function noise(t) {
  rect(ctx, 0, 0, W, H, palette.staticBase);
  const r = rng(Math.floor(t * 24) + 101);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = r() < 0.5 ? palette.staticLight : palette.staticDark;
    ctx.fillRect(Math.floor(r() * W), Math.floor(r() * H), 6 + Math.floor(r() * 10), 4);
  }
}

function hand(t) {
  if (at("handStatic", t) > 0.5) {
    noise(t);
    return;
  }
  ctx.save();
  camera(800, 450, at("handCamZ", t));
  rect(ctx, -200, -200, 2000, 1300, palette.deck);
  ctx.save();
  ctx.translate(800, 450);
  ctx.rotate(-28 * DEG);
  ctx.strokeStyle = palette.deckLine;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let d = -1400; d < 1400; d += 64) {
    ctx.moveTo(d, -1400);
    ctx.lineTo(d, 1400);
  }
  ctx.stroke();
  ctx.beginPath();
  for (let d = -1400; d < 1400; d += 64) {
    ctx.moveTo(-1400, d);
    ctx.lineTo(1400, d);
  }
  ctx.stroke();
  ctx.restore();
  const { side } = robots();
  const pose = { arm: -86, fore: at("handFore", t), armFar: 10, foreFar: -10 };
  const m = locate(side, "hand", pose);
  const k = 2.6;
  ctx.save();
  ctx.translate(980, 360);
  ctx.rotate(-128 * DEG);
  ctx.scale(k, k);
  ctx.translate(-m.e, -m.f);
  renderBot(ctx, side, { pose, lineW: kit.lineFor(ctx, 1) });
  ctx.restore();
  const wr = rng(Math.floor(t * 12) + 3);
  const wave = [];
  for (let i = 0; i <= 24; i++) wave.push([1160 + i * 14, 170 + (wr() - 0.5) * 70 * Math.sin(i / 24 * Math.PI)]);
  stroke(ctx, wave, palette.wave, 3);
  ctx.restore();
  let left = Math.floor(at("handText", t));
  ctx.font = `58px ${MONO}`;
  ctx.fillStyle = palette.diag;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  CFG.diagnostic.forEach((line, i) => {
    const shown = line.slice(0, Math.max(0, left));
    left -= line.length;
    if (shown) ctx.fillText(shown, 90, 590 + i * 66);
  });
}

function screenShape() {
  ctx.beginPath();
  ctx.moveTo(380, 190);
  ctx.quadraticCurveTo(800, 150, 1220, 190);
  ctx.quadraticCurveTo(1290, 450, 1220, 710);
  ctx.quadraticCurveTo(800, 750, 380, 710);
  ctx.quadraticCurveTo(310, 450, 380, 190);
  ctx.closePath();
}

function wireRobot(t) {
  const { front, back, side } = robots();
  const a = at("monTurn", t) * DEG;
  const c = Math.cos(a), s = Math.sin(a);
  const pal = wirePalette();
  const lineW = 3;
  if (Math.abs(c) >= Math.SQRT1_2) robot(c > 0 ? front : back, 800, 690, 0.7, { ax: AX, pal, sx: Math.abs(c), lineW });
  else robot(side, 800, 690, 0.7, { pal, sx: s > 0 ? -Math.abs(s) : Math.abs(s), lineW });
}

function wireMap(t) {
  const z = at("mapZoom", t);
  const turn = at("mapTurn", t) * DEG;
  const height = (gx, gz) => 26 * Math.sin(gx * 0.9 + gz * 0.4) + 18 * Math.cos(gz * 1.3 - gx * 0.5);
  const project = (gx, gz, h) => {
    const rx = gx * Math.cos(turn) - gz * Math.sin(turn);
    const rz = gx * Math.sin(turn) + gz * Math.cos(turn);
    return [800 + rx * 62 * z, 470 - rz * 26 * z - h * 0.35 * z];
  };
  ctx.globalAlpha = 0.3;
  poly(ctx, [[-7, -7], [7, -7], [7, 7], [-7, 7]].map(([gx, gz]) => project(gx, gz, 0)), palette.wireFill);
  ctx.strokeStyle = palette.wire;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  for (let gz = -7; gz <= 7; gz++) for (let gx = -7; gx <= 7; gx++) {
    const p = project(gx, gz, height(gx, gz));
    if (gx > -7) {
      const q = project(gx - 1, gz, height(gx - 1, gz));
      ctx.moveTo(q[0], q[1]);
      ctx.lineTo(p[0], p[1]);
    }
    if (gz > -7) {
      const q = project(gx, gz - 1, height(gx, gz - 1));
      ctx.moveTo(q[0], q[1]);
      ctx.lineTo(p[0], p[1]);
    }
  }
  for (const [bx, bz, bh] of [[-2, 1, 120], [1, -2, 90], [3, 2, 150], [-3, -3, 70]]) {
    const base = height(bx, bz);
    for (const [ex, ez] of [[0, 0], [0.6, 0], [0.6, 0.6], [0, 0.6]]) {
      const p = project(bx + ex, bz + ez, base);
      const q = project(bx + ex, bz + ez, base + bh);
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(q[0], q[1]);
    }
  }
  ctx.stroke();
  ctx.globalAlpha = 0.8;
  const mark = [[0, 1], [2, 1], [2, 3], [0, 3]].map(([gx, gz]) => project(gx, gz, height(gx, gz)));
  poly(ctx, mark, palette.mapMark);
  ctx.globalAlpha = 1;
}

function screenGlow(t, mode) {
  if (mode === "robot") wireRobot(t);
  if (mode === "map") wireMap(t);
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = palette.black;
  ctx.beginPath();
  for (let y = 150; y < 760; y += 8) ctx.rect(300, y, 1000, 3);
  ctx.fill();
  ctx.globalAlpha = 0.07;
  oval(ctx, 640, 300, 260, 110, palette.white);
  ctx.globalAlpha = 1;
}

function monitor(t) {
  const mode = at("monitorMode", t);
  ctx.save();
  camera(800, at("monCamY", t), at("monZ", t));
  rect(ctx, -400, -900, 2400, 2000, palette.panel);
  ctx.strokeStyle = palette.panelLine;
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let x = -300; x < 2000; x += 260) {
    ctx.moveTo(x, -900);
    ctx.lineTo(x, 1100);
  }
  ctx.stroke();
  rect(ctx, 560, -560, 420, 520, palette.panelDark);
  const blink = rng(Math.floor(t * 6) + 17);
  for (let i = 0; i < 6; i++) rect(ctx, 600, -520 + i * 70, 110, 34, blink() < 0.6 ? palette.lampOn : palette.lampOff);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) rect(ctx, 760 + j * 100, -520 + i * 78, 84, 60, blink() < 0.5 ? palette.keyOn : palette.keyOff);
  rect(ctx, 290, 110, 1020, 680, palette.bezel);
  rect(ctx, 290, 110, 1020, 14, palette.bezelLit);
  ctx.save();
  screenShape();
  const glass = ctx.createRadialGradient(800, 450, 60, 800, 450, 560);
  glass.addColorStop(0, palette.crtLit);
  glass.addColorStop(1, palette.crtDark);
  ctx.fillStyle = glass;
  ctx.fill();
  const main = ctx;
  const inside = kit.sheetDraw(main, "missionStartScreen", c => {
    ctx = c;
    screenGlow(t, mode);
  });
  ctx = main;
  ctx.clip();
  kit.sheetBlit(ctx, inside);
  ctx.restore();
  ctx.restore();
}

function overShip(x, y, k) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  poly(ctx, [[0, -260], [420, 110], [150, 150], [0, 120], [-150, 150], [-420, 110]], palette.wing);
  poly(ctx, [[0, -260], [420, 110], [150, 120], [0, 40], [-150, 120], [-420, 110]], palette.hullDark);
  rect(ctx, -90, -200, 180, 330, palette.wing);
  rect(ctx, -80, -200, 70, 330, palette.hull);
  glowDisc(0, 150, 46, palette.fire, 0.7);
  oval(ctx, 0, 150, 22, 22, palette.fireHot);
  ctx.restore();
}

function crash(t) {
  ctx.save();
  camera(at("crashCamX", t), at("crashCamY", t), 1);
  kit.rowFill(ctx, c => {
    c.fillStyle = vertical(-200, 360, [[0, palette.duskHigh], [1, palette.duskLow]]);
    c.fillRect(-600, -200, 3200, 560);
  });
  for (const [x, y, a, b] of SKY_PUFFS) {
    ctx.globalAlpha = 0.25 + a * 0.25;
    oval(ctx, x, y * 0.6 - 120, 200 + b * 300, 16 + a * 26, palette.dustCloud);
  }
  ctx.globalAlpha = 1;
  poly(ctx, [[-600, 360], [-600, 330], [-200, 316], [100, 336], [500, 300], [700, 330], [1300, 322], [1900, 300], [2600, 330], [2600, 360]], palette.mesa);
  kit.rowFill(ctx, c => {
    c.fillStyle = vertical(360, 1100, [[0, palette.desertFar], [1, palette.desertNear]]);
    c.fillRect(-600, 360, 3200, 740);
  });
  ctx.strokeStyle = palette.crack;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const [x, y, a, b] of CRACKS) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + 40 + a * 90, y + (b - 0.5) * 30);
    ctx.lineTo(x + 70 + a * 160, y + (a - 0.5) * 40);
  }
  ctx.stroke();
  ctx.globalAlpha = 0.5;
  poly(ctx, [[240, 640], [900, 610], [1100, 700], [200, 720]], palette.shadow);
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.translate(240, 700);
  ctx.rotate(-18 * DEG);
  ctx.scale(3.4, 3.4);
  window.ENV.draw(ctx, kit.asset("crashedShip"), { state: 1, t });
  ctx.restore();
  poly(ctx, [[100, 700], [380, 620], [700, 600], [900, 640], [1080, 760], [100, 780]], palette.desertFar);
  for (const [x, y, a, b] of DEBRIS) poly(ctx, [[x, y], [x + 30 + a * 60, y - 10 - b * 30], [x + 60 + a * 80, y + 8], [x + 10, y + 14]], a < 0.5 ? palette.hullDark : palette.crack);
  for (let x = 1500; x <= 1820; x += 80) rect(ctx, x, 160, 12, 520, palette.scaffold);
  for (let y = 200; y <= 640; y += 110) rect(ctx, 1490, y, 342, 10, palette.scaffold);
  stroke(ctx, [[1500, 640], [1580, 530], [1660, 640], [1740, 530], [1820, 640]], palette.scaffoldLit, 6);
  const sx = at("flyShadow", t);
  ctx.globalAlpha = 0.35;
  poly(ctx, [[sx - 300, 760], [sx + 300, 760], [sx + 140, 820], [sx - 140, 820]], palette.shadow);
  ctx.globalAlpha = 1;
  ctx.restore();
  veil(palette.black, 0.25);
  if (t >= 51.4) overShip(at("flyX", t), at("flyY", t), at("flyZ", t));
}

function ruin(x, w, h, seed, color) {
  const r = rng(seed);
  const pts = [[x, 640], [x, 640 - h]];
  for (let i = 1; i < 6; i++) pts.push([x + w * i / 6, 640 - h * (0.55 + r() * 0.45)]);
  pts.push([x + w, 640 - h * 0.7], [x + w, 640]);
  poly(ctx, pts, color);
}

function city(t) {
  ctx.save();
  camera(at("cityCamX", t), 450, 1);
  kit.rowFill(ctx, c => {
    c.fillStyle = vertical(-200, 640, [[0, palette.ruinSkyHigh], [1, palette.ruinSkyLow]]);
    c.fillRect(-600, -200, 3200, 860);
  });
  for (const [x, y, a, b] of SKY_PUFFS) {
    ctx.globalAlpha = 0.3 + a * 0.3;
    oval(ctx, x + t * 8, y, 140 + b * 220, 40 + a * 40, b < 0.5 ? palette.ruinCloud : palette.ruinCloudDark);
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 12; i++) ruin(-300 + i * 230, 180, 160 + (i * 73) % 190, i + 1, palette.ruinFar);
  for (let i = 0; i < 5; i++) {
    const gx = 120 + i * 420;
    ctx.strokeStyle = palette.ruinMid;
    ctx.lineWidth = 8;
    ctx.strokeRect(gx, 330 - (i % 3) * 60, 160, 310 + (i % 3) * 60);
    stroke(ctx, [[gx, 640], [gx + 160, 330 - (i % 3) * 60]], palette.ruinMid, 6);
  }
  rect(ctx, -600, 640, 3200, 600, palette.rubble);
  rect(ctx, -300, 100, 420, 700, palette.brick);
  for (let y = 140; y < 640; y += 120) for (let x = -260; x < 100; x += 110) rect(ctx, x, y, 50, 70, palette.brickDark);
  const dust = at("cityDust", t);
  sideShip(at("cityShipX", t), at("cityShipY", t), at("cityShipZ", t), at("cityShipRot", t), 0, 1, t);
  if (dust > 0) {
    ctx.globalAlpha = 0.5 * (1 - dust * 0.5);
    for (let i = 0; i < 5; i++) oval(ctx, at("cityShipX", t) + 60 + i * 80, 610 - i * 6, 80 + dust * 120, 30 + dust * 30, palette.dust);
    ctx.globalAlpha = 1;
  }
  poly(ctx, [[-600, 900], [-600, 700], [200, 660], [520, 700], [900, 640], [1300, 690], [1700, 650], [2600, 700], [2600, 900]], palette.rubble);
  ctx.restore();
}

const SHOTS = { march, hangar, orbit, shotDown, hold, fall, hand, monitor, crash, city };

function render(c, w, h, t) {
  ctx = c;
  ctx.save();
  kit.fitStage(ctx, w, h, W, H);
  SHOTS[at("shot", t)](t);
  ctx.restore();
}

window.CUTSCENES.missionStart = {
  name: CFG.title,
  camera: CFG.camera,
  duration: CFG.duration,
  palette,
  render,
  ref: kit.filmRef("missionStart", CFG.duration)
};
})();
