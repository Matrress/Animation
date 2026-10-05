# Divine DunlopDreams Hero 1.10.4 — installation (Ecwid Instant Site)

> **Use the SHORT section** `ecwid/section-1.10.4-jsdelivr.html` (9,519 characters). The live site cut longer pastes at about 20–22k characters, which lost the hotspots, the Shop buttons and the script. Do not use the all-in-one files on Instant Site.

> **1.1.0** fits the live header: the Instant Site header is transparent and lies over the first section. The hero measures it on the page and keeps the lockup, DIVINE logo, hotspots and Shop buttons below it, while the sky and clouds run up behind the menu. Nothing needs adjusting by hand.

> **Do not publish until you approve.** Everything below is built and tested off-site. Nothing on divinedunlop.com has been changed.

## 1. Section count

**ONE SECTION.** A single page-specific *Embed & Custom Code* section on the Homepage.
Ecwid's documented 4,000-symbol limit belongs to the **site-wide body "Custom JavaScript code" field**, not to page sections; the section limit is undocumented (see REPORT.md §D). Our section is **5,943 characters**.

### Two equivalent forms of the same single section

| Form | File | Paste size | What must be hosted |
|---|---|---|---|
| All-in-one (over the ~20k paste limit: not for the live editor) | `ecwid/section-1.10.4-allinone-jsdelivr.html` | 66,071 characters | Nothing: CSS + JS are inside the section; images/fonts come from jsDelivr (pinned commit `c786b5a`) |
| All-in-one, own domain | `ecwid/section-1.10.4-allinone.html` | 65,334 characters | images + fonts on `assets.divinedunlop.com` (§2) |
| External CSS/JS (leanest page HTML) | `ecwid/section-1.10.4.html` | 8,906 characters | everything in `release/1.10.4/` on `assets.divinedunlop.com` (§2) |

All three produce identical output (verified: same geometry, same 156 interaction checks). The all-in-one is about the size of the v26 reference file (28,761 characters) that was planned for one section. Its CSS/JS aren't cached separately, which costs about 6 KB compressed per homepage view.

## 2. Where the external files live (choose one host)

**Recommended — first-party, `assets.divinedunlop.com` (Cloudflare Pages, free):**
1. Create a Cloudflare Pages project (direct upload, no build). Upload a folder whose structure is exactly:
   ```
   _headers                          ← copy of hosting/_headers
   divine-hero/
     1.10.4/
       hero.css                      ← release/1.10.4/hero.css
       hero.js                       ← release/1.10.4/hero.js
       assets/
         chillax-400.woff2  chillax-600.woff2
         hero-band-800.webp  hero-band-1200.webp  hero-band-1640.webp  hero-band-2048.webp
         hero-band-2560.webp hero-band-2880.webp  hero-band-3554.webp
         plate-back.webp  plate-logo.webp  spine-graphic.webp
   ```
2. In the Pages project → *Custom domains*, add `assets.divinedunlop.com`. At whoever manages DNS for divinedunlop.com, add the CNAME it asks for (`assets` → `<project>.pages.dev`).
3. Check: `curl -sI https://assets.divinedunlop.com/divine-hero/1.10.4/hero.css` → `200`, `cache-control: public, max-age=31536000, immutable`, `access-control-allow-origin: *`.

The production section below already points at `https://assets.divinedunlop.com/divine-hero/1.10.4/`.

**Ready now — staging via jsDelivr (no setup):** `ecwid/section-1.10.4-jsdelivr.html` loads the same files from this repository at the pinned commit `c786b5a`. It's immutable and CORS-enabled. Use it for the hidden-page test or as an interim host. Swap to the first-party file before launch: that file serves from a GitHub fork of an unrelated project, so it isn't brand-controlled.

## 3. Exact external file URLs (production)

