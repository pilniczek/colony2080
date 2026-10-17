import sys, json
import numpy as np, cv2
from sklearn.cluster import KMeans

model_path, ref_path, out_path = sys.argv[1:4]
k_default = int(sys.argv[4]) if len(sys.argv) > 4 else 4
eps = float(sys.argv[5]) if len(sys.argv) > 5 else 1.6
min_area = float(sys.argv[6]) if len(sys.argv) > 6 else 30

model = json.load(open(model_path))
ref = cv2.imread(ref_path)
h, w = ref.shape[:2]
lab = cv2.cvtColor(ref, cv2.COLOR_BGR2LAB).astype(np.float32)
parts = [s for s in model["shapes"] if not s.get("part")]

masks = []
for s in parts:
    m = np.zeros((h, w), np.uint8)
    cv2.fillPoly(m, [np.array(s["points"], np.int32)], 255)
    masks.append(m)
visible = []
for i, m in enumerate(masks):
    v = m.copy()
    for later in masks[i + 1:]:
        v[later > 0] = 0
    visible.append(v)

def hexc(bgr):
    b, g, r = [int(round(x)) for x in bgr]
    return "#%02x%02x%02x" % (r, g, b)

out = []
for s, m, v in zip(parts, masks, visible):
    k = s.get("tones", k_default)
    ys, xs = np.nonzero(v)
    base = dict(s)
    base.pop("color", None)
    if len(xs) < k * 20:
        if len(xs):
            base["color"] = hexc(np.median(ref[ys, xs], axis=0))
        out.append(base)
        continue
    km = KMeans(n_clusters=k, n_init=4, random_state=0).fit(lab[ys, xs])
    labels = np.full((h, w), 255, np.uint8)
    labels[ys, xs] = km.labels_.astype(np.uint8)
    labels = cv2.medianBlur(labels, 5)
    counts = np.bincount(km.labels_, minlength=k)
    order = np.argsort(-counts)
    colours = {}
    for l in range(k):
        sel = (labels == l) & (v > 0)
        colours[l] = hexc(np.median(ref[sel], axis=0)) if sel.any() else None
    base["color"] = colours[order[0]]
    out.append(base)
    for rank, l in enumerate(order[1:], 1):
        if colours[l] is None:
            continue
        bin_ = (((labels == l) & (m > 0)).astype(np.uint8)) * 255
        bin_ = cv2.morphologyEx(bin_, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        cnts, _ = cv2.findContours(bin_, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        n = 0
        for c in cnts:
            if cv2.contourArea(c) < min_area:
                continue
            ap = cv2.approxPolyDP(c, eps, True).reshape(-1, 2)
            if len(ap) < 3:
                continue
            out.append({"id": f'{s["id"]}_t{rank}_{n}', "cls": s["cls"], "part": s["id"], "color": colours[l], "points": ap.tolist()})
            n += 1

model["shapes"] = out
json.dump(model, open(out_path, "w"))
print(len(parts), "parts ->", len(out), "shapes")
