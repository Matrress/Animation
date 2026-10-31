# Rollback copies of the live category descriptions

Captured **2026-10-10** from the public pages (read through a remote fetch; this sandbox cannot open divinedunlop.com or the Ecwid admin).

| File | What it is | Use |
|---|---|---|
| `mattress-description-visible-text-2026-10-10.txt` | The **visible text** of the Latex Mattresses Collection description, verbatim, in order | Reference: what customers saw |
| `topper-description-visible-text-2026-10-10.txt` | Same for Latex Toppers Collection | Reference |
| `mattress-description-reconstructed.html` | A **reconstruction** of that text as simple HTML (not the original source) | Emergency restore only if the exact source copy below is missing |
| `topper-description-reconstructed.html` | Same for toppers | Emergency restore only |
| `mattress-description-SOURCE.html`, `topper-description-SOURCE.html` | **Empty until Martin fills them** | The exact original HTML: the real rollback copy |

## Before any change in Ecwid (Martin, 2 minutes per category)
1. Ecwid admin → Catalog → Categories → **Latex Mattresses Collection** → Description → press **`<>`** (HTML mode).
2. Select all (Ctrl/Cmd + A), copy, paste into `mattress-description-SOURCE.html` (or send it to me and I will commit it).
3. Same for **Latex Toppers Collection** → `topper-description-SOURCE.html`.
4. Close the editor **without saving**.

The reconstructions keep the words but not the original formatting; the SOURCE copies are the real rollback.
