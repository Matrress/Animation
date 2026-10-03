# Atelier hero — concept 0.1.0

A second homepage-hero direction for divinedunlop.com, built next to the 1.9.4 hero (which stays untouched).

**Idea:** quiet-luxury editorial layout. Serif headline on the left, one large photographic stage on the right that walks
through the product (Sleep System → Inside → Dual Plush → Zoned Core), and a firmness finder by body weight under the CTAs.

| File | What |
|---|---|
| `src/section.html` | Section template (`{{BASE}}` = asset base URL) |
| `hero.css`, `hero.js` | Scoped under `.dda` (no clash with the `.ddh` hero) |
| `assets/` | Scene photos (webp 900/full) and self-hosted Cormorant Garamond (SIL OFL), no Google Fonts request |
| `build.mjs` | `node concepts/atelier/build.mjs <commit>` → `ecwid/atelier-0.1.0-jsdelivr.html` + `preview/sim-atelier.html` |

**Before going live, confirm:**
- Weight thresholds in the finder (`< 60`, `60–85`, `85–110`, `110+ kg` → Soft / Medium / Firm / Extra Firm) are placeholders.
- The finder links to the mattress collection; point each firmness at its own product/filter URL if one exists.
- Scene captions only use claims already on the current hero (100% natural latex, UK & EU certified, Dual Plush, all sizes).

Install exactly like the 1.9.4 section (INSTALL.md §4): one *Embed & Custom Code* section at the top of the page, test page first.
Paste size ≈ 6.8k characters.
