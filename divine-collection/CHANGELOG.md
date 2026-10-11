# Changelog

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
