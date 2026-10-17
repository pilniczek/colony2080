import sys, glob
from PIL import Image

frames_glob, out = sys.argv[1], sys.argv[2]
width = int(sys.argv[3]) if len(sys.argv) > 3 else 640
files = sorted(glob.glob(frames_glob))
ims = [Image.open(f).convert("RGB") for f in files]
h = round(ims[0].height * width / ims[0].width)
ims = [im.resize((width, h)) for im in ims]
ims[0].save(out, save_all=True, append_images=ims[1:], duration=100, loop=0)
print(len(ims), "frames ->", out)
