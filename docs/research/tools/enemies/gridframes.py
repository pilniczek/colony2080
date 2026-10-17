import sys, json
from PIL import Image, ImageDraw
framedir, smjson, out, t0, fps = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), float(sys.argv[5])
frames = [int(a) for a in sys.argv[6:]]
sm = json.load(open(smjson))
S = 2
tiles = []
for fr in frames:
    k = str(fr)
    if k not in sm:
        near = min(sm, key=lambda q: abs(int(q) - fr)); k = near
    r = sm[k]
    im = Image.open(f"{framedir}/{fr:05d}.png").convert("RGB").crop((15, 24, 305, 193)).resize((290 * S, 169 * S), Image.NEAREST)
    d = ImageDraw.Draw(im)
    cx, cy = r["x"], r["y"]
    for x in range(0, 290):
        if (cx + x) % 24 == 0:
            c = (cx + x) // 24
            d.line([(x * S, 0), (x * S, 169 * S)], fill=(0, 255, 0) if c % 5 else (255, 255, 0), width=1)
            d.text((x * S + 2, 2 + (c % 2) * 10), str(c), fill=(255, 255, 0))
    for y in range(0, 169):
        if (cy + y) % 24 == 0:
            d.line([(0, y * S), (290 * S, y * S)], fill=(0, 160, 0), width=1)
            d.text((2, y * S + 2), str((cy + y) // 24), fill=(0, 255, 255))
    t = t0 + (fr - 1) / fps
    d.rectangle([0, 169 * S - 14, 300, 169 * S], fill=(0, 0, 0))
    d.text((4, 169 * S - 13), f"f{fr} {int(t//60)}:{t%60:04.1f} cam {cx},{cy} (src f{k} s{r['score']})", fill=(255, 255, 255))
    tiles.append(im)
cols = 2
rows = (len(tiles) + cols - 1) // cols
W = Image.new("RGB", (cols * 290 * S, rows * 169 * S))
for i, t in enumerate(tiles):
    W.paste(t, ((i % cols) * 290 * S, (i // cols) * 169 * S))
W.save(out)
