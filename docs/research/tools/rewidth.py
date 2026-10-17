import sys, numpy as np
from PIL import Image
npy, w, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
colh = int(sys.argv[4]) if len(sys.argv) > 4 else 400
scale = int(sys.argv[5]) if len(sys.argv) > 5 else 2
off = int(sys.argv[6]) if len(sys.argv) > 6 else 0
pal = np.load(npy.rsplit('/', 1)[0] + '/pal.npy')
a = np.load(npy).flatten()[off:]
h = len(a) // w
img = a[:h * w].reshape(h, w)
ncol = (h + colh - 1) // colh
canvas = np.zeros((colh, ncol * (w + 2)), np.uint8)
for c in range(ncol):
    part = img[c * colh:(c + 1) * colh]
    canvas[:len(part), c * (w + 2):c * (w + 2) + w] = part
im = Image.fromarray(canvas, 'P'); im.putpalette(pal.flatten().tolist())
im = im.convert('RGB').resize((canvas.shape[1] * scale, colh * scale), Image.NEAREST)
im.save(out)
