import sys, json
import numpy as np, cv2
mapdir, framedir, smjson, out = sys.argv[1:5]
t0, fps = float(sys.argv[5]), float(sys.argv[6])
maps = {v: cv2.imread(f"{mapdir}/map_M1{v}.png") for v in range(1, 7)}
sm = json.load(open(smjson))
res = []
for fr, r in sorted(sm.items(), key=lambda q: int(q[0])):
    if r["score"] > 1600: continue
    im = cv2.imread(f"{framedir}/{int(fr):05d}.png")
    pf = im[24:193, 15:305].astype(np.int32)
    mc = maps[r["v"]][r["y"]:r["y"] + 169, r["x"]:r["x"] + 290].astype(np.int32)
    if mc.shape != pf.shape: continue
    mx, mn = pf.max(2), pf.min(2)
    chrome = (mx - mn < 40) & (pf.mean(2) > 105)
    diff = np.abs(pf - mc).sum(2) > 120
    mask = (chrome & diff).astype(np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab, st, cen = cv2.connectedComponentsWithStats(mask)
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if a < 70 or h < 8: continue
        cx, cy = r["x"] + x + w / 2, r["y"] + y + h / 2
        t = t0 + (int(fr) - 1) / fps
        res.append({"frame": int(fr), "t": round(t, 1), "cam": [r["x"], r["y"]], "box": [int(x), int(y), int(w), int(h)], "area": int(a),
                    "cell": [round(cx / 24, 1), round(cy / 24, 1)], "kind": "flyer?" if h < 22 and w > 18 else "droid?"})
json.dump(res, open(out, "w"), indent=0)
for e in res:
    print(e["frame"], f'{int(e["t"]//60)}:{e["t"]%60:04.1f}', e["cell"], e["box"], e["area"], e["kind"])
