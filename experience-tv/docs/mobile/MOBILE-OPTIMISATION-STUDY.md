# BOTANIC: desktop, tablet and phone optimisation study

Date: 2026-11-10. Branch `claude/funny-johnson-b4mod7`, draft PR #9.
**Status: investigation and design proposal. Nothing was changed on the live store, nothing is deployed, the engine and the Botanic description were not modified. Every proposal below needs the owner's approval before development.**

Three kinds of statement are kept apart throughout:

| Label | Meaning |
|---|---|
| **Measured** | A number produced by a script in this repository, on the public live page or on the stored source. The command and the raw data are named. |
| **Read from code** | A fact established by reading the repository or the page's HTML. |
| **Estimated / not measurable here** | A judgement or an expected benefit. The media host (`media.divinedunlop.com`) answers `403` from this machine, so **no video or cover-image byte count, and no media playback timing, could be measured**. This matters: the seven videos are the largest suspected cost and are *not* in any byte total below. |

Lab numbers come from a local Chromium with throttling (phone: 4× CPU, 1.6 Mbit/s, 150 ms; iPad: 2× CPU, 9 Mbit/s; desktop: none), behind a proxy. They compare options with one another; they are not field data and not a Lighthouse score. Real-device and field verification (E4) is still outstanding.

Reproduce everything:

```bash
NODE_PATH=$(npm root -g) node tests/live/baseline.cjs <iphone|ipad|desktop> 3 docs/mobile/data/baseline-<name>.json   # the live page today
NODE_PATH=$(npm root -g) node tests/live/engine-cost.cjs <iphone|ipad|desktop> 2 docs/mobile/data/engine-cost-<name>.json   # what our bundle adds
NODE_PATH=$(npm root -g) node tools/audit-description.mjs                  # the description, section by section
NODE_PATH=$(npm root -g) node tools/mobile-prototypes.mjs                  # the three design previews + measurements
NODE_PATH=$(npm root -g) node tools/mobile-shots.mjs                       # screenshots
```

---

## 0. The answer in ten lines

1. **The description is not what makes the page heavy.** It is 1 088 DOM nodes of about 3 760 on a phone, no script, and about 26 KB gzip inside a 69 KB document. The page is about 2.2 MB and 94 requests, of which about 95 % is Ecwid's own scripts, styles and images. *(Measured.)*
2. **The description is long, not heavy.** 26 103 px at phone width: about 31 screens. Only 43 % of its text (13.4 k of 31.3 k characters) is visible without a tap; the rest is already inside 20 closed `<details>`. *(Measured.)*
3. **Folding does not reduce technical weight.** All three previews keep 100 % of the text and the DOM stays at 980–1 050 nodes; gzip size does not fall (25.7 → 26.6–27.2 KB). What folding changes is length: 26 103 px → 11 800–12 100 px (−54 %). *(Measured.)* That is a reading-experience gain, not a loading gain.
4. **The real loading levers are elsewhere:** (a) all seven videos are requested the moment the page loads, on every device, including the full presentation video with `preload="auto"`; (b) our 71 KB-gzip Product TV bundle is downloaded and run on phones that never show it; (c) on desktop and tablet the television builds every screen at start and fetches the four cover textures at once. *(Measured: requests and DOM; byte sizes of media not measurable here.)*
5. **The phone does not need the television code at all.** The loader fetches the full bundle on every device and the engine then decides at run time not to show it. It still costs about 0.4 s of main-thread work on a throttled phone, a font stylesheet request and a hidden host. A three-line gate before the download removes it. *(Read from code; cost measured.)*
6. **Search visibility is safe as long as the HTML is left alone.** Ecwid serves the whole description, including the text inside all 21 closed `<details>`, in the server-rendered HTML, with `Product` structured data, a canonical address and Open Graph tags. *(Read from the raw HTML.)* Every option below is a presentation of that same HTML.
7. **Three phone presentations were built from the real description** (not retyped): A (optimised in place), B (compact progressive), C (hybrid editorial). All keep every text of the source (422 of 422; only section numbers and decoration are not shown). Measurements in section 5.
8. **Recommendation: do the option-independent fixes first (media on demand, television gate, decoration), land Option A on top, and treat Option C as the target phone design after the owner has seen it on real phones.** Option B is not recommended. Section 8.
9. **The television stays as it is** for tablets and desktop. Four deferrals would lighten it without removing anything (section 7).
10. **Nothing here needs a new database, a second content source or another selector.** The approved description stays the single source; phone and television are two presentations of it.

