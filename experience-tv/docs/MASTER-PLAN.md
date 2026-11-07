# Experience TV Engine: Phase A–B report and architecture for approval

Reference model: **Botanic Original 100% Organic Latex Mattress**
Live product 831592302 (not touched). Test product 876405767 (target for Phase D–F).
Status: **prototype for review.** Nothing has been published to Ecwid.

This document answers section 17 of the Master Development Specification V3.
Every statement about the source refers to `source/botanic-original-description.html`,
which is the description exactly as supplied.

---

## 1. Complete Source Inventory

### 1.1 Files received

| Item | Status |
|---|---|
| Original Botanic description HTML (CSS "ECWID SAFE BLOCK v9.1" + `.dd-botanic-page` markup) | Received, stored verbatim in `source/` |
| Approved Experience TV prototype | Screenshot of V11 received; layout follows it (section 7). Source file not received. |
| Authoritative Firmness page | **Not received.** Firmness ranges are taken from the description only. |
| SiteGround instructions | **Not received.** Hosting/integration steps below are proposals until those instructions are supplied. |
| Live Ecwid DOM of product 876405767 | Not inspected (no store access from this environment). All Ecwid selectors are marked as assumptions. |

The supplied file is 141,763 characters (54,527 CSS + 87,236 markup, including indentation). The live description is reported at about 158,000.
The difference must be explained before Phase D sign-off (export of the live HTML, then diff).

### 1.2 CSS blocks in the source

| Block | Purpose | Kept |
|---|---|---|
| "Ecwid product description — always fully open" | Removes Ecwid Show More, collapsed heights, fade overlays | Yes, unchanged |
| `.dd-botanic-page` tokens | Palette `#364849 / #DDEBF1 / #759397 / #797572`, Chillax, spacing scale, radii 12/18 px | Yes; the TV reuses the same tokens |
| Hero, main video card, video modal (`:target`) | Discover | Yes |
| Overview card, key-features bar, section nav bar | Discover / navigation | Yes |
| Leaf divider | Decoration between sections | Classic View only |
| Details/summary, prose, data rows | Expandable explanations | Yes; shown open as screens in Interactive View |
| Firmness cards, notice, analogy, decision row, "Who is it for" | Firmness | Yes |
| Comfort card | Comfort | Yes |
| Height table | Height | Yes |
| Cover micro-slider (CSS-only radios), cover menus | Covers | Yes |
| Benefit grid, micro-TV video cards (`.b-mtv`) | Benefits, Support, Adaptation, Ventilation, Hygiene, Certifications | Yes |
| Zone grid | 7-Zone | Yes |
| Certification cards, info table | Certifications, Covers | Yes |
| Size grid | Height (reference sizes) | Yes |
| Ventilation chart | Ventilation | Yes |
| Warranty cards | Warranty | Yes |
| CTA, floating Back to Top | End of page | CTA in TV; Back to Top Classic only |
| Responsive rules (900 / 680 / 640 / 540 px) | Mobile | Yes, unchanged (phones use Classic View) |
| Icon dimension fix (2026-10-27), hero text colour protection (2026-11-01) | Safety fixes | Yes |

### 1.3 Sections in the source

`#bp-top` (wrapper and hero) and 13 sections, in this order:
`bp-firmness`, `bp-comfort`, `bp-height`, `bp-covers`, `bp-benefits`, `bp-support`,
`bp-adaptation`, `bp-zones`, `bp-ventilation`, `bp-hygiene`, `bp-certs`, `bp-warranty`,
`bp-delivery`, followed by `.b-cta` and `.b-floating-top`.

Section numbering in the source runs 01–13 (`.b-sh__n`).

### 1.4 Interactive behaviour in the source

All CSS-only, no JavaScript:

- `<details>` expanders (21 in total, including 4 cover menus and the nested warranty details).
- Cover texture switcher: 4 hidden radios `#bp-cover-micro-1..4` with labels.
- Full-video modal using `:target` (`#botanic-main-video-modal`).
- In-page anchors (`#bp-firmness`, `#bp-benefits`, …) from hero, feature bar, nav bar and CTA.
- Hover lifts on cards.

---

## 2. Chapter-by-Chapter Definition Matrix

