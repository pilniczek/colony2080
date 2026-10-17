import sys,re,json
mem={}; regs={'ax':None,'dx':None,'al':None}
order=[]
def st(addr,val,size,pc):
    for k in range(size):
        mem[addr+k]=(val>>(8*k))&0xff if val is not None else None
    order.append((pc,addr,size,val))
for line in open(sys.argv[1]):
    parts=line.split(None,2)
    if len(parts)<3: continue
    pc=int(parts[0],16); ins=parts[2].strip()
    m=re.match(r'mov (word|byte) ptr \[(0x[0-9a-f]+|\d+)\], (0x[0-9a-f]+|\d+)$',ins)
    if m: st(int(m[2],0),int(m[3],0),2 if m[1]=='word' else 1,pc); continue
    m=re.match(r'xor (ax|dx), \1$',ins)
    if m: regs[m[1]]=0; continue
    m=re.match(r'mov (ax|dx|al), (0x[0-9a-f]+|\d+)$',ins)
    if m: regs[m[1]]=int(m[2],0); continue
    m=re.match(r'mov (word|byte) ptr \[(0x[0-9a-f]+|\d+)\], (ax|dx|al)$',ins)
    if m: st(int(m[2],0),regs[m[3]],2 if m[1]=='word' else 1,pc); continue
    m=re.match(r'mov (ax|dx), word ptr \[(0x[0-9a-f]+)\]$',ins)
    if m: regs[m[1]]=None; continue
json.dump({'order':order},open(sys.argv[2],'w'))
print(len(order),'stores')
