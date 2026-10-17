import sys,capstone
d=bytearray(open(sys.argv[1],'rb').read())
segbase=int(sys.argv[2],0); a=int(sys.argv[3],0); b=int(sys.argv[4],0)
md=capstone.Cs(capstone.CS_ARCH_X86,capstone.CS_MODE_16)
p=a
while p<b:
    if d[p]==0xCD and 0x34<=d[p+1]<=0x3B:
        buf=bytes([0x9b,0xD8+d[p+1]-0x34])+d[p+2:p+8]; off=2
    elif d[p]==0xCD and d[p+1]==0x3C:
        segs={0:0x26,1:0x2e,2:0x36,3:0x3e}
        x=d[p+2]; esc=0xD8|(x&7); so=[0x26,0x2e,0x36,0x3e][(~x>>6)&3] if False else 0x26
        buf=bytes([0x9b,so,esc])+d[p+3:p+9]; off=3
    elif d[p]==0xCD and d[p+1]==0x3D:
        print('%05x %-24s fwait'%(p-segbase,'cd3d')); p+=2; continue
    else:
        buf=bytes(d[p:p+8]); off=0
    ins=next(md.disasm(buf,p-segbase),None)
    if ins is None: print('%05x ?? %02x'%(p-segbase,d[p])); p+=1; continue
    n=ins.size-(1 if off==2 else (1 if off==3 else 0))
    if off==3: n=ins.size  # 9b+seg+esc.. vs cd 3c x ..: same length
    if off==2: n=ins.size  # 9b d8.. vs cd 34..: same length
    print('%05x %-24s %s %s'%(p-segbase,bytes(d[p:p+n]).hex(),ins.mnemonic,ins.op_str))
    p+=n
