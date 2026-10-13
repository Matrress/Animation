# Divine DunlopDreams – BioDunlop intro (0.3.4-dev)

Development prototype. **Not deployed, not in the production embed.** Hero 1.20.2 (`divine-hero/release/1.20.2/`, commit `f727e88`) is not modified by anything in this folder.

The story is split in two (owner's briefs of 13 Oct; 0.3.4-dev = the fifth round of corrections, same day):

* **Three film sizes:** 1640 (iPads and large screens, the hero picture's own width), 1280, 960 (smaller windows). The browser picks by the window's pixel width and downloads one.
* **The end of every turn is a slow dissolve** (1.4 s opening, 1.5 s turn again): the last frame of the film is the hero picture and it flows into the live hero (light and colour), the points come out under it. The films are tagged BT.709 (matrix and tags) so Safari and Chrome show the same colours as the live picture.
* **The model** turns slowly in the hero picture itself, three ways: **every time the page loads or is reloaded** (hotspots appear only after the body has turned), at the moment the **Spinal Alignment** point is used (the old spinal animation starts only after the body is still), and from a hidden spot on the wordmark. It is a plain, smooth rotation: no settling, no extra shoulder / blade / back movements (0.2.0's "natural movement" corrections were taken out).
* **Natural sourcing** lives in the **Original Dunlop Technology** card: a rounded video window opens beside the card, loops while the card is open and stops when it closes. The loop (8.9 s) is the **supplied footage** only, nothing drawn: the tapped tree, the latex running and the cup filling, then the mixture **poured** (the supplied pouring footage, slowed), then it starts again.

| | |
|---|---|
| Namespace | `.ddb` + `html[data-ddb-*]` state attributes; it never edits `.ddh` files |
| Devices | laptops, monitors, tablets (window ≥ 701 × 501). Not on phones |
| Opening turn | 8.7 s (8.2 s turn, the last 1.6 s of it blending into the hero's own pixels, + 0.5 s still), on every load of the page (`ONCE=1` in the gate = once per browser session). No Skip button (Escape still ends it) |
| Turn again | 7.1 s (the body rolls back about 60 %, then turns forward again), starts the moment the point is used; 0.6 s guard (8 s for the wordmark) |
| Weight | intro.css 5 KB + intro.js 9 KB (minified, before compression). Films: opening 0.8 MB (1640) / 0.51 MB (1280) / 0.28 MB (960), turn again 0.6 / 0.4 / 0.22 MB (fetched while the opening plays), sourcing loop 0.27 MB (+ 22 KB poster; only when its card is first opened). WebM fallbacks are about the same. One file per kind per visit |

## The state controller (intro.js)

One object decides everything: `phase` is `off` (nothing allowed: phones, reduced motion, Data Saver, 2G/3G), `opening`, `idle` or `turn`. Every trigger asks it first.

| It prevents | How |
|---|---|
| overlapping body turns | `turn()` only starts from `idle`; `turn` ends only by the film's `ended` (or a 14 s safety) |
| rapid re-triggering | guard after every turn: 0.6 s (Spinal Alignment), 8 s (wordmark) |
| the Spinal Alignment film not there yet | it is requested as soon as the opening plays; a press that comes first waits up to 0.9 s for it, then the hero simply works |
| hotspots before the first turn has settled | during `opening` the hotspots are hidden **and** `inert`; they light up in the hand-over |
| hotspots taking over during a turn | during every body movement (the opening, the Spinal Alignment point, the wordmark) all the points, the hint and the LATEX note fade away and `.ddh__points` is `inert`; the Shop buttons and the page stay and work. When the body is still they come out one after another (1.25 s each, 0.12 s apart) |
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
* **Loop:** the origin film's tapping scene (caption removed, flicker of the posterised bark calmed, graded into the window's palette, slow push-in) → dissolve → the pour (0.36×, caption cropped away) → dissolve. The earlier drawn latex (0.2.0 and 0.3.0) was dropped: it looked like a cartoon.
* **Blue band:** `Naturally Sourced · Custom-Made Sleep Systems` (8 languages, machine-translated like the rest) is the secondary line. The older subtitle (*Custom Made Sleep Systems*) says the same, shorter: it stays in the page but is not drawn.

## Files

```
divine-biodunlop-intro/
  README.md  STORYBOARD.md  SEO-PERFORMANCE.md
  src/intro.js | intro.css | gate.html         sources (gate = inline "may it play?" script)
  assets/                                        ddb-turn-*, ddb-again-* (1280/960, .mp4 + .webm), ddb-poster-*, ddb-latex.mp4/.webm/-poster.webp
  release/0.3.0-dev/                             minified CSS/JS + assets; release/0.1.0-dev and 0.2.0-dev are earlier prototypes, kept for their pinned commits
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
open http://127.0.0.1:8766/divine-biodunlop-intro/preview/intro.html     # the opening plays on every load; ?ddb=2 skips it (turns still work)
node tests/intro.mjs && node tests/candidate.mjs
```

## Integrating (when approved)

`candidate/section-1.21.0-dev-jsdelivr.html` is the unchanged 1.20.2 section plus: the gate `<script>` before `<section class="ddh">`; `intro.css` / `intro.js` after the hero's own; `<div class="ddb">`, `<div class="ddb-lx">` and the crawlable line at the end of `.ddh__plane`; and `<script>window.DDBIntro&&DDBIntro.boot()</script>` after the hero's boot. Pin the intro files to a commit (`JSDELIVR_REF=<sha> node tools/build.mjs`). About 1.7 KB is added to the pasted section.

## If you do not see something

* The opening plays on **every load** of the page. `?ddb=1` forces it, `?ddb=2` skips it, `?ddb=0` switches everything off. To play it only once per browser session set `ONCE=1` in the gate.
* Phones, reduced motion, Data Saver, 2G/3G: no body movement (the hero shows at once). Data Saver and reduced motion still show the sourcing window with its poster.
* If a file is blocked or slow the hero simply shows (4 s limit); the card then works as before.

## Off / rollback

`var ON=1` → `var ON=0` in the gate switches all of it off (nothing downloads). Delete the additions to get the 1.20.2 section byte for byte; production rollback = the 1.20.2 block in `divine-hero/INSTALL.md`.

## Replacing the films later

Keep the names and the frame: 1640 × 1266, 1280 × 988 and 960 × 742, 30 fps, H.264 High, `+faststart`, no audio. The first and last frame of `ddb-again-*` must be the hero's pose; the last frame of `ddb-turn-*` too (the dissolve into the live hero is then invisible). The sourcing loop is 768 × 512, 24 fps, 8.9 s, seamless (it dissolves tree → pour → tree).
