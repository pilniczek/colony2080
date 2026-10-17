import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fli import Fli, to_image
import numpy as np
f = Fli(sys.argv[1]); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
for i, im, p in f.iter_frames():
    to_image(im, p).save(os.path.join(out, f'f{i:03d}.png'))
    np.save(os.path.join(out, f'f{i:03d}.npy'), im)
np.save(os.path.join(out, 'pal.npy'), p)
