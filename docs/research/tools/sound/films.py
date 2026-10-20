import re,struct,sys
exe=open(sys.argv[1],'rb').read(); D=sys.argv[2]
ne=struct.unpack_from('<I',exe,0x3c)[0]
segtab=struct.unpack_from('<H',exe,ne+0x22)[0]; align=struct.unpack_from('<H',exe,ne+0x32)[0]
bases=[struct.unpack_from('<H',exe,ne+segtab+i*8)[0]<<align for i in range(14)]
ids={1:'signal',2:'vrata',3:'krok3',4:'ikona',5:'p1_cann',6:'laser3',7:'uder',8:'sirena3',9:'vybuch6',10:'vybuch2',11:'nic',12:'S12',13:'S13',14:'S14',15:'S15',16:'S16',17:'S17',18:'S18',19:'S19',20:'strelba',21:'hrom',22:'vytah1',23:'vytah2',24:'dvere2',25:'zkrat',26:'S26',27:'odlet',28:'laser2',29:'vrata1',30:'vrata2',31:'slow'}
for s in range(1,8):
    L=open(f'{D}/seg{s}.txt').read().splitlines()
    ent=[]; lastdi=None; pend=None
    for l in L:
        m=re.match(r'(\w+) \S+\s+mov di, (0x\w+)$',l)
        if m: lastdi=int(m[2],16)
        m=re.match(r'(\w+) \S+\s+mov byte ptr \[(0x\w+)\], (0x\w+|\d+)$',l)
        if m and 0xc1d<int(m[2],16)<0xc1d+3*3000 and (int(m[2],16)-0xc1d)%3==0:
            ent.append(((int(m[2],16)-0xc1d)//3,int(m[3],0)))
        m=re.match(r'(\w+) \S+\s+mov word ptr \[(0x\w+)\], (0x\w+|\d+)$',l)
        if m and ent and int(m[2],16)==0xc1d+3*ent[-1][0]+1:
            ent[-1]=ent[-1]+(int(m[3],0),)
        if 'lcall 0xc, 0x3c23' in l: pend=lastdi
        if ('lcall 2, 0x86d' in l or 'lcall 2, 0x518' in l) and pend is not None:
            b=bases[s-1]+pend; n=exe[b]; name=exe[b+1:b+1+n].decode('latin1')
            if ent: print(f'{s}:{l.split()[0]} {name}: '+', '.join(f'f{e[0]}={ids.get(e[1],e[1])}@{e[2] if len(e)>2 else "?"}' for e in ent))
            ent=[]; pend=None
