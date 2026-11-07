(() => {
const { define, P, G } = window.ENV;
const { rng, flat, shape, line, curve, stroke, color } = P;
const { PI, sin, cos, min, max, floor, ceil, round } = Math;
const simple = () => window.ENV.simple;
const HANG = ["#141e12", "#26341f", "#3a4a34", "#56684a", "#0c120a"];
const SHUT = ["#3c362c", "#6c6054", "#84786c", "#b4ac9c", "#1a160e"];
const TAN = ["#3c3018", "#544830", "#786c54", "#9c9078", "#18120a"];
const OFF = ["#3c3018", "#544830", "#62563c", "#76694e", "#18140c"];
const GLS = ["#1e3a34", "#2e5a52", "#48786c", "#6c9c90", "#0c1814"];
const FRAME = "#c0b49c";
const COL = ["#2c2a1e", "#483c24", "#545448", "#7c7a68", "#121008"];
const CON = ["#2e2618", "#4a3e28", "#5e5034", "#7a6a4a", "#16120a"];
const MOSS = ["#18200e", "#24301a", "#303c24", "#485434"];
const PIPE = ["#2e2818", "#5a5040", "#7a705c", "#c8c0a8", "#121008"];
const RUSTY = ["#2a160a", "#4e2e14", "#6c4a24", "#8c6a3c", "#120a04"];
const BRACE = ["#24281a", "#3c4030", "#5a5a44", "#7a7a60", "#0c0e08"];
const COND = ["#1a2018", "#3c4838", "#5a6a58", "#8a9a88", "#0a0e08"];
const TANK = ["#2e2a20", "#5a5446", "#847a68", "#c0b8a4", "#14120c"];
const STAND = ["#3c3c34", "#6c6c60", "#8a8a7c", "#aeb2a6", "#1a1a14"];
const LIT = ["#d89030", "#e4c03c", "#c09c48", "#9c9c48", "#6c7830", "#6c6030", "#b47c2c"];
const DEAD = ["#3a3a22", "#44422a", "#36341e", "#4a4630"];
const BAY = ["#1c2626", "#303c3c", "#3c6060", "#5a7a78", "#0a1010"];
const MECH = ["#542400", "#9c6c18", "#c07824", "#e49018", "#f0b430"];
const JOINT = ["#243838", "#3c6060", "#a8a8a0", "#d0d0c8"];
const CASE = ["#5a5a50", "#848478", "#a8a89c", "#c8c8bc", "#24241c"];
const GRN = ["#0e160e", "#182418", "#24382a", "#3a5a48", "#060a06"];
const BLOOD = ["#5a1408", "#8a2a10", "#b4300c", "#786048", "#b48460"];
const HOLE = "#0c0a06";
const MARGIN = 24;
const shown = (ctx) => {
  const m = ctx.getTransform();
  if (m.b || m.c || !m.a || !m.d) return [-Infinity, -Infinity, Infinity, Infinity];
  const xa = -m.e / m.a, xb = (ctx.canvas.width - m.e) / m.a;
  const ya = -m.f / m.d, yb = (ctx.canvas.height - m.f) / m.d;
  return [min(xa, xb) - MARGIN, min(ya, yb) - MARGIN, max(xa, xb) + MARGIN, max(ya, yb) + MARGIN];
};
const eachCell = (ctx, x, y, w, h, cw, ch, draw) => {
  const [vx0, vy0, vx1, vy1] = shown(ctx);
  const i0 = max(0, floor((vx0 - x) / cw)), i1 = min(ceil(w / cw - 0.001), ceil((vx1 - x) / cw));
  const j0 = max(0, floor((vy0 - y) / ch)), j1 = min(ceil(h / ch - 0.001), ceil((vy1 - y) / ch));
  for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) draw(x + i * cw, y + j * ch, i, j);
};
const within = (ctx, rects, draw) => {
  ctx.save();
  ctx.beginPath();
  for (const [x, y, w, h] of rects) ctx.rect(x, y, w, h);
  ctx.clip();
  draw();
  ctx.restore();
};
const ellipse = (ctx, cx, cy, rx, ry, fill, edge = null) => {
  ctx.fillStyle = color(fill);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, PI * 2);
  ctx.fill();
  if (edge) stroke(ctx, edge);
};
const rect = G.rectPts;
const vPipe = (ctx, x, y0, y1, d, T, joint = 24) => {
  flat(ctx, x, y1, d, y0 - y1, T[1], T[4]);
  flat(ctx, x + d * 0.1, y1, d * 0.16, y0 - y1, T[2]);
  flat(ctx, x + d * 0.5, y1, d * 0.14, y0 - y1, T[3]);
  flat(ctx, x + d * 0.64, y1, d * 0.1, y0 - y1, T[2]);
  flat(ctx, x + d * 0.8, y1, d * 0.2, y0 - y1, T[0]);
  if (!joint) return;
  for (let y = y0 - joint; y > y1 + 2; y -= joint) {
    flat(ctx, x, y, d, 0.9, "#d0ccb8");
    flat(ctx, x, y + 0.9, d, 0.8, T[0]);
  }
};
const hPipe = (ctx, x0, x1, y, d, T) => {
  flat(ctx, x0, y, x1 - x0, d, T[1], T[4]);
  flat(ctx, x0, y + d * 0.08, x1 - x0, d * 0.16, T[2]);
  flat(ctx, x0, y + d * 0.3, x1 - x0, d * 0.14, T[3]);
  flat(ctx, x0, y + d * 0.44, x1 - x0, d * 0.12, T[2]);
  flat(ctx, x0, y + d * 0.76, x1 - x0, d * 0.24, T[0]);
};

