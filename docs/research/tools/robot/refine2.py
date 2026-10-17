import sys, json
import numpy as np, cv2
from sklearn.cluster import KMeans

model_path, ref_path, out_path = sys.argv[1:4]
k_default = int(sys.argv[4]) if len(sys.argv) > 4 else 4
eps = float(sys.argv[5]) if len(sys.argv) > 5 else 1.4
min_area = float(sys.argv[6]) if len(sys.argv) > 6 else 24

model = json.load(open(model_path))
ref = cv2.imread(ref_path)
h, w = ref.shape[:2]
lab = cv2.cvtColor(ref, cv2.COLOR_BGR2LAB).astype(np.float32)
parts = [s for s in model["shapes"] if not s.get("part")]

label = np.zeros((h, w), np.int32)
for i, s in enumerate(parts, 1):
    cv2.fillPoly(label, [np.array(s["points"], np.int32)], i)
union = (label > 0).astype(np.uint8)

gc = np.full((h, w), cv2.GC_BGD, np.uint8)
gc[cv2.dilate(union, np.ones((25, 25), np.uint8)) > 0] = cv2.GC_PR_BGD
gc[union > 0] = cv2.GC_PR_FGD
gc[cv2.erode(union, np.ones((13, 13), np.uint8)) > 0] = cv2.GC_FGD
for s in model.get("exclude", []):
    cv2.fillPoly(gc, [np.array(s, np.int32)], cv2.GC_BGD)
bg, fg = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
cv2.grabCut(ref, gc, None, bg, fg, 6, cv2.GC_INIT_WITH_MASK)
robot = ((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)).astype(np.uint8)
robot = cv2.morphologyEx(robot, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
cv2.imwrite(out_path.replace(".json", "_mask.png"), robot * 255)

lab_map = np.where(robot > 0, label, 0)
for _ in range(40):
    if not ((robot > 0) & (lab_map == 0)).any():
        break
    grown = cv2.dilate(lab_map.astype(np.float32), np.ones((3, 3), np.uint8)).astype(np.int32)
    fill = (robot > 0) & (lab_map == 0)
    lab_map[fill] = grown[fill]

def hexc(bgr):
    b, g, r = [int(round(x)) for x in bgr]
    return "#%02x%02x%02x" % (r, g, b)

def polys(binary, prefix, extra):
    cnts, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    res = []
    for n, c in enumerate(sorted(cnts, key=cv2.contourArea, reverse=True)):
        if cv2.contourArea(c) < min_area:
            continue
        ap = cv2.approxPolyDP(c, eps, True).reshape(-1, 2)
        if len(ap) >= 3:
            res.append({"id": f"{prefix}_{n}", "points": ap.tolist(), **extra})
    return res

out = []
for i, s in enumerate(parts, 1):
    region = (lab_map == i).astype(np.uint8)
    ys, xs = np.nonzero(region)
    if len(xs) < 20:
        continue
    base_col = hexc(np.median(ref[ys, xs], axis=0))
    k = min(s.get("tones", k_default), max(1, len(xs) // 60))
    if k > 1:
        km = KMeans(n_clusters=k, n_init=4, random_state=0).fit(lab[ys, xs])
        lmap = np.full((h, w), 255, np.uint8)
        lmap[ys, xs] = km.labels_.astype(np.uint8)
        lmap = cv2.medianBlur(lmap, int(sys.argv[7]) if len(sys.argv) > 7 else 5)
        order = np.argsort(-np.bincount(km.labels_, minlength=k))
        dom = (lmap == order[0]) & (region > 0)
        if dom.any():
            base_col = hexc(np.median(ref[dom], axis=0))
    out += polys(region * 255, s["id"], {"cls": s["cls"], "part": s["id"], "role": "base", "color": base_col})
    if k > 1:
        for rank, l in enumerate(order[1:], 1):
            sel = ((lmap == l) & (region > 0)).astype(np.uint8)
            if not sel.any():
                continue
            col = hexc(np.median(ref[sel > 0], axis=0))
            sel = cv2.morphologyEx(sel * 255, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
            out += polys(sel, f'{s["id"]}_t{rank}', {"cls": s["cls"], "part": s["id"], "role": f"tone{rank}", "color": col})

res = {k: v for k, v in model.items() if k != "shapes"}
res["parts"] = [{k: v for k, v in s.items()} for s in parts]
res["shapes"] = out
json.dump(res, open(out_path, "w"))
print(len(parts), "parts ->", len(out), "shapes; robot px", int(robot.sum()))
