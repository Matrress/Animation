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

Each main button opens its chapter on its **lead screen**. Each chapter has internal screens
listed in the Explore sidebar. Chapters that contain a selection keep **Select** (the customer
chooses, or sees the choice as a result) apart from **Learn** (explanation and presentation).

The screens are composed from the content of the description; they are not the description's
cards moved into a frame. Every screen below is built by a scene from `ddtv-scenes.js`.
Classic View of every chapter is the original section, in original order, with numbering.

| Button | Screens (Explore list) | What each screen is | Media | Native Ecwid option |
|---|---|---|---|---|
| Discover | Introduction · At a Glance | Dark hero with the loop video, "Watch Full Video" plays the original full file in the monitor · facts and the six key features as shortcuts | loop (autoplay), full (on demand) | – |
| Firmness | **Select:** Choose · Your firmness — **Learn:** Correct vs Softer · How It Works · Who It Is For | One weight scale, tap the range that holds your weight (sets Ecwid) with each range explained and the two decision notes · result screen · statement + analogy · explanation as one page · "for / not for" side by side | – | Firmness |
| Comfort | What To Expect · Latex Behaviour | Large editorial statement · six topics, pick one to read | – | – |
| Height | **Select:** Choose height · Your height · Choose size — **Learn:** Why Height Matters | Three depths drawn to scale, tap one (sets Ecwid) · result with big figure and the cross-section · all 22 sizes as tap targets with the chosen one drawn to scale · explanation | – | Depth, Size |
| Covers | **Select:** Choose cover · Your cover — **Learn:** Materials · Cover System | Large texture viewer, tap a cover (sets Ecwid) · result: texture, description, cover facts · the four materials side by side · cover-system topics | 4 textures | Covers |
| Benefits | Origin · Why Latex | Video beside six points that open one at a time · four topics | origin loop | – |
| Support | Bearing Force · Support + Adaptation | Four cards · explanation with two key figures | – | – |
| Adaptation | Elasticity · How It Feels | Video beside four points · explanation | elasticity loop | – |
| 7-Zone | Zone Map · Zone By Zone | Seven zones as a head-to-feet strip, tap a zone for its note and text, with the video · overview, zone by zone, additional effects | 7-zone loop | – |
| Ventilation | Airflow · Why It Matters | **Video first**, four points beside it · explanation with the animated comparison bars | airflow loop | – |
| Hygiene | Cleaner Sleep · Realistic Picture | Four cards · explanation with the two figures | – | – |
| Certifications | Certifications · Where It Is Made | Video beside five certifications · four topics with the key-facts table kept in view | durability loop | – |
| Warranty | Warranty + Gift · Conditions | Two large numerals · conditions as one page | – | – |
| Delivery | Made To Order · Your Botanic | Statement and production note · **summary of the customer's configuration** with price (from Ecwid), brand sign-off | – | all four |

**Select and Learn are different screens on purpose.** A "Choose" screen presents the options
and acts: tapping Cotton & Wool, 24 cm or Medium sets the native Ecwid control, exactly as if
the customer had used it. A "Your …" screen shows the result of the choice (and says plainly
when nothing is chosen yet). Explanations never choose anything.

**Nothing is lost.** `tests/smoke.mjs` takes every text in the description (387 of them:
headings, sentences, labels, numbers) and checks it is on a screen. What the television
deliberately does not show is listed with a reason in `notInTelevision` (config):

| Not shown | Reason |
|---|---|
| Section navigation bar | Replaced by the chapter buttons |
| Leaf dividers, floating Back to Top, Back to Top button | Long-page decoration and scrolling |
| Section numbers `01 —` … `13 —` | Specification: no numbering in Interactive View |
| Zone codes Z1–Z7 | The zone strip shows position head to feet instead (a decision for you) |
| Page overlay's close "×"; duplicate "Choose Firmness" on the video card | The monitor has its own; duplicate of the hero button |
| "All standard sizes — for reference only" and "Select your size from the dropdown menu above…" | The television now lets the customer choose a size, so the sentences would be wrong (a decision for you) |

**Silent-omission guards.** At start-up the engine audits the source (every section mapped,
every registered media URL present, every media file registered), and the test above checks
every text.

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

## 4. Original components and where their content goes

The original CSS components (cards, expanders, micro-slider) were designed for a long product
page. Interactive View keeps their **content** and gives it a layout made for a screen.

