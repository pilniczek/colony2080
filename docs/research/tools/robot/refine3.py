import sys, json
import numpy as np, cv2
from sklearn.cluster import KMeans

model_path, ref_path, out_path = sys.argv[1:4]
n_colours = int(sys.argv[4]) if len(sys.argv) > 4 else 16
sr = float(sys.argv[5]) if len(sys.argv) > 5 else 18
min_area = float(sys.argv[6]) if len(sys.argv) > 6 else 60
UP = 2

model = json.load(open(model_path))
ref = cv2.imread(ref_path)
h, w = ref.shape[:2]
parts = [s for s in model["shapes"] if not s.get("part") and not s["id"].startswith("d_")]

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
bg, fg = np.zeros((1, 65)), np.zeros((1, 65))
if model.get("silhouette") != "polygons":
    cv2.grabCut(ref, gc, None, bg, fg, 6, cv2.GC_INIT_WITH_MASK)
robot = union.copy() if model.get("silhouette") == "polygons" else ((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)).astype(np.uint8)
robot = cv2.morphologyEx(robot, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
lab_map = np.where(robot > 0, label, 0)
for _ in range(40):
    fill = (robot > 0) & (lab_map == 0)
    if not fill.any():
        break
    grown = cv2.dilate(lab_map.astype(np.float32), np.ones((3, 3), np.uint8)).astype(np.int32)
    lab_map[fill] = grown[fill]

big = cv2.resize(ref, (w * UP, h * UP), interpolation=cv2.INTER_CUBIC)
ms = cv2.pyrMeanShiftFiltering(big, 8, sr)
pmap = cv2.resize(lab_map.astype(np.uint16), (w * UP, h * UP), interpolation=cv2.INTER_NEAREST).astype(np.int32)
pmap = cv2.medianBlur(pmap.astype(np.uint8), 5).astype(np.int32)
mask = pmap > 0
labc = cv2.cvtColor(ms, cv2.COLOR_BGR2LAB).astype(np.float32)
km = KMeans(n_clusters=n_colours, n_init=4, random_state=0).fit(labc[mask][::3])
cmap = np.full(mask.shape, 255, np.uint8)
cmap[mask] = km.predict(labc[mask]).astype(np.uint8)
cmap = cv2.medianBlur(cmap, 7)
centres = km.cluster_centers_
sky = [] if model.get("silhouette") == "polygons" else [c for c in range(n_colours) if centres[c][2] < 126 and centres[c][0] > 140]
border = mask & ~(cv2.erode(mask.astype(np.uint8), np.ones((11, 11), np.uint8)) > 0)
drop = border & np.isin(cmap, sky)
cmap[drop] = 255
mask = mask & ~drop
pmap[~mask] = 0
palette = []
for c in range(n_colours):
    sel = (cmap == c) & mask
    b, g, r = np.median(big[sel], axis=0) if sel.any() else (255, 0, 255)
    palette.append("#%02x%02x%02x" % (int(r), int(g), int(b)))

def chaikin(pts, n=2):
    for _ in range(n):
        q = []
        for i in range(len(pts)):
            a, b = pts[i], pts[(i + 1) % len(pts)]
            q.append(0.75 * a + 0.25 * b)
            q.append(0.25 * a + 0.75 * b)
        pts = np.array(q)
    return pts

out = []
under = (mask.astype(np.uint8)) * 255
for n, cn in enumerate(cv2.findContours(under, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)[0]):
    if cv2.contourArea(cn) < min_area:
        continue
    ap = cv2.approxPolyDP(cn, 1.5, True).reshape(-1, 2).astype(float)
    out.append({"id": f"underlay{n}", "cls": "k", "part": "underlay", "role": "underlay", "color": "#141b1d", "points": np.round(chaikin(ap, 2) / UP, 1).tolist()})
for i, s in enumerate(parts, 1):
    region = pmap == i
    if region.sum() < 40:
        continue
    pieces = []
    for c in range(n_colours):
        b = ((cmap == c) & region).astype(np.uint8) * 255
        b = cv2.morphologyEx(b, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        cnts, _ = cv2.findContours(b, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        for cn in cnts:
            a = cv2.contourArea(cn)
            if a < min_area:
                continue
            ap = cv2.approxPolyDP(cn, 1.5, True).reshape(-1, 2).astype(float)
            if len(ap) < 3:
                continue
            sm = chaikin(ap, 2) / UP
            pieces.append((a, {"cls": s["cls"], "part": s["id"], "color": palette[c], "points": np.round(sm, 1).tolist()}))
    region_u8 = region.astype(np.uint8) * 255
    cnts, _ = cv2.findContours(region_u8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    sel = region & (cmap != 255)
    vals, cnt = np.unique(cmap[sel], return_counts=True) if sel.any() else ([0], [1])
    dom = palette[int(vals[np.argmax(cnt)])]
    for n, cn in enumerate(cnts):
        if cv2.contourArea(cn) < min_area:
            continue
        ap = cv2.approxPolyDP(cn, 1.5, True).reshape(-1, 2).astype(float)
        out.append({"id": f'{s["id"]}_base{n}', "cls": s["cls"], "part": s["id"], "role": "base", "color": dom, "points": np.round(chaikin(ap, 2) / UP, 1).tolist()})
    for n, (_, p) in enumerate(sorted(pieces, key=lambda t: -t[0])):
        p["id"] = f'{s["id"]}_{n}'
        out.append(p)

res = {k: v for k, v in model.items() if k != "shapes"}
res["parts"] = parts
res["colours"] = palette
res["shapes"] = out
json.dump(res, open(out_path, "w"))
print(len(parts), "parts ->", len(out), "shapes")
