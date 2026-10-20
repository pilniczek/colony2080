import numpy as np, sys, os
sys.path.insert(0,os.path.dirname(__file__))
from wmatch import load_snd, wncc, SR
from scipy.signal import find_peaks
x=np.load(sys.argv[1]); t0=float(sys.argv[2]); t1=float(sys.argv[3]); dur=float(sys.argv[4])
x=x[int(t0*SR):int(t1*SR)]
for item in sys.argv[5:]:
    n,r=item.split('@'); t=load_snd(n,float(r),dur); s=np.abs(wncc(x,t))
    pk,_=find_peaks(s,height=0.5,distance=int(0.03*SR))
    print(item,f'max={s.max():.2f} n>.6={int((s[pk]>.6).sum())} n>.7={int((s[pk]>.7).sum())}',' '.join(f'{t0+p/SR:.2f}' for p in sorted(pk,key=lambda p:-s[p])[:12]))
