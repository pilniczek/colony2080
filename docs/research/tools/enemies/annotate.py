import sys, json
from PIL import Image, ImageDraw, ImageFont
mappng, enemies_json, markers_json, out = sys.argv[1:5]
m = Image.open(mappng).convert("RGB")
d = ImageDraw.Draw(m)
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
    big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
except OSError:
    font = big = ImageFont.load_default()
C = 24
col = {"chromeDroid": (255, 60, 60), "flyer": (60, 220, 255), "guardShootable": (255, 0, 255), "guardAcid": (255, 255, 0)}
for e in json.load(open(enemies_json))["enemies"]:
    x, y = e["cell"]
    c = col.get(e["type"], (255, 255, 255))
    if e.get("patrol"):
        a, b = e["patrol"]
        ly = (y + 1) * C - 3 if e["type"] != "flyer" else (y + 1) * C + 4
        d.line([(a * C, ly), ((b + 1) * C, ly)], fill=c, width=2)
        for px in (a * C, (b + 1) * C):
            d.line([(px, ly - 6), (px, ly + 6)], fill=c, width=2)
    if e["type"] == "flyer":
        box = [x * C, y * C + 4, x * C + 36, (y + 1) * C - 4]
    elif e["type"] == "guardAcid":
        box = [x * C, y * C, x * C + 72, y * C + 72]
    else:
        box = [x * C, (y - 1) * C, x * C + 28, (y + 1) * C - 3]
    d.rectangle(box, outline=c, width=3)
    d.rectangle([box[0], box[1] - 19, box[0] + 9 * len(e["id"]) + 6, box[1] - 1], fill=(0, 0, 0))
    d.text((box[0] + 3, box[1] - 19), e["id"], fill=c, font=font)
for mk in json.load(open(markers_json)):
    x, y = mk["cell"]
    cx, cy = x * C + 12, y * C + 12
    d.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill=(255, 200, 0), outline=(0, 0, 0), width=2)
    t = str(mk["marker"])
    d.text((cx - 7 * len(t), cy - 12), t, fill=(0, 0, 0), font=big)
d.rectangle([2900, 1640, 3830, 1912], fill=(0, 0, 0))
leg = [("red box = chrome droid (type 1), spawn cell, line = patrol range", col["chromeDroid"]),
       ("cyan box = flyer (type 2), spawn cell, line = patrol range", col["flyer"]),
       ("magenta = shoot-only guard (marker 15)", col["guardShootable"]),
       ("yellow square = acid-only guard (marker 14, map tiles)", col["guardAcid"]),
       ("orange disc = walkthrough task marker number", (255, 200, 0)),
       ("source: KLEV1.EXE level-1 init table, see reports/10-level1-enemies.md", (220, 220, 220))]
for i, (t, c) in enumerate(leg):
    d.text((2915, 1655 + i * 40), t, fill=c, font=font)
m.save(out)
