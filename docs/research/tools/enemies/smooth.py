import sys, ast, json
log, out, fstep = sys.argv[1], sys.argv[2], int(sys.argv[3])
rows = []
for line in open(log):
    p = line.split(" ", 1)
    if len(p) < 2 or not p[0].endswith(".png"): continue
    body = p[1].rsplit("]", 1)
    cands = ast.literal_eval(body[0] + "]")
    tf = float(body[1])
    rows.append((int(p[0][:5]), cands, tf))
# rerun of locate3 printed only top3; good enough
N = len(rows)
INF = 1e18
cost = [[c[0] for c in r[1]] for r in rows]
back = []
prev = [c / 1000.0 for c in cost[0]]
for i in range(1, N):
    gap = (rows[i][0] - rows[i - 1][0]) / fstep
    cur, bk = [], []
    for j, cj in enumerate(rows[i][1]):
        best, arg = INF, 0
        for k, ck in enumerate(rows[i - 1][1]):
            dx, dy = abs(cj[1] - ck[1]), abs(cj[2] - ck[2])
            allow = 70 * gap
            t = max(0, dx - allow) / 40.0 + max(0, dy - allow) / 40.0
            if gap > 6: t *= 0.15
            v = prev[k] + t
            if v < best: best, arg = v, k
        cur.append(best + cj[0] / 1000.0)
        bk.append(arg)
    back.append(bk)
    prev = cur
j = min(range(len(prev)), key=lambda q: prev[q])
path = [j]
for i in range(N - 1, 0, -1):
    j = back[i - 1][j]
    path.append(j)
path.reverse()
res = {}
for (fr, cands, tf), j in zip(rows, path):
    c = cands[j]
    res[fr] = {"x": c[1], "y": c[2], "v": c[3], "score": c[0], "rank": j, "tf": tf}
json.dump(res, open(out, "w"))
for fr in sorted(res)[::1]:
    r = res[fr]
    print(fr, r["x"], r["y"], round(r["y"] / 24, 1), r["rank"], r["score"])
