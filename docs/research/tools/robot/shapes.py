import sys, json
import numpy as np, cv2

model_path, ref_path, out_path = sys.argv[1:4]
eps = float(sys.argv[4]) if len(sys.argv) > 4 else 1.2
UP = 2
MAT = {"o": "armor", "ol": "armor", "y": "badge", "yb": "badge", "yl": "armor", "ys": "armor",
       "g": "metal", "gl": "metal", "gs": "metal", "t": "metal", "tg": "metal", "m": "metal", "k": "visor", "r": "visor"}

model = json.load(open(model_path))
MAT.update(model.get("materials", {}))
ref = cv2.imread(ref_path)
h, w = ref.shape[:2]
parts = [s for s in model.get("parts", model["shapes"]) if not s.get("part") and not s["id"].startswith("d_")]

big = cv2.resize(ref, (w * UP, h * UP), interpolation=cv2.INTER_CUBIC)
ms = cv2.pyrMeanShiftFiltering(big, 6, 18)
hsv = cv2.cvtColor(ms, cv2.COLOR_BGR2HSV).astype(np.int32)
H, S, V = hsv[..., 0] * 2, hsv[..., 1], hsv[..., 2]
b, g, r = [ms[..., i].astype(np.int32) for i in range(3)]
armor = (((H <= 45) | (H >= 340)) & (S > 80) & (V > 70)) | ((r > 170) & (r > g + 25) & (g >= b - 10) & (S > 40))
badge = (H > 40) & (H < 75) & (S > 120) & (V > 120)
visor = (V < 38)
metal = ~(armor | badge) & ~visor
neutral = (S < 70) & (V > 150)
mat = {"armor": armor, "badge": badge, "visor": visor, "metal": metal | visor}

poly_masks = []
for s in parts:
    m = np.zeros((h * UP, w * UP), np.uint8)
    cv2.fillPoly(m, [(np.array(s["points"]) * UP).astype(np.int32)], 1)
    poly_masks.append(m)
union = np.clip(sum(poly_masks), 0, 1).astype(np.uint8)
if model.get("silhouette") == "polygons":
    robot = union
else:
    small = cv2.resize(union, (w, h), interpolation=cv2.INTER_NEAREST)
    gc = np.full((h, w), cv2.GC_BGD, np.uint8)
    gc[cv2.dilate(small, np.ones((25, 25), np.uint8)) > 0] = cv2.GC_PR_BGD
    gc[small > 0] = cv2.GC_PR_FGD
    gc[cv2.erode(small, np.ones((13, 13), np.uint8)) > 0] = cv2.GC_FGD
    for ex in model.get("exclude", []):
        cv2.fillPoly(gc, [np.array(ex, np.int32)], cv2.GC_BGD)
    bgm, fgm = np.zeros((1, 65)), np.zeros((1, 65))
    cv2.grabCut(ref, gc, None, bgm, fgm, 6, cv2.GC_INIT_WITH_MASK)
    robot = cv2.resize(((gc == 1) | (gc == 3)).astype(np.uint8), (w * UP, h * UP), interpolation=cv2.INTER_NEAREST)
if model.get("silhouette") == "materials":
    near = cv2.dilate(union, np.ones((9, 9), np.uint8)) > 0
    robot = ((armor | badge | visor | ((V < 120) & ~((H > 185) & (H < 235) & (S > 40)))) & near) | (neutral & (union > 0))
    robot = robot.astype(np.uint8)
robot = cv2.morphologyEx(robot, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))

dist = np.stack([cv2.distanceTransform((1 - m).astype(np.uint8), cv2.DIST_L2, 5) for m in poly_masks])
reach = 14 * UP
assign = np.full((h * UP, w * UP), -1, np.int32)
best = np.full((h * UP, w * UP), np.inf)
for i, s in enumerate(parts):
    want = mat[MAT.get(s["cls"], "armor")]
    ok = (robot > 0) & ((want & (dist[i] <= reach)) | (neutral & (poly_masks[i] > 0)))
    d = dist[i] - (poly_masks[i] * 0.5) + np.arange(len(parts))[i] * 1e-3 * 0
    better = ok & (d < best)
    best[better] = d[better]
    assign[better] = i
rest = (robot > 0) & (assign < 0)
if rest.any():
    near = np.argmin(dist, axis=0)
    assign[rest] = near[rest]

def chaikin(pts, n=1):
    for _ in range(n):
        q = []
        for i in range(len(pts)):
            a, c = pts[i], pts[(i + 1) % len(pts)]
            q += [0.75 * a + 0.25 * c, 0.25 * a + 0.75 * c]
        pts = np.array(q)
    return pts

palette = model["palette"]
out = []
rendered = {k: np.zeros((h * UP, w * UP), np.uint8) for k in ("armor", "metal", "badge", "visor")}
order = sorted(range(len(parts)), key=lambda i: parts[i].get("z", i))
for i in order:
    s = parts[i]
    region = (assign == i).astype(np.uint8)
    region = cv2.morphologyEx(region, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    region = cv2.morphologyEx(region, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    cnts, _ = cv2.findContours(region, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    for n, c in enumerate(sorted(cnts, key=cv2.contourArea, reverse=True)):
        if cv2.contourArea(c) < 120 * UP:
            continue
        budget = s.get("vertices", 10)
        e = 0.5 * UP
        ap = cv2.approxPolyDP(c, e, True)
        while len(ap) > budget and e < 40 * UP:
            e *= 1.15
            ap = cv2.approxPolyDP(c, e, True)
        ap = ap.reshape(-1, 2).astype(float)
        if len(ap) < 3:
            continue
        pts = chaikin(ap, 3) if s.get("round") else ap
        cv2.fillPoly(rendered[MAT.get(s["cls"], "armor")], [pts.astype(np.int32)], 1)
        out.append({"id": f'{s["id"]}' + (f"_{n}" if n else ""), "cls": s["cls"], "part": s["id"], "points": np.round(pts / UP, 1).tolist()})

inside = robot > 0
scores = {}
for k in ("armor", "metal", "badge"):
    ref_m = mat[k] & inside
    vec_m = rendered[k] > 0
    inter, uni = (ref_m & vec_m).sum(), (ref_m | vec_m).sum()
    scores[k] = round(inter / uni, 3) if uni else None
vec_all = sum(rendered.values()) > 0
scores["silhouette"] = round((inside & vec_all).sum() / (inside | vec_all).sum(), 3)

res = {k: v for k, v in model.items() if k not in ("shapes",)}
res["parts"] = parts
res["shapes"] = out
res["iou"] = scores
json.dump(res, open(out_path, "w"))
rng = np.random.RandomState(3); cols = rng.randint(40, 255, (len(parts) + 1, 3)); vis = cols[assign + 1]; vis[assign < 0] = 0
cv2.imwrite(out_path.replace(".json", "_assign.png"), cv2.resize(vis.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST))
cv2.imwrite(out_path.replace(".json", "_materials.png"), np.dstack([metal * 255, armor * 200, badge * 255]).astype(np.uint8))
print(len(parts), "parts ->", len(out), "shapes", scores)
