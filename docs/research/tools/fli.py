import struct, sys, os
import numpy as np
from PIL import Image


def u16(b, o): return struct.unpack_from('<H', b, o)[0]
def s16(b, o): return struct.unpack_from('<h', b, o)[0]
def u32(b, o): return struct.unpack_from('<I', b, o)[0]


class Fli:
    def __init__(self, path):
        self.data = open(path, 'rb').read()
        d = self.data
        self.size, self.magic, self.frames, self.w, self.h, self.depth, self.flags, self.speed = struct.unpack_from('<IHHHHHHH', d, 0)
        self.pal = np.zeros((256, 3), np.uint8)
        self.img = np.zeros((self.h, self.w), np.uint8)
        self.chunk_log = []

    def color(self, b, o, shift):
        n = u16(b, o); o += 2; idx = 0
        for _ in range(n):
            idx += b[o]; c = b[o + 1] or 256; o += 2
            for _ in range(c):
                if idx < 256:
                    self.pal[idx] = [min(255, x << shift) for x in b[o:o + 3]]
                o += 3; idx += 1

    def brun(self, b, o):
        for y in range(self.h):
            o += 1; x = 0
            while x < self.w:
                t = struct.unpack_from('b', b, o)[0]; o += 1
                if t >= 0:
                    self.img[y, x:x + t] = b[o]; o += 1; x += t
                else:
                    n = -t; self.img[y, x:x + n] = np.frombuffer(b, np.uint8, n, o); o += n; x += n

    def lc(self, b, o):
        y = u16(b, o); n = u16(b, o + 2); o += 4
        for _ in range(n):
            pk = b[o]; o += 1; x = 0
            for _ in range(pk):
                x += b[o]; t = struct.unpack_from('b', b, o + 1)[0]; o += 2
                if t >= 0:
                    self.img[y, x:x + t] = np.frombuffer(b, np.uint8, t, o); o += t; x += t
                else:
                    self.img[y, x:x - t] = b[o]; o += 1; x -= t
            y += 1

    def ss2(self, b, o):
        lines = u16(b, o); o += 2; y = 0
        for _ in range(lines):
            while True:
                w = s16(b, o); o += 2
                if w & 0xC000 == 0xC000: y += -w; continue
                if w & 0xC000 == 0x8000: self.img[y, self.w - 1] = w & 0xFF; continue
                pk = w; break
            x = 0
            for _ in range(pk):
                x += b[o]; t = struct.unpack_from('b', b, o + 1)[0]; o += 2
                if t >= 0:
                    n = 2 * t; self.img[y, x:x + n] = np.frombuffer(b, np.uint8, n, o); o += n; x += n
                else:
                    pair = b[o:o + 2]; o += 2
                    for _ in range(-t):
                        self.img[y, x:x + 2] = list(pair); x += 2
            y += 1

    def iter_frames(self):
        d = self.data; o = 128
        if self.magic == 0xAF12:
            o = u32(d, 80) or 128
        for fi in range(self.frames + 1):
            if o + 16 > len(d): break
            fsize, ftype, nchunks = struct.unpack_from('<IHH', d, o)
            if ftype == 0xF100:
                o += fsize; continue
            co = o + 16; log = []
            for _ in range(nchunks):
                csize, ctype = struct.unpack_from('<IH', d, co)
                body = co + 6; log.append((ctype, csize))
                if ctype == 11: self.color(d, body, 2)
                elif ctype == 4: self.color(d, body, 0)
                elif ctype == 15: self.brun(d, body)
                elif ctype == 12: self.lc(d, body)
                elif ctype == 7: self.ss2(d, body)
                elif ctype == 13: self.img[:] = 0
                elif ctype == 16: self.img[:] = np.frombuffer(d, np.uint8, self.w * self.h, body).reshape(self.h, self.w)
                co += csize
            self.chunk_log.append(log)
            o += fsize
            if fi < self.frames:
                yield fi, self.img.copy(), self.pal.copy()


def to_image(img, pal):
    im = Image.fromarray(img, 'P'); im.putpalette(pal.flatten().tolist()); return im.convert('RGB')


def sheet(path, outdir, maxframes=48, cols=6, scale=0.5, every=1):
    f = Fli(path)
    frames = [(i, to_image(im, p)) for i, im, p in f.iter_frames() if i % every == 0][:maxframes]
    base = os.path.splitext(os.path.basename(path))[0]
    if not frames: return f, None
    tw, th = int(f.w * scale), int(f.h * scale)
    rows = (len(frames) + cols - 1) // cols
    c = min(cols, len(frames))
    out = Image.new('RGB', (c * tw, rows * th))
    for k, (i, im) in enumerate(frames):
        out.paste(im.resize((tw, th)), ((k % cols) * tw, (k // cols) * th))
    p = os.path.join(outdir, base + '_sheet.png'); out.save(p)
    frames[0][1].save(os.path.join(outdir, base + '_f0.png'))
    return f, p


if __name__ == '__main__':
    outdir = sys.argv[1]
    for path in sys.argv[2:]:
        try:
            f, p = sheet(path, outdir)
            types = sorted({t for log in f.chunk_log for t, _ in log})
            print(os.path.basename(path), f'magic={f.magic:04x} frames={f.frames} {f.w}x{f.h} speed={f.speed} chunks={types}', p)
        except Exception as e:
            print(os.path.basename(path), 'ERR', repr(e))
