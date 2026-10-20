import os
import sys

import pycdlib

iso_path, out = sys.argv[1], sys.argv[2]
iso = pycdlib.PyCdlib()
iso.open(iso_path)
os.makedirs(out, exist_ok=True)
count = 0
for name in iso.list_children(iso_path='/ZVUKY'):
    ident = name.file_identifier().decode('latin1')
    plain = ident.split(';')[0]
    if not plain.upper().endswith('.SND'):
        continue
    iso.get_file_from_iso(os.path.join(out, plain), iso_path='/ZVUKY/' + ident)
    count += 1
print(count)
