import sys, json, numpy as np, cv2
model, ref, out = sys.argv[1:4]
box = tuple(map(int, sys.argv[4:8])) if len(sys.argv) > 7 and sys.argv[4] != '--material' else None
m = json.load(open(model))
r = cv2.imread(ref)
h, w = r.shape[:2]
S = 4
canvas = np.full((h * S, w * S, 3), 8, np.uint8)
for s in m["shapes"]:
    mats = {"armor": "#e2901c", "metal": "#26464a", "badge": "#d4dc18", "visor": "#121618"}
    mt = m.get("materials", {}).get(s["cls"])
    c = mats[mt] if (mt and "--material" in sys.argv) else (s.get("color") or m["palette"].get(s["cls"], "#ff00ff"))
    bgr = tuple(int(c[i:i + 2], 16) for i in (5, 3, 1))
    pts = np.array(s["points"], np.float64)
    if s.get("round"):
        for _ in range(3):
            c2 = np.roll(pts, -1, axis=0); q = np.empty((len(pts) * 2, 2)); q[0::2] = .75 * pts + .25 * c2; q[1::2] = .25 * pts + .75 * c2; pts = q
    pts = (pts * S).round().astype(np.int32)
    cv2.fillPoly(canvas, [pts], bgr, lineType=cv2.LINE_AA)
canvas = cv2.resize(canvas, (w, h), interpolation=cv2.INTER_AREA)
if box:
    x0, y0, x1, y1 = box
    canvas, r = canvas[y0:y1, x0:x1], r[y0:y1, x0:x1]
cv2.imwrite(out, np.hstack([r, canvas]))
