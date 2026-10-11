# Changelog

## 3.3.0 (2026-10-11)
Owner feedback: one scheme for all variations confuses; the scheme must show each variation, small, and be tied to its explanation.
- The big generic Dual Plush graphic, its "Above / Below" legend, the caption and the duplicated "mixes" list are removed.
- **One small scheme per combination** (3 in Botanic Dual Plush: Soft + Medium, Medium + Firm, Firm + Extra Firm; 2 in Bio Comfort Dual Plush). Each is the owner's artwork with the topper above and the mattress below, coloured with the same firmness colours as the labels next to it ("Soft topper, above" / "Medium mattress, below"), so scheme and words read as one. A heading says how many combinations there are.
- The card's firmness box keeps only the depths for Dual Plush models.
- Mattress description changed; topper description changed only in its pinned paths.

## 3.2.0 (2026-10-11)
Owner feedback from the live test on iPad.
- **Dual Plush is explained as a graphic**, not a paragraph: the supplied artwork (`src/assets/dual-plush.svg`, from the owner's SVG) with the topper above and the mattress below, a labelled legend with arrows, the firmness of each layer and its thickness (e.g. topper 5 or 8 cm, mattress 18 or 20 cm). The text paragraph is gone. Shown in the two Dual Plush cards.
- **Button text: "View model & buy"** (big bar on the tile and in the card); where the button is a small corner chip it reads "View & buy". It says there is something to see and choose before buying.
- **Readability of the card**: darker and larger text (16.5 px), solid grey boxes instead of see-through layers, darker labels.
- **Organic**: the long faint words are replaced by a clear badge (leaf + "ORGANIC") in the header of every card, plus a faint leaf behind.
- Mattress and topper descriptions changed (button text, Dual Plush graphic).

## 3.1.0 (2026-10-11)
Owner feedback after 3.0.0.
- Ambient: tile line "Best Value latex mattress". Hotel Line: tile line "Shredded latex mattress"; the "for hotels" restriction is gone from the tile, card title and text (it now suits the home and hospitality projects).
- Watermark behind the preview: only the word "Organic" with the single leaf.
- The upper and the lower row of mattresses are clearly separated: a wider gap plus a rounded divider bar above the lower families, so a family heading never reads as belonging to the row above. Not applied on phones (two blocks per row).
- Touch: when the card overlaps its own tile, a tap on the card opens the model page.
- The mattress description changed (texts); the topper description is unchanged.

## 3.0.0 (2026-10-11)
Owner direction: everything in cubism (rounded cubes), the model card a cube holding picture and information, **BUY NOW** in big letters at the bottom of the card.
- Every block is a rounded cube with equal gaps: tile, picture, information, Buy now, selection steps, family headings, footer notes and every section of the preview card. The family colour stays a thin edge (3 px on top of the tile, 3 px under the heading).
- **BUY NOW** (uppercase, large) is a full-width block at the bottom of each tile and a large block at the bottom of the preview card.
- Where the window is short or narrow (up to 800 px high, or a description narrower than 1100 px, and on phones) the button becomes a compact BUY NOW cube in the corner of the picture so that the whole map still fits on one screen; family headings keep a single line there.
- Touch: when the preview card covers its own tile, a tap on the card opens the model page (like a click with the mouse).
- Phone toppers: picture and text in a row, BUY NOW as a bar under them.
- Descriptions are unchanged (CSS and script only).

## 2.5.0 (2026-10-11)
Owner feedback after 2.4.0: the green button is toxic, use the blue range; the watermark must be one leaf, not a branch.
- **Buy now** is a calm deep-sea blue (#23628f, hover #184a6e; white text, contrast 6.5:1); focus outline in the same blue.
- Watermark behind the preview: a single leaf (no branch) with the words Organic / Natural / Green product (or Natural / Green / product), as in 2.4.0.

## 2.4.0 (2026-10-11)
Owner feedback after 2.3.0: Buy now must not be a toxic blue; Mediterranean leaf green; a watermark behind the preview about natural / organic / green product.
- **Buy now** (tiles and card) is now olive-leaf green (#4a7448, hover #38592f; white text, contrast 5.4:1).
- Preview card has a faint watermark behind its content: an olive branch and the words "Organic / Natural / Green product" (Premium, Essential, Orthopaedic, Single, Dual, Topper for Partners) or "Natural / Green / product" (Best Value, Mattress for Partners), matching what the product pages state. Pure CSS (no markup change): descriptions are unchanged.
- Boxes inside the card are slightly translucent so the watermark shows through; focus outline is green.

## 2.3.0 (2026-10-11)
Owner feedback after 2.2.0: the clean, ordered Tesla style, but not dark; the family colours stay, only as edges.
- Back to a white, airy page: white frame, light-grey picture panels (flat, no spotlight), near-black text, one blue **Buy now** button style, thin hairlines.
- Family colour stays a thin edge (3 px along the top of each tile and of the preview card, 2 px under each family heading) plus an outlined label in the family colour. No colour fills.
- Same layout, one-screen heights and interaction as 2.1.0 / 2.2.0.

## 2.2.0 (2026-10-11)
Owner feedback after 2.1.0: the colour must be an edge (кант), not a mass; the design should feel like the Tesla in-car menu.
- Dark, flat, touch-first panel: near-black frame, dark cards with a soft spotlight behind each picture, large type, one blue **Buy now** button style.
- Family colour is only a thin edge: 3 px along the top of every tile and of the preview card, a 2 px line under each family heading, and a small outlined label (Premium, Essential, Orthopaedic, Partners, Best Value; toppers: Single firmness, Dual firmness, Partners). No colour fills.
- Preview card in the same dark language; firmness chips keep their colours with white type.
- Same layout, same one-screen heights, same interaction as 2.1.0. Short windows (up to 800 px high) get a flatter picture in the card so that it does not cover neighbouring tiles.

## 2.1.0 (2026-10-11)
Owner feedback after 2.0.0: family names on every model, better pictures and a cubist look, a bigger preview with a picture, a Buy now button.
- Families are named **Premium** (Botanic, Botanic Dual Plush), **Essential** (Bio Comfort, Bio Comfort Dual Plush), **Orthopaedic**, **Partners**, **Best Value**; every tile carries its family label as a white tag on the family-colour band (toppers: Single firmness, Dual firmness, Partners).
- Tiles are colour blocks: large picture on a tinted panel with a soft shadow, family-colour band with label, name and one key line.
- **Buy now** button on every tile (on the picture) and in every preview card; the small picture is a direct way into the model page (also on touch).
- The preview card is larger and has a big picture (Bio Comfort uses the 1200 px originals), the explanation, facts, "you buy on the model page" and Buy now; with the mouse a click anywhere on the card opens the model page.
- Pictures are 2.6:1 on 1440×900 (the lede is dropped on windows up to 900 px high to make room); phones show mattresses as two blocks per row.

## 2.0.0 (2026-10-10)
New strategy: the whole collection on one screen, no scrolling panel.
- Families side by side (mattresses 4 columns × 2 rows, toppers 3 × 1, phones one column of compact picture rows), each named and underlined in its own colour; every model a picture tile with name and key line; every tile a direct link to the model page.
- The preview is now a floating card opened by hover / keyboard focus / tap (bottom sheet on phones): explanation, who it suits, firmness and depths, "you buy on the model page", *View model*.
- Header keeps the "who is it for" question and the selection path; footer line with the collection-wide facts (hidden on short windows and phones).
- Removed: stage column, locked selection, "Back to the overview", detail-under-the-row.
- Fix found by the tests: one close timer for the whole component (a card could stay open after crossing neighbouring tiles).
- Descriptions: mattress 18.9k, topper 7.7k characters (was 29k / 12.6k).

## 1.1.0 (2026-10-10)
- Family map with pictures: one row per family, **two picture cards per row**, each row named and underlined in its own colour (Classic Premium & Essential green, Innovative Premium Comfort blue, Orthopaedic Firmness slate, Best Value violet, Partners teal; toppers: Single green, Dual blue, Partners teal). A family with one model gets a note beside its card.
- Narrow screens: the detail opens under the whole family row.
- The preview stage stays in view while the map scrolls (wide layout).
- Arrow Left / Right move between cards.

## 1.0.0 (2026-10-10)
First release (`release/1.0.0/`, `ecwid/*-1.0.0.html`, kept unchanged as the rollback target).