```
https://assets.divinedunlop.com/divine-hero/1.10.4/hero.css
https://assets.divinedunlop.com/divine-hero/1.10.4/hero.js
https://assets.divinedunlop.com/divine-hero/1.10.4/assets/chillax-400.woff2
https://assets.divinedunlop.com/divine-hero/1.10.4/assets/chillax-600.woff2
https://assets.divinedunlop.com/divine-hero/1.10.4/assets/hero-band-{800,1200,1640,2048,2560,2880,3554}.webp
https://assets.divinedunlop.com/divine-hero/1.10.4/assets/plate-back.webp
https://assets.divinedunlop.com/divine-hero/1.10.4/assets/plate-logo.webp
https://assets.divinedunlop.com/divine-hero/1.10.4/assets/spine-graphic.webp
```
File contents = the files in `release/1.10.4/` of this repository (byte-exact; readable sources in `src/`).

## 4. Order of operations

1. Host the files (§2) and run the `curl` check.
2. Ecwid admin → **Website → Edit Site** → page dropdown **Add page** → create a test page (e.g. "hero-test"), not linked in navigation.
3. On that page: **Add Section → Advanced Solutions → Embed & Custom Code → Add Custom Code Section** → paste the code from §5 → **Back** → drag the section to the **top** → **Publish**.
4. Run the test procedure (§8) on the test page.
5. Only after approval: repeat step 3 on **Page: Homepage**, drag it directly under the store header, above the existing sections. Leave the existing Ecwid Shop buttons and navigation as they are. Hide or remove any old cover/hero section above it only once you're happy.
6. Publish.

## 5. Paste-ready code — Section 1 of 1 (Homepage, top)

Source of truth: `ecwid/section-1.10.4.html` (identical to the block below).

