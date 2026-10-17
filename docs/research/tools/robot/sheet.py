import os, sys, tempfile
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
import sys,os
sys.path.insert(0,os.path.join(ROOT, 'docs/research/tools'))
from fli import Fli,to_image
from PIL import Image
path,out,step=sys.argv[1],sys.argv[2],int(sys.argv[3])
fr=[]
try:
  for i,im,p in Fli(path).iter_frames():
    if i%step==0: fr.append((i,to_image(im,p)))
except Exception as e: print('err',e)
print(os.path.basename(path),'sampled',len(fr),fr[0][1].size if fr else '')
cols=5; w,h=fr[0][1].size; w2,h2=w//2,h//2
rows=(len(fr)+cols-1)//cols
# split into pages of 5 rows
per=cols*5
for pg in range((len(fr)+per-1)//per):
  sub=fr[pg*per:(pg+1)*per]; r=(len(sub)+cols-1)//cols
  S=Image.new('RGB',(cols*w2,r*h2))
  for k,(i,im) in enumerate(sub):
    S.paste(im.convert('RGB').resize((w2,h2)),((k%cols)*w2,(k//cols)*h2))
  S.save(f'{out}_p{pg}.png'); print(f'{out}_p{pg}.png',[i for i,_ in sub])
