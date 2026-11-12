# Large-screen television: design preview (for the owner to approve)

Status: **design preview, not deployed, not the engine.** Open `docs/tv-preview/large-screen-design.html` in a browser (start with `?demo=1` for a filled-in order, `?step=0` to `?step=4` for a given step). Pictures: `docs/tv-preview/design-<device>-<step>.png` for the iPad Pro 12.9 in landscape and portrait, and a desktop monitor. Rebuild: `node tools/build-premium-preview.mjs && NODE_PATH=$(npm root -g) node tools/build-tv-design-preview.mjs`.

## What the owner asked for (11 November 2026), and what the preview shows

| Request | In the preview |
|---|---|
| The firmness numbers must follow the Firmness module | The four ranges are read from the module's own rule (`DDFirmnessCore.bands`): Soft up to 48 kg, Medium 49 to 87 kg, Firm 88 to 114 kg, Extra Firm 115 kg and over. Nothing on the screen is typed in by hand |
| The weight and height sliders must be on the large screen too | Step 2 has both sliders (30 to 250 kg, 120 to 230 cm, the module's limits). The recommendation is the module's output: it marks one card "For you", dims the others, and says "Unsure between two levels? Consider Botanic Dual Plush" where the module finds two |
| Sizes approved, add inches | Every size card shows centimetres and inches (cm divided by 2.54, one decimal, the same rule as Ecwid's own label text) |
| The screens look rough: clearer design, backgrounds, functions, spaced and visible buttons | One system: a light ground, white cards, the turquoise graphite band for the question, a lit edge, 56 px high pill buttons with clear spacing, one primary button per screen |
| The large screen must also have the order-filling stages | A visible rail of five steps (Size, Firmness, Depth, Cover, Review): done steps show a tick and the choice, the current step is marked, every step can be tapped. On a portrait tablet the rail runs along the top. A "Your selection" panel with chips and the price stays on the right (below on a portrait tablet) |
| Extra Firm is not removed | The fourth firmness card is Extra Firm, 115 kg and over, with "Specialist Model: Orthopaedic Coconut Core". It is a plain link that opens only when tapped; the sliders never navigate |
| Custom sizes | "Need another size?" opens a small form (model filled in, size wanted, reply email). Preview only: nothing is sent. In the shop it goes to support@divinedunlop.com |
| The shop's own (manual) controls stay | **No "Choose by hand" screen inside the television** (owner, 11 November 2026: it is outside the concept). The shop's own four options and Add to Bag stay on the page under the television, always, never hidden, and move together with the television in both directions. The Standard Product View and the model "Standard" are untouched |
| Each button will be specified later by the owner | The preview is a design carrier; every label here is replaceable through `docs/TV-BUTTON-SPEC.md` |

## Add to Bag: READY (owner, 12 November 2026)

When size, depth, firmness and cover are all chosen, the Add to Bag button is READY: taller (68 px), larger type and a crisp light ring. It is still flat, with no blur, so the earlier rule about fog and glow stands. Clicking it adds the mattress; the same button then becomes Go to Checkout; a second click opens the shopping cart, built from the selections (no checkout screen of ours). A changed choice returns it to Add to Bag. The mobile review button does the same.

## Blue buttons and the 7-Zone panel (owner, 12 November 2026)

- **View Model Gallery** is the same bright blue as Add to Bag and Go to Checkout.
- **Optimised Preview / Standard Product View** are outlined in blue (a blue edge with an outline), not filled; the one that is open is marked with a pale fill and a ring.
- **7-Zone:** the sketch sits on white with no dark sky; the video card is larger than the sketch (the model is the smaller), with the seven zones and their notes beneath. The sketch is the original illustration, unchanged, with its own viewBox (the drawing already fits: y 27 to 750).

## Gallery, the two views, depths, the icon and the seven zones (owner, 12 November 2026)

- **View Model Gallery** (top right): opens the product photographs inside the television (large photograph, arrows, a row of thumbnails, "Close gallery"). The photographs are the shop's own images.
- **Optimised Preview | Standard Product View** (top right): the switch between the television and the shop's own page. In the preview the standard view is a stand-in: the shop's own gallery and the four options, the same price and the same Add to Bag; what is chosen in one view is shown in the other (tested, both directions).
- **Depths** are now drawn from the owner's mattress drawing (`docs/mobile/premium/assets/owner-mattress-depth.svg`): the same drawing three times, only the thickness of the front edge changes (differences exaggerated so that they can be seen), the 26 cm outline dashed behind the shorter ones. The file read is the owner's own; the program parses its paths, it does not redraw them.
- **The mattress icon** (owner's second drawing, `owner-mattress-icon.svg`) sits in the heading of "Your selection": grey outline with nothing chosen, graphite as choices are made, and lit blue with a glow when all four are chosen ("Ready to order. Add it to your bag." appears under Add to Bag).
- **7-Zone** uses the same scheme as the mobile concept: the seven-zone sketch, the legend (Softer response, Calibrated, Reinforced) and the seven zones with their notes, plus the short loop beside it.
- Which file is which was taken from the file names: "for_depth" for the heights, "mattress" for the icon. If it is the other way round, it is a one-line swap in `tools/build-tv-design-preview.mjs`.

## The topic buttons and the information (owner, 11 November 2026)

The top of the television carries **all fourteen topic buttons of the Botanic configuration** (two rows of seven, as on today's television): Discover, Firmness, Comfort, Height, Covers, Benefits, Support, Adaptation, 7-Zone, Ventilation, Hygiene, Certifications, Warranty, Delivery. The four "phases" of the earlier proposal are dropped (they were not the owner's). The television's purpose is to show **all** the information of the Botanic description, so every topic opens its panels as buttons in the left menu ("In <topic>"), and the order stages ("Your order") stay under them. The right panel (selection, price, Add to Bag) is always there, on every topic; the choices survive moving between topics.

How the text is broken into buttons (the text itself is read from `source/botanic-original-description.html` by `tools/build-tv-design-preview.mjs`, never retyped; the preview shows 14 topics and 31 panels, and a click-through test opens every panel and every text button):

- **Reader panels** (the long explanations, for example "How It Works", "Latex Behaviour", "Where It Is Made"): each heading of the text becomes a numbered button on the left of the content, and the chosen part is shown on the right. Where the text has no headings it is split by paragraph; one short text is shown as it is.
- **Points** (Origin, Bearing Force, Elasticity, Airflow, Cleaner Sleep): a card for each point, with the topic's short loop in a small "television in the television" card beside them (a stand-in here; the loops stay small, as decided).
- **Certifications:** a card for each body. **Warranty:** the large numerals (15 years, 2 pillows) with their text. **7-Zone:** the seven zones head to feet, in order. **Discover:** the introduction with the presentation video (plays in full on demand) and the six key points; "At a Glance" with the configuration facts.
- **Choosing panels** (Firmness "Choose", Height "Choose size" and "Choose depth", Covers "Choose cover", Delivery "Your Botanic") are the order steps already designed; the topic bar and the order rail reach the same screens.
- Differences from today's television, to be confirmed: "Materials" (covers) is merged into "Choose cover", because the cover board is already the comparison. The "Height" topic is called "Height" as in the configuration; since it holds the size and the depth, the owner may prefer "Size & Depth".

## Design rules from the owner's review (11 November 2026)

- **Rounded corners only; no pills.** Every button is a rounded rectangle (12 px); the step markers and badges are rounded squares; the slider handle is a rounded square.
- **No mint.** Anything current or chosen is graphite blue with white text: the current step on the rail, the chips of "Your selection", the guidance bar. The choice cards (body weight, height, Soft, Medium, Firm, Extra Firm, sizes, depths, covers) and the two side panels stay white; a chosen card has a dark graphite border.
- **The frame of the television is thin** (5 px instead of 14 px).
- **The leaf is green** (the header leaf of the site, not blue).
- **The question band stays dark** (the owner likes it).

## Second review (11 November 2026): alignment, a darker stage, the one distinctive button

- **One top line.** The three columns (order rail, stage, selection) share one top line: a heading row of the same height, and below it the first box of each column starts at the same height (the question band, the first chip, the first step), on every step. On a portrait tablet the rail runs along the top.
- **The leaf sits beside the question**, not above it.
- **The stage is light again** (the owner's final choice after trying a dark and a grey stage: the earlier light stage with white cards is the better one). The question band, the chips and the current step stay dark graphite blue; the buttons are graphite with white text; a chosen or recommended card has a dark graphite border.
- **Add to Bag / Go to Checkout is the only bright blue button** on the screen, the blue of the lit parts of the question band (sampled from it), with a bag or an arrow icon, flat and crisp (a thin border and a very small shadow, no glow); never the same as the other buttons. No green button.
- **Depth is a mattress in profile**: long, both ends visible, a graphite cover around a latex core, the thickness varies (20, 24, 26 cm) with the 26 cm outline dashed behind. It is drawn about 1.5 times thicker than life so the difference can be seen. (This replaces the earlier use of the traced front edge of the core drawing, which read as a thin slanted strip.)
- **Covers:** the four photographs and the information board have the same height and align.

## Side panels stay white (owner's final word)

The order rail and "Your selection" are white cards; only the buttons and chips inside them are dark graphite (the current step, the chosen choices, Add to Bag). The owner tried the dark panels and rejected them.

## "Select here": telling the customer where to choose

A clear invitation tells the customer that the whole selection is made in this interface: a bar above the television, "Select your Botanic here: four choices, step by step: size, firmness, depth and cover. Then add it to your bag", with an arrow pointing down to the television; "Select here" in the heading row of the stage on every step; and, while nothing is chosen, a line in "Your selection" saying that the choices appear there as they are made. (In the shop the television sits above Ecwid's own options, so the bar points at it. The wording is the owner's to change.)

## Add to Bag and Go to Checkout (one button, two faces)

Add to Bag sits in "Your selection", under the price, on every step, and again on the Review step. It is disabled until size, firmness, depth and cover are all chosen. Once the mattress is in the bag the same button, in the same place, becomes **Go to Checkout** (the same bright blue, with an arrow instead of the bag), and says "Added to your bag". If the customer then changes any of the four choices, it becomes Add to Bag again, because the new configuration is not in the bag. The shop's own button under the television is the same button: both always show the same face.

In the shop: the television's button presses **Ecwid's own** Add to Bag (so Ecwid validates and executes, as always), and it turns into Go to Checkout only when Ecwid's own cart event reports the change (never on our assumption). If the customer uses Ecwid's own Add to Bag, the television's button turns into Go to Checkout the same way. Go to Checkout opens Ecwid's own checkout. This replaces the earlier idea that "Go to Add to Bag" only scrolls to the shop's button. *Open point for the owner:* in Ecwid today no option is required and Add to Bag is enabled with nothing chosen (price £0); the television's button waits for all four choices, Ecwid's own does not. Mark the four options as required in Ecwid Admin so both behave the same.

## Depth and covers

- **Depth** is drawn from the owner's own core drawing: its front edge, levelled (the drawing is in perspective) and stretched only in thickness for 20, 24 and 26 cm, with the 26 cm outline dashed behind the shorter ones so the difference is visible.
- **Covers** are four photographs in a square (2 by 2), each with one short caption (Organic Cotton, Cotton / Wool, Aloe Vera Blend, Cashmere + Silver). A white information board beside them shows what the chosen cover gives: the four main points from the approved text, the height it adds, and the extra price Ecwid shows. The photographs have nothing written on them.

## What the preview is not

- **Not connected to Ecwid.** The price in "Your selection" is a stand-in, computed here only so the layout can be judged (90 per cent of the label modifiers, as Ecwid showed on 11 November 2026). In the shop the price is Ecwid's own and the screen never computes one.
- The bag is a stand-in here: nothing is added anywhere. (In the shop see the section on Add to Bag and Go to Checkout.)
- The two-way sync (screen to Ecwid and Ecwid to screen) is proved separately, on the current television, by `tests/sync-contract.mjs` (simulated store) and `tests/live/tv-sync-e2.cjs` (real Ecwid page, read-only). The new screens must pass the same two tests before they replace the old ones.
- Fonts load from the web; the pictures in this folder were taken without the web font, so the letters differ slightly from the final ones. The cover photographs are the real ones from the media host.

## Firmness numbers: one source

| | Soft | Medium | Firm | Extra Firm |
|---|---|---|---|---|
| **Firmness module (the truth)** | up to 48 | 49 to 87 | 88 to 114 | 115 and over |
| Description today (`.b-fc__kg`) | 0 – 48 | 49 – 83 | 83 – 114 | 115+ |
| Ecwid option labels today | up to 47 | 48 – 85 | 85 – 110 | over 120 (nothing for 110 to 120) |
| Large-screen preview | read from the module | | | |

Proposed replacement text (owner edits; we do not touch the live store or Ecwid):

- Description: `0 – 48 kg`, `49 – 87 kg`, `88 – 114 kg`, `115+ kg` (the Medium and Firm lines change).
- Ecwid option labels, for the owner to change in Ecwid Admin: "Up to 48 kg – SOFT", "49–87 kg – MEDIUM", "88–114 kg – FIRM", "115 kg and over – EXTRA FIRM (+£88)". Stones are converted by the same rule if the owner keeps them.
- The module also uses height: at some heights a body of 80 kg is guided to Firm. The four ranges are the base and the preview says so under the cards: "Your height can move the guidance to a neighbouring level". The owner may wish to say the same in the description.

## Open for the owner

1. Approve or change the look (the question band, the rail on the left, the selection panel on the right).
2. The step order (Size, Firmness, Depth, Cover, Review) and the phase names on the top bar. Phases 1, 3 and 4 are not drawn yet.
3. What to show if Extra Firm is picked in Ecwid's own menu (proposal: the same notice with the link, nothing changed in Ecwid).
4. A picture or drawing for each step, and the text on each button (`docs/TV-BUTTON-SPEC.md`).