Every main button opens its chapter on its **lead screen** (the screen with the
chapter's main visual). Each chapter has internal tabs. Content is moved, never copied.
Classic View for every chapter is the original section, in original order, with numbering.

| Button | Source | Purpose | Internal screens (tabs) | Primary visual | Media | Ecwid link | Acceptance (automated, `tests/smoke.mjs`) |
|---|---|---|---|---|---|---|---|
| Discover | `#bp-top .b-hero`, `.b-ocard`, key-features bar | Introduce Botanic, play the presentation | Introduction · At a Glance | Hero with main video card | Loop preview autoplays muted; full video opens inside the screen with sound and controls | None | Loads first; full video opens in-screen, loads only on demand, Escape closes; hero buttons open their chapters |
| Firmness | `#bp-firmness` | Firmness by individual body weight | By Body Weight · Correct vs Softer · How It Works · Who It Is For | 4 firmness cards + decision row | – | Firmness | Selected card highlighted; "Extra Firm" never matches "Firm" |
| Comfort | `#bp-comfort` | What comfort to expect | What To Expect · Latex Behaviour | Comfort card | – | – | Content present |
| Height | `#bp-height` | Depth choice and reference sizes | Heights · Why Height Matters · Sizes | **Depth Visualisation** (engine component) + height table | – | Depth, Size | Selected depth highlighted in table and visual; size highlighted in reference grid |
| Covers | `#bp-covers` | Cover materials and the cover system | Textures · Materials · Cover System | Original cover micro-slider | 4 texture images | Covers | Slider shows the native selection; selected tab badged; materials card highlighted |
| Benefits | `#bp-benefits` | Why organic latex | Origin · Why Latex | Origin video beside the benefit cards | `natural-latex-milk-to-foam-origin.mp4` | – | Video visible on open |
| Support | `#bp-support` | Bearing force (kept distinct from Firmness) | Bearing Force · Support + Adaptation | Benefit cards, data row | – | – | Content present |
| Adaptation | `#bp-adaptation` | Elasticity and instant response | Elasticity · How It Feels | Elasticity video | `natural-latex-elasticity-adjustable-bed.mp4` | – | Video visible on open |
| 7-Zone | `#bp-zones` | Seven calibrated zones | Zone Map · Zone By Zone | Original zone grid + video | `natural-latex-7-zone-spinal-alignment.mp4` | – | Video visible on open |
| Ventilation | `#bp-ventilation` | Airflow and microclimate | Airflow · Why It Matters (includes ventilation chart) | **Airflow video first** | `natural-latex-airflow-ventilation-channels.mp4` | – | Video fully inside the screen without scrolling |
| Hygiene | `#bp-hygiene` | Cleaner sleep, realistic claims | Cleaner Sleep · Realistic Picture | Benefit cards, data row | – | – | Content present |
| Certifications | `#bp-certs` | Certifications, testing, production origin | Certifications · Where It Is Made | Durability video beside cards | `natural-latex-durability-pressure-test.mp4` | – | Video visible on open |
| Warranty | `#bp-warranty` | Warranty and gift | Warranty + Gift · Conditions | Warranty + pillows cards | – | – | Conditions (nested details) present in full |
| Delivery | `#bp-delivery`, `.b-cta` | Made to order; the customer's own Botanic | Made To Order · Your Botanic | **Selection Summary** (engine component) + original CTA | Cover texture thumbnail from source | All four | Summary reads values and ranges from the content; shows what is still open |

Not shown inside the television (kept in Classic View), with reason:

| Element | Reason |
|---|---|
| Section navigation bar (`nav.b-hero-bar`) | Replaced by the chapter buttons |
| Leaf dividers | Decoration between long-page sections |
| Floating Back to Top | The television does not scroll the page |
| Section numbers `01 —` … `13 —` | Specification: no numbering in Interactive View |

**Silent-omission guard.** At start-up the engine audits the source: every `section[id]`
must map to a chapter, every registered media URL must exist in the source, and every
media file in the source must be registered. The prototype reports zero issues.

---

## 3. Complete Media Asset Registry

Held in `products/botanic.config.js` → `media`. URLs are exactly as in the source.
Nothing has been downloaded, renamed, re-encoded or rehosted.

| URL (all under `https://media.divinedunlop.com`) | Type | Chapter | Role | Playback | Loading priority |
|---|---|---|---|---|---|
| `/videos/botanic-natural-latex-mattress-premium-presentation-loop.mp4` | video | Discover | Preview loop (pairs with full) | Autoplay, muted, loop, inline | High: first screen |
| `/videos/botanic-natural-latex-mattress-premium-presentation-full.mp4` | video | Discover | Full presentation (pairs with loop) | User-started, controls, sound | On demand only |
| `/videos/natural-latex-milk-to-foam-origin.mp4` | video | Benefits | Proof loop | Autoplay, muted, loop | When the chapter opens |
| `/videos/natural-latex-elasticity-adjustable-bed.mp4` | video | Adaptation | Proof loop | Autoplay, muted, loop | When the chapter opens |
| `/videos/natural-latex-7-zone-spinal-alignment.mp4` | video | 7-Zone | Proof loop | Autoplay, muted, loop | When the chapter opens |
| `/videos/natural-latex-airflow-ventilation-channels.mp4` | video | Ventilation | Proof loop | Autoplay, muted, loop | When the chapter opens |
| `/videos/natural-latex-durability-pressure-test.mp4` | video | Certifications | Proof loop | Autoplay, muted, loop | When the chapter opens |
| `/covers/natural-cotton-cover-texture.webp` | image | Covers | Texture: Organic Cotton | – | Lazy (original `loading="lazy"`) |
| `/covers/cotton-wool-cover-texture.webp` | image | Covers | Texture: Cotton & Wool | – | Lazy |
| `/covers/aloe-vera-cotton-viscose-cover-texture.webp` | image | Covers | Texture: Aloe Vera + Cotton | – | Lazy |
| `/covers/cashmere-silver-ions-cover-texture.webp` | image | Covers | Texture: Cashmere + Silver Ions | – | Lazy |

Graphics generated by CSS in the source (no files): leaf divider SVG, summary +/× icon,
ventilation bars, gradients, zone/firmness/height cards.

**Fallback behaviour.** If a video fails, its frame keeps the original dark background and
the explanatory title/description beneath it stays readable. If the engine fails, the
original description is untouched.

**One instance per video.** Both views use the same `<video>` elements (moved, not cloned).
Verified: 7 videos in the page before and after switching views.

---

## 4. Existing Visual Component Inventory

| Component | Source class | Where in the TV | Notes |
|---|---|---|---|
| Hero | `.b-hero` | Discover / Introduction | Two-column, compacted for the screen |
| Main video card + full-video modal | `.b-main-video-card`, `.b-video-modal` | Discover | Modal opens inside the screen instead of full page |
| Configuration overview card | `.b-ocard` | Discover / At a Glance | Static list from the source |
| Key features bar | `.b-hero-bar` (div) | Discover / At a Glance | Links jump to chapters |
| Firmness notice, analogy, cards, decision row | `.b-fconf*`, `.b-fc`, `.b-fdecision` | Firmness | Cards synced to native Firmness |
| "Who is it for" panel | `.b-dstack--who` | Firmness | Keeps dark heading |
| Comfort card | `.b-comfort-card` | Comfort | – |
| Height table | `.b-htable` | Height | Synced to native Depth |
| Size reference grid | `.b-sgrid` | Height / Sizes | Synced to native Size |
| Cover micro-slider | `.b-cover-micro` | Covers / Textures | Same radios; set from native Covers |
| Cover menus | `.b-cover-menus` | Covers / Materials | Shown open; selected one highlighted |
| Benefit grid | `.b-bgrid` | Benefits, Support, Adaptation, Ventilation, Hygiene | – |
| Micro-TV video card | `.b-mtv` | Benefits, Adaptation, 7-Zone, Ventilation, Certifications | Video placed first and kept in view |
| Zone grid | `.b-zone-grid` | 7-Zone | Original component, unchanged structure |
| Certification cards | `.b-cert` | Certifications | – |
| Info tables | `.b-itab` | Covers, Certifications | – |
| Ventilation chart | `.b-vchart` | Ventilation / Why It Matters | – |
| Data rows | `.b-drow` | Support, Hygiene | – |
| Warranty cards | `.b-wc` | Warranty | Nested details become the Conditions screen |
| CTA | `.b-cta` | Delivery / Your Botanic | Buttons jump to chapters inside the TV |

New, engine-owned (reusable): **Depth Visualisation** (`depthProfile`) and **Selection
Summary** (`selectionSummary`). Both read their numbers from the content, not from code.

---

## 5. Universal Engine Architecture

```
engine/ddtv-engine.js   shared, product-agnostic (≈ 48 KB unminified, no dependencies, ES5)
engine/ddtv-engine.css  shared styles, all scoped under .ddtv-wrap / ddtv-
products/<model>.config.js  everything specific to one mattress
source/<model>-original-description.html  the content, untouched
```

| Module | Responsibility |
|---|---|
| **Relocator** | Moves original nodes into TV panels behind comment markers; restores them in reverse order. One copy of all content; reversible. |
| **ConfigConnector** | Reads native Ecwid option blocks (title → key by regex; value from checked radio / selected option / pressed swatch). Normalises values (firmness id, depth cm, size dims, cover index). Never writes to Ecwid. |
| **MediaManager** | Parks every video at start (removes `src` so nothing downloads), plays only the active screen's loops, loads the full video on demand; IntersectionObserver in Classic View/phones. Respects reduced motion. |
| **Television** | Builds the device: two button rows (split automatically from any number of chapters), screen header with selection chips and internal tabs, viewport, footer with Previous / Play presentation / Next. Handles anchors, keyboard, overlay video, view switching, layout measurement. |
| **Components** | Registry for configuration-aware visuals. `depthProfile`, `selectionSummary`; new ones are added once and used by any model. |
| **Audit** | No-silent-omission check at start-up (`DDTV.current.report`). |
| **Bootstrap** | `DDTV.boot()` uses `Ecwid.OnPageLoaded` and starts only for product IDs listed in a config. `?ddtv=off` kill switch, `?ddtv=classic` for testing. Any error leaves Classic View in place. |

**Adding another model** = one config file: chapter list with `take` selectors, option
matching, value tables, sync rules, media registry. No engine change for 9, 12 or 14
chapters (button rows split and compact themselves; verified with Botanic's 14).

### Customer-facing behaviour

- Chapter buttons show a dot once visited, so the customer sees where they have been.
- The position is remembered for the session; switching views and back returns to it.
- "Play presentation" walks through every screen in order, timed by the amount of text
  (7–22 s); any manual navigation pauses it.
- Previous/Next name the destination ("Next: Correct vs Softer"), crossing chapters.
- Changing an option never moves the customer away from the chapter they are reading;
  the matching selection chip pulses instead.
- Before a choice is made, nothing is assumed: chips show "—" and the summary lists what
  is still open.

---

## 6. Ecwid Integration Strategy

**Principle:** native SIZE, Depth, FIRMNESS BY BODY WEIGHT and COVERS stay the single
source of truth. The TV reads, never writes, never duplicates. Price, discounts, Add to
Bag and Checkout are not touched.

**Hands-off rule (owner's instruction).** The selection controls belong to Ecwid: their
design, position, dropdowns and behaviour are not moved, restyled, replaced or wrapped.
The TV works *alongside* them: it listens to what the customer chooses and prepares the
screen with the matching information. Enforced in code (the hide list refuses anything
inside the options column or an option block) and in tests: with the engine off, on,
and in Classic View, the options column's markup, computed styles and geometry are
identical.

1. **Loading.** Ecwid strips scripts from product descriptions, so the engine cannot live
   inside the description. Proposal: load `ddtv-engine.css`, `ddtv-engine.js` and
   `botanic.config.js` from `media.divinedunlop.com` (or SiteGround) through the site's
   existing page-level script area, and call `DDTV.boot()`. The engine activates only on
   product IDs in the config (`876405767` now), so other pages are unaffected.
   *Requires approval because it adds a script to the site. Pending the SiteGround
   instructions.*
2. **Page detection.** `Ecwid.OnPageLoaded` (documented Ecwid storefront JS API) with
   `page.type === 'PRODUCT'` and `page.productId`. On every page change the previous
   instance is destroyed and the description restored.
3. **Reading options.** No documented storefront event for option changes was relied on.
   The connector listens to `change`/`click` (capture), a MutationObserver on the product
   area, and a 1.5 s safety poll while the tab is visible. *To verify:* whether the current
   Ecwid storefront API exposes option state directly; if so, swap the DOM reader for it
   (one method).
4. **Selectors to confirm on the test product** (assumptions today):
   `.details-product-option` blocks, `.details-product-option__title` titles,
   `.details-product-option--Size` for alignment, `.product-details__gallery` (left
   column), `.product-details__sidebar` (right column), `.product-details__description-title`
   (Product Details heading).
5. **Option names/values to confirm:** exact titles ("SIZE", "Select Mattress Depth",
   "FIRMNESS BY BODY WEIGHT", "COVERS") and value strings, so the regex tables match.

---

## 7. Desktop and iPad Layout Plan

**Composition (follows the V11 prototype).** Left column, top to bottom: a header row
("BOTANIC / Experience" with the Interactive / Classic switch), seven equal chapter
tiles, the framed monitor, seven more tiles. Inside the monitor: an **Explore** sidebar
listing the chapter's internal screens and, below it, **Your selection** (the native
choices mirrored read-only, each a shortcut to the matching screen); on the right the
chapter heading, content, and Previous / Play presentation / Next. Right column: the
native Ecwid panel, untouched.

**Colour.** Cool snow graphite with a tropical-night blue accent, no green. The shell uses
`--tv-*` tokens; a "theme bridge" in the engine CSS re-points the description's own variables
(`--ink`, `--accent`, backgrounds, shadows) and its few fixed dark gradients inside the
television only. Classic View keeps the original Botanic palette unchanged.

**Your selection** is pinned at the foot of the Explore sidebar, so it is on screen on every
screen, never scrolled away; each choice appears the moment it is made (tick and a brief
highlight), before any choice the four rows show "—".

Differences from V11, by design: no "01–14" numbers on the tiles (specification §8 forbids
numbering in Interactive View; can be switched on if you prefer the V11 look), and no
price or promotion inside the TV (that stays in Ecwid's panel).

**Alignment with SIZE.** The **top frame of the monitor** starts exactly where the SIZE row
starts (measured from the rendered page: 0 px difference in the prototype at 1440 × 900 and
iPad landscape). The header row and the upper chapter buttons sit above the monitor, in the
space beside Ecwid's title and price. Whatever height Ecwid leaves above SIZE is spent in
small even steps (upper buttons up to 8 px taller, up to 14 px more between header and
buttons, up to 14 px between buttons and monitor) so no single empty band appears; only a
remainder beyond that becomes top margin (16 px in the 1440 demo). The engine owns four
values (wrapper top margin and three spacing variables); no negative margins, no stacked
`!important`. It re-measures on resize, on font load, and when the right column changes
height. Alignment applies only when the two columns are side by side. *On the real page the
leftover depends on how tall Ecwid's title and price block is; it must be checked on
876405767.*

**Product Details heading.** Hidden with `display: none` (no reserved height) only in
Interactive View; restored in Classic View.

**Monitor height.** The viewport height is calculated, not fixed:
- upper bound: the whole unit stays within ~92% of the browser height, so it never fills
  the screen and Add to Bag stays in reach;
- balance: when the native panel is beside it, the screen extends to roughly the panel's
  bottom edge;
- lower bound 360 px; upper bound 860 px.
Content that is longer than the screen scrolls inside the screen with a fade hint; the
page itself does not move.

**Gallery.** In the prototype the native gallery is hidden in Interactive View (Discover
shows the presentation video). *Decision needed* (section 10).

**iPad.** Landscape (1180 × 820): side by side, same alignment. Portrait (820 × 1180):
Ecwid stacks the columns; the TV takes full width and the options follow below. Both
verified: unit fits within the viewport, no horizontal scroll.

---

## 8. Classic View and Mobile Plan

- **Classic View** is the original description in its original order with original
  numbering, every image, video, expander and effect. It is not rebuilt: switching to
  Classic puts every moved node back exactly where it was.
- **Single content source:** there is one copy of each text and media element. Editing the
  description updates both views.
- **Switching** keeps native selections (verified) and the TV position for the session.
- **Phones (< 768 px):** no television, no switch. The original description renders as
  today. The engine only defers videos until they come into view and pauses them when
  they leave (7 of 7 parked at load in the iPhone test), which reduces data and decoding
  on older iPhones. If the engine is not loaded at all, the page is exactly as it is now.
- Selection highlights also appear in Classic View (e.g. "Your firmness" on the matching
  card).

---

## 9. Development Sequence

| Phase | Status |
|---|---|
| A. Source audit | Done for the supplied HTML. Live-vs-supplied diff pending. |
| B. Chapter mapping | Done (section 2); awaiting approval |
| C. Engine architecture | Prototype built (`engine/`) |
| D. Botanic implementation | Prototype built against the mock page; needs the live DOM |
| E. Ecwid synchronisation | Built against a mock using assumed Ecwid markup; verify on 876405767 |
| F. Layout integration | Measured alignment and height built; tune on the real page, desktop + iPad |
| G. Classic and mobile | Built; verify on iPhone Safari (older devices included) |
| H. Testing | `tests/smoke.mjs`: 99 automated checks pass (desktop, iPad landscape/portrait, iPhone, kill switch, Ecwid column untouched). Real-device Safari testing still required |
| I. Approval | This document + prototype |

Next steps after approval:
1. Export the live description and the rendered product page DOM of 876405767.
2. Confirm selectors and option strings; adjust `layout` and `options` in the config.
3. Load the engine on the disabled test product only; test desktop, iPad, iPhone Safari.
4. Review screenshots; then decide on live rollout.

---

## 10. Risks, Conflicts and Missing Dependencies

**Missing inputs**
1. *Approved Experience TV prototype*: a screenshot of V11 was supplied and the layout now
   follows it (section 7). The V11 source file itself was not supplied.
2. *Authoritative Firmness page* not supplied, so possible outdated ranges cannot be
   identified. The description's ranges (Soft 0–48, Medium 49–87, Firm 88–114,
   Extra Firm 115+ kg) are shown as they are. Note a small gap: "up to 7.5 st" then
   "7.7 – 13.7 st" (48–49 kg); worth checking against the authoritative page.
3. *SiteGround instructions* not supplied. The loading approach in section 6 is a proposal.
4. *Live description length* (~158k reported vs 141,763 supplied). Whitespace may explain it, or material
   may exist that is not mapped yet; a diff against an export settles it.
5. *"Existing developed seven-zone component"*: the supplied source contains the zone grid
   and the 7-zone video only. If a richer animated component exists elsewhere, it was not
   in the supplied file.
6. *Adjustable-base compatibility restrictions*: the spec asks to respect them, but the
   source contains none (only the elasticity video titled "adjustable bed"). Need the
   approved wording.

**Content observations (not changed)**
- Hero says "20 Days Delivery" and the overview says "20 Days · Custom Made to Order",
  while the Delivery section says the timeline is confirmed after the order. These may
  read as conflicting; please confirm the approved delivery wording.
- Benefits says OEKO-TEX covers foam and textile; Certifications says the same. Consistent.
  "GRS" appears only in the certifying-bodies table with no explanation.
- Ventilation chart percentages and mite counts are presented as in the source; please
  confirm they are approved figures.
- Copy uses British English throughout; no changes made.

**Technical risks**
- Ecwid class names and option markup may differ from the assumptions (mitigated: all in
  config; connector tries several patterns).
- No official option-change event relied on (mitigated: events + observer + poll).
- Loading a site-level script is a change to the store setup (requires approval; scoped to
  configured product IDs; `?ddtv=off` kill switch).
- `:has()` used for one cosmetic shadow; older Safari simply omits it.
- Chillax must be available on the page (it is on the live site; the prototype loads it
  from Fontshare).

**Decisions needed from you**
1. Hide the native gallery in Interactive View (prototype default) or keep it above/beside?
2. Approve the proposed loading method (section 6) once SiteGround instructions are shared.
3. Keep "Your Botanic" summary as the last screen of Delivery, or make it its own button?
