(() => {
const { define } = window.ENV;
const { G } = window.ENV;
const wireBox = window.ENV.ASSETS.find((a) => a.id === "wireBox");
const P = { ...window.ENV.P, simple: () => window.ENV.simple };
const { rng, color, flat, glow, stroke, shape, line, curve, disc, rivets, hazard, text, path, box, poly, cylV, cylH, slab, tones } = P;
const { PI, sin, cos, min, max, floor, ceil, round, abs } = Math;
const simple = () => P.simple();
const ellipse = (ctx, cx, cy, rx, ry, fill, edge = null) => {
    ctx.fillStyle = color(fill);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, PI * 2);
    ctx.fill();
    if (edge)
        stroke(ctx, edge);
};
const shadow = (ctx, cx, w, alpha = 0.4) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ellipse(ctx, cx, -0.4, w / 2, 0.9, "hole");
    ctx.restore();
};
const smoke = (ctx, x, y, t, n = 3, h = 22) => {
    ctx.save();
    for (let i = 0; i < n; i++) {
        const k = (t * 0.35 + i / n) % 1;
        ctx.globalAlpha = 0.22 * (1 - k);
        ellipse(ctx, x + sin(t * 1.3 + i * 2) * 2 + k * 5, y - k * h, 2 + k * 5, 1.6 + k * 3.5, k < 0.3 ? "k1" : "k2");
    }
    ctx.restore();
};
const spark = (ctx, x, y, t, seed = 0) => {
    if (floor(t * 7 + seed) % 4)
        return;
    const r = rng(floor(t * 7) + seed * 13);
    if (!simple())
        glow(ctx, x, y, 5, "y3", 0.8);
    for (let i = 0; i < 4; i++) {
        const a = r() * PI * 2;
        const l = 2 + r() * 3;
        line(ctx, [[x, y], [x + cos(a) * l, y + sin(a) * l]], "y3", 0.5);
    }
};
const flame = (ctx, x, base, w, h, t, seed = 0) => {
    const f = 0.85 + sin(t * 11 + seed * 2.3) * 0.08 + sin(t * 17.3 + seed) * 0.07;
    const tip = h * f;
    const lean = sin(t * 6 + seed) * w * 0.12;
    const pts = (k, s) => [
        [x + w * (0.5 - s / 2), base],
        [x + w * (0.5 - s / 2) + w * 0.05, base - tip * k * 0.45],
        [x + w / 2 + lean * k - w * s * 0.18, base - tip * k * 0.75],
        [x + w / 2 + lean * k, base - tip * k],
        [x + w / 2 + lean * k + w * s * 0.2, base - tip * k * 0.7],
        [x + w * (0.5 + s / 2) - w * 0.04, base - tip * k * 0.4],
        [x + w * (0.5 + s / 2), base],
    ];
    if (!simple())
        glow(ctx, x + w / 2, base - tip * 0.4, w * 1.3, "a1", 0.35);
    shape(ctx, pts(1, 1), "fire0");
    shape(ctx, pts(0.75, 0.7), "fire1");
    shape(ctx, pts(0.45, 0.42), "fire2");
};
const blob = (cx, cy, rx, ry, seed, n = 12) => {
    const r = rng(seed);
    return Array.from({ length: n }, (_, i) => {
        const a = (i / n) * PI * 2;
        const k = 0.75 + r() * 0.35;
        return [cx + cos(a) * rx * k, cy + sin(a) * ry * k];
    });
};
const RUIN = ["#4a4840", "#6e6a5c", "#8e8a78", "#aca692", "#1c1a16"];
const BOULDER = ["#2a2620", "#4c463a", "#6e6654", "#968c74", "#b4aa8e"];
const boulder = (ctx, cx, cy, rx, ry, seed) => {
    shape(ctx, blob(cx, cy, rx, ry, seed, 10), BOULDER[1], BOULDER[0]);
    shape(ctx, blob(cx - rx * 0.18, cy - ry * 0.22, rx * 0.72, ry * 0.6, seed + 1, 9), BOULDER[2]);
    shape(ctx, blob(cx - rx * 0.32, cy - ry * 0.4, rx * 0.36, ry * 0.26, seed + 2, 8), BOULDER[3]);
    flat(ctx, cx - rx * 0.4, cy - ry * 0.55, rx * 0.25, 0.8, BOULDER[4]);
    line(ctx, [[cx - rx * 0.6, cy + ry * 0.5], [cx + rx * 0.5, cy + ry * 0.62]], BOULDER[0], 0.8);
};
const PLANK = ["#24160c", "#3e2814", "#5a3c1e", "#7a5430", "#0e0804"];
const planks = (ctx, x, y, w, h, seed, vertical = false) => {
    const r = rng(seed);
    flat(ctx, x, y, w, h, PLANK[1]);
    if (vertical) {
        for (let px = x; px < x + w; px += 6) {
            flat(ctx, px, y, min(5.4, x + w - px), h, r() < 0.3 ? PLANK[2] : PLANK[1]);
            if (px + 6 <= x + w)
                flat(ctx, px + 5.4, y, 0.6, h, PLANK[4]);
        }
    }
    else {
        for (let py = y; py < y + h; py += 5) {
            flat(ctx, x, py, w, min(4.4, y + h - py), r() < 0.3 ? PLANK[2] : PLANK[1]);
            if (py + 5 <= y + h)
                flat(ctx, x, py + 4.4, w, 0.6, PLANK[4]);
        }
    }
    G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed + 1);
    G.dirt(ctx, x, y, w, h, seed + 2, 0.3);
};
const concreteBlock = (ctx, x, y, w, h, seed) => {
    flat(ctx, x, y, w, h, RUIN[2], RUIN[4]);
    flat(ctx, x, y, w, 1.6, RUIN[3]);
    flat(ctx, x + w - 2, y, 2, h, RUIN[1]);
    G.grain(ctx, G.rectRegion(ctx, x, y, w, h), seed);
};
const CRATE = ["#161a12", "#262c20", "#384030", "#525c46", "#0a0c08"];
const SEAM = ["#4a3810", "#a07e28", "#c8a040", "#e8cc78", "#0c0a04"];
const STONE = ["#2e2e28", "#4c4c44", "#6c6a60", "#908c7e", "#121210"];
const GRASS = ["#2a2810", "#4a4420", "#6e6230", "#9a8644", "#141206"];
const LEAF = ["#1a2410", "#2a3a18", "#40542a", "#5e7238", "#0a0e06"];
const CONC = ["#4e4a3e", "#706a58", "#948c76", "#b4ac92", "#1a1812"];
const SLABS = [CONC, ["#46463e", "#64645a", "#86867a", "#a6a69a", "#16160f"], ["#54483a", "#766654", "#9a8870", "#bcaa8e", "#1c160e"]];
const BRONZE = ["#2e1e0c", "#5a3e1e", "#8a6436", "#b88c54", "#120a04"];
const PLATE = ["#20262a", "#343c40", "#4c565a", "#6e787a", "#0a0e10"];
const TUBE = ["#3c4442", "#68706c", "#9aa29c", "#c8ceca", "#141816"];
const OLIVE = ["#24281a", "#3a4028", "#545c3a", "#727a50", "#0c0e08"];
const BURNT = ["#141210", "#262220", "#3a3430", "#56504a", "#080706"];
const SACK = ["#2c281a", "#4a4430", "#686046", "#867c5c", "#121008"];
const NIGHT = ["#0a1210", "#0f1b18", "#152520", "#1c3029", "#253c33"];
const SIL = ["#0a100d", "#101a15", "#16231c", "#1e2e24", "#283a2e"];
const AMBER = ["#5a2a08", "#c86a14", "#f0a030", "#ffe0a0"];
const PORCELAIN = ["#5a5448", "#8a8474", "#bab4a2", "#e0dccc"];
const SPARK = ["#3a6ad8", "#7ab4ff", "#e8f4ff"];
const HOLE = "#0a0c0a";
const RUSTY = "#7a3a14";
const MARGIN = 24;
const shown = (ctx) => {
    const m = ctx.getTransform();
    if (m.b || m.c || !m.a || !m.d)
        return [-Infinity, -Infinity, Infinity, Infinity];
    const xa = -m.e / m.a;
    const xb = (ctx.canvas.width - m.e) / m.a;
    const ya = -m.f / m.d;
    const yb = (ctx.canvas.height - m.f) / m.d;
    return [min(xa, xb) - MARGIN, min(ya, yb) - MARGIN, max(xa, xb) + MARGIN, max(ya, yb) + MARGIN];
};
const eachCell = (ctx, x, y, w, h, cw, ch, draw, pad = 0) => {
    const [vx0, vy0, vx1, vy1] = shown(ctx).map((v, k) => (k < 2 ? v - pad : v + pad));
    const i0 = max(0, floor((vx0 - x) / cw));
    const i1 = min(ceil(w / cw - 0.001), ceil((vx1 - x) / cw));
    const j0 = max(0, floor((vy0 - y) / ch));
    const j1 = min(ceil(h / ch - 0.001), ceil((vy1 - y) / ch));
    for (let j = j0; j < j1; j++)
        for (let i = i0; i < i1; i++)
            draw(x + i * cw, y + j * ch, i, j);
};
const cellSeed = (seed, i, j) => seed + i * 131 + j * 977;
const outline = (ctx, x, y, w, h, c) => {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    stroke(ctx, c);
};
const band = (ctx, x, y, w, h, t, edge = true) => {
    const e = min(2, h / 4);
    const s = min(3, h / 4);
    flat(ctx, x, y, w, h, t[2]);
    flat(ctx, x, y, w, e, t[3]);
    flat(ctx, x, y + h - s, w, s, t[1]);
    if (edge)
        outline(ctx, x, y, w, h, t[4]);
};
const pier = (ctx, x, y, w, h, t, edge = true) => {
    flat(ctx, x, y, w, h, t[2]);
    flat(ctx, x, y, w * 0.25, h, t[3]);
    flat(ctx, x + w * 0.7, y, w * 0.3, h, t[1]);
    if (edge)
        outline(ctx, x, y, w, h, t[4]);
};
const tube = (ctx, x, y, w, h, t) => {
    flat(ctx, x, y, w, h, t[1]);
    flat(ctx, x, y + h * 0.15, w, h * 0.3, t[2]);
    flat(ctx, x, y + h * 0.2, w, h * 0.12, t[3]);
    flat(ctx, x, y + h * 0.75, w, h * 0.25, t[0]);
    outline(ctx, x, y, w, h, t[4]);
};
const within = (ctx, rects, draw) => {
    ctx.save();
    ctx.beginPath();
    for (const [x, y, w, h] of rects)
        ctx.rect(x, y, w, h);
    ctx.clip();
    draw();
    ctx.restore();
};
const outside = (ctx, holes, draw) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-1e4, -1e4, 2e4, 2e4);
    for (const pts of holes) {
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (const [x, y] of pts.slice(1))
            ctx.lineTo(x, y);
        ctx.closePath();
    }
    ctx.clip("evenodd");
    draw();
    ctx.restore();
};
const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const worn = (ctx, x, y, w, h, seed) => {
    within(ctx, [[x, y, w, h]], () => {
        G.surface(ctx, x, y, w, h, seed, { rise: 0.45, drip: max(1, round(w / 10)), dripLen: min(h, 18), edge: false });
        if (w * h > 120)
            G.rustPatch(ctx, x + w * (0.3 + rng(seed)() * 0.4), y + h * 0.6, min(4, w * 0.3), min(2, h * 0.3), seed + 1);
    });
};
const strut = (ctx, ax, ay, bx, by, w, t) => {
    line(ctx, [[ax, ay], [bx, by]], t[4], w + 1, "butt");
    line(ctx, [[ax, ay], [bx, by]], t[1], w, "butt");
    line(ctx, [[ax, ay], [bx, by]], t[2], w * 0.4, "butt");
};
const wornStrut = (ctx, ax, ay, bx, by, w, t, seed) => {
    strut(ctx, ax, ay, bx, by, w, t);
    const l = Math.hypot(bx - ax, by - ay) || 1;
    const nx = (-(by - ay) / l) * (w / 2 + 0.5);
    const ny = ((bx - ax) / l) * (w / 2 + 0.5);
    const quad = [[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]];
    const r = rng(seed);
    ctx.save();
    path(ctx, quad);
    ctx.clip();
    G.grain(ctx, G.polyRegion(ctx, quad), seed, 1.3);
    for (let k = 0; k < 3; k++) {
        const u = r();
        const len = 3 + r() * 6;
        line(ctx, [[ax + (bx - ax) * u, ay + (by - ay) * u], [ax + (bx - ax) * (u + len / l), ay + (by - ay) * (u + len / l)]], k ? t[0] : G.DIRT, w * 0.7);
    }
    if (abs(by - ay) > 30)
        G.dirt(ctx, min(ax, bx) - w, max(ay, by) - 30, abs(bx - ax) + w * 2, 30, seed + 1, 0.6);
    ctx.restore();
};
const jag = (x0, x1, y, amp, step, seed) => {
    const r = rng(seed);
    const pts = [];
    for (let x = x0; x < x1; x += step * (0.5 + r()))
        pts.push([x, y - r() * amp]);
    pts.push([x1, y - r() * amp]);
    return pts;
};
const SOOT = "#0c0a08";
const sootEdge = (ctx, edge, depth, seed, surface, holes = []) => {
    const r = rng(seed);
    clipped(ctx, surface, () => outside(ctx, holes, () => {
        ctx.save();
        for (const [k, a] of [[1, 0.22], [0.62, 0.3], [0.3, 0.42]]) {
            const low = edge.map(([x, y]) => [x, y + depth * k * (0.55 + r() * 0.7)]);
            ctx.globalAlpha = a;
            shape(ctx, [...edge.map(([x, y]) => [x, y - 2]), ...low.reverse()], SOOT);
        }
        ctx.restore();
    }));
};
const breach = (ctx, pts, seed, light, dark, fill = HOLE) => {
    G.scorch(ctx, pts, seed);
    shape(ctx, pts, fill);
    G.rim(ctx, pts, seed + 1, light, dark);
    if (simple())
        return;
    const r = rng(seed + 2);
    outside(ctx, [pts], () => pts.forEach(([x, y], i) => {
        if (i % 3)
            return;
        line(ctx, [[x, y], [x + (r() - 0.5) * 6, y - 2 - r() * 4]], RUSTY, 0.6);
    }));
};
const bulletHoles = (ctx, x, y, w, h, n, seed, light) => {
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
        const cx = x + r() * w;
        const cy = y + r() * h;
        const pts = blob(cx, cy, 1.4 + r(), 1.2 + r(), seed + i, 7);
        shape(ctx, pts, HOLE);
        G.rim(ctx, pts, seed + 10 + i, light, HOLE);
    }
};
const soot = (ctx, x, y, w, h) => {
    ctx.save();
    ctx.globalAlpha = 0.35;
    shape(ctx, [[x, y], [x + w, y], [x + w * 0.8, y - h], [x + w * 0.2, y - h]], G.DIRT);
    ctx.restore();
};
const net = (ctx, x, y, w, h, c, step) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.strokeStyle = c;
    ctx.globalAlpha = simple() ? 0.35 : 0.6;
    ctx.lineWidth = simple() ? 0.5 : 0.55;
    ctx.beginPath();
    for (let i = -h; i < w + h; i += step) {
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + h, y + h);
        ctx.moveTo(x + i + h, y);
        ctx.lineTo(x + i, y + h);
    }
    ctx.stroke();
    ctx.restore();
};
const tufts = (ctx, x, w, y, seed, density, tall = 5) => {
    eachCell(ctx, x, y - tall, w, tall + 1, 4, tall + 1, (cx, _cy, i) => {
        const r = rng(seed + i * 37);
        if (r() > density)
            return;
        const n = 2 + floor(r() * 3);
        for (let k = 0; k < n; k++) {
            const bx = cx + r() * 4;
            const len = tall * (0.4 + r() * 0.6);
            const c = r() < 0.4 ? LEAF[2] : r() < 0.5 ? GRASS[3] : GRASS[2];
            line(ctx, [[bx, y + 0.5], [bx + (r() - 0.5) * 3, y - len]], c, 0.8);
        }
    });
};
const palm = (ctx, x, h, lean, size, tone, seed) => {
    const r = rng(seed);
    const top = [x + lean, -h];
    curve(ctx, [[x, 0], [x + lean * 0.2, -h * 0.5], top], tone, max(2, size * 0.12));
    const n = 8;
    for (let i = 0; i < n; i++) {
        const side = i % 2 ? 1 : -1;
        const len = size * (0.6 + r() * 0.5);
        const lift = size * (0.1 + r() * 0.25);
        const droop = size * (0.35 + r() * 0.45) * (i < 2 ? 0.4 : 1);
        const upper = [];
        const lower = [];
        const k = 8;
        for (let j = 0; j <= k; j++) {
            const u = j / k;
            const x = top[0] + side * len * u * (0.6 + 0.4 * ((i + 1) / n));
            const y = top[1] - lift * sin(u * PI * 0.8) + droop * u * u;
            const wd = size * 0.08 * (1 - u) + 0.5;
            upper.push([x, y - wd]);
            lower.push([x + side * (j % 2 ? 1.5 : 0), y + wd * (j % 2 ? 3.2 : 1)]);
        }
        shape(ctx, [...upper, ...lower.reverse()], tone);
    }
    disc(ctx, top[0], top[1], size * 0.08, tone);
};
const bush = (ctx, cx, w, h, tone, seed) => {
    const pts = [[cx - w / 2, 0], ...jag(cx - w / 2, cx + w / 2, -h * 0.6, h * 0.5, 5, seed), [cx + w / 2, 0]];
    shape(ctx, pts, tone);
    return pts;
};
const villageBackdrop = {
    id: "villageBackdrop",
    box: [0, -170, 320, 0],
    draw(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, -170, 320, 170);
        ctx.clip();
        for (const [y, h, c] of [[-170, 50, NIGHT[0]], [-120, 32, NIGHT[1]], [-88, 28, NIGHT[2]], [-60, 26, NIGHT[3]], [-34, 34, NIGHT[4]]])
            flat(ctx, 0, y, 320, h, c);
        const r = rng(41);
        for (let i = 0; i < 9; i++)
            palm(ctx, 8 + i * 36 + r() * 14, 120 + r() * 40, (r() - 0.5) * 30, 34 + r() * 14, SIL[2], 50 + i);
        for (let i = 0; i < 7; i++)
            palm(ctx, 20 + i * 48 + r() * 16, 80 + r() * 30, (r() - 0.5) * 24, 26 + r() * 10, SIL[1], 70 + i);
        const ruins = [[0, 34, 30], [64, 44, 22], [150, 38, 34], [236, 46, 26], [300, 30, 20]];
        for (const [x, w, h] of ruins) {
            const top = jag(x, x + w, -h, 7, 4, x + 3);
            const wall = [[x, 0], ...top, [x + w, 0]];
            shape(ctx, wall, SIL[4]);
            G.grain(ctx, G.polyRegion(ctx, wall), x + 5, 0.5);
            flat(ctx, x, -h + 3, w, 1.2, NIGHT[4]);
            for (let k = x + 5; k < x + w - 6; k += 11)
                flat(ctx, k, -h * 0.6, 5, 7, SIL[0]);
        }
        for (let x = -6; x < 330; x += 18 + r() * 16)
            bush(ctx, x, 26 + r() * 20, 12 + r() * 12, r() < 0.5 ? SIL[1] : SIL[0], round(x) + 90);
        flat(ctx, 0, -4, 320, 4, SIL[0]);
        ctx.restore();
    },
};
const farPalms = {
    id: "farPalms",
    box: [0, -192, 96, 0],
    draw(ctx, state, _t, { w = 96, h = 192 } = {}) {
        const seed = round(w * 7 + h * 3) + state * 11;
        const r = rng(seed);
        const n = max(1, round(w / 44));
        for (let i = 0; i < n; i++)
            palm(ctx, ((i + 0.5) * w) / n + (r() - 0.5) * 10, h * (0.6 + r() * 0.3), (r() - 0.5) * 20, 26 + r() * 10, i % 2 ? SIL[2] : SIL[3], seed + i);
        if (state === 1) {
            const wh = min(h * 0.4, 72);
            const wall = [[0, 0], ...jag(0, w, -wh, 10, 5, seed + 20), [w, 0]];
            shape(ctx, wall, SIL[3]);
            G.grain(ctx, G.polyRegion(ctx, wall), seed + 21, 0.5);
            G.drips(ctx, 0, -wh, w, wh * 0.5, seed + 22, round(w / 16), false);
            for (let x = 6; x < w - 10; x += 16)
                flat(ctx, x, -wh * 0.6, 7, 10, SIL[0]);
            const hole = blob(w * 0.55, -wh * 0.35, 9, 7, seed + 23, 10);
            G.scorch(ctx, hole, seed + 24);
            shape(ctx, hole, SIL[0]);
            G.rim(ctx, hole, seed + 25, SIL[4], SIL[0]);
        }
        const bushes = [rectPts(0, -3, w, 3)];
        for (let x = 4; x < w; x += 14 + r() * 10)
            bushes.push(bush(ctx, x, 18 + r() * 14, 10 + r() * 10, SIL[1], seed + round(x)));
        G.inside(ctx, G.polysRegion(ctx, bushes), () => G.dirt(ctx, 0, -24, w, 24, seed + 30, 0.6));
        flat(ctx, 0, -3, w, 3, SIL[0]);
    },
};
const farRuins = {
    id: "farRuins",
    box: [0, -192, 96, 0],
    draw(ctx, state, _t, { w = 96, h = 192 } = {}) {
        const seed = round(w * 5 + h * 7) + state * 13;
        const r = rng(seed);
        if (state === 1) {
            const top = h * 0.9;
            const legs = top * 0.55;
            for (const [a, b] of [[w * 0.2, w * 0.3], [w * 0.8, w * 0.7]])
                line(ctx, [[a, 0], [b, -legs]], SIL[3], 3);
            for (let k = 1; k < 4; k++) {
                const y = (-legs * k) / 4;
                const dx = (w * 0.1 * k) / 4;
                line(ctx, [[w * 0.2 + dx, y], [w * 0.8 - dx, y - legs / 4]], SIL[2], 1.4);
                line(ctx, [[w * 0.8 - dx, y], [w * 0.2 + dx, y - legs / 4]], SIL[2], 1.4);
            }
            const tank = [[w * 0.18, -legs], [w * 0.18, -top * 0.88], [w * 0.5, -top], [w * 0.82, -top * 0.88], [w * 0.82, -legs]];
            shape(ctx, tank, SIL[3]);
            G.grain(ctx, G.polyRegion(ctx, tank), seed + 1, 0.5);
            G.drips(ctx, w * 0.18, -top * 0.86, w * 0.64, top * 0.3, seed + 2, 4, false);
            for (let k = 0; k < 3; k++)
                flat(ctx, w * 0.18, -legs - 8 - k * 12, w * 0.64, 1.2, SIL[4]);
            const hole = blob(w * 0.62, -legs - 18, 6, 5, seed + 3, 9);
            shape(ctx, hole, SIL[0]);
            G.rim(ctx, hole, seed + 4, SIL[4], SIL[0]);
        }
        else {
            const body = h * (0.55 + r() * 0.25);
            const roof = [[0, -body * 0.8], ...jag(0, w * 0.4, -body, 10, 5, seed + 5), [w * 0.5, -body * 0.86], ...jag(w * 0.5, w, -body * 0.7, 8, 5, seed + 6)];
            const out = [[0, 0], ...roof, [w, 0]];
            shape(ctx, out, SIL[3]);
            ctx.save();
            path(ctx, out);
            ctx.clip();
            flat(ctx, 0, -body, 4, body, SIL[4]);
            flat(ctx, w - 5, -body, 5, body, SIL[1]);
            const windows = [];
            for (let y = -24; y > -body + 14; y -= 30) {
                flat(ctx, 0, y, w, 2, SIL[4]);
                for (let x = 8; x < w - 10; x += 16) {
                    if (r() <= 0.15)
                        continue;
                    const lit = r() < 0.08;
                    flat(ctx, x, y - 18, 8, 12, lit ? "#3a3420" : SIL[0]);
                    if (!lit)
                        windows.push(rectPts(x, y - 18, 8, 12));
                }
            }
            outside(ctx, windows, () => {
                G.grain(ctx, G.polyRegion(ctx, out), seed + 7, 0.5);
                G.drips(ctx, 0, -body * 0.8, w, body * 0.3, seed + 8, round(w / 14), false);
                G.dirt(ctx, 0, -body, w, body, seed + 9, min(0.3, 40 / body));
            });
            ctx.restore();
            const hole = blob(w * (0.3 + r() * 0.4), -body * 0.55, w * 0.14, 10, seed + 10, 11);
            clipped(ctx, out, () => outside(ctx, windows, () => G.scorch(ctx, hole, seed + 11)));
            shape(ctx, hole, SIL[0]);
            G.rim(ctx, hole, seed + 12, SIL[4], SIL[0]);
        }
        for (let x = 0; x < w; x += 16 + r() * 12)
            bush(ctx, x, 16 + r() * 12, 8 + r() * 8, SIL[1], seed + 40 + round(x));
    },
};
const crateCell = (ctx, x, y, s) => {
    const r = rng(s);
    const t = CRATE;
    flat(ctx, x, y, 24, 24, t[1]);
    flat(ctx, x + 1.2, y + 1.2, 21.6, 17.6, r() < 0.2 ? t[0] : t[1]);
    flat(ctx, x, y, 24, 1.2, t[3]);
    flat(ctx, x, y, 1.2, 19, t[2]);
    flat(ctx, x + 22.8, y, 1.2, 19, t[0]);
    shape(ctx, [[x + 2, y + 15], [x + 17, y + 2], [x + 22, y + 2], [x + 22, y + 5], [x + 7, y + 18], [x + 2, y + 18]], t[2], t[4]);
    if (!simple())
        line(ctx, [[x + 3, y + 15], [x + 17.5, y + 2.6]], t[3], 0.6);
    flat(ctx, x + 15.5, y + 1.2, 2.6, 17.6, t[2]);
    flat(ctx, x + 15.5, y + 1.2, 0.8, 17.6, t[3]);
    if (!simple())
        for (const [px, py] of [[3, 3], [21, 3], [3, 17], [21, 17]])
            flat(ctx, x + px - 0.7, y + py - 0.7, 1.4, 1.4, t[3]);
    flat(ctx, x, y + 19, 24, 5, t[4]);
    flat(ctx, x + 0.6, y + 20.4, 22.8, 1.6, r() < 0.15 ? SEAM[0] : SEAM[1]);
    if (!simple())
        flat(ctx, x + 0.6, y + 20.4, 22.8, 0.5, SEAM[3]);
    if (r() < 0.3)
        G.rustPatch(ctx, x + 4 + r() * 14, y + 6 + r() * 8, 2 + r() * 2, 1.2 + r(), s + 1);
    if (r() < 0.5)
        G.drips(ctx, x + 2, y + 24, 20, 10, s + 2, 1);
    if (r() < 0.12) {
        const dent = blob(x + 8 + r() * 8, y + 8 + r() * 6, 3 + r() * 2, 2.4, s + 3, 8);
        shape(ctx, dent, t[0]);
        G.rim(ctx, dent, s + 4, t[3], t[4]);
    }
};
const crateWall = {
    id: "crateWall",
    box: [0, -96, 96, 0],
    draw(ctx, _state, _t, { w = 96, h = 96 } = {}) {
        const seed = 3100;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, -h, w, h);
        ctx.clip();
        const bands = [];
        eachCell(ctx, 0, -h, w, h, 24, 24, (x, y, i, j) => {
            crateCell(ctx, x, y, cellSeed(seed, i, j));
            bands.push(rectPts(x, y + 19, 24, 5));
        });
        outside(ctx, bands, () => {
            G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 1, 0.8);
            G.dirt(ctx, 0, -h, w, h, seed + 2, min(0.3, 48 / h));
        });
        ctx.restore();
    },
};
const plateCell = (ctx, x, y, s) => {
    const r = rng(s);
    const t = PLATE;
    flat(ctx, x, y, 24, 24, t[1]);
    flat(ctx, x + 1, y + 1, 22, 22, r() < 0.25 ? t[1] : t[2]);
    flat(ctx, x + 1, y + 1, 22, 1, t[3]);
    flat(ctx, x + 1, y + 1, 1, 22, t[3]);
    flat(ctx, x + 22, y + 1, 1, 22, t[0]);
    flat(ctx, x + 1, y + 22, 22, 1, t[0]);
    outline(ctx, x, y, 24, 24, t[4]);
    rivets(ctx, x + 1, y + 3, 22, 4, t[3]);
    rivets(ctx, x + 1, y + 21, 22, 4, t[3]);
    G.drips(ctx, x + 1, y + 4, 22, 14, s + 1, r() < 0.5 ? 2 : 1);
    if (r() < 0.35)
        G.rustPatch(ctx, x + 4 + r() * 16, y + 8 + r() * 10, 2 + r() * 3, 1.4 + r(), s + 2);
    if (r() < 0.2)
        bulletHoles(ctx, x + 3, y + 5, 18, 14, 1 + floor(r() * 3), s + 3, t[3]);
};
const rivetWall = {
    id: "rivetWall",
    box: [0, -192, 72, 0],
    draw(ctx, state, _t, { w = 72, h = 192 } = {}) {
        const seed = 3200 + state;
        const post = state === 0 ? 10 : 0;
        const pw = w - post;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, -h, pw, h);
        ctx.clip();
        eachCell(ctx, 0, -h, pw, h, 24, 24, (x, y, i, j) => {
            const off = j % 2 ? -12 : 0;
            plateCell(ctx, x + off, y, cellSeed(seed, i, j));
            if (off && x + 24 >= pw - 0.001)
                plateCell(ctx, x + 12, y, cellSeed(seed, i + 1, j));
        });
        G.grain(ctx, G.rectRegion(ctx, 0, -h, pw, h), seed + 1);
        G.dirt(ctx, 0, -h, pw, h, seed + 2, min(0.3, 40 / h));
        ctx.restore();
        if (state !== 0)
            return;
        pier(ctx, pw, -h, post, h, PLATE);
        flat(ctx, pw + 1, -h, 1.6, h, PLATE[3]);
        flat(ctx, pw + post - 2.6, -h, 1.6, h, PLATE[0]);
        for (let y = -h + 12; y < 0; y += 24) {
            flat(ctx, pw - 1, y, post + 2, 3, PLATE[3], PLATE[4]);
            within(ctx, [[pw, -h, post, h]], () => G.drips(ctx, pw, y + 3, post, 10, seed + 10 - y, 1));
        }
        within(ctx, [[pw, -h, post, h]], () => G.surface(ctx, pw, -h, post, h, seed + 3, { rise: min(0.3, 40 / h), drip: 1, dripLen: 30, edge: false }));
    },
};
const plankWall = {
    id: "plankWall",
    box: [0, -192, 72, 0],
    draw(ctx, state, _t, { w = 72, h = 192 } = {}) {
        const seed = 3300 + state;
        const r = rng(seed);
        planks(ctx, 0, -h, w, h, seed, true);
        const gaps = [];
        eachCell(ctx, 0, -h, w, h, 6, 24, (x, y, i, j) => {
            const k = rng(cellSeed(seed, i, j))();
            if (k < 0.06) {
                flat(ctx, x + 0.4, y, 5, 24, HOLE);
                gaps.push(rectPts(x + 0.4, y, 5, 24));
            }
            else if (k < 0.12)
                flat(ctx, x + 0.4, y, 5, 24, PLANK[0]);
        });
        for (const x of [0, w - 8]) {
            pier(ctx, x, -h, 8, h, PLANK);
            within(ctx, [[x, -h, 8, h]], () => G.surface(ctx, x, -h, 8, h, seed + x + 1, { rise: 0.2, edge: false }));
        }
        for (let y = -h + 30; y < -10; y += 60) {
            band(ctx, 0, y, w, 6, PLANK);
            if (!simple())
                for (let x = 4; x < w; x += 6)
                    flat(ctx, x, y + 2.5, 1, 1, "#9a948a");
            within(ctx, [[0, y, w, 18]], () => outside(ctx, gaps, () => G.drips(ctx, 0, y + 6, w, 12, seed + 5 - y, round(w / 18))));
        }
        G.chips(ctx, 0, -h, w, seed + 6, G.DIRT);
        if (state === 1) {
            ctx.save();
            ctx.globalAlpha = 0.75;
            shape(ctx, [[0, 0], ...jag(0, w, -h * 0.45, h * 0.15, 6, seed + 7), [w, 0]], BURNT[0]);
            ctx.restore();
            for (let k = 0; k < 2; k++) {
                const hole = blob(w * (0.3 + k * 0.4), -h * (0.3 + r() * 0.3), 8 + r() * 4, 10 + r() * 6, seed + 8 + k, 11);
                within(ctx, [[0, -h, w, h]], () => outside(ctx, gaps, () => breach(ctx, hole, seed + 10 + k * 3, "#c87a3a", BURNT[0])));
            }
            G.chips(ctx, 0, -h * 0.45, w, seed + 20, "#d0702a");
        }
        tufts(ctx, 0, w, 0, seed + 30, 0.6, 4);
    },
};
const GATE = ["#3a403e", "#4e5654", "#626a66", "#7a8480", "#121614"];
const MOSS = ["#22220e", "#363418", "#4a4824", "#686638", "#0c0c06"];
const SLAB = ["#4a3e32", "#66584a", "#7e705e", "#988a76", "#18140e"];
const RAIL = ["#4e4a40", "#7c7666", "#9c9682", "#bcb6a0", "#1a1812"];
const gatePipe = (ctx, x, y, h) => {
    flat(ctx, x, y, 2, h, TUBE[1], TUBE[4]);
    flat(ctx, x + 0.5, y, 0.8, h, TUBE[3]);
};
const gateRails = (ctx, x, w) => {
    flat(ctx, x, -24, w, 24, GATE[0], GATE[4]);
    tube(ctx, x, -23, w, 5, RAIL);
    flat(ctx, x, -18, w, 3, GATE[1]);
    tube(ctx, x, -15, w, 5, RAIL);
    flat(ctx, x, -10, w, 1.6, MOSS[0]);
};
const steelGate = (ctx, x, seed) => {
    flat(ctx, x, -72, 24, 24, MOSS[1], MOSS[4]);
    flat(ctx, x, -72, 24, 1.6, MOSS[3]);
    flat(ctx, x + 1, -65, 14, 17, GATE[2], GATE[4]);
    flat(ctx, x + 1, -65, 14, 1.2, GATE[3]);
    flat(ctx, x + 16.5, -70, 1.6, 22, MOSS[0]);
    G.grain(ctx, G.rectRegion(ctx, x, -72, 24, 24), seed, 0.9);
    flat(ctx, x, -48, 24, 24, GATE[2], GATE[4]);
    flat(ctx, x, -48, 24, 2.4, MOSS[2], MOSS[4]);
    strut(ctx, x + 3, -25, x + 21, -45, 1.2, GATE);
    gatePipe(ctx, x + 1.5, -46, 22);
    gatePipe(ctx, x + 16.5, -46, 22);
    if (!simple())
        flat(ctx, x + 17, -36, 1, 12, TUBE[3]);
    flat(ctx, x, -40, 3.6, 6, GATE[1], GATE[4]);
    gateRails(ctx, x, 24);
    strut(ctx, x + 2, -1, x + 14, -9, 1.2, GATE);
    gatePipe(ctx, x + 1.5, -24, 24);
    gatePipe(ctx, x + 16.5, -24, 24);
    G.grain(ctx, G.rectRegion(ctx, x, -48, 24, 48), seed + 1, 0.7);
    within(ctx, [[x, -72, 24, 72]], () => {
        G.drips(ctx, x, -46, 24, 8, seed + 2, 1);
        G.drips(ctx, x, -10, 24, 8, seed + 3, 2);
    });
    G.chips(ctx, x, -72, 24, seed + 4, MOSS[0]);
    G.dirt(ctx, x, -12, 24, 12, seed + 5, 0.5);
    G.rustPatch(ctx, x + 8, -30, 3, 2, seed + 6);
};
const gateBlock = (ctx, x, seed) => {
    flat(ctx, x, -48, 24, 8, GATE[2], GATE[4]);
    flat(ctx, x, -48, 24, 2.4, MOSS[2], MOSS[4]);
    gatePipe(ctx, x + 17, -46, 6);
    flat(ctx, x, -40, 2, 16, GATE[1]);
    band(ctx, x + 2, -40, 22, 16, SLAB);
    gateRails(ctx, x, 22);
    band(ctx, x + 2, -8, 22, 8, SLAB);
    gatePipe(ctx, x + 17, -24, 24);
    const block = [[x, -48, 24, 24], [x, -24, 22, 24], [x + 22, -8, 2, 8]];
    G.grain(ctx, G.rectsRegion(ctx, block), seed, 0.9);
    G.grain(ctx, G.rectRegion(ctx, x + 2, -40, 22, 16), seed + 1);
    within(ctx, block, () => {
        G.drips(ctx, x, -46, 24, 10, seed + 2, 2);
        G.dirt(ctx, x, -10, 24, 10, seed + 4, 0.6);
    });
    G.chips(ctx, x, -40, 24, seed + 3, G.DIRT);
};
const gateRuin = (ctx, x, seed) => {
    const stub = [[x + 10, 0], [x + 11, -8], [x + 14, -14], [x + 13, -20], [x + 17, -26], [x + 18, -31], [x + 14, -34], [x + 20, -38], [x + 21, -40], [x + 24, -38], [x + 24, 0]];
    shape(ctx, stub, MOSS[2], MOSS[4]);
    clipped(ctx, stub, () => {
        G.scorch(ctx, stub, seed + 1);
        flat(ctx, x + 20, -38, 1.6, 30, MOSS[1]);
        G.grain(ctx, G.polyRegion(ctx, stub), seed + 2);
        G.rim(ctx, stub, seed + 3, MOSS[3], HOLE);
    });
    const slab = [[x, -8], [x, -22], [x + 4, -24], [x + 15, -23], [x + 19, -20], [x + 24, -21], [x + 24, -8]];
    shape(ctx, slab, SLAB[2], SLAB[4]);
    G.grain(ctx, G.polyRegion(ctx, slab), seed + 4);
    for (const [a, b] of [[3, 7], [8, 12], [12, 15]]) {
        line(ctx, [[x + a, -21], [x + a + 3, -15], [x + b, -9]], "#b8281a", 1.8);
        line(ctx, [[x + a + 1, -20], [x + a + 3.5, -14]], "#e06a1c", 0.8);
    }
    clipped(ctx, slab, () => G.rim(ctx, slab, seed + 5, SLAB[3], HOLE));
    flat(ctx, x, -8, 24, 8, SLAB[1], SLAB[4]);
    flat(ctx, x + 11, -8, 13, 8, MOSS[1]);
    within(ctx, [[x, -8, 24, 8]], () => G.dirt(ctx, x - 24, -8, 48, 8, seed + 6, 0.7));
    const shard = [[x + 8, -43], [x + 14, -44], [x + 14.5, -38], [x + 8.5, -37]];
    shape(ctx, shard, "#6a2a10", "#1a0804");
    for (const k of [9.5, 11.5, 13])
        line(ctx, [[x + k, -43.5], [x + k + 0.3, -37.5]], "#e06a1c", 0.8);
    flat(ctx, x + 8.3, -41, 6, 0.8, "#b8ae94");
    for (const [cx, w, h, i] of [[-19, 7, 2.6, 0], [-11, 4, 1.8, 1], [-4, 6, 3, 2], [3, 4, 2, 3]]) {
        const chunk = [[x + cx, 0], [x + cx + 0.6, -h * 0.7], [x + cx + w * 0.35, -h], [x + cx + w * 0.8, -h * 0.85], [x + cx + w, 0]];
        shape(ctx, chunk, i % 2 ? GATE[1] : SLAB[1], HOLE);
        flat(ctx, x + cx + w * 0.3, -h + 0.3, w * 0.4, 0.7, i % 2 ? GATE[3] : SLAB[3]);
    }
};
const FENCE_POST = 72;
const meshFence = (ctx, state, w) => {
    const seed = 3500 + state;
    const r = rng(seed);
    const tear = blob(w * 0.42, -24, 13, 15, seed + 1, 13);
    ctx.save();
    if (state === 1) {
        path(ctx, tear);
        ctx.rect(0, -52, w, 52);
        ctx.clip("evenodd");
    }
    flat(ctx, 0, -50, w, 48, "#00000022");
    net(ctx, 0, -50, w, 48, "#8a9488", 4);
    ctx.restore();
    if (state === 1) {
        outside(ctx, [tear], () => G.rim(ctx, tear, seed + 2, "#b0b8ae", RUSTY));
        if (!simple())
            tear.forEach(([x, y], i) => {
                if (i % 2 === 0)
                    line(ctx, [[x, y], [x + (r() - 0.5) * 5, y + (r() - 0.3) * 5]], "#8a9488", 0.5);
            });
    }
    tube(ctx, 0, -52, w, 2.6, TUBE);
    tube(ctx, 0, -3, w, 2, TUBE);
    if (state === 1)
        within(ctx, [[0, -3, w, 2]], () => G.rustPatch(ctx, w * 0.42 + 10, -2, 5, 1.2, seed + 3));
    const posts = [];
    for (let x = 0; x < w; x += FENCE_POST)
        posts.push([min(x, w - 3), -56, 3, 56]);
    for (let x = 0; x < w; x += FENCE_POST) {
        const px = min(x, w - 3);
        pier(ctx, px, -56, 3, 56, TUBE);
        flat(ctx, px - 0.6, -57, 4.2, 1.6, TUBE[1], TUBE[4]);
        within(ctx, [[px, -56, 3, 56]], () => G.drips(ctx, px, -54, 3, 30, seed + 10 + x, 1));
        if (state === 0 && (x / FENCE_POST) % 2 === 0 && x + 30 < w) {
            flat(ctx, px + 12, -44, 16, 9, "#9a9a92", "#1e1e1a");
            flat(ctx, px + 14, -41.5, 12, 1.4, "#a8281c");
            flat(ctx, px + 14, -38.5, 8, 1.4, "#a8281c");
            G.chips(ctx, px + 12, -44, 16, seed + 20 + x, G.DIRT);
            within(ctx, [[px + 12, -44, 16, 9]], () => G.drips(ctx, px + 12, -41, 16, 8, seed + 21 + x, 2));
        }
    }
    within(ctx, [[0, -52, w, 2.6], ...posts], () => G.drips(ctx, 0, -52, w, 18, seed + 4, round(w / 14)));
    within(ctx, [[0, -3, w, 2], ...posts], () => {
        if (w > 6)
            G.grain(ctx, G.rectRegion(ctx, 0, -12, w, 12), seed + 5, 0.6);
        G.dirt(ctx, 0, -16, w, 16, seed + 6, 0.6);
    });
    tufts(ctx, 0, w, 0, seed + 7, 0.7, 7);
};
const curb = (ctx, x, w, seed, trampled) => {
    flat(ctx, x, 0, w, 24, STONE[0]);
    flat(ctx, x, 0, w, 6, trampled ? "#3a3220" : GRASS[1]);
    flat(ctx, x, 0, w, 1.6, trampled ? "#5a4a2a" : GRASS[2]);
    eachCell(ctx, x, 5, w, 15, 12, 15, (cx, _cy, i) => {
        const r = rng(seed + i * 53);
        const sx = cx + 0.6 + r();
        const sw = 10.4 - r() * 1.6;
        const sy = 6.5 + r() * 1.2;
        const sh = 11.5 - r() * 1.2;
        const stone = [[sx + 1.5, sy], [sx + sw - 1.5, sy], [sx + sw, sy + 2], [sx + sw, sy + sh - 1.5], [sx + sw - 2, sy + sh], [sx + 2, sy + sh], [sx, sy + sh - 2], [sx, sy + 1.5]];
        shape(ctx, stone, r() < 0.3 ? STONE[1] : STONE[2], STONE[4]);
        if (!simple()) {
            flat(ctx, sx + 1.5, sy + 0.6, sw - 3, 1.2, STONE[3]);
            if (r() < 0.4)
                line(ctx, [[sx + 2 + r() * 4, sy + 2], [sx + 3 + r() * 5, sy + sh - 2]], STONE[4], 0.5);
        }
        if (r() < 0.35)
            G.drips(ctx, sx + 1, sy + sh - 1, sw - 2, 6, seed + i * 7 + 1, 1, false);
        if (!trampled && r() < 0.3)
            flat(ctx, sx, sy, sw * (0.3 + r() * 0.4), 1.6, LEAF[1]);
    });
    flat(ctx, x, 19.5, w, 4.5, STONE[4]);
    G.grain(ctx, G.rectRegion(ctx, x, 0, w, 24), seed + 1);
    G.chips(ctx, x, 0.4, w, seed + 2, G.DIRT);
    G.dirt(ctx, x, 12, w, 12, seed + 3, 0.6);
    tufts(ctx, x, w, 1, seed + 4, trampled ? 0.25 : 0.85, trampled ? 3 : 6);
};
const grassyWalkway = {
    id: "grassyWalkway",
    box: [0, -6, 120, 25],
    draw(ctx, state, _t, { w = 120 } = {}) {
        curb(ctx, 0, w, 3600 + state * 7, state === 1);
    },
};
const steelDeckPlate = {
    id: "steelDeckPlate",
    box: [0, -6, 72, 25],
    draw(ctx, _state, _t, { w = 72 } = {}) {
        const seed = 3700;
        eachCell(ctx, 0, 0, w, 24, 24, 24, (x, _y, i) => {
            const r = rng(seed + i * 31);
            band(ctx, x, 0, 24, 19, PLATE);
            if (!simple())
                for (let k = 0; k < 4; k++)
                    line(ctx, [[x + 3 + k * 5, 6], [x + 5 + k * 5, 4]], PLATE[3], 0.7);
            rivets(ctx, x, 2.5, 24, 6, PLATE[3]);
            rivets(ctx, x, 16, 24, 6, PLATE[3]);
            G.drips(ctx, x + 1, 3, 22, 14, seed + i * 31 + 1, 2);
            if (r() < 0.5)
                G.rustPatch(ctx, x + 4 + r() * 16, 10, 2.5 + r() * 2, 1.4, seed + i * 31 + 2);
            if (r() < 0.25)
                within(ctx, [[x, 0, 24, 19]], () => bulletHoles(ctx, x + 3, 6, 18, 8, 1, seed + i * 31 + 3, PLATE[3]));
        });
        flat(ctx, 0, 19, w, 5, PLATE[4]);
        flat(ctx, 0, 20.5, w, 1, SEAM[1]);
        G.grain(ctx, G.rectRegion(ctx, 0, 0, w, 19), seed + 4);
        G.chips(ctx, 0, 0.4, w, seed + 5);
        tufts(ctx, 0, w, 1, seed + 6, 0.3, 4);
    },
};
const trussWalkway = {
    id: "trussWalkway",
    box: [0, -30, 144, 1],
    draw(ctx, _state, _t, { w = 144 } = {}) {
        const seed = 3800 + round(w);
        eachCell(ctx, 14, -17, w - 28, 13, 24, 13, (x) => {
            wornStrut(ctx, x + 1, -16, x + 23, -4, 2.6, BRONZE, 3800 + x);
            wornStrut(ctx, x + 1, -4, x + 23, -16, 2.6, BRONZE, 3900 + x);
        });
        band(ctx, 0, -5, w, 5, BRONZE);
        rivets(ctx, 0, -2.5, w, 8, BRONZE[3]);
        flat(ctx, 0, -24, w, 8, STONE[1], STONE[4]);
        flat(ctx, 0, -24, w, 3, GRASS[1]);
        flat(ctx, 0, -24, w, 1, GRASS[2]);
        eachCell(ctx, 0, -21, w, 5, 12, 5, (x, _y, i) => {
            flat(ctx, x + 11, -21, 1, 5, STONE[4]);
            if (rng(seed + i)() < 0.4)
                flat(ctx, x + 1, -20.4, 9, 1, STONE[3]);
        });
        flat(ctx, 0, -16.5, w, 1.4, STONE[4]);
        G.grain(ctx, G.rectRegion(ctx, 0, -24, w, 8), seed + 1);
        G.grain(ctx, G.rectRegion(ctx, 0, -5, w, 5), seed + 2);
        eachCell(ctx, 0, -24, w, 24, 96, 24, (x, _y, i) => {
            const cw = min(96, w - x);
            const r = rng(seed + 10 + i);
            within(ctx, [[x, -24, cw, 8], [x, -5, cw, 5]], () => {
                G.drips(ctx, x, -21, cw, 5, seed + 11 + i * 3, 3, false);
                G.drips(ctx, x, -5, cw, 5, seed + 12 + i * 3, 2);
                if (r() < 0.6)
                    G.rustPatch(ctx, x + r() * cw, -3, 3, 1.2, seed + 13 + i * 3);
            });
            G.chips(ctx, x, -23.6, cw, seed + 14 + i * 3, G.DIRT);
        });
        for (const x of [0, w - 14]) {
            pier(ctx, x, -24, 14, 24, STONE);
            if (!simple())
                for (let y = -20; y < 0; y += 6)
                    flat(ctx, x + 1, y, 12, 0.8, STONE[4]);
            G.surface(ctx, x, -24, 14, 24, seed + 20 + x, { rise: 0.4, drip: 1, dripLen: 10 });
        }
        tufts(ctx, 0, w, -23, seed + 30, 0.8, 5);
    },
};
const STOREY = 72;
const windowPane = (ctx, x, y, w, h, seed, holes = []) => {
    const r = rng(seed);
    flat(ctx, x - 2, y - 2, w + 4, h + 4, CONC[1], CONC[4]);
    flat(ctx, x, y, w, h, HOLE);
    holes.push(rectPts(x, y, w, h));
    const kind = r();
    if (kind < 0.3) {
        for (let k = 0; k < 3; k++) {
            ctx.save();
            ctx.translate(x + w / 2, y + 3 + (k * (h - 6)) / 2);
            ctx.rotate((r() - 0.5) * 0.3);
            flat(ctx, -w / 2 - 1, -1.8, w + 2, 3.6, k % 2 ? PLANK[2] : PLANK[1], PLANK[4]);
            ctx.restore();
        }
    }
    else if (!simple()) {
        flat(ctx, x + w / 2 - 0.6, y, 1.2, h, CONC[0]);
        flat(ctx, x, y + h / 2 - 0.6, w, 1.2, CONC[0]);
        if (kind > 0.6)
            shape(ctx, [[x, y + h], [x + w * 0.3, y + h * 0.4], [x + w * 0.45, y + h]], "#1c2a2c");
    }
    band(ctx, x - 3, y + h + 1, w + 6, 2.6, CONC);
    G.drips(ctx, x - 2, y + h + 3.6, w + 4, 14, seed + 1, 2);
    if (r() < 0.35)
        soot(ctx, x, y, w, 10);
};
const villageHouse = {
    id: "villageHouse",
    box: [-4, -160, 196, 2],
    draw(ctx, state, _t, { w = 192, h = 144 } = {}) {
        const seed = 3900 + state * 17 + round(w);
        const r = rng(seed);
        const storeys = max(1, round(h / STOREY));
        const sh = h / storeys;
        const ruined = state === 1;
        const roof = ruined ? [[0, -h * 0.72], ...jag(0, w * 0.35, -h, 10, 6, seed + 1), [w * 0.45, -h * 0.8], ...jag(w * 0.5, w, -h * 0.9, 12, 6, seed + 2), [w, -h * 0.7]] : [[0, -h], [w, -h]];
        const body = [[0, 0], ...roof, [w, 0]];
        shape(ctx, body, CONC[2], CONC[4]);
        G.grain(ctx, G.polyRegion(ctx, body), seed + 3);
        G.dirt(ctx, 0, -h, w, h, seed + 4, min(0.3, 48 / h));
        ctx.save();
        path(ctx, body);
        ctx.clip();
        const bays = max(1, round((w - 28) / 44));
        const bw = (w - 28) / bays;
        const holes = [];
        for (let s = 0; s < storeys; s++) {
            const y0 = -(s + 1) * sh;
            for (let b = 0; b < bays; b++) {
                const x = 14 + b * bw;
                if (s === 0 && b === floor(bays / 2)) {
                    if (ruined) {
                        const arch = [[x + 4, 0], [x + 4, -sh * 0.55], ...Array.from({ length: 9 }, (_, k) => [x + bw / 2 - cos((k / 8) * PI) * (bw / 2 - 4), -sh * 0.55 - sin((k / 8) * PI) * (bw / 2 - 4) * 0.7]), [x + bw - 4, -sh * 0.55], [x + bw - 4, 0]];
                        shape(ctx, arch, HOLE, CONC[4]);
                        G.rim(ctx, arch, seed + 5, CONC[3], CONC[4]);
                        holes.push(arch);
                    }
                    else {
                        const dh = sh * 0.7;
                        const dw = dh * 0.5;
                        const dx = x + bw / 2 - dw / 2;
                        flat(ctx, dx, -dh, dw, dh, HOLE, CONC[4]);
                        holes.push(rectPts(dx, -dh, dw, dh));
                        shape(ctx, [[dx, 0], [dx, -dh], [dx + dw * 0.4, -dh * 0.95], [dx + dw * 0.4, -2]], PLANK[2], PLANK[4]);
                        band(ctx, dx - 3, -dh - 4, dw + 6, 4, CONC);
                    }
                    continue;
                }
                windowPane(ctx, x + 6, y0 + sh * 0.22, bw - 12, sh * 0.42, seed + 10 + s * 31 + b, holes);
            }
            if (s > 0) {
                band(ctx, -2, y0 + sh - 5, w + 4, 5, CONC);
                G.chips(ctx, -2, y0 + sh - 5, w + 4, seed + 40 + s, G.DIRT);
                outside(ctx, holes, () => G.drips(ctx, 0, y0 + sh, w, sh * 0.4, seed + 41 + s, round(w / 24)));
            }
            const rx = 20 + r() * (w - 40);
            outside(ctx, holes, () => G.rustPatch(ctx, rx, y0 + sh * 0.8, 4 + r() * 3, 2, seed + 50 + s));
        }
        for (let b = 0; b <= bays; b++) {
            const x = b === 0 ? 0 : b === bays ? w - 14 : 14 + b * bw - 3;
            const pw = b === 0 || b === bays ? 14 : 6;
            pier(ctx, x, -h, pw, h, CONC, false);
            within(ctx, [[x, -h, pw, h]], () => G.surface(ctx, x, -h, pw, h, seed + 60 + b, { rise: min(0.3, 40 / h), drip: 1, dripLen: 30, edge: false }));
        }
        ctx.restore();
        if (ruined) {
            const hole = blob(w * 0.7, -h * 0.55, w * 0.12, sh * 0.32, seed + 70, 14);
            outside(ctx, holes, () => breach(ctx, hole, seed + 71, CONC[3], CONC[4], "#0c1412"));
            sootEdge(ctx, roof, sh * 0.45, seed + 74, body, holes);
            line(ctx, roof, CONC[4], 1);
            for (const [x, cw, ch] of [[w * 0.2, 10, 6], [w * 0.62, 14, 8], [w * 0.85, 8, 5]])
                shape(ctx, [[x, 0], [x + cw * 0.3, -ch], [x + cw * 0.8, -ch * 0.7], [x + cw, 0]], CONC[1], CONC[4]);
        }
        else {
            band(ctx, -3, -h - 6, w + 6, 6, CONC);
            G.chips(ctx, -3, -h - 6, w + 6, seed + 72, G.DIRT);
            clipped(ctx, body, () => outside(ctx, holes, () => G.drips(ctx, -3, -h, w + 6, 24, seed + 73, round(w / 20))));
            if (!simple())
                for (let x = 6; x < w; x += 30 + r() * 20)
                    line(ctx, [[x, -h - 6], [x + 1, -h - 10]], RUSTY, 0.7);
        }
        flat(ctx, 0, -4, w, 4, CONC[1], CONC[4]);
    },
};
const stiltBuilding = {
    id: "stiltBuilding",
    box: [-8, -204, 248, 2],
    draw(ctx, state, _t, { w = 240, h = 192 } = {}) {
        const seed = 4000 + state * 19 + round(w);
        const r = rng(seed);
        const burnt = state === 1;
        const stilt = max(24, round((h * 0.38) / 24) * 24);
        const top = -h + 10;
        const legs = [10, w / 2 - 8, w - 26];
        for (const x of legs) {
            pier(ctx, x, -stilt, 16, stilt, CONC);
            within(ctx, [[x, -stilt, 16, stilt]], () => G.surface(ctx, x, -stilt, 16, stilt, seed + round(x), { rise: 0.4, drip: 2, dripLen: 24, edge: false }));
            flat(ctx, x - 3, -6, 22, 6, CONC[1], CONC[4]);
        }
        strut(ctx, legs[0] + 16, -stilt + 8, legs[1], -12, 2.4, BRONZE);
        strut(ctx, legs[2], -stilt + 8, legs[1] + 16, -12, 2.4, BRONZE);
        const bodyH = -stilt - top;
        planks(ctx, 0, top, w, bodyH, seed + 1);
        band(ctx, -4, -stilt - 8, w + 8, 8, PLANK);
        for (const x of legs)
            within(ctx, [[x, -stilt, 16, stilt]], () => G.drips(ctx, x, -stilt, 16, 18, seed + 2 + round(x), 2));
        const rows = max(1, round(bodyH / 60));
        const rh = bodyH / rows;
        const halfW = w / 2 - 15;
        const per = max(1, round(halfW / 56));
        const ww = min(24, halfW / per - 14);
        const wh = rh * 0.38;
        const holes = [];
        for (let k = 0; k < rows; k++) {
            const y = top + k * rh + rh * 0.28;
            for (let c = 0; c < per * 2; c++) {
                const half = c < per ? 10 : w / 2 + 5;
                const x = half + ((c % per) + 0.5) * (halfW / per) - ww / 2;
                flat(ctx, x - 2, y - 2, ww + 4, wh + 4, PLANK[3], PLANK[4]);
                flat(ctx, x, y, ww, wh, HOLE);
                holes.push(rectPts(x, y, ww, wh));
                if (!simple()) {
                    flat(ctx, x + ww / 2 - 0.7, y, 1.4, wh, PLANK[1]);
                    if (r() < 0.4)
                        flat(ctx, x, y, ww, wh * 0.3, "#24302c");
                }
                band(ctx, x - 5, y - 6, ww + 10, 4, PLANK);
                band(ctx, x - 5, y + wh + 2, ww + 10, 3.4, PLANK);
                if (r() < 0.3) {
                    ctx.save();
                    ctx.translate(x + ww / 2, y + wh * 0.5);
                    ctx.rotate((r() - 0.5) * 0.5);
                    flat(ctx, -ww / 2 - 3, -2, ww + 6, 4, PLANK[2], PLANK[4]);
                    ctx.restore();
                }
                outside(ctx, holes, () => G.drips(ctx, x - 4, y + wh + 5.4, ww + 8, 10, seed + 70 + k * 17 + c, 2));
            }
            if (k > 0)
                band(ctx, 0, top + k * rh - 3, w, 4, PLANK);
        }
        for (const x of [0, w / 2 - 5, w - 10]) {
            pier(ctx, x, top, 10, bodyH, PLANK);
            within(ctx, [[x, top, 10, bodyH]], () => G.surface(ctx, x, top, 10, bodyH, seed + 30 + round(x), { rise: 0.2, edge: false }));
        }
        const eave = burnt
            ? [[-8, top], [-6, top - 6], ...jag(0, w * 0.4, top - 10, 6, 6, seed + 40), [w * 0.5, top - 2], ...jag(w * 0.6, w, top - 8, 6, 6, seed + 41), [w + 6, top - 4], [w + 8, top]]
            : [[-8, top], [-4, top - 10], [w + 4, top - 10], [w + 8, top]];
        shape(ctx, eave, BRONZE[1], BRONZE[4]);
        if (!simple())
            for (let x = -4; x < w + 4; x += 5)
                line(ctx, [[x, top - 9.5], [x + 1, top - 0.5]], BRONZE[0], 0.6);
        within(ctx, [[0, top, w, bodyH]], () => outside(ctx, holes, () => G.drips(ctx, -8, top, w + 16, 16, seed + 42, round(w / 16))));
        G.rustPatch(ctx, w * 0.3, top - 5, 6, 2, seed + 43);
        if (burnt) {
            ctx.save();
            ctx.globalAlpha = 0.7;
            shape(ctx, [[0, -stilt - 8], ...jag(0, w, top + bodyH * 0.35, bodyH * 0.3, 8, seed + 50), [w, -stilt - 8]], BURNT[0]);
            ctx.restore();
            const windows = holes.slice();
            for (let k = 0; k < 3; k++) {
                const hole = blob(w * (0.2 + k * 0.3), top + bodyH * (0.35 + r() * 0.3), 12 + r() * 6, 10 + r() * 6, seed + 51 + k, 12);
                outside(ctx, windows, () => breach(ctx, hole, seed + 55 + k * 3, "#c87a3a", BURNT[0]));
                holes.push(hole);
            }
            for (let k = 0; k < 4; k++) {
                const x = w * (0.15 + k * 0.22);
                shape(ctx, [[x, top - 6], [x + 2, top - 24 - r() * 12], [x + 5, top - 6]], BURNT[2], BURNT[4]);
            }
            sootEdge(ctx, eave.slice(1, -1), 10, seed + 62, eave);
            sootEdge(ctx, [[0, top], [w, top]], bodyH * 0.3, seed + 63, rectPts(0, top, w, bodyH), windows);
        }
        outside(ctx, holes, () => G.dirt(ctx, 0, top, w, bodyH, seed + 60, 0.25));
    },
};
const insulator = (ctx, x, y, n) => {
    flat(ctx, x - 0.8, y - n * 3, 1.6, n * 3, PORCELAIN[0]);
    for (let k = 0; k < n; k++) {
        flat(ctx, x - 3, y - k * 3 - 2.4, 6, 2, PORCELAIN[2], PORCELAIN[0]);
        if (!simple())
            flat(ctx, x - 3, y - k * 3 - 2.4, 6, 0.6, PORCELAIN[3]);
    }
};
const arc = (ctx, ax, ay, bx, by, seed) => {
    const r = rng(seed);
    const n = 6;
    const pts = [];
    for (let i = 0; i <= n; i++)
        pts.push([ax + ((bx - ax) * i) / n + (i % n ? (r() - 0.5) * 5 : 0), ay + ((by - ay) * i) / n + (i % n ? (r() - 0.5) * 5 : 0)]);
    if (!simple())
        glow(ctx, (ax + bx) / 2, (ay + by) / 2, 12, SPARK[1], 0.35);
    line(ctx, pts, SPARK[0], 2);
    line(ctx, pts, SPARK[2], 0.7);
};
const boltSign = (ctx, cx, cy, s) => {
    shape(ctx, [[cx + 0.1 * s, cy - 0.5 * s], [cx - 0.3 * s, cy + 0.05 * s], [cx, cy + 0.05 * s], [cx - 0.15 * s, cy + 0.5 * s], [cx + 0.3 * s, cy - 0.1 * s], [cx, cy - 0.1 * s], [cx + 0.2 * s, cy - 0.5 * s]], SEAM[2], SEAM[4]);
};
const hvPanel = (ctx, x, y, w, h, seed, drip = true) => {
    flat(ctx, x, y, w, h, "#16402e", "#06120c");
    flat(ctx, x + 2, y + 2, w - 4, h - 4, "#1e5a3e");
    flat(ctx, x + 2, y + 2, w - 4, 1, "#3a8a62");
    boltSign(ctx, x + w / 2, y + h / 2, min(w, h) * 0.7);
    if (drip)
        G.drips(ctx, x, y + h, w, 10, seed, 2);
    else
        within(ctx, [[x, y, w, h]], () => G.drips(ctx, x, y + h * 0.5, w, h * 0.5, seed, 2));
    G.chips(ctx, x, y + 1, w, seed + 1, G.DIRT);
};
const grille = (ctx, x, y, w, h, seed) => {
    flat(ctx, x - 1.5, y - 1.5, w + 3, h + 3, CONC[1], CONC[4]);
    flat(ctx, x, y, w, h, HOLE);
    for (let k = x + 2; k < x + w - 1; k += 4)
        pier(ctx, k, y, 2.4, h, TUBE, false);
    G.drips(ctx, x, y + h + 1.5, w, 16, seed, 2);
};
const powerHouse = {
    id: "powerHouse",
    box: [-4, -150, 172, 2],
    draw(ctx, state, _t, { w = 168, h = 120 } = {}) {
        const seed = 4100 + state * 23 + round(w);
        const r = rng(seed);
        const broken = state === 1;
        const roof = broken ? [[0, -h], ...jag(4, w * 0.45, -h, 4, 5, seed + 1), [w * 0.5, -h + 14], [w * 0.62, -h + 10], ...jag(w * 0.66, w, -h, 4, 5, seed + 2)] : [[0, -h], [w, -h]];
        const body = [[0, 0], ...roof, [w, 0]];
        shape(ctx, body, CONC[2], CONC[4]);
        G.grain(ctx, G.polyRegion(ctx, body), seed + 3);
        clipped(ctx, body, () => G.drips(ctx, 0, -h, w, h * 0.5, seed + 4, round(w / 14)));
        G.dirt(ctx, 0, -h, w, h, seed + 5, 0.3);
        band(ctx, 0, -h * 0.55, w, 4, CONC);
        G.chips(ctx, 0, -h * 0.55, w, seed + 6, G.DIRT);
        const bays = max(2, round(w / 40));
        const bw = w / bays;
        const vents = [];
        for (let b = 0; b < bays; b++) {
            const x = b * bw;
            if (b === floor(bays / 2)) {
                const dh = min(h * 0.5, 56);
                const dw = min(dh * 0.5, bw - 8);
                flat(ctx, x + bw / 2 - dw / 2, -dh, dw, dh, "#3a4440", PLATE[4]);
                flat(ctx, x + bw / 2 - dw / 2 + 2, -dh + 2, dw - 4, dh - 3, "#4c5852");
                hvPanel(ctx, x + bw / 2 - 7, -h * 0.85, 14, 16, seed + 7);
                G.rustPatch(ctx, x + bw / 2, -h * 0.2, 4, 2, seed + 8);
                continue;
            }
            grille(ctx, x + 8, -h * 0.9, bw - 16, h * 0.28, seed + 10 + b);
            grille(ctx, x + 8, -h * 0.45, bw - 16, h * 0.2, seed + 20 + b);
            vents.push(rectPts(x + 6.5, -h * 0.9 - 1.5, bw - 13, h * 0.28 + 3), rectPts(x + 6.5, -h * 0.45 - 1.5, bw - 13, h * 0.2 + 3));
        }
        line(ctx, [[4, -h * 0.6], [w - 4, -h * 0.6]], "#20201c", 1.6);
        for (let x = 10; x < w; x += 24)
            flat(ctx, x, -h * 0.6 - 1.5, 2, 3, TUBE[2]);
        for (const x of [0, w - 12]) {
            pier(ctx, x, -h, 12, h, CONC, false);
            within(ctx, [[x, -h, 12, h]], () => G.surface(ctx, x, -h, 12, h, seed + 30 + round(x), { rise: 0.3, drip: 1, dripLen: 30, edge: false }));
        }
        if (broken) {
            for (let k = 0; k < 3; k++) {
                const x = w * (0.48 + k * 0.08);
                line(ctx, [[x, -h + 12], [x + (r() - 0.5) * 10, -h - 6 - r() * 8]], RUSTY, 1);
            }
            arc(ctx, w * 0.5, -h + 8, w * 0.6, -h - 10, seed + 40);
            const hole = blob(w * 0.25, -h * 0.75, 9, 7, seed + 41, 10);
            outside(ctx, vents, () => breach(ctx, hole, seed + 42, CONC[3], CONC[4]));
            sootEdge(ctx, roof.slice(1), h * 0.22, seed + 43, body, vents);
        }
        else {
            band(ctx, -2, -h - 4, w + 4, 4, CONC);
            for (let x = 16; x < w - 10; x += 28)
                insulator(ctx, x, -h - 4, 3);
            if (!simple())
                curve(ctx, [[16, -h - 13], [w / 2, -h - 8], [w - 12, -h - 13]], "#141410", 0.7);
        }
        flat(ctx, 0, -4, w, 4, CONC[1], CONC[4]);
    },
};
const lampBox = (ctx, x, y, lit, seed) => {
    flat(ctx, x, y, 22, 20, "#2a1e14", "#0a0604");
    flat(ctx, x + 1, y + 1, 20, 1, "#4a3828");
    ctx.fillStyle = color(lit ? AMBER[1] : "#2a2018");
    ctx.beginPath();
    ctx.arc(x + 11, y + 9, 6, PI, 0);
    ctx.fill();
    stroke(ctx, "#0a0604");
    if (lit) {
        if (!simple())
            glow(ctx, x + 11, y + 6, 16, AMBER[2], 0.4);
        flat(ctx, x + 8, y + 5, 3, 1.6, AMBER[3]);
    }
    else
        line(ctx, [[x + 7, y + 4], [x + 11, y + 8], [x + 14, y + 5]], "#5a4a3a", 0.5);
    if (!simple())
        for (let k = 0; k < 3; k++)
            line(ctx, [[x + 6 + k * 5, y + 3], [x + 6 + k * 5, y + 9]], "#140c06", 0.6);
    flat(ctx, x + 4, y + 12, 9, 1.2, AMBER[1]);
    flat(ctx, x + 4, y + 15, 14, 0.9, "#6a5a40");
    flat(ctx, x + 4, y + 17, 11, 0.9, "#6a5a40");
    within(ctx, [[x, y, 22, 20]], () => G.drips(ctx, x + 1, y + 10, 20, 10, seed, 3));
    G.chips(ctx, x, y + 0.4, 22, seed + 1, G.DIRT);
};
const latticeMast = {
    id: "latticeMast",
    box: [-6, -216, 30, 0],
    draw(ctx, state, _t, { h = 216 } = {}) {
        const seed = 4200 + state;
        eachCell(ctx, 0, -h, 24, h, 24, 24, (x, y, _i, j) => {
            flat(ctx, x + 3, y, 18, 24, CRATE[0]);
            strut(ctx, x + 4, y + 1, x + 20, y + 23, 2.6, CRATE);
            strut(ctx, x + 20, y + 1, x + 4, y + 23, 2.6, CRATE);
            flat(ctx, x + 2, y + 22, 20, 2, CRATE[2], CRATE[4]);
            const r = rng(seed + j * 17);
            if (r() < 0.4)
                G.rustPatch(ctx, x + 12, y + 12, 2.5, 2, seed + j * 17 + 1);
        });
        for (const x of [0, 20]) {
            pier(ctx, x, -h, 4, h, CRATE);
            rivets(ctx, x, -h, 4, 4, CRATE[3]);
            G.grain(ctx, G.rectRegion(ctx, x, -h, 4, h), seed + x);
            within(ctx, [[x, -h, 4, h]], () => {
                G.drips(ctx, x, -h, 4, h * 0.6, seed + x + 1, max(1, round(h / 60)), false);
                G.rustPatch(ctx, x + 2, -h * 0.4, 1.6, 3, seed + x + 2);
            });
        }
        if (state === 0)
            for (let y = -48; y > -h + 24; y -= 72)
                lampBox(ctx, 1, y - 20, true, seed + y);
        band(ctx, -4, -6, 32, 6, CRATE);
        within(ctx, [[0, -24, 24, 18], [-4, -6, 32, 6]], () => G.dirt(ctx, -4, -24, 32, 24, seed + 9, 0.6));
    },
};
const warningLamp = {
    id: "warningLamp",
    box: [-2, -82, 26, -38],
    draw(ctx, state) {
        lampBox(ctx, 1, -62, state === 0, 4300 + state);
        if (state === 1 && !simple())
            bulletHoles(ctx, 4, -60, 14, 6, 2, 4301, "#6a5a40");
    },
};
const junctionBox = {
    id: "junctionBox",
    box: [-4, -52, 28, 0],
    draw(ctx, state, t, size) {
        const seed = 4400;
        box(ctx, 9, -30, 4, 28, "steel", 1, { vertical: true });
        G.grain(ctx, G.rectRegion(ctx, 9, -30, 4, 28), seed, 0.6);
        within(ctx, [[9, -30, 4, 28]], () => {
            G.drips(ctx, 9, -30, 4, 12, seed + 1, 1);
            G.rustPatch(ctx, 11, -6, 1.6, 2, seed + 2);
        });
        box(ctx, 4, -3, 14, 3, "steel", 2);
        within(ctx, [[4, -3, 14, 3]], () => G.dirt(ctx, 4, -3, 14, 3, seed + 3, 0.8));
        ctx.save();
        ctx.translate(0, -8);
        wireBox.draw(ctx, state, t, size);
        ctx.restore();
    },
};
const watchtower = {
    id: "watchtower",
    box: [-6, -184, 94, 0],
    draw(ctx) {
        const seed = 4500;
        const base = -112;
        const r = rng(seed);
        for (const [a, b] of [[4, 18], [80, 66]])
            wornStrut(ctx, a, 0, b, base, 4, PLANK, seed + a);
        for (let k = 0; k < 3; k++) {
            const y0 = -k * 37;
            const y1 = y0 - 37;
            const d0 = 14 * (k / 3);
            const d1 = 14 * ((k + 1) / 3);
            wornStrut(ctx, 4 + d0, y0, 80 - d1, y1, 2, PLANK, seed + 10 + k);
            if (k !== 1)
                wornStrut(ctx, 80 - d0, y0, 4 + d1, y1, 2, PLANK, seed + 20 + k);
            else {
                wornStrut(ctx, 80 - d0, y0, 58, y0 - 14, 2, PLANK, seed + 20 + k);
                wornStrut(ctx, 4 + d1, y1, 24, y1 + 11, 2, PLANK, seed + 30 + k);
            }
            flat(ctx, 4 + d1, y1 - 1, 76 - d1 * 2, 3, PLANK[2], PLANK[4]);
            G.grain(ctx, G.rectRegion(ctx, 4 + d1, y1 - 1, 76 - d1 * 2, 3), seed + 40 + k, 1.2);
        }
        for (const x of [36, 48]) {
            flat(ctx, x, base, 2, -base, PLANK[3], PLANK[4]);
            G.grain(ctx, G.rectRegion(ctx, x, base, 2, -base), seed + x, 1.2);
        }
        for (let y = -8; y > base; y -= 7) {
            if (y === -50)
                continue;
            if (y === -71) {
                flat(ctx, 36, y + 1, 6, 1.6, PLANK[2], PLANK[4]);
                continue;
            }
            flat(ctx, 36, y, 14, 1.6, r() < 0.3 ? PLANK[1] : PLANK[2], PLANK[4]);
        }
        planks(ctx, 14, base - 38, 58, 38, seed + 1, true);
        flat(ctx, 22, base - 30, 42, 10, HOLE, PLANK[4]);
        if (!simple())
            for (let x = 26; x < 62; x += 8)
                flat(ctx, x, base - 30, 1.4, 10, PLANK[1]);
        const openings = [rectPts(22, base - 30, 42, 10), rectPts(44, base - 12, 5, 12)];
        within(ctx, [[14, base - 38, 58, 38]], () => outside(ctx, openings, () => {
            G.dirt(ctx, 14, base - 38, 58, 38, seed + 5, 0.55);
            G.drips(ctx, 14, base - 20, 58, 18, seed + 6, 5, false);
            shape(ctx, blob(20, base - 8, 6, 4, seed + 7, 9), PLANK[0]);
            shape(ctx, blob(64, base - 14, 4, 6, seed + 8, 9), PLANK[0]);
            ctx.save();
            ctx.globalAlpha = 0.55;
            shape(ctx, blob(58, base - 4, 8, 3, seed + 9, 9), LEAF[1]);
            ctx.restore();
        }));
        flat(ctx, 44, base - 12, 5, 12, HOLE, PLANK[4]);
        band(ctx, 8, base - 2, 70, 6, PLANK);
        G.grain(ctx, G.rectRegion(ctx, 8, base - 2, 70, 6), seed + 50, 1.2);
        G.chips(ctx, 8, base - 2, 70, seed + 51, G.DIRT);
        within(ctx, [[8, base - 2, 70, 6]], () => G.drips(ctx, 8, base - 2, 70, 6, seed + 52, 6));
        for (let x = 8; x <= 76; x += 17) {
            if (x === 59) {
                ctx.save();
                ctx.translate(x + 1, base - 2);
                ctx.rotate(0.35);
                flat(ctx, -1, -11, 2, 11, PLANK[3], PLANK[4]);
                ctx.restore();
                continue;
            }
            flat(ctx, x, base - 18, 2, 16, PLANK[3], PLANK[4]);
        }
        flat(ctx, 8, base - 18, 50, 2, PLANK[3], PLANK[4]);
        ctx.save();
        ctx.translate(58, base - 17);
        ctx.rotate(0.5);
        flat(ctx, 0, -1, 14, 2, PLANK[3], PLANK[4]);
        ctx.restore();
        G.grain(ctx, G.rectRegion(ctx, 8, base - 18, 50, 2), seed + 53, 1.2);
        const roof = [[4, base - 38], [43, base - 62], [82, base - 38], [78, base - 36], [43, base - 56], [8, base - 36]];
        shape(ctx, roof, BRONZE[1], BRONZE[4]);
        shape(ctx, [[8, base - 36], [43, base - 56], [78, base - 36]], BRONZE[2]);
        if (!simple())
            for (let x = 14; x < 74; x += 6)
                line(ctx, [[x, base - 36 - (20 * (1 - abs(x - 43) / 35))], [x, base - 36]], BRONZE[0], 0.5);
        const gable = [[4, base - 38], [43, base - 62], [82, base - 38]];
        G.grain(ctx, G.polyRegion(ctx, gable), seed + 2);
        clipped(ctx, gable, () => {
            G.dirt(ctx, 4, base - 62, 78, 26, seed + 56, 0.45);
            G.drips(ctx, 14, base - 52, 58, 16, seed + 57, 7);
            for (const [x, y, rx, seedOff] of [[60, base - 42, 5, 4], [28, base - 44, 4, 54], [44, base - 54, 3, 58], [70, base - 40, 3, 59], [16, base - 40, 3.5, 60]])
                G.rustPatch(ctx, x, y, rx, 1.6, seed + seedOff);
        });
        within(ctx, [[14, base - 38, 58, 38]], () => outside(ctx, openings, () => G.drips(ctx, 8, base - 36, 70, 20, seed + 3, 7)));
        G.chips(ctx, 4, base - 38, 78, seed + 55, G.DIRT);
        disc(ctx, 70, base - 26, 2.2, AMBER[1], "#0a0604");
        if (!simple())
            glow(ctx, 70, base - 26, 8, AMBER[2], 0.35);
    },
};
const bronzeColumn = (ctx, h) => {
    const seed = 4600;
    pier(ctx, 4, -h, 16, h, BRONZE);
    flat(ctx, 7, -h, 2, h, BRONZE[3]);
    G.grain(ctx, G.rectRegion(ctx, 4, -h, 16, h), seed);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -h, 24, h);
    ctx.clip();
    eachCell(ctx, 4, -h, 16, h, 16, 48, (_x, y, _i, j) => {
        const r = rng(seed + j * 13);
        G.streak(ctx, 6 + r() * 12, y, 20 + r() * 20, 3 + r() * 3, G.DIRT, 0.16 + r() * 0.1);
        pier(ctx, 1, y + 20, 22, 6, BRONZE);
        G.grain(ctx, G.rectRegion(ctx, 1, y + 20, 22, 6), seed + j * 13 + 4, 1.2);
        G.dirt(ctx, 1, y + 20, 22, 6, seed + j * 13 + 5, 0.5);
        G.chips(ctx, 1, y + 20, 22, seed + j * 13 + 6, G.DIRT);
        if (r() < 0.7)
            G.rustPatch(ctx, 3 + r() * 16, y + 24, 2.5, 1.4, seed + j * 13 + 7);
        if (!simple())
            for (const bx of [3, 11, 19])
                flat(ctx, bx, y + 22, 1.6, 1.6, r() < 0.5 ? RUSTY : BRONZE[1]);
        within(ctx, [[4, y + 26, 16, max(0, min(26, -y - 26))]], () => G.drips(ctx, 3, y + 26, 18, 26, seed + j * 13 + 1, 2));
        if (r() < 0.6) {
            const patch = blob(8 + r() * 8, y + 8 + r() * 10, 3 + r() * 2, 4 + r() * 3, seed + j * 13 + 2, 9);
            ctx.save();
            ctx.globalAlpha = 0.6;
            shape(ctx, patch, "#3a6a4a");
            ctx.restore();
        }
        if (r() < 0.4)
            G.rustPatch(ctx, 12, y + 36, 3, 2, seed + j * 13 + 3);
    });
    ctx.restore();
    G.dirt(ctx, 4, -24, 16, 24, seed + 5, 0.6);
};
const overheadPipeline = {
    id: "overheadPipeline",
    box: [-4, -22, 292, 4],
    draw(ctx, _state, _t, { w = 288 } = {}) {
        const seed = 4700;
        for (let x = 24; x < w; x += 96) {
            slab(ctx, x, -20, 24, 10, "concrete", 2);
            within(ctx, [[x, -20, 24, 10]], () => G.surface(ctx, x, -20, 24, 10, seed + x, { rise: 0.4, drip: 1, dripLen: 8 }));
            for (const dx of [8, 16])
                line(ctx, [[x + dx, -10], [x + dx, -3]], "m2", 1.6);
        }
        cylH(ctx, 0, -8, w, 2.4, "chrome", 1);
        cylH(ctx, 0, -4, w, 2.4, "chrome", 1);
        const pipes = [[0, -8, w, 2.4], [0, -4, w, 2.4]];
        G.grain(ctx, G.rectsRegion(ctx, pipes), seed + 1, 0.5);
        within(ctx, pipes, () => G.drips(ctx, 0, -6, w, 5, seed + 2, round(w / 24)));
        for (let x = 6; x < w; x += 48) {
            hazard(ctx, x, -9.4, 14, 2, 2.4, { fill: "a1", line: "aLine" });
            hazard(ctx, x, -5.4, 14, 2, 2.4, { fill: "a1", line: "aLine" });
            for (const dx of [0, 13])
                disc(ctx, x + dx, -6.8, 0.8, "c2", "mLine");
            G.chips(ctx, x, -9.4, 14, seed + 3 + x, G.DIRT);
            if (rng(seed + x)() < 0.5)
                within(ctx, pipes, () => G.rustPatch(ctx, x + 30, -5, 3, 1.2, seed + 4 + x));
        }
    },
};
const coilStack = (ctx, x, y, w, n) => {
    cylV(ctx, x + w * 0.3, y - 4, w * 0.4, n * 7 + 8, "steel", 0);
    for (let i = 0; i < n; i++)
        cylV(ctx, x, y + i * 7, w, 5, "chrome", 2);
    for (let i = 0; i < 3; i++) {
        const cy = y - 6 - i * 4;
        poly(ctx, [[x + w * 0.2, cy], [x + w * 0.8, cy], [x + w * 0.7, cy - 3], [x + w * 0.3, cy - 3]], "c1", 2);
    }
};
const lamp = (ctx, x, y, c, lit = true) => {
    if (lit && !simple())
        glow(ctx, x, y, 4, c, 0.6);
    disc(ctx, x, y, simple() ? 1.8 : 1.2, lit ? c : "k0", "mLine");
};
const transformer = {
    id: "transformer",
    box: [-4, -170, 172, 0],
    anim: true,
    draw(ctx, _state, t) {
        const seed = 4800;
        slab(ctx, 0, -120, 168, 120, "concrete", 1);
        G.surface(ctx, 0, -119, 168, 119, seed, { rise: 0.3, drip: 6, dripLen: 40 });
        flat(ctx, -2, -124, 172, 5, "k3", "kLine");
        G.chips(ctx, -2, -124, 172, seed + 1);
        for (const [x, w] of [[8, 46], [62, 46], [116, 44]]) {
            box(ctx, x, -110, w, 56, "green", 1);
            box(ctx, x + 4, -106, w - 8, 48, "green", 0);
            for (let y = -100; y < -60; y += 6)
                flat(ctx, x + 6, y, w - 12, simple() ? 1.4 : 1, "g2");
            G.grain(ctx, G.rectRegion(ctx, x, -110, w, 56), seed + 2 + x, 0.6);
            G.drips(ctx, x, -110, w, 24, seed + 3 + x, 3);
            G.rustPatch(ctx, x + w * 0.7, -60, 3, 1.6, seed + 4 + x);
        }
        coilStack(ctx, 16, -160, 26, 5);
        coilStack(ctx, 70, -160, 26, 5);
        for (const x of [124, 140, 156]) {
            cylV(ctx, x - 3, -138, 6, 14, "chrome", 1);
            for (let i = 0; i < 3; i++)
                cylV(ctx, x - 4.4, -138 + i * 4.4, 8.8, 2.2, "chrome", 2);
        }
        line(ctx, [[124, -138], [104, -150], [83, -162]], "mLine", 1.2);
        line(ctx, [[140, -138], [124, -158], [83, -164]], "mLine", 1.2);
        box(ctx, 8, -48, 152, 6, "steel", 1);
        G.grain(ctx, G.rectRegion(ctx, 8, -48, 152, 6), seed + 5, 0.6);
        for (const x of [14, 46, 80, 114, 148]) {
            cylV(ctx, x, -42, 6, 42, "chrome", 1);
            G.drips(ctx, x, -42, 6, 20, seed + 6 + x, 1);
        }
        hazard(ctx, 0, -8, 168, 4, 5);
        G.dirt(ctx, 0, -20, 168, 20, seed + 7, 0.6);
        box(ctx, 120, -40, 34, 26, "steel", 0);
        flat(ctx, 124, -36, 26, 8, "screenOff", "gLine");
        for (let i = 0; i < 4; i++)
            flat(ctx, 126 + i * 6, -33 - abs(sin(t * 3 + i)) * 3, 3, 1 + abs(sin(t * 3 + i)) * 3, "screen");
        G.grain(ctx, G.rectRegion(ctx, 120, -40, 34, 26), seed + 8, 0.5);
        lamp(ctx, 128, -20, "screen", floor(t * 2) % 2 === 0);
        lamp(ctx, 136, -20, "a1");
    },
};
const tank = (ctx, x, w, h, seed) => {
    cylV(ctx, x, -h, w, h, "rust", 1);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x + w / 2, -h, w / 2, 8, 0, PI, 0);
    ctx.closePath();
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    const [r0, , r2, r3] = tones("rust");
    g.addColorStop(0, r3);
    g.addColorStop(0.4, r2);
    g.addColorStop(1, r0);
    ctx.fillStyle = g;
    ctx.fill();
    stroke(ctx, "rust");
    ctx.restore();
    const shell = () => {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, -h, w / 2, 8, 0, PI, 0);
        ctx.rect(x, -h, w, h);
    };
    ctx.save();
    shell();
    ctx.clip();
    G.grain(ctx, G.rectRegion(ctx, x, -h - 8, w, h + 8), seed, 0.6);
    for (const y of [-h + 6, -h / 2, -6]) {
        flat(ctx, x, y - 1, w, 2, "r0", "rLine");
        rivets(ctx, x, y - 3, w, 4, "r3");
        G.drips(ctx, x, y + 1, w, 18, seed + 1 + y, 3);
    }
    G.rustPatch(ctx, x + w * 0.7, -h * 0.3, 4, 2.5, seed + 2);
    G.dirt(ctx, x, -h, w, h, seed + 3, 0.3);
    ctx.restore();
    box(ctx, x + w / 2 - 6, -h - 11, 12, 4, "steel", 1);
    box(ctx, x + w / 2 - 4, -h - 14, 8, 3, "steel", 2);
    G.chips(ctx, x + w / 2 - 6, -h - 11, 12, seed + 4);
    flat(ctx, x + 6, -h + 14, 12, 8, "y2", "yLine");
    if (!simple())
        text(ctx, "T", x + 12, -h + 18, 6, "hazardDark");
    G.chips(ctx, x + 6, -h + 14, 12, seed + 5, G.DIRT);
};
const tankHatch = (ctx, cx, y, seed) => {
    const r = rng(seed);
    flat(ctx, cx - 10, y - 2, 20, 3, BRONZE[1], BRONZE[4]);
    pier(ctx, cx - 6, y - 8, 12, 6, BRONZE);
    band(ctx, cx - 8, y - 11, 16, 3, BRONZE);
    flat(ctx, cx - 3, y - 13, 6, 2, PLATE[2], PLATE[4]);
    const parts = [[cx - 10, y - 2, 20, 3], [cx - 6, y - 8, 12, 6], [cx - 8, y - 11, 16, 3], [cx - 3, y - 13, 6, 2]];
    G.grain(ctx, G.rectsRegion(ctx, parts), seed, 1.2);
    G.dirt(ctx, cx - 6, y - 8, 12, 6, seed + 1, 0.5);
    within(ctx, parts, () => G.rustPatch(ctx, cx + 2 + r() * 2, y - 5, 2.4, 1.4, seed + 2));
    G.drips(ctx, cx - 9, y + 1, 18, 8, seed + 3, 2);
    for (const bx of [cx - 8, cx - 3, cx + 2, cx + 7])
        flat(ctx, bx, y - 1.4, 1.4, 1.4, r() < 0.4 ? RUSTY : BRONZE[3]);
    flat(ctx, cx + 6, y - 10.5, 3, 2, PLATE[1], PLATE[4]);
};
const tankGauge = (ctx, cx, cy, seed) => {
    flat(ctx, cx - 1.2, cy + 4, 2.4, 6, TUBE[1], TUBE[4]);
    flat(ctx, cx - 2.5, cy + 9, 5, 2, TUBE[0], TUBE[4]);
    disc(ctx, cx, cy, 5.2, PLATE[1], PLATE[4]);
    disc(ctx, cx, cy, 4.2, PORCELAIN[3], PORCELAIN[0]);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 3.2, -PI * 0.25, PI * 0.25);
    ctx.strokeStyle = color("#a8281c");
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    for (let k = 0; k <= 6; k++) {
        const a = PI * 0.75 + (k / 6) * PI * 1.5;
        line(ctx, [[cx + cos(a) * 2.8, cy + sin(a) * 2.8], [cx + cos(a) * 3.8, cy + sin(a) * 3.8]], PORCELAIN[0], 0.5);
    }
    line(ctx, [[cx, cy], [cx + 2.8, cy - 2.2]], "#a8281c", 0.8);
    disc(ctx, cx, cy, 0.8, PLATE[0]);
    ctx.save();
    ctx.globalAlpha = 0.35;
    shape(ctx, blob(cx - 1.5, cy + 2.2, 2.6, 1.4, seed, 7), G.DIRT);
    ctx.restore();
    G.rustPatch(ctx, cx + 3.6, cy + 3, 1.4, 1, seed + 1);
};
const horizontalTank = (ctx) => {
    const seed = 4900;
    for (const x of [16, 76]) {
        pier(ctx, x, -18, 8, 18, PLATE);
        flat(ctx, x - 3, -4, 14, 4, PLATE[1], PLATE[4]);
    }
    const body = () => {
        ctx.beginPath();
        ctx.moveTo(12, -66);
        ctx.lineTo(88, -66);
        ctx.ellipse(88, -42, 12, 24, 0, -PI / 2, PI / 2);
        ctx.lineTo(12, -18);
        ctx.ellipse(12, -42, 12, 24, 0, PI / 2, PI * 1.5);
        ctx.closePath();
    };
    body();
    ctx.fillStyle = color(BRONZE[2]);
    ctx.fill();
    stroke(ctx, BRONZE[4]);
    ctx.save();
    body();
    ctx.clip();
    flat(ctx, 0, -66, 100, 8, BRONZE[3]);
    flat(ctx, 0, -58, 100, 3, "#d8b07a");
    flat(ctx, 0, -30, 100, 12, BRONZE[1]);
    flat(ctx, 0, -22, 100, 4, BRONZE[0]);
    for (const x of [22, 50, 78])
        flat(ctx, x, -66, 2, 48, BRONZE[1]);
    G.grain(ctx, G.rectRegion(ctx, 0, -66, 100, 48), seed);
    G.drips(ctx, 0, -50, 100, 30, seed + 1, 6);
    G.rustPatch(ctx, 36, -34, 7, 3, seed + 2);
    G.rustPatch(ctx, 70, -56, 4, 2, seed + 3);
    G.dirt(ctx, 0, -66, 100, 48, seed + 4, 0.35);
    ctx.restore();
    tankHatch(ctx, 50, -66, seed + 5);
    tankGauge(ctx, 64, -40, seed + 6);
};
const storageTank = {
    id: "storageTank",
    box: [-2, -88, 126, 0],
    anim: true,
    draw(ctx, state, t) {
        if (state === 1)
            return horizontalTank(ctx);
        const seed = 5000;
        tank(ctx, 0, 48, 64, seed);
        for (const [x, w] of [[52, 6], [62, 6]]) {
            cylV(ctx, x, -84, w, 84, "steel", 1);
            G.grain(ctx, G.rectRegion(ctx, x, -84, w, 84), seed + 10 + x, 0.6);
        }
        for (const y of [-70, -40]) {
            box(ctx, 50, y, 20, 4, "steel", 2);
            hazard(ctx, 51, y + 5, 18, 2.4, 3);
            within(ctx, [[52, y + 4, 6, 18], [62, y + 4, 6, 18]], () => G.drips(ctx, 50, y + 7.4, 20, 14, seed + 20 - y, 2));
        }
        lamp(ctx, 60, -76, "a1", sin(t * 3) > 0);
        lamp(ctx, 60, -46, "screen", sin(t * 3 + 1.5) > 0);
        tank(ctx, 74, 48, 64, seed + 40);
    },
};
const powerPlant = {
    id: "powerPlant",
    box: [-4, -272, 388, 0],
    draw(ctx) {
        const seed = 5100;
        band(ctx, 0, -18, 384, 18, CONC);
        G.surface(ctx, 0, -18, 384, 18, seed, { rise: 0.5, drip: 6, dripLen: 10 });
        const towers = [40, 172, 304];
        for (const x of towers) {
            within(ctx, [[x, -264, 24, 246]], () => eachCell(ctx, x, -264, 24, 246, 24, 24, (cx, cy, _i, j) => {
                strut(ctx, cx + 3, cy + 1, cx + 21, cy + 23, 2.2, CRATE);
                strut(ctx, cx + 21, cy + 1, cx + 3, cy + 23, 2.2, CRATE);
                if (rng(seed + x + j)() < 0.3)
                    within(ctx, [[cx + 9, cy + 9, 6, 6]], () => G.rustPatch(ctx, cx + 12, cy + 12, 2.5, 2, seed + x + j));
            }));
            for (const px of [x, x + 20]) {
                pier(ctx, px, -264, 4, 246, CRATE);
                G.grain(ctx, G.rectRegion(ctx, px, -264, 4, 246), seed + px);
                within(ctx, [[px, -264, 4, 246]], () => G.drips(ctx, px, -264, 4, 60, seed + px, 2, false));
            }
            if (x !== towers[1])
                lampBox(ctx, x + 1, -150, true, seed + x + 3);
        }
        for (const y of [-232, -200]) {
            band(ctx, 30, y, 324, 8, CRATE);
            rivets(ctx, 30, y + 4, 324, 10, CRATE[3]);
            within(ctx, [[30, y, 324, 8]], () => G.drips(ctx, 30, y + 1, 324, 7, seed + 10 - y, 14));
        }
        for (let x = 56; x < 340; x += 36)
            insulator(ctx, x, -232, 4);
        for (let x = 56; x < 340; x += 72)
            arc(ctx, x, -246, x + 36, -246, seed + x);
        for (let x = 60; x < 340; x += 48)
            if (!simple())
                curve(ctx, [[x, -200], [x + 24, -186], [x + 48, -200]], "#141410", 0.8);
        for (let b = 0; b < 2; b++) {
            const x = 78 + b * 40;
            for (let k = 0; k < 6; k++) {
                tube(ctx, x, -114 + k * 15, 30, 12, TUBE);
                worn(ctx, x, -114 + k * 15, 30, 12, seed + 70 + b * 7 + k);
            }
            pier(ctx, x + 12, -130, 6, 112, TUBE);
            worn(ctx, x + 12, -130, 6, 112, seed + 80 + b);
            insulator(ctx, x + 15, -130, 4);
        }
        arc(ctx, 93, -148, 133, -148, seed + 30);
        pier(ctx, 210, -100, 54, 82, PLATE);
        for (let k = 0; k < 2; k++)
            grille(ctx, 216, -92 + k * 34, 42, 22, seed + 40 + k);
        hvPanel(ctx, 230, -118, 14, 18, seed + 44, false);
        outside(ctx, [rectPts(216, -92, 42, 22), rectPts(216, -58, 42, 22)], () => G.grain(ctx, G.rectRegion(ctx, 210, -100, 54, 82), seed + 45));
        const dome = () => {
            ctx.beginPath();
            ctx.moveTo(322, -18);
            ctx.lineTo(322, -96);
            ctx.ellipse(350, -96, 28, 22, 0, PI, 0);
            ctx.lineTo(378, -18);
            ctx.closePath();
        };
        dome();
        ctx.fillStyle = color(TUBE[1]);
        ctx.fill();
        stroke(ctx, TUBE[4]);
        ctx.save();
        dome();
        ctx.clip();
        flat(ctx, 322, -118, 10, 100, TUBE[2]);
        flat(ctx, 326, -118, 3, 100, TUBE[3]);
        flat(ctx, 366, -118, 12, 100, TUBE[0]);
        for (let y = -90; y < -18; y += 18)
            flat(ctx, 322, y, 56, 1.2, TUBE[4]);
        G.grain(ctx, G.rectRegion(ctx, 322, -118, 56, 100), seed + 50);
        G.drips(ctx, 322, -100, 56, 50, seed + 51, 6);
        G.rustPatch(ctx, 340, -60, 7, 4, seed + 52);
        G.dirt(ctx, 322, -118, 56, 100, seed + 53, 0.3);
        ctx.restore();
        tube(ctx, 140, -146, 200, 7, BRONZE);
        worn(ctx, 140, -146, 200, 7, seed + 62);
        for (const x of [150, 290]) {
            pier(ctx, x, -139, 6, 121, BRONZE);
            worn(ctx, x, -139, 6, 121, seed + 60 + x);
        }
        within(ctx, [[140, -146, 200, 7]], () => G.rustPatch(ctx, 250, -142, 5, 2, seed + 61));
    },
};
const STONES = [
    [12, 9, 5, 3.6, 0.7],
    [24, 18, 10, 7, 0.75],
    [40, 30, 16, 12.5, 0.5],
    [72, 56, 28, 23, 0.3],
];
const pebble = (cx, cy, rx, ry, seed, n = 18) => {
    const r = rng(seed);
    const p1 = r() * PI * 2;
    const p2 = r() * PI * 2;
    const a1 = 0.06 + r() * 0.1;
    const a2 = 0.05 + r() * 0.07;
    return Array.from({ length: n }, (_, i) => {
        const a = (i / n) * PI * 2;
        const k = 1 + a1 * sin(2 * a + p1) + a2 * sin(3 * a + p2) - (sin(a) > 0 ? 0.12 * sin(a) : 0);
        return [cx + cos(a) * rx * k, cy + sin(a) * ry * k];
    });
};
const cliffStone = (ctx, cx, cy, rx, ry, seed) => {
    const r = rng(seed);
    const outer = pebble(cx, cy, rx, ry, seed);
    shape(ctx, outer, BOULDER[1], BOULDER[0]);
    ctx.save();
    path(ctx, outer);
    ctx.clip();
    shape(ctx, pebble(cx - rx * 0.12, cy - ry * 0.18, rx * 0.8, ry * 0.66, seed + 1, 14), BOULDER[2]);
    shape(ctx, pebble(cx - rx * 0.3, cy - ry * 0.4, rx * 0.38, ry * 0.26, seed + 2, 12), BOULDER[3]);
    shape(ctx, pebble(cx + rx * 0.15, cy + ry * 0.85, rx * 0.9, ry * 0.3, seed + 3, 14), BOULDER[0]);
    if (rx > 7) {
        G.grain(ctx, G.polyRegion(ctx, outer), seed + 4, 0.6);
        if (rx > 14 && r() < 0.5)
            line(ctx, [[cx - rx * 0.1, cy - ry * 0.8], [cx - rx * 0.02, cy - ry * 0.4], [cx - rx * 0.12, cy - ry * 0.1], [cx + rx * 0.04, cy + ry * 0.2]], BOULDER[0], 0.6);
    }
    if (!simple() && rx > 8 && r() < 0.4)
        shape(ctx, pebble(cx - rx * 0.1, cy - ry * 0.95, rx * (0.45 + r() * 0.3), ry * 0.28, seed + 5, 12), LEAF[2]);
    if (rx > 8 && r() < 0.3)
        G.drips(ctx, cx - rx * 0.45, cy + ry * 0.2, rx, ry, seed + 6, 1, false);
    ctx.restore();
};
const rockMass = (ctx, w, h, base, edgeAt, seed) => {
    shape(ctx, base, BOULDER[1]);
    STONES.forEach(([cw, ch, rx, ry, odds], k) => {
        eachCell(ctx, 0, -h, w, h, cw, ch, (x, y, i, j) => {
            const s = cellSeed(seed + k * 7919, i, j);
            const r = rng(s);
            if (r() > odds)
                return;
            const cx = x + cw / 2 + (r() - 0.5) * cw * 0.5;
            const cy = y + ch / 2 + (r() - 0.5) * ch * 0.5;
            const sx = rx * (0.75 + r() * 0.5);
            const sy = ry * (0.75 + r() * 0.5);
            if (cy - sy * (rx > 20 ? 0.8 : 0.3) < edgeAt(cx) || cy + sy * 0.2 > 0)
                return;
            cliffStone(ctx, cx, cy, sx, sy, s + 1);
        }, rx * 1.4 + cw / 2);
    });
    G.grain(ctx, G.polyRegion(ctx, base), seed + 1, 0.7);
    clipped(ctx, base, () => G.dirt(ctx, 0, -h, w, h, seed + 2, min(0.3, 50 / h)));
};
const rockCliff = {
    id: "rockCliff",
    box: [0, -200, 144, 0],
    draw(ctx, _state, _t, { w = 144, h = 192 } = {}) {
        const base = [[0, 0], [0, -h + 8], [w * 0.25, -h + 16], [w - 8, -4], [w - 8, 0]];
        const edgeAt = (x) => {
            const u = x / w;
            return u < 0.25 ? -h + 8 * (u / 0.25) : -h + 8 + (h - 14) * ((u - 0.25) / 0.75);
        };
        rockMass(ctx, w, h, base, edgeAt, 5200 + round(w + h * 3));
        tufts(ctx, 0, w, 0, 5200 + round(w + h * 3) + 3, 0.6, 6);
    },
};
const STONE_TILE = 192;
const STONE_SEED = 6100;
const WALL_STONES = [
    [12, 5, 3.6, 0.7],
    [24, 10, 7.5, 0.75],
    [48, 19, 14.5, 0.55],
    [96, 32, 25, 0.5],
];
const wrap = (i, n) => ((i % n) + n) % n;
const stoneField = (ctx, x, y, w, h) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    flat(ctx, x, y, w, h, BOULDER[1]);
    WALL_STONES.forEach(([c, rx, ry, odds], k) => {
        const pad = rx * 1.4;
        const i0 = floor((x - pad) / c);
        const j0 = floor((y - pad) / c);
        const n = STONE_TILE / c;
        eachCell(ctx, i0 * c, j0 * c, ceil((x + w + pad) / c) * c - i0 * c, ceil((y + h + pad) / c) * c - j0 * c, c, c, (cx0, cy0, i, j) => {
            const s = cellSeed(STONE_SEED + k * 7919, wrap(i0 + i, n), wrap(j0 + j, n));
            const r = rng(s);
            if (r() > odds)
                return;
            const cx = cx0 + c / 2 + (r() - 0.5) * c * 0.4;
            const cy = cy0 + c / 2 + (r() - 0.5) * c * 0.4;
            cliffStone(ctx, cx, cy, rx * (0.8 + r() * 0.4), ry * (0.8 + r() * 0.4), s + 1);
        }, pad);
    });
    G.grain(ctx, G.rectRegion(ctx, x, y, w, h), STONE_SEED + 1, 0.7);
    ctx.restore();
};
const stoneWall = {
    id: "stoneWall",
    box: [0, -144, 144, 0],
    draw(ctx, _state, _t, { w = 144, h = 144, at = [0, 0] } = {}) {
        const [ax, ay] = at;
        ctx.save();
        ctx.translate(-ax, -ay);
        stoneField(ctx, ax, ay - h, w, h);
        ctx.restore();
    },
};
const RUBBLE_HEAP = [[-2, 0], [6, -10], [20, -20], [36, -30], [52, -34], [66, -26], [80, -14], [94, 0]];
const heapTop = (x) => {
    for (let k = 1; k < RUBBLE_HEAP.length; k++) {
        const [ax, ay] = RUBBLE_HEAP[k - 1];
        const [bx, by] = RUBBLE_HEAP[k];
        if (x <= bx)
            return ay + ((by - ay) * (x - ax)) / (bx - ax);
    }
    return 0;
};
const rebar = (ctx, x, y, dir, r) => {
    const out = 1.5 + r() * 2.5;
    const bend = (r() - 0.5) * 4;
    line(ctx, [[x, y], [x + dir * out, y + bend * 0.3], [x + dir * (out + 1 + r() * 2.5), y + bend - 1 - r() * 3]], RUSTY, 0.7);
};
const concreteSlab = (ctx, { x, y, len, thick, angle, tones, seed }) => {
    const r = rng(seed);
    const hl = len / 2;
    const ht = thick / 2;
    const brokenL = r() < 0.6;
    const brokenR = r() < 0.6;
    const chip = r() < 0.5 ? min(thick * 0.4, 1 + r() * 2) : 0;
    const pts = [
        ...(chip ? [[-hl, -ht + chip], [-hl + chip, -ht]] : [[-hl, -ht]]),
        [hl, -ht],
        ...(brokenR ? [[hl + 0.5 + r() * 2, -ht * 0.3], [hl - r() * 2, ht * 0.35]] : []),
        [hl, ht],
        [-hl, ht],
        ...(brokenL ? [[-hl + r() * 2, ht * 0.3], [-hl - 0.5 - r() * 2, -ht * 0.35]] : []),
    ];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    shape(ctx, pts, tones[2], tones[4]);
    clipped(ctx, pts, () => {
        flat(ctx, -hl - 3, -ht, len + 6, min(2, thick / 4), tones[3]);
        flat(ctx, -hl - 3, ht - min(3, thick / 4), len + 6, min(3, thick / 4), tones[1]);
        G.grain(ctx, G.polyRegion(ctx, pts), seed + 1, 0.9);
        if (len > 18 && r() < 0.5) {
            const cx = -hl + len * (0.3 + r() * 0.4);
            line(ctx, [[cx, -ht], [cx + 1.5, -ht * 0.2], [cx - 0.5, ht * 0.4], [cx + 1, ht]], tones[4], 0.6);
        }
        G.dirt(ctx, -hl, -ht, len, thick, seed + 2, 0.45);
    });
    if (len > 8)
        G.chips(ctx, -hl, -ht, len, seed + 3, G.DIRT);
    if (!simple()) {
        if (brokenR && len > 10 && r() < 0.6)
            rebar(ctx, hl, (r() - 0.5) * thick * 0.5, 1, r);
        else if (brokenL && len > 10 && r() < 0.6)
            rebar(ctx, -hl, (r() - 0.5) * thick * 0.5, -1, r);
    }
    ctx.restore();
};
const slabPile = (seed) => {
    const r = rng(seed);
    const tone = () => SLABS[floor(r() * SLABS.length)];
    const lie = (len, thick, at = r()) => {
        const x = len * 0.4 + at * (92 - len * 0.8);
        const slope = Math.atan((heapTop(x + 1) - heapTop(x - 1)) / 2);
        return { x, y: heapTop(x) + thick * (0.4 + r() * 0.4), len, thick, angle: slope * (0.4 + r() * 0.6) + (r() - 0.5) * 0.7, tones: tone(), seed: seed + floor(r() * 1000) };
    };
    const n = 5 + floor(r() * 3);
    const big = Array.from({ length: n }, (_, k) => lie(12 + r() * 20, 4 + r() * 5, (k + 0.15 + r() * 0.7) / n)).sort((a, b) => b.len - a.len);
    const stacked = Array.from({ length: 2 }, () => {
        const under = big[floor(r() * big.length)];
        const len = 8 + r() * 12;
        const thick = 3 + r() * 3;
        return { x: under.x + (r() - 0.5) * under.len * 0.4, y: max(-40, under.y - under.thick / 2 - thick / 2 + 1), len, thick, angle: under.angle + (r() - 0.5) * 0.6, tones: tone(), seed: seed + 2000 + floor(r() * 1000) };
    });
    const bits = Array.from({ length: 4 }, () => lie(3 + r() * 5, 2.5 + r() * 2));
    return [...big, ...stacked, ...bits];
};
const rubbleHeap = {
    id: "rubbleHeap",
    box: [-4, -48, 100, 2],
    draw(ctx, state) {
        const seed = 5300 + state * 11;
        const r = rng(seed);
        const heap = RUBBLE_HEAP;
        shape(ctx, heap, state === 1 ? CONC[1] : STONE[1], STONE[4]);
        clipped(ctx, heap, () => G.scorch(ctx, heap, seed + 1));
        G.grain(ctx, G.polyRegion(ctx, heap), seed + 2);
        if (state === 1) {
            if (!simple())
                for (let k = 0; k < 3; k++) {
                    const x = 12 + r() * 70;
                    rebar(ctx, x, heapTop(x) + 2, r() < 0.5 ? -1 : 1, r);
                }
            for (const s of slabPile(seed + 10))
                concreteSlab(ctx, s);
        }
        else {
            for (let k = 0; k < 9; k++) {
                const x = 8 + r() * 78;
                const y = -4 - sin((x / 92) * PI) * 26 * r();
                boulder(ctx, x, y, 5 + r() * 6, 4 + r() * 4, seed + 20 + k);
            }
        }
        clipped(ctx, heap, () => G.dirt(ctx, -2, -34, 96, 34, seed + 3, 0.5));
        tufts(ctx, 0, 92, 0, seed + 4, 0.4, 4);
    },
};
const clipped = (ctx, pts, draw) => {
    ctx.save();
    path(ctx, pts);
    ctx.clip();
    draw();
    ctx.restore();
};
const tyreOutline = (cx, cy, rad, flatK) => {
    const floorY = cy + rad * (1 - 0.14 * flatK);
    return Array.from({ length: 64 }, (_, i) => {
        const a = (i / 64) * PI * 2;
        const low = max(0, sin(a));
        const bulge = 1 + 0.1 * flatK * low * low;
        return [cx + cos(a) * rad * bulge, min(floorY, cy + sin(a) * rad)];
    });
};
const tyre = (ctx, cx, contact, rad, flatK, seed) => {
    const r = rng(seed);
    const cy = contact - rad * (1 - 0.14 * flatK);
    const outer = tyreOutline(cx, cy, rad, flatK);
    shape(ctx, outer, "#181816", "#060604");
    clipped(ctx, outer, () => {
        const n = 24;
        for (let k = 0; k < n; k++) {
            const a = (k / n) * PI * 2;
            line(ctx, [[cx + cos(a) * rad * 0.88, cy + sin(a) * rad * 0.88], [cx + cos(a) * rad * 1.2, cy + sin(a) * rad * 1.2]], "#060604", 1);
        }
        ctx.beginPath();
        ctx.arc(cx, cy, rad * 0.8, PI * 1.1, PI * 1.6);
        ctx.strokeStyle = color("#34342e");
        ctx.lineWidth = 0.9;
        ctx.stroke();
        G.grain(ctx, G.polyRegion(ctx, outer), seed + 3, 0.7);
        G.dirt(ctx, cx - rad * 1.2, cy - rad, rad * 2.4, rad * 2, seed + 4, 0.5);
    });
    ctx.beginPath();
    ctx.arc(cx, cy, rad * 0.78, 0, PI * 2);
    ctx.strokeStyle = color("#2a2a24");
    ctx.lineWidth = 0.8;
    ctx.stroke();
    disc(ctx, cx, cy, rad * 0.6, "#3a3e2a", "#0a0c06");
    disc(ctx, cx, cy, rad * 0.5, OLIVE[2], OLIVE[4]);
    ctx.beginPath();
    ctx.arc(cx, cy, rad * 0.5, PI * 0.15, PI * 0.85);
    ctx.strokeStyle = color(OLIVE[0]);
    ctx.lineWidth = 0.8;
    ctx.stroke();
    for (let k = 0; k < 8; k++) {
        const a = (k / 8) * PI * 2 + 0.2;
        disc(ctx, cx + cos(a) * rad * 0.34, cy + sin(a) * rad * 0.34, 0.55, OLIVE[3], OLIVE[4]);
    }
    disc(ctx, cx, cy, rad * 0.2, OLIVE[1], OLIVE[4]);
    disc(ctx, cx, cy, rad * 0.08, OLIVE[4]);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rad * 0.5, 0, PI * 2);
    ctx.clip();
    G.rustPatch(ctx, cx + (r() - 0.5) * rad * 0.5, cy + rad * 0.2, rad * 0.18, rad * 0.12, seed + 1);
    G.grain(ctx, G.rectRegion(ctx, cx - rad, cy - rad, rad * 2, rad * 2), seed + 2, 0.8);
    ctx.restore();
};
const wheelArch = (ctx, cx, cy, rad) => {
    ctx.beginPath();
    ctx.arc(cx, cy, rad + 2, PI * 1.05, PI * 1.95);
    ctx.strokeStyle = color(OLIVE[4]);
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, rad + 2, PI * 1.05, PI * 1.95);
    ctx.strokeStyle = color(OLIVE[1]);
    ctx.lineWidth = 1.4;
    ctx.stroke();
};
const glassHole = (ctx, pts, seed) => {
    shape(ctx, pts, "#101818");
    if (!simple())
        shape(ctx, [pts[0], pts[1], [(pts[1][0] + pts[2][0]) / 2, (pts[1][1] + pts[2][1]) / 2]], "#2c3c3e");
    G.rim(ctx, pts, seed, "#8aa0a0", "#060808");
};
const wreckSkin = (ctx, pts, x, y, w, h, seed) => {
    clipped(ctx, pts, () => {
        G.grain(ctx, G.polyRegion(ctx, pts), seed, 0.6);
        G.rustPatch(ctx, x + w * 0.3, y + h * 0.65, w * 0.08, h * 0.15, seed + 1);
        G.rustPatch(ctx, x + w * 0.72, y + h * 0.45, w * 0.06, h * 0.12, seed + 2);
        G.drips(ctx, x, y + h * 0.3, w, h * 0.5, seed + 3, round(w / 16));
        G.dirt(ctx, x, y, w, h, seed + 4, 0.35);
    });
};
const armyTruck = (ctx, seed) => {
    flat(ctx, 4, -12, 128, 4, OLIVE[0], OLIVE[4]);
    const bed = [[0, -8], [0, -18], [98, -18], [98, -8]];
    shape(ctx, bed, OLIVE[2], OLIVE[4]);
    flat(ctx, 0, -18, 98, 2, OLIVE[3]);
    wreckSkin(ctx, bed, 0, -18, 98, 10, seed);
    const tarp = [[2, -18], [2, -44], [10, -54], [40, -56], [62, -52], [70, -60], [92, -54], [96, -46], [96, -18]];
    shape(ctx, tarp, "#5c5a36", OLIVE[4]);
    for (const x of [12, 34, 56, 80])
        line(ctx, [[x, -18], [x, -54]], "#46442a", 1.2);
    if (!simple())
        flat(ctx, 4, -44, 90, 1.6, "#6e6c44");
    wreckSkin(ctx, tarp, 2, -60, 94, 42, seed + 10);
    const rip = [[44, -50], [62, -48], [68, -34], [50, -28], [40, -38]];
    shape(ctx, rip, HOLE);
    for (const x of [48, 58])
        line(ctx, [[x, -50], [x, -28]], "#5a3a1a", 1.2);
    G.rim(ctx, rip, seed + 1, "#8a8858", HOLE);
    const cab = [[98, -8], [98, -50], [116, -50], [126, -34], [136, -32], [136, -8]];
    shape(ctx, cab, OLIVE[3], OLIVE[4]);
    flat(ctx, 98, -50, 18, 2, "#8a9064");
    flat(ctx, 126, -32, 10, 2, "#8a9064");
    wreckSkin(ctx, cab, 98, -50, 38, 42, seed + 20);
    clipped(ctx, cab, () => glassHole(ctx, [[104, -46], [115, -46], [122, -35], [104, -35]], seed + 2));
    line(ctx, [[104, -32], [104, -12]], OLIVE[4], 0.8);
    flat(ctx, 106, -28, 5, 1.4, OLIVE[4]);
    for (let y = -29; y < -16; y += 3)
        flat(ctx, 131, y, 5, 1.2, OLIVE[1]);
    disc(ctx, 133.5, -14, 1.6, "#c8c0a0", OLIVE[4]);
    flat(ctx, 134, -12, 4, 4, OLIVE[1], OLIVE[4]);
    for (const [x, f] of [[21, 0.6], [41, 0.4], [116, 0.2]]) {
        wheelArch(ctx, x, -9, 9);
        tyre(ctx, x, 0, 9, 0.6 + f, seed + 30 + x);
    }
};
const carWindow = (ctx, pts, seed) => {
    const r = rng(seed);
    shape(ctx, pts, HOLE, "#1a0c06");
    if (simple())
        return;
    const [a, b, c, d] = pts;
    if (r() < 0.7) {
        const u = 0.2 + r() * 0.4;
        const top = [d[0] + (c[0] - d[0]) * u, d[1]];
        shape(ctx, [d, top, [top[0] - (top[0] - d[0]) * (0.3 + r() * 0.3), d[1] - (d[1] - a[1]) * (0.3 + r() * 0.4)]], "#3a4846");
    }
    if (r() < 0.5)
        shape(ctx, [b, [b[0] - (b[0] - a[0]) * (0.2 + r() * 0.2), b[1]], [b[0] + (c[0] - b[0]) * 0.2, b[1] + (c[1] - b[1]) * (0.3 + r() * 0.3)]], "#2c3836");
};
const burntJeep = (ctx, seed) => {
    ctx.save();
    ctx.translate(0, 4.5);
    const body = [[10, -10], [10, -26], [24, -28], [30, -36], [58, -36], [66, -28], [86, -26], [88, -10]];
    shape(ctx, body, "#6a3e22", "#1a0c06");
    flat(ctx, 10, -26, 78, 3, "#8a5634");
    flat(ctx, 30, -36, 28, 2, "#8a5634");
    wreckSkin(ctx, body, 10, -36, 78, 26, seed);
    clipped(ctx, body, () => G.scorch(ctx, [[30, -30], [60, -32], [64, -18], [34, -16]], seed + 1));
    carWindow(ctx, [[30.4, -34.8], [32.4, -34.8], [28.6, -28.4], [25.5, -28.4]], seed + 5);
    carWindow(ctx, [[34, -34.6], [44.4, -34.6], [44.4, -28.4], [30.6, -28.4]], seed + 6);
    carWindow(ctx, [[47.6, -34.6], [56.6, -34.6], [61.4, -28.4], [47.6, -28.4]], seed + 7);
    carWindow(ctx, [[58.6, -34.8], [60.4, -34.8], [65, -28.4], [63, -28.4]], seed + 8);
    flat(ctx, 12, -16, 74, 2, "r0");
    line(ctx, [[46, -26], [46, -12]], "rLine", 0.8);
    for (const x of [24, 72]) {
        const arch = [[x - 8, -10], [x - 7, -16], [x, -19], [x + 7, -16], [x + 8, -10]];
        shape(ctx, arch, HOLE);
        disc(ctx, x, -9, 4.5, "r1", "rLine");
        disc(ctx, x, -9, 1.6, "r0", "rLine");
    }
    ctx.restore();
};
const roadWheel = (ctx, cx, cy, rad, seed, teeth = 0) => {
    const r = rng(seed);
    if (teeth)
        for (let k = 0; k < teeth; k++) {
            const a = (k / teeth) * PI * 2;
            line(ctx, [[cx + cos(a) * rad * 0.8, cy + sin(a) * rad * 0.8], [cx + cos(a) * (rad + 1.2), cy + sin(a) * (rad + 1.2)]], OLIVE[4], 1.6, "butt");
        }
    disc(ctx, cx, cy, rad, "#2a2c1e", OLIVE[4]);
    disc(ctx, cx, cy, rad * 0.8, OLIVE[2], OLIVE[4]);
    ctx.beginPath();
    ctx.arc(cx, cy, rad * 0.8, PI * 1.1, PI * 1.7);
    ctx.strokeStyle = color(OLIVE[3]);
    ctx.lineWidth = 0.7;
    ctx.stroke();
    disc(ctx, cx, cy, rad * 0.38, OLIVE[1], OLIVE[4]);
    if (!simple())
        for (let k = 0; k < 6; k++) {
            const a = (k / 6) * PI * 2 + r();
            disc(ctx, cx + cos(a) * rad * 0.58, cy + sin(a) * rad * 0.58, 0.45, OLIVE[3], OLIVE[4]);
        }
    disc(ctx, cx, cy, rad * 0.14, OLIVE[4]);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rad * 0.8, 0, PI * 2);
    ctx.clip();
    G.grain(ctx, G.rectRegion(ctx, cx - rad, cy - rad, rad * 2, rad * 2), seed + 1, 0.9);
    G.dirt(ctx, cx - rad, cy - rad, rad * 2, rad * 2, seed + 2, 0.55);
    if (r() < 0.6)
        G.rustPatch(ctx, cx + (r() - 0.5) * rad, cy + rad * 0.3, rad * 0.3, rad * 0.18, seed + 3);
    ctx.restore();
};
const halfTrack = (ctx, seed) => {
    const hull = [[4, -14], [10, -34], [36, -40], [104, -40], [122, -26], [126, -14]];
    shape(ctx, hull, OLIVE[3], OLIVE[4]);
    flat(ctx, 36, -40, 68, 2, "#8a9064");
    wreckSkin(ctx, hull, 4, -40, 122, 26, seed + 3);
    G.chips(ctx, 36, -40, 68, seed + 4, G.DIRT);
    if (!simple()) {
        for (let x = 16; x < 120; x += 9)
            disc(ctx, x, -20.5, 0.6, OLIVE[1], OLIVE[4]);
        line(ctx, [[10, -30], [118, -30]], OLIVE[1], 0.7);
    }
    for (let y = -34; y < -20; y += 4)
        flat(ctx, 112, y, 8, 1.2, OLIVE[1]);
    const tower = [[44, -40], [46, -50], [52, -54], [76, -54], [82, -49], [82, -40]];
    shape(ctx, tower, OLIVE[2], OLIVE[4]);
    flat(ctx, 52, -54, 24, 1.6, OLIVE[3]);
    clipped(ctx, tower, () => {
        G.grain(ctx, G.polyRegion(ctx, tower), seed + 20, 0.9);
        G.dirt(ctx, 44, -54, 38, 14, seed + 21, 0.45);
        G.rustPatch(ctx, 56, -45, 3.5, 1.8, seed + 22);
        G.drips(ctx, 46, -52, 34, 10, seed + 23, 3);
    });
    G.chips(ctx, 52, -54, 24, seed + 24, G.DIRT);
    if (!simple())
        for (const x of [48, 56, 64, 72, 80])
            disc(ctx, x, -41.5, 0.55, OLIVE[3], OLIVE[4]);
    shape(ctx, [[54, -54], [55, -57], [65, -57], [66, -54]], OLIVE[1], OLIVE[4]);
    line(ctx, [[57, -57.5], [63, -57.5]], OLIVE[3], 0.7);
    flat(ctx, 70, -58, 3, 4, OLIVE[1], OLIVE[4]);
    flat(ctx, 69.4, -58.8, 4.2, 1.4, "#1a2422", OLIVE[4]);
    const mantlet = [[80, -51], [87, -50], [88, -44], [82, -42]];
    shape(ctx, mantlet, OLIVE[1], OLIVE[4]);
    if (!simple())
        for (const y of [-48.5, -45])
            disc(ctx, 84.5, y, 0.5, OLIVE[3], OLIVE[4]);
    line(ctx, [[87, -47], [104, -52]], "#1a1a14", 2.6);
    line(ctx, [[104, -52], [112, -60]], "#1a1a14", 2.6);
    flat(ctx, 92, -50, 2, 1.6, RUSTY);
    const hole = [[58, -34], [70, -36], [74, -24], [62, -18], [54, -24]];
    breach(ctx, hole, seed, OLIVE[3], OLIVE[4]);
    const track = [[6, -19], [122, -19], [131, -10], [123, -1], [10, -1], [0, -10]];
    shape(ctx, track, "#22221a", "#060604");
    if (!simple()) {
        for (let x = 7; x < 124; x += 3) {
            line(ctx, [[x, -19], [x, -17.2]], "#4a4a3a", 0.9);
            line(ctx, [[x + 1.5, -1], [x + 1.5, -2.8]], "#3a3a2e", 0.9);
        }
        line(ctx, [[8, -18.2], [122, -18.2]], "#0e0e0a", 0.5);
    }
    clipped(ctx, track, () => G.dirt(ctx, 0, -19, 132, 18, seed + 30, 0.7));
    roadWheel(ctx, 9, -10, 6.8, seed + 40, 12);
    roadWheel(ctx, 122, -10, 7, seed + 41, 14);
    for (let k = 0; k < 7; k++)
        roadWheel(ctx, 24 + k * 13.8, -8.6, 7.2, seed + 50 + k);
};
const militaryWreck = {
    id: "militaryWreck",
    box: [-4, -64, 140, 2],
    draw(ctx, state) {
        const seed = 5400 + state * 9;
        ctx.save();
        ctx.globalAlpha = 0.4;
        flat(ctx, 0, -2, 136, 3, HOLE);
        ctx.restore();
        if (state === 1)
            burntJeep(ctx, seed);
        else if (state === 2)
            halfTrack(ctx, seed);
        else
            armyTruck(ctx, seed);
    },
};
const drum = (ctx, x, y, seed, burst = false) => {
    pier(ctx, x, y, 14, 20, OLIVE);
    for (const k of [4, 10, 16])
        flat(ctx, x, y + k, 14, 1.2, OLIVE[4]);
    flat(ctx, x - 0.6, y - 1, 15.2, 2, OLIVE[3], OLIVE[4]);
    flat(ctx, x + 4, y + 7, 6, 4, SEAM[1]);
    G.grain(ctx, G.rectRegion(ctx, x, y, 14, 20), seed, 0.5);
    within(ctx, [[x, y, 14, 20]], () => {
        G.drips(ctx, x, y + 1, 14, 14, seed + 1, 2);
        G.rustPatch(ctx, x + 4 + rng(seed)() * 6, y + 15, 3, 1.6, seed + 2);
    });
    if (burst) {
        const tear = [[x + 2, y - 1], [x + 6, y + 5], [x + 9, y + 2], [x + 12, y + 6], [x + 13, y - 1]];
        shape(ctx, tear, HOLE);
        within(ctx, [[x - 0.6, y - 1, 15.2, 21]], () => G.rim(ctx, tear, seed + 3, OLIVE[3], HOLE));
        ctx.save();
        ctx.globalAlpha = 0.6;
        shape(ctx, blob(x + 18, y + 19.5, 10, 1.4, seed + 4, 9), "#0a0806");
        ctx.restore();
    }
};
const lyingDrum = (ctx, x, seed) => {
    const h = 14;
    flat(ctx, x, -h, 20, h, OLIVE[2], OLIVE[4]);
    flat(ctx, x, -h, 20, 3, OLIVE[3]);
    flat(ctx, x, -h + 3, 20, 1.2, "#8a9064");
    flat(ctx, x, -4, 20, 4, OLIVE[1]);
    for (const k of [5, 14])
        flat(ctx, x + k, -h, 1.2, h, OLIVE[4]);
    G.grain(ctx, G.rectRegion(ctx, x, -h, 20, h), seed, 0.5);
    G.rustPatch(ctx, x + 9, -3, 3, 1.4, seed + 1);
    ellipse(ctx, x + 20, -h / 2, 3.6, h / 2, OLIVE[3], OLIVE[4]);
    ellipse(ctx, x + 20.4, -h / 2, 2.4, h / 2 - 1.6, OLIVE[2]);
    disc(ctx, x + 20.6, -h / 2 - 3, 0.9, OLIVE[4]);
};
const fuelDrum = {
    id: "fuelDrum",
    box: [-4, -30, 58, 2],
    draw(ctx, state) {
        const seed = 5500 + state * 7;
        if (state === 1) {
            drum(ctx, 0, -20, seed);
            drum(ctx, 15, -20, seed + 10);
            lyingDrum(ctx, 30, seed + 20);
        }
        else
            drum(ctx, 6, -20, seed, state === 2);
        within(ctx, state === 1 ? [[0, -8, 14, 8], [15, -8, 14, 8], [30, -8, 20, 8]] : [[6, -8, 14, 8]], () => G.dirt(ctx, -2, -8, state === 1 ? 58 : 30, 8, seed + 30, 0.7));
    },
};
const sack = (ctx, x, y, w, seed) => {
    const r = rng(seed);
    const pts = [[x + 2, y], [x + w - 2, y - 0.6], [x + w, y + 3], [x + w - 1, y + 7], [x + 1, y + 7.4], [x, y + 3]];
    shape(ctx, pts, r() < 0.4 ? SACK[1] : SACK[2], SACK[4]);
    if (!simple()) {
        flat(ctx, x + 2, y + 1, w - 4, 1, SACK[3]);
        line(ctx, [[x + w * 0.5, y + 0.5], [x + w * 0.5, y + 7]], SACK[0], 0.5);
    }
    G.grain(ctx, G.polyRegion(ctx, pts), seed + 1);
    return pts;
};
const sandbags = {
    id: "sandbags",
    box: [-4, -28, 60, 2],
    draw(ctx, state) {
        const seed = 5600 + state * 5;
        const rows = state === 1 ? [5, 5] : [3, 2, 1];
        const bulk = [];
        rows.forEach((n, j) => {
            const off = ((rows[0] - n) * 11) / 2;
            for (let i = 0; i < n; i++)
                bulk.push(sack(ctx, off + i * 11, -7.4 - j * 7, 12, seed + j * 10 + i));
        });
        const spill = blob(state === 1 ? 50 : 30, -1, 7, 1.6, seed + 40, 9);
        shape(ctx, spill, SACK[2]);
        G.inside(ctx, G.polysRegion(ctx, bulk), () => G.dirt(ctx, -2, -20, 60, 20, seed + 41, 0.5));
    },
};
const shell = (ctx, x, y, len) => {
    tube(ctx, x, y, len, 4.4, OLIVE);
    shape(ctx, [[x + len, y], [x + len + 4, y + 2.2], [x + len, y + 4.4]], "#8a8a80", "#1a1a16");
    flat(ctx, x, y, 2.4, 4.4, SEAM[1]);
};
const shellCrate = {
    id: "shellCrate",
    box: [-4, -32, 54, 2],
    draw(ctx, state) {
        const seed = 5700 + state * 3;
        const lid = (x, y, w, h, s) => {
            band(ctx, x, y, w, h, CRATE);
            for (const k of [3, w - 5])
                flat(ctx, x + k, y, 2, h, CRATE[4]);
            if (!simple()) {
                flat(ctx, x + w * 0.35, y + h * 0.35, w * 0.3, 1, SEAM[1]);
                flat(ctx, x + w * 0.35, y + h * 0.55, w * 0.2, 1, SEAM[1]);
            }
            G.grain(ctx, G.rectRegion(ctx, x, y, w, h), s);
            G.chips(ctx, x, y + 0.4, w, s + 1, G.DIRT);
        };
        if (state === 1) {
            lid(0, -10, 40, 10, seed);
            flat(ctx, 2, -10, 36, 3, HOLE);
            ctx.save();
            ctx.translate(30, -12);
            ctx.rotate(-0.5);
            lid(0, -2, 20, 3, seed + 5);
            ctx.restore();
            for (let k = 0; k < 3; k++)
                shell(ctx, 4 + k * 13, -15, 8);
            shell(ctx, 40, -4.4, 8);
        }
        else {
            lid(0, -10, 44, 10, seed);
            lid(4, -20, 38, 10, seed + 5);
            shell(ctx, 30, -24.4, 12);
            G.drips(ctx, 0, -10, 44, 8, seed + 9, 3, false);
        }
        within(ctx, [[0, -10, state === 1 ? 40 : 44, 10]], () => G.dirt(ctx, -2, -10, 50, 10, seed + 10, 0.6));
    },
};
const vesniceSceneryAssets = [
    villageBackdrop, farPalms, farRuins, crateWall, rivetWall, plankWall, grassyWalkway, steelDeckPlate, trussWalkway, villageHouse, stiltBuilding, powerHouse,
    latticeMast, warningLamp, junctionBox, watchtower, overheadPipeline, transformer, storageTank, powerPlant, rockCliff, stoneWall, rubbleHeap, militaryWreck, fuelDrum,
    sandbags, shellCrate,
];
const VESNICE_IDS = [
    "villageBackdrop", "farPalms", "farRuins", "crateWall", "rivetWall", "plankWall", "grassyWalkway", "steelDeckPlate", "trussWalkway", "villageHouse", "stiltBuilding", "powerHouse", "latticeMast", "warningLamp", "junctionBox", "watchtower", "overheadPipeline", "transformer", "storageTank", "powerPlant", "rockCliff", "stoneWall", "rubbleHeap", "militaryWreck", "fuelDrum", "sandbags", "shellCrate",
    "sourceTeleport", "targetTeleport", "teleportPad", "brokenTeleport", "fuseBox", "electricCabinet", "cannon", "fireBarricade", "dynamiteWall", "energyBarrier", "powerBridge",
    "bridgeGuardPost", "smoulderingRemains", "smallKey", "walkieTalkie", "detonator", "projectileCrate", "projectile", "fuse", "dynamite", "navCircuit", "toaster", "energyPickup",
    "ammoPickup", "shieldPickup",
];
for (const asset of vesniceSceneryAssets) define(asset);
window.ENV.VESNICE = { ellipse, shadow, smoke, spark, flame, blob, RUIN, boulder, PLANK, planks, concreteBlock, within, outside, rectPts, villageBackdrop, farPalms, farRuins, crateWall, rivetWall, plankWall, steelGate, gateBlock, gateRuin, meshFence, grassyWalkway, steelDeckPlate, trussWalkway, villageHouse, stiltBuilding, powerHouse, latticeMast, warningLamp, junctionBox, watchtower, bronzeColumn, overheadPipeline, transformer, storageTank, powerPlant, rockCliff, STONE_TILE, stoneWall, rubbleHeap, militaryWreck, fuelDrum, sandbags, shellCrate, vesniceSceneryAssets, VESNICE_IDS };
})();

