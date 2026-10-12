#!/bin/sh
# Recipe that produced assets/ddb-intro-*.mp4 from the two supplied videos. Run from an empty work directory that contains:
#   ../repo/divine-hero/release/1.20.2/assets/hero-band-1640.webp (the hero picture), ../models/selfie_multiclass_256x256.tflite
#   (https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite)
#   and a Python venv with numpy, pillow, scipy, ai-edge-litert at ../mpenv. A = the turning model (13.6 s), B = origin film (8.35 s).
set -e
A="$1"; B="$2"; PY=../mpenv/bin/python
mkdir -p A Bf T
ffmpeg -v error -y -t 3.95 -i "$A" -vf "scale=1280:720:flags=lanczos" -start_number 0 A/f%03d.png
ffmpeg -v error -y -i "$B" -vf "crop=1270:980:325:0,scale=1280:988:flags=lanczos" -start_number 0 Bf/b%03d.png   # crop keeps the burned-in caption out
python3 align.py            # finds the frame -> hero transform (1.275, 1.125, -100, 312), already written into plate.py
$PY matte.py                # static bed + pillow key
$PY alpha.py                # per-frame matte of model + pillow + mattress (Am/)
$PY plate.py                # the clean stage: hero sky without the woman and the burned-in words
$PY comp.py                 # graded model composited on the stage in the hero frame (C/)
$PY act1.py                 # origin shots in the hero palette (O1/)
ffmpeg -v error -y -framerate 30 -start_number 8 -i C/c%03d.png -vf "trim=end_frame=109,setpts=1.2*(PTS-STARTPTS),minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" -start_number 0 T/t%03d.png
$PY assemble.py             # whole film as PNG frames (F/)
ffmpeg -v error -y -framerate 30 -i F/f%04d.png -c:v libx264 -preset slow -crf 22 -profile:v high -pix_fmt yuv420p -movflags +faststart -an ddb-intro-1280.mp4
ffmpeg -v error -y -framerate 30 -i F/f%04d.png -vf scale=960:742:flags=lanczos -c:v libx264 -preset slow -crf 24 -profile:v high -pix_fmt yuv420p -movflags +faststart -an ddb-intro-960.mp4
ffmpeg -v error -y -framerate 30 -i F/f%04d.png -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 -pix_fmt yuv420p -an ddb-intro-1280.webm
ffmpeg -v error -y -framerate 30 -i F/f%04d.png -vf scale=960:742:flags=lanczos -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 -pix_fmt yuv420p -an ddb-intro-960.webm
ffmpeg -v error -y -i F/f0000.png -c:v libwebp -quality 72 ddb-poster-1280.webp
ffmpeg -v error -y -i F/f0000.png -vf scale=960:742 -c:v libwebp -quality 72 ddb-poster-960.webp
