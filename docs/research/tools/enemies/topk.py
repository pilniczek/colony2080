import sys, glob, json, os
import numpy as np, cv2
mapdir, framedir, out = sys.argv[1:4]
x0, y0, x1, y1 = map(int, sys.argv[4:8]); scale = float(sys.argv[8]); step = int(sys.argv[9]); start = int(sys.argv[10]) if len(sys.argv) > 10 else 0
F = 0.25
def prep(m):
    m = m.astype(np.float32)
    w = (m.sum(axis=2) > 30).astype(np.float32)
    w3 = np.repeat(w[:, :, None], 3, axis=2)
    return m * w3, w3, m * m * w3
mp = cv2.imread(f"{mapdir}/map_M11.png")
pack = prep(cv2.resize(mp, None, fx=F, fy=F, interpolation=cv2.INTER_AREA))
def score(pack, T):
    M, W, M2 = pack
    ones = np.ones_like(T)
    mt = cv2.matchTemplate(M, T, cv2.TM_CCORR)
    wt2 = cv2.matchTemplate(W, T * T, cv2.TM_CCORR)
    m2 = cv2.matchTemplate(M2, ones, cv2.TM_CCORR)
    n = cv2.matchTemplate(W, ones, cv2.TM_CCORR)
    ssd = (m2 - 2 * mt + wt2) / np.maximum(n, 1)
    frac = n / ones.size
    return ssd, frac
res = {}
for f in sorted(glob.glob(framedir + "/*.png"))[start::step]:
    im = cv2.imread(f)
    pf = im[y0:y1, x0:x1]
    if scale != 1:
        pf = cv2.resize(pf, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    if pf.std() < 10:
        continue
    t = cv2.resize(pf, None, fx=F, fy=F, interpolation=cv2.INTER_AREA).astype(np.float32)
    ssd, frac = score(pack, t)
    ssd[frac < 0.12] = 1e9
    cands = []
    s = ssd.copy()
    for _ in range(12):
        _, _, mi, _ = cv2.minMaxLoc(s)
        v = float(s[mi[1], mi[0]])
        if v >= 1e8: break
        cands.append([round(v, 1), int(mi[0] / F), int(mi[1] / F), round(float(frac[mi[1], mi[0]]), 2)])
        s[max(0, mi[1] - 6):mi[1] + 7, max(0, mi[0] - 6):mi[0] + 7] = 1e9
    res[os.path.basename(f)] = cands
json.dump(res, open(out, "w"))
