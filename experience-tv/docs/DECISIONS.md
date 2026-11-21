# Decisions of the owner: the register (check this before proposing anything)

These are decided. They are not asked again and not undone by a later change. Where a decision is a design rule it is checked by `tests/design-rules.mjs` (run after every change to the large-screen design: `node tools/build-tv-design-preview.mjs && NODE_PATH=$(npm root -g) node tests/design-rules.mjs`). Detailed history: `docs/FINALISATION-PLAN.md` section 0b and `docs/TV-DESIGN-PREVIEW.md`.

## Working rules
- The live Ecwid store is not changed. The test product 876405767 is authorised as the test product only; nothing is deployed to it or changed on it without the owner's explicit approval. Simulated tests are never presented as live verification. The real Add to Bag is never clicked in tests.
- **Ecwid is the executor.** It owns the product, options, price, cart, checkout and orders. Our code presents, guides and drives Ecwid's own controls, and steps aside if anything does not fit. No price is computed by our code.
- **Two-way sync is mandatory.** The screen drives Ecwid's controls and Ecwid's controls drive the screen (size, firmness, depth, cover), and Add to Bag adds exactly what both show.
- Indexing and speed are protected (`docs/SEO-AND-PERFORMANCE-GUARDRAILS.md`, `tests/guardrails.mjs`).
- British English in documents and on screen. No model identifier in commits or PRs. Replies to the owner in Bulgarian.
- Everything above a phone is a large screen (shortest screen side 600 CSS px or more), device-neutral code, the owner's real device is an iPad Pro 12.9 (3rd generation). The phone version is the shorter one and waits.
- The owner specifies every button (`docs/TV-BUTTON-SPEC.md`); until then labels are proposals.

- The owner decides every button: `docs/TV-BUTTON-CATALOGUE.md` lists every button of every screen of the large design (39 screens, picture and table each) with a column for the decision (keep, remove, change, add).

