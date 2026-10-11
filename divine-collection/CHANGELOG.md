# Changelog

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
