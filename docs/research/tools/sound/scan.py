import numpy as np, sys, glob, os
sys.path.insert(0,os.path.dirname(__file__))
from wmatch import load_snd, wncc, SR
x=np.load(sys.argv[1]); t0=float(sys.argv[2]); t1=float(sys.argv[3]); thr=float(sys.argv[4])
x=x[int(t0*SR):int(t1*SR)]
res=[]
for f in sorted(glob.glob(sys.argv[5]+'/*.SND')):
    if os.path.getsize(f)<400: continue
    best=(0,0,0)
    for r in range(5500,30001,500):
        t=load_snd(f,r,0.3)
        if len(t)>=len(x): continue
        s=np.abs(wncc(x,t)); i=s.argmax()
        if s[i]>best[0]: best=(s[i],r,t0+i/SR)
    if best[0]>thr: res.append((best[0],os.path.basename(f),best[1],best[2]))
for r in sorted(res,reverse=True): print(f'{r[1]}@{r[2]} score={r[0]:.2f} t={r[3]:.2f}')