| Original component | Source class | New screen |
|---|---|---|
| Hero, main video card, full-video modal | `.b-hero`, `.b-main-video-card`, `.b-video-modal` | `hero`: copy, loop video, "Watch Full Video" plays the file from the modal's URL in the monitor |
| Configuration overview card, key-features bar | `.b-ocard`, `.b-hero-bar` | `facts`: fact tiles and feature shortcuts |
| Firmness cards, decision row, notice, analogy | `.b-fc`, `.b-fdecision`, `.b-fconf*` | `choose` (weight scale) · `result` · `reader` (statement + analogy) |
| "Who is it for" | `.b-dstack--who` | `reader` split: for / not for |
| Height table, size grid | `.b-hcol`, `.b-sgrid` | `choose` (depths to scale) · `result` · `choose` (sizes with to-scale drawing) |
| Cover micro-slider, cover menus, cover facts | `.b-cover-micro`, `.b-cover-menu`, `.b-itab` | `choose` (texture viewer) · `result` · `compare` · `reader` |
| Benefit / support / hygiene cards | `.b-bi` | `points` (cards, or points beside a video) |
| Micro-TV video cards | `.b-mtv` | Video figure inside `points` and `zones` (the same `<video>` element, moved, never cloned) |
| Zone grid and zone-by-zone text | `.b-zone-pill`, details | `zones` explorer |
| Certification cards, info tables | `.b-cert`, `.b-itab` | `points` with video · key facts beside the topics |
| Ventilation chart, data rows | `.b-vchart`, `.b-drow` | Animated bars · key-figure tiles |
| Warranty cards | `.b-wc` | `numerals` |
| Expandable explanations | `details` | `reader`: topics picked from a list, or one flowing page |
| CTA | `.b-cta` | Closing statement of `summary` |

---

## 5. Universal Engine Architecture

```
engine/ddtv-engine.js    shell, navigation, Ecwid connector, media, views     (shared)
engine/ddtv-scenes.js    scene library: reads the source, composes screens    (shared)
engine/ddtv-engine.css   shell styles                                          (shared)
engine/ddtv-scenes.css   screen styles                                         (shared)
products/<model>.config.js   chapters, which scene each screen uses, where its content is
source/<model>-original-description.html   the content, untouched
```

No dependencies, ES5, all styles scoped. About 150 KB unminified (JS 94 KB, CSS 56 KB); minifying and compressing is part of Phase H.

| Module | Responsibility |
|---|---|
| **Scenes** | A scene is a function that turns *where the content is* (selectors from the config) into a screen: `hero`, `facts`, `points`, `reader`, `choose`, `result`, `compare`, `zones`, `numerals`, `summary`. It reads text, numbers and media addresses from the description; no wording lives in code. A broken scene shows a notice on that one screen only. |
| **ConfigConnector** | Reads the native Ecwid options (value from select / radio / swatch) and normalises them. When the customer taps a choice in the TV it activates the matching native option (value + `input`/`change` events). Reads the price and discount text Ecwid renders. Never moves or restyles anything. |
| **Relocator** | Only for media: moves the original `<video>` into a screen and back, so there is one instance of each video. |
| **MediaManager** | Every video is parked at start (nothing downloads), only the active screen's loops play, the full video is created on demand and released on close. |
| **Television** | Two button rows (columns follow the chapter count), monitor with Explore sidebar, pinned "Your selection" and price, footer, presentation tour, measured alignment and height, view switching, brand moments. |
| **Audit + tests** | Start-up audit of sections and media; the test suite checks every source text is on a screen. |
| **Bootstrap** | `DDTV.boot()` uses `Ecwid.OnPageLoaded`, starts only for product IDs in a config. `?ddtv=off` kill switch. Any error leaves Classic View in place. |

**Adding another model** = one config file (chapters, scene per screen, selectors, option
matching, media registry). No engine change for 9, 12 or 14 chapters.

### Design language of the screens

- **Shape:** rounded corners only (6 / 10 / 14 / 18 px). No pills, no circles; verified for
  every element of every screen by the tests.
- **Colour:** snow graphite with a tropical-night blue accent, no green. The description's own
  palette is untouched in Classic View.
- **Type:** Chillax; 13 px is the smallest control text, body text 15–16.5 px.
- **Layout:** each screen adapts to the width of the screen itself (container queries) so the
  monitor works beside the options panel on desktop and iPad, landscape and portrait.
