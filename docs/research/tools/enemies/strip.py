import sys,numpy as np
from PIL import Image
L,out=sys.argv[1],sys.argv[2]; W=int(sys.argv[3]); frames=[int(x) for x in sys.argv[4].split(',')]; H=int(sys.argv[5]) if len(sys.argv)>5 else 400
pal=np.load(L+'/pal.npy').reshape(-1,3).astype(np.uint8)
cols=[]
for f in frames:
    a=np.load('%s/f%03d.npy'%(L,f)).flatten()
    rows=len(a)//W; a=a[:rows*W].reshape(rows,W)
    for s in range(0,rows,H):
        c=a[s:s+H]
        if c.shape[0]<H: c=np.vstack([c,np.zeros((H-c.shape[0],W),np.uint8)])
        cols.append(c); cols.append(np.full((H,2),255,np.uint8))
    cols.append(np.full((H,6),0,np.uint8))
img=np.hstack(cols)
im=Image.fromarray(pal[img]); im=im.resize((im.width*2,im.height*2),Image.NEAREST); im.save(out); print(im.size)
