# Divine DunlopDreams – BioDunlop intro (0.2.0-dev)

Development prototype. **Not deployed, not in the production embed.** Hero 1.20.2 (`divine-hero/release/1.20.2/`, commit `f727e88`) is not modified by anything in this folder.

The story is split in two (owner's brief of 13 Oct):

* **The model** turns slowly in the hero picture itself, three ways: when the page loads (hotspots appear only after the body has settled), when the **Spinal Alignment** point is used (the old spinal animation starts only after the body is still), and from a hidden spot on the wordmark.
* **Natural sourcing** (latex milk dripping from a tapped rubber tree) lives in the **Original Dunlop Technology** card: a rounded video window opens beside the card, loops while the card is open and stops when it closes.

| | |
|---|---|
| Namespace | `.ddb` + `html[data-ddb-*]` state attributes; it never edits `.ddh` files |
| Devices | laptops, monitors, tablets (window ≥ 701 × 501). Not on phones |
| Opening turn | 8.4 s, skippable, once per session |
| Turn again | 5.2 s (roll back a little, settle), 2.5 s cooldown (8 s for the wordmark) |
| Weight | intro.css 5 KB + intro.js 9 KB (minified, before compression). Films: opening 0.49 MB (1280) / 0.26 MB (960), turn again 0.23 / 0.12 MB, sourcing loop 0.17 MB (+ 24 KB poster). WebM fallbacks are about the same. One file per kind per visit |

## The state controller (intro.js)

One object decides everything: `phase` is `off` (nothing allowed: phones, reduced motion, Data Saver, 2G/3G), `opening`, `idle` or `turn`. Every trigger asks it first.

| It prevents | How |
|---|---|
| overlapping body turns | `turn()` only starts from `idle`; `turn` ends only by the film's `ended` (or a 9 s safety) |
| rapid re-triggering | cooldown after every turn: 2.5 s (Spinal Alignment), 8 s (wordmark) |
| hotspots before the first turn has settled | during `opening` the hotspots are hidden **and** `inert`; they light up in the hand-over |
| hotspots taking over during a turn | `.ddh__points` is `inert` (pointer and keyboard), the stage swallows pointer events over the picture; the Shop buttons and the page stay outside it and work |
| Spinal Alignment starting before the body is still | `html[data-ddb-hold]` keeps the hero's own back screen `display:none` until the film ends; then the old vertebra animation and labels start in their established order |
| the wordmark interrupting a card | it is ignored while a hero state (card) is open or the video window is shown, and during any turn |
| the video playing unseen | on close / another hotspot / hidden tab: `pause()` + rewind to 0 |
| reduced motion | `phase` stays `off`: no turn, final state and hotspots at once; the card shows the poster only (no video) |

`DDBIntro.phase` exposes the phase for tests.

## The wordmark (hidden)

No element lies over it (so nothing it covers is blocked and its clicks are untouched): a `pointermove` on the picture checks whether the mouse is inside the wordmark's box (35–65 % × 26–36 % of the picture). A mouse resting there for about 0.8 s turns the body; a brief crossing does nothing; moving out cancels. Not on touch (no safe, non-conflicting touch behaviour exists).

## The sourcing video

* **Wide windows (side):** a rounded window (26 px radius, same border and shadow as the card) in the marked area: left 3.3 %, top 35.6 %, 39.4 % × 34.2 % of the hero picture, so it follows the picture at every size. It opens from the hotspot like the card (0.62 s) and does not move or resize the hero.
* **Where the card would touch it (narrower or lower windows):** decided when the card opens, from the card's real position: the video sits **inside the card, under the blue band**. Tablets held across (1024 × 768) still get the window.
* Only this card starts it; muted, `playsinline`, looping, poster shown at once (WebP background); no text over the video.
* **Blue band:** `Naturally Sourced · Custom-Made Sleep Systems` (8 languages, machine-translated like the rest) is the secondary line. The older subtitle (*Custom Made Sleep Systems*) says the same, shorter: it stays in the page but is not drawn.

## Files

```
divine-biodunlop-intro/
  README.md  STORYBOARD.md  SEO-PERFORMANCE.md
  src/intro.js | intro.css | gate.html         sources (gate = inline "may it play?" script)
  assets/                                        ddb-turn-*, ddb-settle-* (1280/960, .mp4 + .webm), ddb-poster-*, ddb-latex.mp4/.webm/-poster.webp
  release/0.2.0-dev/                             minified CSS/JS + assets; release/0.1.0-dev/ is the earlier (origin-story) prototype, kept for the pinned commit
  candidate/section-1.21.0-dev-jsdelivr.html     integration candidate: the 1.20.2 section + the additions
  preview/intro.html                             local preview in the Instant Site imitation
  tests/intro.mjs (83 checks)  tests/candidate.mjs (the pasted candidate, delivered four ways)
  tools/build.mjs  tools/serve.py  tools/render/ the scripts that made the films
  seo/videoobject.draft.json
```

## Preview and tests

```sh
cd divine-biodunlop-intro
python3 tools/serve.py 8766 &
open http://127.0.0.1:8766/divine-biodunlop-intro/preview/intro.html     # opening plays once per tab session; add ?ddb=1 to see it again
node tests/intro.mjs && node tests/candidate.mjs
```

## Integrating (when approved)

`candidate/section-1.21.0-dev-jsdelivr.html` is the unchanged 1.20.2 section plus: the gate `<script>` before `<section class="ddh">`; `intro.css` / `intro.js` after the hero's own; `<div class="ddb">`, `<div class="ddb-lx">` and the crawlable line at the end of `.ddh__plane`; and `<script>window.DDBIntro&&DDBIntro.boot()</script>` after the hero's boot. Pin the intro files to a commit (`JSDELIVR_REF=<sha> node tools/build.mjs`). About 1.7 KB is added to the pasted section.

## If you do not see something

* The opening plays **once per browser session**: add `?ddb=1` to the address, or use a private window. `?ddb=0` switches everything off.
* Phones, reduced motion, Data Saver, 2G/3G: no body movement (the hero shows at once). Data Saver and reduced motion still show the sourcing window with its poster.
* If a file is blocked or slow the hero simply shows (4 s limit); the card then works as before.

## Off / rollback

`var ON=1` → `var ON=0` in the gate switches all of it off (nothing downloads). Delete the additions to get the 1.20.2 section byte for byte; production rollback = the 1.20.2 block in `divine-hero/INSTALL.md`.

## Replacing the films later

Keep the names and the frame: 1280 × 988 and 960 × 742, 30 fps, H.264 High, `+faststart`, no audio. The first and last frame of `ddb-settle-*` must be the hero's pose; the last frame of `ddb-turn-*` too (the dissolve into the live hero is then invisible). The sourcing loop is 768 × 512, 24 fps, seamless.
