import os, sys, tempfile
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
WORK = os.path.join(tempfile.gettempdir(), 'c28-enemies')
import sys, numpy as np, cv2
sys.argv = [sys.argv[0], os.path.join(ROOT, 'docs/research/gamedata/png/maps'), os.path.join(ROOT, 'docs/research/gamedata/png/lev1/f000.png'), "x", "x", "15", "24", "305", "193", "1", "1", "a/00081.png"] + sys.argv[1:]
src = open("scripts/locate3.py").read().split("res = {}")[0]
exec(src)
f = sys.argv[12]
im = cv2.imread(f); pf = im[24:193, 15:305].astype(np.float32)
Fm, bgo = tilemask(pf)
print("bg", bgo, "tilefrac", Fm.mean())
cv2.imwrite("dbg_mask.png", (Fm * 255).astype(np.uint8))
M, W3, M2, W = packs[1]
for xy in sys.argv[13:]:
    x, y = map(int, xy.split(","))
    T = pf; m = M[y:y+169, x:x+290]; w = W[y:y+169, x:x+290]
    ssd = ((m - T) ** 2 * w[:, :, None]).sum()
    bc = (Fm * (1 - w)).sum()
    print(xy, "mapfrac", w.mean(), "ssd/px", ssd / T[:, :, 0].size, "pen/px", K * bc / T[:, :, 0].size, "ssd per tile px", ssd / max(1, w.sum()))
if len(sys.argv) > 13 and sys.argv[13] == "local":
    pass
