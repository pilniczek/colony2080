import os, sys, tempfile
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
WORK = os.path.join(tempfile.gettempdir(), 'c28-enemies')
import sys, json
import numpy as np, cv2
sys_args = sys.argv[1:]
M = os.path.join(ROOT, 'docs/research/gamedata/png')
sys.argv = ["x", M + "/maps", M + "/lev1/f000.png", "x", "x", "a/00081.png", "1", "6000"]
exec(open("scripts/locate4.py").read().split("res = {}")[0])
smjson, framedir = sys_args[0], sys_args[1]
sm = json.load(open(smjson))
for spec in sys_args[2:]:
    frs, reg = spec.split("@")
    xa, ya, xb, yb = map(int, reg.split(","))
    a, b = map(int, frs.split("-")) if "-" in frs else (int(frs), int(frs))
    for fr in range(a, b + 1, 2 if framedir.endswith("a") else 1):
        im = cv2.imread(f"{framedir}/{fr:05d}.png")
        if im is None: continue
        Fm = tilemask(im[24:193, 15:305].astype(np.float32))
        pf = cv2.cvtColor(im[24:193, 15:305], cv2.COLOR_BGR2GRAY).astype(np.float32)
        best = None
        for v in range(1, 7):
            s2 = score(packs[v], pf, Fm, (xa, ya, xb + 290, yb + 169))
            l2 = np.unravel_index(np.argmin(s2), s2.shape)
            if best is None or s2[l2] < best[0] - 15:
                best = (float(s2[l2]), xa + int(l2[1]), ya + int(l2[0]), v)
        sm[str(fr)] = {"x": best[1], "y": best[2], "v": best[3], "score": round(best[0], 1), "rank": -1, "tf": 0}
        print(fr, best)
json.dump(sm, open(smjson, "w"))
