import sys
from PIL import Image
mapdir, out = sys.argv[1], sys.argv[2]
items = [a.split(":") for a in sys.argv[3:]]
maps = {}
W = Image.new("RGB", (580, 169 * len(items)))
for n, (f, x, y, v) in enumerate(items):
    if v not in maps: maps[v] = Image.open(f"{mapdir}/map_M1{v}.png").convert("RGB")
    im = Image.open(f).convert("RGB")
    if im.size != (320, 200): im = im.crop((32, 0, 608, 360)).resize((320, 200))
    W.paste(im.crop((15, 24, 305, 193)), (0, 169 * n))
    W.paste(maps[v].crop((int(x), int(y), int(x) + 290, int(y) + 169)), (290, 169 * n))
W.save(out)
