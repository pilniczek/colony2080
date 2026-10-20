import numpy as np, sys
from scipy.signal import resample_poly, fftconvolve, find_peaks, butter, sosfiltfilt
from fractions import Fraction
SR=22050
def load_snd(path,rate,maxs=0.35):
    a=(np.frombuffer(open(path,'rb').read(),np.uint8).astype(np.float32)-128)/128
    fr=Fraction(SR,int(rate)).limit_denominator(400)
    y=resample_poly(a,fr.numerator,fr.denominator)
    return y[:int(maxs*SR)]
def wncc(x,t):
    t=t-t.mean(); t/=np.linalg.norm(t)+1e-9; L=len(t)
    num=fftconvolve(x,t[::-1],'valid')
    c2=np.cumsum(np.concatenate([[0],x**2])); c1=np.cumsum(np.concatenate([[0],x]))
    e=(c2[L:]-c2[:-L])-(c1[L:]-c1[:-L])**2/L
    return num/np.sqrt(np.maximum(e,1e-12))
if __name__=='__main__':
    x=np.load(sys.argv[1]); t0=float(sys.argv[2]); t1=float(sys.argv[3])
    x=x[int(t0*SR):int(t1*SR)]
    for item in sys.argv[4:]:
        name,rate=item.split('@'); t=load_snd(name,float(rate))
        s=np.abs(wncc(x,t))
        pk,_=find_peaks(s,height=0.3,distance=int(0.1*SR))
        top=sorted(pk,key=lambda p:-s[p])[:10]
        print(f'{name.split("/")[-1]}@{rate} max={s.max():.3f} n>.4={int((s[pk]>.4).sum())} n>.5={int((s[pk]>.5).sum())} n>.6={int((s[pk]>.6).sum())}  ', ' '.join(f'{t0+p/SR:.2f}:{s[p]:.2f}' for p in sorted(top)))
