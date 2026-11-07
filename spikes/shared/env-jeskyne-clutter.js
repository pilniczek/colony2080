(() => {
const { define, P, G } = window.ENV;
const { rng, path, color, flat, disc, glow, stroke, shape, line, curve } = P;
const { PI, sin, cos, min, max, floor, round } = Math;
const simple = () => window.ENV.simple;
const { within } = window.ENV.VESNICE;
const STEEL = ["#283838", "#3c4c4e", "#506668", "#7a9496", "#0c1212"];
const SHADE = ["#121a14", "#1c2a20", "#26362a", "#3a4c3c"];
const CHECK = ["#545448", "#786c3c", "#9a8c50"];
const CHROME = ["#6c7470", "#a8b0aa", "#d4dad2", "#ffffff"];
const STRAP = ["#2c3a42", "#4a5c64", "#6c8088", "#9ab0b8", "#0a1014"];
const SCREE = ["#30180c", "#483018", "#30240c", "#5c4630", "#8e887a", "#0c0604"];
const GLASS = ["#1e2618", "#3c4830", "#485430", "#6a7650", "#a4ac88"];
const OLIVE = ["#2e2e0e", "#5c5e1c", "#8e8e30", "#c2c05a", "#141404"];
const WOOD = ["#2a180a", "#4a2e14", "#6e4620", "#94683a", "#120a04"];
const IRON = ["#141818", "#262c2c", "#3e4646", "#626c6a", "#060808"];
const ORE = ["#2a2a12", "#4e4e1e", "#74702e", "#a49c4a"];
const RUST = "#7a3414";
const HOLE = "#0a0604";
const clipped = (ctx, pts, draw) => {
  ctx.save();
  path(ctx, pts);
  ctx.clip();
  draw();
  ctx.restore();
};
const shadow = (ctx, x, w, a = 0.45) => {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = HOLE;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, -0.4, w / 2, 1, 0, 0, PI * 2);
  ctx.fill();
  ctx.restore();
};
const lump = (ctx, cx, cy, rx, ry, tones, seed) => {
  const r = rng(seed);
  const n = 6 + floor(r() * 3);
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * PI * 2 + r() * 0.4;
    const k = 0.7 + r() * 0.4;
    return [cx + cos(a) * rx * k, cy + sin(a) * ry * k];
  });
  shape(ctx, pts, tones[1], tones[4] ?? HOLE);
  shape(ctx, [pts[n - 1], pts[0], pts[1], [cx, cy - ry * 0.1]].map(([x, y]) => [x, y]), tones[2]);
  if (!simple()) flat(ctx, cx - rx * 0.4, cy - ry * 0.6, rx * 0.6, 0.8, tones[3]);
  return pts;
};
const checker = (ctx, x, y, w, rows, s) => {
  for (let j = 0; j < rows; j++)
    for (let i = 0; i * s < w; i++)
      flat(ctx, x + i * s, y + j * s, min(s, w - i * s), s, CHECK[(i + j) % 2]);
  if (!simple())
    for (let i = 1; i * s < w; i += 4) flat(ctx, x + i * s, y, s, 1, CHECK[2]);
};
const pressureTank = {
  id: "pressureTank",
  box: [-2, -100, 66, 2],
  draw(ctx, _state, _t, { h = 96 } = {}) {
    const seed = 4100 + round(h);
    const top = -h;
    const body = top + 20;
    shadow(ctx, -1, 50);
    flat(ctx, 0, body, 48, -body, SHADE[1], STEEL[4]);
    const steel = [[0, body], [36, body], [31, body + (-body) * 0.35], [30, body + (-body) * 0.7], [33, 0], [0, 0]];
    ctx.fillStyle = color(STEEL[2]);
    ctx.beginPath();
    ctx.moveTo(0, body);
    ctx.lineTo(36, body);
    ctx.quadraticCurveTo(26, body / 2, 34, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    clipped(ctx, steel, () => {
      flat(ctx, 0, body, 4, -body, STEEL[3]);
      flat(ctx, 4, body, 3, -body, "#64807f");
      flat(ctx, 22, body, 14, -body, STEEL[1]);
      if (!simple())
        for (let x = 8; x < 30; x += 2.5) flat(ctx, x, body, 0.5, -body, (x * 7) % 3 < 1 ? STEEL[3] : STEEL[1]);
      G.grain(ctx, G.rectRegion(ctx, 0, body, 36, -body), seed, 0.55);
      G.drips(ctx, 0, body, 34, -body * 0.4, seed + 1, 3);
      G.rustPatch(ctx, 12, body * 0.25, 3, 2, seed + 2);
    });
    within(ctx, [[30, body, 18, -body]], () => {
      flat(ctx, 40, body, 1, -body, SHADE[2]);
      G.grain(ctx, G.rectRegion(ctx, 30, body, 18, -body), seed + 3, 0.6);
    });
    G.dirt(ctx, 0, body, 48, -body, seed + 4, 0.25);
    flat(ctx, 0, top + 12, 48, 8, STEEL[1], STEEL[4]);
    flat(ctx, 0, top + 12, 22, 8, STEEL[3]);
    flat(ctx, 2, top + 13, 18, 1, CHROME[1]);
    flat(ctx, 6, top + 14, 2, 5, STEEL[0]);
    flat(ctx, 24, top + 15, 24, 2, SHADE[0]);
    flat(ctx, 26, top + 17.5, 20, 1, CHROME[1]);
    flat(ctx, -1, top + 6, 50, 6, CHROME[1], STEEL[4]);
    flat(ctx, -1, top + 6, 50, 1.5, CHROME[2]);
    flat(ctx, -1, top + 10.5, 50, 1.5, CHROME[0]);
    checker(ctx, -1, top, 50, 2, 3);
    ctx.beginPath();
    ctx.rect(-1, top, 50, 6);
    stroke(ctx, STEEL[4]);
    if (!simple()) glow(ctx, 13, top + 8, 14, CHROME[3], 0.7);
    glow(ctx, 13, top + 8, 6, CHROME[3], 0.9);
    flat(ctx, 7, top + 7.6, 12, 0.8, CHROME[3]);
    G.chips(ctx, -1, top + 0.4, 50, seed + 5, G.DIRT);
    G.chips(ctx, 0, top + 12.4, 48, seed + 6);
    const sx = 58;
    const strap = [[sx - 2, top + 4], [sx + 3, top + 4], [sx - 1, top + h * 0.5], [sx + 3, 0], [sx - 2, 0], [sx - 6, top + h * 0.5]];
    ctx.fillStyle = color(STRAP[1]);
    ctx.beginPath();
    ctx.moveTo(sx - 2, top + 4);
    ctx.lineTo(sx + 3, top + 4);
    ctx.quadraticCurveTo(sx - 3, top + h * 0.5, sx + 3, 0);
    ctx.lineTo(sx - 2, 0);
    ctx.quadraticCurveTo(sx - 8, top + h * 0.5, sx - 2, top + 4);
    ctx.closePath();
    ctx.fill();
    stroke(ctx, STRAP[4]);
    curve(ctx, [[sx + 1.6, top + 6], [sx - 3.6, top + h * 0.5], [sx + 1.6, -2]], STRAP[3], 0.9);
    clipped(ctx, strap, () => G.grain(ctx, G.polyRegion(ctx, strap), seed + 7, 0.6));
    flat(ctx, sx - 4, top + 2, 9, 3, STEEL[1], STEEL[4]);
  },
};
const SCREE_T = [[SCREE[0], SCREE[3]], [SCREE[1], SCREE[4]], [SCREE[2], SCREE[3]]];
const slabAt = (ctx, x, hgt, wid, lean, tones, seed) => {
  const pts = [[x, 0], [x + lean, -hgt], [x + lean + wid, -hgt + wid * 0.45], [x + wid * 1.3, 0]];
  shape(ctx, pts, tones[0], SCREE[5]);
  if (!simple() || hgt > 8) line(ctx, [[x + lean * 0.3, -hgt * 0.3], [x + lean + 0.4, -hgt + 0.5], [x + lean + wid * 0.6, -hgt + wid * 0.27]], SCREE[4], 0.9);
  clipped(ctx, pts, () => {
    shape(ctx, [[x + lean * 0.5, -hgt * 0.5], [x + lean + 2, -hgt + 1], [x + lean + wid * 0.5, -hgt + 2], [x + wid * 0.6, -hgt * 0.35]], tones[1]);
    G.grain(ctx, G.polyRegion(ctx, pts), seed, 0.8);
    G.dirt(ctx, x, -hgt, wid + lean, hgt, seed + 1, 0.5);
  });
  return pts;
};
const crystalChip = (ctx, x, y, s, a) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  const pts = [[0, -s], [s * 0.45, 0], [0, s * 0.35], [-s * 0.45, 0]];
  shape(ctx, pts, "#9ab8c0", "#1a2428");
  shape(ctx, [[0, -s], [s * 0.45, 0], [0, 0]], "#e4f4f4");
  ctx.restore();
};
const screeHeap = {
  id: "screeHeap",
  box: [-2, -28, 78, 2],
  draw(ctx, state, _t, { w = 72 } = {}) {
    const seed = 4200 + state * 13 + round(w);
    const r = rng(seed);
    const heap = [[0, 0], [w * 0.1, -6], [w * 0.4, -12], [w * 0.65, -10], [w * 0.9, -5], [w, 0]];
    shape(ctx, heap, SCREE[0], SCREE[5]);
    G.grain(ctx, G.polyRegion(ctx, heap), seed + 1);
    if (state === 1) {
      const n = round(w / 3);
      for (let k = 0; k < n; k++) {
        const x = 2 + r() * (w - 8);
        const hgt = 3 + r() * 9 * sin((x / w) * PI);
        ctx.save();
        ctx.translate(x, -hgt * 0.5);
        ctx.rotate(-0.6 + r() * 0.5);
        const s = 3 + r() * 4;
        const fl = [[-s, 0], [-s * 0.4, -1.6], [s, -0.8], [s * 0.5, 1]];
        shape(ctx, fl, SCREE_T[floor(r() * 3)][r() < 0.5 ? 0 : 1], SCREE[5]);
        if (!simple()) line(ctx, [[-s, 0], [-s * 0.4, -1.6], [s, -0.8]], SCREE[4], 0.5);
        ctx.restore();
      }
      for (let k = 0; k < round(w / 9); k++) {
        const x = 4 + r() * (w - 8);
        crystalChip(ctx, x, -2 - r() * 8 * sin((x / w) * PI), 2.2 + r() * 2, (r() - 0.5) * 1.2);
      }
    }
    else {
      const n = max(3, round(w / 11));
      for (let k = 0; k < n; k++) {
        const x = (k / n) * (w - 10) + r() * 3;
        const mid = sin(((x + 6) / w) * PI);
        slabAt(ctx, x, 6 + mid * 10 * (0.6 + r() * 0.4), 7 + r() * 5, 8 + r() * 6, SCREE_T[floor(r() * 3)], seed + 10 + k);
      }
      for (let k = 0; k < round(w / 14); k++) slabAt(ctx, r() * (w - 8), 3 + r() * 4, 4 + r() * 3, 3 + r() * 2, SCREE_T[floor(r() * 3)], seed + 40 + k);
    }
    G.chips(ctx, 0, -1.4, w, seed + 2, SCREE[4]);
  },
};
const DOME = { cx: 30, cy: -60, rx: 24, ry: 34 };
const domePath = (ctx) => {
  ctx.beginPath();
  ctx.ellipse(DOME.cx, DOME.cy, DOME.rx, DOME.ry, 0, PI / 2, PI * 1.5);
  ctx.closePath();
};
const caveLamp = {
  id: "caveLamp",
  box: [-4, -100, 40, -22],
  draw(ctx, state) {
    const lit = state === 0;
    const { cx, cy, rx, ry } = DOME;
    domePath(ctx);
    ctx.fillStyle = color(lit ? GLASS[2] : GLASS[0]);
    ctx.fill();
    ctx.save();
    domePath(ctx);
    ctx.clip();
    const arcs = lit ? [[0.92, GLASS[3], 2.4], [0.72, GLASS[1], 3], [0.55, GLASS[3], 1.6], [0.35, GLASS[4], 1]] : [[0.85, GLASS[1], 2], [0.5, GLASS[1], 1.2]];
    for (const [k, c, wd] of arcs) {
      ctx.strokeStyle = color(c);
      ctx.lineWidth = wd;
      ctx.beginPath();
      ctx.ellipse(cx + rx * (1 - k) * 0.6, cy - ry * (1 - k) * 0.3, rx * k, ry * k, 0, PI / 2, PI * 1.5);
      ctx.stroke();
    }
    if (!lit && !simple()) line(ctx, [[cx - 14, cy - 18], [cx - 8, cy - 8], [cx - 12, cy + 2], [cx - 4, cy + 10]], GLASS[4], 0.6);
    G.grain(ctx, () => domePath(ctx), 4301, 0.35);
    ctx.restore();
    domePath(ctx);
    stroke(ctx, "#0a0e06", 1.2);
    flat(ctx, cx - 1, cy - ry - 1, 3, ry * 2 + 2, SHADE[1], STEEL[4]);
    flat(ctx, cx - 1, cy - ry - 1, 1, ry * 2 + 2, GLASS[3]);
    for (const y of [cy - ry + 3, cy + ry - 4]) flat(ctx, cx - 2, y - 1.5, 4, 3, STEEL[1], STEEL[4]);
    G.drips(ctx, cx - 1, cy + ry, 3, 8, 4302, 1);
    if (lit) {
      const gx = cx - 4, gy = cy - ry + 10;
      if (!simple()) glow(ctx, gx, gy, 26, "#fcfcfc", 0.5);
      glow(ctx, gx, gy, 10, "#ffffff", 0.95);
      disc(ctx, gx, gy, 3.5, "#ffffff");
      ctx.save();
      ctx.globalAlpha = 0.85;
      flat(ctx, gx - 30, gy - 0.4, 34, 0.8, "#fcfcfc");
      ctx.globalAlpha = 0.5;
      flat(ctx, gx - 16, gy - 1, 20, 2, "#fcfcfc");
      ctx.restore();
    }
  },
};
const EX_W = 48, EX_H = 9;
const explosiveSign = {
  id: "explosiveSign",
  box: [-2, -100, 50, -78],
  draw(ctx, state) {
    const y = -98;
    const red = state === 1;
    flat(ctx, 3, y + EX_H, 14, 9, STEEL[1], STEEL[4]);
    flat(ctx, 3, y + EX_H, 14, 2, CHROME[0]);
    flat(ctx, 5, y + EX_H + 3, 2, 5, STEEL[0]);
    flat(ctx, 0, y, EX_W, EX_H, red ? "#9a2a14" : "#8c968a", STEEL[4]);
    flat(ctx, 0, y, EX_W, 1.2, red ? "#c84a2a" : "#b4bcae");
    flat(ctx, 0, y + EX_H - 1.4, EX_W, 1.4, red ? "#5a160a" : "#5a6658");
    if (red && !simple()) {
      within(ctx, [[0, y, EX_W, 1.6], [0, y + EX_H - 1.6, EX_W, 1.6]], () => P.hazard(ctx, 0, y, EX_W, EX_H, 2.5, { fill: "#e8c21a", dark: "#141414", line: "#141414" }));
    }
    ctx.save();
    ctx.font = `900 ${EX_H - 2.2}px "Arial Narrow", "Liberation Sans Narrow", Impact, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const m = ctx.measureText("EXPLOSIVE").width;
    ctx.translate(EX_W / 2, y + EX_H / 2 + 0.3);
    ctx.scale(min(1.4, (EX_W - 4) / m), 1);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = red ? "#2a0804" : "#2a2a14";
    ctx.lineJoin = "round";
    ctx.strokeText("EXPLOSIVE", 0, 0);
    ctx.fillStyle = red ? "#f4e0a0" : "#6e6420";
    ctx.fillText("EXPLOSIVE", 0, 0);
    ctx.restore();
    for (const x of [1.6, EX_W - 1.6]) disc(ctx, x, y + EX_H / 2, 0.7, STEEL[0]);
    within(ctx, [[0, y, EX_W, EX_H]], () => {
      G.grain(ctx, G.rectRegion(ctx, 0, y, EX_W, EX_H), 4400 + state, 0.5);
      G.drips(ctx, 0, y + 1, EX_W, 7, 4401 + state, 3);
    });
    G.chips(ctx, 0, y + 0.3, EX_W, 4402, G.DIRT);
  },
};
const wheel = (ctx, x, y, r) => {
  disc(ctx, x, y, r, IRON[1], IRON[4]);
  disc(ctx, x, y, r * 0.6, IRON[2]);
  disc(ctx, x, y, r * 0.25, IRON[3]);
  if (!simple()) flat(ctx, x - r * 0.7, y - r * 0.15, r * 1.4, r * 0.3, IRON[0]);
};
const tippedCart = (ctx, seed) => {
  const r = rng(seed);
  line(ctx, [[0, -1.5], [56, -1.5], [64, -4], [70, -9]], IRON[4], 3);
  line(ctx, [[0, -1.5], [56, -1.5], [64, -4], [70, -9]], IRON[3], 1.6);
  if (!simple())
    for (const x of [4, 14, 24]) flat(ctx, x, -1.2, 5, 1.6, WOOD[1]);
  for (let k = 0; k < 9; k++) lump(ctx, 4 + k * 3.2 + r() * 2, -2 - r() * 2 - (k > 5 ? 3 : 0), 2.8 + r() * 1.6, 2 + r() * 1.2, ORE, seed + 10 + k);
  ctx.save();
  ctx.translate(60, 0);
  ctx.rotate(PI + 0.25);
  const body = [[0, 0], [44, 0], [40, 17], [4, 17]];
  shape(ctx, body, OLIVE[1]);
  shape(ctx, [[1, 0.5], [43, 0.5], [42.5, 3], [1.5, 3]], OLIVE[3]);
  shape(ctx, [[3, 13], [41, 13], [40, 17], [4, 17]], OLIVE[0]);
  for (const cx of [14, 26]) line(ctx, [[cx - 3, 6], [cx + 1, 9], [cx - 3, 12]], OLIVE[0], 1.6);
  clipped(ctx, body, () => {
    G.grain(ctx, G.polyRegion(ctx, body), seed + 1);
    G.rustPatch(ctx, 30, 9, 4, 2.5, seed + 2);
    G.drips(ctx, 0, 3, 44, 8, seed + 3, 3);
  });
  path(ctx, body);
  stroke(ctx, OLIVE[4]);
  for (const wx of [10, 34]) {
    line(ctx, [[wx, 17], [wx, 19.5]], IRON[4], 1.4);
    wheel(ctx, wx, 20.5, 3.8);
  }
  ctx.restore();
  for (let k = 0; k < 4; k++) lump(ctx, 14 + r() * 12, -2 - r() * 2, 2.4 + r() * 1.4, 1.8 + r(), ORE, seed + 30 + k);
  
};
const rockDrill = (ctx, seed) => {
  const r = rng(seed);
  const track = [[4, -14], [70, -14], [76, -7], [70, 0], [6, 0], [0, -7]];
  shape(ctx, track, IRON[1], IRON[4]);
  if (!simple())
    for (let x = 5; x < 72; x += 3) line(ctx, [[x, -14], [x, -12.4]], IRON[3], 0.8);
  for (let k = 0; k < 6; k++) wheel(ctx, 8 + k * 12, -7, 4.6);
  clipped(ctx, track, () => G.dirt(ctx, 0, -14, 76, 14, seed + 1, 0.7));
  const cab = [[8, -14], [8, -40], [14, -46], [36, -46], [40, -40], [40, -14]];
  shape(ctx, cab, OLIVE[1], OLIVE[4]);
  flat(ctx, 8, -40, 32, 2, OLIVE[3]);
  shape(ctx, [[14, -42], [34, -42], [36, -32], [14, -32]], HOLE);
  if (!simple()) line(ctx, [[16, -41], [22, -36], [20, -33]], "#4a5444", 0.6);
  flat(ctx, 40, -30, 26, 16, OLIVE[1], OLIVE[4]);
  flat(ctx, 40, -30, 26, 2, OLIVE[2]);
  if (!simple())
    for (let y = -26; y < -16; y += 3) flat(ctx, 44, y, 14, 1.2, OLIVE[0]);
  clipped(ctx, cab, () => {
    G.grain(ctx, G.polyRegion(ctx, cab), seed + 2);
    G.drips(ctx, 8, -40, 32, 18, seed + 3, 3);
    G.rustPatch(ctx, 30, -20, 4, 2, seed + 4);
  });
  G.inside(ctx, G.rectRegion(ctx, 40, -30, 26, 16), () => {
    G.grain(ctx, G.rectRegion(ctx, 40, -30, 26, 16), seed + 5);
    G.dirt(ctx, 40, -30, 26, 16, seed + 6, 0.5);
  });
  disc(ctx, 60, -34, 3, IRON[2], IRON[4]);
  line(ctx, [[60, -34], [98, -44]], IRON[4], 6.4);
  line(ctx, [[60, -34], [98, -44]], "#6a3a1c", 5);
  line(ctx, [[61, -35.5], [97, -45.5]], "#9a5a2a", 1.2);
  if (!simple())
    for (let k = 0; k < 4; k++) G.rustPatch(ctx, 66 + k * 8 + r() * 3, -36 - k * 2, 2.4, 1.4, seed + 7 + k);
  flat(ctx, 96, -50, 6, 12, IRON[2], IRON[4]);
  ctx.save();
  ctx.translate(102, -44);
  ctx.rotate(-0.26);
  flat(ctx, 0, -1.6, 16, 3.2, IRON[3], IRON[4]);
  for (let x = 1; x < 15; x += 2.6) line(ctx, [[x, -1.6], [x + 1.6, 1.6]], IRON[1], 0.8);
  shape(ctx, [[16, -1.6], [20, 0], [16, 1.6]], CHROME[1], IRON[4]);
  ctx.restore();
  flat(ctx, 30, -50, 7, 4, IRON[2], IRON[4]);
  shape(ctx, [[37, -51], [41, -53], [41, -43], [37, -45]], IRON[1], IRON[4]);
  shape(ctx, [[41, -52], [42, -50], [41.4, -48], [42, -46], [41, -44]], "#2a3024");
  line(ctx, [[42, -50], [44, -49], [43, -47]], CHROME[0], 0.6);
  G.chips(ctx, 14, -45.6, 22, seed + 8, G.DIRT);
  for (let k = 0; k < 4; k++) lump(ctx, 102 + r() * 14, -1.6 - r(), 2 + r() * 1.4, 1.4 + r() * 0.6, SCREE.slice(0, 4), seed + 20 + k);
};
const mineWreck = {
  id: "mineWreck",
  box: [-4, -64, 124, 2],
  draw(ctx, state) {
    const seed = 4500 + state * 9;
    shadow(ctx, 0, state === 1 ? 80 : 60);
    if (state === 1) rockDrill(ctx, seed);
    else tippedCart(ctx, seed);
  },
};
const keg = (ctx, x, y, seed, burst = false) => {
  const w = 14, h = 20;
  const pts = [[x + 1.5, y], [x + w - 1.5, y], [x + w, y + h * 0.3], [x + w, y + h * 0.7], [x + w - 1.5, y + h], [x + 1.5, y + h], [x, y + h * 0.7], [x, y + h * 0.3]];
  if (burst) {
    const staves = [[x + 1, y + h], [x - 3, y + 8], [x + 2, y + 10], [x + 4, y + 3], [x + 7, y + 9], [x + 10, y + 2], [x + 12, y + 9], [x + 17, y + 7], [x + w - 1, y + h]];
    shape(ctx, staves, WOOD[2], WOOD[4]);
    clipped(ctx, staves, () => {
      for (let k = 2; k < w; k += 3) flat(ctx, x + k, y, 0.6, h, WOOD[1]);
      G.scorch(ctx, [[x + 2, y + 6], [x + 12, y + 6], [x + 12, y + 14], [x + 2, y + 14]], seed + 1);
      G.grain(ctx, G.polyRegion(ctx, staves), seed, 0.8);
    });
    flat(ctx, x - 0.5, y + 15, w + 1, 1.6, IRON[1], IRON[4]);
    ctx.strokeStyle = color(IRON[2]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x - 2, y + h - 1, 5, 1.6, 0.2, PI, PI * 2);
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.7;
    shape(ctx, [[x + w - 2, y + h], [x + w + 4, y + h - 1.4], [x + w + 12, y + h - 0.6], [x + w + 13, y + h + 0.6], [x + w, y + h + 0.6]], "#141010");
    ctx.restore();
    if (!simple())
      for (let k = 0; k < 4; k++) flat(ctx, x + w + 2 + k * 2.6, y + h - 1.2 - (k % 2), 0.8, 0.8, "#3a3430");
    return;
  }
  shape(ctx, pts, WOOD[2], WOOD[4]);
  clipped(ctx, pts, () => {
    flat(ctx, x, y, 3, h, WOOD[1]);
    flat(ctx, x + w - 3, y, 3, h, WOOD[1]);
    flat(ctx, x + 4, y, 2, h, WOOD[3]);
    if (!simple())
      for (let k = 3; k < w; k += 3) flat(ctx, x + k, y, 0.5, h, WOOD[0]);
    for (const k of [2.5, 7.5, 12.5, 17.5]) flat(ctx, x - 1, y + k - 0.8, w + 2, 1.6, IRON[1]);
    flat(ctx, x - 1, y + 2.5 - 0.8, w + 2, 0.5, IRON[3]);
    G.grain(ctx, G.polyRegion(ctx, pts), seed, 0.7);
    G.rustPatch(ctx, x + 9, y + 17.5, 2.4, 1, seed + 2);
    G.dirt(ctx, x, y, w, h, seed + 3, 0.35);
  });
  shape(ctx, [[x + 7, y + 8.6], [x + 9.6, y + 10], [x + 7, y + 11.4], [x + 4.4, y + 10]], "#a82010", "#3a0804");
  if (!simple()) flat(ctx, x + 6.4, y + 9.4, 1.2, 1.2, "#e8c21a");
  flat(ctx, x + 1, y - 0.8, w - 2, 1.6, WOOD[3], WOOD[4]);
};
const powderKeg = {
  id: "powderKeg",
  box: [-8, -42, 44, 2],
  draw(ctx, state) {
    const seed = 4600 + state * 7;
    shadow(ctx, -2, state === 1 ? 34 : 22);
    if (state === 1) {
      keg(ctx, 0, -20, seed);
      keg(ctx, 15, -20, seed + 10);
      keg(ctx, 7.5, -40.4, seed + 20);
    }
    else keg(ctx, 2, -20, seed, state === 2);
    G.chips(ctx, -2, -0.8, state === 1 ? 32 : 20, seed + 30, G.DUST);
  },
};
const crateBox = (ctx, x, y, w, h, seed) => {
  flat(ctx, x, y, w, h, WOOD[2], WOOD[4]);
  for (let k = 0; k < h; k += 4) flat(ctx, x, y + k + 3.4, w, 0.6, WOOD[0]);
  flat(ctx, x, y, w, 1, WOOD[3]);
  line(ctx, [[x + 2, y + h - 2], [x + w - 2, y + 2]], WOOD[1], 2);
  for (const [cx, cy] of [[x, y], [x + w - 3, y], [x, y + h - 3], [x + w - 3, y + h - 3]]) {
    flat(ctx, cx, cy, 3, 3, IRON[2], IRON[4]);
    if (!simple()) disc(ctx, cx + 1.5, cy + 1.5, 0.5, IRON[3]);
  }
  G.inside(ctx, G.rectRegion(ctx, x, y, w, h), () => {
    G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed);
    G.dirt(ctx, x, y, w, h, seed + 1, 0.45);
    G.drips(ctx, x + 2, y + h - 3, w - 4, 3, seed + 2, 2);
  });
  G.chips(ctx, x, y + 0.4, w, seed + 3, G.DIRT);
};
const pickaxe = (ctx, x, y) => {
  line(ctx, [[x, y], [x + 7, y - 20]], WOOD[4], 2.2);
  line(ctx, [[x, y], [x + 7, y - 20]], WOOD[3], 1.2);
  curve(ctx, [[x + 1, y - 21], [x + 7, y - 22.5], [x + 14, y - 19]], IRON[4], 2.4);
  curve(ctx, [[x + 1, y - 21], [x + 7, y - 22.5], [x + 14, y - 19]], IRON[3], 1.2);
};
const shovel = (ctx, x, y) => {
  line(ctx, [[x, y - 2], [x - 4, y - 24]], WOOD[4], 2.2);
  line(ctx, [[x, y - 2], [x - 4, y - 24]], WOOD[3], 1.2);
  line(ctx, [[x - 6, y - 24.4], [x - 2, y - 25.2]], IRON[3], 1.4);
  shape(ctx, [[x - 2, y - 4], [x + 3, y - 5], [x + 4.4, y + 0.2], [x + 1, y + 0.4], [x - 1.6, y - 1]], IRON[2], IRON[4]);
};
const toolCrate = {
  id: "toolCrate",
  box: [-6, -30, 40, 2],
  draw(ctx, state) {
    const seed = 4700 + state * 5;
    const r = rng(seed);
    shadow(ctx, -2, 30);
    if (state === 2) {
      const planks = [[0, -3, 14, 3, 0.1], [12, -3, 15, 3, -0.15], [4, -6, 12, 3, 0.35], [18, -7, 9, 3, -0.6], [2, -9, 3, 9, 0]];
      for (const [x, y, w, h, a] of planks) {
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        ctx.rotate(a);
        flat(ctx, -w / 2, -h / 2, w, h, WOOD[r() < 0.5 ? 2 : 1], WOOD[4]);
        flat(ctx, -w / 2, -h / 2, w, 0.8, WOOD[3]);
        line(ctx, [[w / 2, -h / 2], [w / 2 - 1.4, 0], [w / 2, h / 2]], WOOD[4], 0.6);
        G.grain(ctx, G.rectRegion(ctx, -w / 2, -h / 2, w, h), seed + x);
        ctx.restore();
      }
      flat(ctx, 1, -10, 3, 3, IRON[2], IRON[4]);
      line(ctx, [[24, -2], [28, -5], [30, -3]], IRON[3], 1.2);
      flat(ctx, 27, -9, 3, 3, IRON[2], IRON[4]);
      return;
    }
    if (state === 1) {
      const pile = [[1, -16], [5, -21], [11, -23], [18, -22], [24, -19], [27, -16]];
      shape(ctx, pile, ORE[1]);
      for (let k = 0; k < 8; k++) lump(ctx, 3 + k * 3 + r() * 2, -17.5 - sin(((k + 0.5) / 8) * PI) * 4 + r(), 2.4 + r(), 1.8 + r() * 0.6, ORE, seed + 10 + k);
      crateBox(ctx, 0, -16, 28, 16, seed);
      lump(ctx, 31, -1.6, 2, 1.4, ORE, seed + 30);
      return;
    }
    flat(ctx, 1, -18, 26, 2.4, HOLE);
    shovel(ctx, 21, -12);
    pickaxe(ctx, 3, -10);
    crateBox(ctx, 0, -16, 28, 16, seed);
    ctx.save();
    ctx.translate(-2, -17);
    ctx.rotate(-0.25);
    flat(ctx, 0, -2, 14, 2.4, WOOD[2], WOOD[4]);
    flat(ctx, 0, -2, 14, 0.7, WOOD[3]);
    ctx.restore();
  },
};
for (const asset of [pressureTank, screeHeap, caveLamp, explosiveSign, mineWreck, powderKeg, toolCrate]) define(asset);
})();
