import os, sys, tempfile
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
import sys,os
sys.path.insert(0,os.path.join(ROOT, 'docs/research/tools'))
from fli import Fli,to_image
from PIL import Image,ImageDraw
OUT=os.path.join(tempfile.gettempdir(), 'rt-out')
G=os.path.join(ROOT, 'docs/research/gamedata/raw/C28/GRAFIKA/')
def get(clip,idxs):
  want=set(idxs); out={}
  for i,im,p in Fli(G+clip+'.ANM').iter_frames():
    if i in want: out[i]=to_image(im,p).convert('RGB')
    if i>max(want): break
  return out
if __name__=='__main__':
  clip=sys.argv[1]; idxs=[int(x) for x in sys.argv[2].split(',')]; cols=int(sys.argv[3]) if len(sys.argv)>3 else 3
  fr=get(clip,idxs); r=(len(idxs)+cols-1)//cols
  C=Image.new('RGB',(cols*320,r*200)); d=ImageDraw.Draw(C)
  for k,i in enumerate(idxs):
    if i in fr: C.paste(fr[i],((k%cols)*320,(k//cols)*200)); d.text(((k%cols)*320+3,(k//cols)*200+3),str(i),fill=(255,255,255))
  C.save(OUT+'/pk_'+clip+'.png')
