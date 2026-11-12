# T1: design token consolidation (technical refactoring, appearance unchanged)

Date: 11 November 2026. Scope approved by the owner: consolidate the design tokens and remove redundant CSS overrides of the Graphite preview, **without changing** the approved appearance, colours, typography, layout, interactions or functionality. The engine and the Ecwid integrations are not touched.

## Result in one table

| | Before | After |
|---|---|---|
| Description colour layers | 3 files (`description-light`, `-turquoise`, `-hybrid`), 3 `<style>` blocks | 1 file, `src/description.css`, 1 `<style>` block |
| Rules / declarations | 130 / 502 | 78 / 237 |
| `!important` | 126 | 71 |
| Colour literals in rules (`#rrggbb`, `rgba(...)`) | 245 | **0** (28 colour tokens, 6 transparent-colour tokens, 10 gradient and shadow tokens in `src/design-tokens.css`) |
| Size of the description colour layer | 20,196 bytes (4,583 gzip) | 14,005 bytes including the token file (3,644 gzip) |
| Whole preview page | 253,142 bytes (58,749 gzip) | 246,653 bytes (57,893 gzip) |
| Where a colour is changed | In up to 3 files, in several rules | In `src/design-tokens.css`, once |

The three earlier layers are kept unchanged in `src/archive/`, because the earlier directions C, D and E are still built from them.

## Method

`tools/t1-consolidate.mjs`, in this order:
1. **Parse** the three layers into one declaration per selector and property, in cascade order.
2. **Exact duplicates** (154): when the same selector sets the same property again later, the earlier declaration can never apply, so it is dropped.
3. **Measured removal** (111): each remaining declaration is tentatively removed and the page is measured again. The declaration stays removed only if nothing differs: the computed values of ~140 properties of every element and of its `::before` and `::after`, every box, in two states (accordions as they are, and all open), plus `:hover`, `:focus` and `:active` forced on every interactive element. A declaration whose removal changes anything is put back.
4. **Kept without testing** (45): 11 declarations in `:hover` style selectors and 34 whose selector matches nothing on this page (they belong to the system, for other models). They are not removed.
5. **Tokens**: every colour, every repeated gradient and every repeated shadow becomes a named custom property; the rules use `var(--dd-...)`.

## Evidence (all run on the approved page `graphite.html` as it was before T1, taken from git)

| Check | Result |
|---|---|
| Computed style, generated content and box of **every element** (1,254, hidden ones included), two states, at 360, 390 and 430 px (`tools/t1-snapshot.mjs diff`) | **0 differences** |
| `:hover`, `:focus` and `:active` on **55 interactive elements** (`tools/t1-hover-check.mjs`) | **0 differences** |
| Screenshots pixel by pixel: configurator steps (30), firmness steps (9), the whole description (9) (`tools/t1-compare-shots.py`) | **48 of 48 identical** |
| Preview checks (`tools/graphite-full-test.mjs`) | **62 of 62 pass** |
| Engine tests (`smoke`, `gallery`, `loader-gate`, `model-reuse`, `embed`) | all pass, unchanged |
| Files changed in `engine/`, `schema/`, `products/`, `tests/`, the Ecwid sync adapter and the configurator logic | **none** |
| Archived directions C, D, E (`graphite-light`, `-turquoise`, `-gradient`) against their earlier versions | identical |

Before and after, side by side, with the difference amplified eight times: `shots/t1/before-after.jpg` (black means no difference).

## What the checks found on the way

The regression tools did their job three times before the result above:
1. **Empty gradients.** The first token file left out colours that occur only inside gradients; the element-by-element comparison showed 59 elements without their gradient. Fixed in the tool.
2. **A needed declaration measured as redundant.** On a static page the rule that keeps the secondary button transparent on hover looked redundant, but it is the one that beats the `:hover` rule. Only the forced-state probe saw it. Six declarations were put back. The probe is now part of the measurement.
3. **A property the first list did not read.** The pixel comparison found the heading leaf rotated about another point (`transform-origin`), 230 pixels in six places. The list of measured properties was widened to ~140, and the removed declarations were measured again; five more were put back.

## Limits

- The measurement covers this page: the Botanic description at 360, 390 and 430 px, in the two accordion states and the three interactive states. It does not cover other widths or other models' descriptions. The 34 declarations kept because their selector matches nothing here are the safeguard for those.
- `src/design-tokens.css` was created by the tool and is now maintained by hand. `src/description.css` is the generated, verified layer; edit values in the token file, and run the three checks above after any change.
- Not covered by T1: the original description's own stylesheet (it comes from the source page), `premium.css` and `content.css` (shared with the three earlier concepts).

## Re-running

```
NODE_PATH=$(npm root -g) node tools/build-premium-preview.mjs
NODE_PATH=$(npm root -g) node tools/t1-snapshot.mjs diff <approved-before.html> docs/mobile/premium/preview/graphite.html
NODE_PATH=$(npm root -g) node tools/t1-hover-check.mjs <approved-before.html> docs/mobile/premium/preview/graphite.html
python3 tools/t1-compare-shots.py <before-shots> <after-shots>
```

Data: `docs/mobile/premium/data/t1-consolidation.json`.
