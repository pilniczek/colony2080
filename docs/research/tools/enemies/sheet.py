import sys
from PIL import Image, ImageDraw
src, out, first, last, step, t0, fps, cols = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), float(sys.argv[6]), float(sys.argv[7]), int(sys.argv[8])
crop = tuple(map(int, sys.argv[9].split(","))) if len(sys.argv) > 9 else None
idx = list(range(first, last + 1, step))
ims = []
for i in idx:
    im = Image.open(f"{src}/{i:05d}.png").convert("RGB")
    if crop: im = im.crop(crop)
    if len(sys.argv) > 10: im = im.resize((int(sys.argv[10].split("x")[0]), int(sys.argv[10].split("x")[1])))
    ims.append((i, im))
w, h = ims[0][1].size
rows = (len(ims) + cols - 1) // cols
S = Image.new("RGB", (cols * w, rows * h))
d = ImageDraw.Draw(S)
for n, (i, im) in enumerate(ims):
    x, y = (n % cols) * w, (n // cols) * h
    S.paste(im, (x, y))
    t = t0 + (i - 1) / fps
    d.rectangle([x, y, x + 62, y + 11], fill=(0, 0, 0))
    d.text((x + 2, y), f"{i} {int(t//60)}:{t%60:04.1f}", fill=(255, 255, 0))
S.save(out)
