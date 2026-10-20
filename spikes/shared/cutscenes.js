(() => {
const { buildSide, buildBack, render: renderBot, locate, solve, AX, SIDE_AX, FOOT_Y, PALETTE: BOT_PALETTE } = window.XBOT;

const ease = {
  linear: t => t,
  in: t => t * t,
  out: t => 1 - (1 - t) * (1 - t),
  inOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
};

function sample(tracks, name, t) {
  const keys = tracks[name];
  if (typeof keys[0][1] === "string") {
    let v = keys[0][1];
    for (const k of keys) if (t >= k[0]) v = k[1];
    return v;
  }
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (t < t1) {
      if (t1 === t0) return v1;
      const k = (ease[e] || ease.linear)((t - t0) / (t1 - t0));
      return v0 + (v1 - v0) * k;
    }
  }
  return keys[keys.length - 1][1];
}

function crowbarDoor(CFG) {
  const W = CFG.stage.width, H = CFG.stage.height, FLOOR = CFG.stage.floorY, SEAM = CFG.stage.doorSeamX;
  const DOOR_HALF = CFG.stage.doorHalfWidth;
  const DOOR = { x: SEAM - DOOR_HALF, w: 2 * DOOR_HALF, top: 322, bottom: 705 };
  const palette = { ...CFG.palette };
  const at = track(CFG.tracks);
  let ctx;

  function drawWorld(t) {
    rect(ctx, -2000, -1000, 6000, 3000, palette.tunnel);
    rect(ctx, -2000, 120, 6000, 600, palette.wall);
    rect(ctx, -2000, -1000, 6000, 1120, palette.ceiling);
    ctx.globalAlpha = 0.07;
    for (let x = 100; x < 1800; x += 420) poly(ctx, [[x - 18, 118], [x + 18, 118], [x + 130, 720], [x - 130, 720]], palette.lampCone);
    ctx.globalAlpha = 1;
    for (let x = 100; x < 1800; x += 420) rect(ctx, x - 22, 104, 44, 12, palette.lamp);

    const gap = at("gap", t);
    const glow = at("glow", t);
    poly(ctx, [[180, 250], [1620, 250], [1650, 280], [1650, 705], [150, 705], [150, 280]], palette.wagon);
    rect(ctx, 150, 640, 1500, 65, palette.wagonShade);
    rect(ctx, 150, 560, 1500, 24, palette.stripe);
    poly(ctx, [[180, 250], [1620, 250], [1650, 280], [150, 280]], palette.wagonShade);
    for (const x of [260, 470, 1110, 1320]) {
      rect(ctx, x, 340, 150, 150, palette.window);
      ctx.globalAlpha = 0.6;
      poly(ctx, [[x + 20, 340], [x + 70, 340], [x + 10, 490], [x - 0, 490]], palette.windowGlint);
      ctx.globalAlpha = 1;
    }

    const { x: dx, w: dw, top, bottom } = DOOR, dh = bottom - top;
    rect(ctx, dx, top, dw, dh, palette.interior);
    if (glow > 0) {
      ctx.globalAlpha = 0.55 * glow;
      poly(ctx, [[dx + 25, top + 8], [dx + dw - 25, top + 8], [dx + dw - 5, bottom], [dx + 5, bottom]], palette.interiorLight);
      ctx.globalAlpha = 0.9 * glow;
      rect(ctx, SEAM - 5, top + 8, 8, dh - 8, palette.interior);
      rect(ctx, dx + 35, 520, dw - 70, 10, palette.interior);
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(dx, top, dw, dh);
    ctx.clip();
    const half = gap / 2;
    drawDoorHalf(dx - half, true);
    drawDoorHalf(SEAM + half, false);
    ctx.restore();
    rect(ctx, dx - 10, top - 10, dw + 20, 12, palette.doorFrame);
    rect(ctx, dx - 10, top - 10, 10, dh + 10, palette.doorFrame);
    rect(ctx, dx + dw, top - 10, 10, dh + 10, palette.doorFrame);

    rect(ctx, -2000, 705, 6000, 900, palette.platform);
    rect(ctx, -2000, 712, 6000, 12, palette.safety);
    for (let x = -2000; x < 4000; x += 160) rect(ctx, x, 724, 4, 900, palette.platformLine);
    rect(ctx, -2000, 800, 6000, 3, palette.platformLine);
  }

  function drawDoorHalf(x, left) {
    const { top, bottom } = DOOR;
    rect(ctx, x, top, DOOR_HALF, bottom - top, palette.door);
    rect(ctx, left ? x : x + DOOR_HALF - 20, top, 20, bottom - top, palette.doorShade);
    rect(ctx, x + 20, top + 38, DOOR_HALF - 40, 120, palette.window);
    ctx.globalAlpha = 0.6;
    poly(ctx, [[x + 30, top + 38], [x + 50, top + 38], [x + 28, top + 158], [x + 20, top + 158]], palette.windowGlint);
    ctx.globalAlpha = 1;
  }

  const RB = CFG.robot;
  const K = RB.scale;
  const X = RB.x;
  const BAR = CFG.crowbar;
  let lineW = LINE_W;

  const sideRoot = buildSide({ farLimbs: true, propBehindArm: true });
  const backRoot = buildBack({ leftArmBehind: true, rightForeBehind: true });

  function drawCrowbar(c, reach, w, butt) {
    const lw = lineW / unitScale(c);
    const len = reach + butt - w * 0.2;
    c.strokeStyle = BOT_PALETTE.mLine;
    c.lineWidth = lw;
    c.save();
    c.translate(reach - w * 0.2, 0);
    c.rotate(-0.9);
    c.fillStyle = palette.crowbarShade;
    c.fillRect(0, -w / 2, w * 2.4, w);
    c.strokeRect(0, -w / 2, w * 2.4, w);
    c.restore();
    c.fillStyle = palette.crowbarShade;
    c.fillRect(-butt, -w / 2, len, w);
    c.fillStyle = palette.crowbar;
    c.fillRect(-butt, -w / 2, len, w * 0.55);
    c.strokeRect(-butt, -w / 2, len, w);
  }

  function robotMatrix(ax, lean = 0) {
    return new DOMMatrix().translate(X, FLOOR).rotate(lean).scale(K).translate(-ax, -FOOT_Y);
  }

  const BAR_TILT = RB.barTilt;
  const FAR_GRIP = RB.farGripOffset;

  let farSeed = null;

  function drawProfile(t) {
    const pose = { ...STAND, arm: at("armB", t), fore: at("foreB", t), armFar: 0, foreFar: 0 };
    const blend = at("farGrip", t);
    if (blend > 0) {
      const rest = locate(sideRoot, "handFar", pose).transformPoint(ORIGIN);
      const grip = locate(sideRoot, "hand", pose).rotate(BAR_TILT * 180 / Math.PI + at("barTurnB", t)).transformPoint(new DOMPoint(FAR_GRIP, 0));
      const target = new DOMPoint(rest.x + (grip.x - rest.x) * blend, rest.y + (grip.y - rest.y) * blend);
      farSeed = solve(sideRoot, "handFar", pose, ["armFar", "foreFar"], [[-150, 90], [-140, 10]], target, farSeed);
      Object.assign(pose, farSeed);
    }
    const k = at("barLen", t);
    const hooks = {
      hand: at("barShown", t) >= 0.5 ? c => {
        c.save();
        c.rotate(BAR_TILT + at("barTurnB", t) * Math.PI / 180);
        c.translate(FAR_GRIP * blend, 0);
        drawCrowbar(c, BAR.reach * k, BAR.width, BAR.butt * k);
        c.restore();
      } : null
    };
    shadow(ctx, X, FLOOR + 4, 70, 12, 0.35, palette.shadow);
    placeRobot(ctx, sideRoot, robotMatrix(SIDE_AX), { pose, hooks, lineW });
  }

  const PULL_ARM = RB.pullArmDeg;
  const PULL_FORE = RB.pullForeDeg;

  function drawBack(t) {
    const pry = at("pry", t);
    const pull = { arm: PULL_ARM * pry, fore: PULL_FORE * pry };
    const pose = {
      armL: -12 + pull.arm, foreL: -70 + pull.fore,
      armR: -20 + pull.arm, foreR: -64 + pull.fore
    };
    const m = robotMatrix(AX, -2 * pry);
    const end = locate(backRoot, "handL", pose, m).transformPoint(ORIGIN);
    const fist = locate(backRoot, "handR", pose, m).transformPoint(ORIGIN);
    ctx.save();
    ctx.translate(end.x, end.y);
    ctx.rotate(Math.atan2(fist.y - end.y, fist.x - end.x));
    ctx.scale(K, K);
    drawCrowbar(ctx, BAR.reach, BAR.width, BAR.butt);
    ctx.restore();
    shadow(ctx, X, FLOOR + 4, 90, 12, 0.35, palette.shadow);
    placeRobot(ctx, backRoot, m, { pose, hooks: {}, lineW });
  }

  function render(c, w, h, t) {
    ctx = c;
    ctx.save();
    fitStage(ctx, w, h, W, H);
    const z = at("camZ", t);
    const sh = at("shake", t);
    const cx = at("camX", t) + Math.sin(t * 90) * sh * 0.4;
    const cy = at("camY", t) + Math.cos(t * 77) * sh * 0.4;
    camera(ctx, W, H, cx, cy, z);
    lineW = lineFor(ctx, K);
    drawWorld(t);
    if (at("shot", t) === "C") drawBack(t); else drawProfile(t);
    ctx.restore();
  }

  return {
    name: "Crowbar opens train door",
    camera: "CAM 03 METRO",
    start: CFG.clip.start,
    duration: CFG.clip.end - CFG.clip.start,
    palette,
    backdrop: (c, x, y, k, t) => {
      ctx = c;
      c.save();
      c.translate(x, y);
      c.scale(k / K, k / K);
      c.translate(-X, -FLOOR);
      drawWorld(t + CFG.clip.start);
      c.restore();
    },
    render: (c, w, h, t) => render(c, w, h, t + CFG.clip.start),
    ref: REF && {
      label: REF.label,
      frame: t => REF.frame(Math.min(REF.frames, 1 + Math.floor((t + CFG.clip.start) / CFG.clip.end * REF.frames)))
    }
  };
}

const FILM = { w: 1600, h: 900 };
const CAM = {
  date: "2080-03-14",
  start: 23 * 3600 + 41 * 60 + 7,
  fps: 24,
  inset: 80,
  grains: 12000,
  grainFrames: 12,
  grainTile: 256,
  grainCap: 40,
  deadPixels: 12,
  deadSeed: 2080,
  dead: ["#000000", "#ffffff", "#ff3b30", "#3bff6a"],
  tint: "#b4c4ac",
  lift: "rgba(40, 52, 44, 0.35)",
  scanline: "rgba(0, 0, 0, 0.22)",
  vignette: "rgba(0, 0, 0, 0.6)",
  text: "#e4eedc",
  rec: "#e23b2e",
  font: "Share Tech Mono, monospace"
};

function filmRect(w, h) {
  const s = Math.min(w / FILM.w, h / FILM.h);
  return { x: (w - FILM.w * s) / 2, y: (h - FILM.h * s) / 2, w: FILM.w * s, h: FILM.h * s };
}

const two = n => String(n).padStart(2, "0");

function camClock(t) {
  const s = CAM.start + Math.floor(t);
  return `${CAM.date} ${two(Math.floor(s / 3600) % 24)}:${two(Math.floor(s / 60) % 60)}:${two(s % 60)}`;
}

function grainRandom(seed) {
  let a = seed + 0x6d2b79f5;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const grainCount = r => Math.min(Math.round(CAM.grains * CAM.grainTile * CAM.grainTile / (r.w * r.h)), Math.floor(CAM.grainTile * CAM.grainTile / CAM.grainCap));

const grainTiles = { key: "", tiles: [] };

function grainTile(index, u, r) {
  const key = `${r.w}x${r.h}`;
  if (grainTiles.key !== key) {
    grainTiles.key = key;
    grainTiles.tiles = [];
  }
  if (grainTiles.tiles[index]) return grainTiles.tiles[index];
  const size = CAM.grainTile;
  const tile = document.createElement("canvas");
  tile.width = tile.height = size;
  const c = tile.getContext("2d");
  const random = grainRandom(index + 1);
  const grain = Math.max(1, 2 * u);
  const count = grainCount(r);
  for (let i = 0; i < count; i++) {
    const speck = grain * (1 + Math.floor(random() * 2));
    c.fillStyle = `rgba(${random() < 0.5 ? "0, 0, 0" : "255, 255, 255"}, ${0.1 + random() * 0.25})`;
    c.fillRect(Math.floor(random() * size), Math.floor(random() * size), speck, speck);
  }
  grainTiles.tiles[index] = tile;
  return tile;
}

function corners(ctx, r, u) {
  const inset = CAM.inset * u;
  const arm = 70 * u;
  const x0 = r.x + inset, y0 = r.y + inset, x1 = r.x + r.w - inset, y1 = r.y + r.h - inset;
  ctx.strokeStyle = CAM.text;
  ctx.lineWidth = Math.max(1, 4 * u);
  ctx.lineCap = "square";
  ctx.beginPath();
  for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
    ctx.moveTo(x + dx * arm, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * arm);
  }
  ctx.stroke();
}

function securityCam(ctx, w, h, t, label) {
  const r = filmRect(w, h);
  const u = r.h / FILM.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  ctx.globalCompositeOperation = "saturation";
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "#808080";
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = CAM.tint;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = CAM.lift;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.globalCompositeOperation = "source-over";
  const frame = Math.floor(t * CAM.fps);
  const tile = grainTile(frame % CAM.grainFrames, u, r);
  const shift = grainRandom(frame);
  const pattern = ctx.createPattern(tile, "repeat");
  pattern.setTransform(new DOMMatrix().translate(r.x + Math.floor(shift() * CAM.grainTile), r.y + Math.floor(shift() * CAM.grainTile)));
  ctx.fillStyle = pattern;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = CAM.scanline;
  const line = Math.max(2, 6 * u);
  for (let y = r.y; y < r.y + r.h; y += line) ctx.fillRect(r.x, y, r.w, line / 2);
  const glow = ctx.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, r.h * 0.35, r.x + r.w / 2, r.y + r.h / 2, r.w * 0.62);
  glow.addColorStop(0, "rgba(0, 0, 0, 0)");
  glow.addColorStop(1, CAM.vignette);
  ctx.fillStyle = glow;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  const stuck = grainRandom(CAM.deadSeed);
  const dot = Math.max(1, 4 * u);
  for (let i = 0; i < CAM.deadPixels; i++) {
    ctx.fillStyle = CAM.dead[Math.floor(stuck() * CAM.dead.length)];
    ctx.fillRect(Math.round(r.x + stuck() * r.w), Math.round(r.y + stuck() * r.h), dot, dot);
  }
  const size = 34 * u;
  const inset = CAM.inset * u;
  const left = r.x + inset, right = r.x + r.w - inset;
  const top = r.y + inset / 2, bottom = r.y + r.h - inset / 2;
  ctx.font = `${size}px ${CAM.font}`;
  ctx.fillStyle = CAM.text;
  const caps = ctx.measureText("REC");
  const lift = (caps.actualBoundingBoxAscent - caps.actualBoundingBoxDescent) / 2;
  const radius = size * 0.32;
  const recX = right - caps.width;
  if (Math.floor(t * 2) % 2 === 0) {
    ctx.fillStyle = CAM.rec;
    ctx.beginPath();
    ctx.arc(recX - size * 0.3 - radius, top, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CAM.text;
  }
  ctx.fillText(label, left, top + lift);
  ctx.textAlign = "right";
  ctx.fillText("REC", right, top + lift);
  ctx.fillText(camClock(t), right, bottom + lift);
  corners(ctx, r, u);
  ctx.restore();
}

const REF = window.ORIGINALS.cutscenes.crowbarDoor;

function filmRef(id, duration) {
  const r = window.ORIGINALS.cutscenes[id];
  return r && { label: r.label, frame: t => r.frame(Math.min(duration, Math.max(0, t)), duration) };
}

function placeholder(id, CFG) {
  return {
    name: CFG.title,
    camera: CFG.camera,
    duration: CFG.duration,
    palette: { ...CFG.palette },
    render(ctx, w, h) {
      ctx.fillStyle = "#101418";
      ctx.fillRect(0, 0, w, h);
    },
    ref: filmRef(id, CFG.duration)
  };
}

const LINE_W = 1.4;
const FULL_LINE_PX = 500;
const RAD = Math.PI / 180;
const ORIGIN = new DOMPoint(0, 0);
const STAND = { hipNear: 0, kneeNear: 2, ankleNear: -1.4, hipFar: 0, kneeFar: 2, ankleFar: -1.4 };

const track = tracks => (name, t) => sample(tracks, name, t);
const asset = id => window.ENV.ASSETS.find(a => a.id === id);
const recolor = color => Object.fromEntries(Object.keys(window.ENV.PALETTE).map(k => [k, color]));

function unitScale(c) {
  const m = c.getTransform();
  return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
}

function lineFor(c, k, len = FOOT_Y) {
  const robotPx = unitScale(c) * k * len;
  return Math.min(LINE_W, Math.max(window.XBOT.GAME_LINE, LINE_W * robotPx / FULL_LINE_PX));
}

function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}

function trace(c, pts) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
}

