# Divine DunlopDreams Hero 1.0.0 — engineering & design polish report

Baseline: approved **v26** (`reference/v26-REFERENCE-SOURCE.html`, `reference/v26-preview.html`, both unmodified).
Result: **Hero 1.0.0 "baseline polished"**. It keeps the v26 composition, copy, model, mattress, clouds, lockup, graphite CTAs and seven pulsing hotspots, and fixes the defects measured below.
Optional, separate: **Variant A "Tone"** and **Variant B "Large display"**. Each is an override file that is never loaded by default.

Nothing was published, and the live site was not touched.

---

## A. What changed (baseline polished) — and why

Every change is either a measured defect fix or an invisible engineering change. Design-visible changes are marked **◆**.

| # | Change | Evidence (measured) |
|---|---|---|
| 1 | **◆ Phone: the certification line no longer overprints the DIVINE logo.** Lockup top 8→4 px, row gap 4→3 px, LATEX `12vw→11vw`. | v26 at 360/390/430 px: "Certified for UK & EU" drawn over "DIVINE" (`reports/compare/lockup-phone-360x800.jpg`). 1.0.0: the lockup ends above the logo ink at all three widths. |
| 2 | **◆ Lockup = one measured object.** LATEX L-ink starts exactly under the M of *Mattresses*, X-ink ends under *Pillows*. The rotated leaf shares the same left edge. Links→LATEX and LATEX→certification are equal intervals. | Pixel scan (`tests/lockup-pixels.mjs`). v26: L inset 3–4.5 px, gaps 13 / 23 px (1920). 1.0.0: all edges within ±1 px at 9 widths, gaps 13.5 / 13.0 px. |
| 3 | **◆ All seven hotspots are visible on every screen.** On desktop, a point that would fall within 34 px of the visible bottom edge is lifted just inside it (pure CSS, same crop formula). | v26: the *ventilation* hotspot was cropped out entirely on every 16:9 desktop (1920×1080, 2560×1440, 5K, 4K, 3008×1692). *Dual Plush* was half-cut at 1366×768. 1.0.0: 0 hidden points across 19 viewports. Points that were already visible do not move. |
| 4 | **Tap on a hotspot works on Android Chrome and touchscreen laptops.** Focus-open only for keyboard focus (`:focus-visible`). | v26: the tap focused the button (opens), then the click read as a "second tap" (closes), so nothing happened. 21/21 tap checks failed in v26 and pass in 1.0.0. iOS Safari doesn't focus buttons on tap, which is probably why this was never noticed. |
| 5 | **Correct `sizes` → sharp Retina / large monitors.** `sizes="100vw"` (the plane is full-bleed, so the rendered width is always the viewport width). An added **2880w** source (from the 3554 master, SSIM 0.991, better than the approved 2560's 0.9895). | v26's `min(100vw,1900px,(100vh-170px)*1.45)` described the cropped height, not the width. 1366×768 loaded 1200 px, 1920×1080 1640 px, 2560×1440 2048 px, 4K 2048 px (all upscaled). 1.0.0 always picks ≥ the device pixels needed. |
| 6 | **Image crop in CSS instead of JS** (`top:min(0px,(art-h − 100cqw·.772088)·.28)`). | Identical to v26's JS result to the pixel, at 38 viewport/header combinations. It removes a post-load layout shift: **CLS 0.051 / 0.065 → 0.000** (laptop / desktop). |
| 7 | **No `aria-hidden` ancestor around real links.** `aria-hidden` moved from the lockup to the decorative LATEX + certification only. | axe-core: v26 has a *serious* `aria-hidden-focus` violation; 1.0.0 has 0 violations (WCAG 2.2 AA + best practice). |
| 8 | **Lifecycle:** `DDHero.init/destroy/boot`, AbortController for all listeners, every observer disconnected, Instant Site `onTileLoaded/onTileUnloaded` hooks, safe script re-execution. | 25 simulated section re-renders + 5 script re-executions: document/window listener count unchanged, exactly one live region, still interactive. `destroy()` removes everything; `boot()` restores exactly one set. |
| 9 | **Interaction graphics load on intent** (first real pointer move / touch / keyboard focus on the hero), not with the page. | Before intent: 0 requests for plate/spine images. After: 3 (15 KB). Chrome fires a synthetic `pointerover` under a resting cursor, so `pointermove` is used. |
| 10 | **Fonts subset** to Latin + Latin-1 + Latin Extended-A + typographic punctuation (Chillax unchanged, both weights kept). | 41.8 KB → 25.7 KB. All hero copy plus Google-Translate Latin languages are covered. |
| 11 | Pointer proximity: hotspot centres cached (invalidated by ResizeObserver), hit-test coalesced to one per animation frame. | 1 rect read per frame instead of 8 per event. |
| 12 | Pulses pause while the hero is scrolled out of view. Hover lift only on real-hover devices; a `:active` pressed state for touch. | — |
| 13 | Live region announces on tap/click/keyboard only, not on every mouse hover. Escape closes from anywhere. | — |
| 14 | Removed dead code: `alignSkyLockup` (opt-in via an attribute the approved embed never set), `fitPlane` (now CSS), unused `--ddh-art-max`, `data-ddh-base`. | — |
| 16 | **◆ Ventilation "cooling" state, full frame.** Pressing the ventilation hotspot turns the whole artwork from mint to fresh sky-blue: an even cool cast plus a stronger blue rising from the mattress, and the bottom seam softens. Fades in/out over 0.45 s (opacity only). | v26 tinted only the lower half (0 → 30%), so the "temperature changes" idea barely read. On phones it never showed, because the tap didn't open (see #4). The layer now sits inside the image plane, above the logo plate and below the hotspots. |
| 17 | **◆ Phone: hotspot copy no longer overlaps the certification line.** The copy starts at 57% of the brand screen and flows down over the logo plate. | v26/early 1.0.0: 3-line copy (e.g. "Dual Plush System") overlapped "European Production" by up to 7 px at 360–390 px. Now clear for all 7 states at 360/390/430. |
| 15 | Opt-in `ddh--breakout` class (full-bleed escape if the Instant Site container proves padded). It is **not** enabled by default. | Tested inside a 1200 px / 40 px-padded container: the hero spans exactly 0→viewport width, with no horizontal scroll. |

**Unchanged on purpose:** composition, image crop, copy (41 text nodes identical, `tests/guards.mjs`), links, CTA graphite/geometry, hotspot design and pulse, breakpoints (700/1050/1051), tablet layout, `--ddh-bars:50px` contract, reduced-motion, forced-colours.

### Known v26 behaviours deliberately left as-is (your call)
* **Landscape windows ≤1050 px wide** (e.g. 1024×768 old iPad landscape, small browser windows) use the tablet layout, so the CTAs sit below the fold (CTA bottom 933 px at 1050×800 with a 50 px header). Current iPads in landscape (1080–1366 px) get the desktop framing. Changing the breakpoint logic was out of scope for a polish pass.
* **1366×768 with a 50 px header:** the CTAs overlap the bottom of the "Sleep System" artwork line, exactly as in v26.

---

## B. Optional design variants (separate files; baseline untouched)

| Variant | File | What | Cost |
|---|---|---|---|
| **A "Tone"** | `variants/variant-a-tone.css` | Graphite `#343a3c→#2f3638` with a 1 px top highlight. LATEX 27%→33% opacity (keeps presence over clouds). Certification in the link ink colour. Pulse 2.0 s→2.4 s (calmer). | +0.7 KB CSS, no geometry change |
| **B "Large display"** | `variants/variant-b-large-display.css` | Above 1920 px, lockup and hotspots keep their 1920 proportions up to 2560 px, then cap (baseline caps at 390 px: 15% of a 27″ screen width, 10% at 4K). CTAs stay at baseline size (scaled up they cover "Sleep System"). Pixel-identical to the baseline ≤1920 px. | +0.9 KB CSS |

Comparisons: `reports/compare/variant-a-*.jpg`, `reports/compare/variant-b-*.jpg`. Both pass the full 131-check interaction suite.
To adopt one: append its rules to `src/hero.css`, bump to 1.1.0, and rebuild. My recommendation: **B** is a genuine improvement for 27–32″ customers. **A** is taste, so judge it on a real Retina screen.

---

## C. Production code

| File | Size | Brotli |
|---|---|---|
| `ecwid/section-1.0.0.html` (Ecwid side, external CSS/JS) | **6,335 characters / 6,337 bytes**, 48 lines | 1.4 KB |
| `ecwid/section-1.0.0-allinone-jsdelivr.html` (Ecwid side, CSS/JS inline) | 28,826 characters | ≈7.5 KB |
| `release/1.0.0/hero.css` | 14,802 B | ≈3.5 KB |
| `release/1.0.0/hero.js` | 6,625 B | ≈2.4 KB |
| `release/1.0.0/assets/` | 2 fonts (25.7 KB), 7 hero widths 800–3554, 3 interaction graphics (15 KB) | — |

Readable sources: `src/`. Build: `node tests/build.mjs` (esbuild minify only, no bundling, no dependencies at runtime).

---

## D. Ecwid architecture report

**Official sources:** Ecwid Help Center, *Adding custom code to Instant Site* (support.ecwid.com/hc/en-us/articles/8359349900828), and Ecwid developer docs, *"Instant Site section load" events* (docs.ecwid.com/storefronts/track-storefront-events/instant-site-section-load-events). Both were read on 2026-10-01.

* There are three code locations: **header** (SEO settings → *Header meta tags and site verification*), **body** (Advanced website settings → *Custom JavaScript code*), and **page-specific sections** (Edit Site → Add Section → Advanced Solutions → *Embed & Custom Code* → *Add Custom Code Section*; HTML, CSS or JavaScript).
* **Character limit:** the documentation states "no longer than 4000 symbols" **only for the site-wide body *Custom JavaScript code* field**. It states **no limit** for the page-specific custom-code section. The 4,000 rule therefore does not apply to the hero section.
* **Our Ecwid-side code: 6,335 characters / 6,337 UTF-8 bytes. Decision: ONE section.** I could not open the live Ecwid editor from this sandbox. If the editor ever rejects it, follow the fallback ladder in INSTALL.md §9; a whitespace-minified variant is already provided.
* **Lifecycle:** Instant Site "sections (tiles) load and unload dynamically depending on the viewport" and exposes `window.instantsite.onTileLoaded/onTileUnloaded`. hero.js subscribes to both and runs an idempotent `boot()`: it destroys instances whose node left the DOM and initialises any new `.ddh`. A re-executed script reuses the existing `window.DDHero` (no duplicate). The inline one-liner after the script tag covers re-renders that re-run inline scripts but not cached external ones.
* **Why not split into multiple sections:** not needed (size fits, no stated limit). Splitting would expose the hero to independent tile lifecycles for no benefit.
* **Why not a native Custom Section (Vue/TypeScript via Ecwid's "Crane" CLI):** it gives editor-configurable fields, but requires an app/developer setup, a framework runtime and a redeploy for every change. That isn't justified for a fixed art-directed hero.
* **CSP:** the documentation has no CSP restriction for custom code sections, and third-party widget vendors (e.g. Elfsight) rely on external scripts there. Verify in the live test (INSTALL §8: "no console errors").
* **H1:** I could not fetch the live HTML from this sandbox (divinedunlop.com is blocked by its network policy). A text-only read of the homepage showed no top-level heading above the existing sections, so the visually hidden H1 is kept. INSTALL §8 has a one-line console check and the exact swap to `<h2>` if another H1 exists.
* **Collisions:** every selector is `.ddh`-scoped (124 rules checked automatically), and nothing touches `html`, `body`, `h1`, `a`, `img` or `section` globally. One global, `window.DDHero`; `data-ddh-*` attributes only.

---

## E. Performance report (lab, Chromium, local server with Brotli, median of 5)

| Profile | Build | LCP | CLS | Transfer (hero) |
|---|---|---|---|---|
| Phone 390×844@3, Slow 4G, 4× CPU | v26 | 876 ms | 0.000 | 98.9 KB |
| | **1.0.0** | **824 ms** | **0.000** | **83.8 KB** |
| Laptop 1440×900@2 (Retina) | v26 | 328 ms | 0.051 | 189 KB (*upscaled 2560*) |
| | **1.0.0** | **360 ms** | **0.001** | **189 KB** (*sharp 2880*) |
| Desktop 1920×1080@1 | v26 | 260 ms | 0.065 | 126 KB (*upscaled 1640*) |
| | **1.0.0** | 316 ms | **0.000** | 137 KB (*2048*) |

Long tasks: ≤14 ms total at 4× CPU, so negligible INP risk. Budgets: phone ≈84 KB (target ≤150 ✓), tablet/laptop 137–189 KB (≤250 ✓), 5K/6K/4K-at-2× 3554 px (≈250 KB; the largest genuine source, no fake upscale).
LCP element in all cases: the hero image (`fetchpriority="high"`, eager, intrinsic `width`/`height`, no lazy).
Desktop LCP is slightly higher because the browser now downloads the size the screen actually needs. That is the quality fix, not a regression.

**AVIF: not shipped.** Only lossy WebP derivatives exist (the multi-MB master isn't in the handover). Re-encoding them to AVIF saves about 42% at SSIM 0.993, but that is second-generation compression on top of WebP artefacts. Re-evaluate from the master (`INSTALL.md` §10 has the command).
**Whole homepage:** the live site couldn't be loaded from this sandbox, so this was a text-only read: the "Sleep Solution Navigator" with its own Shop buttons, product grids, many image sections and reviews. The hero adds 1 stylesheet, 1 deferred script, 1 image, 1–2 fonts and no long tasks, leaving the main thread free. Before going live, remove or hide any old cover/hero section above it, so two LCP candidates don't compete.

---

## F. Screenshot matrix

`reports/compare/<viewport>.jpg`: v26 | 1.0.0, side by side, with a 50 px store-header stand-in. 19 configurations:
360×800@3 · 390×844@3 · 430×932@3 · 768×1024@2 · 820×1180@2 · 1024×1366@2 (iPad portrait) · 1050×800 · 1051×800 · 1366×1024@2 (iPad landscape) · 1366×768 · 1440×900@2 (Retina) · 1536×864@1.25 · 1728×1117@2 (MBP 16) · 1920×1080 · 1920×1080@2 · 2560×1440 · 2560×1440@2 (5K/27″) · 3008×1692@2 (6K/32″) · 3840×2160 (4K).
Lockup close-ups: `reports/compare/lockup-*.jpg`. Raw metrics per viewport: `reports/matrix/*/metrics.json`.

Automated regression versus v26 at all 19 viewports × 2 header heights: hero/scene/art/image/CTA geometry **Δ = 0 px**, no horizontal overflow, full bleed (image x = 0, w = viewport), clouds/sky band unchanged, 0 hotspots hidden.

---

## G. Accessibility report

* axe-core 4 (WCAG 2.0/2.1/2.2 A+AA + best practice), desktop and phone: **0 violations** (v26: 1 serious).
* Real links (Mattresses / Toppers / Pillows / 2 CTAs) are exposed. LATEX and the visual certification are `aria-hidden`; the certification is spoken once via the hidden sentence.
* Hotspots: native `<button>`s with names, `aria-expanded` and `aria-controls`. Roving tabindex gives one Tab stop, with Arrow/Home/End to move, Enter/Space to open and Escape to close (also from anywhere on the page). Focus leaving the group closes it. A polite live region announces the opened copy.
* Touch: 46×46 px hotspot targets. Lockup links get an invisible ≥32 px-tall hit area without layout change. `touch-action:manipulation`. Dragging that starts on a hotspot scrolls the page (verified) and never opens a state.
* Reduced motion: pulse and fades off, points remain visible. Forced colours: system-colour rings and CTA borders.
* No-JS: all five links work. The CSS `:has()` fallback still reveals copy on hover/focus (it now also works on desktop, because the crop no longer needs JS).
* One H1 in the hero (see D for the live-page check).

## H. Code audit (v26 → 1.0.0), line-level findings

| Area | v26 finding | 1.0.0 |
|---|---|---|
| HTML | `aria-hidden` ancestor contains 3 focusable links | fixed |
| HTML | `sizes` describes height-constrained width; wrong at most desktop sizes | `100vw` + 2880w |
| HTML | `<picture>` with a single WebP `<source>` duplicating the `<img>` | single `<img srcset>` (WebP is universal; `<picture>` wrapper kept only as a CSS hook) |
| JS | Touch tap = focusin-open + click-toggle-close (nothing happens) | keyboard-only focus open |
| JS | No `destroy`, listeners on `window`/`document`, 3 observers never disconnected | AbortController + disconnect + `destroy()` |
| JS | `pointermove` hit-test reads 8 bounding rects per event | cached centres, 1 read per frame |
| JS | `fitPlane` sets `top` after load → CLS 0.05–0.065 | CSS formula, CLS 0 |
| JS | Live region announces on every hover | only on activation |
| JS | `click` treats touch on a mouse-capable laptop as "precise" (`|| fine.matches`) | `pointerType` first; media query only when unknown |
| JS | `ddh--in-view` class toggled but never used | replaced by `ddh--offscreen` (pauses pulses) |
| JS | `alignSkyLockup` dead path (attribute never set) | removed |
| CSS | `--ddh-art-max` unused; hover styles stick after tap | removed; `(hover:hover)` guard |
| CSS | Ventilation hotspot cropped on 16:9 desktops | clamped into frame |
| Assets | Fonts carry ~360 glyphs incl. math/Greek | Latin subset, −39% |
| Assets | Interaction images: lazy but unprompted | intent-driven |

Tooling (`tests/`): `matrix.mjs` (screenshots + geometry), `lockup-pixels.mjs` (ink alignment), `interaction.mjs` (131 checks), `perf.mjs` (LCP/CLS), `a11y.mjs` (axe), `guards.mjs` (copy parity, CSS scoping, links, placeholders), `build.mjs`, `compose.py`.

## Final self-review

Preserved v26 ✓ · no redesign (design-visible changes = phone overlap fix, ±1 px lockup alignment, lifting cropped hotspots into view) ✓ · no empty bands, full bleed, clouds unchanged ✓ · lockup one geometric object ✓ · LATEX aligned ✓ · 7 hotspots work and pulse ✓ · links direct ✓ · iPad / small laptop / Retina ✓ · LCP not damaged (phone faster; desktop pays only for correct sharpness) ✓ · no listener leaks ✓ · Instant Site lifecycle safe ✓ · no libraries ✓.
