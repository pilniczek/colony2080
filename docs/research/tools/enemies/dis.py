import sys,capstone
d=open(sys.argv[1],'rb').read()
segbase=int(sys.argv[2],0); a=int(sys.argv[3],0); b=int(sys.argv[4],0)
md=capstone.Cs(capstone.CS_ARCH_X86,capstone.CS_MODE_16)
for i in md.disasm(d[a:b],a-segbase):
    print('%05x %-24s %s %s'%(i.address,i.bytes.hex(),i.mnemonic,i.op_str))