function poly(c, pts, color) {
  c.fillStyle = color;
  trace(c, pts);
  c.closePath();
  c.fill();
}

function stroke(c, pts, color, width) {
  c.strokeStyle = color;
  c.lineWidth = width;
  trace(c, pts);
  c.stroke();
}

function oval(c, x, y, rx, ry, color, rot = 0) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  c.fill();
}

function cloud(c, x, y, w, h, alpha, lit, color) {
  c.globalAlpha = alpha;
  oval(c, x + w * 0.08, y + h * 0.35, w * 0.5, h * 0.6, lit);
  c.globalAlpha = 1;
  oval(c, x, y, w * 0.5, h * 0.5, color);
  oval(c, x - w * 0.22, y - h * 0.3, w * 0.28, h * 0.45, color);
}

function shadow(c, x, y, rx, ry, alpha, color, rot = 0) {
  c.globalAlpha = alpha;
  oval(c, x, y, rx, ry, color, rot);
  c.globalAlpha = 1;
}

function pool(c, x, y, rx, ry, color, alpha) {
  c.save();
  c.translate(x, y);
  c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.globalAlpha = alpha;
  c.fillStyle = g;
  c.fillRect(-rx, -rx, 2 * rx, 2 * rx);
  c.restore();
}

function random(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function bank(seed, n, x0, span, top, depth, w0, wSpan, h0, hSpan) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const list = [];
  for (let i = 0; i < n; i++) list.push([x0 + rnd() * span, top + rnd() * depth, w0 + rnd() * wSpan, h0 + rnd() * hSpan]);
  return list;
}

