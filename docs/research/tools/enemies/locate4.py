import sys, glob, json, os
import numpy as np, cv2
mapdir, bgpath, framedir, out, ref = sys.argv[1:6]
step = int(sys.argv[6]); K = float(sys.argv[7]) if len(sys.argv) > 7 else 45.0 ** 2
F = 0.25
bg = cv2.imread(bgpath).astype(np.float32)
bigbg = cv2.GaussianBlur(np.concatenate([bg, bg, bg], axis=1), (5, 5), 0)
REF = cv2.imread(ref)[2:20, 215:240].astype(np.float32)

def prep(m):
    g = cv2.cvtColor(m, cv2.COLOR_BGR2GRAY).astype(np.float32)
    w = (m.astype(np.int32).sum(axis=2) > 30).astype(np.float32)
    return g * w, w, g * g * w

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
    return cv2.morphologyEx(fm, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))

def score(pack, T, Fm, region=None):
    M, W, M2 = pack
    if region:
        xa, ya, xb, yb = region
        M, W, M2 = M[ya:yb, xa:xb], W[ya:yb, xa:xb], M2[ya:yb, xa:xb]
    ones = np.ones_like(T)
    A = cv2.matchTemplate(M2, ones, cv2.TM_CCORR) - 2 * cv2.matchTemplate(M, T, cv2.TM_CCORR) + cv2.matchTemplate(W, T * T, cv2.TM_CCORR)
    Bc = Fm.sum() - cv2.matchTemplate(W, Fm, cv2.TM_CCORR)
    return (A + K * Bc) / T.size

res = {}
for f in sorted(glob.glob(framedir + "/*.png"))[::step]:
    im = cv2.imread(f)
    if np.abs(im[2:20, 215:240].astype(np.float32) - REF).mean() > 25: continue
    pfc = im[24:193, 15:305].astype(np.float32)
    if pfc.std() < 12: continue
    Fm = tilemask(pfc)
    pf = cv2.cvtColor(im[24:193, 15:305], cv2.COLOR_BGR2GRAY).astype(np.float32)
    ts = cv2.resize(pf, None, fx=F, fy=F, interpolation=cv2.INTER_AREA)
    fs = cv2.resize(Fm, (ts.shape[1], ts.shape[0]), interpolation=cv2.INTER_AREA)
    s = score(small, ts, fs)
    cands = []
    for _ in range(8):
        mi = np.unravel_index(np.argmin(s), s.shape)
        cands.append((int(mi[1] / F), int(mi[0] / F)))
        s[max(0, mi[0] - 4):mi[0] + 5, max(0, mi[1] - 4):mi[1] + 5] = 1e12
    fine = []
    for cx, cy in cands:
        best = None
        for v in range(1, 7):
            xa, ya = max(0, cx - 8), max(0, cy - 8)
            xa, ya = min(xa, 3840 - 306), min(ya, 1920 - 185)
            s2 = score(packs[v], pf, Fm, (xa, ya, xa + 306, ya + 185))
            l2 = np.unravel_index(np.argmin(s2), s2.shape)
            val = float(s2[l2])
            if best is None or val < best[0] - 15:
                best = (round(val, 1), xa + int(l2[1]), ya + int(l2[0]), v)
        fine.append(best)
    fine.sort()
    k = os.path.basename(f)
    res[k] = fine
    print(k, fine[:6], round(float(Fm.mean()), 2), flush=True)
json.dump(res, open(out, "w"))
