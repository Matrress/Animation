# The large screen as a guide: a proposed order and structure for the buttons

Status: **proposal for the owner**, built on the preview of what the television does today (`docs/TV-BUTTON-MAP.md`). Nothing here is built. The owner decides; the owner's specification (`docs/TV-BUTTON-SPEC.md`) overrides any line below.

The screen's job is not to hold a picture. It is to help the customer decide, and to give each piece of information in the form that explains it best: a number, a comparison, a drawing, a short loop, plain words, or a mix. **A picture is used only when it answers better than words.** Every button has one reason to exist: it answers one question the customer has at that moment.

## 1. The journey in four phases

Today the television has 14 chapter buttons in two rows, with "Size" hidden inside the chapter "Height". The proposal groups them by what the customer is asking.

| Phase (button) | The customer's question | Today's chapters and panels that belong to it |
|---|---|---|
| **1. See it** | What is this mattress, and is it for me? | Discover: Introduction, At a Glance; the full presentation video |
| **2. Choose yours** | Which size, firmness, depth and cover do I need? | Size (now inside "Height"), Firmness, Height (depth), Covers, and a new **Review** step ("Your Botanic") |
| **3. Why it feels this way** | What makes it comfortable and healthy? | Comfort, Benefits (Origin, Why Latex), Support, Adaptation, 7-Zone, Ventilation, Hygiene |
| **4. Trust it** | Can I rely on it, and when does it come? | Certifications, Warranty, Delivery |

Phase 2 is the heart of the large screen: five steps on a visible rail (Size, Firmness, Depth, Cover, Review), in the order the store's own options come (Size, Depth, Firmness, Covers) adapted to the owner's approved order on the phone (Size, Firmness, Depth, Cover). The steps' own explanations ("Correct vs Softer", "Who it is for", "Why height matters", "Materials") stay with their step as a small **Help me choose** panel, not as separate chapters. Phase 3 is a list of seven topics, each a question the customer can ask.

## 2. The anatomy of every screen (the design structure)

Every screen has the same five parts, so the customer always knows where to look.

| Part | What it is | Example (Firmness) |
|---|---|---|
| **Question** | The headline, as the customer would ask it | "How firm should it be for my body?" |
| **Answer** | The one clear statement, number or drawing that decides it | The four ranges, with the recommended one marked |
| **Proof** | A short loop, a drawing or a fact, only when it explains better than words | The firmness scale, not a photograph |
| **Action** | One primary button | "Choose Medium" |
| **Result** | The change that follows, visible at once | The chip shows "Firmness: Medium"; the store's own control shows the same; the price is Ecwid's |

## 3. What each kind of information uses

| Information | Best form |
|---|---|
| A choice with a few options (firmness, cover) | Cards that each carry the one decisive fact; the recommended card marked |
| Size | Drawn to scale, grouped by bed width; the price from Ecwid beside each |
| Depth | A side view of the three thicknesses |
| Cover | The texture, the feel in one line, the material fact |
| An explanation | A short text with one loop (7 to 10 seconds) that shows it: milk to foam, airflow, durability |
| Proof numbers (certifications, warranty) | Large numerals with one line each |
| The whole mattress | The full presentation video, watchable in full, on demand |

The small loops only orient the customer. They are not enlarged.

## 4. The selection: both directions, mandatory

The screen drives Ecwid's own controls, and Ecwid's own controls drive the screen. Every button that chooses (a card, a chip, a "Change" link on the Review step, a cover tab) sets the matching native control; every change of a native control is shown on the screen at once. Add to Bag stays Ecwid's own button; the Review step ends with a **Go to Add to Bag** button that scrolls to it and never clicks it. The price is always Ecwid's. This holds today and is tested (section 7).

- **Extra Firm is not removed.** In the screen it leads to the specialist model: a card "Extra Firm, Specialist Model: Orthopaedic Coconut Core" that opens the specialist product page only when the customer taps it. The native Ecwid option stays as it is. *Owner to decide:* what should happen if a customer picks Extra Firm in Ecwid's own menu (the proposal: the screen shows the same notice with the link, and changes nothing in Ecwid).
- **Custom size.** A "Need another size?" button on the Size step opens a contact form: the model (filled in), the size the customer wants, and an email address for the reply. It goes to `support@divinedunlop.com`. The native entry "For More Options CONTACT US" in Ecwid's Size menu is not shown by the screen.
- **Firmness numbers.** Today the screen and the store disagree (section 5). One source must be the truth.

## 5. Decisions the proposal needs from the owner

1. **The order of the steps on the large screen** (proposed: Size, Firmness, Depth, Cover, Review, as on the phone and in the store).
2. **The firmness ranges.** The screen: Soft 0 to 48 kg, Medium 49 to 83, Firm 83 to 114, Extra Firm 115 and over. Ecwid's labels: up to 47, 48 to 85, 85 to 110, over 120 (nothing for 110 to 120 kg). Which is the truth? (An Ecwid label can only be changed by the owner in Ecwid Admin.)
3. **Extra Firm picked in Ecwid's own menu**, as above.
4. **The four phases and their names** (the proposal names are questions; the owner may prefer plain words).
5. **Pictures and diagrams** the owner wants for each step, and which screens need none.
6. **Where the "Help me choose" explanations** sit for Size and Cover, which have none today.

## 6. What building this needs (honest)

| Work | Size | Note |
|---|---|---|
| Regroup the 14 chapters into four phases | Mostly configuration (`products/botanic.config.js`) | The engine is shared with other models; the journey becomes a template each model fills in |
| The Review step and "Go to Add to Bag" | One new screen type | Must not click Add to Bag |
| Extra Firm as a link to the specialist model | Small | Only on a tap; never from a slider |
| The custom-size contact form | A form and a way to send it to `support@divinedunlop.com` | A static page cannot send email by itself: it needs a form service or a small server function; the address is kept in that configuration. To be proposed when the form is designed |
| Fix the two open targets from the guardrails | Small to medium | Videos wait until needed; space is reserved for the television on a portrait tablet |
| A new look for the screens (turquoise graphite family, the button system) | Medium | Follows `docs/mobile/premium/T1-TOKEN-CONSOLIDATION.md` |

## 7. Evidence that exists today

- **Selection sync contract, simulated store** (`tests/sync-contract.mjs`): screen to Ecwid and Ecwid to screen for all four options, the price identical every time, one change event per choice (no loop), clearing clears, a rapid mixed sequence ends the same on both sides, and Add to Bag adds the four choices. Passes on a desktop monitor and an iPad Pro portrait.
- **The same contract on the real Ecwid DOM** (`tests/live/tv-sync-e2.cjs`, public product, local, read-only): passes, with no cart, checkout or order request and Add to Bag never clicked.
- Not covered yet: the test product (E3, needs the owner's explicit approval) and real devices beyond the owner's iPad Pro.
