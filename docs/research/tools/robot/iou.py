import sys, json, numpy as np, cv2
model, ref_path = sys.argv[1:3]
m = json.load(open(model)); MAT = m["materials"]
ref = cv2.imread(ref_path); h, w = ref.shape[:2]
ms = cv2.pyrMeanShiftFiltering(ref, 4, 18)
hsv = cv2.cvtColor(ms, cv2.COLOR_BGR2HSV).astype(np.int32)
H, S, V = hsv[..., 0] * 2, hsv[..., 1], hsv[..., 2]
b, g, r = [ms[..., i].astype(np.int32) for i in range(3)]
armor = (((H <= 45) | (H >= 340)) & (S > 80) & (V > 70)) | ((r > 170) & (r > g + 25) & (g >= b - 10) & (S > 40))
badge = (H > 40) & (H < 75) & (S > 120) & (V > 120)
lab = np.zeros((h, w), np.uint8)
names = ["bg", "armor", "metal", "badge", "visor"]
for s in m["shapes"]:
    pts = np.array(s["points"], np.float64)
    if s.get("round"):
        for _ in range(3):
            q = []
            for i in range(len(pts)):
                a, c = pts[i], pts[(i + 1) % len(pts)]
                q += [0.75 * a + 0.25 * c, 0.25 * a + 0.75 * c]
            pts = np.array(q)
    cv2.fillPoly(lab, [np.round(pts).astype(np.int32)], names.index(MAT[s["cls"]]))
robot = lab > 0
near = cv2.dilate(robot.astype(np.uint8), np.ones((15, 15), np.uint8)) > 0
for k, refm in (("armor", armor & near), ("badge", badge & near)):
    vm = lab == names.index(k)
    print(k, "IoU %.3f" % ((refm & vm).sum() / max(1, (refm | vm).sum())), "missed px", int((refm & ~vm).sum()), "extra px", int((vm & ~refm).sum()))
vis = (ref * 0.35).astype(np.uint8)
vis[armor & near & (lab != 1)] = (255, 0, 255)
vis[(lab == 1) & ~armor] = (0, 0, 255)
vis[(lab == 1) & armor] = (40, 160, 40)
cv2.imwrite(sys.argv[3], vis)
