(() => {
const { define, P } = window.ENV;
const { color, flat, disc, glow, stroke, shape, line, curve, path } = P;
const { PI, sin, floor } = Math;

const simple = () => window.ENV.simple;

const LINE = "#141410";
const STEEL = ["#303024", "#545448", "#9c9c90", "#ccccc0"];
const DEPOT = ["#3c3c30", "#606054", "#848478", "#b4b4a8"];
const OLIVE = ["#484830", "#606048", "#787860", "#9c9c84"];
const KHAKI = ["#3c3c24", "#786c54", "#968a6c", "#b4a88a"];
const BROWN = ["#3a2618", "#6a4632", "#8c6448", "#b08a66"];
const SKIN = ["#3c3c34", "#545448", "#786c60", "#968a7c"];
const RED_CAP = ["#4a1a12", "#783024", "#c03c24", "#e4704c"];
const GREEN_CAP = ["#122418", "#244830", "#3c6c3c", "#5c8c58"];

const ellipse = (ctx, cx, cy, rx, ry, fill, edge = null) => {
  ctx.fillStyle = color(fill);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, PI * 2);
  ctx.fill();
  if (edge) stroke(ctx, edge);
};

const shadow = (ctx, cx, w, alpha = 0.4) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ellipse(ctx, cx, -0.4, w / 2, 0.9, "hole");
  ctx.restore();
};

function scuff(ctx, x, w) {
  shadow(ctx, x + w / 2, w, 0.45);
  if (simple()) return;
  for (const [dx, s] of [[0.15, 1], [0.55, 0.8], [0.8, 1.2]]) flat(ctx, x + w * dx, -1.4 * s, s, s * 0.8, "k2");
}

function rod(ctx, x, y, w, h, [c0, c1, c2, c3], { vertical = false, edge = LINE } = {}) {
  flat(ctx, x, y, w, h, c1);
  if (vertical) {
    flat(ctx, x, y, w * 0.32, h, c2);
    if (!simple()) flat(ctx, x + w * 0.12, y, w * 0.12, h, c3);
    flat(ctx, x + w * 0.72, y, w * 0.28, h, c0);
  } else {
    flat(ctx, x, y, w, h * 0.32, c2);
    if (!simple()) flat(ctx, x, y + h * 0.12, w, h * 0.12, c3);
    flat(ctx, x, y + h * 0.72, w, h * 0.28, c0);
  }
  if (edge) {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    stroke(ctx, edge);
  }
}

function lit(ctx, pts, [c0, c1, c2, c3], { light = 0.32, dark = 0.3, edge = LINE } = {}) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0, h = Math.max(...ys) - y0;
  path(ctx, pts);
  ctx.fillStyle = color(c1);
  ctx.fill();
  ctx.save();
  ctx.clip();
  flat(ctx, x0, y0, w, h * light, c2);
  if (!simple()) flat(ctx, x0, y0 + h * light * 0.3, w, h * light * 0.3, c3);
  flat(ctx, x0, y0 + h * (1 - dark), w, h * dark, c0);
  ctx.restore();
  if (edge) {
    path(ctx, pts);
    stroke(ctx, edge);
  }
}

const quad = ([ox, oy], [ux, uy], [vx, vy]) => [[ox, oy], [ox + ux, oy + uy], [ox + ux + vx, oy + uy + vy], [ox + vx, oy + vy]];

function securityKey(id, cap) {
  return {
    id,
    box: [-2, -6, 16, 0],
    draw(ctx, state) {
      if (state) return scuff(ctx, 0, 14);
      shadow(ctx, 7, 14);
      shape(ctx, [[0, -2.6], [1.2, -2.6], [1.2, -0.6], [0.6, -0.6], [0.6, -1.3], [0, -1.3]], STEEL[1], LINE);
      rod(ctx, 1.2, -3, 5.6, 2.6, STEEL);
      for (const y of [-3.7, -0.6]) flat(ctx, 1.4, y, 5.2, 0.7, STEEL[y < -2 ? 2 : 0], LINE);
      if (!simple()) for (const y of [-2.4, -1.4]) flat(ctx, 1.4, y, 5.2, 0.28, STEEL[0]);
      shape(ctx, [[6.8, -3.4], [7.8, -4], [7.8, 0], [6.8, -0.4]], STEEL[2], LINE);
      rod(ctx, 7.8, -4, 4.8, 4, STEEL);
      ellipse(ctx, 12.6, -2, 0.75, 2, cap[1], LINE);
      ellipse(ctx, 12.75, -2.5, 0.45, 1.1, cap[2]);
      if (!simple()) ellipse(ctx, 12.8, -2.9, 0.22, 0.45, cap[3]);
    }
  };
}

