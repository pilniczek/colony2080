import sys, numpy as np
from PIL import Image
d, first, last, tw, th, cols, scale, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6]), int(sys.argv[7]), sys.argv[8]
off = int(sys.argv[9]) if len(sys.argv) > 9 else 0
pal = np.load(d + '/pal.npy')
a = np.concatenate([np.load(f'{d}/f{i:03d}.npy').flatten() for i in range(first, last + 1)])[off:]
n = len(a) // (tw * th)
t = a[:n * tw * th].reshape(n, th, tw)
rows = (n + cols - 1) // cols
c = np.full((rows * (th + 1), cols * (tw + 1)), 0, np.uint8)
for k in range(n):
    r, q = divmod(k, cols); c[r * (th + 1):r * (th + 1) + th, q * (tw + 1):q * (tw + 1) + tw] = t[k]
im = Image.fromarray(c, 'P'); im.putpalette(pal.flatten().tolist())
im.convert('RGB').resize((c.shape[1] * scale, c.shape[0] * scale), Image.NEAREST).save(out)
print(n, 'tiles')