const shutter = (ctx, w, y0, seed) => {
  const top = y0, h = 15;
  flat(ctx, 0, top, w, h, SHUT[1]);
  const pitch = simple() ? 6 : 3;
  eachCell(ctx, 0, top, w, h, 24, h, (x, _y, i) => {
    const r = rng(seed + i * 53);
    for (let sx = x; sx < min(w, x + 24); sx += pitch) {
      const k = r();
      flat(ctx, sx, top, pitch * 0.55, h, k < 0.2 ? SHUT[3] : k < 0.55 ? SHUT[2] : SHUT[1]);
      flat(ctx, sx + pitch * 0.55, top, pitch * 0.2, h, SHUT[0]);
      if (k > 0.93) flat(ctx, sx, top, 0.9, h, "#e0d8c4");
    }
  });
  flat(ctx, 0, top, w, 1, SHUT[4]);
  flat(ctx, 0, top + h - 2, w, 2, SHUT[0]);
  const ry = top + h;
  flat(ctx, 0, ry, w, 5, "#2e3a36", SHUT[4]);
  eachCell(ctx, 0, ry, w, 5, 12, 5, (x, _y, i) => {
    flat(ctx, x + 1, ry + 1, 7, 1.5, i % 2 ? "#b8c4bc" : "#d0d8d0");
    flat(ctx, x + 8, ry + 1, 3, 1.5, "#48786c");
    flat(ctx, x + 1, ry + 3, 10, 1, "#1a2220");
  });
  flat(ctx, 0, ry + 5, w, -ry - 5, "#14100a");
  G.inside(ctx, G.rectRegion(ctx, 0, top, w, h + 5), () => {
    G.grain(ctx, G.rectRegion(ctx, 0, top, w, h + 5), seed + 1, 0.8);
    G.dirt(ctx, 0, top, w, h, seed + 2, 0.4);
    eachCell(ctx, 0, top, w, h, 48, h, (x, _y, i) => {
      if (rng(seed + 7 + i)() < 0.45) G.rustPatch(ctx, x + 10 + rng(seed + 9 + i)() * 24, top + 9, 3, 1.5, seed + 11 + i);
    });
  });
  G.chips(ctx, 0, top + 0.6, w, seed + 3, G.DIRT);
};

define({
  id: "depotHangar",
  box: [0, -96, 192, 0],
  draw(ctx, state, _t, { w = 192 } = {}) {
    const seed = 7100 + round(w);
    if (state === 1) {
      shutter(ctx, w, -24, seed);
      return;
    }
    flat(ctx, 0, -96, w, 24, "#16110c");
    flat(ctx, 0, -86, w, 0.8, "#2a2018");
    eachCell(ctx, 0, -96, w, 24, 24, 24, (x) => {
      flat(ctx, x + 15, -96, 5, 24, TAN[2], TAN[4]);
      flat(ctx, x + 15, -96, 1.2, 24, TAN[3]);
      flat(ctx, x + 18.5, -96, 1.5, 24, TAN[0]);
    });
    const top = -72, h = 48;
    flat(ctx, 0, top, w, h, HANG[1]);
    const pitch = simple() ? 8 : 6;
    eachCell(ctx, 0, top, w, h, 24, h, (x) => {
      for (let sx = x; sx < min(w, x + 24); sx += pitch) {
        flat(ctx, sx, top, pitch * 0.3, h, HANG[2]);
        flat(ctx, sx + pitch * 0.3, top, pitch * 0.18, h, HANG[3]);
        flat(ctx, sx + pitch * 0.82, top, 0.7, h, "#3c4c58");
      }
    });
    flat(ctx, 0, top, w, 3, HANG[0]);
    flat(ctx, 0, top + h - 7, w, 7, HANG[0]);
    flat(ctx, 0, top + h - 7, w, 1, HANG[2]);
    G.inside(ctx, G.rectRegion(ctx, 0, top, w, h), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, top, w, h), seed + 1, 0.55);
      eachCell(ctx, 0, top, w, h, 24, h, (x, _y, i) => {
        if (rng(seed + 20 + i)() < 0.6) G.drips(ctx, x + 14, top, 8, 22, seed + 21 + i, 1);
      });
      G.drips(ctx, 0, top + 3, w, 30, seed + 2, round(w / 40), false);
      G.dirt(ctx, 0, top, w, h, seed + 3, 0.2);
    });
    G.chips(ctx, 0, top + 0.5, w, seed + 4, G.DIRT);
    within(ctx, [[0, -96, w, 24]], () => G.dirt(ctx, 0, -96, w, 24, seed + 5, 0.4));
    shutter(ctx, w, -24, seed + 6);
  }
});

const windowAt = (ctx, x, y, ww, wh) => {
  flat(ctx, x, y, ww, wh, GLS[2], GLS[4]);
  flat(ctx, x + ww - 3, y, 3, wh, GLS[1]);
  flat(ctx, x, y, ww, 1.4, GLS[0]);
  if (!simple()) shape(ctx, [[x + 6, y + wh], [x + 9, y + wh], [x + 14, y], [x + 11, y]], GLS[3]);
  flat(ctx, x, y, 1.6, wh, FRAME);
  return rect(x, y, ww, wh);
};

define({
  id: "depotOffice",
  box: [0, -96, 192, 0],
  draw(ctx, state, _t, { w = 192, h = 96 } = {}) {
    const seed = 7200 + state * 37 + round(w) + round(h) * 3;
    const top = -h;
    const holes = [];
    flat(ctx, 0, top, w, h, OFF[2]);
    if (state === 1) {
      eachCell(ctx, 0, top, w, h, 48, h, (x) => {
        flat(ctx, x + 24, top, 24, h, OFF[1]);
        flat(ctx, x + 24, top, 8, h, "#20160c");
        flat(ctx, x + 32, top, 4, h, "#3a2c18");
        flat(ctx, x + 46, top, 2, h, OFF[0]);
        flat(ctx, x, top, 1.5, h, OFF[3]);
        flat(ctx, x + 22, top, 2, h, OFF[1]);
        flat(ctx, x, top, 24, 4, "#9c9078");
        holes.push(windowAt(ctx, x, top + 4, 24, 16));
        for (let k = 0; k < 3; k++) flat(ctx, x + 30, top + 34 + k * 3, 14, 1.4, "#120c06");
        for (let y = top + 24 + 20; y < -6; y += 24) {
          flat(ctx, x, y, 24, 1, OFF[0]);
          flat(ctx, x, y + 1, 24, 3, OFF[3]);
        }
      });
    } else {
      eachCell(ctx, 0, top, w, h, 24, 24, (x, y, i, j) => {
        const r = rng(seed + i * 131 + j * 977);
        flat(ctx, x, y + 19, 24, 1, OFF[1]);
        flat(ctx, x, y + 20, 24, 4, OFF[3]);
        if (i % 4 === 0) {
          flat(ctx, x, y, 9, 24, "#24180e");
          flat(ctx, x + 9, y, 4, 24, "#3c2c18");
        } else if (j < h / 24 - 1 && r() < 0.32) holes.push(windowAt(ctx, x + 1, y + 2, 22, 15));
      });
    }
    flat(ctx, 0, -6, w, 6, OFF[1]);
    flat(ctx, 0, -6, w, 1, OFF[3]);
    G.inside(ctx, G.rectRegion(ctx, 0, top, w, h), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, top, w, h), seed + 1, 1.1);
      G.drips(ctx, 0, top, w, min(40, h * 0.5), seed + 2, round(w / 24));
      eachCell(ctx, 0, top, w, h, 48, 48, (x, y, i, j) => {
        const s = seed + 10 + i * 13 + j * 71;
        if (rng(s)() < 0.3) G.rustPatch(ctx, x + 8 + rng(s + 1)() * 30, y + 40, 3, 1.5, s + 2);
      });
      G.dirt(ctx, 0, top, w, h, seed + 3, 0.28);
    }, holes);
    G.chips(ctx, 0, top + 0.5, w, seed + 4, G.DIRT);
    G.chips(ctx, 0, -5.5, w, seed + 5);
  }
});

