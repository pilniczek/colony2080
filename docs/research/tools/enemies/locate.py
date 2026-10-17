import sys, glob, json, os
import numpy as np, cv2
mapdir, framedir, out, x0, y0, x1, y1, scale = sys.argv[1], sys.argv[2], sys.argv[3], *map(int, sys.argv[4:8]), float(sys.argv[8])
maps = {}
for v in range(1, 7):
    m = cv2.imread(f"{mapdir}/map_M1{v}.png", cv2.IMREAD_GRAYSCALE)
    maps[v] = m
small = {v: cv2.resize(m, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA) for v, m in maps.items()}
res = {}
files = sorted(glob.glob(framedir + "/*.png"))
step = int(sys.argv[9]) if len(sys.argv) > 9 else 1
for f in files[::step]:
    im = cv2.imread(f, cv2.IMREAD_GRAYSCALE)
    pf = im[y0:y1, x0:x1]
    if scale != 1:
        pf = cv2.resize(pf, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    if pf.std() < 8:
        continue
    t = cv2.resize(pf, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
    m = maps[1]
    r = cv2.matchTemplate(small[1], t, cv2.TM_CCOEFF_NORMED)
    _, sc, _, loc = cv2.minMaxLoc(r)
    bx, by = loc[0] * 2, loc[1] * 2
    best = (sc, bx, by, 1)
    for v in range(1, 7):
        mm = maps[v]
        xa, ya = max(0, bx - 6), max(0, by - 6)
        sub = mm[ya:ya + pf.shape[0] + 12, xa:xa + pf.shape[1] + 12]
        if sub.shape[0] < pf.shape[0] or sub.shape[1] < pf.shape[1]:
            continue
        r2 = cv2.matchTemplate(sub, pf, cv2.TM_CCOEFF_NORMED)
        _, s2, _, l2 = cv2.minMaxLoc(r2)
        if v == 1 or s2 > best[0] + 0.01:
            if v == 1:
                best = (s2, xa + l2[0], ya + l2[1], 1)
            else:
                best = (s2, xa + l2[0], ya + l2[1], v)
    res[os.path.basename(f)] = [round(float(best[0]), 3), int(best[1]), int(best[2]), best[3]]
    print(os.path.basename(f), res[os.path.basename(f)], flush=True)
json.dump(res, open(out, "w"))