const keyA = securityKey("keyA", RED_CAP);
const keyB = securityKey("keyB", GREEN_CAP);

const screwdriver = {
  id: "screwdriver",
  box: [-2, -6, 22, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 20);
    shadow(ctx, 9, 18);
    shape(ctx, [[8, -2.6], [17.6, -1.05], [17.6, -0.2], [8, -1.5]], "#8a8a7c", LINE);
    if (!simple()) line(ctx, [[8.2, -2.35], [17.4, -0.9]], "#c0c0a8", 0.25);
    shape(ctx, [[17.6, -1.1], [19.6, -0.6], [19.6, -0.1], [17.6, -0.2]], "#c0c0a8", LINE);
    rod(ctx, 6.8, -3.2, 1.4, 2.4, STEEL, { vertical: true });
    ellipse(ctx, 1.3, -1.8, 1.2, 1.75, BROWN[1], LINE);
    rod(ctx, 1.3, -3.55, 5.6, 3.5, BROWN);
    for (let x = 2.1; x < 6.6; x += simple() ? 1.6 : 0.8) flat(ctx, x, -3.25, 0.32, 2.9, "#242418");
  }
};

const LIFT_REMOTE = { o: [1, -0.4], u: [13, 0], v: [2.6, -2.6], h: 1.6 };

const liftRemote = {
  id: "liftRemote",
  box: [-2, -6, 20, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 18);
    shadow(ctx, 9, 18);
    const { o: [ox, oy], u, v, h } = LIFT_REMOTE;
    for (let i = 3; i >= 0; i--) {
      const k = 0.08 + i * 0.25, px = ox + v[0] * k, py = oy + v[1] * k - h * 0.75;
      shape(ctx, quad([px - 3.4, py], [3.6, 0], [v[0] * 0.13, v[1] * 0.13]), DEPOT[3], LINE);
      shape(ctx, [[px - 3.4, py], [px + 0.2, py], [px + 0.2, py + 0.8], [px - 3.4, py + 0.8]], DEPOT[1], LINE);
    }
    const top = quad([ox, oy - h], u, v);
    shape(ctx, [[ox, oy], [ox + u[0], oy], [ox + u[0], oy - h], [ox, oy - h]], "#303030", LINE);
    shape(ctx, [[ox + u[0], oy], [ox + u[0] + v[0], oy + v[1]], [ox + u[0] + v[0], oy + v[1] - h], [ox + u[0], oy - h]], "#3c3c38", LINE);
    shape(ctx, top, "#606054", LINE);
    shape(ctx, quad([ox + 10.4, oy - h], [2.6, 0], v), "#c0c0b4", LINE);
    shape(ctx, [[ox + 10.4, oy], [ox + 13, oy], [ox + 13, oy - h], [ox + 10.4, oy - h]], "#909084", LINE);
    if (!simple()) {
      for (const k of [0.3, 0.55, 0.8]) line(ctx, [[ox + 1 + v[0] * k, oy - h + v[1] * k], [ox + 6.8 + v[0] * k, oy - h + v[1] * k]], "#3c3c34", 0.2);
      flat(ctx, ox + 0.6, oy - h, 9.4, 0.3, "#848478");
    }
    shape(ctx, quad([ox + 7.4 + v[0] * 0.25, oy - h + v[1] * 0.25 - 0.4], [2.2, 0], [v[0] * 0.5, v[1] * 0.5]), "#843018", LINE);
    shape(ctx, quad([ox + 7.4 + v[0] * 0.25, oy - h + v[1] * 0.25], [2.2, 0], [0, -0.4]), "#84240c");
  }
};

