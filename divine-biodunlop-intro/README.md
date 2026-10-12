# Divine DunlopDreams – BioDunlop intro (0.1.0-dev)

A short cinematic opening for the homepage hero: **natural origin → natural latex milk → the latex sleep surface → the model turns into the exact pose of the hero picture → the live, interactive Hero 1.20.2 takes over.**

Status: **development prototype. Not deployed, not in the production embed.** Hero 1.20.2 (`divine-hero/release/1.20.2/`, commit `f727e88`) is not modified by anything in this folder.

| | |
|---|---|
| Where | `divine-biodunlop-intro/` (next to `divine-hero/`) |
| Namespace | `.ddb` (own classes) + `html[data-ddb]` / `html[data-ddb-lit]` state attributes; it never edits `.ddh` files |
| Devices | laptops, monitors, tablets (window ≥ 701 × 501 CSS px). Not on phones (owner's decision) |
| Length | 8.5 s film + 0.9 s dissolve into the live hero; Skip at any moment |
| Weight | intro.css 3.9 KB + intro.js 3.3 KB (minified, before compression); film 1280 MP4 1.25 MB, 960 MP4 0.63 MB (WebM fallbacks 0.83 / 0.51 MB): one file per visit; poster 36 KB / 23 KB |

## Files

```
divine-biodunlop-intro/
  README.md                     this file (architecture, behaviour, rollback)
  STORYBOARD.md                 six frames, exact timing, colour treatment, source sections, limits, missing assets
  SEO-PERFORMANCE.md            Google visibility, structured data, Core Web Vitals, GSC checklist
  src/intro.js | intro.css      readable sources (vanilla, no framework)
  src/gate.html                 the inline "should it play?" gate (one switch: ON=0 turns the intro off)
  assets/                       ddb-intro-1280.mp4/.webm, ddb-intro-960.mp4/.webm, ddb-poster-1280.webp, ddb-poster-960.webp
  release/0.1.0-dev/            minified CSS/JS + assets: the files a section would load
  candidate/section-1.21.0-dev-jsdelivr.html   integration candidate: the stable 1.20.2 section + the intro lines
  preview/intro.html            local preview inside the Instant Site imitation used for the hero tests
  storyboard/                   storyboard stills (frame-01 … frame-06)
  seo/videoobject.draft.json    VideoObject draft (NOT published: values still to be confirmed)
  tests/intro.mjs               behaviour tests (Playwright)
  tools/build.mjs               build: minify, copy media, write candidate + preview
  tools/serve.py                preview server (repo root, HTTP Range for video)
  tools/render/                 the scripts that made the film from the two supplied videos
```

## If you do not see the intro

It plays **once per browser session** (so coming back from a product page shows the hero straight away). To see it again: add `?ddb=1` to the page address (ignores "already seen" and the connection checks; `?ddb=0` switches it off), or use a new private window. It never plays on phones, with reduced motion, with Data Saver or on 2G/3G. If a file of the pair is missing or blocked the hero simply shows (never an empty screen). The section must end with `<script>window.DDBIntro&&DDBIntro.boot()</script>` (the candidate has it).

## Preview

```sh
cd divine-biodunlop-intro
python3 tools/serve.py 8766 &           # serves the repository root
open http://127.0.0.1:8766/divine-biodunlop-intro/preview/intro.html
# play it again: open a new private window, or run sessionStorage.removeItem('ddb-seen') in the console
node tests/intro.mjs                    # behaviour tests (needs Playwright + Chromium)
node tests/candidate.mjs                # the pasted candidate, delivered four ways, with files missing
```

## How it works

1. **Gate (inline, before the hero markup).** Decides before the first paint: window ≥ 701 × 501, no reduced motion, no Data Saver, not 2G/3G, not yet seen in this session. Only then `<html data-ddb="pending">` is set. Without it nothing in this module applies and the page is exactly Hero 1.20.2.
2. **Stage.** `<div class="ddb">` sits inside `.ddh__plane`, the box the hero picture fills (`aspect-ratio 3554/2744`, `object-fit: cover`). The film is rendered in exactly that frame, so at every window size the film's last frame lands on the hero picture. While pending, the stage shows the poster (CSS background, only downloaded when the gate said yes): no flash of the hero first, no layout shift.
3. **Film.** intro.js adds a muted, `playsinline`, sound-free `<video>` (1280 or 960 by stage width × pixel ratio; MP4 with a WebM fallback) and plays it. While it runs the Shop buttons get a light glass background, so they stay readable over the darker origin shots. The story line *"From natural latex milk to a complete natural latex sleep system."* is real HTML (`.ddb-line`), visible 0.5–3.2 s, and remains in the page (visually hidden) for search engines and screen readers.
4. **Hand-over.** When the film ends on the hero pose, the stage dissolves (0.9 s) into the live hero picture underneath, then the hero's LATEX lockup rises and its points light up one after another (≈ 0.7 s). The hero is interactive the moment the stage is removed.
5. **Never stuck.** Skip button (first in the hero's tab order, drawn on the Shop row at the left; Esc works too), video error → hero at once, autoplay refused → hero at once, no first frame within 4 s → hero. Shop buttons stay visible and clickable all the time. Once started, `sessionStorage['ddb-seen']` prevents replays in the session (coming back from a product page shows the hero directly).

## Integrating (when approved)

The candidate `candidate/section-1.21.0-dev-jsdelivr.html` is the unchanged 1.20.2 section plus four additions:
1. the gate `<script>` before `<section class="ddh">`,
2. `<link rel="stylesheet" href=".../intro.css">` and `<script src=".../intro.js" defer>` after the hero's own,
3. `<div class="ddb" aria-hidden="true"></div>` and `<p class="ddb-line">…</p>` at the end of `.ddh__plane`.

Pin the intro files to a commit (`JSDELIVR_REF=<sha> node tools/build.mjs`) exactly like the hero. About 1 KB is added to the pasted section.

## Switching it off / rollback

* **Off, keep the code:** set `var ON=1` to `var ON=0` in the gate. Nothing downloads, nothing shows.
* **Remove:** delete the four additions; the section is byte-for-byte the 1.20.2 section again (`diff` against `divine-hero/ecwid/section-1.20.2-jsdelivr.html`).
* **Production rollback:** paste the 1.20.2 block from `divine-hero/INSTALL.md`.

## Replacing the film later (final premium render)

Keep the file names and the frame: 1280 × 988 and 960 × 742, 30 fps, H.264 High, `+faststart`, no audio, the **last frame must be the hero pose in the hero frame** (see STORYBOARD.md, "Hand-over frame"). Copy the new files to `assets/`, regenerate the two posters from frame 0, run `node tools/build.mjs`, then `node tests/intro.mjs`. If the length changes, adjust `LINE_IN` / `LINE_OUT` in `src/intro.js`.
