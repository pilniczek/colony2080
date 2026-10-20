import numpy as np, sys, json
def load(p): return (np.frombuffer(open(p,'rb').read(),np.uint8).astype(np.float64)-128)/128
def desc(path,rate):
    a=load(path); a=a-a.mean(); sr=rate; dur=len(a)/sr
    w=max(64,int(0.01*sr)); n=len(a)//w
    env=np.sqrt((a[:n*w].reshape(n,w)**2).mean(1)); pk=env.argmax()
    thr=env.max()*0.1; above=np.where(env>thr)[0]
    att=(pk)*w/sr; end=(above[-1]+1)*w/sr if len(above) else dur
    N=min(2048,1<<int(np.log2(len(a))))
    frames=[a[i:i+N]*np.hanning(N) for i in range(0,max(1,len(a)-N),N//2)] or [np.pad(a,(0,N-len(a)))*np.hanning(N)]
    S=np.array([np.abs(np.fft.rfft(f))**2 for f in frames]); f=np.fft.rfftfreq(N,1/sr)
    tot=S.sum(0); cen=(tot*f).sum()/tot.sum()
    dom=f[np.argmax(tot[f>40])+np.sum(f<=40)]
    flat=np.exp(np.mean(np.log(tot[1:]+1e-12)))/np.mean(tot[1:])
    bands=[(0,300),(300,1000),(1000,3000),(3000,sr/2)]
    bf=[tot[(f>=lo)&(f<hi)].sum()/tot.sum() for lo,hi in bands]

    cents=[(s*f).sum()/max(s.sum(),1e-12) for s in S]
    e=[s.sum() for s in S]; good=[c for c,ee in zip(cents,e) if ee>max(e)*0.05]
    traj=(good[0],good[len(good)//2],good[-1]) if good else (cen,cen,cen)

    i=int(np.argmax(e))*N//2; seg=a[i:i+N]
    ac=np.correlate(seg,seg,'full')[N-1:]; lo=int(sr/1500); hi=int(sr/60)
    lag=lo+np.argmax(ac[lo:hi]) if hi<len(ac) else lo; per=ac[lag]/ac[0] if ac[0]>0 else 0
    return dict(dur=round(dur,3),attack_s=round(att,3),peak_at=round(att,3),end90_s=round(end,3),
      centroid=int(cen),dominant=int(dom),flatness=round(float(flat),3),bands=[round(x,2) for x in bf],
      cent_traj=[int(x) for x in traj],pitch_hz=int(sr/lag),periodicity=round(float(per),2),
      env10=[round(float(x),2) for x in np.interp(np.linspace(0,n-1,10),np.arange(n),env/env.max())])
if __name__=='__main__':
    out={}
    for item in sys.argv[1:]:
        p,r=item.split('@'); out[f'{p.split("/")[-1]}@{r}']=desc(p,float(r))
    for k,v in out.items(): print(k,json.dumps(v))
