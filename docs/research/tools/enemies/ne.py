import struct,sys
d=open(sys.argv[1],'rb').read()
ne=struct.unpack_from('<I',d,0x3c)[0]
h=d[ne:ne+64]
segcnt=struct.unpack_from('<H',h,0x1c)[0]; segtab=struct.unpack_from('<H',h,0x22)[0]; align=struct.unpack_from('<H',h,0x32)[0]
autodata=struct.unpack_from('<H',h,0x0e)[0]
print('ne',hex(ne),'segs',segcnt,'align',align,'autodata',autodata)
for i in range(segcnt):
    off,ln,fl,mn=struct.unpack_from('<HHHH',d,ne+segtab+i*8)
    print(i+1,hex(off<<align),ln,hex(fl),mn,'DATA' if fl&1 else 'CODE')
