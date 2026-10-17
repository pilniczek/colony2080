import sys
ok=set(range(32,127))|set(range(128,256))
def good(b):
    s=b.decode('cp852')
    letters=sum(c.isalpha() for c in s)
    return letters>=max(3,len(s)*0.5) and all(x in ok for x in b)
data=open(sys.argv[1],'rb').read()
minlen=int(sys.argv[2]) if len(sys.argv)>2 else 4
i=0;out=[]
while i<len(data):
    L=data[i]
    if L>=minlen and i+1+L<=len(data) and good(data[i+1:i+1+L]):
        print(f"{i:08x} P {data[i+1:i+1+L].decode('cp852')}")
        i+=1+L;continue
    i+=1