(() => {
const { define } = window.ENV;
const { G } = window.ENV;
const P = { ...window.ENV.P, simple: () => window.ENV.simple };
const { TILE } = window.ENV;
const craneKey = window.ENV.ASSETS.find((a) => a.id === "craneKey");
const { PLANK, gateBlock, gateRuin, outside, planks, rectPts, shadow, smoke, spark, steelGate, within } = window.ENV.VESNICE;
const { rng, color, flat, box, poly, cylV, cylH, disc, rivets, glow, stroke, shape, line, curve, slab, hazard, text } = P;
const { PI, sin, cos, min, max, floor } = Math;
const simple = () => P.simple();
const scuff = (ctx, x, w) => {
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = color("hole");
    ctx.beginPath();
    ctx.ellipse(x + w / 2, -0.5, w / 2, 0.9, 0, 0, PI * 2);
    ctx.fill();
    ctx.restore();
    if (simple())
        return;
    for (const [dx, s] of [[0.15, 1], [0.55, 0.8], [0.8, 1.2]])
        flat(ctx, x + w * dx, -1.4 * s, s, s * 0.8, "k2");
};
const ellipse = (ctx, cx, cy, rx, ry, fill, edge = null) => {
    ctx.fillStyle = color(fill);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, PI * 2);
    ctx.fill();
    if (edge)
        stroke(ctx, edge);
};
const wire = (ctx, pts, c, w = 0.8) => {
    line(ctx, pts, "mLine", w + 0.6);
    line(ctx, pts, c, w);
};
const ring = (ctx, cx, cy, rx, ry, c, w = 1) => {
    ctx.save();
    ctx.lineWidth = w;
    ctx.strokeStyle = color(c);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, PI * 2);
    ctx.stroke();
    ctx.restore();
};
const lamp = (ctx, x, y, c, lit = true, r = 1.2, halo = 4) => {
    if (lit && !simple())
        glow(ctx, x, y, halo, c, 0.6);
    disc(ctx, x, y, r, lit ? c : "k0", "mLine");
};
const arcBolt = (ctx, x, y0, y1, w, t, seed, c = "plasma", k = 1) => {
    const r = rng(Math.floor(t * 18) + seed * 101);
    const pts = [];
    const n = Math.max(4, Math.round((y1 - y0) / 6));
    for (let i = 0; i <= n; i++)
        pts.push([x + (i === 0 || i === n ? 0 : (r() - 0.5) * w), y0 + ((y1 - y0) * i) / n]);
    line(ctx, pts, c, 1.8 * k);
    line(ctx, pts, "plasmaCore", 0.7 * k);
};
const beamColumn = (ctx, x, y0, y1, w, t) => {
    if (!simple())
        glow(ctx, x, (y0 + y1) / 2, (y1 - y0) * 0.6, "plasma", 0.35);
    ctx.save();
    ctx.globalAlpha = 0.55;
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, "rgba(122,224,255,0)");
    g.addColorStop(0.5, color("plasma"));
    g.addColorStop(1, "rgba(122,224,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - w / 2, y0, w, y1 - y0);
    ctx.restore();
    for (let i = 0; i < 3; i++) {
        const k = (t * 0.8 + i / 3) % 1;
        ring(ctx, x, y1 + (y0 - y1) * k, w * 0.45, 1.2, "plasmaCore", 0.5);
    }
};
const POD_TOP = -72;
const podFrame = (ctx, seed) => {
    box(ctx, 0, -6, 48, 6, "steel", 1);
    box(ctx, 2, -8, 44, 2.4, "steel", 2);
    box(ctx, 9, -56, 30, 48, "rust", 0);
    if (!simple())
        for (let y = -50; y < -10; y += 8)
            flat(ctx, 10, y, 28, 0.6, "r1");
    for (const x of [3, 39]) {
        box(ctx, x, -58, 6, 50, "steel", 2, { vertical: true });
        for (const y of [-46, -32, -18])
            cylV(ctx, x - 1, y, 8, 3, "chrome", 2);
    }
    ellipse(ctx, 24, -8.6, 13, 2, "m1", "mLine");
    G.grain(ctx, G.rectRegion(ctx, 9, -56, 30, 48), seed, 0.55);
    G.rustPatch(ctx, 15, -16, 3, 2, seed + 1);
    for (const x of [3, 39]) {
        G.grain(ctx, G.rectRegion(ctx, x, -58, 6, 50), seed + 2 + x, 0.6);
        within(ctx, [[x, -58, 6, 50]], () => G.drips(ctx, x, -58, 6, 24, seed + 3 + x, 1));
    }
    const base = [[0, -6, 48, 6], [2, -8, 44, 2.4]];
    G.grain(ctx, G.rectsRegion(ctx, base), seed + 4, 0.6);
    within(ctx, base, () => G.dirt(ctx, 0, -8, 48, 8, seed + 5, 0.7));
    G.chips(ctx, 2, -8, 44, seed + 6);
};
const podBox = (ctx, x, y, lampColor, lit, seed) => {
    box(ctx, x, y, 9, 13, "steel", 1);
    flat(ctx, x, y, 9, 1.4, "m3", "mLine");
    for (let k = y + 2.6; k < y + 7.4; k += simple() ? 2.4 : 1.2)
        flat(ctx, x + 1.2, k, 6.6, 0.6, "c2");
    flat(ctx, x + 1.2, y + 8.4, 4.4, 3, lit ? "screen" : "screenOff", "mLine");
    lamp(ctx, x + 7, y + 9.9, lampColor, lit, 0.9, 3);
    G.grain(ctx, G.rectRegion(ctx, x, y, 9, 13), seed, 0.6);
    G.chips(ctx, x, y, 9, seed + 1);
    within(ctx, [[x - 1, y + 13, 6, 5]], () => G.drips(ctx, x, y + 13, 9, 5, seed + 2, 1));
};
const podHood = (ctx, lampColor, lit, seed) => {
    const hood = [[0, POD_TOP], [48, POD_TOP], [40, -58], [8, -58]];
    poly(ctx, hood, "steel", 2);
    G.grain(ctx, G.polyRegion(ctx, hood), seed + 7, 0.6);
    flat(ctx, 0, POD_TOP, 48, 2.2, "m3", "mLine");
    if (!simple()) {
        rivets(ctx, 4, -68, 40, 6, "m3");
        flat(ctx, 12, -63, 24, 0.6, "m0");
    }
    box(ctx, 18, -58, 12, 3, "chrome", 1);
    G.chips(ctx, 0, POD_TOP, 48, seed + 8);
    within(ctx, [[3, -58, 6, 12], [39, -58, 6, 12]], () => G.drips(ctx, 2, -58, 44, 12, seed + 9, 3));
    lamp(ctx, 24, POD_TOP - 1.5, lampColor, lit);
    podBox(ctx, 40, -54, lampColor, lit, seed + 12);
};
const POD_LAMP = { working: "screen", off: "k1", idle: "a1", damaged: "neon" };
const pod = (ctx, mode, t, seed) => {
    podFrame(ctx, seed);
    if (mode === "working")
        beamColumn(ctx, 24, -55, -9, 24, t);
    if (mode === "idle" && !simple()) {
        ctx.save();
        ctx.globalAlpha = 0.25 + sin(t * 2) * 0.1;
        flat(ctx, 12, -55, 24, 46, "plasma");
        ctx.restore();
    }
    if (mode === "damaged") {
        const hole = [[14, -40], [20, -46], [26, -38], [22, -30], [16, -32]];
        G.scorch(ctx, hole, seed + 10);
        poly(ctx, hole, "hole", 2);
        G.rim(ctx, hole, seed + 11, "r3", "hole");
        line(ctx, [[30, -55], [32, -46], [29, -40], [31, -34]], "a1", 0.8);
        spark(ctx, 31, -34, t, 1);
        spark(ctx, 20, -56, t, 3);
    }
    podHood(ctx, POD_LAMP[mode], mode !== "off", seed);
};
const SOURCE_MODES = ["idle", "off", "working"];
const TARGET_MODES = ["damaged", "off", "working"];
const sourceTeleport = {
    id: "sourceTeleport",
    box: [-2, -76, 51, 0],
    anim: true,
    draw(ctx, state, t) {
        pod(ctx, SOURCE_MODES[state] ?? "idle", t, 2100);
    },
};
const targetTeleport = {
    id: "targetTeleport",
    box: [-2, -76, 51, 0],
    anim: true,
    draw(ctx, state, t) {
        pod(ctx, TARGET_MODES[state] ?? "damaged", t, 2120);
    },
};
const brokenTeleport = {
    id: "brokenTeleport",
    box: [-4, -42, 54, 0],
    anim: true,
    draw(ctx, state, t) {
        box(ctx, 0, -6, 48, 6, "steel", 1);
        ellipse(ctx, 24, -6.6, 13, 1.6, "m0", "mLine");
        const shell = [[9, -6], [9, -26], [14, -31], [18, -24], [23, -33], [28, -22], [33, -28], [39, -20], [39, -6]];
        poly(ctx, shell, "rust", 0);
        ctx.save();
        G.polyRegion(ctx, shell)();
        ctx.clip();
        G.scorch(ctx, shell, 2160);
        ctx.restore();
        G.grain(ctx, G.polyRegion(ctx, shell), 2161, 0.7);
        G.inside(ctx, G.polyRegion(ctx, shell), () => G.rim(ctx, shell, 2162, "r3", "hole"));
        for (const [x, top] of [[3, -38], [39, -34]]) {
            poly(ctx, [[x, -6], [x, top + 3], [x + 2, top], [x + 4, top + 4], [x + 6, top + 1], [x + 6, -6]], "steel", 2, { dir: [1, 0] });
            cylV(ctx, x - 1, -20, 8, 3, "chrome", 2);
        }
        const debris = [[[-2, 0], [4, -7], [12, -9], [10, -3], [14, 0]], [[38, 0], [41, -5], [49, -6], [52, 0]], [[0, -6], [48, -6], [48, 0], [0, 0]]];
        poly(ctx, debris[0], "steel", 1);
        poly(ctx, debris[1], "steel", 0);
        box(ctx, 16, -16, 16, 9, "steel", 0);
        if (state === 0) {
            flat(ctx, 18, -15, 12, 7, "g1", "gLine");
            for (let x = 19.5; x < 29; x += simple() ? 3 : 1.5)
                flat(ctx, x, -9.4, 0.5, 1.2, "y2");
            flat(ctx, 21, -13.6, 5, 3, "m0");
            if (!simple())
                glow(ctx, 24, -11, 6, "screen", 0.25 + sin(t * 3) * 0.15);
        }
        else
            flat(ctx, 18, -15, 12, 7, "hole", "mLine");
        ctx.save();
        ctx.beginPath();
        for (const pts of debris) {
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (const [x, y] of pts.slice(1))
                ctx.lineTo(x, y);
            ctx.closePath();
        }
        ctx.clip();
        G.grain(ctx, G.rectRegion(ctx, -2, -9, 54, 9), 2163, 0.6);
        G.dirt(ctx, -2, -9, 54, 9, 2164, 0.7);
        G.rustPatch(ctx, 8, -3, 3, 1.5, 2165);
        ctx.restore();
        podBox(ctx, 40, -32, POD_LAMP.damaged, state === 0 && floor(t * 3) % 2 === 0, 2166);
        line(ctx, [[30, -24], [33, -18], [30, -14]], "a1", 0.8);
        spark(ctx, 30, -14, t, 5);
    },
};
const teleportPad = {
    id: "teleportPad",
    box: [-2, -76, 51, 0],
    anim: true,
    draw(ctx, _state, t) {
        pod(ctx, "working", t, 2140);
    },
};
const fuseScreen = (ctx, x, y, state, t) => {
    flat(ctx, x, y, 9, 4, state === 1 ? "screenOff" : "hole", "gLine");
    if (state === 1)
        return;
    const blink = Math.floor(t * 2) % 2;
    for (let i = 0; i < 3; i++)
        flat(ctx, x + 1 + i * 2.7, y + 0.8, 1.8, 2.4, i === 2 && blink ? "g1" : "screen");
};
const fuseBox = {
    id: "fuseBox",
    box: [-6, -76, 30, 0],
    anim: true,
    draw(ctx, state, t) {
        box(ctx, 0, -72, 24, 72, "concrete", 1, { vertical: true });
        box(ctx, -2, -74, 28, 4, "concrete", 2);
        box(ctx, -2, -4, 28, 4, "concrete", 1);
        if (!simple())
            for (const y of [-60, -24])
                flat(ctx, 1, y, 22, 0.6, "k0");
        within(ctx, [[0, -72, 24, 72]], () => G.surface(ctx, 0, -70, 24, 66, 2180, { rise: 0.3, drip: 2, dripLen: 26 }));
        G.chips(ctx, -2, -74, 28, 2181);
        cylV(ctx, 10, -30, 4, 28, "steel", 1);
        box(ctx, 3, -46, 18, 17, "green", 1);
        flat(ctx, 3, -46, 18, 1.2, "g3");
        box(ctx, 4.6, -44.6, 14.8, 14.2, "green", 2);
        G.drips(ctx, 3, -29, 18, 8, 2182, 2);
        G.chips(ctx, 3, -46, 18, 2183, G.DIRT);
        fuseScreen(ctx, 7.6, -43, state, t);
        for (const x of [7, 11, 15]) {
            if (state === 1 && x === 11) {
                flat(ctx, x - 0.2, -37.8, 3, 6.2, "hole", "gLine");
                for (const y of [-37.8, -32.8])
                    flat(ctx, x + 0.3, y, 2, 1, "c1", "mLine");
                continue;
            }
            const fresh = state === 2 && x === 11;
            box(ctx, x, -37.4, 2.6, 5.4, fresh ? "yellow" : "chrome", 2, { vertical: true });
            if (fresh && !simple())
                glow(ctx, x + 1.3, -34.6, 4, "y3", 0.4);
        }
        lamp(ctx, 19, -48.6, state === 1 ? "neon" : "screen", state !== 1 || Math.floor(t * 3) % 2 === 0);
    },
};
const electricCabinet = {
    id: "electricCabinet",
    box: [-2, -78, 100, 0],
    draw(ctx, state) {
        slab(ctx, 0, -72, 96, 72, "concrete", 2);
        flat(ctx, -1, -75, 98, 4, "k3", "kLine");
        flat(ctx, 0, -3, 96, 3, "k0", "kLine");
        within(ctx, [[0, -72, 96, 72]], () => G.surface(ctx, 0, -71, 96, 68, 2200, { rise: 0.35, drip: 5, dripLen: 30 }));
        G.chips(ctx, -1, -75, 98, 2201);
        G.grain(ctx, G.rectRegion(ctx, -1, -75, 98, 4), 2204, 1);
        G.dirt(ctx, -1, -75, 98, 4, 2205, 0.6);
        within(ctx, [[-1, -75, 98, 4], [0, -72, 96, 72]], () => {
            for (const [x, r] of [[14, 3], [52, 4], [84, 2.6]])
                G.rustPatch(ctx, x, -73, r, 1.2, 2206 + x);
            G.drips(ctx, -1, -71, 98, 12, 2207, 7);
        });
        G.chips(ctx, -1, -72, 98, 2208, G.DIRT);
        for (const x of [6, 70]) {
            box(ctx, x, -60, 20, 50, "steel", 1);
            for (let y = -56; y < -12; y += simple() ? 8 : 4)
                flat(ctx, x + 2, y, 16, 1.8, "m3");
            G.grain(ctx, G.rectRegion(ctx, x, -60, 20, 50), 2202 + x, 0.6);
            G.rustPatch(ctx, x + 14, -14, 2.5, 1.5, 2203 + x);
        }
        box(ctx, 32, -58, 32, 56, "steel", 0);
        if (state === 0) {
            box(ctx, 34, -56, 28, 54, "chrome", 1);
            flat(ctx, 34, -56, 28, 1.4, "c3");
            G.grain(ctx, G.rectRegion(ctx, 34, -56, 28, 54), 2210, 0.6);
            G.drips(ctx, 34, -56, 28, 22, 2211, 3);
            G.dirt(ctx, 34, -56, 28, 54, 2212, 0.25);
            shape(ctx, [[48, -46], [53.4, -36.4], [42.6, -36.4]], "hazardDark", "kLine");
            shape(ctx, [[48, -44.2], [51.8, -37.4], [44.2, -37.4]], "hazard");
            shape(ctx, [[48.6, -43], [46.2, -39.8], [48, -39.8], [47.2, -37.8], [50, -40.8], [48.2, -40.8], [49.2, -43]], "hazardDark");
            box(ctx, 56, -30, 3, 7, "steel", 2);
            lamp(ctx, 57.5, -33, "neon");
        }
        else {
            flat(ctx, 34, -56, 28, 54, "hole", "mLine");
            for (const y of [-46, -34, -22])
                flat(ctx, 36, y, 24, 1.4, "m2", "mLine");
            for (const [x, y] of [[40, -45], [50, -45], [40, -33], [50, -21]])
                box(ctx, x, y - 5, 2.6, 5, "chrome", 2, { vertical: true });
            flat(ctx, 50, -38.4, 2.6, 5, "m0");
            poly(ctx, [[34, -56], [26, -60], [26, 2], [34, -2]], "chrome", 0, { dir: [1, 0] });
            G.grain(ctx, G.polyRegion(ctx, [[34, -56], [26, -60], [26, 2], [34, -2]]), 2213, 0.6);
            lamp(ctx, 57.5, -60, "screen");
        }
    },
};
const TRACK_R = 6.6;
const ROAD_WHEELS = [66, 83, 100, 117, 134];
const roadWheel = (ctx, x, seed) => {
    const y = -TRACK_R;
    ellipse(ctx, x, y, 5.6, 5.6, "m1", "kLine");
    ellipse(ctx, x, y, 4.2, 4.2, "m2", "mLine");
    ellipse(ctx, x, y, 1.8, 1.8, "m1", "mLine");
    if (!simple())
        for (let i = 0; i < 6; i++)
            flat(ctx, x + cos((i / 6) * PI * 2) * 3 - 0.4, y + sin((i / 6) * PI * 2) * 3 - 0.4, 0.8, 0.8, "m3");
    G.inside(ctx, G.polyRegion(ctx, circle(x, y, 5.6)), () => {
        G.rustPatch(ctx, x + 1.6, y - 2.4, 1.6, 1, seed);
        G.dirt(ctx, x - 5.6, y - 2, 11.2, 7.6, seed + 1, 0.7);
    });
};
const track = (ctx) => {
    const x0 = 52, x1 = 150, h = TRACK_R * 2;
    const belt = [[x0 + TRACK_R, -h], [x1 - TRACK_R, -h], [x1, -TRACK_R], [x1 - TRACK_R, 0], [x0 + TRACK_R, 0], [x0, -TRACK_R]];
    shape(ctx, belt, "k1", "kLine");
    ellipse(ctx, x0 + TRACK_R, -TRACK_R, TRACK_R, TRACK_R, "k1", "kLine");
    ellipse(ctx, x1 - TRACK_R, -TRACK_R, TRACK_R, TRACK_R, "k1", "kLine");
    if (!simple())
        for (let x = x0 + TRACK_R; x < x1 - TRACK_R; x += 3) {
            flat(ctx, x, -h, 1.6, 1.2, "k3");
            flat(ctx, x + 1.5, -1.2, 1.6, 1.2, "k3");
        }
    ellipse(ctx, x0 + TRACK_R, -TRACK_R, 4.4, 4.4, "m2", "mLine");
    if (!simple())
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * PI * 2;
            flat(ctx, x0 + TRACK_R + cos(a) * 4.6 - 0.6, -TRACK_R + sin(a) * 4.6 - 0.6, 1.2, 1.2, "m1");
        }
    disc(ctx, x0 + TRACK_R, -TRACK_R, 1.6, "c1", "mLine");
    ellipse(ctx, x1 - TRACK_R, -TRACK_R, 4.4, 4.4, "m2", "mLine");
    disc(ctx, x1 - TRACK_R, -TRACK_R, 1.6, "m1", "mLine");
    for (const x of ROAD_WHEELS)
        roadWheel(ctx, x, 2269 + x);
    G.grain(ctx, G.polyRegion(ctx, belt), 2280, 0.8);
    G.inside(ctx, G.polysRegion(ctx, [belt, circle(x0 + TRACK_R, -TRACK_R, TRACK_R), circle(x1 - TRACK_R, -TRACK_R, TRACK_R)]), () => {
        G.dirt(ctx, x0, -h, x1 - x0, h, 2281, 0.9);
        G.rustPatch(ctx, 92, -11.4, 3, 0.8, 2282);
    });
};
const CANNON_BODY = [[56, -16], [60, -48], [76, -60], [138, -60], [148, -48], [146, -16]];
const cannon = {
    id: "cannon",
    box: [-14, -78, 160, 0],
    anim: true,
    draw(ctx, state, t) {
        const age = t % 1.6;
        const kick = state === 1 ? max(0, 1 - age * 3) * 6 : 0;
        shadow(ctx, 100, 104, 0.5);
        track(ctx);
        box(ctx, 54, -18, 94, 5, "steel", 1);
        G.grain(ctx, G.rectRegion(ctx, 54, -18, 94, 5), 2260, 0.6);
        G.dirt(ctx, 54, -18, 94, 5, 2261, 0.6);
        flat(ctx, 52, -15.4, 96, 2, "m3", "mLine");
        ctx.save();
        ctx.translate(kick, 0);
        cylH(ctx, 6, -45, 66, 7, "chrome", 1);
        cylH(ctx, 0, -46.6, 9, 10.2, "chrome", 0);
        if (!simple())
            for (const x of [2, 5])
                flat(ctx, x, -45.4, 1.2, 7.8, "hole");
        cylH(ctx, 40, -47, 8, 11, "chrome", 2);
        cylH(ctx, 50, -36, 30, 4, "steel", 2);
        const barrel = [[6, -45, 66, 7], [0, -46.6, 9, 10.2], [40, -47, 8, 11], [50, -36, 30, 4]];
        G.grain(ctx, G.rectsRegion(ctx, barrel), 2262, 0.5);
        within(ctx, barrel, () => G.rustPatch(ctx, 30, -43, 3, 1.4, 2263));
        ctx.restore();
        poly(ctx, CANNON_BODY, "steel", 1);
        poly(ctx, [[76, -60], [138, -60], [136, -54], [80, -54]], "steel", 2, { line: false });
        poly(ctx, [[60, -48], [76, -60], [80, -54], [66, -44]], "m3", 2, { line: false });
        box(ctx, 98, -50, 26, 14, "steel", 0);
        if (!simple()) {
            rivets(ctx, 62, -27, 82, 7, "m3");
            for (let x = 101; x < 122; x += 3)
                flat(ctx, x, -48, 1.2, 10, "m0");
        }
        hazard(ctx, 58, -22, 88, 5, 4);
        poly(ctx, [[138, -50], [152, -46], [152, -24], [146, -20]], "steel", 1, { dir: [1, 0] });
        G.grain(ctx, G.polyRegion(ctx, CANNON_BODY), 2264, 0.6);
        ctx.save();
        G.polyRegion(ctx, CANNON_BODY)();
        ctx.clip();
        G.drips(ctx, 62, -58, 82, 24, 2265, 6);
        ctx.restore();
        G.rustPatch(ctx, 128, -32, 5, 2.5, 2266);
        G.chips(ctx, 76, -60, 62, 2267);
        G.inside(ctx, G.polyRegion(ctx, CANNON_BODY), () => G.dirt(ctx, 56, -48, 92, 32, 2268, 0.3));
        if (state === 1 && age < 0.5) {
            const k = 1 - age * 2;
            glow(ctx, -6, -42, 18 * k + 6, "a2", 0.8 * k);
            poly(ctx, [[1, -48], [-10 * k - 4, -52], [-6, -44], [-14 * k - 6, -41], [-6, -38], [-10 * k - 4, -32], [1, -36]], "a1", 2);
            poly(ctx, [[1, -45], [-6 * k - 2, -44], [-8 * k - 3, -41], [-6 * k - 2, -38], [1, -38]], "y3", 2, { line: false });
        }
        if (state === 1 && !simple()) {
            ctx.save();
            for (let i = 0; i < 3; i++) {
                const k = min(1, age * 1.2 + i * 0.12);
                ctx.globalAlpha = 0.45 * (1 - k);
                ellipse(ctx, -4 - k * 10 + i * 3, -42 - k * 18 - i * 4, 4 + k * 8, 3 + k * 5, "k2");
            }
            ctx.restore();
        }
    },
};
const BAR_TOP = -150;
const hangerBar = (ctx, top) => {
    const bar = [[8, top, 8, -96 - top]];
    box(ctx, 8, top, 8, -96 - top, "steel", 1, { vertical: true });
    flat(ctx, 11, top, 1.4, -96 - top, "m3");
    if (!simple())
        for (let y = top + 10; y < -100; y += 12)
            disc(ctx, 12, y, 0.9, "m2", "mLine");
    box(ctx, 2, top, 20, 5, "steel", 1);
    for (const x of [5, 19])
        disc(ctx, x, top + 2.5, 1, "m2", "mLine");
    box(ctx, 5, -101, 14, 5, "steel", 1);
    for (const x of [8, 16])
        disc(ctx, x, -98.5, 0.9, "m2", "mLine");
    const mount = [...bar, [2, top, 20, 5], [5, -101, 14, 5]];
    G.grain(ctx, G.rectsRegion(ctx, mount), 2245, 0.6);
    within(ctx, mount, () => {
        for (let y = top + 8, i = 0; y < -110; y += 40, i++) {
            G.drips(ctx, 8, y, 8, 14, 2247 + i, 2);
            if (i % 2 === 0)
                G.rustPatch(ctx, 12, y + 18, 2.4, 4, 2248 + i);
        }
        G.drips(ctx, 5, -97, 14, 4, 2246, 2);
    });
};
const energyBarrier = {
    id: "energyBarrier",
    box: [-4, BAR_TOP, 28, 0],
    anim: true,
    draw(ctx, state, t, size) {
        const on = state === 0;
        hangerBar(ctx, size?.top ?? BAR_TOP);
        if (on && !simple())
            glow(ctx, 12, -48, 30, "plasma", 0.25 + sin(t * 13) * 0.06);
        if (on) {
            arcBolt(ctx, 12, -86, -4, 10, t, 1);
            arcBolt(ctx, 12, -86, -4, 8, t + 0.37, 2, "plasma", 0.6);
        }
        box(ctx, 0, -96, 24, 10, "steel", 1);
        box(ctx, 6, -86, 12, 3, "chrome", 1);
        flat(ctx, 2, -94, 20, 2, "hazard", "yLine");
        G.grain(ctx, G.rectsRegion(ctx, [[0, -96, 24, 10], [6, -86, 12, 3]]), 2240, 0.6);
        G.chips(ctx, 0, -96, 24, 2241);
        within(ctx, [[0, -96, 24, 10], [6, -86, 12, 3]], () => G.drips(ctx, 0, -92, 24, 10, 2242, 2));
        box(ctx, 4, -4, 16, 4, "steel", 1);
        box(ctx, 8, -6, 8, 2.4, "chrome", 1);
        const foot = [[4, -4, 16, 4], [8, -6, 8, 2.4]];
        G.grain(ctx, G.rectsRegion(ctx, foot), 2243, 0.6);
        within(ctx, foot, () => G.dirt(ctx, 4, -6, 16, 6, 2244, 0.7));
        lamp(ctx, 12, -84, "plasma", on);
    },
};
const stick = (ctx, x, y, w, h) => {
    box(ctx, x, y, w, h, "brick", 2, { vertical: w < h });
    if (!simple())
        flat(ctx, x + (w < h ? w * 0.2 : 0.4), y + (w < h ? 0.4 : h * 0.2), w < h ? w * 0.2 : w - 0.8, w < h ? h - 0.8 : h * 0.2, "b3");
};
const fireBarricade = {
    id: "fireBarricade",
    box: [-30, -76, 52, 0],
    anim: true,
    draw(ctx, state, t) {
        if (state === 1) {
            gateRuin(ctx, 24, 2290);
            if (!simple())
                smoke(ctx, 40, -30, t, 3, 30);
            return;
        }
        gateBlock(ctx, 24, 2284);
        steelGate(ctx, 0, 2286);
    },
};
const dynamiteWall = {
    id: "dynamiteWall",
    box: [-4, -76, 34, 0],
    anim: true,
    draw(ctx, state, t) {
        steelGate(ctx, 0, 2296);
        if (state === 1) {
            for (const x of [6, 9, 12])
                stick(ctx, x, -14, 3, 14);
            for (const y of [-11, -4])
                flat(ctx, 5.6, y, 9.8, 1.4, "k1", "kLine");
            box(ctx, 7.6, -9, 5.2, 3.6, "steel", 1);
            lamp(ctx, 11.4, -7.2, "neon", Math.floor(t * 3) % 2 === 0);
            wire(ctx, [[10, -9], [11, -16], [16, -12], [20, -2], [30, -0.6]], "y2");
        }
    },
};
const anchor = (ctx, x, flip) => {
    ctx.save();
    ctx.translate(x, 0);
    if (flip)
        ctx.scale(-1, 1);
    box(ctx, 0, 0, TILE, 7, "steel", 2);
    poly(ctx, [[0, 7], [TILE, 7], [TILE - 4, 12], [8, 12]], "steel", 0);
    box(ctx, 2, -3, 8, 3, "steel", 1);
    if (!simple())
        rivets(ctx, 0, 3.5, TILE, 6, "m3");
    const body = [rectPts(0, 0, TILE, 7), [[0, 7], [TILE, 7], [TILE - 4, 12], [8, 12]], rectPts(2, -3, 8, 3)];
    G.grain(ctx, G.polysRegion(ctx, body), 2300 + x, 0.6);
    G.inside(ctx, G.polysRegion(ctx, body), () => G.drips(ctx, 0, 3, TILE, 9, 2301 + x, 2));
    G.chips(ctx, 0, 0, TILE, 2302 + x);
    ctx.restore();
};
const powerBridge = {
    id: "powerBridge",
    box: [-4, -6, 292, 14],
    draw(ctx, state) {
        anchor(ctx, 0, false);
        anchor(ctx, 288, true);
        if (state === 0) {
            box(ctx, TILE, 0.4, 240, 2.6, "chrome", 2);
            if (!simple())
                for (let x = TILE + 12; x < 264; x += 24)
                    flat(ctx, x, 0.8, 1, 1.6, "c0");
            G.grain(ctx, G.rectRegion(ctx, TILE, 0.4, 240, 2.6), 2310, 0.5);
            within(ctx, [[TILE, 0.4, 240, 2.6]], () => {
                for (const x of [62, 150, 221])
                    G.rustPatch(ctx, x, 1.7, 3, 0.9, 2311 + x);
            });
            return;
        }
        poly(ctx, [[TILE, 0.4], [TILE + 10, 1.6], [TILE + 9, 3.4], [TILE, 3]], "chrome", 1);
        poly(ctx, [[264, 0.4], [254, 2.8], [255, 4.2], [264, 3]], "chrome", 1);
        G.inside(ctx, G.polysRegion(ctx, [[[TILE, 0.4], [TILE + 10, 1.6], [TILE + 9, 3.4], [TILE, 3]], [[264, 0.4], [254, 2.8], [255, 4.2], [264, 3]]]), () => {
            G.rustPatch(ctx, TILE + 4, 2, 2.5, 1, 2312);
            G.rustPatch(ctx, 260, 2, 2.5, 1, 2313);
        });
    },
};
const WALKER = [
    [[0.5, -2.2], [-0.3, 1]],
    [[-0.3, 1], [0.9, 2.8], [1.2, 5]],
    [[-0.3, 1], [-1.3, 2.9], [-2.8, 4.4]],
    [[0.3, -1.4], [1.6, 0], [2.2, 1.4]],
    [[0.3, -1.4], [-0.9, -0.1], [-1.6, 1.2]],
];
const circle = (cx, cy, r, n = 20) => Array.from({ length: n }, (_, i) => [cx + cos((i / n) * PI * 2) * r, cy + sin((i / n) * PI * 2) * r]);
const noWalkingSign = (ctx, x, y, r) => {
    disc(ctx, x, y, r + 0.5, "m1", "kLine");
    disc(ctx, x, y, r, "fs2");
    disc(ctx, x, y, r * 0.78, "c3");
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(r / 6.4, r / 6.4);
    disc(ctx, 0.9, -3.6, 1.05, "k0");
    for (const limb of WALKER)
        line(ctx, limb, "k0", 1.15);
    flat(ctx, 0.9, 4.6, 1.4, 0.5, "k0");
    flat(ctx, -3.4, 4.1, 1.2, 0.5, "k0");
    ctx.restore();
    line(ctx, [[x - r * 0.56, y - r * 0.56], [x + r * 0.56, y + r * 0.56]], "fs1", r * 0.17, "butt");
    ctx.save();
    ctx.globalAlpha = 0.24;
    disc(ctx, x, y, r, "c1");
    ctx.restore();
    const face = G.polyRegion(ctx, circle(x, y, r));
    G.grain(ctx, face, 1024, 0.75);
    ctx.save();
    face();
    ctx.clip();
    G.dirt(ctx, x - r, y - r, r * 2, r * 2, 1025, 0.45);
    G.rustPatch(ctx, x + r * 0.62, y + r * 0.5, r * 0.28, r * 0.2, 1026);
    G.rustPatch(ctx, x - r * 0.7, y - r * 0.2, r * 0.16, r * 0.14, 1027);
    if (!simple()) {
        line(ctx, [[x - r * 0.5, y + r * 0.3], [x - r * 0.1, y + r * 0.42]], "m2", 0.3);
        line(ctx, [[x + r * 0.1, y - r * 0.62], [x + r * 0.42, y - r * 0.5]], "m2", 0.3);
    }
    ctx.restore();
    G.drips(ctx, x - r * 0.3, y + r * 0.8, r * 0.6, r * 1.4, 1028, 2);
    disc(ctx, x, y - r * 0.9, 0.5, "m3", "mLine");
};
const bridgeGuardPost = {
    id: "bridgeGuardPost",
    box: [-54, -152, 30, 0],
    draw(ctx, state) {
        planks(ctx, -2, -144, 26, 144, 1020, true);
        const window = rectPts(2, -128, 18, 14);
        flat(ctx, 2, -128, 18, 14, "#0a0806", PLANK[4]);
        shape(ctx, [[-6, -144], [11, -152], [28, -144]], PLANK[2], PLANK[4]);
        flat(ctx, -4, -146, 30, 3, PLANK[3], PLANK[4]);
        box(ctx, -6, -40, 8, 40, "steel", 1, { vertical: true });
        const up = state === 1;
        ctx.save();
        ctx.translate(-2, -34);
        ctx.rotate(up ? PI / 2.2 : 0);
        flat(ctx, -46, -2.5, 46, 5, "k3", "kLine");
        for (let x = -42; x < -2; x += 10)
            flat(ctx, x, -2.5, 5, 5, "neon");
        ctx.restore();
        flat(ctx, 10.4, -102, 1.2, 4, "m1", "mLine");
        noWalkingSign(ctx, 11, -94, 7);
        within(ctx, [[-2, -144, 26, 144]], () => outside(ctx, [window], () => G.drips(ctx, -2, -144, 26, 60, 1021, 3)));
        G.rustPatch(ctx, -2, -18, 2.5, 4, 1022);
        G.chips(ctx, -4, -146, 30, 1023, G.DIRT);
    },
};
const BONE = ["#34322a", "#5e5a4a", "#8c8670", "#b4ac92"];
const bone = (ctx, pts, w) => {
    line(ctx, pts, "kLine", w + 1);
    line(ctx, pts, BONE[2], w);
    if (!simple())
        line(ctx, pts.map(([x, y]) => [x, y - w * 0.22]), BONE[3], w * 0.3);
};
const knob = (ctx, x, y, r) => disc(ctx, x, y, r, BONE[2], "kLine");
const CRANIUM = [[1.4, -1.2], [0.2, -4], [0.8, -7.2], [3, -9.6], [6.2, -10.8], [8.6, -10.6], [10, -11.4], [11.2, -10.6], [12, -9.4], [11, -8.6], [9.4, -7], [9.6, -4.6], [8, -2.4], [5, -0.8]];
const JAW = [[8.6, -4.2], [9.8, -6.8], [11, -8.2], [12.6, -8.8], [13.6, -8.4], [13.4, -7.4], [11.6, -6.6], [10.6, -4.4], [9.6, -3.4]];
const PELVIS = [[29.6, -1.4], [29.8, -5.2], [31, -8.4], [33.2, -9], [35.2, -7.2], [35.6, -4.4], [34.6, -1.2], [32, -0.6]];
const STERNUM = [[15.6, -8.6], [17, -9.4], [23.4, -8.2], [24.6, -7.2], [23.2, -7], [17, -7.8]];
const SCAPULA = [[13.6, -1.2], [14.4, -4.4], [17.6, -3], [20, -1.4], [17, -0.8]];
const RIBS = 7;
const vertebrae = (ctx, x0, x1, y0, y1, r) => {
    bone(ctx, [[x0, y0], [x1, y1]], r * 1.1);
    if (simple())
        return;
    const n = Math.max(2, Math.round((x1 - x0) / (r * 1.8)));
    for (let i = 0; i <= n; i++) {
        const k = i / n;
        disc(ctx, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, r * 0.8, BONE[2], "kLine");
        flat(ctx, x0 + (x1 - x0) * k - 0.25, y0 + (y1 - y0) * k - r * 1.4, 0.5, r * 0.8, BONE[1]);
    }
};
const ribs = (ctx, near) => {
    for (let i = 0; i < RIBS; i++) {
        const x = 15 + i * 1.8;
        const top = -9.4 + i * 0.25 + (i > 4 ? (i - 4) * 0.7 : 0);
        const end = i < 5 ? 17 + i * 1.3 : 20.6 + i * 1.5;
        const pts = [[x, -2.2], [x - 1.4 + i * 0.1, top + 2.4], [x + 0.6, top], [end, top + 0.6 + (i > 4 ? 1.4 : 0)]];
        curve(ctx, pts, "kLine", near ? 1.5 : 1.3);
        curve(ctx, pts, near ? BONE[2] : BONE[1], near ? 0.8 : 0.6);
    }
};
const skeleton = (ctx, seed) => {
    bone(ctx, [[33.4, -2.6], [41.4, -2.2]], 1.3);
    bone(ctx, [[41.4, -1.9], [48.6, -1.6]], 1.1);
    line(ctx, [[42, -1], [48.4, -0.8]], BONE[1], 0.5);
    ribs(ctx, false);
    disc(ctx, 41.4, -2.1, 1.3, BONE[1], "kLine");
    shape(ctx, SCAPULA, BONE[1], "kLine");
    vertebrae(ctx, 9.4, 14.2, -3.4, -2.6, 0.9);
    vertebrae(ctx, 14.2, 26, -2.4, -2.2, 0.85);
    vertebrae(ctx, 26, 30.6, -2.4, -3, 1.05);
    ribs(ctx, true);
    shape(ctx, STERNUM, BONE[2], "kLine");
    bone(ctx, [[15.8, -8.4], [14.6, -5.2]], 0.8);
    shape(ctx, PELVIS, BONE[2], "kLine");
    ellipse(ctx, 33.4, -2.8, 1.1, 0.8, "hole");
    if (!simple())
        curve(ctx, [[30.6, -6.6], [32.4, -8], [34.4, -7.2]], BONE[3], 0.5);
    bone(ctx, [[14.8, -4.4], [19, -2.4], [22.6, -1.4]], 1.2);
    knob(ctx, 14.8, -4.4, 1.3);
    knob(ctx, 22.6, -1.5, 1);
    bone(ctx, [[22.8, -1.8], [28.6, -1.6]], 0.6);
    bone(ctx, [[22.8, -0.9], [28.6, -0.9]], 0.75);
    for (const [dx, dy] of [[0, -1.8], [0.4, -1.2], [0.2, -0.6]])
        bone(ctx, [[29 + dx, -1.3], [31.6 + dx, dy - 0.2], [33 + dx, dy + 0.1]], 0.4);
    disc(ctx, 29.2, -1.3, 0.9, BONE[2], "kLine");
    knob(ctx, 34, -4.6, 1.6);
    bone(ctx, [[34, -4.6], [37.4, -10.4], [39.6, -15.6]], 1.7);
    bone(ctx, [[41.2, -14.8], [43.4, -8.4], [45, -2.6]], 0.6);
    bone(ctx, [[40.2, -15.2], [42.2, -8.6], [43.8, -2.6]], 1.2);
    knob(ctx, 40, -15.6, 1.8);
    disc(ctx, 40.8, -16.4, 0.9, BONE[3], "kLine");
    shape(ctx, [[43, -3.4], [45.4, -3.6], [45.6, -1.6], [43.8, -0.4], [42.2, -0.6], [42.4, -2]], BONE[2], "kLine");
    for (const [dy, end] of [[-1.6, 50.4], [-1.1, 50.8], [-0.6, 50.2]])
        bone(ctx, [[45.4, dy - 0.4], [48.6, dy], [end, dy + 0.3]], 0.42);
    ctx.save();
    ctx.translate(10, -1);
    ctx.scale(0.78, 0.78);
    ctx.translate(-10, 1);
    shape(ctx, CRANIUM, BONE[2], "kLine");
    if (!simple())
        shape(ctx, [[2, -7], [3.6, -9.2], [6.4, -10.2], [5, -8.6], [3, -6.4]], BONE[3]);
    shape(ctx, JAW, BONE[2], "kLine");
    ellipse(ctx, 8.2, -8.8, 1.5, 1.1, "hole");
    shape(ctx, [[10.2, -10.6], [11, -10.8], [10.8, -9.8]], "hole");
    ellipse(ctx, 6.6, -4.6, 0.9, 0.7, "hole");
    if (!simple()) {
        for (let x = 11.2; x < 13.2; x += 0.6)
            flat(ctx, x, -9.6 + (x - 11.2) * 0.35, 0.35, 0.9, BONE[3]);
        curve(ctx, [[1.6, -5.4], [4.4, -6.4], [7.4, -6.6]], BONE[1], 0.4);
    }
    G.grain(ctx, G.polyRegion(ctx, CRANIUM), seed, 0.9);
    ctx.restore();
    G.grain(ctx, G.polyRegion(ctx, PELVIS), seed + 1, 0.9);
    G.grain(ctx, G.polyRegion(ctx, STERNUM), seed + 3, 0.7);
    within(ctx, [[0, -1.6, 51, 1.6]], () => G.dirt(ctx, 0, -5, 51, 5, seed + 2, 0.55));
    if (!simple())
        for (const [x, w] of [[1, 3], [16, 4], [30, 2.4], [42, 3]])
            flat(ctx, x, -0.9, w, 0.9, "g1");
};
const REMAINS_SCALE = 0.65;
const smoulderingRemains = {
    id: "smoulderingRemains",
    box: [-3, -13, 36, 0],
    anim: true,
    draw(ctx, state, t) {
        ctx.save();
        ctx.scale(REMAINS_SCALE, REMAINS_SCALE);
        G.scorch(ctx, [[0, 0], [6, -0.8], [24, -1.2], [44, -0.8], [51, 0]], 2320);
        shadow(ctx, 25, 51, 0.5);
        skeleton(ctx, 2321);
        if (state === 0) {
            flat(ctx, 31.6, -1.4, 3.6, 1, "y2", "yLine");
            ellipse(ctx, 31.6, -0.9, 1.2, 1.1, "y1", "yLine");
            if (!simple())
                glow(ctx, 32.6, -1.2, 4, "y3", 0.35 + sin(t * 4) * 0.15);
        }
        ctx.restore();
    },
};
const smallKey = {
    id: "smallKey",
    box: craneKey.box,
    draw(ctx, state, t, size) {
        craneKey.draw(ctx, state ? 2 : 0, t, size);
    },
};
const walkieTalkie = {
    id: "walkieTalkie",
    box: [-2, -18, 12, 0],
    draw(ctx, state) {
        if (state)
            return scuff(ctx, 0, 10);
        shadow(ctx, 5, 9);
        cylV(ctx, 6.6, -17.4, 1.2, 6, "steel", 1);
        disc(ctx, 7.2, -17.6, 0.8, "m2", "mLine");
        box(ctx, 1, -12, 8, 12, "steel", 1);
        box(ctx, 1.6, -11.4, 6.8, 4, "steel", 0);
        if (!simple())
            for (let y = -10.6; y < -7.6; y += 1)
                flat(ctx, 2.4, y, 5.2, 0.45, "m3");
        flat(ctx, 2.2, -6.4, 5.6, 2.4, "screenOff", "mLine");
        if (!simple())
            flat(ctx, 2.6, -5.9, 2.4, 0.5, "screen");
        disc(ctx, 3, -2.2, 0.7, "neon", "mLine");
        disc(ctx, 6.6, -2.2, 0.9, "c1", "mLine");
        box(ctx, 9, -9, 1.2, 4, "steel", 0);
    },
};
const detonator = {
    id: "detonator",
    box: [-2, -20, 20, 0],
    draw(ctx, state) {
        if (state)
            return scuff(ctx, 0, 18);
        shadow(ctx, 8, 18);
        box(ctx, 2, -9, 12, 9, "rust", 2);
        box(ctx, 1.4, -10, 13.2, 1.8, "rust", 3);
        flat(ctx, 3.4, -6.4, 6, 3, "hazard", "yLine");
        if (!simple())
            for (let x = 3.8; x < 9; x += 1.6)
                flat(ctx, x, -6.4, 0.6, 3, "hazardDark");
        disc(ctx, 11.6, -5, 1, "c2", "mLine");
        disc(ctx, 11.6, -2.6, 1, "c2", "mLine");
        box(ctx, 7.4, -17, 1.4, 7.2, "chrome", 2, { vertical: true });
        box(ctx, 3.6, -18.6, 9, 1.8, "chrome", 1);
        disc(ctx, 3.8, -17.7, 0.9, "neon", "mLine");
        disc(ctx, 12.4, -17.7, 0.9, "neon", "mLine");
        wire(ctx, [[12.6, -4.8], [16, -3.6], [17.4, -0.6]], "neon");
        wire(ctx, [[12.6, -2.4], [15.4, -1.2], [18, -0.4]], "y2");
    },
};
const projectile = {
    id: "projectile",
    box: [-2, -9, 28, 0],
    draw(ctx, state) {
        if (state)
            return scuff(ctx, 0, 26);
        shadow(ctx, 12, 24);
        box(ctx, 1, -7.6, 3, 7.4, "yellow", 0);
        box(ctx, 3, -7, 12, 6.2, "yellow", 1);
        if (!simple())
            for (const x of [6, 12])
                flat(ctx, x, -7, 0.6, 6.2, "y0");
        box(ctx, 15, -7.4, 2, 7, "rust", 1);
        poly(ctx, [[17, -7], [21, -6.6], [24.6, -4.6], [25.4, -3.8], [24.6, -3], [21, -1], [17, -0.6]], "steel", 2);
        if (!simple()) {
            flat(ctx, 3.4, -6.4, 11, 0.6, "y3");
            flat(ctx, 18, -6.2, 4, 0.5, "m3");
        }
        flat(ctx, 19, -4.6, 1.2, 1.6, "neon");
    },
};
const fuse = {
    id: "fuse",
    box: [-2, -7, 16, 0],
    draw(ctx, state) {
        if (state)
            return scuff(ctx, 0, 14);
        shadow(ctx, 7, 14);
        box(ctx, 3, -5.6, 8, 5.2, "chrome", 2);
        if (!simple())
            flat(ctx, 4.4, -4.2, 5, 1.6, "neon");
        for (const x of [0.6, 11]) {
            box(ctx, x, -6, 2.4, 6, "yellow", 1);
            if (!simple())
                flat(ctx, x + 0.4, -5.4, 0.5, 4.8, "y3");
        }
        flat(ctx, -0.6, -3.6, 1.4, 1.2, "y1", "yLine");
        flat(ctx, 13.2, -3.6, 1.4, 1.2, "y1", "yLine");
    },
};
const dynamite = {
    id: "dynamite",
    box: [-2, -16, 20, 0],
    draw(ctx, state) {
        if (state === 1)
            return scuff(ctx, 0, 16);
        shadow(ctx, 8, 16);
        if (state === 2) {
            for (const x of [3, 6, 9])
                stick(ctx, x, -14, 3, 14);
            for (const y of [-11, -4])
                flat(ctx, 2.6, y, 9.8, 1.4, "k1", "kLine");
            box(ctx, 4.6, -9, 5.2, 3.6, "steel", 1);
            disc(ctx, 8.4, -7.2, 0.6, "neon");
            wire(ctx, [[7.2, -9], [8, -14], [12, -15], [15, -8], [17, -1]], "y2");
            return;
        }
        stick(ctx, 1, -3.4, 13, 3.2);
        stick(ctx, 2, -6.4, 13, 3.2);
        stick(ctx, 1.4, -9.2, 13, 3.2);
        for (const x of [4, 10.6])
            flat(ctx, x, -9.4, 1.4, 9.2, "k1", "kLine");
        wire(ctx, [[14.4, -7.6], [16.4, -9], [18, -7.4]], "k3", 0.6);
    },
};
const TRACES = [[[2, -2], [6, -7]], [[5, -1.4], [12, -1.4]], [[9, -7.6], [13, -4]], [[3.6, -6], [8, -6]]];
const navCircuit = {
    id: "navCircuit",
    box: [-2, -11, 18, 0],
    draw(ctx, state) {
        if (state)
            return scuff(ctx, 0, 16);
        shadow(ctx, 8, 16);
        poly(ctx, [[0, 0], [1.6, -9], [15, -9], [14.4, 0]], "green", 1, { dir: [1, 0] });
        if (!simple()) {
            ctx.save();
            ctx.strokeStyle = color("y2");
            ctx.globalAlpha = 0.8;
            ctx.lineWidth = 0.3;
            ctx.beginPath();
            for (const [a, b] of TRACES) {
                ctx.moveTo(a[0], a[1]);
                ctx.lineTo(b[0], b[1]);
            }
            ctx.stroke();
            ctx.restore();
        }
        box(ctx, 4.2, -6.6, 4.6, 3.6, "steel", 0);
        box(ctx, 10, -7.6, 3, 2.4, "steel", 0);
        flat(ctx, 10.4, -4, 2.4, 1.8, "plasma", "mLine");
        for (let x = 4.6; x < 8.8; x += simple() ? 2 : 1)
            flat(ctx, x, -3, 0.4, 0.8, "y2");
        flat(ctx, 1, -1.2, 13, 1.2, "y1", "yLine");
    },
};
const toaster = {
    id: "toaster",
    box: [-2, -11, 28, 0],
    anim: true,
    draw(ctx, state, t) {
        if (state)
            return scuff(ctx, 0, 26);
        shadow(ctx, 12, 24);
        box(ctx, 3, -3.4, 2.6, 3.4, "steel", 0, { vertical: true });
        box(ctx, 0.6, -8, 9.4, 4.8, "chrome", 1);
        flat(ctx, 0.6, -8, 9.4, 1, "c2");
        const heat = 0.6 + sin(t * 5) * 0.25;
        flat(ctx, 2.6, -8.6, 4.6, 0.9, "hole");
        if (!simple())
            glow(ctx, 4.9, -8.4, 2.6, "a1", heat * 0.6);
        flat(ctx, 3, -8.5, 3.8, 0.4, "a2");
        flat(ctx, 1.6, -6, 3.4, 1.2, "hazard", "yLine");
        box(ctx, 10, -7, 11.6, 2.8, "steel", 1);
        for (let x = 11.2; x < 21; x += simple() ? 3 : 1.5)
            flat(ctx, x, -7, 0.6, 2.8, "a1");
        box(ctx, 21.6, -7.6, 1.6, 4, "chrome", 2, { vertical: true });
        G.grain(ctx, G.rectsRegion(ctx, [[0.6, -8, 9.4, 4.8], [10, -7, 11.6, 2.8], [21.6, -7.6, 1.6, 4]]), 2340, 0.4);
        G.chips(ctx, 0.6, -8, 9.4, 2341);
    },
};
const energyPickup = {
    id: "energyPickup",
    box: [-4, -18, 16, 0],
    anim: true,
    draw(ctx, state, t) {
        if (state)
            return scuff(ctx, 0, 12);
        const pulse = 0.5 + sin(t * 4) * 0.5;
        if (!simple())
            glow(ctx, 6, -7, 10, "screen", 0.25 + pulse * 0.25);
        shadow(ctx, 6, 12);
        box(ctx, 1, -2, 10, 2, "steel", 1);
        box(ctx, 1, -14, 10, 2, "steel", 1);
        box(ctx, 4, -15.6, 4, 1.8, "chrome", 2);
        box(ctx, 1.8, -12, 8.4, 10, "green", 2, { vertical: true });
        poly(ctx, [[6.8, -11], [3.6, -6.4], [5.8, -6.4], [4.8, -3], [8.4, -7.8], [6.2, -7.8], [7.6, -11]], pulse > 0.5 ? "y3" : "y2", 2);
    },
};
const ammoPickup = {
    id: "ammoPickup",
    box: [-2, -13, 22, 0],
    draw(ctx, state) {
        if (state)
            return scuff(ctx, 0, 20);
        shadow(ctx, 10, 20);
        for (let i = 0; i < (simple() ? 3 : 5); i++) {
            const x = 3 + i * (simple() ? 4.6 : 2.8);
            box(ctx, x, -12, 1.8, 3, "yellow", 2, { vertical: true });
            poly(ctx, [[x, -12], [x + 0.9, -13], [x + 1.8, -12]], "chrome", 2);
        }
        box(ctx, 1, -9.4, 18, 9.4, "olive", 1);
        box(ctx, 0.4, -10, 19.2, 1.8, "olive", 2);
        flat(ctx, 4, -6.6, 12, 3.6, "o0", "kLine");
        for (let i = 0; i < 3; i++) {
            const x = 5.6 + i * 3.6;
            flat(ctx, x, -6, 1.2, 2.4, "y2");
            poly(ctx, [[x, -6], [x + 0.6, -6.8], [x + 1.2, -6]], "y3", 2, { line: false });
        }
        flat(ctx, 8.6, -1.6, 2.8, 1.6, "m1", "mLine");
    },
};
const shieldPickup = {
    id: "shieldPickup",
    box: [-4, -20, 18, 0],
    anim: true,
    draw(ctx, state, t) {
        if (state)
            return scuff(ctx, 0, 14);
        const bob = sin(t * 2.4) * 0.8;
        shadow(ctx, 7, 12);
        box(ctx, 2, -2.4, 10, 2.4, "steel", 1);
        if (!simple())
            glow(ctx, 7, -11 + bob, 9, "plasma", 0.4);
        const shield = [[2.4, -16 + bob], [7, -18 + bob], [11.6, -16 + bob], [11, -9.4 + bob], [7, -5.4 + bob], [3, -9.4 + bob]];
        poly(ctx, shield, "denim", 2, { dir: [1, 1] });
        poly(ctx, shield.map(([x, y]) => [7 + (x - 7) * 0.62, -11.6 + bob + (y + 11.6 - bob) * 0.62]), "plasma", 2, { line: false });
        if (!simple())
            flat(ctx, 6.4, -14.4 + bob, 1.2, 6, "plasmaCore");
        if (!simple())
            flat(ctx, 4.4, -12 + bob, 5.2, 1.2, "plasmaCore");
    },
};
const projectileCrate = {
    id: "projectileCrate",
    box: [-2, -24, 32, 0],
    draw(ctx, state) {
        if (state)
            return scuff(ctx, 0, 30);
        shadow(ctx, 15, 30);
        box(ctx, 1, -20, 28, 20, "olive", 1);
        for (let y = -15; y < 0; y += 5)
            flat(ctx, 1, y, 28, 0.5, "o0");
        for (const x of [1, 25.4])
            box(ctx, x, -20, 3.6, 20, "olive", 2, { vertical: true });
        box(ctx, 0.4, -21.6, 29.2, 2.4, "olive", 3);
        box(ctx, 0.4, -2, 29.2, 2, "olive", 0);
        hazard(ctx, 4.6, -5.4, 20.8, 3, 3);
        text(ctx, "AMMO", 15, -16, 2.6, "k0");
        flat(ctx, 8, -14, 14, 6.6, "o0", "kLine");
        poly(ctx, [[9.4, -11.9], [16.6, -11.9], [19.4, -11.3], [20.4, -10.7], [19.4, -10.1], [16.6, -9.5], [9.4, -9.5]], "y2", 2, { line: false });
        if (!simple())
            flat(ctx, 9.4, -12.6, 9, 0.6, "y1");
        flat(ctx, 11.6, -11.9, 0.6, 2.4, "y0");
        if (!simple())
            for (const x of [4.4, 25.6])
                rivets(ctx, x - 1, -18, 2, 4, "o3");
    },
};
const vesnicePropAssets = [
    sourceTeleport, targetTeleport, teleportPad, brokenTeleport, fuseBox, electricCabinet, cannon, fireBarricade, dynamiteWall, energyBarrier, powerBridge, bridgeGuardPost,
    smoulderingRemains, smallKey, walkieTalkie, detonator, projectile, fuse, dynamite, navCircuit, toaster, energyPickup, ammoPickup, shieldPickup, projectileCrate,
];
for (const asset of vesnicePropAssets) define(asset);
})();

