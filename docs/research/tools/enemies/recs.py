import json,sys
o=json.load(open(sys.argv[1]))['order']
mem={}
for pc,a,s,v in o:
    for k in range(s): mem[a+k]=None if v is None else (v>>(8*k))&0xff
def w(a):
    b=[mem.get(a+k,'?') for k in range(2)]
    return '?' if '?' in b else ('N' if None in b else b[0]|b[1]<<8)
def l(a):
    b=[mem.get(a+k,'?') for k in range(4)]
    return '?' if '?' in b else ('N' if None in b else b[0]|b[1]<<8|b[2]<<16|b[3]<<24)
base=int(sys.argv[2],0); size=int(sys.argv[3],0); n=int(sys.argv[4])
for i in range(n):
    a=base+i*size
    raw=' '.join('..' if mem.get(a+k,'?')=='?' else ('NN' if mem[a+k] is None else '%02x'%mem[a+k]) for k in range(size))
    print('%2d %04x %s'%(i,a,raw))
