(() => {
const { define, P, G, TILE } = window.ENV;
const { rng, flat, shape, line } = P;
const { PI, sin, cos, min, max, floor, ceil, round } = Math;
const simple = () => window.ENV.simple;
const VOID = "#100c08";
const SKY = ["#000000", "#1c2424", "#282420", "#302c20", "#4c3418", "#64341c", "#6c401c", "#744c20", "#8c5030", "#a86034", "#c47c40"];
const FIRE = ["#9c1c14", "#ac2c0c", "#bc441c", "#d04c1c", "#e86418", "#e4841c", "#f4b82c", "#e4bc4c"];
const BRICK = ["#18100a", "#301c10", "#34200f", "#2c1a10", "#3a2414"];
const MORTAR = "#1c140c";
const QUOIN = ["#302c20", "#3c341c", "#443c20", "#4c442c", "#5c5434"];
const STONE = ["#182414", "#203024", "#303824", "#384030", "#404440", "#404c4c", "#4c5a58"];
const CHROME = ["#302c20", "#404440", "#605c50", "#989490", "#c0c0b4"];
const MESH = ["#2c3838", "#304040", "#384c54", "#586464", "#687474", "#7c8884", "#989490"];
const RAIL = ["#849098", "#405434", "#3c4c2c", "#2c4428", "#243818", "#182414"];
const WALK = ["#100c08", "#1c140c", "#302c20", "#3c341c", "#443428", "#4c442c", "#545048", "#605c50", "#786c60", "#846c58", "#644c34"];
const PLANK = ["#1c140c", "#302c20", "#3c341c", "#4c3418", "#5c4428", "#60543c", "#786c54"];
const RUSTY = ["#4c3418", "#5c4428", "#64341c", "#6c401c", "#804428", "#8c5030", "#a86034"];
const OCHRE = ["#3c341c", "#744c20", "#885c1c", "#946c34", "#b08440"];
const STEEL = ["#1c2424", "#2c3838", "#303c3c", "#3c3c30", "#404c4c", "#56625e"];
const SOOT = ["#000c0c", "#040c0c", "#18180c", "#282420"];
const OLIVE = ["#302c20", "#3c3c24", "#484830", "#5c5c3c"];
const FAR = ["#0c0a06", "#14120a", "#18180c", "#201c12", "#483018", "#9c6c18", "#c89c3c"];
const MARGIN = 24;
const wrap = (i, n) => ((i % n) + n) % n;
const hash = (a, b, s) => rng(s + wrap(a, 4096) * 131 + wrap(b, 4096) * 977);
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
const clipRect = (ctx, x, y, w, h) => {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
};
const veil = (ctx, alpha, draw) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    draw();
    ctx.restore();
};
const ellipse = (cx, cy, rx, ry, seed, n = 12) => {
    const r = rng(seed);
    return Array.from({ length: n }, (_, i) => {
        const a = (i / n) * PI * 2;
        const k = 0.8 + r() * 0.3;
        return [cx + cos(a) * rx * k, cy + sin(a) * ry * k];
    });
};

const SKY_W = 320;
const SKY_H = 200;
const cloud = (ctx, cx, cy, rx, ry, seed, tones) => {
    for (const dx of [-SKY_W, 0, SKY_W]) {
        if (cx + dx + rx * 1.3 < 0 || cx + dx - rx * 1.3 > SKY_W)
            continue;
        shape(ctx, ellipse(cx + dx, cy, rx, ry, seed), tones[0]);
        shape(ctx, ellipse(cx + dx - rx * 0.12, cy - ry * 0.3, rx * 0.82, ry * 0.55, seed + 1), tones[1]);
        if (tones[2])
            shape(ctx, ellipse(cx + dx - rx * 0.25, cy - ry * 0.5, rx * 0.5, ry * 0.28, seed + 2, 8), tones[2]);
    }
};
const prisonSky = {
    id: "prisonSky",
    box: [0, -SKY_H, SKY_W, 0],
    draw(ctx) {
        const lod = simple();
        ctx.save();
        clipRect(ctx, 0, -SKY_H, SKY_W, SKY_H);
        flat(ctx, 0, -SKY_H, SKY_W, SKY_H, SKY[0]);
        const r = rng(5100);
        veil(ctx, 0.9, () => shape(ctx, [[0, -200], [SKY_W, -200], ...Array.from({ length: 33 }, (_, i) => [SKY_W - i * 10, -114 + sin((i * PI) / 4) * 5 + sin((i * 3 * PI) / 16) * 3])], SKY[2]));
        const layers = [
            [lod ? 12 : 22, -200, -130, 40, 80, 6, 12, [SKY[1], SKY[3]]],
            [lod ? 14 : 30, -196, -112, 30, 70, 3, 7, [SKY[4], SKY[5]]],
            [lod ? 10 : 26, -190, -112, 20, 55, 2.5, 5, [SKY[5], SKY[6], SKY[8]]],
            [lod ? 8 : 18, -194, -150, 12, 40, 2, 4, [SKY[7], SKY[8], SKY[9]]],
            [lod ? 8 : 16, -184, -112, 16, 44, 3, 6, [SKY[1], SKY[0]]],
            [lod ? 4 : 10, -175, -120, 8, 26, 1, 2, [SKY[9], SKY[10]]],
        ];
        for (const [n, y0, y1, rx0, rx1, ry0, ry1, tones] of layers)
            for (let i = 0; i < n; i++) {
                const cy = y0 + r() * (y1 - y0);
                cloud(ctx, r() * SKY_W, cy, rx0 + r() * (rx1 - rx0), ry0 + r() * (ry1 - ry0), 5200 + i * 7 + round(cy), tones);
            }
        flat(ctx, 0, -96, SKY_W, 96, SKY[0]);
        const fr = rng(5300);
        const rows = [[-32, 0.15, [1, 3, 4]], [-30, 0.45, [4, 5, 6, 7]], [-28, 0.8, [5, 6, 7, 6]], [-26, 0.85, [4, 5, 6, 3]], [-24, 0.6, [2, 3, 5, 4]], [-22, 0.45, [3, 5, 2]], [-20, 0.3, [2, 1, 0]], [-18, 0.12, [1, 0]]];
        for (const [y, fill, tones] of rows)
            for (let x = -4; x < SKY_W; x += 3 + fr() * (lod ? 10 : 6)) {
                if (fr() > fill)
                    continue;
                flat(ctx, x, y, 2 + fr() * (lod ? 10 : 6), 2, FIRE[tones[floor(fr() * tones.length)]]);
            }
        ctx.restore();
    },
};

const slitWindows = (ctx, x, y, w, h, seed) => {
    const r = rng(seed);
    for (let wy = y + 6; wy < y + h - 8; wy += 9)
        for (let wx = x + 4; wx < x + w - 5; wx += 7) {
            const q = r();
            if (q < 0.25)
                continue;
            flat(ctx, wx, wy, 2, 4, q > 0.93 ? FAR[5] : FAR[4]);
            if (q > 0.97)
                veil(ctx, 0.35, () => flat(ctx, wx - 1, wy - 1, 4, 6, FAR[6]));
        }
};
const cellBlock = (ctx, x, w, h, seed) => {
    const r = rng(seed);
    flat(ctx, x, -h, w, h, FAR[2]);
    flat(ctx, x - 1, -h - 3, w + 2, 3, FAR[3]);
    flat(ctx, x, -h, w, 1, FAR[1]);
    for (let px = x + 10 + r() * 10; px < x + w - 8; px += 22 + r() * 18) {
        const ph = 4 + r() * 8;
        flat(ctx, px, -h - 3 - ph, 4 + r() * 6, ph, FAR[3]);
    }
    if (!simple())
        for (let k = 1; k < 3; k++)
            flat(ctx, x, -h + (h * k) / 3, w, 1, FAR[1]);
    slitWindows(ctx, x, -h, w, h, seed + 3);
};
const searchTower = (ctx, w, h) => {
    const cx = w / 2;
    const top = -h * 0.62;
    const legW = min(w * 0.36, 30);
    if (!simple()) {
        ctx.save();
        clipRect(ctx, 0, -h, w, h);
        const g = ctx.createLinearGradient(cx, top - 6, cx + w * 0.25, -h);
        g.addColorStop(0, "rgba(220,200,150,0.4)");
        g.addColorStop(1, "rgba(220,200,150,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx + 6, top - 9);
        ctx.lineTo(cx + w * 0.45, -h);
        ctx.lineTo(cx + w * 0.08, -h);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    else
        veil(ctx, 0.2, () => shape(ctx, [[cx + 6, top - 9], [cx + w * 0.45, -h], [cx + w * 0.08, -h]], "#dcc896"));
    const legs = [[cx - legW, 0], [cx - legW * 0.35, top], [cx + legW * 0.35, top], [cx + legW, 0]];
    line(ctx, [legs[0], legs[1]], FAR[3], 2.2);
    line(ctx, [legs[3], legs[2]], FAR[3], 2.2);
    const steps = 6;
    for (let k = 0; k < steps; k++) {
        const u0 = k / steps;
        const u1 = (k + 1) / steps;
        const at = (u) => [cx - legW + (legW * 0.65) * u, top * u];
        const bt = (u) => [cx + legW - (legW * 0.65) * u, top * u];
        line(ctx, [at(u0), bt(u1)], FAR[2], 1);
        line(ctx, [bt(u0), at(u1)], FAR[2], 1);
        line(ctx, [at(u1), bt(u1)], FAR[3], 1);
    }
    flat(ctx, cx - legW * 0.6, top - 2, legW * 1.2, 3, FAR[3]);
    flat(ctx, cx - legW * 0.45, top - 16, legW * 0.9, 14, FAR[2]);
    shape(ctx, [[cx - legW * 0.6, top - 16], [cx, top - 24], [cx + legW * 0.6, top - 16]], FAR[3]);
    flat(ctx, cx - legW * 0.3, top - 12, legW * 0.6, 3, FAR[4]);
    flat(ctx, cx + 3, top - 11, 4, 4, FAR[6]);
    flat(ctx, cx - legW * 0.8, -6, legW * 1.6, 6, FAR[1]);
};
const farPrisonBlocks = {
    id: "farPrisonBlocks",
    box: [0, -144, 192, 0],
    draw(ctx, state, _t, { w = state === 1 ? 96 : 192, h = state === 1 ? 144 : 96 } = {}) {
        const seed = 5400 + round(w * 7 + h * 3) + state * 11;
        if (state === 1) {
            searchTower(ctx, w, h);
            const half = min(w * 0.36, 30);
            G.grain(ctx, G.rectRegion(ctx, w / 2 - half * 0.5, -h * 0.62 - 24, half, 24), seed, 0.4);
            return;
        }
        const r = rng(seed);
        const blocks = [];
        for (let x = 0; x < w - 8;) {
            const bw = min(w - x, 40 + r() * 50);
            blocks.push([x, bw, h * (0.55 + r() * 0.45)]);
            x += bw + 2 + r() * 6;
        }
        blocks.forEach(([x, bw, bh], k) => cellBlock(ctx, x, bw, bh, seed + k * 13));
        const rects = blocks.map(([x, bw, bh]) => [x, -bh, bw, bh]);
        G.inside(ctx, G.rectsRegion(ctx, rects), () => {
            G.grain(ctx, G.rectsRegion(ctx, rects), seed + 1, 0.4);
            G.dirt(ctx, 0, -h, w, h, seed + 2, 0.2);
        });
    },
};

const COURSE = 6;
const BRICK_L = 12;
const QUOIN_P = 24;
const brickField = (ctx, x, y, w, h, edges, seed) => {
    const lod = simple();
    flat(ctx, x, y, w, h, MORTAR);
    const [vx0, vy0, vx1, vy1] = shown(ctx);
    const j0 = floor(max(y, vy0) / COURSE);
    const j1 = ceil(min(y + h, vy1) / COURSE);
    const xa = max(x, vx0);
    const xb = min(x + w, vx1);
    for (let j = j0; j < j1; j++) {
        const shift = (j & 1) * (BRICK_L / 2);
        const by = j * COURSE;
        for (let i = floor((xa - shift) / BRICK_L); i * BRICK_L + shift < xb; i++) {
            const bx = i * BRICK_L + shift;
            const r = hash(i, j, seed);
            const q = r();
            flat(ctx, bx, by, BRICK_L - 1, COURSE - 1, q < 0.15 ? BRICK[0] : q < 0.75 ? BRICK[1] : q < 0.9 ? BRICK[2] : BRICK[4]);
            if (lod)
                continue;
            flat(ctx, bx, by, BRICK_L - 1, 0.8, BRICK[3]);
            for (let k = 0; k < 2; k++)
                flat(ctx, bx + r() * 9, by + 1 + r() * 3, 1 + r() * 2, 1, r() < 0.5 ? "#443428" : "#282420");
        }
    }
    for (const ex of edges) {
        if (ex < vx0 - 24 || ex > vx1 + 24)
            continue;
        const k0 = floor(max(y, vy0) / QUOIN_P);
        const k1 = ceil(min(y + h, vy1) / QUOIN_P);
        for (let k = k0; k < k1; k++) {
            const qy = k * QUOIN_P;
            const qw = 20 + (k & 1) * 2;
            flat(ctx, ex - qw, qy, qw, 8, QUOIN[2]);
            flat(ctx, ex - qw, qy, qw, 1.2, QUOIN[4]);
            flat(ctx, ex - qw, qy + 6.6, qw, 1.4, QUOIN[0]);
            flat(ctx, ex - 1.2, qy, 1.2, 8, QUOIN[3]);
            if (!lod) {
                const r = hash(k, round(ex), seed + 5);
                for (let s = 0; s < 3; s++)
                    flat(ctx, ex - qw + r() * (qw - 2), qy + 1.5 + r() * 4, 1 + r() * 2, 1, r() < 0.5 ? QUOIN[1] : QUOIN[3]);
            }
        }
    }
};
const BRICK_SEED = 5600;
const prisonBrick = {
    id: "prisonBrick",
    box: [0, -96, 96, 0],
    draw(ctx, _state, _t, { w = 96, h = 96, at = [0, 0], region } = {}) {
        const [ax, ay] = at;
        const x = ax;
        const y = ay - h;
        ctx.save();
        ctx.translate(-ax, -ay);
        const cells = [];
        const edges = new Set();
        if (region) {
            const [vx0, vy0, vx1, vy1] = shown(ctx);
            const c0 = round(x / TILE);
            const r0 = round(y / TILE);
            for (let r = r0; r < r0 + round(h / TILE); r++) {
                if ((r + 1) * TILE < vy0 || r * TILE > vy1)
                    continue;
                for (let c = c0; c < c0 + round(w / TILE); c++)
                    if (region(c, r) && (c + 1) * TILE >= vx0 && c * TILE <= vx1) {
                        cells.push([c * TILE, r * TILE, TILE, TILE]);
                        if (!region(c + 1, r))
                            edges.add((c + 1) * TILE);
                    }
            }
            if (!cells.length) {
                ctx.restore();
                return;
            }
            G.rectsRegion(ctx, cells)();
            ctx.clip();
        }
        else {
            clipRect(ctx, x, y, w, h);
            edges.add(x + w);
        }
        brickField(ctx, x, y, w, h, [...edges], BRICK_SEED);
        const area = region ? G.rectsRegion(ctx, cells) : G.rectRegion(ctx, x, y, w, h);
        G.grain(ctx, area, BRICK_SEED + 1, 0.7);
        if (!simple()) {
            const r = rng(BRICK_SEED + round(x * 3 + y));
            for (let k = 0; k < round(w / 30); k++)
                G.drips(ctx, x + r() * w, y + r() * h * 0.6, 4, 18 + r() * 24, BRICK_SEED + round(x) + k, 1);
        }
        G.dirt(ctx, x, y, w, h, BRICK_SEED + 2, min(0.25, 30 / max(h, 1)));
        ctx.restore();
    },
};

const stoneBlock = (ctx, x, y, w, h, tone, lod) => {
    flat(ctx, x, y, w, h, STONE[tone]);
    if (lod)
        return;
    flat(ctx, x, y, w, 1, STONE[min(6, tone + 2)]);
    flat(ctx, x, y, 1, h, STONE[min(6, tone + 1)]);
    flat(ctx, x, y + h - 1, w, 1, STONE[0]);
    flat(ctx, x + w - 1, y, 1, h, STONE[0]);
};
const pipeV = (ctx, x, y, w, h, tones) => {
    flat(ctx, x, y, w, h, tones[1]);
    flat(ctx, x + w * 0.25, y, w * 0.3, h, tones[2]);
    flat(ctx, x + w * 0.35, y, w * 0.18, h, tones[3]);
    flat(ctx, x + w * 0.42, y, w * 0.08, h, tones[4]);
    flat(ctx, x + w - 1, y, 1, h, tones[0]);
};
const shaftMasonry = {
    id: "shaftMasonry",
    box: [0, -144, 24, 0],
    draw(ctx, state, _t, { w = 24, h = 144 } = {}) {
        const lod = simple();
        const pipe = state !== 1;
        const seed = 5800 + round(w * 7 + h * 3);
        const r = rng(seed);
        const sw = pipe ? w - 6 : w;
        ctx.save();
        clipRect(ctx, 0, -h, w, h);
        const blocks = [];
        for (let y = -h, row = 0; y < 0; y += 8, row++) {
            let x = (row & 1) ? -6 : 0;
            const inset = r() < 0.5 ? 0 : 2 + floor(r() * 3);
            while (x < sw) {
                const bw = 9 + r() * 6;
                const left = max(x, inset);
                if (x + bw > left + 2)
                    blocks.push([left, y, min(x + bw, sw) - left, 8, r()]);
                x += bw;
            }
        }
        flat(ctx, 0, -h, sw, h, VOID);
        for (const [x, y, bw, bh, q] of blocks)
            stoneBlock(ctx, x, y + 0.5, bw - 0.6, bh - 1, q < 0.2 ? 1 : q < 0.45 ? 2 : q < 0.65 ? 3 : q < 0.85 ? 4 : 5, lod);
        if (pipe) {
            flat(ctx, sw, -h, 6, h, VOID);
            pipeV(ctx, sw, -h, 4, h, CHROME);
            flat(ctx, w - 2, -h, 2, h, STONE[0]);
        }
        const band = round(-h / 48) * 48;
        for (let y = band; y < 0; y += 48) {
            if (y < -h)
                continue;
            flat(ctx, 0, y, w, 4, VOID);
            flat(ctx, 0, y + 4, w, 1, STONE[1]);
            if (pipe) {
                flat(ctx, sw - 1, y - 2, 6, 8, CHROME[1]);
                flat(ctx, sw - 1, y - 2, 6, 1.2, CHROME[3]);
            }
        }
        G.inside(ctx, G.rectRegion(ctx, 0, -h, sw, h), () => {
            G.grain(ctx, G.rectRegion(ctx, 0, -h, sw, h), seed + 1, 0.75);
            if (!lod)
                for (let y = -h + r() * 30; y < -10; y += 40 + r() * 40)
                    G.drips(ctx, 0, y, sw, 14 + r() * 20, seed + round(y), 1);
            veil(ctx, 0.5, () => G.dirt(ctx, 0, -h, sw, h, seed + 2, min(0.3, 40 / h)));
        });
        if (!lod && pipe)
            G.drips(ctx, sw, -h + 10, 4, 30, seed + 3, 1);
        ctx.restore();
    },
};

const bolt = (ctx, x, y, lod) => {
    if (lod)
        return;
    flat(ctx, x - 0.8, y - 0.8, 1.6, 1.6, RUSTY[6]);
    flat(ctx, x, y, 0.8, 0.8, RUSTY[0]);
};
const rustPlate = (ctx, x, y, w, h, seed, lod) => {
    const r = rng(seed);
    flat(ctx, x, y, w, h, r() < 0.5 ? RUSTY[2] : RUSTY[3]);
    flat(ctx, x, y, w, 1.2, RUSTY[6]);
    flat(ctx, x, y + h - 1.5, w, 1.5, RUSTY[0]);
    if (!lod) {
        ctx.save();
        clipRect(ctx, x, y, w, h);
        for (let k = 0; k < w / 3; k++) {
            const sx = x + r() * w;
            const sy = y + r() * h;
            line(ctx, [[sx, sy], [sx + 3 + r() * 6, sy - 1 - r() * 2]], r() < 0.5 ? RUSTY[5] : RUSTY[1], 0.6);
        }
        ctx.restore();
    }
    for (const bx of [x + 2, x + w - 2])
        for (const by of [y + 2.5, y + h - 3])
            bolt(ctx, bx, by, lod);
};
const ochreRail = (ctx, x, y, w) => {
    flat(ctx, x, y, w, 6, OCHRE[2]);
    flat(ctx, x, y, w, 1.2, OCHRE[3]);
    flat(ctx, x, y + 1.2, w, 1, OCHRE[2]);
    flat(ctx, x, y + 5, w, 1, OCHRE[1]);
};
const meshStrip = (ctx, x, y, w, h, lod) => {
    flat(ctx, x, y, w, h, MESH[0]);
    if (lod) {
        flat(ctx, x, y + h / 2, w, 1, MESH[3]);
        return;
    }
    for (let yy = y; yy < y + h - 0.5; yy += 2)
        for (let xx = x + ((yy - y) % 4 ? 2 : 0); xx < x + w; xx += 4)
            flat(ctx, xx, yy, 2, 1, MESH[4]);
};
const BAY = 48;
const bayFrame = (ctx, w, h, seed, fill) => {
    const lod = simple();
    const top = -h;
    flat(ctx, 0, top, w, h, SOOT[1]);
    flat(ctx, 0, top, w, 8, MORTAR);
    const r = rng(seed);
    if (!lod)
        for (let k = 0; k < w / 2; k++)
            flat(ctx, r() * w, top + 8 + r() * 8, 1 + r() * 2, 1, r() < 0.6 ? SOOT[3] : "#301c10");
    flat(ctx, 0, top + 16, w, 8, MORTAR);
    flat(ctx, 0, top + 23, w, 1, OLIVE[1]);
    for (let bx = 0; bx < w; bx += BAY)
        fill(bx, min(BAY, w - bx), top + 24, h - 24 - 22, rng(seed + bx * 3));
    ochreRail(ctx, 0, -21, w);
    meshStrip(ctx, 0, -15, w, 7, lod);
    ochreRail(ctx, 0, -8, w);
    flat(ctx, 0, -2, w, 2, OCHRE[0]);
    for (let bx = BAY; bx < w; bx += BAY) {
        flat(ctx, bx - 2, top + 16, 4, h - 37, OLIVE[2]);
        flat(ctx, bx - 2, top + 16, 1, h - 37, OLIVE[3]);
        flat(ctx, bx + 1, top + 16, 1, h - 37, OLIVE[0]);
    }
    if (!lod)
        for (let px = 8 + r() * 30; px < w - 4; px += 50 + r() * 60) {
            flat(ctx, px, top + 8, 2, h - 8, "#a87868");
            flat(ctx, px + 0.5, top + 8, 0.6, h - 8, "#d0a898");
            flat(ctx, px + 1.6, top + 8, 0.6, h - 8, "#5c3c30");
            for (let cy = top + 30; cy < -24; cy += 30)
                flat(ctx, px - 1, cy, 4, 2, OLIVE[2]);
        }
};
const rustBay = (ctx, lod) => (x, w, y, h, r) => {
    flat(ctx, x, y, w, h, "#282420");
    const split = y + h * (0.25 + r() * 0.15);
    rustPlate(ctx, x + 2, y + 1, w * (0.4 + r() * 0.3), split - y - 2, floor(r() * 1e4), lod);
    rustPlate(ctx, x + 2, split, w - 4, y + h - split - 1, floor(r() * 1e4), lod);
    if (r() < 0.4)
        rustPlate(ctx, x + w * 0.55, y + 1, w * 0.45 - 2, split - y - 2, floor(r() * 1e4), lod);
};
const steelBay = (ctx, lod) => (x, w, y, h, r) => {
    flat(ctx, x, y, w, h, STEEL[0]);
    const cols = 2;
    for (let k = 0; k < cols; k++) {
        const px = x + 2 + (k * (w - 4)) / cols;
        const pw = (w - 4) / cols - 1.5;
        const tone = r() < 0.5 ? STEEL[2] : STEEL[3];
        flat(ctx, px, y + 1, pw, h - 2, tone);
        flat(ctx, px, y + 1, pw, 1, STEEL[4]);
        flat(ctx, px, y + 1, 1, h - 2, STEEL[4]);
        flat(ctx, px + pw - 1, y + 1, 1, h - 2, STEEL[1]);
        flat(ctx, px, y + h * 0.5, pw, 1, STEEL[1]);
        if (!lod)
            for (let s = 0; s < 4; s++) {
                const sx = px + 2 + r() * (pw - 6);
                const sy = y + 3 + r() * (h - 8);
                line(ctx, [[sx, sy], [sx + 2 + r() * 5, sy + (r() - 0.5) * 3]], STEEL[5], 0.5);
            }
        if (r() < 0.5)
            veil(ctx, 0.7, () => flat(ctx, px + pw * 0.2, y + h * 0.62, pw * 0.6, 3, RUSTY[3]));
    }
};
const sootBay = (ctx, lod) => (x, w, y, h, r) => {
    flat(ctx, x, y, w, h, SOOT[0]);
    if (!lod)
        for (let k = 0; k < (w * h) / 10; k++)
            flat(ctx, x + r() * w, y + r() * h, 1 + r() * 1.5, 1, r() < 0.7 ? SOOT[2] : SOOT[3]);
    const rem = [[x + w * r() * 0.3, y + h * (0.6 + r() * 0.2), w * (0.3 + r() * 0.3), 3]];
    for (const [rx, ry, rw, rh] of rem)
        flat(ctx, rx, ry, rw, rh, RUSTY[1]);
};
const barredWindow = (ctx, x, y, w, h, lod) => {
    const rods = 9;
    const step = (w - 4) / rods;
    flat(ctx, x - 2, y - 2, w + 4, h + 4, MORTAR);
    flat(ctx, x, y, w, h, "#000000");
    for (let k = 0; k < rods; k++) {
        const rx = x + 2 + k * step + step / 2 - 1;
        flat(ctx, rx, y, 2.4, h, CHROME[1]);
        flat(ctx, rx + 0.6, y, 0.8, h, CHROME[2]);
        if (!lod)
            flat(ctx, rx + 0.8, y, 0.4, h, CHROME[3]);
    }
    flat(ctx, x, y - 2, w, 2, "#203024");
};
const cellBlockWall = {
    id: "cellBlockWall",
    box: [0, -96, 144, 0],
    draw(ctx, state, _t, { w = 144, h = 96 } = {}) {
        const lod = simple();
        const seed = 6000 + round(w * 7 + h * 3) + state * 17;
        ctx.save();
        clipRect(ctx, 0, -h, w, h);
        const fill = [rustBay, steelBay, sootBay, rustBay][state] ?? rustBay;
        bayFrame(ctx, w, h, seed, fill(ctx, lod));
        const holes = [];
        if (state === 3) {
            const ww = min(w - 12, 100);
            const wx = (w - ww) / 2 - min(10, (w - ww) / 2 - 2);
            const wh = min(h - 50, 34);
            const wy = -h + 26;
            barredWindow(ctx, wx, wy, ww, wh, lod);
            holes.push(G.rectPts(wx, wy, ww, wh));
            const ry = wy + wh / 2 - 2.5;
            flat(ctx, wx - 6, ry, min(w - wx + 6, ww + 30), 5, RUSTY[5]);
            flat(ctx, wx - 6, ry, min(w - wx + 6, ww + 30), 1, RUSTY[6]);
            flat(ctx, wx - 6, ry + 4, min(w - wx + 6, ww + 30), 1, RUSTY[0]);
            if (!lod) {
                for (let bx = wx; bx < wx + ww + 24; bx += 8)
                    flat(ctx, bx, ry + 1.5, 2, 2, OCHRE[4]);
                for (let k = 0; k < 3; k++)
                    line(ctx, [[wx - 10 + k * 3, ry + 2], [wx - 4 + k * 3, ry - 3]], k & 1 ? "#d0d0c0" : "#141414", 1.4);
            }
        }
        if (state === 2) {
            const r = rng(seed + 9);
            for (let x = 10 + r() * 20; x < w - 10; x += 40 + r() * 30) {
                const cy = -h + 30 + r() * (h - 60);
                const pts = Array.from({ length: 14 }, (_, i) => {
                    const a = (i / 14) * PI * 2;
                    const k = 0.45 + r() * 0.75;
                    return [x + cos(a) * 12 * k, cy + sin(a) * 9 * k];
                });
                G.scorch(ctx, pts, seed + round(x));
            }
        }
        G.inside(ctx, G.rectRegion(ctx, 0, -h + 8, w, h - 30), () => {
            G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 1, 0.8);
            const r = rng(seed + 2);
            for (let k = 0; k < max(2, round(w / 40)); k++)
                G.drips(ctx, r() * w, -h + 24 + r() * 10, 6, 20 + r() * 20, seed + 3 + k, 1);
            G.dirt(ctx, 0, -h + 8, w, h - 30, seed + 4, 0.25);
        }, holes);
        G.chips(ctx, 0, -21, w, seed + 5, G.DUST);
        ctx.restore();
    },
};

const meshRun = (ctx, x, y, w, h, lod, seed) => {
    flat(ctx, x, y, w, h, MESH[0]);
    if (lod) {
        flat(ctx, x, y + 2, w, 1, MESH[4]);
        flat(ctx, x, y + 4, w, 1.5, "#3c6460");
        flat(ctx, x, y + 6.5, w, 1, MESH[3]);
        return;
    }
    const [vx0, , vx1] = shown(ctx);
    const xa = x + max(0, floor((vx0 - x) / 3) * 3);
    const xb = min(x + w, vx1);
    for (let yy = y; yy < y + h - 0.5; yy += 1.5) {
        const row = round((yy - y) / 1.5);
        const odd = row & 1;
        for (let xx = xa + (odd ? 1.5 : 0); xx < xb; xx += 3) {
            const q = hash(round(xx * 2), row, seed)();
            flat(ctx, xx, yy, 1.5, 1, q < 0.12 ? MESH[6] : q < 0.32 ? MESH[4] : q < 0.5 ? "#3c6460" : q < 0.6 ? "#487c6c" : q < 0.75 ? MESH[2] : MESH[3]);
        }
    }
};
const MESH_H = 9;
const RAIL_H = 7;
const meshFloor = {
    id: "meshFloor",
    box: [0, -2, 144, 17],
    draw(ctx, state, _t, { w = 144 } = {}) {
        const lod = simple();
        const seed = 6200 + round(w) + state * 7;
        const cap = state === 1;
        const mw = cap ? w - 10 : w;
        ctx.save();
        meshRun(ctx, 0, 0, mw, MESH_H, lod, seed);
        flat(ctx, 0, 0, mw, 0.8, MESH[5]);
        const rail = (x0, x1) => {
            flat(ctx, x0, MESH_H, x1 - x0, 1, RAIL[0]);
            flat(ctx, x0, MESH_H + 1, x1 - x0, 1.5, RAIL[1]);
            flat(ctx, x0, MESH_H + 2.5, x1 - x0, 1.5, RAIL[2]);
            flat(ctx, x0, MESH_H + 4, x1 - x0, 1.5, RAIL[3]);
            flat(ctx, x0, MESH_H + 5.5, x1 - x0, 1.5, RAIL[4]);
        };
        rail(0, mw);
        if (cap) {
            const r = rng(seed + 1);
            const frayed = [[mw, 0]];
            for (let y = 1; y <= MESH_H; y += 1.5)
                frayed.push([mw + r() * 5, y]);
            frayed.push([mw, MESH_H]);
            shape(ctx, frayed, MESH[1]);
            for (let y = 1; y < MESH_H; y += 2)
                line(ctx, [[mw - 1, y], [mw + 2 + r() * 5, y + r() * 1.5]], MESH[4], 0.6);
            shape(ctx, [[mw, MESH_H], [mw + 4, MESH_H + 1], [mw + 10, MESH_H + 7], [mw + 9, MESH_H + 10], [mw + 2, MESH_H + 7], [mw, MESH_H + 7]], RAIL[2]);
            line(ctx, [[mw, MESH_H + 0.5], [mw + 4, MESH_H + 1.5], [mw + 9.5, MESH_H + 7.5]], RAIL[0], 0.7);
        }
        G.inside(ctx, G.rectRegion(ctx, 0, 0, w, MESH_H + RAIL_H), () => {
            G.grain(ctx, G.rectRegion(ctx, 0, 0, w, MESH_H + RAIL_H), seed + 2, 0.6);
            veil(ctx, 0.8, () => G.dirt(ctx, 0, 0, mw, MESH_H, seed + 3, 0.5));
            const r = rng(seed + 4);
            for (let x = 24; x < mw; x += 48)
                if (r() < 0.7)
                    G.rustPatch(ctx, x + (r() - 0.5) * 4, MESH_H + 3, 2 + r() * 2, 1.5, seed + x);
        });
        G.chips(ctx, 0, 0, mw, seed + 5, G.DUST);
        if (!lod) {
            const r = rng(seed + 6);
            G.drips(ctx, 0, MESH_H + RAIL_H, mw, 6, seed + 7, max(1, round(w / 40)));
            for (let x = 24 * (1 + floor(r() * 2)); x < mw - 2; x += 72)
                flat(ctx, x, MESH_H, 1, RAIL_H, RAIL[5]);
        }
        ctx.restore();
    },
};

const WALK_H = 48;
const walkBays = (ctx, w, y, h, seed, lod, skip) => {
    const r = rng(seed);
    for (let x = 0; x < w; x += 24) {
        if (skip(x))
            continue;
        for (const ox of [7, 19]) {
            const bx = x + ox;
            if (bx > w - 2)
                continue;
            flat(ctx, bx - 4, y, 4, h, WALK[1]);
            flat(ctx, bx - 4, y, 1.5, h, WALK[0]);
            flat(ctx, bx, y, 0.8, h, WALK[5]);
            if (!lod && r() < 0.35)
                G.drips(ctx, bx - 2, y + h - 1, 2, 5 + r() * 6, seed + bx, 1);
        }
    }
};
const wallWalk = {
    id: "wallWalk",
    box: [0, -2, 144, WALK_H + 1],
    draw(ctx, state, _t, { w = 144 } = {}) {
        const lod = simple();
        const seed = 6400 + round(w) + state * 7;
        const hx = state === 1 ? floor((w * 0.6) / 24) * 24 : -100;
        const inHole = (x) => x >= hx && x < hx + 24;
        ctx.save();
        clipRect(ctx, 0, -2, w, WALK_H + 3);
        flat(ctx, 0, 0, w, 9, WALK[5]);
        flat(ctx, 0, 0, w, 1, WALK[7]);
        flat(ctx, 0, 1, w, 1, "#2c3838");
        walkBays(ctx, w, 2, 6, seed, lod, inHole);
        flat(ctx, 0, 8, w, 1, "#2c3838");
        flat(ctx, 0, 9, w, 1, WALK[5]);
        flat(ctx, 0, 10, w, 2, WALK[7]);
        flat(ctx, 0, 10, w, 0.8, WALK[9]);
        flat(ctx, 0, 12, w, 1, WALK[8]);
        flat(ctx, 0, 13, w, 8, WALK[4]);
        flat(ctx, 0, 13, w, 1, WALK[3]);
        flat(ctx, 0, 20, w, 2, WALK[2]);
        flat(ctx, 0, 22, w, 2, "#2c3838");
        flat(ctx, 0, 24, w, 1, WALK[8]);
        flat(ctx, 0, 25, w, 2, WALK[4]);
        flat(ctx, 0, 27, w, 12, "#301c10");
        if (!lod) {
            const r = rng(seed + 1);
            for (let k = 0; k < w / 2; k++)
                flat(ctx, r() * w, 27 + r() * 11, 1 + r() * 2, 1, r() < 0.5 ? "#182414" : WALK[3]);
        }
        walkBays(ctx, w, 27, 12, seed + 2, lod, inHole);
        flat(ctx, 0, 37, w, 2, WALK[1]);
        flat(ctx, 0, 39, w, 1, WALK[0]);
        flat(ctx, 0, 40, w, WALK_H - 40, WALK[6]);
        flat(ctx, 0, 40, w, 1, WALK[10]);
        flat(ctx, 0, WALK_H - 1, w, 1, WALK[8]);
        if (!lod) {
            const r = rng(seed + 3);
            for (let k = 0; k < w; k++)
                flat(ctx, r() * w, 41 + r() * 6, 1 + r(), 1, r() < 0.35 ? WALK[9] : r() < 0.6 ? WALK[7] : WALK[4]);
            for (let x = 12; x < w; x += 24)
                for (const y of [11, 44])
                    flat(ctx, x - 0.6, y - 0.6, 1.2, 1.2, WALK[8]);
            for (let x = 96 + floor(r() * 3) * 24; x < w - 24; x += 120 + floor(r() * 3) * 24)
                flat(ctx, x, 40, 1, 8, WALK[1]);
        }
        const holes = [];
        if (state === 1) {
            const pts = G.rectPts(hx + 2, 1, 20, 10);
            meshRun(ctx, hx + 2, 1, 20, 10, lod, seed + 9);
            flat(ctx, hx + 1, 0, 22, 1.5, WALK[7]);
            flat(ctx, hx + 1, 11, 22, 1.5, WALK[1]);
            flat(ctx, hx + 1, 0, 1.5, 12.5, WALK[7]);
            flat(ctx, hx + 21.5, 0, 1.5, 12.5, WALK[1]);
            holes.push(pts);
        }
        G.inside(ctx, G.rectRegion(ctx, 0, 0, w, WALK_H), () => {
            G.grain(ctx, G.rectRegion(ctx, 0, 0, w, WALK_H), seed + 4, 0.7);
            const r = rng(seed + 5);
            for (let x = 30 + r() * 40; x < w - 10; x += 60 + r() * 80)
                G.drips(ctx, x, 21, 4, 10 + r() * 8, seed + round(x), 1);
            G.dirt(ctx, 0, 27, w, 12, seed + 6, 0.5);
        }, holes);
        G.chips(ctx, 0, 0.2, w, seed + 7, G.DUST);
        G.chips(ctx, 0, 40.2, w, seed + 8, G.DIRT);
        ctx.restore();
    },
};

const PLANK_TOP = -24;
const catwalkSpan = (ctx, x0, x1, sag, seed, lod, snapAt) => {
    const yAt = (x) => PLANK_TOP + (sag ? sag * sin((PI * (x - x0)) / (x1 - x0)) : 0);
    const seg = sag ? 6 : x1 - x0;
    for (let x = x0; x < x1; x += seg) {
        const xb = min(x1, x + seg);
        const ya = yAt(x);
        const yb = yAt(xb);
        shape(ctx, [[x, ya], [xb, yb], [xb, yb + 3], [x, ya + 3]], PLANK[3]);
        shape(ctx, [[x, ya + 1], [xb, yb + 1], [xb, yb + 2.2], [x, ya + 2.2]], PLANK[5]);
        line(ctx, [[x, ya + 0.4], [xb, yb + 0.4]], PLANK[4], 0.8);
    }
    const r = rng(seed);
    for (let x = x0; x < x1; x += 24) {
        const px = x + 2;
        const py = yAt(px);
        flat(ctx, px - 0.5, py, 4, 2.5, PLANK[6]);
        flat(ctx, px + 3, py + 3, 1.5, 3, PLANK[0]);
        flat(ctx, px + 0.5, py + 5, 7, 1.4, PLANK[0]);
    }
    const bot = (x) => yAt(x) + 8.5;
    const top = (x) => yAt(x) + 3.5;
    for (let x = x0; x < x1 - 2; x += 6) {
        const xm = min(x1, x + 3);
        const xe = min(x1, x + 6);
        if (snapAt !== null && x >= snapAt && x < snapAt + 6) {
            line(ctx, [[x, top(x)], [x + 2, bot(x) - 1]], PLANK[1], 1.3);
            line(ctx, [[xe, top(xe)], [xe - 1.5, top(xe) + 3]], PLANK[1], 1.3);
            continue;
        }
        line(ctx, [[x, top(x)], [xm, bot(xm)], [xe, top(xe)]], r() < 0.2 ? PLANK[2] : PLANK[1], 1.3);
    }
    if (!lod)
        line(ctx, Array.from({ length: ceil((x1 - x0) / 6) + 1 }, (_, k) => {
            const x = min(x1, x0 + k * 6);
            return [x, bot(x)];
        }), PLANK[0], 0.8);
};
const scrapCatwalk = {
    id: "scrapCatwalk",
    box: [0, -26, 144, -10],
    draw(ctx, state, _t, { w = 144 } = {}) {
        const lod = simple();
        const seed = 6600 + round(w) + state * 7;
        const bent = state === 1;
        ctx.save();
        catwalkSpan(ctx, 0, w, bent ? min(6, w / 20) : 0, seed, lod, bent ? round(w * 0.45 / 6) * 6 : null);
        const sag = bent ? min(6, w / 20) : 0;
        const rail = Array.from({ length: ceil(w / 6) + 1 }, (_, k) => {
            const x = min(w, k * 6);
            return [x, PLANK_TOP + sag * sin((PI * x) / w)];
        });
        const band = [...rail, ...rail.slice().reverse().map(([x, y]) => [x, y + 3])];
        G.grain(ctx, G.polyRegion(ctx, band), seed + 1, 0.8);
        if (!lod) {
            const r = rng(seed + 2);
            G.inside(ctx, G.polyRegion(ctx, band), () => {
                for (let x = 8 + r() * 20; x < w - 4; x += 20 + r() * 30)
                    veil(ctx, 0.5 + r() * 0.3, () => flat(ctx, x, PLANK_TOP - 1, 3 + r() * 6, 12, r() < 0.5 ? G.RUST[1] : G.RUST[0]));
            });
            if (!bent)
                G.chips(ctx, 0, PLANK_TOP, w, seed + 3, G.DUST);
        }
        ctx.restore();
    },
};

for (const asset of [prisonSky, farPrisonBlocks, prisonBrick, shaftMasonry, cellBlockWall, meshFloor, wallWalk, scrapCatwalk]) define(asset);
})();