(() => {
const { define } = window.ENV;
const P = { ...window.ENV.P, simple: () => window.ENV.simple };
const { box, poly, glow, lw } = P;
const { PI, sin, cos, min, max, abs, sqrt } = Math;
const simple = () => P.simple();
const { shadow, smoke, spark } = window.ENV.VESNICE;
const GUARD_PAL = {
  a0: "#3a3418", a1: "#5c5428", a2: "#7e7440", a3: "#b0a468", aLine: "#141008",
  m0: "#1c2018", m1: "#30362a", m2: "#4a5040", m3: "#6e7460", mLine: "#0a0c08",
  c0: "#5a5c50", c1: "#8a8c7c", c2: "#b4b4a2", c3: "#e0e0cc",
  badge: "#7e7440", trefoil: "#141008", visor: "#e0281e", screen: "#3fa34a", hole: "#120e08"
};
const GUARD_H = 60;
const GUARD_WIDE = 1.18;
const SHIN_WIDE = 1.5;
const FOOT_BACK = 0.7;
const GUARD_POSE = {
  hipNear: -14,
  kneeNear: { rot: 18, sx: SHIN_WIDE },
  ankleNear: { rot: -4, sx: FOOT_BACK },
  hipFar: 12,
  kneeFar: { rot: 6, sx: SHIN_WIDE },
  ankleFar: { rot: -16, sx: FOOT_BACK },
  body: 3
};
const RIFLE_SUPPORT = [40, -14];
const RIFLE_MUZZLE = [262, -44];
const LIMP_ARMS = { arm: 6, fore: -8, armFar: -4, foreFar: -12 };
const guardRigs = {};
let rifleModel = null;

function rifleParts() {
  return [
    { name: "stock", x: -96, y: -60, w: 70, h: 30, mat: "m", tone: 1 },
    { name: "grip", x: -14, y: -24, w: 22, h: 50, mat: "m", tone: 0 },
    { name: "receiver", x: -40, y: -66, w: 130, h: 40, mat: "m", tone: 2 },
    { name: "mag", x: 30, y: -30, w: 26, h: 54, mat: "m", tone: 0 },
    { name: "scope", x: -10, y: -88, w: 70, h: 18, mat: "c", tone: 1 },
    { name: "barrel", x: 90, y: -56, w: 160, h: 18, mat: "c", tone: 1 },
    { name: "guard", x: 90, y: -62, w: 70, h: 30, mat: "m", tone: 1 },
    { name: "brake", x: 240, y: -60, w: 22, h: 26, mat: "m", tone: 0 }
  ];
}

function guardRig() {
  const key = simple() ? "lod" : "full";
  if (guardRigs[key]) return guardRigs[key];
  const { buildSide, locate, solve } = window.XBOT;
  rifleModel ||= window.GUN.model({ buildParts: rifleParts });
  const root = buildSide({ enemy: true, lod: simple(), farLimbs: true });
  const carry = { ...GUARD_POSE, arm: -8, fore: -76 };
  const hand = locate(root, "hand", carry);
  const [dx, dy] = window.GUN.toHook([1, 0]);
  const tilt = Math.atan2(hand.b * dx + hand.d * dy, hand.a * dx + hand.c * dy);
  const aim = hand.a * hand.d - hand.b * hand.c > 0 ? -tilt : tilt;
  const [sx, sy] = RIFLE_SUPPORT;
  const grip = window.GUN.toHook([sx * Math.cos(aim) - sy * Math.sin(aim), sx * Math.sin(aim) + sy * Math.cos(aim)]);
  const far = solve(root, "handFar", carry, ["armFar", "foreFar"], [[-160, 40], [-150, 30]], hand.transformPoint(new DOMPoint(...grip)));
  return (guardRigs[key] = { root, pose: { ...carry, ...far }, aim });
}

function muzzleFlash(ctx, x, y, k) {
  if (!simple()) glow(ctx, x + 20, y, 70 * k + 20, "a2", 0.7);
  poly(ctx, [[x, y - 14], [x + 50 * k + 20, y - 26], [x + 30, y - 6], [x + 80 * k + 30, y], [x + 30, y + 6], [x + 50 * k + 20, y + 26], [x, y + 14]], "a1", 2, { line: false });
  poly(ctx, [[x, y - 8], [x + 40 * k + 14, y], [x, y + 8]], "y3", 2, { line: false });
}

function pack(ctx) {
  ctx.save();
  ctx.transform(0, 1, -1, 0, 0, 0);
  box(ctx, -40, -10, 150, 80, "olive", 1);
  box(ctx, -30, 60, 130, 24, "olive", 0);
  ctx.restore();
}

function backpack(tint) {
  return ctx => {
    if (tint) P.inShade({ brightness: tint.brightness ?? 1, saturate: tint.saturate ?? 1 }, () => pack(ctx));
    else pack(ctx);
  };
}

function guardFigure(ctx, fire, tint) {
  const { root, pose, aim } = guardRig();
  const { render, FOOT_Y, SIDE_AX, shade } = window.XBOT;
  const k = GUARD_H / (FOOT_Y - 2);
  const pal = tint ? shade(GUARD_PAL, tint) : GUARD_PAL;
  ctx.save();
  ctx.scale(k * GUARD_WIDE, k);
  ctx.translate(-SIDE_AX, -FOOT_Y);
  const t = ctx.getTransform();
  const lineW = P.lw(ctx) * Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
  const hand = c => {
    if (tint) return;
    c.save();
    c.transform(0, 1, -1, 0, 0, 0);
    c.rotate(aim);
    rifleModel.draw(c, { pal, lineW, simple: simple() });
    if (fire >= 0) {
      c.translate(RIFLE_MUZZLE[0], RIFLE_MUZZLE[1]);
      c.scale(1.6, 1.6);
      muzzleFlash(c, 0, 0, fire);
    }
    c.restore();
  };
  render(ctx, root, { pal, pose: tint ? { ...pose, ...LIMP_ARMS } : pose, hooks: { hand, back: backpack(tint) }, lineW, simple: simple() });
  ctx.restore();
}

function droppedRifle(ctx, x) {
  const k = (GUARD_H / (window.XBOT.FOOT_Y - 2)) * 0.9;
  ctx.save();
  ctx.translate(x, 0);
  ctx.scale(k * GUARD_WIDE, k);
  ctx.translate(0, -26);
  const t = ctx.getTransform();
  const lineW = P.lw(ctx) * Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
  rifleModel.draw(ctx, { pal: window.XBOT.shade(GUARD_PAL, { brightness: 0.55, saturate: 0.5 }), lineW, simple: simple() });
  ctx.restore();
}

define({
  id: "radioGuard",
  box: [-30, -64, 60, 0],
  anim: true,
  draw(ctx, state, t) {
    shadow(ctx, 0, 34, 0.45);
    if (state === 2) {
      ctx.save();
      ctx.translate(30, -9);
      ctx.rotate(-PI / 2);
      guardFigure(ctx, -1, { brightness: 0.55, saturate: 0.5 });
      ctx.restore();
      droppedRifle(ctx, -36);
      if (!simple()) spark(ctx, 6, -6, t, 4);
      return;
    }
    const ph = (t * 4) % 1;
    guardFigure(ctx, state === 1 && ph < 0.4 ? 1 - ph / 0.4 : -1);
  }
});
})();
