import sys
from PIL import Image, ImageDraw
src, out, x0, y0, x1, y1, scale = sys.argv[1], sys.argv[2], *map(int, sys.argv[3:8])
im = Image.open(src).convert('RGB')
c = im.crop((x0, y0, x1, y1)).resize(((x1 - x0) * scale, (y1 - y0) * scale), Image.NEAREST)
d = ImageDraw.Draw(c)
for x in range((x0 // 20 + 1) * 20, x1, 20):
    X = (x - x0) * scale
    d.line([(X, 0), (X, c.height)], fill=(0, 255, 255) if x % 100 == 0 else (0, 110, 110))
    if x % 100 == 0: d.text((X + 2, 2), str(x), fill=(255, 255, 255))
for y in range((y0 // 20 + 1) * 20, y1, 20):
    Y = (y - y0) * scale
    d.line([(0, Y), (c.width, Y)], fill=(0, 255, 255) if y % 100 == 0 else (0, 110, 110))
    if y % 100 == 0: d.text((2, Y + 2), str(y), fill=(255, 255, 255))
c.save(out)
