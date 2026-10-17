import sys, numpy as np
for p in sys.argv[1:]:
    a = np.load(p).flatten().astype(int)
    nz = np.nonzero(a)[0]
    end = nz[-1] + 1 if len(nz) else 0
    a2 = a[:end]
    sc = []
    for w in range(4, 330):
        d = np.mean(a2[w:] == a2[:-w]) if end > w else 0
        sc.append((d, w))
    sc.sort(reverse=True)
    print(p.split('/')[-1], 'used', end, 'best', [(w, round(d, 3)) for d, w in sc[:6]])
