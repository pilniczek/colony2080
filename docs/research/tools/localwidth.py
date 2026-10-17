import sys, numpy as np
a = np.load(sys.argv[1]).flatten().astype(int)
win = int(sys.argv[2]) if len(sys.argv) > 2 else 1200
out = []
for s in range(0, len(a) - win, win // 2):
    seg = a[s:s + win]
    if np.count_nonzero(seg) < win * 0.1: out.append((s, '-')); continue
    best = max(range(8, 200), key=lambda w: np.mean((seg[w:] == seg[:-w]) & (seg[w:] != 0)) )
    out.append((s, best))
print(' '.join(f'{s}:{w}' for s, w in out))
