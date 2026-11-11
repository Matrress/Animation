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
| Each button will be specified later by the owner | The preview is a design carrier; every label here is replaceable through `docs/TV-BUTTON-SPEC.md` |

## What the preview is not

- **Not connected to Ecwid.** The price in "Your selection" is a stand-in, computed here only so the layout can be judged (90 per cent of the label modifiers, as Ecwid showed on 11 November 2026). In the shop the price is Ecwid's own and the screen never computes one.
- **Go to Add to Bag** never adds anything. In the shop it scrolls to Ecwid's own button.
- The two-way sync (screen to Ecwid and Ecwid to screen) is proved separately, on the current television, by `tests/sync-contract.mjs` (simulated store) and `tests/live/tv-sync-e2.cjs` (real Ecwid page, read-only). The new screens must pass the same two tests before they replace the old ones.
- Fonts and cover photographs load from the web; the pictures in this folder were taken offline, so the cover cards show a dark placeholder.

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
