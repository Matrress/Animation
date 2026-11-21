# E3 procedure for the mobile layer on the test product 876405767

Status: **prepared, not executed.** Nothing in this document authorises a deployment or a change to product 876405767 or to the live store. The owner's explicit approval of the steps below is required first. The authorised test product is **876405767 only**; the live product 831592302 stays untouched.

This extends `docs/DEPLOYMENT.md` (steps 0 to 9, which cover the television embed). It adds what is specific to the phone layer: the guided configurator, the Ecwid synchronisation adapter and the loader gate.

## 1. What E3 has to prove

E2 (done, read-only, on the public product 831592302) proved that the adapter finds the four option blocks, sets and reads them, follows the price, and survives the duplicate product pages of a slow phone. E3 repeats this on the real test product, where the option structure, the order and the labels may differ. It proves **nothing about the live product** and does not replace E4 (real devices).

## 2. Preconditions (all must be true before anything is done)

| # | Precondition | Who |
|---|---|---|
| 1 | The owner approves this procedure in writing, with the date of the test window. | Owner |
| 2 | A backup of the test product's description and options (DEPLOYMENT.md step 0). | Owner |
| 3 | The phone layer exists as one built file (not yet made): `botanic-phone.js` = firmness core + sync adapter + configurator + `design-tokens.css` + `description.css`, with a measured size. | Claude, on approval |
| 4 | The loader contains the product guard: the product list holds **876405767 only**, and the loader does nothing on any other product. | Claude, on approval |
| 5 | Product 876405767 is reachable: it is disabled and not public, so either the admin preview is used, or the owner enables it for the test window. Enabling is the owner's store change, not ours. | Owner |
| 6 | The loader is placed (DEPLOYMENT.md step 4, option A or B). | Owner |

## 3. Read-only pre-flight (no approval needed, nothing changes)

Already done on the public product: option titles and order (SIZE, Depth, FIRMNESS BY BODY WEIGHT, COVERS), independent options, price follows a choice after about 0.7 s, duplicate product pages on a slow profile. Re-run after step 5 of the preconditions on the test product: the four option titles and their choices, in the browser console. Only reading.

## 4. Checks on the test product (after approval)

| Id | Check | Expected |
|---|---|---|
| M1 | The four option blocks are found by title role (size, depth, firmness, cover) | `DDSync.ready()` true; four roles mapped |
| M2 | Setting each option through the adapter | The native dropdown shows the same choice; `change` fired once; verified by read-back |
| M3 | Price | The configurator shows the store's own price; it is never calculated by us; identical after every choice |
| M4 | Starting price | Shown only while size alone is chosen; equals the store's price with the 20 cm base |
| M5 | Choosing in the store's own menus | The configurator follows ("Use Ecwid's own menus instead") |
| M6 | Extra Firm card | A plain link to the specialist product page; tapping opens it; sliders never navigate; nothing is written to Ecwid |
| M7 | Network | No request to the cart, checkout or order endpoints at any time; catalogue reads only |
| M8 | Duplicate product pages (throttled phone profile) | One configurator; the active product page is the one that is driven |
| M9 | Loader gate | A phone requests the phone layer only; a tablet or desktop requests the television bundle only; real requests, not stubs |
| M10 | `?ddtv=off` | No configurator and no television; the original description |
| M11 | Live product 831592302 | No configurator, no television, no change at all |
| M12 | Performance | Transfer size, time to interactive and long tasks of the phone layer, throttled profile, before and after, three runs each |

**Add to Bag.** The assistant never clicks Add to Bag. If the owner wants it checked (DEPLOYMENT.md step 7), the owner does it on the test product only.

## 5. Evidence

Each check is recorded with its result, the profile (device class, engine, throttling), the date and the evidence level in `docs/TEST-MATRIX.md`. A result is never reported as E3 unless it was observed on product 876405767.

## 6. Rollback

- For a visitor, immediately: add `?ddtv=off` to the address.
- For the store: remove the loader (the owner's step), and restore the description from the backup.
- Nothing in this procedure changes the cart, the checkout or the live product, so there is nothing to undo there.

## 7. Approvals needed from the owner

1. The test window and the written approval of this procedure.
2. How the test product is made reachable (admin preview, or enabled for the window).
3. Where the loader goes (DEPLOYMENT.md step 4).
4. Whether Add to Bag is to be tested by the owner on the test product.
