import re,struct,sys
exe=open(sys.argv[1],'rb').read(); D=sys.argv[2]
ne=struct.unpack_from('<I',exe,0x3c)[0]
segtab=struct.unpack_from('<H',exe,ne+0x22)[0]; align=struct.unpack_from('<H',exe,ne+0x32)[0]
bases=[struct.unpack_from('<H',exe,ne+segtab+i*8)[0]<<align for i in range(14)]
for s in (1,3,5,6):
    L=open(f'{D}/seg{s}.txt').read().splitlines()
    lastdi=None; pend=None; func=None
    for i,l in enumerate(L):
        m=re.match(r'(\w+) \S+\s+mov di, (0x\w+)$',l)
        if m: lastdi=int(m[2],16)
        if 'push bp' in l and i+1<len(L) and 'mov bp, sp' in L[i+1]: func=l.split()[0]
        if 'lcall 2, 0x2555' in l: pend=lastdi
        m=re.match(r'(\w+) \S+\s+mov word ptr \[(0x\w+)\], ax$',l)
        if m and pend is not None:
            b=bases[s-1]+pend; n=exe[b]; name=exe[b+1:b+1+n].decode('latin1')
            print(f'seg{s} func {func} @{m[1]} {name} -> [{m[2]}]'); pend=None
