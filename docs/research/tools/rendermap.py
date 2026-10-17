import sys, numpy as np
from PIL import Image
mp, d, out = sys.argv[1], sys.argv[2], sys.argv[3]
W = int(sys.argv[4]) if len(sys.argv) > 4 else 160
T = 24
FOFF = int(sys.argv[6]) if len(sys.argv) > 6 else 0
IBASE = int(sys.argv[7]) if len(sys.argv) > 7 else 0
pal = np.load(d + '/pal.npy')
m = np.fromfile(mp, np.uint8).reshape(-1, W, 2)
H = m.shape[0]
cache = {}
def tile(f, i):
    if f not in cache:
        try: cache[f] = np.load(f'{d}/f{f:03d}.npy').flatten()
        except FileNotFoundError: cache[f] = None
    a = cache[f]
    if a is None or (i + 1) * T * T > len(a): return np.full((T, T), 255, np.uint8)
    return a[i * T * T:(i + 1) * T * T].reshape(T, T)
c = np.zeros((H * T, W * T), np.uint8)
for y in range(H):
    for x in range(W):
        f, i = int(m[y, x, 0]), int(m[y, x, 1])
        if f or i: c[y * T:(y + 1) * T, x * T:(x + 1) * T] = tile(f + FOFF, i - IBASE)
im = Image.fromarray(c, 'P'); im.putpalette(pal.flatten().tolist())
im = im.convert('RGB')
im.save(out)
sc = float(sys.argv[5]) if len(sys.argv) > 5 else 0.25
im.resize((int(im.width * sc), int(im.height * sc))).save(out.replace('.png', '_small.png'))
used = m[(m[..., 0] > 0) | (m[..., 1] > 0)]
print('size', W, 'x', H, 'frames used', sorted(set(used[:, 0].tolist())))
