#!/bin/sh
# How assets/ddb-turn-*, ddb-settle-*, ddb-poster-* and ddb-latex* were made. Needs: ffmpeg, a Python venv (numpy, pillow, scipy, opencv-python-headless, ai-edge-litert),
# the MediaPipe selfie_multiclass_256x256.tflite model, the two supplied videos (A = the turning model, 13.6 s; B = the origin footage, 8.4 s) and Hero 1.20.2's
# hero-band-1640.webp. The scripts expect the work-directory layout used during development (vid/, m2/, lx/ side by side); paths are at the top of each file.
set -e
# 1. model layer (vid/): frames -> alpha (alpha.py: tight black-background key, person model for the grey/white start) -> clean edges + optical flow (m2/prep2.py)
# 2. hero layers (m2/): refs.py (the hero's words lifted off / as a difference layer), geo.py (video -> hero picture placement), plate.py (clean sky behind the model),
#    grade2.py (colour + luminance curve + shading map fitted to the hero photo)
# 3. film2.py A 0 252   and   film2.py B 0 156     (A: opening turn 8.4 s, B: roll back and settle 5.2 s)  -> PNG frames at 1280x988
# 4. latex_anim.py        (the natural-sourcing loop: 6 s, 24 fps, 768x512; the tree is the supplied footage, the latex is drawn)
# 5. encode (per clip): H.264 High crf 23 (1280) / 25 (960), +faststart, no audio;  VP9 crf 32 / 34 as WebM fallback;  posters = frame 0 as WebP q72
