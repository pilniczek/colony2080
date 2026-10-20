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
  const at = (name, t) => sample(CFG.tracks, name, t);
  let ctx;

  function poly(pts, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fill();
  }

  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawWorld(t) {
    rect(-2000, -1000, 6000, 3000, palette.tunnel);
    rect(-2000, 120, 6000, 600, palette.wall);
    rect(-2000, -1000, 6000, 1120, palette.ceiling);
    ctx.globalAlpha = 0.07;
    for (let x = 100; x < 1800; x += 420) poly([[x - 18, 118], [x + 18, 118], [x + 130, 720], [x - 130, 720]], palette.lampCone);
    ctx.globalAlpha = 1;
    for (let x = 100; x < 1800; x += 420) rect(x - 22, 104, 44, 12, palette.lamp);

    const gap = at("gap", t);
    const glow = at("glow", t);
    poly([[180, 250], [1620, 250], [1650, 280], [1650, 705], [150, 705], [150, 280]], palette.wagon);
    rect(150, 640, 1500, 65, palette.wagonShade);
    rect(150, 560, 1500, 24, palette.stripe);
    poly([[180, 250], [1620, 250], [1650, 280], [150, 280]], palette.wagonShade);
    for (const x of [260, 470, 1110, 1320]) {
      rect(x, 340, 150, 150, palette.window);
      ctx.globalAlpha = 0.6;
      poly([[x + 20, 340], [x + 70, 340], [x + 10, 490], [x - 0, 490]], palette.windowGlint);
      ctx.globalAlpha = 1;
    }

    const { x: dx, w: dw, top, bottom } = DOOR, dh = bottom - top;
    rect(dx, top, dw, dh, palette.interior);
    if (glow > 0) {
      ctx.globalAlpha = 0.55 * glow;
      poly([[dx + 25, top + 8], [dx + dw - 25, top + 8], [dx + dw - 5, bottom], [dx + 5, bottom]], palette.interiorLight);
      ctx.globalAlpha = 0.9 * glow;
      rect(SEAM - 5, top + 8, 8, dh - 8, palette.interior);
      rect(dx + 35, 520, dw - 70, 10, palette.interior);
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
    rect(dx - 10, top - 10, dw + 20, 12, palette.doorFrame);
    rect(dx - 10, top - 10, 10, dh + 10, palette.doorFrame);
    rect(dx + dw, top - 10, 10, dh + 10, palette.doorFrame);

    rect(-2000, 705, 6000, 900, palette.platform);
    rect(-2000, 712, 6000, 12, palette.safety);
    for (let x = -2000; x < 4000; x += 160) rect(x, 724, 4, 900, palette.platformLine);
    rect(-2000, 800, 6000, 3, palette.platformLine);
  }

  function drawDoorHalf(x, left) {
    const { top, bottom } = DOOR;
    rect(x, top, DOOR_HALF, bottom - top, palette.door);
    rect(left ? x : x + DOOR_HALF - 20, top, 20, bottom - top, palette.doorShade);
    rect(x + 20, top + 38, DOOR_HALF - 40, 120, palette.window);
    ctx.globalAlpha = 0.6;
    poly([[x + 30, top + 38], [x + 50, top + 38], [x + 28, top + 158], [x + 20, top + 158]], palette.windowGlint);
    ctx.globalAlpha = 1;
  }

  function floorShadow(x, w) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = palette.shadow;
    ctx.beginPath();
    ctx.ellipse(x, FLOOR + 4, w, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  const RB = CFG.robot;
  const K = RB.scale;
  const X = RB.x;
  const BAR = CFG.crowbar;
  const LINE_W = 1.4;
  const FULL_LINE_PX = 500;
  let lineW = LINE_W;

  function lineFor(c) {
    const t = c.getTransform();
    const robotPx = Math.sqrt(Math.abs(t.a * t.d - t.b * t.c)) * K * FOOT_Y;
    return Math.min(LINE_W, Math.max(window.XBOT.GAME_LINE, LINE_W * robotPx / FULL_LINE_PX));
  }
  const STAND = { hipNear: 0, kneeNear: 2, ankleNear: -1.4, hipFar: 0, kneeFar: 2, ankleFar: -1.4 };
  const sideRoot = buildSide({ farLimbs: true, propBehindArm: true });
  const backRoot = buildBack({ leftArmBehind: true, rightForeBehind: true });

  function drawCrowbar(c, reach, w, butt) {
    const t = c.getTransform();
    const lw = lineW / Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
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

  function placeRobot(root, m, pose, hooks) {
    ctx.save();
    ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
    renderBot(ctx, root, { pose, hooks, lineW });
    ctx.restore();
  }

  const BAR_TILT = RB.barTilt;
  const FAR_GRIP = RB.farGripOffset;
  const ORIGIN = new DOMPoint(0, 0);

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
    floorShadow(X, 70);
    placeRobot(sideRoot, robotMatrix(SIDE_AX), pose, hooks);
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
    floorShadow(X, 90);
    placeRobot(backRoot, m, pose, {});
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
    const sh = at("shake", t);
    const cx = at("camX", t) + Math.sin(t * 90) * sh * 0.4;
    const cy = at("camY", t) + Math.cos(t * 77) * sh * 0.4;
    ctx.translate(W / 2 - cx * z, H / 2 - cy * z);
    ctx.scale(z, z);
    lineW = lineFor(ctx);
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

window.CUTSCENES = { crowbarDoor: crowbarDoor(window.C28_CONFIG.cutscenes.crowbarDoor), securityCam, filmRect, camClock, kit: { ease, sample, filmRef, placeholder, FILM } };
})();
