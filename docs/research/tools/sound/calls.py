import re,sys
D=sys.argv[1]
names={1:'signal',2:'vrata',3:'krok3',4:'ikona',5:'p1_cann',6:'laser3',7:'uder',8:'sirena3',9:'vybuch6',10:'vybuch2',11:'nic',12:'L12(df7e)',13:'L13(df80)',14:'L14(df82)',15:'L15(df84)',16:'L16(df86)',17:'L17(df88)',18:'L18(df8a)',19:'L19(df8c)',20:'strelba',21:'hrom',22:'vytah1',23:'vytah2',24:'dvere2',25:'zkrat',26:'L26(df9a mriz2/vrata2)',27:'odlet',28:'laser2',29:'vrata1',30:'vrata2',31:'slow'}
for s in range(1,13):
    L=open(f'{D}/seg{s}.txt').read().splitlines()
    for i,l in enumerate(L):
        if 'lcall 3, 0x4f8e' in l:
            ps=[]
            j=i-1
            while j>i-12 and len(ps)<3:
                m=re.search(r'push (.+)$',L[j])
                if m: ps.insert(0,m[1].strip())
                j-=1
            def v(x):
                try: return int(x,0)
                except: return x
            ps=[v(x) for x in ps]
            nm=names.get(ps[0],ps[0]) if ps else '?'
            print(f'{s}:{l.split()[0]} id={ps[0] if ps else "?"} {nm} vol={ps[1] if len(ps)>1 else "?"} rate={ps[2] if len(ps)>2 else "?"}')
