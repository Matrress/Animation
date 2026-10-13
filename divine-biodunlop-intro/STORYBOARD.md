# BioDunlop intro – storyboard, timing, light, sources

## What happens (owner's brief, 13 Oct)

**1. Page load (8.4 s, skippable).** The hero appears clean, *without hotspots*. The woman lies on her back; she turns slowly onto her side, settles into the mattress and is still. Only then do the hotspots light up one after another and start to pulse. The hero's own picture, words, mattress and sky stay the hero's throughout: the film is laid *into* the hero picture and its last frame is the hero picture.

| Time | What | How it is made |
|---|---|---|
| 0 – 6.4 s | The turn: no constant speed. A slow start, weight transfer (a small speed ripple mid-turn), a long soft arrival | source turn (video A, 3.6 s of footage) slowed to about 0.6×, eased: `tau = ease(u)` + a 1.4 % ripple, motion-compensated frame blending |
| 6.4 – 8.4 s | Settling: the body sinks into the bed (about 9 px at 1640 px, rebounds with a small overshoot), the **upper shoulder rises a little with the arrival and lets go a moment later**, the **shoulder blade shifts and trembles** (about 2.3 Hz, dying out), the **upper back gives** (about 4 px, delayed), the back **breathes** (3.5 ‰ swell). Everything returns to the hero pose exactly at the end | soft displacement fields (Gaussians placed on the body in the hero picture), zero at the start of the settle and zero at the end |
| last 0.9 s | the model's pixels become the hero photo's own (so the hero picture's light and shadow are exact) | cross-blend to the hero picture |
| then | hand-over: the stage fades (0.45 s), hotspots light up (0.7 s cascade) | CSS |

The **head is not changed**: no field acts on it (the largest field near it is the breathing swell, about 2 px).

**2. Spinal Alignment point.** Hotspots are suspended. The hero's own back screen waits (`data-ddb-hold`). A 5.2 s clip plays: the body rolls a little back (to about 80 % of the way to the original supine pose) and settles again, ending in the exact hero pose. When it ends, the existing spinal animation starts (vertebrae, then the labels, in their established order).

**3. The wordmark (hidden).** A mouse resting on *DIVINE Dunlop Dreams* for about 0.8 s plays the same turn-again clip. Never over a card, never on touch, 8 s cooldown.

**4. Original Dunlop Technology card.** The card opens on the right; a rounded video window opens in the marked area on the left (the red rectangle of the brief). The loop: the cut in the bark, the latex running down, a drop forming, falling into the cup, ripples and a small splash; 6 s, seamless, a slow camera drift.

## Light and skin

* Every frame of the film was matched to the hero photo: colour (a 3 × 4 transform fitted on the final pose), then a **luminance curve** (histogram match on the skin, pillow and bed of the final frame) and a **shading map** (where the hero photo is lighter or darker than the film, low-pass filtered), so the shoulders, upper arm, back, neck and the contact with the bed carry the hero's light and shadow, ramped in as the body arrives.
* The model's cut-out has clean edges: the dark outline of the studio background is replaced by the colour of the skin next to it.
* No plastic skin: sharpening is mild (0.28), a fine film grain (σ 2.0) is added to the model only and fades out as the hero's own pixels take over.
* The hero's words and the small mattress picture stay: the mattress lies in front of the bed *and* of the model, the words lie over everything as a difference layer.

## Sources

| File | Used for | Limits |
|---|---|---|
| video A (1920 × 1080, 13.6 s) | the turn (0.27 – 3.9 s) | studio background changes white → grey → black: keyed (person model for the start, a sensitive key once the background is black). The caption is cropped away. 4 – 13.6 s is black: unused |
| video B (1920 × 1080, 8.4 s) | the tree (frame at 3.6 s) | posterised and over-exposed; the stream does not reach the cup. The tree, graded, is only the *backdrop*; the latex, the cup and the motion are drawn |
| Hero 1.20.2 picture | the stage: sky, clouds, bed, pillow, mattress, words, light | — |

## Limits (honest)

* The turn comes from an existing clip: its anatomy is whatever that clip shows. The extra movements are **soft fields, deliberately small** (a few pixels): a 2D picture cannot be re-posed. They give the settle life; they cannot create a new motion.
* The tree is a stylised backdrop under drawn latex, not footage of tapping. A real macro shot would be better.
* The sourcing loop is not tied to a real plantation: it shows the process, not a place.
* Machine translations for the extra line in the blue band (8 languages).

## Assets that would make it premium

1. A real macro of tapping: bark cut, latex running, drops into a cup (≥ 1920 × 1280, 4 s, loopable).
2. The same shoot as the hero picture with the model *turning from the other side* or a second settle take (for variety), and ideally an **empty-bed plate** (same camera, no model) so no sky/bed has to be reconstructed.
3. Graded deliverables without text, no audio, 16-bit PNG or ProRes.