define({
  id: "scaffoldTower",
  box: [0, -192, 48, 0],
  draw(ctx, _state, _t, { w = 48, h = 192 } = {}) {
    const seed = 7300 + round(h);
    flat(ctx, 0, -h, w, h - 4, "#141008");
    eachCell(ctx, 0, -h, w, h, 24, 24, (x, y, i, j) => {
      const r = rng(seed + i * 17 + j * 131);
      const cw = min(24, w - x);
      flat(ctx, x, y, cw, 3, TAN[2]);
      flat(ctx, x, y, cw, 0.8, TAN[3]);
      flat(ctx, x, y + 3, cw, 2, "#3a4030");
      flat(ctx, x, y + 5, cw, 0.8, HOLE);
      if (cw > 12) {
        flat(ctx, x + 9, y + 5, 3, 7, "#2a3024", HOLE);
        flat(ctx, x + 9, y + 5, 1, 7, "#4a5040");
        ellipse(ctx, x + 10.5, y + 10, 0.8, 0.8, HOLE);
      }
      if (!simple()) flat(ctx, x + 5, y + 1.2, 1.6, 1, "#3c6c6c");
      within(ctx, [[x, y, cw, 5]], () => G.grain(ctx, G.rectRegion(ctx, x, y, cw, 5), seed + i + j, 1.2));
      G.chips(ctx, x, y + 0.3, cw, seed + 40 + i + j * 7, G.DIRT);
      if (r() < 0.5) G.drips(ctx, x + 6, y + 5, 8, 10, seed + 60 + i + j * 7, 1);
    });
    within(ctx, [[0, -h, w, h]], () => G.dirt(ctx, 0, -h, w, h, seed + 1, 0.2));
  }
});

const star = (ctx, cx, cy, ro, ri, rot, fill) => {
  const pts = [];
  for (let k = 0; k < 14; k++) {
    const a = rot + (k / 14) * PI * 2;
    const rr = k % 2 ? ri : ro * (0.75 + 0.25 * sin(k * 2.3));
    pts.push([cx + cos(a) * rr, cy + sin(a) * rr]);
  }
  shape(ctx, pts, fill);
};

define({
  id: "rivetColumn",
  box: [0, -144, 24, 0],
  draw(ctx, _state, _t, { h = 144 } = {}) {
    const seed = 7400 + round(h);
    eachCell(ctx, 0, -h, 24, h, 24, 24, (x, y, i, j) => {
      const r = rng(seed + j * 97);
      flat(ctx, x, y, 24, 24, COL[2]);
      flat(ctx, x, y, 24, 4, COL[3]);
      flat(ctx, x, y + 4, 24, 2, "#686452");
      curve(ctx, [[x + 3, y + 8], [x + 12, y + 4.5], [x + 21, y + 7]], "#c8c4a8", 1.1);
      if (!simple()) for (const k of [15, 17, 19]) flat(ctx, x, y + k, 24, 0.5, COL[1]);
      star(ctx, x + 12, y + 13, 7.5, 2.6, r() * PI, HOLE);
      star(ctx, x + 12, y + 13, 3.5, 1.4, r() * PI, "#2a2010");
      flat(ctx, x + 13, y + 9, 3, 0.8, "#8c8670");
      flat(ctx, x, y + 21, 24, 3, COL[1]);
      flat(ctx, x, y + 23.3, 24, 0.7, COL[4]);
      for (const rx of [3, 21]) ellipse(ctx, rx, y + 2, 0.8, 0.8, COL[4]);
    });
    flat(ctx, 0, -h, 1, h, COL[4]);
    flat(ctx, 23, -h, 1, h, COL[4]);
    G.inside(ctx, G.rectRegion(ctx, 0, -h, 24, h), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -h, 24, h), seed + 1, 1.1);
      eachCell(ctx, 0, -h, 24, h, 24, 24, (x, y, i, j) => {
        G.drips(ctx, x + 8, y + 16, 8, 8, seed + 10 + j, 1);
        if (rng(seed + 30 + j)() < 0.25) G.rustPatch(ctx, x + 6, y + 20, 2.5, 1.2, seed + 50 + j);
        G.chips(ctx, x, y + 0.4, 24, seed + 70 + j);
      });
      G.dirt(ctx, 0, -min(h, 48), 24, min(h, 48), seed + 2, 0.4);
    });
  }
});

