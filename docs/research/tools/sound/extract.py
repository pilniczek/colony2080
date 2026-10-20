import sys,subprocess,imageio_ffmpeg,numpy as np
ff=imageio_ffmpeg.get_ffmpeg_exe()
src,out=sys.argv[1],sys.argv[2]
raw=subprocess.run([ff,'-v','error','-i',src,'-vn','-ac','1','-ar','22050','-f','s16le','-'],capture_output=True).stdout
a=np.frombuffer(raw,np.int16).astype(np.float32)/32768
np.save(out,a); print(out,len(a)/22050)
