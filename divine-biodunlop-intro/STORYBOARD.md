# BioDunlop intro – storyboard, timing, colour, sources

## The idea (director's note)

One continuous thought, told without words on screen: *the material comes from a living tree and ends as the surface under a sleeping body.* The camera never cuts hard. Every shot dissolves into the next through **white**: the sun's haze, the latex stream, the milk's surface, the white latex pillow and mattress. White carries the story from tree to bed. The last frame is not "the end of a video": it is the hero picture itself, so the page does not change, it simply comes alive.

Apple-style rules followed: one idea per shot, slow camera (push-ins of 6–15 %), no text burned into the picture, one quiet line of real type, brand colour throughout, sound-free, and the product (the latex sleep surface with the model on it) is the hero of the last half.

## Six frames

| # | Time (s) | Frame | Source | Camera / effect |
|---|---|---|---|---|
| 1 | 0.00 – 1.10 | **Morning in the plantation hills.** Sun haze over the trees, mint sky. | Video B 0.0 – 1.0 s | slow push-in 1.00 → 1.07, the line *"From natural latex milk to a complete natural latex sleep system."* rises at 0.5 s |
| 2 | 1.10 – 2.30 | **The tapped tree.** A white stream of latex runs down the bark into the cup. | Video B 2.4 – 3.9 s | dissolve 0.35 s; push-in 1.05 → 1.20 toward the cup; soft focus (the source is posterised) |
| 3 | 2.30 – 3.55 | **Natural latex milk.** The milky surface in slow rings, brightening to cool white. | Video B 6.35 – 7.95 s | dissolve 0.35 s; push-in 1.00 → 1.07; lifts to milky white from 3.15 s; the line fades at 3.2 s |
| 4 | 3.55 – 3.95 | **Milk becomes the latex sleep surface.** White dissolves into the mint stage: the latex pillow and mattress with the model lying on her back. | white → video A frame 8 | 0.4 s dissolve |
| 5 | 3.95 – 8.20 | **The turn.** The model turns slowly from her back onto her side, in the hero's own sky. | Video A 0.27 – 3.9 s, 1.2× slower (motion-interpolated) | locked camera, already in the hero's frame and scale |
| 6 | 8.20 – 8.50 → +0.9 | **Hand-over.** She rests in the exact pose of the hero picture. The film dissolves into the live hero; LATEX lockup rises, the points light up one by one. | last frame held, then the live Hero 1.20.2 | 0.9 s dissolve + ≈ 0.7 s point cascade |

Stills: `storyboard/frame-01.jpg` … `frame-06.jpg`.

## Exact timing (desktop and tablet)

```
0.0 ─ forest ─ 1.1 ─ tree ─ 2.3 ─ latex milk ─ 3.55 ─ white→stage ─ 3.95 ─ the turn ─ 8.2 ─ hold ─ 8.5 │ dissolve 0.9 │ points 0.7
      line in 0.5 ─────────────────── line out 3.2
```
Total until the hero is interactive: **≈ 9.4 s** (Skip at any moment, < 0.3 s to the hero).

The owner asked for a slower turn than the source. The English brief targeted 4.5–6 s. This cut follows the owner: the origin is compressed into 3.5 s and the turn gets 4.25 s. A shorter cut (turn at 1.0× ≈ 3.5 s, total ≈ 7.6 s) is one ffmpeg parameter (`setpts=1.0*PTS`) if wanted.

