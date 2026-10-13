# BioDunlop intro – storyboard, timing, light, sources (0.3.0-dev)

## What happens (owner's brief and corrections, 13 Oct)

**1. Every load or reload of the page (10.5 s, skippable).** The hero appears clean, *without hotspots*. The woman lies on her back; she turns slowly onto her side. Only when the turn is finished do the hotspots light up one after another and start to pulse. The hero's own picture, words, mattress and sky stay the hero's throughout: the film is laid *into* the hero picture and its last frame is the hero picture.

| Time | What | How it is made |
|---|---|---|
| 0 – 9.6 s | The turn: a plain, smooth rotation: slow start, long soft arrival, no ripples, no extra movements | source turn (video A, 3.6 s of footage) slowed to about 0.38× (peak 0.7×), smootherstep easing, motion-compensated frame blending (about 2.7 interpolated frames per source frame) |
| 9.6 – 10.5 s | the model's pixels become the hero photo's own (so the hero picture's light and shadow are exact); the body is still | cross-blend to the hero picture |
| then | hand-over: the stage fades (0.45 s), hotspots light up (0.7 s cascade) | CSS |

0.2.0's "natural settling" (sinking into the bed, shoulder, shoulder blade, back, breathing) was taken out at the owner's request: the earlier look, a rotation, is back.

**2. Spinal Alignment point.** The body starts to move at the moment the point is used. Hotspots are suspended; the hero's own back screen waits (`data-ddb-hold`). The film (8.7 s: the body rolls back about 60 % towards the starting pose over 2.3 s, then turns forward again slowly, ending in the exact hero pose). When it ends, the existing spinal animation starts (vertebrae, then the labels, in their established order). The film is requested while the opening plays; a press that comes before it has arrived waits up to 0.9 s.

**3. The wordmark (hidden).** A mouse resting on *DIVINE Dunlop Dreams* for about 0.8 s plays the same turn-again film. Never over a card, never on touch, 8 s cooldown.

**4. Original Dunlop Technology card.** The card opens on the right; a rounded video window opens in the marked area on the left (the red rectangle of the brief). The loop, 10.5 s:

| Time | What |
|---|---|
| 0 – 6.4 s | the tapped tree. Latex is a heavy, creamy, greasy substance: a thin matte film creeps along the cut (a slow heavier patch slides down it); at the spout a fat drop swells for 2 s on a thread that stretches and thins, lets go, falls and sinks into the cup as a soft mound with two slow, low, fast-fading rings (no splash); the cup slowly fills |
| 6.4 – 7.2 s | dissolve |
| 7.2 – 9.7 s | **the pour**: the supplied footage of the cream being poured (thick, folding into concentric layers), slowed to 0.4× (4.1 s of slow, heavy flow), caption cropped away, lightly toned into the window's palette (half grey-white original) |
| 9.7 – 10.5 s | dissolve back to the tree (loop point inside the dissolve) |

## Light and skin

* Every frame of the film was matched to the hero photo: colour (a 3 × 4 transform fitted on the final pose), then a **luminance curve** and a **shading map**, so the shoulders, upper arm, back, neck and the contact with the bed carry the hero's light and shadow, ramped in as the body arrives.
* The model's cut-out has clean edges: the dark outline of the studio background is replaced by the colour of the skin next to it.
* No plastic skin: sharpening is mild (0.28), a fine film grain (σ 2.0) is added to the model only and fades out as the hero's own pixels take over.
* The hero's words and the small mattress picture stay: the mattress lies in front of the bed *and* of the model, the words lie over everything as a difference layer.

## Sources

| File | Used for | Limits |
|---|---|---|
| video A (1920 × 1080, 13.6 s) | the turn (0.27 – 3.9 s) | studio background changes white → grey → black: keyed (person model for the start, a sensitive key once the background is black). The caption is cropped away. 4 – 13.6 s is black: unused |
| video B (1920 × 1080, 8.4 s) | the tree (frame at 3.6 s) and **the pour (5.9 – 8.3 s, lit part from 6.7 s)** | the tree part is posterised and over-exposed; its stream does not reach the cup, so the tree is only the *backdrop* and the latex is drawn. The pour is used as shot (cropped 1477 × 985 from x 221, scaled, slowed, toned) |
| Hero 1.20.2 picture | the stage: sky, clouds, bed, pillow, mattress, words, light | — |

## Limits (honest)

* The turn comes from an existing clip: its anatomy is whatever that clip shows; interpolating it to 0.38× can soften fast detail slightly.
* The roll-back of the turn-again film is the same footage played backwards, then forwards.
* The tree is a stylised backdrop under drawn latex, not footage of tapping. A real macro shot would be better.
* The pour is greyscale footage (toned halfway); it carries no information about where it is poured.
* Machine translations for the extra line in the blue band (8 languages).

## Assets that would make it premium

1. A real macro of tapping: bark cut, latex running slowly, a fat drop swelling and falling into a cup (≥ 1920 × 1280, 6 s, loopable).
2. The pouring shot in colour, longer than 3 s, without caption.
3. The same shoot as the hero picture with the model *turning from the other side* or a second take (for variety), and ideally an **empty-bed plate** (same camera, no model) so no sky/bed has to be reconstructed.
4. Graded deliverables without text, no audio, 16-bit PNG or ProRes.