```html
<!-- Divine DunlopDreams Hero 1.10.4 | one Instant Site "Embed & Custom Code" section | CSS/JS/assets: https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/ -->
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="preload" href="https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/assets/chillax-600.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/hero.css">
<script src="https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/hero.js" defer></script>
<section class="ddh" aria-labelledby="ddh-title" data-ddh-mode="interactive">
<h1 class="ddh__sr" id="ddh-title">Divine DunlopDreams – 100% Natural Latex Mattresses, Toppers &amp; Pillows. Engineering Natural Latex Sleep System</h1>
<div class="ddh__scene">
<div class="ddh__sky">
<div class="ddh__sky-lockup"><span class="ddh__sky-word" aria-hidden="true"><span class="ddh__leaf"></span><span>L</span><span>A</span><span>T</span><span>E</span><span>X</span></span><span class="ddh__sky-cert" aria-hidden="true"><b data-ddh-spread>European Production</b><span data-ddh-spread>Certified for UK &amp; EU</span></span></div>
</div>
<div class="ddh__art">
<div class="ddh__plane">
<picture class="ddh__picture"><img class="ddh__img" src="https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/assets/hero-band-1640.webp" srcset="https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/assets/hero-band-800.webp 800w,https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/assets/hero-band-1200.webp 1200w,https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/assets/hero-band-1640.webp 1640w,https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/assets/hero-band-2048.webp 2048w,https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/assets/hero-band-2560.webp 2560w,https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/assets/hero-band-2880.webp 2880w,https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/assets/hero-band-3554.webp 3554w" sizes="100vw" width="3554" height="2744" alt="Woman sleeping on a natural latex pillow beside the Divine DunlopDreams Dual Plush latex mattress and topper" fetchpriority="high" loading="eager" decoding="async"></picture>
<span class="ddh__bed" aria-hidden="true"><img src="https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/assets/mattress-bed.webp" width="1480" height="720" alt="" loading="lazy" decoding="async"></span>
<span class="ddh__mat" aria-hidden="true"><img src="https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/assets/mattress.webp" width="1072" height="430" alt="" loading="lazy" decoding="async"></span>
<span class="ddh__dp" aria-hidden="true"><span data-ddh-spread>Dual Plush</span></span>
<div class="ddh__wash" aria-hidden="true"></div>
<div class="ddh__night" id="ddh-night" aria-hidden="true"><img class="ddh__night-img" src="https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/assets/night-1640.webp" srcset="https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/assets/night-1640.webp 1640w,https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/assets/night-2560.webp 2560w" sizes="100vw" width="1640" height="1266" alt="" loading="lazy" decoding="async"><p class="ddh__night-copy" data-ddh-copy="night" aria-hidden="true"><span><b>Improve</b> the <b>Quality</b> of Your <b>Sleep</b></span></p></div>
<div class="ddh__points" role="group" aria-label="Explore the sleep system">
<button class="ddh__point" type="button" data-ddh-point="shoulder" aria-controls="ddh-screen-brand" aria-expanded="false"><span class="ddh__sr">Shoulder: balance and relief</span></button>
<button class="ddh__point" type="button" data-ddh-point="back" aria-controls="ddh-screen-back" aria-expanded="false"><span class="ddh__sr">Back: spinal alignment</span></button>
<button class="ddh__point" type="button" data-ddh-point="zones" aria-controls="ddh-screen-brand" aria-expanded="false"><span class="ddh__sr">Original Dunlop technology</span></button>
<button class="ddh__point" type="button" data-ddh-point="head" aria-controls="ddh-screen-brand" aria-expanded="false"><span class="ddh__sr">Pillow: certified latex rubber foam</span></button>
<button class="ddh__point" type="button" data-ddh-point="system" aria-controls="ddh-screen-brand" aria-expanded="false"><span class="ddh__sr">Dual Plush mattress and topper system</span></button>
<button class="ddh__point" type="button" data-ddh-point="firmness" aria-controls="ddh-screen-brand" aria-expanded="false"><span class="ddh__sr">Natural adaptation</span></button>
<button class="ddh__point ddh__point--m" type="button" data-ddh-point="temperature" aria-controls="ddh-screen-brand" aria-expanded="false"><span class="ddh__sr">Ventilation and temperature comfort</span></button>
<button class="ddh__point" type="button" data-ddh-point="sizes" aria-controls="ddh-screen-brand" aria-expanded="false"><span class="ddh__sr">All UK and EU sizes and depths</span></button>
<button class="ddh__point" type="button" data-ddh-point="weight" aria-controls="ddh-screen-brand" aria-expanded="false"><span class="ddh__sr">Firmness by body weight</span></button>
<button class="ddh__point ddh__point--bio" type="button" data-ddh-point="bio" aria-controls="ddh-sheet-bio" aria-haspopup="dialog" aria-expanded="false"><span class="ddh__sr">Bio Comfort: our innovation, the finest latex mattress we make</span></button>
<button class="ddh__point ddh__point--night" type="button" data-ddh-point="night" aria-controls="ddh-night" aria-expanded="false"><span class="ddh__sr">Night mode: improve the quality of your sleep</span></button>
</div>
<div class="ddh__screen ddh__screen--back" id="ddh-screen-back" aria-hidden="true">
<img class="ddh__plate" src="https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/assets/plate-back.webp" width="573" height="232" alt="" loading="lazy" decoding="async">
<div class="ddh__spine" data-ddh-copy="back" aria-hidden="true"><strong>Spinal Alignment</strong><img src="https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/assets/spine-graphic.webp" width="1615" height="145" alt="" loading="lazy" decoding="async"><span><b>Stretching</b> Effect</span></div>
</div>
<div class="ddh__screen ddh__screen--brand" id="ddh-screen-brand" aria-hidden="true">
<img class="ddh__plate" src="https://cdn.jsdelivr.net/gh/Matrress/Animation@c786b5a/divine-hero/release/1.10.4/assets/plate-logo.webp" width="470" height="175" alt="" loading="lazy" decoding="async">
<p class="ddh__copy ddh__copy--solo" data-ddh-copy="shoulder" aria-hidden="true"><strong>Balance &amp; Relief</strong></p>
<p class="ddh__copy ddh__copy--solo" data-ddh-copy="zones" aria-hidden="true"><strong>Original Dunlop Technology</strong></p>
<p class="ddh__copy" data-ddh-copy="head" data-ddh-claim="review" aria-hidden="true"><strong>100% EU-UK Certified</strong><span>Latex (Rubber) Foam</span></p>
<p class="ddh__copy" data-ddh-copy="system" aria-hidden="true"><strong>Dual Plush System</strong><span>Latex Mattress for <b>Support</b></span><span>Latex Topper for <b>Comfort</b></span></p>
<p class="ddh__copy" data-ddh-copy="bio" aria-hidden="true"><strong>Bio Comfort</strong><span>Our innovation · <b>Discover</b></span></p>
<p class="ddh__copy" data-ddh-copy="firmness" aria-hidden="true"><strong>Natural Adaptation</strong><span>Keeps Your Body on the Surface</span></p>
<p class="ddh__copy" data-ddh-copy="temperature" aria-hidden="true"><strong>Best Air Ventilation</strong><span>Temperature Comfort</span></p>
<p class="ddh__copy ddh__copy--panel" data-ddh-copy="sizes" aria-hidden="true"><strong>All UK &amp; EU Sizes</strong><span><b>Customisable</b> Mattress &amp; Topper <b>Depths</b></span><span>Different Depths for <b>Different Levels of Adaptation</b></span></p>
<p class="ddh__copy ddh__copy--panel ddh__copy--lede" data-ddh-copy="weight" aria-hidden="true"><strong><b>Firmness</b> Regulated by Body Weight</strong><span class="ddh__scale"><i class="ddh__w1">Soft</i> · <i class="ddh__w2">Medium</i> · <i class="ddh__w3">Firm</i> · <i class="ddh__w4">Extra Firm</i></span></p>
</div>
<ul class="ddh__benefits" aria-label="Benefits"><li>High Support</li><li>Anatomical Balance</li><li>Orthopaedic Comfort</li><li>High Adaptability</li></ul>
<p class="ddh__sr">European production, certified for UK &amp; EU. Dual Plush mattress and topper system.</p>
</div>
</div>
<nav class="ddh__shop" aria-label="Shop natural latex">
<a class="ddh__cta" href="https://divinedunlop.com/products/latex-mattresses-collection" data-ddh-sheet="mattress" aria-controls="ddh-sheet-mattress" aria-expanded="false"><span class="ddh__cta-a">Shop Your</span> <span class="ddh__cta-k">Latex Mattress</span></a>
<a class="ddh__cta" href="https://divinedunlop.com/products/latex-toppers-collection" data-ddh-sheet="topper" aria-controls="ddh-sheet-topper" aria-expanded="false"><span class="ddh__cta-a">Shop Your</span> <span class="ddh__cta-k">Latex Topper</span></a>
</nav>
</div>
<i class="ddh__end" hidden></i>
</section>
<script>window.DDHero&&DDHero.boot()</script>
```

