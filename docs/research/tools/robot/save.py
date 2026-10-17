import os, sys, tempfile
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
import sys,collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pick import get
from PIL import Image,ImageDraw
O=os.path.join(ROOT, 'docs/research/robot/cutscenes/')
import os; os.makedirs(O,exist_ok=True)
SEL={
'front':[('VSTUP',60),('VSTUP',100),('OTDVER2',48),('OTDVER3',36),('DVERE',24)],
'front34':[('METROPAC',12),('METROPAC',20),('SUTR',60),('ROZDVERE',12),('OPRTEL',12)],
'side':[('XTYC',12),('XTYC',24),('ZVEDVRAT',24),('VYTDRAT',12),('OTOCKOH',12),('METROPAC',28)],
'back34':[('METROPAC',36),('VYTDRAT',60),('ZVEDVRAT',48)],
'back':[('METROPAC',44),('METROPAC',60),('POUZDRAT',6),('POUZDRAT',30)],
'head':[('FINAL4',6),('FINAL4',12),('UPAD',24),('UPAD',36),('SEBPIST',30)],
'gun':[('ZABIJMIM',6),('ZABIJMIM',12),('ZABIJMIM',18),('ZABIJMIM',24),('ZABIJMIM',36)],
'hand':[('POUZRUKU',12),('POUZRUKU',18),('SUTR',12),('SUTR',48)],
'feet':[('VSTUP',126),('VSTUP',138),('VSTUP',150),('VSTUP',156),('VSTUP',162)],
'torso':[('UPAD',12),('SEBPIST',18),('DVERE',36),('SEBPIST',48)],
'lying':[('FINAL3',12),('FINAL3',18)],
}
byclip=collections.defaultdict(set)
for v,l in SEL.items():
  for c,f in l: byclip[c].add(f)
fr={c:get(c,sorted(s)) for c,s in byclip.items()}
n=0
for v,l in SEL.items():
  tiles=[]
  for c,f in l:
    im=fr[c][f]; im.resize((960,600),Image.NEAREST).save(f'{O}{c}_f{f:03d}_{v}.png'); n+=1
    t=im.resize((480,300),Image.NEAREST); ImageDraw.Draw(t).text((4,4),f'{c} f{f}',fill=(255,255,255)); tiles.append(t)
  cols=2 if len(tiles)>1 else 1; r=(len(tiles)+cols-1)//cols
  C=Image.new('RGB',(cols*480,r*300))
  for k,t in enumerate(tiles): C.paste(t,((k%cols)*480,(k//cols)*300))
  C.save(f'{O}sheet_{v}.png')
print(n)