define({
  id: "concretePost",
  box: [0, -144, 24, 0],
  draw(ctx, _state, _t, { h = 144 } = {}) {
    const seed = 7500 + round(h);
    const m = min(48, round(h / 72) * 24);
    if (m) {
      flat(ctx, 1, -h, 22, m, MOSS[1], CON[4]);
      flat(ctx, 1, -h, 22, 3, MOSS[0]);
      flat(ctx, 1, -h + 12, 7, 3, "#9c8c48");
      flat(ctx, 1, -h + 15, 7, 1, MOSS[0]);
      flat(ctx, 1, -h + m * 0.55, 22, 2, MOSS[3]);
      const r = rng(seed);
      for (let k = 0; k < (simple() ? 3 : 6); k++) {
        const bx = 3 + r() * 16, by = -h + 6 + r() * (m - 10);
        shape(ctx, [[bx, by], [bx + 3 + r() * 3, by - 1], [bx + 6, by + 1.5], [bx + 2, by + 2.5]], k % 2 ? "#5a3418" : MOSS[3]);
      }
      within(ctx, [[1, -h, 22, m]], () => G.grain(ctx, G.rectRegion(ctx, 1, -h, 22, m), seed + 1, 1.3));
    }
    eachCell(ctx, 0, -h + m, 24, h - m, 24, 24, (x, y) => {
      flat(ctx, 1, y, 22, 24, CON[2], CON[4]);
      flat(ctx, 1, y, 22, 2, "#1a1a12");
      flat(ctx, 1, y + 2, 22, 3, CON[1]);
      flat(ctx, 1, y + 5, 1.5, 19, CON[1]);
      flat(ctx, 20.5, y + 5, 1.5, 19, CON[3]);
    });
    G.inside(ctx, G.rectRegion(ctx, 1, -h + m, 22, h - m), () => {
      G.grain(ctx, G.rectRegion(ctx, 1, -h + m, 22, h - m), seed + 2, 1.2);
      eachCell(ctx, 0, -h + m, 24, h - m, 24, 24, (x, y, i, j) => {
        G.drips(ctx, 2, y + 5, 20, 10, seed + 10 + j, 1);
        G.chips(ctx, 1, y + 5.2, 22, seed + 30 + j);
      });
      G.dirt(ctx, 1, -min(h, 48), 22, min(h, 48), seed + 3, 0.5);
    });
  }
});

const braceCell = (ctx, x, y) => {
  flat(ctx, x, y, 24, 24, "#0e0c08");
  line(ctx, [[x + 3, y + 3], [x + 21, y + 21]], BRACE[4], 4, "butt");
  line(ctx, [[x + 3, y + 3], [x + 21, y + 21]], BRACE[1], 3, "butt");
  line(ctx, [[x + 21, y + 3], [x + 3, y + 21]], BRACE[4], 4, "butt");
  line(ctx, [[x + 21, y + 3], [x + 3, y + 21]], BRACE[2], 3, "butt");
  line(ctx, [[x + 21, y + 3], [x + 3, y + 21]], BRACE[3], 0.8, "butt");
  flat(ctx, x, y, 3.5, 24, BRACE[2], BRACE[4]);
  flat(ctx, x + 20.5, y, 3.5, 24, BRACE[2], BRACE[4]);
  flat(ctx, x, y, 1, 24, BRACE[3]);
  flat(ctx, x + 20.5, y, 1, 24, BRACE[3]);
  for (const [rx, ry] of [[1.8, 4], [1.8, 20], [22.2, 4], [22.2, 20]]) ellipse(ctx, x + rx, y + ry, 0.8, 0.8, "#b4b4a0", BRACE[4]);
};
const flange = (ctx, x, y, w, h, T) => {
  flat(ctx, x, y, w, h, T[2], T[4]);
  flat(ctx, x, y, w * 0.3, h, T[3]);
  flat(ctx, x + w * 0.75, y, w * 0.25, h, T[0]);
};
const brokenEnd = (ctx, x, y, d, seed) => {
  const r = rng(seed);
  const pts = [[x + 6, y - 1]];
  for (let k = 0; k <= 6; k++) pts.push([x + 1 + r() * 4 - (k % 2) * 2, y + (k / 6) * d]);
  pts.push([x + 6, y + d + 1]);
  shape(ctx, pts, RUSTY[1], RUSTY[4]);
  shape(ctx, pts.slice(1, 7).map(([px, py]) => [px + 1.5, py]).concat([[x + 6, y + d * 0.7], [x + 6, y + d * 0.2]]), "#3c5a30");
  if (!simple()) for (let k = 0; k < 3; k++) flat(ctx, x + 3 + r() * 3, y + 2 + r() * (d - 4), 1.2, 1, "#c06018");
  G.rustPatch(ctx, x + 6, y + d * 0.6, 3, 2, seed + 1);
};