**Phones:** no intro (owner's instruction "laptops, monitors and tablets only"). The phone hero stays exactly 1.20.2.

## Colour treatment

All colours are taken from the hero picture, not invented:

| Tone | RGB | From |
|---|---|---|
| deep shadow | 16, 38, 38 | below the hair |
| hair | 31, 58, 52 | hero hair |
| skin / mid | 128, 168, 160 | hero back |
| light | 190, 232, 226 | — |
| pillow | 205, 250, 238 | hero pillow |
| milky white | 238, 252, 248 | latex highlight |
| sky (top → horizon) | 171, 201, 212 → 205, 255, 236 | hero sky |

* **Shots 1–3 (origin):** a luminance → brand-colour map (a "gradient map" through the tones above), keeping 6–10 % of the original colour so greens read as natural mint, not grey. The tree shot is lifted (shadows toward mid-teal) so it sits in the light world. White latex stays white (top of the map is milky white, never green).
* **Shots 4–6 (model):** the model, pillow and mattress are cut out of their studio background. A 3 × 4 colour transform was fitted on the final frame against the hero picture (least squares, robust), so the film's last frame has the hero's exact tint and contrast. The background is the hero's own sky ("clean stage": the hero picture with the woman and the burned-in words removed, clouds kept).

## Reusable source sections (supplied files)

**Video A** `46d9e1a4-…mov` (1920 × 1080, 13.6 s, AAC audio, caption burned in):
* 0.0 – 3.9 s: the model on the latex pillow and mattress turns from her back to her side. Same shoot as the hero picture; the end pose matches the hero (scale 1.275 × 1.125, offset −100 / 312 px on the 1640 hero picture). **Used.**
* Background changes white → grey → black during the turn. Removed: person segmentation (MediaPipe selfie-multiclass) + per-frame colour key + a static key for the bed and pillow, refined with a guided filter.
* 4.0 – 13.6 s: black with caption only. **Not used.**

**Video B** `0de2d2dc-…mov` (1920 × 1080, 8.35 s, AAC audio, caption burned in):
* 0.0 – 1.05 s forest at sunrise (CG). **Used.**
* 1.1 – 1.4 s black; 1.5 – 2.0 s fade-in.
* 2.0 – 5.5 s tapped tree, latex stream and cup. Heavily posterised (flat black and white shapes). **Used, softened.**
* 5.6 – 6.0 s black.
* 6.0 – 8.35 s latex milk surface with rings (CG). **Used.**
* The caption "Natural Origin & Natural Sleep System" sits at x 975–1887, y 990–1038 (1080p) in both files. It is **cropped out** of every frame: B is cut to the hero's 1.2954 frame above y 980; A's bed is faded out above the caption line, and the hero's own bed continues below.
* No audio is used (the web files have no audio track).

The supplied files differ from the brief's description ("21.5 s, 910 × 512 MP4"): they are two 1080p MOVs. The resolution is good for 1280-wide delivery.

## Limitations of this prototype (not disguised)

1. **Tree shot (frame 2).** The source is posterised to flat black-and-white shapes. Softened and lifted it reads as a graphic, misty memory of a tapped tree, not as live footage. **Needs a real shot.**
2. **No real "drop → Dunlop foam cells → latex core" transformation.** The supplied material has no drop close-up, no foam structure and no mattress core. The prototype dissolves milk → white → the latex pillow and mattress. It is believable and calm, but it is not the cell-structure match-cut of the brief.
3. **Arm leaving the frame.** In the source the raised arm leaves the top of the frame (5.8 – 6.8 s). It fades softly there instead of being cut.
4. **Arm in the last pose.** The hero picture is a different moment of the same shoot: the arm lies slightly further back. The 0.9 s dissolve absorbs it; a frame-perfect match needs the final render to end on the hero pose.
5. **Motion interpolation.** The 1.2× slow-down uses motion-compensated interpolation. Slight smear is possible on the fastest arm movement.
6. **Studio light vs hero.** The colour fit matches the end frame. Earlier frames (white studio background) can look a touch lighter on the edges.

## Assets still needed for the premium version

1. **Macro of tapping (real footage or a CG render), 3–4 s, ≥ 1920 × 1482** (or 4:3 framed for a 1.295 crop): tapping cut on the bark, latex milk running in the channel, two or three slow drops into the cup, camera approaching the last drop.
2. **Drop → structure render, 1.5–2 s:** entry into the drop, the liquid surface turning into the open-cell, pin-cored structure of Dunlop latex foam (the perforations), pulling back to reveal a clean latex core.
3. **Core → mattress → hero pose:** the core becoming the finished mattress (cover on), ending on the **exact hero frame**: the hero picture's camera, scale, the pillow and the model's pose (or a render of the empty bed that the existing turn shot can be laid into).
4. **Graded deliverables:** ProRes 422 HQ or 16-bit PNG, 30 fps, no text, no audio, mint grade per the table above (or ungraded plus a LUT).
5. **Optional:** a 9:16 cut, if phones should ever get the intro (not planned).

## Hand-over frame (for any future render)

The last frame must be the hero frame: 1640 × 1266 coordinates of `hero-band-1640.webp`, the model's back, hair and pillow at the hero positions. The film is delivered at 1280 × 988 (and 960 × 742), which is the same frame scaled.
