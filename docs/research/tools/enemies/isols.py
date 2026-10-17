import pycdlib,sys
iso=pycdlib.PyCdlib(); iso.open(sys.argv[1])
for root,dirs,files in iso.walk(iso_path='/'):
    for f in files:
        p=root.rstrip('/')+'/'+f
        rec=iso.get_record(iso_path=p)
        n=f.split(';')[0]
        if not n.upper().endswith(('.ANM','.GRA','.SND','.S3M')): print(p, rec.data_length)