const DISK = { o: [1, -0.2], u: [11, 0], v: [3.4, -5], h: 0.8 };

const floppyDisk = {
  id: "floppyDisk",
  box: [-2, -8, 18, 0],
  draw(ctx, state) {
    shadow(ctx, 8, 16, 0.35);
    const { o: [ox, oy], u, v, h } = DISK;
    const at = (a, b) => [ox + u[0] * a + v[0] * b, oy - h + v[1] * b];
    shape(ctx, [[ox, oy], [ox + u[0], oy], [ox + u[0], oy - h], [ox, oy - h]], "#1c2434", LINE);
    shape(ctx, [[ox + u[0], oy], [ox + u[0] + v[0], oy + v[1]], [ox + u[0] + v[0], oy + v[1] - h], [ox + u[0], oy - h]], "#24304a", LINE);
    shape(ctx, quad([ox, oy - h], u, v), "#303c54", LINE);
    if (!simple()) line(ctx, [at(0.02, 0.98), at(0.98, 0.98)], "#486c6c", 0.3);
    const label = [at(0.1, 0.38), at(0.9, 0.38), at(0.9, 0.94), at(0.1, 0.94)];
    shape(ctx, label, "#c0cccc", LINE);
    if (!simple()) for (const b of [0.6, 0.72, 0.84]) line(ctx, [at(0.18, b), at(0.7, b)], "#90a0a4", 0.2);
    shape(ctx, [at(0.28, 0), at(0.72, 0), at(0.72, 0.3), at(0.28, 0.3)], "#a8a8a8", LINE);
    shape(ctx, [at(0.42, 0.04), at(0.58, 0.04), at(0.58, 0.24), at(0.42, 0.24)], "#2a2c34");
    if (!simple()) line(ctx, [at(0.3, 0.29), at(0.7, 0.29)], "#848484", 0.25);
    if (state === 1) {
      shape(ctx, [at(0.66, 0.44), at(0.86, 0.44), at(0.86, 0.88), at(0.66, 0.88)], "#c0281c", LINE);
      line(ctx, [at(0.7, 0.52), at(0.82, 0.8)], "#ffd0b0", 0.35);
      line(ctx, [at(0.82, 0.52), at(0.7, 0.8)], "#ffd0b0", 0.35);
    }
  }
};

const FINGERS = [
  [[8.6, -5.6], [11.4, -5.2], [13.6, -3.6], [15.4, -2.6]],
  [[8.6, -4.2], [11.2, -3.4], [13.4, -1.8], [14.8, -0.7]],
  [[7.6, -2.8], [9.8, -1.8], [11.6, -0.9], [12.6, -0.5]],
  [[6, -2], [7.2, -1], [8.6, -0.5]],
  [[7.6, -6.8], [10, -7.6], [12.4, -6.8]]
];
const PALM = [[2.6, -9.4], [5.4, -8.6], [8.4, -7.6], [9.8, -5.4], [9.2, -3.2], [6.8, -1.8], [4.8, -3], [2.8, -5.4]];
const WOUND = [[1.4, -9.6], [1.8, -11.2], [2.6, -9.8], [3.2, -11.6], [3.6, -9.6], [4.4, -10.6], [4.2, -8.8], [5.4, -8.4], [3.8, -7.4], [4.6, -6.4], [3.2, -5.8], [3.2, -4.6], [2, -5.4], [0.8, -7.6]];