## Selection laws (owner, 12 November 2026; one source: `engine/selection-rules.js`, tests: `tests/selection-rules.mjs`)
- The four choices, in the customer's order: size, firmness, depth, cover. The five factors of the price and of the checkout: size, firmness, depth, cover and the promotion Ecwid applies (its percentage, never its name).
- **READY** (the Add to Bag button lit, larger, crisp ring) only when all four are covered. Clicking it adds the mattress through Ecwid's own button; the same button then becomes **Go to Checkout**, and a second click opens the checkout page.
- **Once the four are covered, changing any one of them keeps the button active**: it is READY for the new configuration (Add to Bag again). Removing a choice takes it back to the guidance.
- **Whatever is missing is named** ("Still to choose: Size · Cover"), so the customer always knows where they are. Mobile and large screen alike.
- **Go to Checkout opens the shopping cart** (Ecwid's cart page, `openPage('cart')`), where the order is built by Equity and Ecwid from our selections. The customer enters the e-mail there and continues to checkout. No checkout screen of ours; the coupon and the e-mail code are never in the configuration. "Redeem your discount" in the checkout is not ours.
- Equid/Ecwid is the platform. The promotion's name is not shown; the discount is shown as the store gives it.

## Content decisions
- Firmness numbers are the Firmness module's four ranges: Soft up to 48 kg, Medium 49 to 87, Firm 88 to 114, Extra Firm 115 and over. The module is the guide for any discrepancy. The sliders (body weight and height) are on the large screen too.
- Extra Firm is not removed: it is redirected to the specialist model "Orthopaedic Coconut Core" (a plain link, followed only on a tap). Open: what happens if it is picked in Ecwid's own menu (proposal: same notice and link, nothing changed in Ecwid).
- **Prices and promotions (owner, 12 November 2026), mobile and large, every model:** the customer always sees the real price and the price with the discount (the earlier price struck through, the price with the discount, the discount note), whatever the percentage (10, 15, 17 or other); the promotion is run in Ecwid; the module only mirrors Ecwid's texts and computes nothing; it says "Discount included". **Go to Checkout takes the customer to the checkout at once** (Ecwid's own checkout). Contract and verification plan: `docs/PRICES-AND-CHECKOUT.md`; test: `tests/price-promo-contract.mjs`.
- Sizes are shown in centimetres and in inches (cm divided by 2.54, one decimal).
- Custom size: a contact form (model filled in, size wanted, reply email) to support@divinedunlop.com.
- The small videos (7 to 10 seconds) stay small; each model has a full presentation video playable in full; the video card is a small "television in the television".
- The four steps of the order are Size, Firmness, Depth, Cover, then Review; all fourteen topics stay on top of the television (Discover, Firmness, Comfort, Height, Covers, Benefits, Support, Adaptation, 7-Zone, Ventilation, Hygiene, Certifications, Warranty, Delivery). The television's purpose is to show all of the Botanic information, broken into buttons.
- No "Choose by hand" screen inside the television. The shop's own options and Add to Bag stay on the page below it, in step with it.
- **Add to Bag and Go to Checkout are one button with two faces**, bright blue; it waits for the four choices; it returns to Add to Bag if a choice changes.
- **The bright blue family (owner, 12 November 2026):** Add to Bag / Go to Checkout and **View Model Gallery** are the same bright blue. The two view buttons (Optimised Preview, Standard Product View) are outlined in the same blue, not filled. Nothing else on the screen is that blue. (This replaces the earlier "Add to Bag is the only blue button" rule.)
- **Add to Bag is READY only when size, depth, firmness and cover are all chosen**; READY is lit and larger (a crisp ring, no blur). Clicking it adds the mattress; the same button then becomes Go to Checkout, and a second click opens the checkout. Changing a choice turns it back into Add to Bag. (Owner, 12 November 2026; see `docs/PRICES-AND-CHECKOUT.md`, the owner's laws.)
- **Prices come from Equity**: sizes and final prices are entered there; the active promotion is an automatic rule in Equity's Promotions; the store shows the price without the discount and the price with it; the module shows exactly those. "Redeem your discount" in the checkout is not ours.
- The television must say where to select: "Select your Botanic here".
- The two views: Optimised Preview (the television) and Standard Product View (the shop's own page, with the shop's own gallery and options). A "View Model Gallery" button opens the product photographs inside the television.
- The 7-Zone panel uses the same sketch, legend and zone list as the mobile concept. The video card is the larger of the two (the model is the smaller); the sketch sits on white, with no dark sky or background behind it.
- Depths are drawn from the owner's mattress drawing (`docs/mobile/premium/assets/owner-mattress-depth.svg`), three heights; the owner's second drawing (`owner-mattress-icon.svg`) is the small icon in "Your selection" that lights up when all four choices are made.
- Covers: four photographs in a square, one short caption each, with a white information board beside them (no text on the photographs).

## Design rules (checked by tests/design-rules.mjs)
- Rounded corners only: no pills, no circles on buttons (largest radius 16 px).
- No mint. The side cards (order rail and "Your selection") are white; only the buttons and chips inside them are dark graphite blue with white text. The middle stage is light, with white cards; a dark or grey stage was tried and rejected.
- The question band is dark turquoise graphite; the leaf is green (never blue) and sits beside the question.
- The frame of the television is thin (5 px).
- One common top line: the question band, the first chip and the first rail button start at the same height, on every step and panel.
- The blue of Add to Bag, Go to Checkout and View Model Gallery is the lit blue of the question band; flat and crisp (thin border, shadow blur at most 4 px, no glow). The two view buttons are blue-outlined.
- Cover photographs and the information board have the same height.

## BOTANIC TV redesign round (owner, 13–15 November 2026: master prompt + navigation map; project audit document)
- Precedence: the owner's approved decisions and original drawings, then the PRIMARY screenshot, then the live store's options and published terms; ALTERNATE screenshots are inspiration only. The audit of all 31 subviews, the legal list and the open decisions live in the Claude project document "BOTANIC TV — одит и план по референциите".
- Ignition: each time the television is switched on (page start and every press of Optimised Preview) it wakes like a car's instrument panel: dark glass, one hairline of light, the leaf and BOTANIC, then two readouts, then the glass lights into the stage (about 3.4 s). The two facts are mandatory: **100% Natural Latex** and **Dunlop Technology** (the description's own hero bar). Skip, a tap or a key ends it; reduced motion gives a quiet fade; no blur. Name and facts are per model (`D.ignition`). Test R29.
- Depth: the three heights are drawn from the owner's 26 cm drawing in TRUE proportion 20 : 24 : 26 (front edge scaled cm/26), never exaggerated; the chosen depth carries a "Chosen" mark. Replaces the earlier ×1.8 exaggeration. Test R28.
- Not changed without the owner: texts on the legal list (warranty "2 cm = more than 12%", hygiene, OEKO-TEX scope, cover claims), firmness boundaries, leaf colour (green in the TV, graphite #364849 in the live description), the 20 days unit.

## Reference round (owner, 15 November 2026: the three PDFs, all 37 pictures)
- Every screen follows its PRIMARY screenshot; ALTERNATE only checks copy; the legal list is not published as fact. Audit and status per screen: `docs/BOTANIC-REFERENCE-AUDIT.md`; side by side: `docs/tv-reference/index.html`.
- Pictures are only the owner's own, taken from modules already on the site (`assets/botanic/PROVENANCE.md`): the engineering view (vector body + mattress) for Firmness, Support (Stretching Effect) and the 7-Zone map; the Bio Dunlop SVG; the moon (shown silver, small); the perforated core.
- 7-Zone map: the engineering view full width, never squeezed or redrawn (test R27 checks the proportion 2550:760 and the width).
- Warranty: three full-width rows; the pillows come with the mattress either way; 12% examples only for 20/24/26 cm.
- Ignition v2: luminous lettering (one pass of light, letters stay solid) and a soft ambient pad made in the browser, only after a tap, with Sound on/off remembered; test R29.
- Invitation to explore: "N of 31 explored", small green dots on opened topics and buttons.

## Owner's answers and the Ivory Cockpit (15 November 2026, evening)
- Firmness boundaries: always from the main firmness module (`DDFirmnessCore`): up to 48 / 49–87 / 88–114 / 115+ kg. Confirmed.
- The bowl comes from the Quality and Certificates page; so do the real core close-up (fine pins), the small moon and the official marks (shown in one graphite ink).
- Leaf colour: the designer's choice per place (green on the instrument bands, graphite where it is a quiet marker).
- "Divine Dunlop Dreams" in small spaced letters under the Bio Dunlop wordmark.
- Warranty: 12% of the selected mattress height. That is the rule.
- Delivery: "20 Days Delivery", without saying calendar or working days.
- Text house style: short dashes only (the long dash is never shown); Support and Adaptation always begin with a capital S and A, and in the instrument-band titles they are the bold words while the rest of the title is light.
- Look: Ivory Cockpit. Ivory surfaces (the colour of latex and of ivory car seats), graphite instrument glass for the bands and the current buttons, one lit blue for action (Add to Bag, Go to Checkout, the gallery), large light figures for readouts, hairlines instead of boxes, a four-segment selection gauge. The engineering drawings and the 7-Zone map are in the latex colours. `?theme=classic` shows the previous look.
- The orange numbers and purple dashed frames in the reference screenshots are annotation overlays of the button map, never part of the television.

## Owner's round of 16 November 2026
- **Ignition v3 (about 9 s).** BOTANIC, the two facts (100% Natural Latex, Dunlop Technology), then the three essences, each with a small animation: **Explore** (14 topics light up), **Select & Buy** (four choices light up), **Custom** (the mattress drawn to size); then the tagline "Custom Dunlop Natural Environment for Healthy Sleep" and the line "One custom presentation module: it explores, it selects and it customises." It plays when the television opens (always on Discover), on every press of Discover and of Optimised Preview. Skip, tap or Esc ends it; sound only after a tap; reduced motion shows it still. Test R29.
- **Presentation bar** is not over the television: it is a player strip attached directly under it (play, pause, previous, next, start-up, caption, progress). It lives in the presentation page only (`tools/presentation-tour.html`, `tools/build-presentation.mjs`), never in the module.
- **Labels.** Every rail and topic label starts each word with a capital. The topic that opened every size is now **Sizes**; its panels are **Select Your Size**, **Select Your Depth**, **Why Height Matters**; also **Select Your Firmness**, **Select Your Cover**.
- **Order of the choices** is the shop's own: Size, Depth, Firmness, Cover, Review (the large television only; the mobile premium preview is unchanged). `DDRules.ORDER_SHOP`, test R30.
- **The television guides.** After every choice it says what was chosen and what comes next ("Now choose your Depth") and opens the next choice by itself after 2.6 s; any tap cancels it ("Change my choice"). In "Your selection" a guide card always says what to do now. Off in automated browsers unless `?guide=1`. Test R32.
- **Choosing topics stand out.** In the top bar Firmness, Sizes, Covers and Delivery carry an icon, a deeper ivory and a graphite underline, and a small mark when their choice is made. The order in the left rail is one assembled instrument: four icon tiles on a line that fills as the choices are made, the next one pulsing softly.
- **Header** always names the model: Botanic Original 100% Natural 100% Organic Latex Mattress Dunlop Technology (Botanic and Dunlop bold, Original and Organic thin, in the second colour).
- The preview opens on Discover.

## Owner's round of 16 November 2026 (II)
- **Ignition:** the owner's moon-phase cycle loads first (about 1.4 s, sweeping left to right), then the start-up. Behind it a very light glow of the seven-zone core: a vector sketch of the core from the Quality page photograph (seven perforated bands), no image file, about 26% opacity. The moon cycle also sits as a quiet ornament in the Review band.
- **Two groups in the top bar.** Explore (the 14 description topics, ivory) and **Select & Buy** (Size, Depth, Firmness, Cover, Review: teal underline, teal glow on hover, a mark when chosen). The gallery blue (#2A86B0, owner 16 Nov: never green-teal) is the colour of the selection system everywhere: the order line, the ticks, the next step, the gauge, the guide.
- **Standard Product View** has its own colour: warm sand. View Model Gallery and the two views live in the "Select your Botanic here" card, which stays visible in the standard view so the customer can always switch back.
- **Words for customers:** "screen" or "presentation screen", never "television" (internal only).
- **How Density Works** (owner's infographic, redrawn in the system): four steps Density, Stable Structure, Consistent Firmness, Adaptive Comfort, the conclusion band and the note. In Comfort and in Support.
- **Adjustable Beds** (Adaptation): a settings screen like the car's climate page: positions on the left (Flat, Reading, Relax, Legs Up, Zero Gravity), the core with a sketched sleeper on a hinged base in the middle, Head and Legs sliders, four short points. Claim used: "Suitable for adjustable beds" (owner).
- **Mattress icon** in "Your selection": an outline, transparent, smaller; blue only when all four choices are made. No blue block, no glow.
- **Small green leaf** marks the section labels (Explore, Select & Buy, the stage header, In <topic>, Your selection) and every card.

## Adjustable beds wording and drawing (owner, 16 November 2026)
- The claim is **"Suitable for adjustable beds"**, never "made for": Botanic is a mattress for every bed and can also be used on adjustable bases.
- The drawing is traced from the owner's photograph (woman on the curved latex core): the core's S-curve and the person's outline, smoothed, in the latex colours. No hinged broken lines, no sliders; the positions are listed as information ("Positions it suits"), not as controls.

## Owner's round of 16 November 2026 (III)
- **No duplicate choice buttons.** Size, Depth, Firmness, Cover and Review exist only in the **Select & Buy** group of the top bar. The left rail no longer lists the order steps, the Explore topics no longer repeat them, and "Your selection" carries no choice chips (only the guide card, the gauge, the price and the bag).
- **Firmness is confirmed, not only shown.** Weight and height (or a tap) pick a firmness; a bar "Your firmness: Medium. Confirm it to continue." holds the button **Confirm Medium**. Once confirmed, the other firmnesses disappear: the screen shows the confirmed card (badge Confirmed, the range, one line) and **Change firmness**, which reopens the four. Only the confirmed firmness counts as a choice and is sent to Ecwid.
- **Ignition:** the moon-phase cycle no longer comes first. It sits under the BOTANIC name, the same width, and appears with the rest in sequence, with a light sweep and breath.
- **Stretching Effect:** the spine runs inside the body (the vertebrae along the back, from the neck to the pelvis) and the two arrows run inside the torso along the spine, outward from the middle. Static, no blinking. The drawing is shown at full card width with the label under it.
- **Topic and its parts are one tree.** The left rail shows the selected topic as a dark header with its colour dot and "N parts in this topic", and its parts as branches joined by a line in the topic's colour. On a choice screen the header reads "Your <choice> · Learn before you choose" and the branches are the related explanations from the topics.
- **Each topic has its own colour** (night palette: blues, violets, sand, sage), shown as the dot in Explore, the tree line, the stage tint, the card top edge and the aurora in the question band, which is a night sky with stars and a crescent. Selection stays in the gallery blue.

## Owner's round of 16 November 2026 (IV)
- **No button twice, ever.** Firmness, Height and Covers are no longer Explore topics. Explore has eleven topics (Discover, Comfort, Benefits, Support, Adaptation, 7-Zone, Ventilation, Hygiene, Certifications, Warranty, Delivery), six to a row. Size, Depth, Firmness, Cover and Review exist only in Select & Buy. The word is **Cover**, never "Covers"; the old Height topic is **Depth**.
- **Knowledge hangs under the choice.** When a Select & Buy button is pressed, the left tree ("Choose and learn") shows the choice itself first ("Select Your Firmness", Your choice), then its more information: Firmness has Correct vs Softer, How It Works, Who It Is For; Depth has Why Height Matters; Cover has Cover System. Each is marked "More information"; the stage header reads "<Choice> · More information", the Select & Buy button stays lit, and the actions are "More: <next>" and "Select Your <Choice>". Test R26 opens every one.
- **Review** sits in the second row next to Cover, the same size as Depth and Cover.
- **Stretching Effect:** the sleeper lies on the shoulder, so the spine runs through the middle of the torso, neck to sacrum (the midline measured from the body outline, smoothed: `engineering-view.json` spine). The arrows continue the spine inside the body, into the head and into the legs (`stretch`).
- **Stronger lights.** Each Explore topic changes the room: the stage, the left column, the screen's edge glow, an aurora in the question band and the lit Explore button, all in the topic's colour. Choices keep the gallery blue.

## Colour concept "From Nature to Sleep" (owner, 16 November 2026, V)
- **No brown, no beige, no sand, anywhere.** Blue and brown fight. The base is the site's own cool palette: mist #EDF5F7 / #F6FAFB, aqua line #D6E6E8, slate ink #203032 / #364849, sage-slate #5E7A7D. The latex drawings, the zone map, the gauges and the Standard Product View use the same cool mist and slate. The green leaf stays as the one natural mark. Test R33 scans every element in both layers for warm colours.
- **Two layers, two environments.** The customer always knows where they are:
  - **Explore = the night.** The topic's colour fills the room: stage, left column, screen edge, the night-sky question band and the lit Explore button. The eleven colours walk in the order of the bar, from mint (nature: Discover) through aqua and sky to indigo and violet (sleep: Delivery): Discover #45C49A, Comfort #45C4B2, Benefits #45BEC4, Support #45A5C4, Adaptation #458DC4, 7-Zone #4575C4, Ventilation #455CC4, Hygiene #4645C4, Certifications #5E45C4, Warranty #7745C4, Delivery #8F45C4.
  - **Select & Buy = the clear day.** White, crisp, the gallery blue #2A86B0 only. The question band turns deep clear blue, without stars or moon.
- **The choice is never shown twice.** The Select & Buy button is the choice. The left tree ("You are choosing") shows the choice as its header (with the value or "Not chosen yet") and only the information that helps to choose ("Helps you choose"). There is no "Select Your …" button in the tree and no second "Select Your …" button on the information screens (only "Back to the choice"). The cover card says "Cover", never "Covers".

## Colour concept "Divine Night" and the order trail (owner, 16 November 2026, VI) — replaces "From Nature to Sleep"
- **Only the site's own colours.** Read from divinedunlop.com (read-only): navy #1F3D58 and #0B2A38 (the dark cards and night sections), ice white #F1F6FB / #F9F9F9 (the ground), mint #4FD3CB and periwinkle #647BD0 (the accents). The toxic green (#45C49A) and the violet end are gone.
- **One family of accents.** The eleven Explore topics take one step each of the family from the site's mint to its periwinkle, in the order of the bar (Discover #42CDC3 … Delivery #5871CA). Select & Buy is the gallery blue #2A86B0, which sits inside the same family. Everything is in unison: change one, and the family moves together.
- **Colour is an indicator, never a glow on white** (Polestar: clean, ordered). White and ice surfaces are flat. No screen-edge glow, no tinted stage, no coloured halo around buttons. The topic shows as a dot, a thin line (tree, card top, the 3 px line under the current button) and a soft light only on the dark navy band (as on the site's night sections). The current Explore button is navy with its topic's line; Select & Buy tiles are white with a step number (1–4) that becomes the blue tick; the current one is navy with the blue line.
- **No moon over the logo.** The Discover band carries the Dunlop mark, so it has no crescent.
- **The order trail (traceability).** While choosing, and on every "Helps you choose" screen, a strip under the two groups shows the whole order: Size (value, tick) — Depth — Firmness — Cover — Review, the current step in navy. Every step is one tap away, so the customer always sees where they are and can go back and correct. The tree's header leads back too ("Not chosen yet · Choose" or "Firm · Change"), and every information screen ends with "Back to the choice". Test R34.
- **Review** fills both rows on the right, the same height as the four steps, parted from them by a thin line.
- **7-Zone:** the seven zone cards sit in one row under the map (each with its tone on top), then "How to read the map" beside the film. Nothing hangs alone.

## Four families, four cards (owner, 16 November 2026, VII)
Explore, Select & Buy, Your order and Your selection are no longer buttons parted by a line. Each is its own card with its own colour life; none borrows from another.
- **Explore (read): the night.** A navy card (#1F3D58 to #0B2A38). Translucent buttons, the topic's colour as a dot; the current topic turns white with its coloured line. The last topic spans two columns so no button hangs alone.
- **Select & Buy (choose): the day.** An ice-blue card (#E4F0F7, line #C3DCEA) with white tiles and step numbers; the step you are on is the gallery blue #2A86B0.
- **Your order (traceability): a slate ledger.** A cool grey-blue card (#E6EBF2), the steps joined by a line; done = navy tick with its value, here = a white pill with the blue line.
- **Your selection (pay): an aqua column.** The site's mist aqua (#E8F3F5) with white cards for the price and the bag; the topic rail stays white.
Test R35 checks that the four have four different looks; R2 was updated for the aqua column.

## Owner's round of 16 November 2026 (VIII)
- **Start-up animation: calm and clean, as before.** No moon cycle, no mattress drawing (the moon cycle is also gone from the Review band). BOTANIC, the two facts, Explore / Select & Buy / Custom ("11 topics"), the tagline.
- **The Standard Product View keeps the product information.** Besides the shop's gallery and options, the whole approved description (the earlier, approved format with all its chapters and cards) is there, as on the shop page. In the shop the engine already puts the original description back when the customer chooses Standard Product View; the preview now shows it too. One view does not eat the other. Test R36.
- **One screen.** On a large screen the monitor is the height of the screen (like a car display): the two groups, the order trail and the three columns are always in view; only the middle stage scrolls inside, with its actions fixed at the bottom. The chrome is tighter (38–40 px buttons, smaller band). Fixed a defect where long pages squeezed the stage header and the band.
- **Explore buttons** carry a thin, delicate blue outline (1 px). The current topic is outlined in its own colour, and the same colour outlines its header in the tree: the button and its tree read as one.
- **Topic parts are lettered A, B, C** in the topic's colour (also under a choice), and the stage header names the part: "Discover (A) Introduction".
- **Films and photographs** of the description are shown: the six loops play in their topics (Discover, Benefits, Adaptation, 7-Zone, Ventilation, Certifications), the cover photographs and the gallery. The published preview can only load its own files, so they travel with the page (fetched at build time, not committed); in the shop they come from the shop's own media addresses.
- **Titles:** Ventilation "Breathable … Comfort" and 7-Zone "7-Zone" in blue and a touch bolder; **Warranty and Durability** with Durability opening on the Divine Dunlop D mark.
- **Delivery Journey** (new part B of Delivery): seven steps, each with a notification: Order confirmed, In production, Quality tested, Prepared for dispatch, In transit, At the depot, Out for delivery (the two-person delivery team). "A notification at every step", **delivery included in the price, no extra transport fees**, 20 Days Delivery.
- **No "N of 24 explored"**: the customer decides what to read.

## Cosmic Selection (owner, 16 November 2026, IX)
- **The fixed one-screen height is withdrawn.** It hid things (the King sizes, the third depth). The screen is tall again and shows everything; there is no scrolling inside the screen or inside any card ("no lifts, no sliders").
- **Sizes in six families.** All Single Sizes (75–100 cm wide, 6), All Small Double Sizes (120, 2), All Double Sizes (135–140, 3), All King Sizes (150–160, 5), All Super King Sizes (180, 3), All Emperor Sizes (200, 3): all 22 sizes, each in exactly one family, by width. A customer looking for a double never has to read the kings.
- **Navigation.** Tap a family to open it. Inside, "All size families" leads back, and the six families stay one tap away as lit chips, so the customer can move between families and back to any other choice (Select & Buy, the order trail) at any time. The family of a chosen size is marked ("✓ King Long").
- **Cosmic Selection** is the space every choice happens in (size, depth, firmness, cover): deep navy with a few stars, glass cards, and the light in a thin underline that glows in the family's colour. The six families walk the site's spectrum from mint to a measured violet (#4FD3CB, #3FC1E6, #52A6F0, #6F8CF2, #8E80F0, #AE97F2). Each size card shows its footprint drawn to scale (200 × 220 cm fills the box), centimetres and inches. The cards of a family share one row (King five across). The light stays on the dark; nothing glows on white.
- **Depths** sit side by side in the same space (20, 24, 26 cm), so the third depth is never out of view.
- **Body weight scale** ends at **180 kg** (the firmness ranges are unchanged: 115 kg and over is Extra Firm).
- Test R37.

## Pick, Confirm, Change (owner, 16 November 2026, X)
- **Every choice works like firmness.** For size, depth, firmness and cover: a touch only **picks** (the card lights, nothing counts, nothing goes to the order or the shop); a bar says "Your size: King Long · 150 × 210 cm. Confirm it to continue." with the button **Confirm King Long**; only then the choice counts (order trail, Select & Buy tile, price, Add to Bag) and the module says what comes next and opens it.
- **A confirmed choice stays open.** The screen then shows the choice alone (badge Confirmed, its picture, its words) with **Change size / Change depth / Change firmness / Change cover**. A touch brings every option back (for sizes: the family of the chosen size is open, with all six families one touch away), the current one preselected; confirming again replaces it. The customer is never left on a first choice: Select & Buy, the order trail and the tree's header all lead back at any time.
- **Nothing blocks anything.** Reading the information under a choice, moving to another choice, or leaving and returning never loses a pick that was confirmed; an unconfirmed pick simply does not count. "Continue to <next>" stays inactive until the choice is confirmed.
- **In the shop** (Ecwid is the executor): only a confirmed choice is written to Ecwid's own control, exactly like firmness. The shop's own controls in the Standard Product View remain direct and are always confirmed by themselves.
- Test R38.

## Sizes first (owner, 16 November 2026, XI)
- **The size is the star.** In the size step the figures are what the customer sees first: the family names 23 px, the range of each family in cm and in inches on two lines (20 px and 17 px), each size's centimetres at 30 px and its inches at 20 px, with generous spacing. The confirmed size shows as large figures (up to 60 px cm, 38 px inches) with one glowing line under them.
- **No small mattress drawings.** The footprints are gone (from the families, the size cards and the confirmed card); the size matters more than a picture of a bed. The light is one thin glowing line under each card, in the family's colour.
- **Rows without a lonely card:** King = 3 + 2 (the two wider), Single = 3 + 3, Small Double = 2, Double = 3, Super King = 3, Emperor = 3.
- Tests R14 (figure sizes) and R37 updated.

## The screen stays at the information block; the size families, serious (owner, 16 November 2026, XII)
- **No jump to the top.** Whatever is pressed (a topic, a part in the tree, a Select & Buy step, a step of the order trail, Next, Back, Continue), the page is no longer thrown back to its top, so the customer never has to scroll down to find what came out. If the information block (its heading line) is out of view, the page brings it to a calm position near the top; if it is already in view, nothing moves. A pick, a confirm, opening a family or any change in place never moves the page. (`toStage()`; reduced motion jumps without animation.) Test R39.
- **The size families are the map of the sizes.** Each family button is large (184 px high), with the name in capitals with wide spacing (22 px, 0.13 em: ALL SINGLE SIZES), the width range in cm and in inches, and the number of sizes in the family's colour, with the glowing line. Not pills. All six have the same height and structure.
- **Inside a family** the six families are rectangular tabs (capitals, spaced, with the count of sizes and the line), the current one lit in its colour, plus "All size families" as a rectangular button. The size cards return to a calm size (23 px cm, 16 px inches) so the families, not the cards, are the main structure.

## Size families, refined (owner, 16 November 2026, XIII)
- Not bloated boxes. The family cards keep a generous presence but a calm hierarchy, **centred**: the family name in small spaced capitals (12.5 px, half of before: ALL SINGLE SIZES), a short glowing divider in the family's colour, the width as the hero figure (30 px), the inches beneath (15 px), the number of sizes in small capitals in the family's colour, and the glowing line at the bottom. A soft light of the family's colour sits on the dark of the card, never on white.
- Every card has the same structure and the same line positions: the name block has the same height (one or two lines), so the figures line up across the row.
- Inside a family the tabs and the size cards are centred in the same way (name in small spaced capitals, the centimetres as the figure, the inches beneath).

## Size families without figures (owner, 16 November 2026, XIV)
- The family cards carry **no width ranges and no inches** ("75–100", "135–140" confused: they say nothing about a family). A family card is only its name in small spaced capitals (ALL SINGLE SIZES, ALL SMALL DOUBLE SIZES, ALL DOUBLE SIZES, ALL KING SIZES, ALL SUPER KING SIZES, ALL EMPEROR SIZES), the short divider and the glowing line in the family's colour, and the count of sizes in small capitals. The figures (cm and inches) appear only on the size cards inside an opened family, where they belong. Test R39 checks that a family card holds no range.

## The owner's palette (owner, 18 November 2026, XV) — replaces "Divine Night" and the earlier colour concepts
The owner's wireframe (IMG_6184) defines the colours; they were sampled exactly from it. This supersedes every earlier colour decision, including "no brown" (the owner's own palette is warm: olive and taupe on cream) and the gallery blue.
- **Palette:** cream **#FBFBED** (ground, and the text on dark) · slate **#384442** (dark surfaces) · deep slate **#2E3633** (the darkest: the start-up, the strongest ink) · taupe **#DDD6C4** · olive **#646155** · grey **#6A6962** · teal **#18C9CC** (the one accent: lines, dots, markers, the call to action; the "Botanic" word on the dark band). Derived only by mixing these: stage #F5F4E5, paper #FEFEF6, hairline #CFC8B4, deep teal #0B6F75 for fills carrying light text. The small green leaf stays.
- **Start-up animation:** flat on the darkest colour, #2E3633, cream text.
- **Each family keeps its own role, as in the wireframe:** Explore = slate card, buttons with a thin cream outline, the current topic a cream button with its topic's line; Select & Buy = taupe card with slate tiles, the current tile in deep slate with a teal line, Review a deep-slate block; Your order = grey ledger (#6A6962), done = cream tick, here = cream pill; the topic tree = slate buttons on cream, the current one deep slate with the topic's line; Your selection = olive column with paper cards; the dark bands and the Cosmic Selection space = slate, with the teal for accents. The cream stage holds paper cards with deep ink.
- **The topic, family and depth colours** are one family from the teal to a muted sand (#18C9CC … #A39D7F), in the order of the Explore bar (decorative: dots, lines, glows; text never relies on them).
- **The call to action is one:** Add to Bag, Go to Checkout, View Model Gallery and every Confirm button are teal with deep-slate ink and a thin deep outline (readable on cream, paper and olive).
- **Maximum contrast, enforced.** A contrast scanner reads the effective background of every visible text (worst case over gradient stops) against its colour: 4.5:1 for text, 3:1 for large text. All 15 main screens pass (test R40). Cream on slate is about 9.6:1, deep slate on cream about 14:1, deep slate on teal about 5.9:1.
- Colours only: no layout, wording or behaviour was changed. Tests: R2, R7, R33 and R35 now describe the palette.

## Coffee and vanilla (owner, 19 November 2026, XVI, wireframe IMG_6189) — refines XV
- **The feeling is coffee with vanilla.** Coffee **#434239** (Explore card, information bands, the size space) · deep **#2E3633** (Select & Buy layer, the topic tree, the strongest ink) · vanilla **#FBFBED** (ground, text on dark) · latte **#DDD6C4** (Explore buttons, card borders) · olive **#646155** · the one accent a soft olive green **#93AB57** (deep **#4F6128** for lines and ink on light). "Distinctive colours" always means close, harmonious colours: no teal, no toxic green, no glow anywhere (every glow removed; test R33 forbids teal outside the logo).
- **The logo is the colour version from the site** (the wordmark and the mark keep their own fills).
- **View Model Gallery** is a quiet square tile (76 × 64, radius 14) in coffee with a vanilla icon and the word Gallery: never green, never a pill.
- **The call to action** (Add to Bag, Go to Checkout, Confirm) is the soft olive green with deep ink and a thin deep outline: flat.
- **Your selection** is a card with rounded corners (16 px) and room above it; it no longer runs up to the top edge.
- **Delivery, part C "Before It Arrives"** (four cards): the packaging (a strong technical-textile transport bag with a zip, plus extra protective wrapping; never test the mattress in its packaging, always unpack it first); get your home ready (one of the largest things delivered to a home: a kitchen comes in modules, the mattress comes in one piece; measure doors, stairs and corners, clear the path); why it is never rolled (100% natural latex cannot be rolled, compressed or vacuum-packed: it is about twice as dense as standard foam and the machines are not built for it; the same density and elasticity give the high Support); a two-person team for large and heavy mattresses ("you are not on your own with it"). The owner's words "Метакан текстил", "сверлони" and "домен сервиса" are rendered as technical textile, extra protective wrapping and two-person team, pending the exact terms.
- **The spine ends above the pelvis** (engineering view: 11 points from 700 to 1260; the tail line stops at 1490).
- **Elasticity:** the cards are horizontal rows beside the film, their column the same height as the film.
- **7-Zone:** the zone name and its note are written inside each zone of the drawing (the mattress drawn deeper to hold them; ink chosen per shade for contrast). No separate boxes, no Z1–Z7 labels. Beside the film, a short key to the three shades.
- **Wording is human and direct** ("Everything about the mattress, topic by topic.", "A message at every stage. Delivery is included in the price.", "Your choices appear here.").
- Tests: R7 (green CTA, square gallery tile), R18, R27 (drawing ratio 2550/1090), R33 (no teal), R34 (zones inside the drawing). All 136 design checks, the price, selection and sync contracts pass.

## Round XVII (owner, 19 November 2026, wireframe IMG_6191)
- **7-Zone drawing shallower.** The zone block is no longer a "foundation": the drawing is about 9% less deep (ratio 2550 : 995). Names and notes stay inside their zones; the narrow Feet & Ankles zone gets a slightly smaller type on two lines.
- **Adaptation and its film keep their former size and outline.** The film column is the old 250 px with a 16 : 9 picture, not stretched; the four cards are horizontal rows beside it.
- **The leaf is the Botanic green** (#93AB57 to #6E8A3A), no longer the pale, milky green.
- **Your selection:** the mattress icon is no longer in the heading. It sits below the Add to Bag button, large (88% of the column width) and calm, in vanilla; it turns soft green when all four choices are made. The card has 14 px of air above it and never touches the cards above.
- **Your order** is exactly as wide as the Explore card above it (same left and right edge), and no longer runs over the Your selection column.
- **The film panel is redesigned** as in the wireframe: a latte panel, inside it a coffee card holding the film and its title in vanilla, and a line of text on the latte beneath it. Used for every film (Discover, Benefits, Adaptation, 7-Zone, Ventilation, Certifications). On Discover the bowl picture and the logo sit in the same panel.
- **Optimised Preview / Standard Product View:** one common latte card, no green border. The pressed button is coffee with vanilla text; hover and press change the colour.
- Tests: R7 (no border on the view switch), R9 (leaf colours), R27 (drawing ratio). All 136 design checks and the price, selection and sync contracts pass.

## One green, Covers explained, the customer letter (owner, 19 November 2026, XVIII, IMG_6193)
- **One green: #6E8601** (sampled from the owner's picture), in every form: the call to action, the gallery tile, the leaf, dots, marks, lines, the mattress icon when the order is ready. Where small text sits on light surfaces its deeper shade **#566901** is used (same hue; the exact green is 4.0:1 on cream). The topic and size-family dots run from this green toward sand and start with it.
- **Buttons:** Add to Bag, Go to Checkout and every Confirm are #6E8601 with white labels, a white 2 px edge and a thin dark ring, as in the owner's picture. White on #6E8601 is 4.15:1, so every such label is large and bold (19 px and up). Hover goes darker (#5D7200).
- **View Model Gallery:** a near-square tile, green outside, white icon and word inside, with the same white edge and a thin dark ring.
- **Green text on dark bands** would be 2.5:1, so the accent word in a heading (Botanic) is vanilla with the green as a thick underline.
- **The lettered badges** are a coffee disc with a vanilla letter and the topic colour as a ring (strong contrast).
- **Covers: the tree under the Cover step now has four parts:** How The Cover Fits (a true-proportion cross-section: 1 cm of cover on top, the latex core, 1 cm underneath; the chosen depth, for example 26 cm = 24 cm core + 2 cm cover; the three depths side by side), Zip And Washing (a zip drawing; every cover is zip-off, 100% washable, 40°C at most), Covers And Warranty (the warranty is for the latex core only; covers are not covered; on a core claim the customer takes the cover off and fits it again; a second cover can be ordered with the mattress or later), Cover System (the description's own text). The same panels also appear under Depth (Core And Cover), Hygiene (Zip And Washing) and Warranty (Covers And Warranty).
- **Who Is This Mattress For?** now sits in Discover as well as in Firmness (one panel, two places).
- **The customer letter, as the essence, in our own words, not quoted:** Firmness gets Lying, Not Sitting (judge it lying down; sitting sinks you in and that is normal) and Firmer Is Not Always Better (no universal rule; adaptation, pressure, relaxation and position work together; where very firm surfaces fit). Discover gets Honest Promise (not a medical device; what we give and what we do not claim). Comfort gets Your First Ten Days. Support gets How Support Feels (held up, not pushed back; almost twice as dense). Adaptation gets Why It Matters (muscles, nervous system, circulation). Certifications gets Three Plants In Europe (Germany, Italy, Belgium; making foam is not fitting covers; UK depot, German factory). These texts are the owner's own, not the approved description, and live in tools/own-panels.mjs.
- **Behaviour:** after a press, the information block stays where it was on the glass even when the page gets shorter (the browser no longer throws the page to the top).
- Tests: R7, R9, R36 (four lettered parts), R39, R40 (now also the new panels), R41 (one green), R42 (the content). All 142 design checks and the price, selection and sync contracts pass.

## Round XIX (owner, 20 November 2026)
- **The start-up wordmark, its tagline and its underline are the same green, #6E8601** (no pale sweep, no glow), as the Gallery tile and the leaf.
- **The logo's teal (#009289) becomes the approved green** everywhere the logo appears: the emblem and the wordmark under Discover, and the Bio Dunlop leaf. The dark ink of the logo (#092600) stays.
- **Buy direct from the maker:** a new Delivery panel, first in Delivery: you order from Divine Dunlop Dreams, the manufacturer; made in Germany; sent from our UK depot; about 20 days for manufacture and preparation (the owner's letter, our words).
- **The mattress card** sits in Your selection, directly above Add to Bag, on a vanilla card. Its contour is grey while nothing is chosen. The size, the depth and the cover never change its colour. Choosing firmness gives it the decorative sky tint (#5DB8C4 at 40 %). When all four choices are made, the whole contour is #6E8601 and the word Ready appears under it (#566901, bold).
- ~~The core cut-out at the foot of Your selection~~ was withdrawn by the owner on 20 Nov (see Round XX).
- **The outer frame is 2 px** (it was 6 px: three times thinner).
- **Equity:** the integration status and the open questions are in `docs/EQUITY-INTEGRATION.md`. The production embed does not yet carry rounds XVI to XIX.
- Tests: R33 allows the sky tint in the mattress card only; R43 checks the card, the frame, the core and the order. All 145 design-rule checks and the price, selection and sync contracts pass.

## Round XX (owner, 20 November 2026)
- **The whole Bio Dunlop logo is the one approved green, #6E8601**: the leaf, the mark and the wordmark. Last round only the teal parts were changed; the dark leaf and letters (#092600) are now green too.
- **The core picture in Your selection is removed** (final decision of the owner: too heavy). Your selection keeps the price, the mattress card and the bag. The earlier idea of a core cut-out elsewhere in the module is withdrawn until the owner asks for it again.

## Round XXI (owner, 20 November 2026)
- **Delivery opens with "What To Expect Before Your Mattress Arrives"** (the four cards: packaging, getting the home ready, why it is never rolled, the two-person team). It is the first part of Delivery and the most important one; Made To Order and Delivery Journey follow.
- **"You buy directly from the manufacturer" is said once**, as the sentence under that title. The separate "Buy Direct From The Maker" part (round XIX) is removed: one sentence says it all, and a whole section would say nothing more.
- **7-Zone gets a new part, "How 7 Zones Work"** (five short readings): one latex with exactly the same structure and firmness from head to foot; the zones are not different materials and not different firmnesses; the perforation sets the support in each area; a less open perforation leaves more latex and raises the support, a more open one softens the area; the spine is supported with the stretching effect and the pelvis is held up; the shoulders have their own adaptation and the back and lower back feel supported with lightness, not pressure and not weight.
- Test R44 checks the order of Delivery, the single sentence and the 7-Zone text.

## Round XXII (owner, 20 November 2026)
- **No "Select your Botanic" row and no "Select your Botanic" button.** The row above the screen (title and sentence) is gone, and so is the button in the row under the information: the right card already says where to start ("Start here: Choose your Size"). The screen is shallower, so more of every topic fits on one screen. The Gallery tile and the view switch (Optimised Preview, Standard Product View) now sit in the header line, to the right of the model's name.
- **The Discover title says what the product is:** "Botanic Original – 100% Natural Latex Mattress" ("Know your Botanic" said nothing: Botanic is a name).
- **The start-up plays once,** when the model is entered. Pressing Discover or Optimised Preview no longer plays it again. (The guided tour of the presentation can still play it on its own start-up step.)
- **"Buying directly from the manufacturer"** is the wording, never "from the maker". It is said once (round XXI), under the title of Delivery's first part.
- Tests: R6 and R29 updated.

## Round XXIII (owner, 20 November 2026)
- **The header line is said once:** "Botanic Original 100% Organic Latex Mattress Dunlop Technology" (the second "100% Natural" is gone). The Discover title is "Botanic Original – 100% Organic Latex Mattress". The start-up's required fact "Material: 100% Natural Latex" is the owner's earlier decision and is unchanged.
- **Firmness: weight and height in both measures.** Body weight: kilograms, or stones and pounds. Height: centimetres, or inches. Each can be slid or typed; typing in one measure changes the others at once, and both measures are always shown (82 kg and 12 st 13 lb; 182 cm and 6 ft 0 in, also at the ends of each slider). A value that is not complete or not in range waits and does not change anything; leaving the field puts the last good value back. Stones and pounds are one pair: what a person types there is not rewritten. The firmness rule keeps working in whole kilograms and centimetres, so a typed value is rounded to them (1 lb is about 0.45 kg). The four firmness cards also show their ranges in stones and pounds.
- Test R45 checks the conversions both ways, the wait on a wrong value and the guidance.

## Round XXIV (owner, 20 November 2026)
- **The Bio Dunlop logo and the cup of latex always stand under Add to Bag**, in the right column (Your selection), one after the other: the logo first (in the one green, with "Divine Dunlop Dreams" under it), then the cup. They sit on a vanilla card like the price and the mattress, so the green reads clearly on the olive column. They are on every screen. They are removed from the Discover panel, where they stood before: they moved, they are not repeated.
- Test R46 checks the order, the position under the bag, the logo's green and that the Discover panel no longer holds them.

## Round XXV (owner, 20 November 2026)
- **Discover: the whole film, full screen.** Where the logo and the cup used to stand in the Discover panel, there is now a green "Watch the full video" button (and a tap on the loop does the same). It opens the shop's full presentation film (`botanic-natural-latex-mattress-premium-presentation-full.mp4`, not the loop) over the whole screen, with controls and sound, and asks the browser for real full screen (on iPhone Safari the film's own full screen). Nothing of the full film is loaded until it is asked for. Escape or the close button ends it. The loop in the panel stays the short, silent version.
- **The Bio Dunlop logo and the cup have no white card.** They stand cut out on the olive column under Add to Bag, the logo in the one green, with a thin vanilla cut edge on the logo and on the cup so that they stand out on the olive.
- Tests: R46 (no card), R47 (the film opens, nothing loaded before, three ways to close). Verified only in a headless browser with the network blocked: the viewer opens, points at the full file and closes. Real playback and real full screen need a check in Safari on the iPad.

## Round XXVI (owner, 20 November 2026) — corrects XX and XXV
- **The Bio Dunlop logo keeps its own design.** Round XX had made every part of it one green, which changed the leaf. It is back as drawn: the site's teal is replaced by the approved green #6E8601, the dark details (#092600) stay as drawn.
- **No outline, no cut edge, no filter** on the logo or the cup (the vanilla edge of round XXV is removed).
- **Smaller:** the logo is about 30% smaller than before (56% of the panel's width instead of 80%), the cup about 32% smaller (46% instead of 68%).
- **The backdrop is the palette's latte (#DDD6C4),** the colour they had in the Discover panel, not a white card. On the olive column the original logo cannot be seen (the green is 1.5:1 on olive), so the latte stays; if the owner wants them with no backdrop at all, the column colour or the logo's colour has to change, and that is the owner's call.
- Test R46 checks the two tones, no outline, the sizes and the latte.

## Round XXVII (owner, 20 November 2026)
- **The mattress card stays coffee.** No white card around the mattress. The mattress is drawn in vanilla on the column; only its contour changes: grey while nothing is chosen, a sky tint once the firmness is chosen, the whole contour green with the word Ready when all four are chosen. The size, the depth and the cover never change its colour. The drawing is back to its full height (128 px).
- **The brand block (logo and cup) is a tone of the column** (#5B5A4F), not the latte and not a white card. The logo keeps its two tones (the teal as the approved green, the dark details as drawn). Vanilla text.
- **Explore shows the parts of a topic on hover** (a pointer; desktop, laptop, a tablet with a mouse): the topic's parts open as a short list under its button, and a choice goes straight to that part. A tap on a topic goes to the topic, as before (on a touch screen the topic's parts are in the left tree). The label "All topics" is always there, at the start of Explore, and opens the whole nomenclature from the start (every topic and its parts, in order); a choice from it opens that part.
- **Delivery has an Installation part**, second, after What To Expect: prepare the bed in the room where the mattress will stay; carry it in its bag, lay it on the prepared bed and unpack it there (the heavy lifting once, not twice); the small label on the lower short edge (the side that gives the width) names the material and shows which end goes to the feet, so decide where the head goes before you unpack; two people for the large and heavy ones.
- Tests R48 (Explore parts, All topics, a choice from it) and R49 (Installation), R50 (no white card; the tone of the column). All 166 design-rule checks and the price, selection and sync contracts pass.
- Open for the owner: the exact wording on the label (the owner said the material, for example wool, and the foot end) should be checked against a real label before it goes live.

## Round XXVIII (owner, 20 November 2026) — replaces the hover list of round XXVII
- **No hover.** The hover list of round XXVII made the screen flicker when a part was pressed, and it was not a touch behaviour. It is removed.
- **Pressing a topic opens its parts in a strip under the Explore row:** the topic's name on the left (with its colour), then its parts (A, B, C…). The part on the glass is marked. A tap on a part goes to that part; the strip follows the choice. Pressing another topic moves the strip to it. The topic buttons themselves do not change: the main folder (Delivery, Discover, the preview) stays as it is.
- **All topics** is still always at the start of Explore and opens the whole nomenclature; a choice from it opens that part.
- **Nothing blinks on a press:** the Explore row is redrawn only when its markup changes.
- **Why a strip under the row, not under the button:** a Explore cell is about 130 px wide, too narrow for part names such as "Your First Ten Days". If the owner wants the parts directly under the pressed button, the row itself has to open, and that is a layout decision to test.
- Test R48 updated (pressing opens the strip; a part goes to its page; All topics; no hover).

## Round XXIX (owner, 20 November 2026) — replaces the earlier placement of All topics
- **All topics sits in the free cell of the Explore card**, after Delivery (the row's last place). It has the height of a topic button, a dashed vanilla outline and a list mark, so it reads as a different thing: the way to the whole list. It is not inside the topics' list and it is not in the left column.
- **Pressing it shows the whole nomenclature in the main area** (every topic and its parts, in order); a choice from it opens that part. The strip of the open topic's parts is hidden while the whole list is open, so the path is not shown twice.
- Test R48 looks for the button in the Explore card and for 11 topics.

## Round XXX (owner, 20 November 2026)
- **All topics sits beside the Gallery button** in the header line: a tile of the Gallery's size, in the coffee tone (not green), with a list mark. It opens the whole nomenclature in the main area. It is no longer in the Explore card and not in the left column, so the Explore card's depth does not change.
- **Installation is rewritten** in the owner's points, short sentences: prepare the home (bedside tables, valuables, the floor and the route); plan the route (stairs, landings, corners; carry slowly); how to remove the packaging easily (carry it in its bag to the prepared bed, unpack there; keep the bag for storage, moves and transport); two people, always (a king, a double or larger; help each other; never handle it alone, never leave anyone alone with it; a heavy product); the correct position on the bed (the small label on the lower short edge; the material and the foot end); turn it about once a month for the first six months, then regularly. The set-up takes about 15 to 20 minutes of care and organisation.
- **Open points for the owner, not yet published as fact:**
  1. **"Foldable" and "never rolled" contradict each other.** The owner's note says the mattress is foldable and can be carried through stairs and corners. The product page (Why it is never rolled) says 100% natural latex cannot be rolled, compressed or vacuum-packed. The Installation text says nothing about folding. Which is true?
  2. **Turning:** the warranty text says "rotate three times in the first six months"; the Installation text now says "about once a month for the first six months". One of them must change.
  3. **"20 years":** the owner's note mentions 20 years of life with turning. It is a claim, and it is not written in the page; it needs the owner's approval.
  4. The owner's wording "a lady should never be left in such a position" is written in a gender-neutral form ("never leave anyone alone with it"), with the same intent.
- Tests R48 (All topics beside Gallery), R49 (the new Installation points).

## Round XXXI (owner, 21 November 2026)
- **The open topic is one item in three places.** The top Explore button, the part in the strip under it, and the tree in the left column (its heading and the current part) are the same vanilla item with the same 4 px green notch at the foot and the same words and letters. The tree's other parts stay dark. In Select & Buy the same idea holds in dark: the open choice at the top and the choice heading in the tree both carry the green notch. Nobody should read the two as different things.
- **"Organic Natural" / "Natural Organic" never appear.** The build now turns any such pairing into "Organic" in everything the television writes (for example the Benefits title is now "Why Organic Latex Is Different"). Test R51 checks 59 pages of the screen.
- **"Organic Latex" and "Natural Latex" are always bold**, wherever the television writes them (titles, text, the header, the start-up screen). The words themselves are not changed, only wrapped. Test R51 checks every visible occurrence.
- **Not touched, by design: the Standard Product View.** It shows the shop's approved description verbatim (the real shop's own text). That text contains one "Organic Natural Latex" (source/botanic-original-description.html, in "Why Organic Natural Latex Is Different") and its own formatting. We do not change the approved source or the live shop; if the owner wants this one phrase corrected, it is a one-word edit in the shop's description, to be approved first.
- Test R51 added; 178 design-rule checks and the price, selection and sync contracts pass.

## Round XXXII (owner, 21 November 2026)
- **Comfort gets "Who It Is For"** (second part, after What To Expect): Botanic Original is the solid, classic latex mattress for people who want one clear firmness and stable support; the support is matched to the body weight, and the customer chooses the firmness that matches it; every main solution of a good latex mattress is built in (natural Dunlop latex, seven zones, ventilation, a washable zip-off cover). As the owner asked, the earlier wording about "support from the given firmness they have" is gone; only stable support, by weight, remains.
- **Benefits / Why Latex is rewritten and re-ordered:** 1 Not Petroleum-Based (Botanic is made from the milk of the rubber tree, not from petroleum; the petroleum foams are named only as what latex is not, so nobody reads it as a property of Botanic), 2 Latex Is Bio-Based (adds: the latex milk comes from Indonesia because the rubber tree grows only in the tropics, the one step outside Europe; cleaning, preparing, shaping, covers, sewing, quality checks and distribution are European production, certified for the European market and its customers, including for baby use), 3 Breathability Advantage (the approved text, unchanged), 4 Why Latex Costs More (an expensive process; craft, precision, more engineering accuracy; a latex mattress is a system of many functions in balance: anatomical and orthopaedic comfort, seven zones, ventilation for temperature comfort; top class, most premium feel, more complex to make).
- **Support and Adaptation carry the same point,** one panel in both topics ("Support + Adaptation"): "Highest Support And Highest Adaptation, Together". Density gives the support, elasticity gives the instant adaptation, they need each other, and this balance is the strength of latex. The headline is a plain message; "engineering magic" is not used anywhere.
- **Owner-confirmed facts, written exactly as the owner stated them (not hedged, not to be softened):** latex is the most flexible and the most elastic material in nature (proven); Botanic has certification for babies, and it is already on the Certifications page; the latex milk comes from Indonesia; the rest of the production is European and certified.
- Test R52 added; 190 design-rule checks (the new rule runs in all three viewport sets) and the price, selection and sync contracts pass.
- **Germany and Indonesia (owner, 21 Nov):** the mattresses are made in Germany; the latex milk comes from Indonesia, where the rubber tree grows (only in the tropics). Latex Is Bio-Based now says both plainly.