function scatter(r, n, x0, y0, w, h) {
  const pts = [];
  for (let i = 0; i < n; i++) pts.push([x0 + r() * w, y0 + r() * h, r(), r()]);
  return pts;
}

function fitStage(c, w, h, W, H) {
  c.fillStyle = "#000";
  c.fillRect(0, 0, w, h);
  const s = Math.min(w / W, h / H);
  c.translate((w - W * s) / 2, (h - H * s) / 2);
  c.scale(s, s);
  c.beginPath();
  c.rect(0, 0, W, H);
  c.clip();
  return s;
}

function camera(c, W, H, x, y, z) {
  c.translate(W / 2 - x * z, H / 2 - y * z);
  c.scale(z, z);
}

function feet(c, x, y, sx, sy, ax, rot = 0) {
  c.translate(x, y);
  if (rot) c.rotate(rot);
  c.scale(sx, sy);
  c.translate(-ax, -FOOT_Y);
}

function placeRobot(c, root, m, opts) {
  c.save();
  c.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  renderBot(c, root, opts);
  c.restore();
}

function layer(c, t, draw, lines, palette = window.ENV.PALETTE) {
  window.ENV.draw(c, { draw: cc => draw(cc) }, { t, lines, palette });
}

function toModel(m, x, y) {
  const p = m.inverse().transformPoint(new DOMPoint(x, y));
  return [p.x, p.y];
}