define({
  id: "yardPipe",
  box: [-2, -194, 146, 2],
  draw(ctx, state, _t, size = {}) {
    const seed = 7600 + state * 29;
    const run = state === 1 || (state === 0 && size.w > 24 && size.w > (size.h ?? 0));
    if (state === 2) {
      const T = RUSTY;
      const arc = (wd, c) => {
        ctx.strokeStyle = color(c);
        ctx.lineWidth = wd;
        ctx.lineCap = "butt";
        ctx.beginPath();
        ctx.moveTo(0, -38);
        ctx.lineTo(10, -38);
        ctx.arc(10, -10, 28, -PI / 2, 0);
        ctx.lineTo(38, 0);
        ctx.stroke();
      };
      arc(17, T[4]);
      arc(15, T[1]);
      arc(9, T[2]);
      ctx.save();
      ctx.translate(-2.5, 2.5);
      arc(2.5, T[3]);
      ctx.restore();
      ctx.save();
      ctx.translate(4, -4);
      arc(4, T[0]);
      ctx.restore();
      flange(ctx, 0, -47, 4, 18, PIPE);
      flange(ctx, 29, -4, 18, 4, PIPE);
      G.inside(ctx, () => {
        ctx.beginPath();
        ctx.moveTo(0, -46);
        ctx.lineTo(10, -46);
        ctx.arc(10, -10, 36, -PI / 2, 0, false);
        ctx.lineTo(46, 0);
        ctx.lineTo(30, 0);
        ctx.arc(10, -10, 20, 0, -PI / 2, true);
        ctx.lineTo(0, -30);
        ctx.closePath();
      }, () => {
        G.grain(ctx, G.rectRegion(ctx, 0, -48, 48, 48), seed, 1.2);
        G.rustPatch(ctx, 30, -30, 4, 3, seed + 1);
        G.drips(ctx, 14, -36, 16, 12, seed + 2, 2);
      });
      return;
    }
    if (run) {
      const w = size.w ?? 144;
      const d = 16, y = -20;
      hPipe(ctx, 4, w, y, d, PIPE);
      eachCell(ctx, 0, y - 3, w, d + 6, 48, d + 6, (x, _y, i) => {
        if (i === 0) return;
        flange(ctx, x - 2.5, y - 2.5, 5, d + 5, PIPE);
        if (!simple()) for (const by of [y - 1, y + d + 0.2]) ellipse(ctx, x, by, 0.8, 0.8, "#c8c4b0", PIPE[4]);
      });
      flange(ctx, w - 4, y - 2.5, 4, d + 5, PIPE);
      brokenEnd(ctx, 0, y, d, seed + 3);
      G.inside(ctx, G.rectRegion(ctx, 4, y, w - 4, d), () => {
        G.grain(ctx, G.rectRegion(ctx, 4, y, w - 4, d), seed + 4, 1.1);
        G.drips(ctx, 4, y + d * 0.5, w - 4, d * 0.5, seed + 5, round(w / 20));
        eachCell(ctx, 0, y, w, d, 48, d, (x, _y, i) => {
          if (rng(seed + 9 + i)() < 0.6) G.rustPatch(ctx, x + 3, y + d * 0.6, 3.5, 2, seed + 10 + i);
        });
        G.dirt(ctx, 4, y, w - 4, d, seed + 6, 0.35);
      });
      G.chips(ctx, 4, y + 0.4, w - 4, seed + 7);
      return;
    }
    const h = size.h ?? 192;
    const braced = h >= 96;
    const foot = braced ? -24 : 0;
    const top = braced ? -72 : 0;
    vPipe(ctx, 1, top, -h, 22, PIPE);
    if (braced) {
      braceCell(ctx, 0, -72);
      braceCell(ctx, 0, -48);
      vPipe(ctx, 1, 0, foot, 22, PIPE, 0);
      flange(ctx, -1, foot - 3, 26, 5, PIPE);
      flange(ctx, -1, top - 3, 26, 4, PIPE);
    }
    G.inside(ctx, G.rectsRegion(ctx, [[1, -h, 22, h + top], [1, foot, 22, -foot]]), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -h, 24, h), seed + 1, 1.1);
      G.drips(ctx, 1, -h, 22, 40, seed + 2, 2);
      eachCell(ctx, 0, -h, 24, h, 24, 48, (x, y, i, j) => {
        if (rng(seed + 20 + j)() < 0.5) G.drips(ctx, 3, y + 24, 18, 18, seed + 21 + j, 2);
      });
      G.dirt(ctx, 1, -min(h, 40), 22, min(h, 40), seed + 3, 0.5);
    });
    if (braced) within(ctx, [[0, -72, 24, 48]], () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -72, 24, 48), seed + 4, 0.9);
      G.drips(ctx, 0, -72, 24, 20, seed + 5, 2);
    });
  }
});

define({
  id: "wallConduit",
  box: [0, -24, 192, 0],
  draw(ctx, _state, _t, { w = 192 } = {}) {
    const seed = 7700 + round(w);
    const y = -19, d = 5;
    hPipe(ctx, 0, w, y, d, COND);
    eachCell(ctx, 0, -24, w, 24, 48, 24, (x, _y, i) => {
      const r = rng(seed + i * 31);
      if (!simple()) for (let k = 0; k < 6; k++) flat(ctx, x + 2 + r() * 44, y + 2.2, 2 + r() * 2, 0.9, COND[4]);
      const cx = x + 20 + (i % 2) * 6;
      flat(ctx, cx, -24, 1.5, 5, COND[1], COND[4]);
      flat(ctx, cx - 2, y - 0.8, 5.5, d + 1.6, COND[2], COND[4]);
      flat(ctx, cx - 2, y - 0.8, 1.2, d + 1.6, COND[3]);
      if (r() < 0.25) {
        flat(ctx, x + 38, y + d, 2, 5, COND[1], COND[4]);
        flat(ctx, x + 38, y + d, 0.7, 5, COND[3]);
      }
    });
    G.inside(ctx, G.rectRegion(ctx, 0, y, w, d), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, y, w, d), seed + 1, 1.2);
      eachCell(ctx, 0, y, w, d, 48, d, (x, _y, i) => {
        if (rng(seed + 5 + i)() < 0.5) G.rustPatch(ctx, x + 22, y + 3, 3, 1.2, seed + 6 + i);
      });
    });
    G.chips(ctx, 0, y + 0.3, w, seed + 2);
  }
});

define({
  id: "boilerTank",
  box: [-2, -60, 100, 2],
  draw(ctx) {
    const seed = 7800;
    const x0 = 14, x1 = 84, ty = -46, d = 32, cy = ty + d / 2;
    for (const lx of [22, 68]) {
      shape(ctx, [[lx - 2, -16], [lx + 10, -16], [lx + 12, -2], [lx - 4, -2]], RUSTY[2], RUSTY[4]);
      flat(ctx, lx - 2, -16, 2, 14, RUSTY[3]);
      flat(ctx, lx - 6, -2.5, 20, 2.5, RUSTY[1], RUSTY[4]);
    }
    for (const cx of [x0, x1]) {
      ellipse(ctx, cx, cy, 10, d / 2, "#545c60", TANK[4]);
      ellipse(ctx, cx + (cx === x0 ? -2 : 2), cy - 3, 6, 10, "#7a8488");
      if (!simple()) ellipse(ctx, cx + (cx === x0 ? -4 : 4), cy - 7, 2, 4, "#c4ccd0");
    }
    flat(ctx, x0, ty, x1 - x0, d, TANK[2], TANK[4]);
    flat(ctx, x0, ty, x1 - x0, d * 0.14, TANK[1]);
    flat(ctx, x0, ty + d * 0.24, x1 - x0, d * 0.12, TANK[3]);
    flat(ctx, x0, ty + d * 0.58, x1 - x0, d * 0.22, TANK[1]);
    flat(ctx, x0, ty + d * 0.8, x1 - x0, d * 0.2, TANK[0]);
    flat(ctx, x0, ty + d * 0.46, x1 - x0, 1.5, "#3a3428");
    for (const sx of [30, 64]) {
      flat(ctx, sx, ty - 0.5, 4, d + 1, RUSTY[2], RUSTY[4]);
      flat(ctx, sx, ty - 0.5, 1, d + 1, RUSTY[3]);
    }
    flat(ctx, 40, ty + d * 0.55, 14, 6, "#3a3428", TANK[4]);
    flat(ctx, 41, ty + d * 0.55 + 1, 12, 1, "#a8452a");
    flat(ctx, 46, ty - 5, 3, 5, PIPE[2], PIPE[4]);
    ellipse(ctx, 47.5, ty - 8, 5, 5, "#3a1a08");
    ellipse(ctx, 47.5, ty - 8, 4, 4, "#d88a2a");
    ellipse(ctx, 47.5, ty - 8, 2.6, 2.6, "#f0c070");
    line(ctx, [[47.5, ty - 8], [49.5, ty - 10]], "#2a1004", 0.8);
    flat(ctx, 74, ty - 6, 4, 6, PIPE[1], PIPE[4]);
    flat(ctx, 72, ty - 8, 8, 2.5, PIPE[2], PIPE[4]);
    const body = () => {
      ctx.beginPath();
      ctx.rect(x0, ty, x1 - x0, d);
      for (const cx of [x0, x1]) {
        ctx.moveTo(cx + 10, cy);
        ctx.ellipse(cx, cy, 10, d / 2, 0, 0, PI * 2);
      }
    };
    G.inside(ctx, body, () => {
      G.grain(ctx, G.rectRegion(ctx, x0 - 10, ty, x1 - x0 + 20, d), seed, 0.6);
      G.drips(ctx, 28, ty + 2, 40, 18, seed + 1, 2);
      G.rustPatch(ctx, 58, ty + d * 0.75, 4, 2, seed + 2);
      G.rustPatch(ctx, 20, ty + d * 0.4, 3, 2, seed + 3);
      G.dirt(ctx, x0 - 10, ty, x1 - x0 + 20, d, seed + 4, 0.35);
    });
    G.chips(ctx, x0, ty + 0.5, x1 - x0, seed + 5);
    within(ctx, [[16, -16, 66, 16]], () => G.dirt(ctx, 16, -16, 66, 16, seed + 6, 0.5));
  }
});