## 6. Settings inside the code you may need to adjust

* **Header height: automatic.** 1.1.0 measures the announcement bar and the transparent header on the live page, so there is nothing to set. The `--ddh-bars` setting from 1.0.0 is gone.
* **H1.** In the console on the live homepage: `[...document.querySelectorAll('h1')].map(h => h.textContent.trim())`
  If anything **other than** "Divine DunlopDreams – Engineering Natural Latex Sleep System" is listed, change `<h1 class="ddh__sr" id="ddh-title">…</h1>` to `<h2 class="ddh__sr" id="ddh-title">…</h2>` (both tags). Nothing visible changes.
* **Side gaps.** If the hero doesn't touch both screen edges (the Instant Site section adds padding), change `class="ddh"` to `class="ddh ddh--breakout"`.

## 7. Optional variants (only if approved)

Add one line right after the `hero.css` link:
```html
<link rel="stylesheet" href="https://assets.divinedunlop.com/divine-hero/1.10.4/variant-b-large-display.css">
```
(Upload `variants/variant-*.css` next to `hero.css` first.) For a permanent adoption, fold it into `src/hero.css` and release 1.1.0.

## 8. Test procedure (test page first, then homepage)

On desktop Chrome + Safari, iPhone Safari, Android Chrome, iPad (portrait + landscape):
1. **Full bleed:** no side gaps, no strip above the clouds, lockup sits inside the sky.
2. **Lockup:** links / LATEX / certification share one left and right edge; phone: certification above the DIVINE logo, not over it.
3. **Ventilation:** pressing the lowest hotspot turns the whole picture fresh sky-blue (strongest at the mattress) with "Best Air Ventilation / Temperature Comfort"; it fades back when closed.
4. **Hotspots:** 7 visible and pulsing (also the lowest "ventilation" one on 1920×1080). Mouse hover, click, tap (tap again closes), Tab → arrows → Escape, tap outside closes. Swiping that starts on a hotspot scrolls the page.
5. **Links:** Mattresses / Shop Your Mattress → `/products/latex-mattresses-collection`; Toppers / Shop Your Topper → `/products/latex-toppers-collection`; Pillows → `/products/latex-pillows`.
6. **Console:** no red errors (CSP, 404, CORS). Network tab: `hero.css`, `hero.js`, 1 `hero-band-*.webp`, 1–2 fonts; `plate-*`/`spine-*` appear only after you interact.
7. **Scroll down and back up** several times (Instant Site unloads/reloads sections): hotspots still work, and the console runs `document.querySelectorAll('.ddh [aria-live]').length` → `1`.
8. **CTA fold:** on a 1366×768 / 1440×900 laptop the Shop buttons are visible without scrolling.
9. PageSpeed Insights on the test page URL: LCP element = the hero image, CLS ≈ 0.