function circleCenter(a, b, c) {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  const q = p => p[0] * p[0] + p[1] * p[1];
  return [
    (q(a) * (b[1] - c[1]) + q(b) * (c[1] - a[1]) + q(c) * (a[1] - b[1])) / d,
    (q(a) * (c[0] - b[0]) + q(b) * (a[0] - c[0]) + q(c) * (b[0] - a[0])) / d
  ];
}

const chains = new Map();

function armChain(root, hook, keys, stand = STAND) {
  const key = `${keys[0]} ${hook}`;
  const known = chains.get(root)?.[key];
  if (known) return known;
  const hand = (a, b) => {
    const p = locate(root, hook, { ...stand, [keys[0]]: a, [keys[1]]: b }).transformPoint(ORIGIN);
    return [p.x, p.y];
  };
  const h = hand(0, 0);
  const chain = { h, s: circleCenter(h, hand(60, 0), hand(-60, 0)), e: circleCenter(h, hand(0, 60), hand(0, -60)) };
  chains.set(root, { ...chains.get(root), [key]: chain });
  return chain;
}

const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

function reach(root, hook, keys, target, bend, stand = STAND) {
  const { h, s, e } = armChain(root, hook, keys, stand);
  const l1 = Math.hypot(e[0] - s[0], e[1] - s[1]);
  const l2 = Math.hypot(h[0] - e[0], h[1] - e[1]);
  const d = Math.min(l1 + l2 - 1, Math.max(Math.abs(l1 - l2) + 1, Math.hypot(target[0] - s[0], target[1] - s[1])));
  const rest = Math.atan2(e[1] - s[1], e[0] - s[0]);
  const bent = Math.atan2(h[1] - e[1], h[0] - e[0]) - rest;
  const upper = Math.atan2(target[1] - s[1], target[0] - s[0]) + bend * Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const elbow = [s[0] + l1 * Math.cos(upper), s[1] + l1 * Math.sin(upper)];
  const lower = Math.atan2(target[1] - elbow[1], target[0] - elbow[0]);
  return { [keys[0]]: wrap(upper - rest) / RAD, [keys[1]]: wrap(lower - upper - bent) / RAD };
}

const kit = {
  ease, sample, track, asset, recolor, filmRef, placeholder, FILM, LINE_W, RAD, ORIGIN, STAND,
  unitScale, lineFor, rect, poly, stroke, oval, cloud, shadow, pool, random, scatter, bank,
  fitStage, camera, feet, placeRobot, layer, toModel, armChain, reach
};

window.CUTSCENES = { crowbarDoor: crowbarDoor(window.C28_CONFIG.cutscenes.crowbarDoor), securityCam, filmRect, camClock, kit };
})();