Things found on the way that the owner should know about (none was changed): the page can contain **two copies** of the whole product page in the DOM on a slow phone (section 3.4); the page's own structured data says `price: 0.0` (3.5); one section (Warranty) has no heading element (3.5); the firmness ranges as published overlap at 83 kg (3.5).

---

## 1. Deliverable 1: current-state audit

### 1.1 The page a phone visitor gets today

*Measured, `tests/live/baseline.cjs`, public product 831592302, 3 runs per profile, medians. No engine loaded: this is the page exactly as visitors have it.*

| | Phone, slow 4G, 4× CPU | Phone, unthrottled | iPad, 2× CPU | Desktop |
|---|---|---|---|---|
| Requests at load (no scrolling) | 94 | 98 | 89 | 89 |
| Transferred at load (excl. media host) | 2.23 MB | 2.31 MB | 1.92 MB | 1.91 MB |
| After scrolling the whole page | 106 req, 2.34 MB | 104, 2.39 MB | 95, 1.99 MB | 95, 1.97 MB |
| First contentful paint | 2.8 s | 1.4 s | 1.5 s | 1.1 s |
| Largest contentful paint | 11.8 s | 5.7 s | 6.2 s | 5.2 s |
| LCP element | Ecwid gallery thumbnail background | same | Ecwid gallery photo | Ecwid gallery photo |
| Layout shift (CLS) | 0.033 | 0 | 0.084 | 0.003 |
| Total blocking time (approx.) | 2.0 s | 74 ms | 451 ms | 95 ms |
| DOM nodes, whole page | 3 765 (two copies, see 3.4) | 2 057 | 2 120 | 2 120 |
| Style recalculations after scrolling | 2 440 | 2 346 | 1 526 | 1 462 |

