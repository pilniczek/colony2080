import os, sys, tempfile
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
WORK = os.path.join(tempfile.gettempdir(), 'c28-enemies')
import sys, numpy as np, cv2
L = os.path.join(ROOT, 'docs/research/gamedata/png/lev1/')
bg = cv2.imread(L + "f000.png")
print(bg.shape)
nz = np.where(bg.sum(2).max(1) > 0)[0]; print("bg rows", nz.min(), nz.max())
nzc = np.where(bg.sum(2).max(0) > 0)[0]; print("bg cols", nzc.min(), nzc.max())
for f in sys.argv[1:]:
    im = cv2.imread(f)
    pf = im[24:193, 15:305].astype(np.float32)
    big = np.concatenate([bg, bg, bg], axis=1).astype(np.float32)
    r = cv2.matchTemplate(big, pf, cv2.TM_SQDIFF)
    _, _, mi, _ = cv2.minMaxLoc(r)
    x, y = mi
    B = big[y:y + 169, x:x + 290]
    d = np.abs(B - pf).sum(2)
    print(f, "bg offset", x % 320, y, "frac matching bg", (d < 40).mean())
    cv2.imwrite(f.replace(".png", "_bgmask.png").replace("/a/", "/"), ((d >= 40) * 255).astype(np.uint8))