const lampGrid = (ctx, x, y, cols, rows, seed, lit) => {
  const r = rng(seed);
  flat(ctx, x - 1, y - 1, cols * 6 + 2, rows * 6 + 2, "#141410");
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const c = lit ? LIT[floor(r() * LIT.length)] : DEAD[floor(r() * DEAD.length)];
      flat(ctx, x + i * 6 + 0.6, y + j * 6 + 0.6, 4.8, 4.8, c);
      if (lit && !simple() && (c === LIT[0] || c === LIT[1])) flat(ctx, x + i * 6 + 1.2, y + j * 6 + 1.2, 1.6, 1.2, "#fff0b8");
    }
};
const steelBar = (ctx, x, y, w, h) => {
  flat(ctx, x, y, w, h, STAND[2], STAND[4]);
  flat(ctx, x, y, w, 0.8, STAND[3]);
  flat(ctx, x, y + h - 0.8, w, 0.8, STAND[0]);
};
const leg = (ctx, x, y0, y1) => {
  flat(ctx, x, y0, 2.6, y1 - y0, STAND[3], STAND[4]);
  flat(ctx, x + 1.8, y0, 0.8, y1 - y0, STAND[1]);
};

define({
  id: "controlBank",
  box: [0, -80, 168, 0],
  draw(ctx, state) {
    const seed = 7900;
    const lit = state === 0;
    flat(ctx, 70, -76, 28, 3, STAND[2], STAND[4]);
    flat(ctx, 70, -76, 28, 0.8, STAND[3]);
    leg(ctx, 69, -73, -52);
    leg(ctx, 96.5, -73, -52);
    lampGrid(ctx, 72, -72, 4, 3, seed + 1, lit);
    steelBar(ctx, 69, -54, 30, 3);
    for (const lx of [78, 88]) leg(ctx, lx, -51, -50);
    lampGrid(ctx, 24, -50, 20, 3, seed + 2, lit);
    steelBar(ctx, 22, -32, 124, 4);
    for (let lx = 32; lx < 146; lx += 24) leg(ctx, lx, -28, -24);
    lampGrid(ctx, 72, -24, 8, 3, seed + 3, lit);
    steelBar(ctx, 70, -6, 52, 3);
    for (const lx of [76, 112]) leg(ctx, lx, -3, 0);
    flat(ctx, 146, -50, 18, 18, STAND[2], STAND[4]);
    flat(ctx, 148, -48, 8, 13, "#24241c");
    if (!simple()) for (let gx = 149; gx < 156; gx += 1.6) flat(ctx, gx, -47.5, 0.7, 12, "#9c9c90");
    for (let k = 0; k < 4; k++) flat(ctx, 157.5, -47 + k * 3.2, 5, 1.2, STAND[3]);
    flat(ctx, 146, -50, 18, 1, STAND[3]);
    const steel = G.rectsRegion(ctx, [[70, -76, 28, 3], [69, -54, 30, 3], [22, -32, 124, 4], [70, -6, 52, 3], [146, -50, 18, 18]]);
    G.inside(ctx, steel, () => {
      G.grain(ctx, G.rectRegion(ctx, 20, -78, 146, 78), seed + 4, 1.1);
      G.drips(ctx, 22, -29, 124, 4, seed + 5, 5);
      G.dirt(ctx, 146, -50, 18, 18, seed + 6, 0.4);
    }, [rect(148, -48, 8, 13)]);
    G.chips(ctx, 22, -31.6, 124, seed + 7);
    G.chips(ctx, 70, -5.6, 52, seed + 8);
    if (!lit) G.drips(ctx, 26, -48, 110, 10, seed + 9, 5, false);
  }
});

