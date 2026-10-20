import numpy as np, sys, json
from scipy.signal import resample_poly, fftconvolve, stft, find_peaks
from fractions import Fraction
SR=22050; HOP=128; NF=512
def bands():
    f=np.fft.rfftfreq(NF,1/SR); edges=np.geomspace(120,10000,41)
    M=np.zeros((40,len(f)))
    for i in range(40): M[i,(f>=edges[i])&(f<edges[i+1])]=1
    M[M.sum(1)==0, :]=0
    return M
MB=bands()
def spec(x):
    _,_,Z=stft(x,SR,nperseg=NF,noverlap=NF-HOP,boundary=None,padded=False)
    P=MB@(np.abs(Z)**2)
    return np.log(P+1e-8)
def load_snd(path,rate):
    a=(np.frombuffer(open(path,'rb').read(),np.uint8).astype(np.float32)-128)/128
    fr=Fraction(SR,int(rate)).limit_denominator(200)
    return resample_poly(a,fr.numerator,fr.denominator)
def ncc(X,T):

    F,L=T.shape; T=T-T.mean(); T/=np.linalg.norm(T)+1e-9
    num=sum(fftconvolve(X[i],T[i][::-1],'valid') for i in range(F))
    c1=np.cumsum(np.pad(X,((0,0),(1,0))),1); c2=np.cumsum(np.pad(X**2,((0,0),(1,0))),1)
    s1=(c1[:,L:]-c1[:,:-L]).sum(0); s2=(c2[:,L:]-c2[:,:-L]).sum(0)
    n=F*L; var=s2-s1**2/n
    return num/np.sqrt(np.maximum(var,1e-9))
if __name__=='__main__':
    vid=np.load(sys.argv[1]); X=spec(vid)
    for item in sys.argv[2:]:
        name,rate=item.split('@')
        T=spec(load_snd(name,float(rate)))
        T=T[:, :min(T.shape[1],int(1.5*SR/HOP))]
        s=ncc(X,T)
        pk,_=find_peaks(s,height=0.35,distance=int(0.15*SR/HOP))
        top=sorted(pk,key=lambda p:-s[p])[:12]
        print(f'{name.split("/")[-1]}@{rate} L={T.shape[1]} max={s.max():.3f} top10mean={np.mean(sorted(s[pk])[-10:]) if len(pk) else 0:.3f} n>0.5={int((s[pk]>0.5).sum())} n>0.6={int((s[pk]>0.6).sum())}')
        print('   ', ' '.join(f'{p*HOP/SR:.2f}:{s[p]:.2f}' for p in sorted(top)))
