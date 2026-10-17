import sys, numpy as np
from PIL import Image
d, first, last, w, off, rows0, rows1, colh, scale, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6]), int(sys.argv[7]), int(sys.argv[8]), int(sys.argv[9]), sys.argv[10]
pal = np.load(d + '/pal.npy')
a = np.concatenate([np.load(f'{d}/f{i:03d}.npy').flatten() for i in range(first, last + 1)])[off:]
h = len(a) // w
img = a[:h * w].reshape(h, w)[rows0:rows1]
n = (len(img) + colh - 1) // colh
c = np.zeros((colh, n * (w + 3)), np.uint8)
for k in range(n):
    p = img[k * colh:(k + 1) * colh]; c[:len(p), k * (w + 3):k * (w + 3) + w] = p
im = Image.fromarray(c, 'P'); im.putpalette(pal.flatten().tolist())
im.convert('RGB').resize((c.shape[1] * scale, colh * scale), Image.NEAREST).save(out)
print('total rows', h)
