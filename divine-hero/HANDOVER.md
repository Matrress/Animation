# Divine DunlopDreams Hero — PROJECT HANDOVER

Written 2026-10-09 for a fresh Claude Code session. State described: **release 1.14.0**, branch `claude/divine-hero-polish`, repo `Matrress/Animation`, folder `divine-hero/`, PR #1. Nothing here was invented: where a fact could not be confirmed it is marked **UNVERIFIED** or **MISSING**.

> Terminology: the owner says "Header". The project is the **homepage hero section** that sits under (and behind) the transparent Ecwid Instant Site header. The Ecwid header itself (announcement bar, logo, menu, Email Us, icons) is **not ours and must never be touched**.

---

## 0. How to start the new session (read this first)

1. Open the repo at `/home/user/Animation/divine-hero` on branch `claude/divine-hero-polish` (clean tree at handover; latest commit `c29045a "1.14.0: pin, docs"`).
2. Read, in this order: this file → `REPORT.md` (top entries 1.14.0 → 1.10.0 matter most; each version lists owner request + what was done) → `INSTALL.md` → `README.md`.
3. Do **not** redesign. Every version has been an incremental upgrade of the approved v26 concept. The owner's rule since message 1: *polish, never replace the concept.*
4. Before any work, reread §3 (owner's latest instructions), §6 (restrictions) and §8 (open questions).
5. Suggested first message to the owner (in Bulgarian, see §1): confirm which of the open questions in §8 he wants answered now; do not start a redesign.

---

## 1. Owner, language, working agreement

- Owner: Martin (martindesign.uk@gmail.com), runs divinedunlop.com (Ecwid Instant Site). Writes mostly **Bulgarian** (informal, friendly; asked to be addressed as "ти"). Some large briefs are in English; when a brief is in English, answering in English was accepted. His most recent messages are Bulgarian → reply in Bulgarian.
- Every delivery so far ended with: a short Bulgarian summary, tests run, items needing his confirmation, and the **full pinned jsDelivr section code in one ```html block** so he can copy it with one click ("целия код … да го копирам само с копи бутон"). Keep doing that.
- He wants screenshots/previews of the result (sent with `SendUserFile`, saved in `reports/compare/<version>-*.png`).
- Tone he rewards: calm, premium, minimalist, "engineering marketing" — "красив, умен и стои на инженерни открития, а не на маркетингови глупости". He dislikes clutter ("не като гювеч, а като десерт за окото"), gimmicks ("без бяла светлина, балони и селски неща"), and unrequested changes ("кой ти каза да разваляш…").
- **Hard operating constraints (original brief, still binding):** do not modify the live site, do not deploy to production, do not disable existing Ecwid sections, do not remove existing Ecwid shop buttons yet, do not change current navigation, build and test independently; **production changes require explicit approval**. Nothing on divinedunlop.com has been changed so far.

---

## 2. What the product is

A single Ecwid **Embed & Custom Code** section (≈10.3k characters, pinned jsDelivr form) that loads external `hero.css`, `hero.js`, per-language `sheets/<lang>.html` and WebP assets from `release/<version>/`. It renders:

- Full-bleed photo of a woman sleeping on a natural-latex pillow beside the Dual Plush mattress, clouds running behind the Ecwid menu.
- Upper-right lockup (one geometric object): leaf inside the word **LATEX** + "European Production / Certified for UK & EU" justified to the LATEX width. (The old Mattresses/Toppers/Pillows bar was removed on request; Ecwid's own menu carries them.)
- Primary benefits list baked in the photo (High Support / Anatomical Balance / Orthopaedic Comfort / High Adaptability), DIVINE Dunlop Dreams logo, "Engineering Natural Latex Sleep System".
- Pulsing hotspots (points) → texts, context cards, Dual Plush lift, Bio Comfort screen, night mode.
- Two Shop buttons ("Shop Your **Latex Mattress**" / "…**Latex Topper**"), transparent glass at rest, graphite with white text on hover/press/focus. Hovering (or tapping on tablets) opens the **model selectors** (mattress: 8 models, topper: 3 models).
- Global size guide ("All UK & EU Sizes" round ruler badge, no prices).
- 8 languages: DE, SV, FR, ES, PT, EL, FI, IT (English is the HTML).

### 2.1 Repository map (`divine-hero/`)
| Path | Role |
|---|---|
| `src/hero.css` (~145 KB source), `src/hero.js` (~57 KB), `src/section.html` | Sources. CSS is **layered by version: later blocks override earlier ones** (the 1.14.0 theme is appended at the end). Do not refactor casually; append/override carefully and re-run all tests. |
| `src/sheets.html` + `src/sheets-i18n/<lang>.txt` | English source of the selectors, Bio Comfort screen, context cards, size guide; `data-t`/`data-ta` keys translated per language. **Build fails if any language lacks a key.** |
| `src/models.json`, `src/sizes.json` | Model data (11 direct product URLs, heights, firmness) and the 22 sizes (+ custom). Build generates list cards and checks each preview links to the same URL. |
| `src/i18n/*.json` | Hotspot copy translations (fetched only for non-English visitors). |
| `release/<version>/` | Built, hosted files (minified `hero.css`/`hero.js`, `assets/`, `sheets/`, `i18n/`). Releases are **immutable; each version gets a new folder** (copy `assets/` forward). |
| `ecwid/section-<v>-jsdelivr.html` | **The paste-ready section** (pinned to a git SHA). Also `-allinone*` (too long for the live editor), plain, `.min`. |
| `INSTALL.md`, `REPORT.md`, `README.md`, `UPGRADE-1.11.0.md` | Docs. `REPORT.md` is the authoritative change log. |
| `tests/` | `build.mjs`, `interaction.mjs`, `panels.mjs`, `guards.mjs`, `a11y.mjs`, `perf.mjs`, `matrix.mjs`, `serve.py`, `make-ecwid-sim.py`, `make-harness.py`, plus asset scripts `make-*.py`, `clean-*.py`, `inpaint.py`, `round-elbow.py`. |
| `preview/` | Generated test pages (`sim110.html` = Ecwid imitation page with inflated builder CSS; `sim110-strip-style.html`; `harness-polished-h50/h0.html`). Gitignored in part. |
| `reference/` | Approved v26 files, unmodified (source of truth for the original concept). |
| `reports/compare/` | Screenshots per version (`1.14.0-*.png` is the latest set). |

### 2.2 Points (hotspots) and what each opens — current, from code
`data-ddh-point` → behaviour (desktop/tablet; phones differ, see §4.3)
- `shoulder` → context card **Balance & Relief** (`data-ddh-card="shoulder"`)
- `zones` → card **Original Dunlop Technology** (`zones`)
- `firmness` → card **Natural Adaptation + 7 support zones** (`firmness`)
- `weight` → card **Firmness Regulation** (`weight`) (replaced the old sizes/weight copy)
- `sizes` → card **Cover Options** (`sizes`)
- `system` → **Dual Plush**: mattress lifts ("sunrise") + Dual Plush card (`#ddh-dpc`) + "Dual Plush" live text rises with it
- `head` → short copy "100% EU-UK Certified / Latex (Rubber) Foam"
- `back` → "Spinal Alignment / Stretching Effect" (plate swap)
- `temperature` → whole picture turns bluish (cooling wash) + "Best Air Ventilation / Temperature Comfort"
- `bio` → **Bio Comfort** full screen (dialog; opens on hover on desktop, click pins; tap on touch)
- `night` → **night mode** (moon on the logo meridian), only screens ≥1051 px with a hover pointer; click/hover like the others
Cards render only above 700×500 px; below that the short copy is used.

---

## 3. THE OWNER'S MOST RECENT INSTRUCTIONS (highest priority — newest wins)

### 3.1 Latest brief (Bulgarian, after 1.13.0) — implemented in **1.14.0**
> "Искам да поработим още върху визията на картите. Качвам ти два вида цветови комбинации … Искам да направиш картите с тези две комбинации и за матраците и за топерите и всички нови карти."
- Use the **two colour combinations he uploaded** for the mattress selector, the topper selector and **all new context cards**: (A) the Bio Comfort screen — lilac-grey canvas `#e4e7f0`, steel-blue tiles `#2a638e`, navy text, Soft→Firm tile steps `#e8eefa / #d3dbe6 / #2a638e`; (B) the Partners anatomy cards — white cards on pale `#f1f4f9`, steel-blue band `#3e7093 → #29506f`, navy text.
- **Firmness card:** where mixed combinations are shown, say they are **Dual Plush combinations** (mattress + topper, each with its own firmness).
- "Polish the cards": treat them as **logical visualisations**, information ordered logically, easy to read, "comfort of reading", **no size limit**; understandable "from an engineer to a small child".
- Mission statement from the owner (use as design purpose): the cards must make visitors say "Оп… какво става тук, тези са невероятни" and help them understand the product line's logic and advantages; quality of sleep, not furniture; natural materials + highest technology; replace mass-market marketing with **engineering marketing**; stand out in beauty, logic and synchrony with a customer who doesn't know us.
- Final reaction after 1.14.0: **"Браво бе момче :) харесва ми :)"** — general approval of 1.14.0 (not an item-by-item confirmation).

### 3.2 Immediately preceding brief (after 1.12.0) — implemented in 1.13.0, still binding unless replaced by 3.1
1. Mattress selector dark blue graphite, white type **(superseded visually by 3.1)**; topper dark green graphite **(superseded visually by 3.1)**.
2. Context cards must be **bigger, with readable type, generous spacing** ("като десерт за окото, не като гювеч"); text for **people who wear dioptre glasses** — never shrink type just to fit; "optimisation of space ≠ cramming".
3. Natural Adaptation card uses **his PNG of the seven zones as the model** (cut-out of the sleeper over seven zones): **no transparent head, no reflection of lettering, no ugly blue background**.
4. **Original Dunlop Technology: no information about layers at all.** Message = custom-made + fine-tuning ("по къстъм и файн тунинг"). *(This replaced the 1.12.0 brief wording "never say 'no layers'"; newest wins.)*
5. **Firmness card: never the word "approximately"**; exact engineering value, range from–to. Confirmed ranges: **Soft up to 48 kg** (he confirmed "Софт 48"), **Medium 47–83 kg**, **Firm 85–110 kg**, **Extra Firm from 120 kg**; note "Selection guidelines, not medical rules."
6. **Cover Options: cashmere is not cotton.** Source picture gave the four real covers with photos: *100% Organic Cotton*, *Cotton & Wool*, *Aloe Vera Cotton*, *Cashmere with Silver Ions*; every cover has a durable zip for easy removal and maintenance; "Washable at up to 40 °C · Non-toxic, non-sprayed".
7. **Cards must close** after the pointer/finger leaves, have an **X**, and also work with hover. (Implemented: hover opens; leaving point+card closes; X; Escape; tap outside on touch; a tap on the card text does not close it.)
8. **"Dual Plush system does not change"** — "who told you to break the starting concept of Dual Plush with the mattress that rises and the old visual … Dual Plush system does not change. I told you where to work and on which points." → see §8 item 1 (unresolved interpretation).

### 3.3 Earlier standing owner decisions (still valid)
- **Colours:** brown is disliked → graphite range ("хвани се в графит сегмента"). Firm colour must not be amber (was changed to violet; now palette steps). Bio Comfort "light and heavenly", fresh latex-white, not blue-tinted. No "white light", mist, balloons or painted clouds (natural fog only, where used).
- **Typography: Chillax only** (400 + 600; Greek falls back to site font because Chillax has no Greek). Never introduce another font. No Comfortaa substitutes beyond the existing fallback stack.
- **No prices anywhere in the hero** (no £, no "from £0"). Build refuses prices in panels.
- **No gendered wording** ("Her/Him" → "One side/Other side"). Partners: one side Medium, the other Firm (shown visibly as on his pictures).
- **No Ambient Topper.** Toppers = Bio Support, Bio Support Dual, Partners Topper only.
- **Mattress selector = 8 models:** Botanic, Botanic Dual Plush, Bio Comfort, Bio Comfort Dual Plush, Orthopaedic Coconut Coir, Mattress for Partners, Ambient (best-value latex mattress), Hotel Line. Selectors open on an **orientation guide, no preselected model**; hover/focus/tap previews; last preview stays; "Back to the overview"; direct product links + one "View the collection" link.
- **Tablets/laptops/monitors only for the selectors/screens/cards; phones excluded** (≤700 px wide or short landscape touch).
- **Phone portrait (≤700 px): no hotspots, no EU/UK cert, no leaf.** Landscape: shown.
- Preview opens by hovering the Shop buttons **without pressing**; leaving without pressing returns the hero to its first state.
- Keep the first load light; load heavy things right after load (two-stage loading) so Google can index.
- **Hidden keyword text was declined** (Google spam policy). Visible, honest SEO only: image alt, H1 (sr-only), real HTML text in the sheets.
- Natural Adaptation "settle" (woman micro-movement) animation was **removed in 1.10.0** with the owner's permission ("ако кодът стане тежък, махни анимацията"). Do not reintroduce.
- Night mode (moon on the logo's meridian), Dual Plush "sunrise" lift with clean vacated bed plate, "Dual Plush" live lettering aligned 12.43° with the mattress — all **approved**, keep unchanged.

---

## 4. Architecture and behaviour that must be preserved

### 4.1 Ecwid constraints (learned the hard way)
- Instant Site silently **truncates pasted code at roughly 20,124–21,889 characters** (live tests lost hotspots, CTAs, script). The pasted section must stay **short** (~10.3k chars incl. inline copy) with CSS/JS external. `.ddh__end` marker + console warning detect truncation. Do **not** paste the `-allinone` files.
- The Instant Site header is **transparent and lies over the first section**; hero.js measures it read-only (`.ins-tile--header`, hit-testing). Never restyle or stop events of the header. Only one rule outside `.ddh` exists (night mode lightens header text while night is on) and it is allow-listed in `tests/guards.mjs`.
- Ecwid builder CSS inflates `p/span/strong` line-height and `.ins-tile button{position:relative}`: therefore every selector is `.ddh .ddh__*`, geometry carries `!important` where needed, and `tests/make-ecwid-sim.py` reproduces that inflation. Always test on `preview/sim110.html`, not just bare harnesses.
- Sections are loaded/unloaded dynamically: init idempotent, cleanup list (`cleanups`) removes listeners/observers. Keep this.
- Only vanilla JS, no libraries; `.ddh` CSS namespace; shopping links are real `<a>` and work without JS.
- The selector sheets rise above the site header only while open (`.ddh[data-ddh-open-sheet=…]{z-index:2147483000}`), desktop pointers only.

### 4.2 Loading
Stage 1 = plain scene (photo, lettering, buttons). Stage 2 (~0.9–1.2 s after load, idle, low priority; waits for intent on data-saver/2G) = sheets HTML (every device, text only), then on tablet/desktop the graphics, night picture, previews' pictures. Pictures retry twice then fail quietly (1.11.2). LCP phone ≈0.8 s (97 KB), desktop ≈0.2–0.4 s, CLS ≤0.03 tablet/desktop, 0 phone.

### 4.3 Device matrix rules
| | Phone portrait | Phone landscape | Tablet / laptop / desktop |
|---|---|---|---|
| Points | hidden | shown (small) | shown |
| Cert + leaf | hidden | shown | shown |
| Selectors/cards/Bio screen/night | none (Shop buttons link straight; size guide works as bottom sheet) | none (short) | yes (night only ≥1051 px with hover) |
Hover logic uses `any-hover:hover` (iPad with trackpad). Touch: first tap previews, second opens.

### 4.4 Context card system (1.14.0)
- Tokens (hero.css): `--pl-bg #e4e8f2`, `--pl-bg2 #f1f4f9`, `--pl-card #fff`, `--pl-ink #1d2c47`, `--pl-soft #47587a`, `--pl-label #3b5f82`, `--pl-blue #2a638e`, `--pl-blue-d #1f4a6e`, `--pl-band linear-gradient(#3e7093,#29506f)`, `--pl-line #d3dbe6`, `--pl-pale #e8eefa`, `--pl-tile #eef2f9`. Applied to `.ddh__hc` and both selector sheets (`.ddh__sheet--mattress`, `.ddh__sheet--topper`).
- Layout: steel-blue band (`.ddh__hc-hd`) with title+subtitle+X; white panels below. Width clamps up to 800 px (`--firm` 52vw, `--zones` 45vw, `--dunlop` 50vw). Container queries: `hcard`/`hcz` (cards), `ddsh` (sheets). Cards sit 16 px under the LATEX lockup and end 16 px above the Shop row (or the viewport bottom), never over CTAs/lockup/nav/size badge/chat.
- **Compaction (never shrink body type below ~15 px):** hero.js measures `scrollHeight` vs `clientHeight`; loop sets `data-tight` 0→3. Tier 0 tightens spacing; `[data-o="1"]`, `[data-o="2"]`, `[data-o="3"]` optional lines disappear tier by tier and wide tiers widen the card. All 5 cards fit down to 1280×720 in all 8 languages (verified 2026-10-07).
- Points under an open card get `data-ddh-under` (hidden, no pointer events) so they do not catch the pointer; **tests must press Escape before clicking another point** (already patched in `tests/interaction.mjs`).
- Closing logic lives in hero.js `frame()`, `wireCard()`, `inCards()`, `cardOf()`, `cardDownAt` (tap-on-card must not close it), header-bridge grace 450 ms.

### 4.5 Product data (from the owner's product pages, 1.10.2/1.10.1)
| Model | Heights / firmness |
|---|---|
| Botanic | 20·24·26 cm; Soft/Medium/Firm/Extra Firm |
| Botanic Dual Plush | 23 cm (18+5) · 28 cm (20+8); pairs: Medium mattress+Soft topper / Firm+Medium / Extra Firm+Firm |
| Bio Comfort | 23·26 cm |
| Bio Comfort Dual Plush | **28 cm only**; pairs: Medium+Soft / Firm+Medium (**no Extra Firm+Firm**) |
| Orthopaedic Coconut Coir | 17·20·25 cm |
| Partners (mattress) | 21 cm (2×16+5) · 25 cm (2×20+5); one side Medium, other Firm |
| Ambient | 16·18·20·**26** cm, four firmnesses; tag "Best value", line "Best value latex mattress" |
| Hotel Line | 18 cm (no forced 7-zone claim) |
| Bio Support (topper) | Soft/Medium/Firm; depths 8/10/12/14 cm |
| Bio Support Dual (topper) | Option 1: Medium on Firm; Option 2: Soft on Medium (labelled two-layer stacks) |
| Partners Topper | Medium one side, Firm the other, one version |
Direct URLs: see `src/models.json` (11 URLs). Collections: `…/products/latex-mattresses-collection`, `…/latex-toppers-collection`, `…/latex-pillows`.

---

## 5. COMPLETED AND CONFIRMED WORK (chronological, condensed — details in REPORT.md)
- **1.0.0–1.3.0** v26 polished; one Ecwid section; transparent-header fitting; short section (external CSS/JS); lockup compacted; glass CTAs centred away from chat; "Dual Plush conception" lettering no longer cut. *Owner: "категорично подобрение".*
- **1.4.x** upright phones: no points/cert/leaf; SEO alt + H1 (hidden keywords declined); plates no longer disturb mattress/shoulder; smudge removed; CTA hover on iPad.
- **1.5.x** two extra points (sizes, weight) + shared safe text window + 8 languages; metrics locked against Ecwid line-height inflation (792-case panel test).
- **1.6.0** "conception" baked text removed, live "Dual Plush" aligned to mattress; mist removed; leaf inside LATEX; cert block justified to LATEX width.
- **1.7.x** night mode (moon on logo meridian), night point behaves like other points; shoulder bulge fixed.
- **1.8.x** Dual Plush "sunrise": mattress rises to the owner's mockup position, clean vacated bed plate, label rises with it. *Owner: "с надписа всичко е наред".*
- **1.9.x** Natural Adaptation settle iterations (rejected repeatedly), points dead after display sleep fixed (rAF guard + wake handlers). Buttons "Latex Mattress / Latex Topper" bold, equal inner spacing.
- **1.10.0–1.10.9** Bio Comfort point + full screen; hover previews on Shop buttons (8 mattresses, 3 toppers); settle animation removed; phones excluded; two-stage loading; product-page data; graphite instead of brown; Partners markings; Botanic Dual Plush clear two-layer pairs; violet Firm (later superseded); solid topper edges; mattress panel over the header; equal cards; i18n leak fix.
- **1.11.0–1.11.2** model selector with direct links + large preview; global size guide; header bridge (hover on site's own Mattresses/Toppers); cube cards with family accents; Dual Plush reveal card; size badge away from chat; picture retry.
- **1.12.0** orientation guides, five context cards, no gendered wording, Dual Plush card per model without unverified heights.
- **1.13.0** dark card theme (superseded visually), real cover photos + names, exact ranges, no layer talk, closing behaviour, header-bridge race fix, short-screen fits.
- **1.14.0 (current)** one light palette for selectors and cards, band + white panels, Original Dunlop as three numbered steps, Natural Adaptation with owner's cut-out on pale panel + seven blue tiles, firmness tiles + "Dual Plush combinations" panel, "Dual Plush mix" on pair tables (8 languages), 4-column cover swatches, tier-3 compaction.

**Test status at handover (all green on 1.14.0):** interaction 379 (sim110) / 379 (strip-style) / 375 / 375; panels 792/792 (lowest contrast 4.86); guards pass; axe 0 violations; perf LCP phone ≈0.85 s; fit matrix "all fit"; per-language card overflow 0 at 1280×720.

---

## 6. Restrictions, past mistakes and solutions to preserve
1. **Never** replace the concept, move major elements, add empty bands, remove clouds or hotspots, add libraries/fonts, add prices, add "Her/Him", add Ambient Topper, add hidden SEO text, restore the old settle animation.
2. **Change only what is asked.** The owner repeatedly punished unrequested changes (Dual Plush, colours). When unsure, ask or keep the previous behaviour.
3. Truncation at ~20k characters → keep the paste short; check the section character count after every build (`tests/build.mjs` prints `section chars`; floor ≈8,950, 1.14.0 = 9,010 external form / 10,282 jsDelivr form).
4. Builder CSS inflation (line-height, `position:relative` on buttons) → always test on the Ecwid imitation page; keep `!important` metrics.
5. Hotspots dead after display sleep → keep the 120 ms stale-frame guard and `wake()/unstick()` handlers.
6. Translation renderer stops at the first closing `<span>` → multi-line pair lists use `<em>` lines (caused English leakage in 1.10.9). Guard checks structure parity across languages.
7. `on(target, type, handler, opts)` takes an **options object**, never a bare `true` (broke loading in a draft of 1.11.2).
8. Tap on a card's text blurs the opening point → `cardDownAt` guard; do not close on that focusout.
9. Header-bridge race (pointer leaving header link before the sheet): grace 450 ms in `later()` when `data-ddh-via=nav`.
10. Wide cards can cover hotspots; tests that click points must close the open card first (Escape + mouse away).
11. Original Dunlop card: **no mention of layers**; Cover card: **cashmere ≠ cotton**; Firmness card: **no "approximately"** — all guarded in `tests/guards.mjs` across languages (note: the Portuguese word "capa" means cover as well as layer, so the guard only treats Spanish "capa(s)" as a layer; Swedish "ungefär" was removed from the firmness card text — check the guard if you edit those cards).
12. Dual Plush heights on the Dual Plush **card** were removed as unverified; do not re-add without confirmation. (Selector cards still show product-page heights.)
13. **Do not put model identifiers in commits, PR text, or code comments.** Follow the attribution lines the harness provides.

---

## 7. How to build, test and release (procedure used every round)
Environment notes: Node + `esbuild` + `playwright` (Chromium preinstalled) + Python 3 with Pillow, numpy, brotli. In this sandbox tools lived in `/tmp/claude-0/tools/node_modules/.bin` (**ephemeral — reinstall if missing**: `export PATH=…/node_modules/.bin:$PATH`). `divinedunlop.com` and jsDelivr are **unreachable from the sandbox** (live links and the CDN cannot be verified here). Python that reads untrusted files: run with `-I`.
1. Servers: `python3 tests/serve.py 8765 &` (used by all test scripts) (ad-hoc scripts used 8766). **Restart them after any sandbox reset.**
2. Bump version strings (`src/hero.js` VERSION, `src/section.html`, `tests/build.mjs`, and the version references in `tests/guards.mjs`, `interaction.mjs`, `panels.mjs`); `mkdir release/<v> && cp -r release/<prev>/assets release/<v>/`.
3. Edit `src/*`; `node tests/build.mjs` (fails on missing translation keys; refuses prices).
4. Generate test pages: `python3 tests/make-ecwid-sim.py preview/section-local.html preview/sim110.html`; same with `--strip-style` → `preview/sim110-strip-style.html`; `python3 tests/make-harness.py preview/section-local.html preview/harness-polished-h50.html 50` and `…-h0.html 0`.
5. Run: `node tests/interaction.mjs preview/<each of the 4 pages>` · `node tests/panels.mjs preview/sim110.html` · `node tests/guards.mjs` · `node tests/a11y.mjs preview/sim110.html` · `node tests/perf.mjs preview/sim110.html`. (An ad-hoc *fit matrix* — every selector preview × 8 languages × 5 screen sizes — and per-card overflow checks were also run; see §9.)
6. Commit; then pin: `JSDELIVR_REF=<commit sha> node tests/build.mjs` (rewrites `ecwid/section-<v>-jsdelivr.html` to the SHA), update `INSTALL.md` §5 code block + version/SHA strings, commit, push, verify `git diff <sha> HEAD -- release/<v>/hero.js release/<v>/hero.css release/<v>/sheets` is empty ("pinned identical").
7. Screenshots into `reports/compare/<v>-*.png` (1440×900 cards/selectors, 1280×720 short case) and send to the owner; reply in Bulgarian with the full code block.
8. Create/keep PR draft; repo hooks demand clean, pushed tree.

---

## 8. OUTSTANDING TASKS AND OPEN QUESTIONS (nothing below is decided)
1. **Dual Plush — unresolved interpretation.** Owner message after 1.12.0: the Dual Plush system/start concept (mattress that rises, old visual) must not change; he had told me which points to work on. In 1.13/1.14 I reverted my own card tweaks; the Dual Plush point/lift/card are identical to 1.12.0. Unclear whether he objects to the **1.12.0 card** (per-model, no heights, two View buttons) vs the older 1.11.1 card, or something else. He then praised 1.14.0 without addressing it. **Ask before touching anything related to Dual Plush.**
2. **Palette assignment:** 1.14.0 applied both of his palettes together to everything. If he wants palette A for mattresses and B for toppers (or per card), say which — tokens are in §4.4.
3. **First cover name:** card says "100% Organic Cotton"; his picture says "100% Natural Cotton". Confirm. The topper footer still shows shortened names ("Organic cotton / Cotton & wool / Aloe vera / Cashmere").
4. **Weight range gaps:** Firm 85–110 and Medium 47–83 leave 83–85 and 110–120 kg unassigned (data as supplied; Soft 48 vs Medium 47 overlap). Fill or leave?
5. **Certifications** (OEKO-TEX, ISO etc.) visible on his cover picture were **not** added.
6. **Bio Support Dual vs "Bio Support Plus"** naming (product URL says `plus`); **Dual Plush heights** shown on selector cards (23·28) from product pages — confirm; **Dual Plush combination availability per model** — confirm.
7. **Live product links UNVERIFIED** (sandbox cannot reach divinedunlop.com).
8. **Translations** (8 languages) are machine-written and need native-speaker review; Greek renders in the site font.
9. **Hosting/production:** first-party host `assets.divinedunlop.com` (Cloudflare Pages, `hosting/_headers`) is documented but **not set up**; staging uses jsDelivr pinned SHAs. Publishing to the live site needs the owner's explicit approval.
10. **Docs staleness to fix when next touching docs:** `INSTALL.md` still says "Our section is 5,943 characters" and "156 interaction checks" in places (current: 10,282 chars jsDelivr form, 379 checks); `REPORT.md` 1.12.0 text describes point→card mapping loosely (trust §2.2, which is from the code).
11. **Optional cleanup (only if asked):** hero.css contains superseded version blocks (1.13 dark theme was removed; older ones remain and are overridden). Do not refactor without a full test run.
12. **Recommended safety step for the next session:** copy the ad-hoc check scripts (see §9) into `tests/` so they survive.

---

## 9. MISSING / UNAVAILABLE INFORMATION
- **Ad-hoc helper scripts** used for measurements exist only in `/tmp/claude-0/*.mjs` (e.g. `cards.mjs` card position/overflow/`data-tight`/gap per viewport, `fit.mjs` selector-fit matrix across languages, `loc.mjs` per-language card overflow at 1280×720, `natural.mjs` natural card height vs space, `close.mjs` hover/tap/X closing, `nav2.mjs` header-bridge flake rate, `sh.mjs`/`shots14.mjs` screenshots). **They are not in the repo and will be lost** when the container is reclaimed; they must be recreated from these descriptions.
- **Owner's uploaded source images/videos** (zone diagram PNG, cover photo sheet, two palette screenshots, SVG resource boards, a `.mov` screen recording, iPad screenshots) live in `/root/.claude/uploads/b21dfcde-…/` of the old session, **not in the repo**. Only derived assets are in `release/1.14.0/assets` (`zones-7.webp` flattened on `#e8edf6`, `cv-cotton|wool|aloe|cashmere.webp`, model cut-outs `m-*`, `t-*`, `b-*`). `src/night/` keeps the night and Dual Plush mockups. The Google Drive video of body movement could not be opened (no connector) — irrelevant now (settle animation removed).
- **Full conversation transcript:** `/root/.claude/projects/-home-user-Animation/b21dfcde-1bee-5f99-a689-9b946687f38e.jsonl` (~370 MB) existed during this review; all 200 user messages were reviewed (five large briefs in full). A few owner messages were **truncated by the owner himself** (e.g. the 1.10.6 brief ends "Целта е…", the 1.10.0 brief ends mid-sentence) — nothing was assumed. Assistant-side details were taken from `REPORT.md`/git history rather than rereading every assistant turn.
- Original v26 files are in `reference/`; the first brief (≈29k chars: locked lockup structure, locked copy, direct links, Ecwid research, test matrix, "do not publish") is only in the transcript — its binding parts are summarised in §1, §3.3, §4, §6.
- Official Ecwid limit for page-level Embed & Custom Code sections is **undocumented**; the 4,000-symbol limit applies to the site-wide body JS field. The ~20k truncation is an empirical finding.
- Exact live-site behaviour after publishing 1.11–1.14 (iPad/desktop) has **not** been reported back to us; the last live feedback concerned 1.11.1 (Bio Comfort picture, size badge).

---

## 10. Continuing without damage — rules of thumb
- Read the exact CSS/JS before touching; make the **smallest reliable change**; append overrides rather than rewriting layered blocks.
- After every change rerun all four interaction pages, panels, guards, a11y, perf and a fit check at 1280×720, 1366×768, 1440×900, 1920×1080 and 1024×768 / 1180×820 tablets, in all 8 languages.
- Keep type readable (≥15 px for card text); extra space goes to wider cards, not smaller text.
- Keep the owner's tone: confident, warm, concise Bulgarian; report what changed, what was tested, what still needs his confirmation; always include the pinned code block; never claim unverified facts (heights, cover names, links).

---

## 11. OWNER RULES ADDED 2026-10-09 / 10 (binding for every section, newest wins)

1. **Readability is a law for every section, not fixed section by section.** Good contrast (ink >= 9:1, labels >= 8:1), body 16 px, secondary 15 px, labels 13-14 px, no light greys, generous air (8 px grid), nothing cut mid-word or mid-sentence. Write for a reader with or without one-dioptre glasses. There are no screen limits: layouts may adapt to keep these rules.
2. **Design language:** minimal, logical, "cubism" (clear blocks, rounded corners; rectangles or circles where they fit better), elegant, easy to scan, information in logical order. Clarity + navigation.
3. **Colours (owner's Pantone sets):** Nordic blue-grey 7541 #dde3e3 · 7542 #aebebe · 7543 #9fa8af · 7544 #838c95 · 7545 #4a5664 · 7546 #313d4c; sky blue 7457 #c7e0e5 · 7458 #8ab1c0 · 7459 #6c9bad · 7460 #3f8cb8. Indicator / specification colours come ONLY from these (no multi-colour "шарении"). White and dark ink-blue (#14223b) stay the strategic colours for text and key information. Firmness ramp: Soft 7457, Medium 7458, Firm 7545, Extra Firm 7546.
4. **In a dark box the text is always white.**
5. **Wording:** our mattresses are always called "latex mattress" (or "organic latex mattress"), never just "mattress". (The customer's own "current mattress" is not ours and stays as is.)
6. **Dual Plush card:** keep the old visual with the product picture and the "Latex topper / Latex mattress" labels. Combination boxes are all the same size and weight (no thicker box for Extra Firm / Firm).
7. **"Back to the overview"** sits beside "View model", never on the picture.
8. **The selector's "Pick your model → size … → buy"** is shown as a clear three-step navigation strip.
9. **Firmness philosophy (use whenever firmness is discussed):** firmness is not just "Soft / Firm". It is an engineering system that measures the balance between the support of the latex and its adaptation to the body, calculated for each body weight: engineering research, not marketing. Following the weight ranges makes the choice right; when a customer hesitates between two firmnesses, Dual Plush combines them (the latex mattress by the weight rule, the topper by personal comfort): freedom within an engineering regulation, which gives calm and confidence. The firmness point opens a large **firmness navigator** with three systems: Solo firmness (ranges + models Botanic, Bio Comfort, Orthopaedic Coconut Coir, Ambient; topper Bio Support), Dual Plush (three pairs + Botanic Dual Plush, Bio Comfort Dual Plush; topper Bio Support Dual) and Partners comfort (Medium one side / Firm other + Mattress for Partners, Partners Topper). Exact ranges: Soft up to 48 kg, Medium 47-83, Firm 85-110, Extra Firm from 120. Never "approximately".