Where the bytes come from (phone, 94 requests): Ecwid CDN 74 requests, 1.86 MB; Ecwid API 13, 0.30 MB; the site document 1, 69 KB; scripts 45 files, 1.04 MB (the largest, Ecwid's `website` bundle, 386 KB); stylesheets 16 files, 290 KB; images 18 files, 531 KB; fonts 3 files, 113 KB. **Our description contributes one document (69 KB) and no script.**

**What the numbers say.** The largest contentful paint is an Ecwid gallery image, not our content. Changing the description cannot move LCP. The description's own markup is about 1 % of the transferred bytes. What a phone user pays for *our* content is (i) scrolling length, (ii) the media it starts without being asked, (iii) the 1 088 nodes' style and layout work, which is real but small (style 1.2 s and layout 0.3 s at 4× CPU, for the whole page).

### 1.2 Media that starts on its own *(Measured: requests; Read from code: attributes)*

The description contains seven `<video>` elements. All seven file requests are issued **at load, before any scrolling, on phone, iPad and desktop alike**. Five are `autoplay muted loop`; the full presentation video has `preload="auto"` and `controls`.

| Video | Attributes | Used for |
|---|---|---|
| Presentation loop | `autoplay`, `preload=auto` | Hero card (a teaser of the full video) |
| Full presentation | `controls`, `preload=auto` | Opens from the hero button (`:target` modal) |
| Origin, elasticity, 7-zone, airflow, durability | `autoplay`, `preload=metadata` | One proof loop per chapter |

No video has a `poster`. The four cover textures (`loading="lazy"`) are correctly deferred: none was requested before scrolling on iPad. **The byte size of these seven files is unknown to this study** (host unreachable from here); `tools/media-manifest.mjs` style tooling or the browser's network panel on the owner's machine will give it. A script for that is a recommended first measurement (section 6).

### 1.3 The description, block by block *(Measured: `tools/audit-description.mjs`; roles are a judgement)*

Heights are at a phone content column (350 px). "Visible" = characters on screen without a tap. The audit's raw data: `docs/mobile/data/botanic-audit.json`.

| Block | Says | Role in the purchase decision | px @350 | Nodes | Chars (visible / all) | Media, effects | Simplify without losing meaning? | Also said elsewhere? | Fit for compact / expandable |
|---|---|---|---|---|---|---|---|---|---|
| Hero | Name, promise, two buttons, full video card, "Your configuration at a glance" | Orientation and first impression | 2 116 | 85 | 943 / 1 005 | 2 videos, 3 `backdrop-filter`, 5 shadows | Yes: the loop is a teaser of the full video; the glance card repeats facts below | **Yes**: the glance card repeats the native Ecwid options and the sections below | Keep, tighter; video on demand |
| Key-features bar | Six features as shortcuts | Orientation | 217 | 16 | 140 / 146 | – | Yes | Repeats section titles | Keep as one compact row |
| Section navigation bar | 13 anchors | Navigation of a 31-screen page | 144 | 16 | 106 / 118 | – | Needed only while the page is this long | Repeats headings | Drop if the page is short |
| 01 Firmness | Weight ranges per firmness, why correct firmness, who it is for | **Decision-critical** | 2 652 | 98 | 1 390 / 4 756 | 8 shadows | Layout only | Native Firmness option | Keep open: ranges and decision notes; explanations folded |
| 02 Comfort | What to expect from latex | Persuasion | 1 524 | 34 | 826 / 2 743 | – | Layout only | Echoed in Support/Adaptation | Fold |
| 03 Height | Three depths, 22 sizes, why height matters | **Decision-critical** | 1 575 | 114 | 763 / 1 899 | – | The 22-size grid is large and the dropdown holds the same list | Native Depth and Size options | Keep depths open; size grid folded |
| 04 Covers | Four covers, texture, facts table | **Decision-critical** | 1 615 | 117 | 706 / 2 643 | 4 images (lazy), 22 transitions | Layout only | Native Cover option | Keep open: names and tags; details folded |
| 05 Benefits | Why Dunlop latex is different | Persuasion | 2 439 | 67 | 1 392 / 2 514 | 1 video | Layout only | – | Summary + fold |
| 06 Support | Orthopaedic support | Persuasion / education | 1 666 | 49 | 1 018 / 1 796 | – | Layout only | Overlaps 07 | Fold |
| 07 Adaptation | Instant response | Persuasion / education | 1 979 | 54 | 1 070 / 1 999 | 1 video | Layout only | Overlaps 06 | Fold |
| 08 7-Zone | Seven support zones | Distinctive feature | 1 492 | 75 | 552 / 2 133 | 1 video | Layout only | – | Strong visual block |
| 09 Ventilation | Airflow, temperature | Persuasion / education | 2 012 | 75 | 1 067 / 1 936 | 1 video | Layout only | – | Fold |
| 10 Hygiene | Hypoallergenic | Persuasion | 1 640 | 50 | 979 / 1 731 | – | Layout only | – | Fold |
| 11 Certifications | OEKO-TEX, German lab, European production | **Trust** | 2 473 | 73 | 1 561 / 3 958 | 1 video | Layout only | – | Keep open: certificate names; detail folded |
| 12 Warranty | 15 years, 2× pillows | **Trust, purchase confidence** | 989 | 27 | 389 / 912 | – | None | – | Keep open |
| 13 Delivery | Made to order, 20 days | **Purchase confidence** | 549 | 20 | 313 / 793 | – | None | Hero repeats "20 Days Delivery" | Keep open |
| Call to action | Closing statement, three buttons | Closing | 564 | 9 | 199 / 204 | – | The buttons repeat the hero's | **Yes** (its text block exists twice) | Keep short |
| Leaf dividers ×12, floating Back to Top | Decoration | None | 456 + 33 | 109 | 0 | 24 gradients, 1 fixed element | Remove on phones | – | Drop |

Totals: 26 103 px, 1 088 nodes, 31 314 characters (4 942 words), 20 closed `<details>`. At a tablet column (720 px) the same page is 18 561 px.

### 1.4 Visual density versus technical weight

| | Visual density (what the reader meets) | Technical weight (what the browser pays) |
|---|---|---|
| Hero | 2 116 px, three stacked cards, two videos | 85 nodes, 3 blur effects, 2 video requests |
| Whole description | 31 screens, 13 sections, 12 dividers, two navigation bars | 1 088 nodes, 54 KB inline CSS (303 rules, 54 match nothing), 216 `!important`, **no JavaScript** |
| Interactions | 20 `<details>`, a four-radio cover switcher, a `:target` video modal | All CSS-only; no listeners of ours on the phone |
| Cost concentrated in | Long vertical rhythm: padding of 3–4 rem around each section | 97 box-shadows, about 120 elements with transitions, 7 videos |

Conclusion: reducing density and reducing weight are two jobs. The first is a layout and ordering job. The second is mostly about media policy and not shipping code to devices that do not use it.

### 1.5 Dependencies and what they cost

| Dependency | Where | Used by | Phone cost today |
|---|---|---|---|
| Inline `<style>` (54.5 KB, 303 rules, 4 breakpoints: 900, 680, 640, 540 px) | The description | Everything | In the document; 54 rules match nothing in the markup |
| Chillax font | Fontshare stylesheet, requested by **our bundle** | TV; the description names it but does not load it | Requested on phones (by the engine), not needed there until the description is restyled |
| 7 videos, 4 cover images | `media.divinedunlop.com` | Description, television | 7 requests at load |
| Anchors (`#bp-…`) | Hero, bars, CTA | Navigation | None |
| JavaScript | None in the description | – | – |
| Our bundle (278 KB, 71 KB gzip) | Loaded by the site-wide loader | Television | Downloaded and run on every device |

### 1.6 What our bundle costs, by device *(Measured: `tests/live/engine-cost.cjs`, injected locally into the public page, 2 runs)*

| | Phone (4× CPU) | iPad (2× CPU) | Desktop |
|---|---|---|---|
| Bundle downloaded | 71 KB gzip / 278 KB | same | same |
| Evaluate + start | 404–417 ms | 212–274 ms | 94–99 ms |
| Television shown | **No** (standard view kept) | Yes | Yes |
| Requests it makes | 1 (the font stylesheet) | 12 (font, 4 cover textures, product thumbnails) | 12 |
| Nodes it builds | 124 (host and switch) | 1 113 inside its shadow root | 1 113 |
| Event listeners added | not reliable (−8 to +33 across 2 runs) | 135 | 135 |
| Heap added | within noise (−4.8 to +1.4 MB across 2 runs) | 2.2 MB | 2.2 MB |

Main-thread task time in the 4 s after injection rose by 2.2 s on the throttled phone; that window also contains Ecwid's own work, so only the evaluate-and-start figure is attributable to our code. **On a phone this is pure overhead**: the television is not shown. On iPad and desktop the television builds every screen at start and requests all four cover textures immediately, whether or not the visitor opens the Covers chapter.

### 1.7 Search engine position *(Read from the raw HTML of the public page)*

| Signal | State |
|---|---|
| Description text in the server-rendered HTML | **Yes**: all of it, including the 21 closed `<details>`; one occurrence of each id; no `<noscript>` dependency |
| `<title>`, meta description, canonical, Open Graph, Twitter card | Present (Ecwid-generated) |
| Structured data | One `Product` JSON-LD block (17 KB): name, images with alt text, SKU, GTIN, an `Offer` with availability and seller. No brand, rating or review. **`price` is `0.0`** (3.5) |
| Headings in the description | `h2` (hero), `h3` per section, `h4` inside; no `h1` (the page's `h1` is Ecwid's product name) |
| Alt text and labels | 4 of 4 images have alt text; 7 of 7 videos have an `aria-label` |
| Layout stability attributes | The 4 cover images lack `width`/`height`; no video has a `poster` |
| Text depends on a click or on JavaScript | No |

On collapsed content: search-industry reports of Google's statements say content in tabs and accordions is indexed and ranked under mobile-first indexing, while some practitioners advise keeping the most important content visible. **No Google documentation page was retrieved in this study; those are secondary reports**, so the rule adopted here is conservative: *the HTML is not changed, no text is removed, essential text stays visible, and a Search Console "URL Inspection" of the rendered page is a gate before any release* (section 6).

### 1.8 Accessibility

Native `<details>` and `<summary>` are keyboard- and screen-reader-operable. The cover switcher uses radios. The `:target` video modal is the weakest pattern (no focus management). Hero text colour depends on the dark gradient (protected by `!important`). Videos autoplay muted without a pause control on five of seven, which is contrary to common guidance for motion; `prefers-reduced-motion` is not honoured by the description (the engine's media manager does honour it).

---

## 2. Deliverable 2: content architecture proposal

**Principle: one approved source, several presentations. No second copy of the content.**

```
                   ┌──────────────────────────────────────────────┐
                   │  The approved Ecwid description (HTML)       │   ← single source of truth, indexed by search
                   │  + Ecwid product data (options, price, images)│
                   └───────────────┬──────────────────────────────┘
                                   │ read, never rewritten
        ┌──────────────────────────┼──────────────────────────────┐
        ▼                          ▼                              ▼
  Phone presentation        Television (tablet, desktop)    Standard view (everyone, always available)
  CSS + a few lines of JS   existing engine, scenes, gallery  the description as written
  no television code
```

| Layer | Contents | Shared between phone and television? |
|---|---|---|
| **Product information** | The description's text and structure | **Yes: the same HTML.** Nothing is retyped. |
| **Option data and price** | Ecwid's own controls | Yes, read-only from Ecwid; no selector is added on the phone |
| **Model configuration** | Existing `botanic.config.js`: which section is which role, option kinds | The *roles* are shared; the television's screen layout is not |
| **Media references** | Existing Visual Asset Registry (`DDTV_ASSETS`): id, role, approved use. Extended later with `poster` and `priority` | Yes: one place says which videos are proof loops, which is the full video |
| **Presentation rules** | Phone: which blocks stay open, which fold, media policy. Television: scenes | No, by design |

**Is a content manifest needed?** For the text, no: the description *is* the manifest, and a JSON copy would be a second thing to keep in step. A manifest is justified only for what the HTML cannot say: poster images, media priority, per-model "this section is decision-critical". The existing registry already carries that kind of data, so the proposal adds fields rather than a system. **Keep it simple.**

**What differs per phone presentation is expressed as a small phone profile** (same idea as the existing store profile): `decision sections`, `foldable sections`, `media policy`. A new model supplies its own list; the phone code is shared. Nothing Botanic-specific enters shared code (the existing ratchet test would be extended to cover it).

---

## 3. Findings the audit produced

### 3.1 The television bundle is loaded on phones *(Read from code, measured)*
`dist/embed/ecwid-loader.js` adds the bundle unconditionally. The phone check (`isPhone()`: shortest screen side under 600 px) runs *inside* the bundle after it has downloaded and evaluated. Phones pay 71 KB of transfer and ≈0.4 s of throttled main-thread time for code that then does nothing visible. This contradicts the stated requirement that the full television must not load on smartphones.

### 3.2 Videos start loading before they are seen *(Measured)*
Seven file requests at load on every device (1.2).

### 3.3 The television builds everything up front on tablets and desktops *(Measured)*
1 113 nodes and four cover-texture requests at start (1.6).

### 3.4 Two copies of the product page appeared in the DOM on the slow-phone profile *(Measured, needs real-device confirmation)*
In the throttled phone profile, 3 of 3 runs ended with **two complete product pages** (`.ec-store__product-page` ×2, `#productDescription` ×2, 14 video elements, 3 765 DOM nodes). The unthrottled phone profile (2 runs), iPad (3) and desktop (3) showed one. A visitor's screenshot looked like one page. This is Ecwid's behaviour under slow loading, not caused by our code (the engine was not loaded); it doubles the DOM and the media elements in that case. It cannot be fixed from the description, but it is one more reason to make media on-demand: with `preload="none"` a duplicate costs nothing. **To confirm on real phones on a mobile connection before it is relied on in any argument.**

### 3.5 Content observations for the owner *(nothing was changed)*
- Structured data: the `Offer` says `price: 0.0` (the store shows £0 until options are chosen). This is Ecwid-generated; it may be worth asking whether it affects product rich results.
- The Warranty section has no heading element (its title is a `<span>`); every other section has an `h3`.
- Firmness ranges are published as Medium 49–83 kg and Firm 83–114 kg: 83 kg appears in both.
- The call to action's closing sentence appears twice in the description.
- The "Your configuration at a glance" card duplicates the native options and states "Select your firmness above", which on a phone points at the native options above the description only if they are above it (to be checked on a device).

---

## 4. Deliverable 3: three phone presentations (design previews)

Built from the real description by `tools/mobile-prototypes.mjs` (non-deployed files in `docs/mobile/options/`). Open them on a phone or at 390 px; tap a poster and the real video loads from the real media host. The screenshots below use fallback fonts (Chillax is loaded from Fontshare, which this machine cannot reach).

**Shared by all three (the media policy):** the autoplaying hero teaser loop is retired on phones and the hero card plays the **full video on tap**; the five proof loops are tap-to-play poster boxes; decoration (leaf dividers, the floating Back to Top, section numbers) is not shown; transitions and blur effects are removed. Posters here are a flat colour: **real poster images do not exist yet** (one frame per video, produced from the files).

| | A: Optimised existing layout | B: Compact progressive | C: Hybrid editorial |
|---|---|---|---|
| Idea | Same 13 sections, same order, same look. Tighter spacing, no decoration, media on demand | Each chapter shows its heading, one line and its key facts; one tap reveals the rest | Decisions stay open (firmness, height, covers, certifications, warranty, delivery). The five proof videos become one swipeable row. The seven educational chapters become one flat list of rows |
| Permanent on screen | Everything that is permanent today | Chapter heading, lead line, key facts as chips | Decision content, proof row, trust content |
| Folded | What is folded today (20 `<details>`) | Whole chapter bodies (33 `<details>`, flattened to one level) | Educational rows (27 `<details>`, one level) |
| Order | Unchanged | Unchanged | **Regrouped** (decisions, proof, technical detail, trust, delivery) |

Screens: `docs/mobile/shots/compare-top.jpg` (first two screens of today and A, B, C side by side), `sheet-original.jpg`, `sheet-a.jpg`, `sheet-b.jpg`, `sheet-c.jpg` (every screen of each), `top-*.jpg` (first three screens at full size).

### 4.1 Measured result (description alone, phone width, offline; `docs/mobile/options/data/options-measure.json`)

| | Today | A | B | C |
|---|---|---|---|---|
| Height (px) | 26 103 | 20 061 (−23 %) | 12 088 (−54 %) | 11 822 (−55 %) |
| Screens of 844 px | 30.9 | 23.8 | 14.3 | 14.0 |
| Characters visible without a tap | 13 406 | 13 482 | 10 374 | 9 037 |
| Characters in the page (all) | 31 314 | 31 591 | 33 126 | 31 869 |
| Source texts still present | 422 | **422 / 422** | **422 / 422** | **422 / 422** |
| DOM nodes | 1 088 | 977 | 1 047 | 983 |
| `<details>` | 20 | 20 | 33 | 27 |
| `<video>` elements at load | 7 | 0 | 0 | 0 |
| Video requests at load | 7 | 0 | 0 | 0 |
| Blur effects / box-shadows | 3 / 97 | 0 / 42 | 0 / 42 | 0 / 42 |
| File gzip (HTML + CSS) | 25.7 KB | 26.6 KB | 27.2 KB | 27.1 KB |
| Layout / style time (unthrottled) | 25 / 6 ms | 29 / 4 ms | 19 / 3 ms | 23 / 3 ms |

How to read it:
- **Length falls a lot, weight does not.** DOM nodes and transferred size are within a few per cent of today. This is the brief's warning measured: collapsing is a reading-experience change.
- **Nothing is lost.** The completeness check compares every text of the source with the page; the omitted items are section numbers, zone codes and the floating Back to Top. B adds 1 800 characters of repeated key-fact chips (marked `aria-hidden`).
- **CSS is not smaller yet.** The previews add override rules to the original 54 KB stylesheet. A production phone stylesheet would be written to replace it (not estimated here).
- **Media is the unmeasured gain.** Seven requests become zero at load; the byte saving cannot be stated until the file sizes are known.

### 4.2 Assessment *(judgement from the previews; not user-tested; fonts are fallbacks)*

Scale 1 (weak) to 5 (strong).

| | A | B | C |
|---|---|---|---|
| Visual quality | 3 (the same look, tidier) | 3 (consistent, but every chapter looks the same: a stack of cards) | 4 (rhythm: open decisions, a visual row, a quiet list) |
| Ease of understanding | 3 | 4 (a summary for each chapter) | 4 (decisions first) |
| Ease of navigation | 3 (24 screens; needs the navigation bar) | 3 (every chapter closed; the reader must open it) | 4 (one row to swipe, one list to scan) |
| Information completeness | 5 | 5 (all in the DOM; a tap away) | 5 |
| Expected loading impact | media policy only | media policy only | media policy only |
| Search engine implications | None (HTML untouched) | Collapsed text; summaries repeat words | Collapsed text; **regrouping order changes if done by moving markup** (see 6) |
| Accessibility | 3 (as today) | 3 (many toggles, one level) | 4 (fewer toggles) |
| Implementation complexity | Low: CSS, attribute edits | Medium: a script that regroups, anchor-opens | Medium-high: regroup, swipe row, anchor-opens |
| Reuse across models | High: no model knowledge | Medium: needs "key facts" per section type | Medium: needs "decision vs education" per section |
| Compatibility with Ecwid | Full | Full | Full |

---

## 5. Deliverable 4: performance comparison

| | Measured today | Expected after (estimate, stated as such) | How it will be validated |
|---|---|---|---|
| Phone: our bundle downloaded | 71 KB gzip, every visit | **0 KB** (gate before the download) | `engine-cost.cjs` and the network panel on a real phone: no request to `botanic-tv.js` |
| Phone: main thread from our code | ≈0.4 s evaluate+start at 4× CPU | **0** | Same |
| Phone: font request from our code | 1 | 0 (the phone view uses what the page already loads, or one font file) | Network panel |
| Phone: video requests at load | 7 | **0** until a tap | `baseline.cjs` counts them; real-device network panel |
| Phone: video bytes at load | **Not measurable here** | Expected the largest single saving; unquantified | Run the media probe (section 6) from the owner's machine; then compare a real phone's transferred bytes before and after |
| Phone: description length | 26 103 px | A 20 061, B 12 088, C 11 822 | `mobile-prototypes.mjs` (measured on previews) |
| Phone: DOM nodes (description) | 1 088 | 980–1 050 | Same |
| Phone: transferred size (description) | 25.7 KB gzip | ≈ same | Same |
| Phone: LCP | 11.8 s lab (Ecwid image) | **Unaffected** by any option here | Lab and field; do not claim an LCP gain |
| Phone: total blocking time | 2.0 s lab | Small reduction at most (fewer shadows/transitions, no bundle) | `baseline.cjs` repeated after each stage, ≥3 runs |
| Tablet/desktop: TV start | 1 113 nodes, 4 cover requests, 94–274 ms | Defer scenes and textures until a chapter opens: fewer nodes and zero cover requests at start (target, not measured) | `engine-cost.cjs` before/after; test suites stay green |
| Layout shift | 0.033 (phone, slow) | Reserve space for posters and cover images (`width`/`height`, `aspect-ratio`) | `baseline.cjs` CLS |

**Measurements still required** (not available in this environment): real-iPhone and real-iPad runs (Safari, low-power mode, autoplay behaviour); the size, codec, bitrate and faststart state of each video; field data (Chrome UX Report or Search Console's Core Web Vitals report) for the live product; and a Search Console URL Inspection before and after.

Trade-offs, stated plainly: media on demand loses the autoplaying "alive" feel of the hero on phones; a regrouped order (C) reads better but is a different page from the one search engines see; a phone stylesheet is one more file to maintain per model.

---

## 6. Deliverable 5: recommended architecture

### 6.1 Loading: decide before downloading
```
site-wide loader (tiny, always)
   ├─ phone (shortest screen side < 600 px) ──► phone presentation (CSS + ~1 KB of JS; no television code)
   ├─ tablet / desktop ───────────────────────► television bundle (as today, later split in two)
   └─ ?ddtv=off, or any error ────────────────► standard view, untouched
```
The gate is one condition in the loader, using the same rule the engine already uses (so behaviour does not change; only the download is avoided). Rollback: the loader line.

### 6.2 Phone presentation: how it would be delivered
Two ways to carry the same HTML; both are options for the owner:

| | In the description (markup edits + a media query in the existing `<style>`) | A small phone stylesheet + script loaded only on phones |
|---|---|---|
| Media on demand | Edit the video attributes in the description (`preload="none"`, add posters) | The script converts videos at run time |
| Regrouping (C) | Needs restructured markup, which changes the order search engines see and affects the television's selectors | Run-time regrouping; the server HTML is unchanged |
| Cost to everyone | Larger document for all visitors | Only phones pay |
| Reversibility | Edit the description back | Remove one line |
| Recommendation | Only for the option-independent attribute edits | **For A's CSS and C's regrouping** |

### 6.3 Duplication avoided
No new content source; the phone and the television read the same description; the registry carries media facts once. Shared code stays model-free: the phone presentation reads a *phone profile* from the model configuration (the same mechanism as the existing store profile).

### 6.4 Native Ecwid controls
Nothing on the phone adds, moves, restyles or duplicates Ecwid's options, price or Add to Bag. A read-only aid (for example showing the weight range of the firmness the visitor has *already chosen in Ecwid*) is possible later; it would only read Ecwid's value and is listed as a decision, not designed.

---

## 7. Desktop and tablet: opportunities that keep the television as it is

All *measured as present, not yet as saved*. None removes a feature.

1. **Build screens when a chapter opens, not all at start.** At start the television builds 1 113 nodes. Deferring would cut start-up DOM and style work; the first chapter and the active screen still build at once.
2. **Cover textures on demand.** The four textures are requested at start; they are needed only in the Covers chapter.
3. **Split the bundle.** Engine and shell (≈ 90 KB raw, the part every view needs) separate from scenes (49 KB JS, 37 KB CSS) and gallery (35 KB JS, 8 KB CSS, already lazy in behaviour) so scenes load after first paint.
4. **Media on the same policy.** Proof loops start when their chapter is visible and pause otherwise (the media manager already parks and resumes; extend it to *request* late).
5. **Responsive assets.** The gallery already chooses sizes on demand from the storefront's records.
6. **Posters** (shared with the phone) so a screen never shows a black box while a loop loads.

Visual quality and every function stay; the existing 7 test suites (smoke, embed, gallery, model-reuse, two real-page suites, validator) are the regression gate.

---

## 8. Deliverable 6: implementation roadmap (nothing starts without approval)

| Stage | What | Depends on | Tests and gates | Rollback |
|---|---|---|---|---|
| **0. Measure what is missing** | Probe the seven media files (size, codec, bitrate, faststart) from a machine that can reach the host; real-device network panel; Search Console and field data for the live URL | Owner's machine and Search Console access | Written into section 5 as measured | None needed (read-only) |
| **1. Television gate** | Loader decides before downloading: phones get no bundle | Approval; deploy window | `engine-cost.cjs` shows no bundle request on phone profile; embed suite; real iPhone | Revert the loader line |
| **2. Media on demand** | Videos: no request until tap or until near the viewport; posters; the hero plays the full video on tap (the autoplay teaser retired on phones) | Posters produced (one frame per file); owner decision on autoplay | `baseline.cjs`: 0 video requests at load; real iPhone: playback, low-power mode, audio on the full video | Restore the attributes |
| **3. Option A on phones** | Decoration off, spacing tightened, blur and transitions removed, anchors kept | Stage 2 | Completeness check 100 %; `baseline.cjs` ×3; visual review on real phones | Remove the phone stylesheet |
| **4. Television deferrals** | Sections 7.1–7.3 | Stage 1 | All suites green; `engine-cost.cjs` before/after; E2 real-page suites | Previous bundle by hash |
| **5. Option C on phones** | Regroup, proof row, flat technical rows, anchor-opens | Owner has judged C on real phones; Stage 3 live | Completeness 100 %; Search Console URL Inspection; accessibility check; user feedback | Remove the script; A remains |
| **6. Second model** | The same phone profile applied to the placeholder model, proving reuse | Stage 3 | Reuse suite extended | – |

Every stage is a separate, reversible change on the **test product first** and is deployed only on explicit approval. Stage 0 needs no approval to run.

---

## 9. Deliverable 7: owner decisions

1. **Autoplay on phones.** Retire the autoplaying loops in favour of tap-to-play (recommended: saves data and battery, calmer), or keep one muted loop in the hero only?
2. **Posters.** Approve producing one poster frame per video (a short job from the video files); who chooses the frame?
3. **Television gate.** Approve the loader change so phones never download the television (recommended).
4. **Which phone option.** A now, C as the target after real-phone review (recommended); B not recommended; or another direction.
5. **Where the phone changes live.** The description itself (limited to attribute edits) or a phone stylesheet and script loaded only on phones (recommended for regrouping).
6. **The page order search engines see.** Keep the HTML order and regroup only at run time (recommended), or restructure the description itself.
7. **What stays visible on a phone.** Confirm the decision-critical list (firmness, height, covers, certifications, warranty, delivery) and whether the 22-size grid may be folded.
8. **Content points to confirm (not changed):** the 83 kg overlap in the firmness ranges; the `price: 0.0` structured data; the missing Warranty heading; the duplicated closing sentence.
9. **Hero "glance" card.** Keep (it repeats the options) or shorten on phones.
10. **A read-only aid near Ecwid's options** (for example the selected firmness's weight range): wanted at all? (Not designed; the brief forbids another selector.)
11. **Real-device access.** A real iPhone and iPad (or a device lab) for Stage 0 and for every later stage.

---

## 10. Limits of this study

- The media host is not reachable from this environment: no video or cover-image byte size, no playback timing, no video behaviour on iOS.
- Everything was run in Chromium; no Safari, no real phone or tablet (E4). Touch feel, autoplay rules and low-power mode are unverified.
- The previews were judged from screenshots with fallback fonts and by one reviewer; no user testing.
- The test product 876405767 was not available; all live measurements are of the public product, read-only, with nothing saved and Add to Bag never clicked.
- The "two copies" observation comes from one lab profile.
- Google's guidance on collapsed content was not read from Google's own pages.
- No change was made to the store, the description, the engine or the build; the new files are measurement scripts, the three non-deployed previews, and this document.
