import struct,sys,capstone
d=bytearray(open(sys.argv[1],'rb').read())
ne=struct.unpack_from('<I',d,0x3c)[0]
h=d[ne:ne+64]
segcnt=struct.unpack_from('<H',h,0x1c)[0]; segtab=struct.unpack_from('<H',h,0x22)[0]; align=struct.unpack_from('<H',h,0x32)[0]
modtab=struct.unpack_from('<H',h,0x28)[0]; impnames=struct.unpack_from('<H',h,0x2a)[0]
segs=[]
for i in range(segcnt):
    off,ln,fl,mn=struct.unpack_from('<HHHH',d,ne+segtab+i*8)
    segs.append((off<<align,ln,fl))
def relocs(si):
    base,ln,fl=segs[si]
    out={}
    if not fl&0x100: return out
    p=base+ln
    n=struct.unpack_from('<H',d,p)[0]; p+=2
    for k in range(n):
        st,rt,off,a,b=struct.unpack_from('<BBHHH',d,p); p+=8
        kind=rt&3
        if kind==0:
            tgt=('int',a,b)
        else: tgt=('imp',kind,a,b)

        o=off
        seen=0
        while True:
            out[o]=(st,tgt)
            if rt&4: break
            nxt=struct.unpack_from('<H',d,base+o)[0]
            if nxt==0xffff or seen>5000: break
            o=nxt; seen+=1
    return out
si=int(sys.argv[2])-1; a=int(sys.argv[3],0); b=int(sys.argv[4],0)
base=segs[si][0]
R=relocs(si)
for o,(st,t) in R.items():
    if t[0]=='int' and st==3:
        struct.pack_into('<HH',d,base+o,t[2],t[1])
md=capstone.Cs(capstone.CS_ARCH_X86,capstone.CS_MODE_16)
p=a
while p<b:
    buf=bytes(d[base+p:base+p+8])
    ins=next(md.disasm(buf,p),None)
    if ins is None: print('%05x ?? %02x'%(p,d[base+p])); p+=1; continue
    s='%05x %-18s %s %s'%(p,bytes(ins.bytes).hex(),ins.mnemonic,ins.op_str)
    for k in range(p,p+ins.size):
        if k in R and R[k][1][0]=='imp': s+='   ;IMP %s'%(R[k][1],)
    print(s); p+=ins.size
