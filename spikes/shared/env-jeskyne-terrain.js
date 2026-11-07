(() => {
const { define, P, G, TILE } = window.ENV;
const { rng, flat, shape, line, glow } = P;
const { PI, sin, cos, min, max, floor, ceil, round, abs } = Math;
const simple = () => window.ENV.simple;
const VOID = "#13100c";
const SHALE = ["#1e1209", "#30180c", "#483018", "#6c3c18", "#a85c20", "#d08a34"];
const MOSS = ["#26261a", "#303024", "#3c3c2a", "#484830", "#483c24", "#565236", "#1a1810"];
const FLARE = ["#e46018", "#e48418", "#f0b430", "#fff0a0", "#a83008"];
const FAR = ["#16120c", "#211a12", "#2c2318", "#382c1e", "#4a3c28"];
const LAVA = ["#3a1004", "#542400", "#78240c", "#6c300c", "#c8501c", "#f0b430", "#ffe890"];
const GREEN = ["#4c5040", "#6c7058", "#8c9074"];
const SCREE = ["#2a261e", "#4c4636", "#6c6450", "#8c826a"];
const wrap = (i, n) => ((i % n) + n) % n;
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
const clipRect = (ctx, x, y, w, h) => {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
};
const jag = (x0, x1, y, amp, step, seed) => {
    const r = rng(seed);
    const pts = [];
    for (let x = x0; x < x1; x += step * (0.6 + r() * 0.8))
        pts.push([x, y + (r() - 0.5) * 2 * amp]);
    pts.push([x1, y + (r() - 0.5) * 2 * amp]);
    return pts;
};
const blob = (cx, cy, rx, ry, seed, n = 10) => {
    const r = rng(seed);
    return Array.from({ length: n }, (_, i) => {
        const a = (i / n) * PI * 2;
        const k = 0.7 + r() * 0.4;
        return [cx + cos(a) * rx * k, cy + sin(a) * ry * k];
    });
};
const ROW = 8;
const COL = 48;
const SHALE_W = 288;
const SHALE_H = 192;
const SHALE_SEED = 7400;
const flake = (ctx, x, y, len, th, r, lod) => {
    const tip = [x, y + th * (0.35 + r() * 0.3)];
    const top = [[x + len * 0.3, y + th * 0.2], [x + len * 0.65, y], [x + len * 0.93, y + th * 0.1]];
    const end = [x + len, y + th * 0.5];
    const bot = [[x + len * 0.9, y + th], [x + len * 0.55, y + th * 0.95], [x + len * 0.2, y + th * 0.75]];
    const dark = r() < 0.55;
    shape(ctx, [tip, ...top, end, ...bot], SHALE[dark ? 1 : 2]);
    shape(ctx, [tip, ...top, end, [x + len * 0.85, y + th * 0.42], [x + len * 0.5, y + th * 0.36], [x + len * 0.2, y + th * 0.48]], SHALE[dark ? 2 : 3]);
    if (lod)
        return;
    for (let k = 0; k < 2; k++) {
        const yy = y + th * (0.18 + k * 0.22 + r() * 0.08);
        const xa = x + len * (0.15 + r() * 0.25);
        const xb = x + len * (0.6 + r() * 0.35);
        line(ctx, [[xa, yy + th * 0.06], [xb, yy]], SHALE[dark ? 3 : r() < 0.25 ? 5 : 4], 0.7 + r() * 0.6);
    }
    line(ctx, [[x + len * 0.25, y + th * 0.8], [x + len * 0.85, y + th * 0.85]], SHALE[0], 0.8);
};
const shaleField = (ctx, x, y, w, h) => {
    const lod = simple();
    flat(ctx, x, y, w, h, VOID);
    const [vx0, vy0, vx1, vy1] = shown(ctx);
    const j0 = floor((max(y, vy0) - ROW * 2) / ROW);
    const j1 = ceil(min(y + h, vy1) / ROW);
    for (let j = j0; j <= j1; j++) {
        const jw = wrap(j, SHALE_H / ROW);
        const shift = (jw * 29) % COL;
        const i0 = floor((max(x, vx0) - shift - COL * 1.6) / COL);
        const i1 = ceil((min(x + w, vx1) - shift) / COL);
        for (let i = i0; i <= i1; i++) {
            const r = rng(SHALE_SEED + wrap(i, SHALE_W / COL) * 131 + jw * 977);
            if (r() > 0.72)
                continue;
            const len = 40 + r() * 36;
            const th = 7 + r() * 5;
            flake(ctx, i * COL + shift + (r() - 0.5) * 16, j * ROW + (r() - 0.5) * 3, len, th, r, lod);
        }
    }
};
const deepShade = (ctx, x, y, w, h, region) => {
    const c0 = round(x / TILE);
    const r0 = round(y / TILE);
    const cols = round(w / TILE);
    const rows = round(h / TILE);
    const [vx0, vy0, vx1, vy1] = shown(ctx);
    ctx.save();
    ctx.fillStyle = VOID;
    for (const [k, alpha] of [[0, 0.3], [1, 0.3], [2, 0.4]]) {
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        for (let r = r0; r < r0 + rows; r++) {
            if ((r + 1) * TILE < vy0 || r * TILE > vy1)
                continue;
            for (let c = c0; c < c0 + cols; c++) {
                if ((c + 1) * TILE < vx0 || c * TILE > vx1 || !region(c, r))
                    continue;
                const d = k * 8;
                const l = region(c - 1, r) ? 0 : d;
                const t = region(c, r - 1) ? 0 : d;
                const rt = region(c + 1, r) ? 0 : d;
                const b = region(c, r + 1) ? 0 : d;
                ctx.rect(c * TILE + l, r * TILE + t, TILE - l - rt, TILE - t - b);
            }
        }
        ctx.fill();
    }
    ctx.restore();
};
const caveRock = {
    id: "caveRock",
    box: [0, -192, 72, 0],
    draw(ctx, _state, _t, { w = 72, h = 192, at = [0, 0], region } = {}) {
        const [ax, ay] = at;
        ctx.save();
        ctx.translate(-ax, -ay);
        if (region)
            deepShade(ctx, ax, ay - h, w, h, region);
        else {
            clipRect(ctx, ax, ay - h, w, h);
            shaleField(ctx, ax, ay - h, w, h);
            G.grain(ctx, G.rectRegion(ctx, ax, ay - h, w, h), SHALE_SEED + 1, 0.6);
        }
        ctx.restore();
    },
};
const ceilingRock = (ctx, w, top, bot) => {
    const r = rng(4400);
    flat(ctx, 0, top, w, bot - top, MOSS[2]);
    ctx.save();
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 220; i++) {
        const cx = r() * w;
        const cy = top + r() * (bot - top);
        shape(ctx, blob(cx, cy, 3 + r() * 9, 2 + r() * 5, 4500 + i, 7), MOSS[[1, 3, 4, 5, 3, 1, 4][floor(r() * 7)]]);
    }
    ctx.restore();
    if (!simple())
        for (let i = 0; i < 260; i++)
            flat(ctx, r() * w, top + r() * (bot - top), 1 + r() * 2.5, 1 + r() * 1.5, r() < 0.45 ? MOSS[5] : MOSS[0]);
    for (let i = 0; i < 34; i++) {
        let x = r() * w;
        let y = top + r() * (bot - top);
        const pts = [[x, y]];
        const dir = r() < 0.6 ? 1 : -1;
        for (let k = 0; k < 5 + floor(r() * 8); k++) {
            x += dir * (1 + r() * 5);
            y += (r() - 0.25) * 5;
            pts.push([x, y]);
        }
        line(ctx, pts, MOSS[6], 0.5 + r() * 0.8);
    }
    G.grain(ctx, G.rectRegion(ctx, 0, top, w, bot - top), 4401, 0.8);
    ctx.save();
    ctx.globalAlpha = 0.35;
    flat(ctx, 0, bot - 16, w, 16, MOSS[6]);
    ctx.restore();
    flat(ctx, 0, bot - 5, w, 5, "#2a2418");
    shape(ctx, [[0, bot], ...jag(0, w, bot - 4, 2, 7, 4402), [w, bot]], "#201a12");
};
const caveBackdrop = {
    id: "caveBackdrop",
    box: [0, -182, 320, 0],
    draw(ctx) {
        const w = 320;
        ctx.save();
        clipRect(ctx, 0, -182, w, 182);
        ceilingRock(ctx, w, -182, 0);
        ctx.restore();
    },
};
const dripstones = (ctx, w, h, seed, tones) => {
    const r = rng(seed);
    const ceil0 = -h + 6;
    shape(ctx, [[0, -h], [w, -h], ...jag(0, w, ceil0, 3, 9, seed + 1).reverse()], tones[1]);
    for (let x = 4 + r() * 8; x < w - 2; x += 9 + r() * 14) {
        const len = h * (0.1 + r() * 0.24);
        const half = 2.5 + r() * 4;
        shape(ctx, [[x - half, ceil0 - 2], [x + half, ceil0 - 2], [x + half * 0.5, ceil0 + len * 0.5], [x + half * 0.15, ceil0 + len], [x - half * 0.15, ceil0 + len * 0.96], [x - half * 0.55, ceil0 + len * 0.4]], tones[r() < 0.5 ? 1 : 2]);
        shape(ctx, [[x + half * 0.3, ceil0 - 2], [x + half, ceil0 - 2], [x + half * 0.5, ceil0 + len * 0.5], [x + half * 0.15, ceil0 + len]], tones[3]);
    }
    for (let x = r() * 10; x < w; x += 12 + r() * 16) {
        const len = h * (0.1 + r() * 0.18);
        const half = 3 + r() * 4;
        shape(ctx, [[x - half, 0], [x - half * 0.3, -len * 0.6], [x, -len], [x + half * 0.35, -len * 0.55], [x + half, 0]], tones[2]);
    }
    for (let x = 6 + r() * 12; x < w; x += 18 + r() * 22) {
        const len = h * (0.22 + r() * 0.24);
        const half = 4 + r() * 6;
        shape(ctx, [[x - half, 0], [x - half * 0.45, -len * 0.5], [x - 1, -len], [x + 1.2, -len * 0.98], [x + half * 0.4, -len * 0.45], [x + half, 0]], tones[3]);
        shape(ctx, [[x + 0.2, -len * 0.97], [x + 1.2, -len * 0.98], [x + half * 0.4, -len * 0.45], [x + half, 0], [x + half * 0.3, 0], [x + half * 0.1, -len * 0.5]], tones[4]);
    }
    shape(ctx, [[0, 0], ...jag(0, w, -3, 1.5, 8, seed + 2), [w, 0]], tones[1]);
};
const curtain = (ctx, w, h, seed, tones) => {
    const r = rng(seed);
    for (let x = w * (0.1 + r() * 0.15); x < w - 8; x += w * (0.3 + r() * 0.25)) {
        const half = 5 + r() * 5;
        const drop = h * (0.45 + r() * 0.25);
        const pts = [[x - half * 1.8, -h + 4]];
        for (let k = 1; k <= 6; k++)
            pts.push([x - half * (1.6 - k * 0.12) + sin(k * 1.7 + x) * 1.5, -h + 4 + (drop * k) / 6]);
        pts.push([x, -h + 4 + drop + 4]);
        for (let k = 6; k >= 1; k--)
            pts.push([x + half * (1.6 - k * 0.12) + sin(k * 2.1 + x) * 1.5, -h + 4 + (drop * k) / 6]);
        pts.push([x + half * 1.8, -h + 4]);
        shape(ctx, pts, tones[3]);
        for (let k = -1; k <= 1; k++)
            line(ctx, [[x + k * half * 0.7, -h + 6], [x + k * half * 0.55, -h + drop * 0.9]], tones[k ? 2 : 4], 0.8);
        const col = h - drop - 10;
        if (col > 10)
            shape(ctx, [[x - half * 1.4, 0], [x - half * 0.5, -col * 0.4], [x - 1, -col], [x + 1, -col], [x + half * 0.5, -col * 0.4], [x + half * 1.4, 0]], tones[3]);
    }
};
const farStalagmites = {
    id: "farStalagmites",
    box: [0, -144, 144, 0],
    draw(ctx, state, _t, { w = 144, h = 144 } = {}) {
        const seed = round(w * 7 + h * 3) + state * 11;
        if (state === 1) {
            ctx.save();
            clipRect(ctx, 0, -h, w, h);
            if (!simple())
                for (let x = w * 0.2; x < w; x += w * 0.45)
                    glow(ctx, x, 0, min(h * 0.4, 60), FLARE[1], 0.22);
            ctx.globalAlpha = 0.35;
            flat(ctx, 0, -5, w, 5, FLARE[4]);
            ctx.restore();
        }
        dripstones(ctx, w, h, seed, FAR);
        G.grain(ctx, G.rectRegion(ctx, 0, -4, w, 4), seed + 13, 0.5);
        if (state === 1) {
            curtain(ctx, w, h, seed + 5, FAR);
            ctx.save();
            ctx.globalAlpha = 0.5;
            const r = rng(seed + 9);
            for (let x = 0; x < w; x += 4 + r() * 8)
                flat(ctx, x, -2.5, 2 + r() * 6, 1, r() < 0.5 ? FLARE[1] : FLARE[0]);
            ctx.restore();
        }
    },
};
const rib = (ctx, x, top, bot, bow, th, seed, lod) => {
    const r = rng(seed);
    const n = 10;
    const pt = (k, off) => {
        const u = k / n;
        const b = sin(u * PI);
        return [x + bow * b + th * (0.15 + b * 0.85) * off - u * 4, top + (bot - top) * u];
    };
    const outer = Array.from({ length: n + 1 }, (_, k) => pt(k, 0.5));
    const inner = Array.from({ length: n + 1 }, (_, k) => pt(k, -0.5));
    shape(ctx, [...outer, ...inner.slice().reverse()], SHALE[1]);
    const mid = Array.from({ length: n + 1 }, (_, k) => pt(k, -0.1));
    shape(ctx, [...outer, ...mid.slice().reverse()], SHALE[3]);
    if (lod) {
        line(ctx, Array.from({ length: n - 1 }, (_, k) => pt(k + 1, 0.15)), SHALE[4], 1.4);
        line(ctx, inner.slice(1, n), GREEN[0], 0.9);
        return;
    }
    for (const off of [0.32, 0.12, -0.05, 0.42]) {
        const k0 = 1 + floor(r() * 2);
        const k1 = n - 1 - floor(r() * 2);
        line(ctx, Array.from({ length: k1 - k0 + 1 }, (_, k) => pt(k0 + k, off + (r() - 0.5) * 0.06)), r() < 0.3 ? SHALE[5] : r() < 0.6 ? SHALE[4] : SHALE[2], 0.8 + r() * 0.7);
    }
    line(ctx, Array.from({ length: n - 3 }, (_, k) => pt(k + 2, -0.3)), SHALE[0], 1.2);
    line(ctx, inner.slice(0, 5), r() < 0.5 ? GREEN[1] : GREEN[2], 1);
    line(ctx, outer.slice(0, 4), GREEN[0], 0.7);
};
const scree = (ctx, w, y, seed) => {
    const r = rng(seed);
    for (let x = -10 + r() * 4; x < w + 4; x += 9 + r() * 6) {
        const len = 14 + r() * 8;
        const th = 4 + r() * 3;
        const a = -0.6 - r() * 0.3;
        const dx = cos(a) * len;
        const dy = sin(a) * len;
        const by = y - r() * 1.5;
        const tones = r() < 0.5 ? [SCREE[1], SCREE[2]] : [SCREE[2], SCREE[3]];
        const pts = [[x, by], [x + dx, by + dy], [x + dx + th, by + dy + th * 0.3], [x + th, by + th * 0.3]];
        shape(ctx, pts, tones[0], SCREE[0]);
        line(ctx, [[x + 0.6, by - 0.4], [x + dx + 0.6, by + dy - 0.4]], tones[1], 1.2);
    }
};
const rockRibs = {
    id: "rockRibs",
    box: [0, -96, 240, 0],
    draw(ctx, state, _t, { w = 240, h = 96 } = {}) {
        const lod = simple();
        const seed = round(w * 5 + h * 3) + 7600;
        const r = rng(seed);
        ctx.save();
        clipRect(ctx, -2, -h, w + 4, h + 1);
        flat(ctx, 0, -h, w, h, VOID);
        const top = -h + 2;
        const bot = -10;
        const hole = state === 1 ? { cx: w * 0.4, cy: (top + bot) / 2 + 2, rx: min(w * 0.2, 54), ry: (bot - top) * 0.44 } : null;
        const ribs = [];
        for (let x = -8 + r() * 4; x < w + 6; x += 20 + r() * 6)
            ribs.push([x, top + r() * 4, bot + r() * 3, 12 + r() * 6, 18 + r() * 6, seed + round(x)]);
        const oval = hole && Array.from({ length: 20 }, (_, i) => {
            const a = (i / 20) * PI * 2;
            const k = 0.94 + sin(i * 2.7 + seed) * 0.05;
            return [hole.cx + cos(a) * hole.rx * k, hole.cy + sin(a) * hole.ry * k];
        });
        const right = ([x]) => hole && x > hole.cx - hole.rx * 0.1;
        for (const rb of ribs)
            if (!hole || (!right(rb) && rb[0] + rb[3] < hole.cx - hole.rx * 0.7))
                rib(ctx, ...rb, lod);
        if (hole) {
            shape(ctx, oval, "#050403");
            line(ctx, oval.filter(([px, py]) => px < hole.cx && py < hole.cy + hole.ry * 0.5), GREEN[0], 1);
            for (const rb of ribs)
                if (right(rb))
                    rib(ctx, ...rb, lod);
        }
        G.inside(ctx, G.rectRegion(ctx, 0, -h, w, h - 10), () => {
            G.grain(ctx, G.rectRegion(ctx, 0, -h, w, h), seed + 7, 0.55);
            G.dirt(ctx, 0, -h, w, h - 10, seed + 8, 0.3);
        }, hole ? [oval] : []);
        flat(ctx, 0, -10, w, 10, VOID);
        scree(ctx, w, -1, seed + 9);
        ctx.restore();
    },
};
const lavaFall = {
    id: "lavaFall",
    box: [0, -144, 144, 0],
    anim: true,
    draw(ctx, _state, t = 0, { w = 144, h = 144 } = {}) {
        const lod = simple();
        const bands = 6;
        const bh = h / bands;
        const seam = bh * 0.17;
        const body = bh - seam;
        const step = lod ? 2.4 : 1.25;
        ctx.save();
        clipRect(ctx, 0, -h, w, h);
        for (let b = 0; b < bands; b++) {
            const y0 = -h + b * bh + seam;
            flat(ctx, 0, y0, w, body * 0.35, "#3c1a08");
            flat(ctx, 0, y0 + body * 0.35, w, body * 0.3, LAVA[1]);
            flat(ctx, 0, y0 + body * 0.65, w, body * 0.35, LAVA[2]);
            flat(ctx, 0, y0 + body * 0.88, w, body * 0.12, "#a03c10");
            const r = rng(7800 + b * 37);
            for (let x = 0; x < w; x += step) {
                const speed = 3 + r() * 3;
                const ph = r() * body;
                for (let k = 0; k < 2; k++) {
                    const len = 2 + r() * 4;
                    const yy = ((ph + k * body * 0.5 + t * speed) % (body + len)) - len;
                    const ya = max(0, yy);
                    const yb = min(body, yy + len);
                    if (yb <= ya)
                        continue;
                    const u = (ya + yb) / 2 / body;
                    const q = r() + u * 0.6;
                    const c = q > 1.42 ? LAVA[5] : q > 1 ? LAVA[4] : q > 0.6 ? "#9c2c0c" : "#5c2008";
                    flat(ctx, x, y0 + ya, step * 0.8, yb - ya, c);
                }
            }
            for (let x = 2 + r() * 3; x < w; x += 4 + r() * 4) {
                const lit = 0.5 + 0.5 * sin(t * 3 + x * 0.7 + b);
                flat(ctx, x, y0 + body * 0.25, 0.7, body * 0.75, lit > 0.6 ? LAVA[5] : "#8c7c1c");
            }
            flat(ctx, 0, y0 - seam, w, seam, "#100b07");
            flat(ctx, 0, y0, w, 1, "#24100a");
        }
        G.grain(ctx, G.rectsRegion(ctx, Array.from({ length: bands }, (_, b) => [0, -h + b * bh, w, seam + 1])), 7890, 0.8);
        ctx.restore();
    },
};
for (const asset of [caveBackdrop, farStalagmites, caveRock, rockRibs, lavaFall]) define(asset);
})();