## 9. If the editor rejects the length (fallback ladder — do not split the hero)

1. Paste `ecwid/section-1.10.4.min.html` (same markup, whitespace removed, 5,895 characters).
2. If still rejected, tell me the exact limit shown. The next step is a small mount section (≈600 characters) with hero.js rendering the same markup from an external template, keeping one section and one lifecycle. I haven't built it because nothing indicates it's needed, and it costs no-JS fallback and early image discovery.

## 10. Rollback

* **Instant:** Edit Site → Homepage → the custom-code section → *Hide* (eye icon) or delete it → Publish. The existing sections and Shop buttons were never removed, so the page returns to its previous state.
* **Version rollback:** hosted versions are immutable folders (`/divine-hero/1.10.4/`, later `/1.0.1/`…). Paste the previous version's `ecwid/section-<version>.html`. Never overwrite files inside a published version folder.
* **Release scheme:** semantic versions. Patch = fix with no visual change, minor = approved visual change (e.g. a variant), major = new composition. Each release gets a new folder and a new `ecwid/section-<version>.html`; `tests/build.mjs` sets `VERSION`.
* **AVIF later (optional):** with the original master `M.png`: `for w in 800 1200 1640 2048 2560 2880 3554; do avifenc --min 0 --max 63 -a end-usage=q -a cq-level=24 -s 4 <(magick M.png -resize ${w}x png:-) hero-band-$w.avif; done`. Then add `<source type="image/avif">` inside `<picture>` and keep WebP as the `<img>`. Ship only if side-by-side quality is equal.

## 11. Rebuilding / re-testing locally

```
cd divine-hero
npm i -g esbuild playwright pngjs axe-core          # or any local install
node tests/build.mjs                                # src/ → release/1.10.4, ecwid/, preview/
npx http-server -p 8765 -c-1 .                      # in another terminal
node tests/matrix.mjs polished-h50 preview/harness-polished-h50.html
node tests/interaction.mjs preview/harness-polished-h50.html     # 131 checks
node tests/guards.mjs && node tests/a11y.mjs preview/harness-polished-h50.html
node tests/lockup-pixels.mjs http://127.0.0.1:8765/preview/harness-polished-h50.html
python3 tests/serve.py 8766 & BASE=http://127.0.0.1:8766/ node tests/perf.mjs preview/harness-polished-h50.html 5
```
