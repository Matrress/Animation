#!/bin/sh
# How assets/ddb-turn-*, ddb-again-*, ddb-poster-* and ddb-latex* were made. Needs: ffmpeg, a Python venv (numpy, pillow, scipy, opencv-python-headless, ai-edge-litert),
# the MediaPipe selfie_multiclass_256x256.tflite model, the two supplied videos (A = the turning model, 13.6 s; B = the origin footage, 8.4 s) and Hero 1.20.2's
# hero-band-1640.webp. The scripts expect the work-directory layout used during development (vid/, m2/, lx/ side by side); paths are at the top of each file.
set -e
# 1. model layer (vid/): frames -> alpha (alpha.py: tight black-background key, person model for the grey/white start) -> clean edges + optical flow (m2/prep2.py)
# 2. hero layers (m2/): refs.py (the hero's words lifted off / as a difference layer), geo.py (video -> hero picture placement), plate.py (clean sky behind the model),
#    grade2.py (colour + luminance curve + shading map fitted to the hero photo)
# 3. m2/prep3.py 8 118 (clean matte: no specks / holes / rim, lace cup -> skin; writes cache3/) then m2/keyflow.py (finds the clip's real pictures - only every 3rd frame is new -
#    and the optical flow between them), then  film4.py A  and  film4.py B   (A: the opening turn 8.2 s + 0.5 s; B: the turn again, rolls back 62 % of the path and turns forward, 6.6 s + 0.5 s)
#    -> PNG frames at 1280x988. A plain rotation: no settling, no extra shoulder / blade / back movements, no ticking.
# 4. pour frames:  ffmpeg -ss 5.9 -i <video B> -vf "crop=1477:985:221:0,scale=768:512:flags=lanczos" -start_number 0 pour/fr/p%03d.png   (crops the caption away)
#    tapping frames: ffmpeg -ss 1.4 -t 4.3 -i <video B> -vf "fps=30,scale=1280:720:flags=lanczos" -start_number 0 pour/tap720/t%03d.png
#    latex_anim.py        (the sourcing loop: 8.9 s, 24 fps, 768x512: the supplied tapping footage -> the supplied pouring footage -> back; nothing drawn)
# 5. encode (per clip): H.264 High crf 23 (1280) / 25 (960), +faststart, no audio;  VP9 crf 32 / 34 as WebM fallback;  posters = frame 0 as WebP q72