const mech = (ctx, cx, seed) => {
  const r = rng(seed);
  const s = 0.92 + r() * 0.12;
  ctx.save();
  ctx.translate(cx, -3);
  ctx.scale(s, s);
  const yel = (x, y, w, h, tone = 3) => {
    flat(ctx, x, y, w, h, MECH[tone], MECH[0]);
    flat(ctx, x, y, w, min(1.4, h * 0.3), MECH[min(4, tone + 1)]);
    flat(ctx, x + w * 0.7, y, w * 0.3, h, MECH[tone - 1]);
  };
  for (const sx of [-1, 1]) {
    const lx = sx < 0 ? -9.5 : 3;
    yel(lx + 0.5, -22, 6, 9, 3);
    flat(ctx, lx + 0.3, -13.5, 6.4, 3.5, JOINT[2], MECH[0]);
    flat(ctx, lx + 0.3, -13.5, 6.4, 1, JOINT[3]);
    yel(lx - 0.5, -10, 7.5, 7.5, 3);
    flat(ctx, lx - 1.5, -2.6, 9.5, 2.6, JOINT[2], MECH[0]);
  }
  flat(ctx, -8, -26, 16, 4.5, JOINT[0], MECH[0]);
  flat(ctx, -8.5, -40, 17, 14, JOINT[1], MECH[0]);
  if (!simple()) for (let k = 0; k < 3; k++) flat(ctx, -6, -33 + k * 2.4, 12, 0.8, JOINT[0]);
  yel(-9.5, -41.5, 19, 6, 3);
  ellipse(ctx, 0, -38.5, 2, 2, "#4a8a3a", MECH[0]);
  for (const sx of [-1, 1]) {
    const ax = sx < 0 ? -16 : 10.5;
    yel(ax, -32, 5.5, 8, 2);
    yel(ax - 0.5, -24.5, 6.5, 8, 3);
    flat(ctx, ax + 0.5, -16.5, 4.5, 3, JOINT[2], MECH[0]);
    const px = sx < 0 ? -18.5 : 8.5;
    yel(px, -42.5, 10, 9.5, 3);
    flat(ctx, px + 1, -41.5, 8, 1.4, MECH[4]);
  }
  yel(-4, -48.5, 8, 7, 2);
  flat(ctx, -3, -46, 6, 2.2, "#1a2a2a");
  if (!simple()) flat(ctx, -2.4, -45.6, 2.5, 0.8, "#6cc0a8");
  ctx.restore();
};

define({
  id: "robotBay",
  box: [0, -96, 192, 0],
  draw(ctx, state, _t, { w = 192 } = {}) {
    const seed = 8000 + round(w);
    const holes = [];
    flat(ctx, 0, -96, w, 96, BAY[1]);
    flat(ctx, 0, -96, w, 10, BAY[0]);
    flat(ctx, 0, -86.8, w, 0.8, BAY[3]);
    eachCell(ctx, 0, -96, w, 96, 48, 96, (x, _y, i) => {
      const r = rng(seed + i * 41);
      flat(ctx, x + 3, -82, 42, 26, BAY[0]);
      flat(ctx, x + 3, -82, 42, 1, BAY[3]);
      flat(ctx, x + 3, -82, 1, 26, BAY[2]);
      flat(ctx, x + 6, -76, 36, 6, BAY[2]);
      flat(ctx, x + 6, -76, 36, 0.8, BAY[3]);
      shape(ctx, [[x + 2, -52], [x + 46, -52], [x + 42, -24], [x + 6, -24]], BAY[2], BAY[4]);
      shape(ctx, [[x + 6, -50], [x + 42, -50], [x + 39, -26], [x + 9, -26]], BAY[1]);
      if (!simple()) for (let k = 0; k < 5; k++) flat(ctx, x + 2, -48 + k * 4, 2.5, 1.6, "#5a7a78");
      if (i % 2 === 1) {
        const tx = x;
        flat(ctx, tx - 7, -86, 14, 70, "#3c7870", BAY[4]);
        flat(ctx, tx - 5, -84, 10, 66, "#1e3a36");
        flat(ctx, tx - 3, -84, 6, 66, "#e8f0ec");
        flat(ctx, tx + 1.5, -84, 1.5, 66, "#b4c8c0");
        for (let ty = -76; ty < -20; ty += 14) flat(ctx, tx - 3, ty, 6, 0.8, "#8aa8a0");
        if (!simple()) P.glow(ctx, tx, -50, 14, "#d8fff4", 0.25);
        holes.push(rect(tx - 5, -84, 10, 66));
      }
      for (let k = 0; k < 3; k++) {
        const ax = x + 6 + r() * 36, bx = ax + (r() - 0.5) * 14;
        curve(ctx, [[ax, -86], [(ax + bx) / 2 + (r() - 0.5) * 4, -72], [bx, -58 - r() * 10]], k % 2 ? "#78240c" : "#a8341a", 0.9);
      }
      if (i % 3 === 0) for (let k = 0; k < 5; k++) {
        flat(ctx, x + 1, -44 + k * 2.2, 9, 1.2, k % 2 ? "#78240c" : "#e47018");
        flat(ctx, x + 1, -16 + k * 2.2, 9, 1.2, k % 2 ? "#78240c" : "#e47018");
      }
    });
    G.inside(ctx, G.rectRegion(ctx, 0, -96, w, 96), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -96, w, 96), seed + 1, 0.9);
      G.drips(ctx, 0, -86, w, 26, seed + 2, round(w / 20));
      G.dirt(ctx, 0, -96, w, 96, seed + 3, 0.22);
    }, holes);
    G.chips(ctx, 0, -86, w, seed + 4, G.DIRT);
    flat(ctx, 0, -20, w, 2.6, "#9c9c94", BAY[4]);
    flat(ctx, 0, -20, w, 0.8, "#d4d4cc");
    eachCell(ctx, 0, -96, w, 96, 48, 96, (x, _y, i) => {
      const cx = x + 24;
      if (state === 1) {
        flat(ctx, cx - 1.5, -86, 3, 66, STAND[1], STAND[4]);
        flat(ctx, cx - 6, -50, 12, 3, STAND[2], STAND[4]);
        flat(ctx, cx - 6, -50, 12, 0.8, STAND[3]);
        flat(ctx, cx - 4, -26, 8, 2.5, STAND[2], STAND[4]);
        curve(ctx, [[cx - 3, -47], [cx - 5, -40], [cx - 2, -32]], "#78240c", 0.8);
        return;
      }
      mech(ctx, cx + (i % 2 ? 2 : -2), seed + 100 + i);
    });
    flat(ctx, 0, -3, w, 3, "#141a18");
    flat(ctx, 0, -3, w, 0.6, BAY[2]);
  }
});