const alienHand = {
  id: "alienHand",
  box: [-2, -13, 20, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 18);
    shadow(ctx, 8, 17);
    for (const f of FINGERS) {
      curve(ctx, f, LINE, 1.9);
      curve(ctx, f, SKIN[1], 1.3);
      if (!simple()) curve(ctx, f.map(([x, y]) => [x, y - 0.3]), SKIN[2], 0.45);
      const [ex, ey] = f[f.length - 1];
      disc(ctx, ex, ey, 0.55, SKIN[2]);
      if (!simple()) for (const [x, y] of f.slice(1, -1)) disc(ctx, x, y, 0.45, SKIN[0]);
    }
    lit(ctx, PALM, SKIN, { light: 0.35, dark: 0.25 });
    if (!simple()) {
      for (const pts of [[[4.4, -8], [6, -7], [7.6, -7.2]], [[4.2, -6], [6.2, -5.4], [8.6, -5.8]], [[5.4, -4], [7, -3.6], [8.6, -4]]]) curve(ctx, pts, "#242424", 0.25);
      disc(ctx, 7, -6.4, 0.5, "#606060");
    }
    shape(ctx, WOUND, "#6c3c18", LINE);
    shape(ctx, WOUND.map(([x, y]) => [x + (x - 2.6) * -0.35, y + (y + 8.4) * -0.3]), "#b44818");
    if (!simple()) ellipse(ctx, 2.4, -8, 0.6, 1.2, "#783c24");
  }
};

const grenade = {
  id: "handGrenade",
  box: [-2, -11, 12, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 10);
    shadow(ctx, 5, 9);
    ellipse(ctx, 5, -3.3, 3.8, 3.3, OLIVE[1]);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(5, -3.3, 3.8, 3.3, 0, 0, PI * 2);
    ctx.clip();
    ellipse(ctx, 4.2, -4.4, 2.8, 2.2, OLIVE[2]);
    if (!simple()) ellipse(ctx, 3.6, -5, 1.1, 0.8, OLIVE[3]);
    ellipse(ctx, 5.8, -0.6, 4.2, 1.6, OLIVE[0]);
    ctx.restore();
    ellipse(ctx, 5, -3.3, 3.8, 3.3, "rgba(0,0,0,0)", LINE);
    shape(ctx, [[1.2, -3.9], [8.8, -3.9], [8.7, -2.9], [1.3, -2.9]], OLIVE[2], LINE);
    if (!simple()) flat(ctx, 1.4, -3.8, 7.2, 0.3, OLIVE[3]);
    rod(ctx, 3.9, -7.6, 2.2, 1.2, ["#848478", "#a8a8a8", "#c0c0b4", "#e0e0d4"], { vertical: true });
    shape(ctx, [[6.1, -7.4], [7.6, -7], [8.2, -5.4], [7.6, -5.5], [7, -6.7], [6.1, -6.8]], "#a8a8a8", LINE);
    ctx.beginPath();
    ctx.ellipse(3.3, -8.3, 1, 0.75, -0.4, 0, PI * 2);
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = LINE;
    ctx.stroke();
    ctx.lineWidth = 0.3;
    ctx.strokeStyle = "#c0c0b4";
    ctx.stroke();
  }
};

const BOMB = { o: [1, -0.4], u: [15, 0], v: [3, -3], h: 5 };
const STRAPS = [3, 11];

