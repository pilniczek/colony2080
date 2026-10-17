import sys, glob, json, os
import numpy as np, cv2
mapdir, bgpath, framedir, out = sys.argv[1:5]
x0, y0, x1, y1 = map(int, sys.argv[5:9]); scale = float(sys.argv[9]); step = int(sys.argv[10])
K = 3 * 45.0 ** 2
F = 0.25
bg = cv2.imread(bgpath).astype(np.float32)
bigbg = cv2.GaussianBlur(np.concatenate([bg, bg, bg], axis=1), (5, 5), 0)

def prep(m):
    m = m.astype(np.float32)
    w = (m.sum(axis=2) > 30).astype(np.float32)
    w3 = np.repeat(w[:, :, None], 3, axis=2)
    return m * w3, w3, m * m * w3, w

maps = {v: cv2.imread(f"{mapdir}/map_M1{v}.png") for v in range(1, 7)}
packs = {v: prep(m) for v, m in maps.items()}
small = prep(cv2.resize(maps[1], None, fx=F, fy=F, interpolation=cv2.INTER_AREA))

def tilemask(pf):
    b = cv2.GaussianBlur(pf, (5, 5), 0)
    r = cv2.matchTemplate(bigbg, b, cv2.TM_SQDIFF)
    _, _, mi, _ = cv2.minMaxLoc(r)
    B = bigbg[mi[1]:mi[1] + pf.shape[0], mi[0]:mi[0] + pf.shape[1]]
    d = np.abs(B - b).mean(2)
    fm = (d > 22).astype(np.float32)
    fm = cv2.morphologyEx(fm, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    return fm, (mi[0] % 320, mi[1])

def score(pack, T, Fm, region=None):
    M, W3, M2, W = pack
    if region:
        xa, ya, xb, yb = region
        M, W3, M2, W = M[ya:yb, xa:xb], W3[ya:yb, xa:xb], M2[ya:yb, xa:xb], W[ya:yb, xa:xb]
    ones = np.ones_like(T)
    mt = cv2.matchTemplate(M, T, cv2.TM_CCORR)
    wt2 = cv2.matchTemplate(W3, T * T, cv2.TM_CCORR)
    m2 = cv2.matchTemplate(M2, ones, cv2.TM_CCORR)
    fw = cv2.matchTemplate(W, Fm, cv2.TM_CCORR)
    A = m2 - 2 * mt + wt2
    Bc = Fm.sum() - fw
    return (A + K * Bc) / Fm.size

res = {}
REF = cv2.imread(sys.argv[11])[2:20, 150:200].astype(np.float32)
files = sorted(glob.glob(framedir + "/*.png"))[::step]
for f in files:
    im = cv2.imread(f)
    pf = im[y0:y1, x0:x1]
    if scale != 1:
        pf = cv2.resize(pf, (290, 169), interpolation=cv2.INTER_AREA)
    pf = pf.astype(np.float32)
    if pf.std() < 12:
        continue
    logo = im[2:20, 150:200].astype(np.float32)
    if logo is not None and np.abs(logo - REF).mean() > 25:
        continue
    Fm, bgo = tilemask(pf)
    ts = cv2.resize(pf, None, fx=F, fy=F, interpolation=cv2.INTER_AREA)
    fs = cv2.resize(Fm, (ts.shape[1], ts.shape[0]), interpolation=cv2.INTER_AREA)
    s = score(small, ts, fs)
    cands = []
    for _ in range(6):
        _, _, mi, _ = cv2.minMaxLoc(s)
        cands.append((mi[0] / F, mi[1] / F))
        s[max(0, mi[1] - 5):mi[1] + 6, max(0, mi[0] - 5):mi[0] + 6] = 1e12
    fine = []
    for cx, cy in cands:
        cx, cy = int(cx), int(cy)
        best = None
        for v in range(1, 7):
            xa, ya = max(0, cx - 8), max(0, cy - 8)
            reg = (xa, ya, min(3840, xa + 290 + 16), min(1920, ya + 169 + 16))
            if reg[2] - reg[0] < 290 or reg[3] - reg[1] < 169: continue
            s2 = score(packs[v], pf, Fm, reg)
            _, _, l2, _ = cv2.minMaxLoc(-s2)
            l2 = np.unravel_index(np.argmin(s2), s2.shape)
            val = float(s2[l2])
            if best is None or val < best[0] - 20:
                best = (round(val, 1), xa + int(l2[1]), ya + int(l2[0]), v)
        if best: fine.append(best)
    fine.sort()
    k = os.path.basename(f)
    res[k] = {"cands": fine, "tilefrac": round(float(Fm.mean()), 2), "bg": bgo}
    print(k, fine[:3], res[k]["tilefrac"], flush=True)
json.dump(res, open(out, "w"))
