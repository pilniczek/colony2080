import sys, json
import numpy as np, cv2

model_path, ref_path, out_path = sys.argv[1:4]
iters = int(sys.argv[4]) if len(sys.argv) > 4 else 6
UP = 2

model = json.load(open(model_path))
MAT = model["materials"]
ref = cv2.imread(ref_path)
h, w = ref.shape[:2]
H2, W2 = h * UP, w * UP
big = cv2.resize(ref, (W2, H2), interpolation=cv2.INTER_CUBIC)
ms = cv2.pyrMeanShiftFiltering(big, 6, 18)
hsv = cv2.cvtColor(ms, cv2.COLOR_BGR2HSV).astype(np.int32)
Hh, S, V = hsv[..., 0] * 2, hsv[..., 1], hsv[..., 2]
b, g, r = [ms[..., i].astype(np.int32) for i in range(3)]
armor = (((Hh <= 45) | (Hh >= 340)) & (S > 80) & (V > 45)) | ((r > 170) & (r > g + 25) & (g >= b - 10) & (S > 40))
badge = (Hh > 40) & (Hh < 75) & (S > 120) & (V > 120)
visor = V < 38
sky = (Hh > 185) & (Hh < 235) & (S > 25) & (V > 120)
neutral = (S < 70) & (V > 150)
metal = ~(armor | badge) & ~sky
mats = {"armor": armor | badge, "badge": badge, "metal": metal, "visor": visor | metal}

def chaikin(pts, n):
    for _ in range(n):
        a = pts
        c = np.roll(pts, -1, axis=0)
        pts = np.empty((len(a) * 2, 2))
        pts[0::2] = 0.75 * a + 0.25 * c
        pts[1::2] = 0.25 * a + 0.75 * c
    return pts

def expand(s, ctrl):
    pts = np.array(ctrl, float)
    if s.get("half"):
        ax = s["axis"]
        mirror = pts[::-1].copy()
        mirror[:, 0] = 2 * ax - mirror[:, 0]
        pts = np.vstack([pts, mirror])
    return chaikin(pts, 3) if s.get("round") else pts

def raster(pts):
    m = np.zeros((H2, W2), np.uint8)
    cv2.fillPoly(m, [np.round(pts * UP * 8).astype(np.int32)], 1, shift=3)
    return m.astype(bool)

parts = model["shapes"]
init = [raster(expand(s, s["points"])) for s in parts]
union = np.zeros((h, w), np.uint8)
for m0 in init:
    union |= cv2.resize(m0.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST)
gc = np.full((h, w), cv2.GC_BGD, np.uint8)
gc[cv2.dilate(union, np.ones((25, 25), np.uint8)) > 0] = cv2.GC_PR_BGD
gc[union > 0] = cv2.GC_PR_FGD
gc[cv2.erode(union, np.ones((11, 11), np.uint8)) > 0] = cv2.GC_FGD
bgm, fgm = np.zeros((1, 65)), np.zeros((1, 65))
cv2.grabCut(ref, gc, None, bgm, fgm, 6, cv2.GC_INIT_WITH_MASK)
robot = cv2.resize(((gc == 1) | (gc == 3)).astype(np.uint8), (W2, H2), interpolation=cv2.INTER_NEAREST).astype(bool)
cv2.imwrite(out_path.replace(".json", "_robot.png"), cv2.resize(robot.astype(np.uint8) * 255, (w, h)))
for k in mats:
    mats[k] = mats[k] & robot
neutral &= robot
dist = [cv2.distanceTransform((~m).astype(np.uint8), cv2.DIST_L2, 5) for m in init]
reach = 10 * UP
best = np.full((H2, W2), np.inf)
assign = np.full((H2, W2), -1, np.int32)
for i, s in enumerate(parts):
    want = mats[MAT[s["cls"]]]
    ok = (want & (dist[i] <= reach)) | (neutral & init[i])
    d = dist[i] - init[i] * 0.5 - i * 1e-4
    better = ok & (d < best)
    best[better] = d[better]
    assign[better] = i
targets = [cv2.morphologyEx((assign == i).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)).astype(bool) for i in range(len(parts))]

def iou(m, t):
    u = (m | t).sum()
    return (m & t).sum() / u if u else 0

pair_of = {}
for i, s in enumerate(parts):
    if s.get("mirror_of"):
        j = next(k for k, p in enumerate(parts) if p["id"] == s["mirror_of"])
        pair_of[i] = j

def mirrored(s_src, s_dst, ctrl):
    pts = np.array(ctrl, float)
    ax = s_dst.get("pair_axis", model.get("axis", w / 2))
    pts[:, 0] = 2 * ax - pts[:, 0]
    off = np.array(s_dst.get("offset", [0, 0]), float)
    return (pts + off).tolist()

def score(i):
    s = parts[i]
    val = iou(raster(expand(s, s["points"])), targets[i])
    for k, j in pair_of.items():
        if j == i:
            d = parts[k]
            d["points"] = mirrored(s, d, s["points"])
            val += iou(raster(expand(d, d["points"])), targets[k])
    return val

steps = [4, 2, 1, 0.5]
for it in range(iters):
    total = 0
    for i, s in enumerate(parts):
        if i in pair_of or (model.get("snap_only") and not s.get("snap")):
            continue
        cur = score(i)
        for st in steps:
            for v in range(len(s["points"])):
                for dx, dy in ((st, 0), (-st, 0), (0, st), (0, -st)):
                    old = list(s["points"][v])
                    s["points"][v] = [old[0] + dx, old[1] + dy]
                    sc = score(i)
                    if sc > cur + 1e-5:
                        cur = sc
                    else:
                        s["points"][v] = old
        for k, j in pair_of.items():
            if j == i:
                d = parts[k]
                base = d.get("offset", [0, 0])
                for st in steps:
                    for dx, dy in ((st, 0), (-st, 0), (0, st), (0, -st)):
                        d["offset"] = [base[0] + dx, base[1] + dy]
                        d["points"] = mirrored(s, d, s["points"])
                        sc = iou(raster(expand(d, d["points"])), targets[k])
                        prev_d = parts[k].copy()
                        d["offset"] = base
                        d["points"] = mirrored(s, d, s["points"])
                        sc0 = iou(raster(expand(d, d["points"])), targets[k])
                        if sc > sc0 + 1e-5:
                            base = [base[0] + dx, base[1] + dy]
                            d["offset"] = base
                            d["points"] = mirrored(s, d, s["points"])
        total += cur
    print(f"iter {it}: mean part score {total / len(parts):.3f}", flush=True)

for s in parts:
    s["points"] = [[round(x, 1), round(y, 1)] for x, y in s["points"]]
model["shapes"] = parts
json.dump(model, open(out_path, "w"), indent=1)
rep = {s["id"]: round(iou(raster(expand(s, s["points"])), targets[i]), 3) for i, s in enumerate(parts)}
print(json.dumps(rep))
vis = np.zeros((H2, W2, 3), np.uint8)
for i, s in enumerate(parts):
    m = raster(expand(s, s["points"]))
    vis[targets[i] & ~m] = (255, 0, 255)
    vis[m & ~targets[i]] = (0, 0, 255)
    vis[m & targets[i]] = (60, 170, 60)
cv2.imwrite(out_path.replace(".json", "_fit.png"), cv2.resize(vis, (w, h), interpolation=cv2.INTER_AREA))