const timeBomb = {
  id: "timeBomb",
  box: [-2, -11, 20, 0],
  anim: true,
  draw(ctx, state, t) {
    shadow(ctx, 9, 18);
    const { o: [ox, oy], u, v, h } = BOMB;
    const front = [[ox + 0.6, oy], [ox + u[0] - 0.6, oy], [ox + u[0], oy - 0.6], [ox + u[0], oy - h + 0.6], [ox + u[0] - 0.6, oy - h], [ox + 0.6, oy - h], [ox, oy - h + 0.6], [ox, oy - 0.6]];
    shape(ctx, [[ox + u[0], oy - 0.6], [ox + u[0] + v[0], oy + v[1] - 0.6], [ox + u[0] + v[0], oy + v[1] - h + 0.6], [ox + u[0], oy - h + 0.6]], KHAKI[0], LINE);
    shape(ctx, [[ox + 0.6, oy - h], [ox + u[0] - 0.6, oy - h], [ox + u[0] - 0.6 + v[0], oy - h + v[1]], [ox + 0.6 + v[0], oy - h + v[1]]], KHAKI[2], LINE);
    lit(ctx, front, KHAKI, { light: 0.15, dark: 0.28 });
    for (const x of STRAPS) {
      flat(ctx, ox + x, oy - h, 1.6, h, "#e43c0c", LINE);
      shape(ctx, quad([ox + x, oy - h], [1.6, 0], v), "#b4300c", LINE);
      if (!simple()) flat(ctx, ox + x, oy - h, 0.5, h, "#f07040");
    }
    const bx = ox + 5.2, by = oy - h - 0.4;
    shape(ctx, quad([bx, by], [5.2, 0], [v[0] * 0.8, v[1] * 0.8]), "#9c9c90", LINE);
    shape(ctx, [[bx, by], [bx + 5.2, by], [bx + 5.2, oy - h + 1.6], [bx, oy - h + 1.6]], "#848478", LINE);
    const armed = state === 1;
    const sx = bx + 0.6, sy = by - 2.1;
    shape(ctx, quad([sx, sy + 1.6], [3.4, 0], [0.9, -0.9]), armed ? "#3c1808" : "#a8ac98", LINE);
    if (armed && !simple()) glow(ctx, sx + 2.1, sy + 1.1, 3, "#ff7a30", 0.35);
    const left = Math.max(0, 700 - floor(t));
    const digits = armed ? [floor(left / 600), floor(left / 60) % 10, floor(left % 60 / 10), left % 10] : [8, 8, 8, 8];
    const ink = armed ? "#ff8a3a" : "#3c3c30";
    if (simple()) flat(ctx, sx + 0.8, sy + 0.9, 2.4, 0.3, ink);
    else digits.forEach((d, i) => P.text(ctx, String(d), sx + 0.95 + i * 0.68 + (i > 1 ? 0.3 : 0), sy + 1.1, 0.9, ink));
    const blink = !armed || floor(t * 2) % 2 === 0;
    shape(ctx, quad([bx + 3.9, by - 0.6], [0.9, 0], [0.5, -0.5]), blink ? "#e43c0c" : "#6a1c0c", LINE);
    if (armed && blink && !simple()) glow(ctx, bx + 4.6, by - 0.9, 1.6, "neon", 0.5);
  }
};

const LAUNCHER = ["#3c3c30", "#606054", "#848478", "#b4b4a8"];

const rocketLauncher = {
  id: "rocketLauncher",
  box: [-2, -12, 30, 0],
  draw(ctx, state) {
    if (state) return scuff(ctx, 0, 28);
    shadow(ctx, 13, 26);
    shape(ctx, [[13.4, -3.6], [15.2, -3.6], [14.8, -0.2], [13, -0.2]], "#303024", LINE);
    shape(ctx, [[16.2, -3.6], [17, -3.6], [17.4, -1.8], [16.4, -1.6]], "#303024", LINE);
    shape(ctx, [[3, -3.6], [3.6, -3.6], [2.6, 0], [1.8, 0]], LAUNCHER[1], LINE);
    shape(ctx, [[0.2, -9.2], [2.6, -8.4], [2.6, -3.4], [0.2, -2.6]], LAUNCHER[0], LINE);
    rod(ctx, 2.6, -8.4, 21, 5, LAUNCHER);
    rod(ctx, 7, -8.6, 4, 5.4, ["#2a2a1e", "#484830", "#606048", "#787860"]);
    rod(ctx, 22.4, -8.8, 1.8, 5.8, LAUNCHER, { vertical: true });
    shape(ctx, [[24.2, -7.4], [26.6, -6.6], [27.4, -5.9], [26.6, -5.2], [24.2, -4.4]], "#c03c24", LINE);
    if (!simple()) shape(ctx, [[24.4, -7.1], [26.4, -6.4], [24.4, -6.3]], "#e4704c");
    shape(ctx, [[12, -8.4], [12.6, -10.2], [17.4, -10.2], [18, -8.4]], LAUNCHER[2], LINE);
    flat(ctx, 17.2, -10.1, 0.9, 1.1, "#6c909c", LINE);
    if (!simple()) {
      flat(ctx, 3.2, -8.1, 3.4, 0.5, "#e8c21a");
      for (let x = 3.6; x < 6.6; x += 1) flat(ctx, x, -8.1, 0.45, 0.5, "#141414");
      flat(ctx, 19, -5.2, 2.6, 0.35, "#3c3c30");
    }
  }
};

for (const asset of [rocketLauncher, grenade, keyA, keyB, screwdriver, floppyDisk, alienHand, liftRemote, timeBomb]) define(asset);
})();
