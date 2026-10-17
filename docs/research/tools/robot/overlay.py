import sys, json, numpy as np, cv2
model, ref_path, out, x0, y0, x1, y1, sc = sys.argv[1], sys.argv[2], sys.argv[3], *map(int, sys.argv[4:9])
m = json.load(open(model))
ref = cv2.imread(ref_path)
crop = cv2.resize(ref[y0:y1, x0:x1], ((x1 - x0) * sc, (y1 - y0) * sc), interpolation=cv2.INTER_NEAREST)
def chaikin(pts, n=3):
    for _ in range(n):
        c = np.roll(pts, -1, axis=0); q = np.empty((len(pts) * 2, 2)); q[0::2] = .75 * pts + .25 * c; q[1::2] = .25 * pts + .75 * c; pts = q
    return pts
for s in m["shapes"]:
    pts = np.array(s["points"], float)
    if s.get("round"): pts = chaikin(pts)
    p = ((pts - [x0, y0]) * sc).round().astype(np.int32)
    cv2.polylines(crop, [p], True, (255, 255, 0), 1, cv2.LINE_AA)
    c = p.mean(axis=0).astype(int)
    if 0 <= c[0] < crop.shape[1] and 0 <= c[1] < crop.shape[0]:
        cv2.putText(crop, s["id"], (int(c[0]) - 20, int(c[1])), cv2.FONT_HERSHEY_PLAIN, 0.8, (0, 255, 255), 1)
for gx in range((x0 // 10 + 1) * 10, x1, 10):
    X = (gx - x0) * sc
    cv2.line(crop, (X, 0), (X, 6 if gx % 50 else 14), (255, 255, 255), 1)
    if gx % 50 == 0: cv2.putText(crop, str(gx), (X + 2, 24), cv2.FONT_HERSHEY_PLAIN, 0.9, (255, 255, 255), 1)
for gy in range((y0 // 10 + 1) * 10, y1, 10):
    Y = (gy - y0) * sc
    cv2.line(crop, (0, Y), (6 if gy % 50 else 14, Y), (255, 255, 255), 1)
    if gy % 50 == 0: cv2.putText(crop, str(gy), (16, Y + 4), cv2.FONT_HERSHEY_PLAIN, 0.9, (255, 255, 255), 1)
cv2.imwrite(out, crop)
