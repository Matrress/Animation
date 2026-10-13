# Divine DunlopDreams Home Discovery

The product-discovery section that replaces the hidden "Navigation & Custom Code" tile ("Find Your Natural Sleep Solution") directly under the homepage Hero.
Mattress / Topper switch, six need routes that *highlight* (never hide) models, eight mattress cards (4 × 2 on wide screens) and three topper cards, and one inline preview panel with construction, firmness, depths, Dual Plush combinations, how the model differs, and the real product link.

**Status: 0.1.0 is installed on divinedunlop.com (owner, 2026-10-13); 0.3.0 (comfort pass) is a preview. Hero 1.20.2, the BioDunlop intro and the Collection pages are untouched.**

## Product facts: one source, not a copy
Nothing about products is typed in this folder. `build.mjs` reads the approved **Collection 3.13.2** sources
(`divine-collection/src/data.mjs`, `src/nav.mjs`) from git commit `f4d9318` (the commit the live site's loader is pinned to) with `git show`, into `.source/` (git-ignored), and imports them.
`release/<v>/SOURCES.json` records the commit and the SHA-256 of both files. Changing a fact = change the collection source and rebuild; the Collection Pages are not modified.
The only things defined here are interface copy (heading, "What matters most to you?", button labels) and four firmness colours, which are parsed from the approved `build.mjs` (never retyped).

## How it works
| Layer | What | Without it |
|---|---|---|
| Static HTML (in the Ecwid field) | h2 / h3 / h4 headings, 11 model cards (name, family, type line, function line, picture with width/height, real product link), six need links, principles, links to both collection pages | A complete, readable page; both views visible; every link works |
| `dhd.css` (30 KB) | Layout (container queries), Hero-matched tokens, `!important` against Ecwid's storefront CSS | Unstyled but complete HTML |
| `dhd.js` (38 KB, vanilla) | Tab switch, need highlighting, one inline preview panel, focus handling, re-render safety. Contains the previews, generated at build time from the approved data | Static HTML stays |
No iframe, no framework, no analytics calls (see `ddhd:*` events below).

## Build and test
```
npm i esbuild@0.24.0                      # optional: minifies; without it the build writes unminified files
ESBUILD=node_modules/esbuild/lib/main.js divine-home-discovery/build.sh      # local preview build (section points at https://ddhd-preview.invalid/)
node divine-home-discovery/tests/interaction.mjs   # 153 checks, against the REAL homepage with the section injected in situ
node divine-home-discovery/tests/shots.mjs         # screenshots into reports/
```
Pinned build for Ecwid: `DHD_REF=<commit that contains release/0.1.0/> node divine-home-discovery/build.mjs` (see INSTALL.md).
The tests need network access to divinedunlop.com, cdn.jsdelivr.net and the Ecwid CloudFront hosts; the live page is only read.

## Deep links and events (for the Hero and GTM, later)
- `#ddhd-mattress`, `#ddhd-topper` select a view; `#ddhd-m-<model id>` (e.g. `#ddhd-m-bio_dp`) opens that model's preview. A Hero button could link there; the Hero is not changed.
- Bubbling DOM events on the section: `ddhd:view`, `ddhd:need`, `ddhd:preview`, `ddhd:product` (`{id, from}`), `ddhd:collection`. Nothing is sent to GA4/GTM yet.
