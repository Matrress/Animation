# BioDunlop intro – storyboard, timing, light, sources (0.3.3-dev)

## What happens (owner's brief and corrections, 13 Oct)

**1. Every load or reload of the page (8.7 s, no Skip button).** The hero appears clean, *without hotspots*. The woman lies on her back; she turns slowly onto her side. Only when the turn is finished do the hotspots light up one after another and start to pulse. The hero's own picture, words, mattress and sky stay the hero's throughout: the film is laid *into* the hero picture and its last frame is the hero picture.

| Time | What | How it is made |
|---|---|---|
| 0 – 8.2 s | The turn: a plain, smooth rotation: slow start, long soft arrival, constant-pace path, no ticking | the clip carries only every 3rd frame as a new picture (about 10 pictures a second, the rest are repeats: that made the old film tick). The real pictures are found, the motion between them is measured (optical flow) and re-timed along its path length, with smootherstep easing; frames in between are motion-compensated blends |
| 6.6 – 8.2 s | the model's pixels become the hero photo's own (so the hero picture's light and shadow are exact) while the last of the movement dies out | cross-blend to the hero picture |
| 8.2 – 8.7 s | still | |
| then | hand-over: the stage (its last frame is the hero) dissolves slowly (1.4 s) into the live hero; 0.45 s after it starts the hotspots and notes come out one after another (1.25 s each, 0.12 s apart, growing from a point, blur to sharp), then pulse | CSS |

0.2.0's "natural settling" (sinking into the bed, shoulder, shoulder blade, back, breathing) was taken out at the owner's request: the earlier look, a rotation, is back.

**2. Spinal Alignment point.** The body starts to move at the moment the point is used. Hotspots are suspended; the hero's own back screen waits (`data-ddb-hold`). The film (7.1 s: the body rolls back about 60 % towards the starting pose over 1.9 s, then turns forward again slowly, ending in the exact hero pose). All points, the hint and the LATEX note fade away while the body moves; only the Shop buttons stay; they come out again, one after another, when it is still. When it ends, the existing spinal animation starts (vertebrae, then the labels, in their established order). The film is requested while the opening plays; a press that comes before it has arrived waits up to 0.9 s.

**3. The wordmark (hidden).** A mouse resting on *DIVINE Dunlop Dreams* for about 0.8 s plays the same turn-again film. Never over a card, never on touch, 8 s cooldown.

**4. Original Dunlop Technology card.** The card opens on the right; a rounded video window opens in the marked area on the left (the red rectangle of the brief). The loop, 8.9 s, is the supplied footage only:

| Time | What |
|---|---|
| 0 – 0.8 s | dissolve from the pour; the tree appears out of the dark |
| 0.5 – 4.6 s | the supplied tapping footage (the latex runs down the bark, the cup fills and brightens), caption removed, bark flicker calmed over 0.25 s, graded into the window's teal palette, slow push-in |
| 4.6 – 5.4 s | dissolve |
| 5.4 – 8.9 s | **the pour**: the supplied pouring footage (thick cream folding into concentric layers), slowed to 0.36×, caption cropped away, lightly toned |

## Light and skin

* Every frame of the film was matched to the hero photo: colour (a 3 × 4 transform fitted on the final pose), then a **luminance curve** and a **shading map**, so the shoulders, upper arm, back, neck and the contact with the bed carry the hero's light and shadow, ramped in as the body arrives.
* The model's cut-out was cleaned (0.3.1): no specks or holes in the matte, a smoothed hair edge, about 5 px of the silhouette re-coloured from the solid interior (a light rim sat there), and the **lace bra** on the shoulder (it read as a glassy patch once graded) turned into the smooth skin-toned shape it is, shading kept.
* **The Dual Plush mattress (0.3.3):** the film now takes the mattress from the hero's own cut-out (`assets/mattress.webp`, placed exactly as hero.css places it) instead of a rough polygon that cut the lower-left of its base, and the soft shadow under it (the bed in front of it, to about 80 px below) is always the hero's own, so the mattress is whole and its shadow constant in every frame.
* **The bra strap (0.3.3):** it showed twice near the end because the film's last pose and the hero photo differ by a few pixels and a plain cross-fade shows both. The last blend is now a morph: the film's last pose is slid onto the hero's pixels (dense flow, at most 12 px) while it fades.
* **Hair (0.3.3):** gloss is capped a little above the hair's own dark level (no sheen band that reads as a dome or a cap), the detail the slow-down smoothed out is given back (sharpening 0.95 on the fine scale) and a fine grain of hair is added.
* **No balloons, no reflections (0.3.2):** skin and hair carried small bright glints, a glossy sheen on the hair and one broad shiny highlight on the shoulder that read as inflated / plastic once graded. Everything brighter than its own surroundings (edge-preserving medians at about 9 px and 60 px) is pulled back on skin and hair only; the pillow and bed are untouched.
* No plastic skin: sharpening is mild (0.12), a fine film grain (σ 2.0) is added to the model only and fades out as the hero's own pixels take over.
* The hero's words and the small mattress picture stay: the mattress lies in front of the bed *and* of the model, the words lie over everything as a difference layer.

## Sources

| File | Used for | Limits |
|---|---|---|
| video A (1920 × 1080, 13.6 s) | the turn (0.27 – 3.9 s) | studio background changes white → grey → black: keyed (person model for the start, a sensitive key once the background is black). The caption is cropped away. 4 – 13.6 s is black: unused |
| video B (1920 × 1080, 8.4 s) | **the tapping scene (1.5 – 5.5 s)** and **the pour (5.9 – 8.3 s, lit part from 6.7 s)** | the tapping scene is posterised and over-exposed. Both are used as shot (caption removed, graded / toned, the pour slowed) |
| Hero 1.20.2 picture | the stage: sky, clouds, bed, pillow, mattress, words, light | — |

## Limits (honest)

* The turn comes from an existing clip: its anatomy is whatever that clip shows; interpolating it to 0.38× can soften fast detail slightly.
* The roll-back of the turn-again film is the same footage played backwards, then forwards.
* The tapping scene is the supplied footage: posterised and over-exposed (white stream, white cup, almost no motion except the flicker of the bark). A real macro would be better.
* The pour is greyscale footage (toned halfway); it carries no information about where it is poured.
* Machine translations for the extra line in the blue band (8 languages).

## Assets that would make it premium

1. A real, properly exposed macro of tapping: bark cut, latex running slowly, a fat drop swelling and falling into a cup (≥ 1920 × 1280, 6 s, loopable).
2. The pouring shot in colour, longer than 3 s, without caption.
3. The same shoot as the hero picture with the model *turning from the other side* or a second take (for variety), and ideally an **empty-bed plate** (same camera, no model) so no sky/bed has to be reconstructed.
4. Graded deliverables without text, no audio, 16-bit PNG or ProRes.