const monitor = (ctx, x, y, w, h, seed) => {
  const r = rng(seed);
  flat(ctx, x, y, w, h, CASE[2], CASE[4]);
  flat(ctx, x, y, w, 1.2, CASE[3]);
  flat(ctx, x + w - 1.5, y, 1.5, h, CASE[1]);
  const sw = w * 0.62, sh = h * 0.7;
  flat(ctx, x + 2.5, y + 2.5, sw, sh, CASE[0]);
  flat(ctx, x + 3.5, y + 3.5, sw - 2, sh - 2, "#1a0c08");
  const cx = x + 3.5 + (sw - 2) / 2, cy = y + 3.5 + (sh - 2) / 2;
  ellipse(ctx, cx, cy, sw * 0.18, sh * 0.16, BLOOD[2]);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * PI * 2 + r() * 0.5;
    line(ctx, [[cx, cy], [cx + cos(a) * sw * 0.25, cy + sin(a) * sh * 0.22], [cx + cos(a + 0.4) * sw * 0.38, cy + sin(a + 0.4) * sh * 0.36]], k % 2 ? BLOOD[2] : "#e46030", 0.8);
  }
  if (!simple()) flat(ctx, x + 4, y + 4, sw * 0.4, 0.6, "#4a2a20");
  for (let vy = y + 3; vy < y + h - 3; vy += 2.2) flat(ctx, x + sw + 4, vy, w - sw - 6, 1, CASE[1]);
  flat(ctx, x + 2, y + h, w - 4, 1.5, CASE[0]);
};

define({
  id: "labBench",
  box: [0, -48, 120, 0],
  draw(ctx) {
    const seed = 8100;
    flat(ctx, 0, -44, 120, 30, "#25301f", HOLE);
    flat(ctx, 0, -44, 120, 1, "#3c4a30");
    flat(ctx, 30, -44, 1, 30, "#1a2214");
    G.inside(ctx, G.rectRegion(ctx, 0, -44, 120, 30), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -44, 120, 30), seed, 1);
      G.drips(ctx, 0, -44, 120, 16, seed + 1, 5);
    });
    monitor(ctx, 22, -38, 26, 22, seed + 2);
    monitor(ctx, 70, -36, 20, 20, seed + 3);
    shape(ctx, [[6, -14.5], [20, -14.5], [15, -21], [11, -21]], "#d8d8d0", CASE[4]);
    shape(ctx, [[15, -21], [20, -14.5], [17, -14.5], [13.5, -21]], "#9c9c94");
    flat(ctx, 12, -22.5, 2.5, 1.5, CASE[1]);
    flat(ctx, 0, -14, 120, 3, OFF[3], OFF[4]);
    flat(ctx, 0, -14, 120, 0.8, "#a89c84");
    flat(ctx, 2, -11, 116, 8, OFF[1], OFF[4]);
    for (const dx of [8, 44, 80]) {
      flat(ctx, dx, -10, 28, 6, OFF[0], OFF[4]);
      flat(ctx, dx + 11, -7.6, 6, 1, CASE[2]);
    }
    for (const lx of [3, 113]) flat(ctx, lx, -3, 4, 3, OFF[0], OFF[4]);
    const r = rng(seed + 4);
    for (let k = 0; k < 5; k++) {
      const bx = 8 + r() * 100, bw = 8 + r() * 14;
      shape(ctx, [[bx, -14.2], [bx + bw, -14.4], [bx + bw * 0.8, -12.5], [bx + bw * 0.2, -12.2]], k % 2 ? BLOOD[3] : BLOOD[1]);
      G.streak(ctx, bx + bw * 0.5, -12.5, 4 + r() * 6, 2.2, k % 2 ? BLOOD[4] : BLOOD[2], 0.8);
    }
    G.inside(ctx, G.rectRegion(ctx, 0, -14, 120, 14), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -14, 120, 14), seed + 5, 1.1);
      G.dirt(ctx, 0, -14, 120, 14, seed + 6, 0.4);
    });
    G.chips(ctx, 0, -13.6, 120, seed + 7);
    G.inside(ctx, G.rectsRegion(ctx, [[22, -38, 26, 22], [70, -36, 20, 20]]), () => {
      G.grain(ctx, G.rectRegion(ctx, 20, -40, 72, 26), seed + 8, 0.6);
    }, [rect(25.5, -35.5, 16, 15), rect(73.5, -33.5, 12, 14)]);
  }
});

define({
  id: "greenLocker",
  box: [-14, -28, 50, 0],
  draw(ctx, state) {
    const seed = 8200 + state;
    const open = state === 1;
    flat(ctx, 0, -24, 48, 24, GRN[1], GRN[4]);
    flat(ctx, 0, -24, 48, 2, GRN[3]);
    flat(ctx, 0, -2, 48, 2, GRN[0]);
    for (let k = 0; k < 4; k++) {
      flat(ctx, 2, -19 + k * 4.5, 26, 1, GRN[2]);
      flat(ctx, 2, -18 + k * 4.5, 26, 0.8, GRN[0]);
    }
    flat(ctx, 28.5, -22, 1.5, 20, GRN[0]);
    const pane = rect(31, -21, 15, 18);
    if (open) {
      flat(ctx, 31, -21, 15, 18, "#060a08");
      flat(ctx, 31, -12.5, 15, 1.2, GRN[2]);
      flat(ctx, 33, -16, 4, 3.5, "#3c3c30");
      flat(ctx, 39, -11.3, 5, 2, "#5a2a14");
      shape(ctx, [[31, -21], [26, -24], [26, 0], [31, -3]], GLS[1], GRN[4]);
      shape(ctx, [[30, -20], [27, -22], [27, -2], [30, -4]], GLS[2]);
    } else {
      flat(ctx, 31, -21, 15, 18, GLS[2], GRN[4]);
      flat(ctx, 31, -21, 1.6, 18, "#8ab0a4");
      flat(ctx, 43, -21, 3, 18, GLS[1]);
      if (!simple()) shape(ctx, [[34, -3], [37, -3], [42, -21], [39, -21]], GLS[3]);
      flat(ctx, 29.5, -13, 1.2, 3, "#9c9c90");
    }
    G.inside(ctx, G.rectRegion(ctx, 0, -24, 48, 24), () => {
      G.grain(ctx, G.rectRegion(ctx, 0, -24, 48, 24), seed, 1.1);
      G.drips(ctx, 0, -22, 30, 10, seed + 1, 2);
      G.rustPatch(ctx, 8, -6, 3, 1.4, seed + 2);
      G.dirt(ctx, 0, -24, 48, 24, seed + 3, 0.35);
    }, [pane]);
    G.chips(ctx, 0, -23.6, 48, seed + 4);
  }
});
})();
