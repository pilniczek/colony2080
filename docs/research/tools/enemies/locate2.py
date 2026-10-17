import sys, glob, json, os
import numpy as np, cv2
mapdir, framedir, out = sys.argv[1:4]
x0, y0, x1, y1 = map(int, sys.argv[4:8])
scale = float(sys.argv[8]); step = int(sys.argv[9]); ox, oy = (int(sys.argv[10]), int(sys.argv[11])) if len(sys.argv) > 11 else (0, 0)

def prep(m):
    m = m.astype(np.float32)
    w = (m.sum(axis=2) > 30).astype(np.float32)
    w3 = np.repeat(w[:, :, None], 3, axis=2)
    return m * w3, w3, (m * m * w3)

maps = {v: cv2.imread(f"{mapdir}/map_M1{v}.png") for v in range(1, 7)}
half = {v: prep(cv2.resize(m, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)) for v, m in maps.items()}
full = {v: prep(m) for v, m in maps.items()}

def score(pack, T, region=None):
    M, W, M2 = pack
    if region:
        xa, ya, xb, yb = region
        M, W, M2 = M[ya:yb, xa:xb], W[ya:yb, xa:xb], M2[ya:yb, xa:xb]
    ones = np.ones_like(T)
    mt = cv2.matchTemplate(M, T, cv2.TM_CCORR)
    wt2 = cv2.matchTemplate(W, T * T, cv2.TM_CCORR)
    m2 = cv2.matchTemplate(M2, ones, cv2.TM_CCORR)
    n = cv2.matchTemplate(W, ones, cv2.TM_CCORR)
    ssd = (m2 - 2 * mt + wt2) / np.maximum(n, 1)
    frac = n / ones.size
    ssd[frac < 0.12] = 1e9
    return ssd, frac

res = {}
prev = None
files = sorted(glob.glob(framedir + "/*.png"))[::step]
for f in files:
    im = cv2.imread(f)
    pf = im[y0:y1, x0:x1]
    if scale != 1:
        pf = cv2.resize(pf, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    pf = pf.astype(np.float32)
    if pf.std() < 10:
        continue
    th = cv2.resize(pf, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
    ssd, frac = score(half[1], th)
    _, _, mi, _ = cv2.minMaxLoc(ssd)
    bx, by = mi[0] * 2, mi[1] * 2
    coarse = float(ssd[mi[1], mi[0]])
    best = None
    for v in range(1, 7):
        h, w = pf.shape[:2]
        xa, ya = max(0, bx - 6), max(0, by - 6)
        reg = (xa, ya, min(3840, xa + w + 12), min(1920, ya + h + 12))
        s2, fr2 = score(full[v], pf, reg)
        _, _, l2, _ = cv2.minMaxLoc(s2)
        val = float(s2[l2[1], l2[0]])
        if best is None or val < best[0] - 5:
            best = (val, xa + l2[0], ya + l2[1], v, float(fr2[l2[1], l2[0]]))
    k = os.path.basename(f)
    res[k] = [round(best[0], 1), best[1] - ox, best[2] - oy, best[3], round(best[4], 2)]
    print(k, res[k], flush=True)
json.dump(res, open(out, "w"))
