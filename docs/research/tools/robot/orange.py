import os, sys, tempfile
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
import sys,os,glob,numpy as np
sys.path.insert(0,os.path.join(ROOT, 'docs/research/tools'))
from fli import Fli
G=os.path.join(ROOT, 'docs/research/gamedata/raw/C28/GRAFIKA/')
for p in sorted(glob.glob(G+'*.ANM')):
  try:
    res=[]
    for i,im,pal in Fli(p).iter_frames():
      if i%6: continue
      pal=np.asarray(pal).reshape(-1,3).astype(int)
      if pal.max()<64: pal=pal*4
      r,g,b=pal[:,0],pal[:,1],pal[:,2]
      o=(r>150)&(g>60)&(g<0.75*r)&(b<0.35*r)
      res.append(o[im].mean())
    res=np.array(res); print(os.path.basename(p),len(res),'max%.3f'%res.max(),'n>.04:',(res>.04).sum())
  except Exception as e: print(os.path.basename(p),'err',e)
