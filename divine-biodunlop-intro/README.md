# Divine DunlopDreams – BioDunlop intro (0.4.1-dev)

Development prototype. **Not deployed, not in the production embed.** Hero 1.20.3 (`divine-hero/release/1.20.2/`, commit `f727e88`) is not modified by anything in this folder.

**0.4.0-dev (14 Oct): the body turn is gone.** The owner withdrew it after the seventh round of failed renders (smeared, "deconstructed" hair). Everything else from the earlier rounds stays; nothing is rendered or turned any more. The model is the hero picture, still.

* **Page load (every load and reload; `ONCE=1` in the gate = first load of a browser session only):** the model (the hero picture) is shown first, still. The points, the hint and the wordmark lockup wait (`html[data-ddb=pending]`, hidden; the Shop buttons stay), a beat (0.45 s) after the picture has loaded they come out of the model one after another (1.25 s each, 0.12 s apart, growing from the point with a soft blur) and then pulse as in the hero. If the picture is slow, they are released after at most 2.5 s; if the intro files fail, the gate's own timer (3.6 s) releases them.
* **Spinal Alignment point, wordmark:** nothing of ours; the hero's own behaviour (the vertebra animation and words start at once; the wordmark does nothing).
* **Natural sourcing** lives in the **Original Dunlop Technology** card: a rounded video window opens beside the card, loops while the card is open and stops when it closes. The loop (8.9 s) is the **supplied footage** only: the tapped tree, the latex running and the cup filling, then the mixture **poured**, then it starts again. The blue band shows `Naturally Sourced · Custom-Made Sleep Systems`.

| | |
|---|---|
| Namespace | `.ddb` + `html[data-ddb-*]` state attributes; it never edits `.ddh` files |
| Devices | laptops, monitors, tablets (window ≥ 701 × 501). Not on phones; reduced motion / Data Saver / 2G–3G: the hero as it is, points at once |
| Weight | intro.css 3.4 KB + intro.js 5.4 KB (minified, before compression); the sourcing loop 0.27 MB (+ 22 KB poster), requested only when its card is first opened |

## The controller (intro.js)

`DDBIntro.phase`: `off` (nothing allowed), `reveal` (the model is shown, the points wait), `idle`. The video window is tied to the hero's own state attribute (`data-ddh-state=zones`): it starts when the card opens and pauses + rewinds on close / another hotspot / hidden tab. Reduced motion: the card shows the poster only.

## The sourcing video

* **Wide windows (side):** a rounded window (26 px radius, same border and shadow as the card) in the marked area: left 3.3 %, top 35.6 %, 39.4 % × 34.2 % of the hero picture, so it follows the picture at every size. It opens from the hotspot like the card (0.62 s) and does not move or resize the hero.
* **Where the card would touch it (narrower or lower windows):** decided when the card opens, from the card's real position: the video sits **inside the card, under the blue band**. Tablets held across (1024 × 768) still get the window.
* Only this card starts it; muted, `playsinline`, looping, poster shown at once (WebP background); no text over the video.
* **Loop:** the origin film's tapping scene (caption removed, flicker of the posterised bark calmed, graded into the window's palette, slow push-in) → dissolve → the pour (0.36×, caption cropped away) → dissolve. The earlier drawn latex (0.2.0 and 0.3.0) was dropped: it looked like a cartoon.
* **Blue band:** `Naturally Sourced · Custom-Made Sleep Systems` (8 languages, machine-translated like the rest) is the secondary line. The older subtitle (*Custom Made Sleep Systems*) says the same, shorter: it stays in the page but is not drawn.

## Files

```
divine-biodunlop-intro/
  README.md  STORYBOARD.md  SEO-PERFORMANCE.md
  src/intro.js | intro.css | gate.html         sources (gate = inline "may it play?" script)
  assets/                                        ddb-latex.mp4/.webm/-poster.webp (the sourcing loop)
  release/0.4.0-dev/                             minified CSS/JS + assets; earlier releases (0.1–0.3.x, with the body turn) are kept only for their pinned commits
  candidate/section-1.21.0-dev-jsdelivr.html     integration candidate: the 1.20.2 section + the additions
  preview/intro.html                             local preview in the Instant Site imitation
  tests/intro.mjs  tests/candidate.mjs (the pasted candidate, delivered four ways)
  tools/build.mjs  tools/serve.py  tools/render/ the scripts that made the (now retired) turning films and the sourcing loop
  seo/videoobject.draft.json
```

## Preview and tests

```sh
cd divine-biodunlop-intro
python3 tools/serve.py 8766 &
open http://127.0.0.1:8766/divine-biodunlop-intro/preview/intro.html     # the points come out of the still model on every load; ?ddb=2 shows them at once
node tests/intro.mjs && node tests/candidate.mjs
```

## Integrating (when approved)

`candidate/section-1.21.0-dev-jsdelivr.html` is the unchanged 1.20.2 section plus: the gate `<script>` before `<section class="ddh">`; `intro.css` / `intro.js` after the hero's own; `<div class="ddb-lx">` and the crawlable line at the end of `.ddh__plane`; and `<script>window.DDBIntro&&DDBIntro.boot()</script>` after the hero's boot. Pin the intro files to a commit (`JSDELIVR_REF=<sha> node tools/build.mjs`). About 1.7 KB is added to the pasted section.

## If you do not see something

* The opening plays on **every load** of the page. `?ddb=1` forces it, `?ddb=2` skips it, `?ddb=0` switches everything off. To play it only once per browser session set `ONCE=1` in the gate.
* Phones, reduced motion, Data Saver, 2G/3G: no body movement (the hero shows at once). Data Saver and reduced motion still show the sourcing window with its poster.
* If a file is blocked or slow the hero simply shows (4 s limit); the card then works as before.

## Off / rollback

`var ON=1` → `var ON=0` in the gate switches all of it off (nothing downloads). Delete the additions to get the 1.20.2 section byte for byte; production rollback = the 1.20.2 block in `divine-hero/INSTALL.md`.

## Replacing the films later

Keep the names and the frame: 1640 × 1266, 1280 × 988 and 960 × 742, 30 fps, H.264 High, `+faststart`, no audio. The first and last frame of `ddb-again-*` must be the hero's pose; the last frame of `ddb-turn-*` too (the dissolve into the live hero is then invisible). The sourcing loop is 768 × 512, 24 fps, 8.9 s, seamless (it dissolves tree → pour → tree).