- **Motion:** restrained (fades, bars growing, slabs lifting); off with reduced-motion.
- **Brand:** the Divine DunlopDreams mark appears at three moments (opening the television,
  starting the presentation, completing a configuration) and signs off "Your Botanic". It is a
  wordmark until the logo file is supplied (`brand.logo` in the config).

### Customer-facing behaviour

- Choose on the TV or in Ecwid's own dropdown: both end in the same native selection.
- "Your selection" and the price (as Ecwid shows it) are pinned at the foot of the Explore
  sidebar on every screen; a choice appears there the moment it is made.
- Result tabs ("Your firmness" …) show a tick once the option is chosen.
- Chapter buttons show a dot once visited; the position is remembered for the session.
- "Play presentation" walks through the screens, timed by amount of text (7–22 s), skips the
  "Your …" screens, and pauses on any manual navigation.
- Previous/Next name the destination, crossing chapters.
- Changing an option never moves the customer away from what they are reading.
- Before a choice is made nothing is assumed: rows show "—" and result screens say so.

---

## 6. Ecwid Integration Strategy

**Principle:** native SIZE, Depth, FIRMNESS BY BODY WEIGHT and COVERS stay the single source
of truth, and Ecwid keeps the design, position and behaviour of its own controls. The
television never moves, restyles, replaces, wraps or hides them (the hide list refuses anything
inside the options column). Price, discounts, Add to Bag and Checkout are untouched.

**What the television does with them (owner's instruction, revised):**

1. *Reads* every choice and the price Ecwid shows, and prepares its screens for them.
2. *Acts through them:* when the customer taps a choice inside the television, the engine
   activates the matching native option, the same change a customer would make (value plus
   `input` and `change` events). Ecwid then does what it always does (price, availability).
   If no matching native option is found the television says so on screen and asks the
   customer to choose in the options panel; it never pretends.

Enforced by tests: with the engine off, on, in Classic View, and after choices made in the
television, the options column's markup, computed styles and geometry are identical (only the
chosen values, and the price text Ecwid updates, differ). *Must be verified on the real Ecwid
controls: the way Ecwid builds its dropdowns decides whether a programmatic change is accepted.*

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
| H. Testing | `tests/smoke.mjs`: 104 automated checks pass (desktop, iPad landscape/portrait, iPhone, kill switch, Ecwid column untouched, choices made in the TV reach Ecwid, every source text on a screen, no pills). Real-device Safari testing still required |
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
2. *Firmness ranges* now follow the front page and the Firmness page (Soft 0–48, Medium 49–83,
   Firm 83–114, Extra Firm 115+ kg). The stone values for the new bounds are derived from kg
   (1 st = 6.35 kg), not taken from a source. Open points for the owner: 83 kg appears in both
   Medium and Firm on the front page; the live Ecwid option reads "Medium 48–85 kg / 7.6–13.4 st",
   which differs from both and needs a decision before any store change (store changes need approval).
3. *SiteGround instructions* not supplied. The loading approach in section 6 is a proposal.
4. *Live description length* (~158k reported vs 141,763 supplied). Whitespace may explain it, or material
   may exist that is not mapped yet; a diff against an export settles it.
5. *"Existing developed seven-zone component"*: the supplied source contains the zone grid
   and the 7-zone video only. If a richer animated component exists elsewhere, it was not
   in the supplied file.
6. *Adjustable-base compatibility restrictions*: the spec asks to respect them, but the
   source contains none (only the elasticity video titled "adjustable bed"). Need the
   approved wording.

7. *Firmness Code Collection Interface and Header* (the earlier firmness work you mention): not
   in this repository, so nothing from it was reused. Please share the files; the weight scale
   on the Choose screen is where its slider would go.
8. *The Divine DunlopDreams logo file.* A wordmark stands in (`brand.logo` takes the URL).
9. *Tools to download for visuals:* none were added on purpose. The screens use CSS and a few
   lines of JavaScript only, which keeps the page light and stable on iPad Safari. A library
   can be added for a specific effect if you name one.

**Wording decisions for you** (the television follows the description; these are the places
where its wording no longer fits the new behaviour)

- "Select your firmness above." (firmness decision note) now sits under the weight scale, so
  it reads correctly; "Select your size from the dropdown menu above" and "for reference only"
  (size list) would be wrong now that sizes are chosen in the television, so they are not shown.
- Zone codes Z1–Z7 are not shown (numbering rule); the zones are shown head to feet.

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
