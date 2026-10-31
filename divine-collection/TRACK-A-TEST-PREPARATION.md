# Track A Isolation Test — Preparation Document

**Date:** 31 October 2026
**Status:** PREPARED — NOT DEPLOYED
**Store:** Divine DunlopDreams (Ecwid store 100333285)

---

## Background

The regression investigation identified `ddc.js` (the Collection floating-card
script) as the prime suspect for mobile browser crashes. The script attaches a
**document-wide `MutationObserver`** on `document.documentElement` (every
mutation in the entire DOM, on every page) even though its functionality is
only needed on the two Collection category pages.

This test isolates the observer's contribution by comparing two configurations
against the current live behaviour on a real iPhone.

---

## Config A — Script Disabled (baseline)

### What changes
The `ddc.js` loader snippet is **removed** from Ecwid's site-wide custom code.
No script loads; no CSS loads; no observer runs.

### What the user sees
- **Collection pages:** The floating preview card and decision navigator overlay
  are gone. Every mattress tile is still a real `<a>` link to its model page —
  the HTML fallback works without JavaScript. The visual grid, all links, and
  navigation remain intact.
- **All other pages:** Completely unchanged. Product pages, cart, checkout,
  homepage animations — none of these depend on `ddc.js`.

### Installation steps

1. **Ecwid admin → Settings → General → Site-wide custom code** (or the
   storefront builder's "Custom Code" tile).
2. In the **HEAD** section, locate the current loader snippet:

   ```html
   <!-- Divine DunlopDreams Collection 3.13.2 loader … -->
   <script>(function(d,b){if(window.__ddcLoader)return;…})(document,'https://cdn.jsdelivr.net/gh/Matrress/Animation@f4d9318a14f32ede544936f332f3ff4e5e800768/divine-collection/release/3.13.2/');</script>
   ```

3. **Delete the entire snippet** (both the comment line and the `<script>` line).
4. Save.

### Rollback

Paste the original loader back into the same HEAD field:

```html
<!-- Divine DunlopDreams Collection 3.13.2 loader (site-wide custom code). Styles + script for the .ddc category descriptions only. -->
<script>(function(d,b){if(window.__ddcLoader)return;window.__ddcLoader=1;var h=d.documentElement,off=function(){h.classList.remove('ddc-js')};h.classList.add('ddc-js');var l=d.createElement('link');l.rel='stylesheet';l.href=b+'ddc.css';l.onerror=off;d.head.appendChild(l);var s=d.createElement('script');s.src=b+'ddc.js';s.defer=true;s.onerror=off;d.head.appendChild(s);setTimeout(function(){if(!window.DDC)off()},8000)})(document,'https://cdn.jsdelivr.net/gh/Matrress/Animation@f4d9318a14f32ede544936f332f3ff4e5e800768/divine-collection/release/3.13.2/');</script>
```

Save. The floating card and navigator return immediately on next page load.

---

## Config B — Conditional Observer

### What changes
A minimally modified `ddc.js` that keeps all Collection functionality intact but
**only attaches the MutationObserver on pages that actually contain `.ddc`
elements** (the Collection category pages). Non-collection pages (homepage,
product pages, cart, checkout) get zero ongoing DOM observation.

### Exact code difference

The full diff is in `src/ddc-configB.js`. The substantive change is in the
bootstrap section at the bottom of the IIFE:

**Original (`src/ddc.js`, lines 156–163):**

```javascript
window.DDC = { version: VERSION, scan: scan };
if (window.MutationObserver) new MutationObserver(soon).observe(
    document.documentElement, { childList: true, subtree: true });
function hook() {
  if (window.Ecwid && window.Ecwid.OnPageLoaded &&
      window.Ecwid.OnPageLoaded.add) {
    window.Ecwid.OnPageLoaded.add(function () { soon(); });
    return true;
  }
  return false;
}
if (!hook()) { var tries = 0, t = setInterval(function () {
  if (hook() || ++tries > 60) clearInterval(t); }, 500); }
if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', scan);
else scan();
```

**Config B (`src/ddc-configB.js`, lines 159–188):**

```javascript
var observerAttached = false;
function attachObserver() {
  if (observerAttached) return;
  if (window.MutationObserver) {
    new MutationObserver(soon).observe(
        document.documentElement, { childList: true, subtree: true });
    observerAttached = true;
  }
}
function scanAndMaybeObserve() {
  scan();
  if (document.querySelector('.ddc')) attachObserver();
}

window.DDC = { version: VERSION, scan: scan };
function hook() {
  if (window.Ecwid && window.Ecwid.OnPageLoaded &&
      window.Ecwid.OnPageLoaded.add) {
    window.Ecwid.OnPageLoaded.add(function () {
      scanAndMaybeObserve();
    });
    return true;
  }
  return false;
}
if (!hook()) { var tries = 0, t = setInterval(function () {
  if (hook() || ++tries > 60) clearInterval(t); }, 500); }
if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', scanAndMaybeObserve);
else scanAndMaybeObserve();
```

### Key behavioural guarantees

| Page type | Original | Config B |
|-----------|----------|----------|
| Collection categories (`.ddc` present) | Observer ✓, floating card ✓, navigator ✓ | Observer ✓, floating card ✓, navigator ✓ |
| Homepage | Observer running (wasted) | **No observer** |
| Product pages | Observer running (wasted) | **No observer** |
| Cart / Checkout | Observer running (wasted) | **No observer** |

- The version string is `3.13.2-configB` — visible in `window.DDC.version` and
  in the `data-ddc` attribute on initialised Collection roots.
- The `observerAttached` flag prevents duplicate observers across SPA navigations.
- `Ecwid.OnPageLoaded` still fires on every SPA navigation and re-checks whether
  `.ddc` elements have appeared, attaching the observer at that point if needed.

### Files produced (not yet deployed)

| File | Purpose |
|------|---------|
| `src/ddc-configB.js` | Readable, annotated source (189 lines) |
| `release/3.13.2-configB/ddc.js` | Built release: DDCNav line 1 + minified Config B line 2 (22 122 bytes, 2 lines) |
| `release/3.13.2-configB/ddc.css` | Unchanged copy of the original CSS (81 973 bytes) |
| `ecwid/loader-3.13.2-configB.html` | Loader snippet (HTML) — `__COMMIT_SHA__` placeholder |
| `ecwid/loader-3.13.2-configB.js` | Loader snippet (JS only) — `__COMMIT_SHA__` placeholder |

### Installation steps (when approved)

1. **Push the Config B files to GitHub** on the `claude/divine-collection`
   branch. Note the resulting commit SHA.
2. **Copy the loader from `ecwid/loader-3.13.2-configB.html`** (already pinned
   to commit `08088112777cbf09aa9bf7dad1386cb474bd5eae`):

   ```html
   <!-- Divine DunlopDreams Collection 3.13.2-configB loader (Track A isolation test — conditional observer). -->
   <script>(function(d,b){if(window.__ddcLoader)return;window.__ddcLoader=1;var h=d.documentElement,off=function(){h.classList.remove('ddc-js')};h.classList.add('ddc-js');var l=d.createElement('link');l.rel='stylesheet';l.href=b+'ddc.css';l.onerror=off;d.head.appendChild(l);var s=d.createElement('script');s.src=b+'ddc.js';s.defer=true;s.onerror=off;d.head.appendChild(s);setTimeout(function(){if(!window.DDC)off()},8000)})(document,'https://cdn.jsdelivr.net/gh/Matrress/Animation@08088112777cbf09aa9bf7dad1386cb474bd5eae/divine-collection/release/3.13.2-configB/');</script>
   ```

3. **Ecwid admin → Settings → General → Site-wide custom code → HEAD section.**
4. **Replace** the existing 3.13.2 loader snippet with the Config B loader above.
5. Save.

### Rollback

Replace the Config B loader with the original 3.13.2 loader (same as Config A
rollback — paste the original snippet back and save).

---

## Testing Protocol

### Device
Real iPhone (iOS 17+), Safari and Chrome.

### Test matrix

For each configuration (A, then B), test every page type and note:
- Whether the page loads without crashing
- Whether the Ecwid storefront initialises (products visible, cart working)
- Memory pressure (Settings → Developer → Web Inspector if available)
- Whether the crash/"A problem repeatedly occurred" message appears

| Test | Page | Expected: Config A | Expected: Config B |
|------|------|--------------------|---------------------|
| 1 | Homepage | Loads, no crash, no DDC code running | Loads, no crash, DDC loaded but no observer |
| 2 | Mattress Collection | Loads, all tiles are links, **no** floating card | Loads, floating card works, navigator works |
| 3 | Pillow Collection | Loads, all tiles are links, **no** floating card | Loads, floating card works |
| 4 | Any product page | Loads normally | Loads normally, no observer |
| 5 | Cart | Works | Works |
| 6 | Checkout | Works | Works |
| 7 | Navigate homepage → collection → product → back (repeat 3×) | No crash at any step | No crash at any step |

### Rapid-navigation stress test

On each configuration, perform this sequence on Safari and Chrome:
1. Open the homepage
2. Tap into the Mattress Collection
3. Tap a product
4. Go back to the Collection
5. Tap a different product
6. Go back to the homepage
7. Repeat steps 2–6 three more times without pausing

Record whether the page crashes, reloads, or shows the "A problem repeatedly
occurred" banner at any point.

### Version verification

On any page, open the browser console (Web Inspector) and run:

```javascript
window.DDC && window.DDC.version
```

| Config | Expected |
|--------|----------|
| A (disabled) | `undefined` (DDC not loaded) |
| B (conditional) | `"3.13.2-configB"` |
| Production (current) | `"3.13.2"` |

---

## Files Not Modified

The following are explicitly unchanged and verified:

- The 11 product descriptions, their videos, and the homepage animations
- `ddc.css` (identical copy in Config B release)
- DDCNav (Line 1 of the release build — byte-identical)
- Ecwid product options, prices, variants, cart, checkout, SEO settings
- All other custom components: hero 1.20.8, dz7 2.7.0, dpl 0.13.6,
  intro 0.4.1-dev, dhd 0.7.4, front 0.3.0

---

## Separate Investigation: Intermittent Origin Timeouts

During the regression audit, 2 out of 10 requests to the pillow collection page
timed out at 20 seconds (0 bytes received). Additionally, `www.divinedunlop.com`
returns HTTP 403 Forbidden. These are **separate from the JavaScript observer
issue** and will be investigated independently:

- **Timeout pattern:** Sporadic, not correlated with page content. Suggests a
  hosting/CDN/Ecwid-side issue rather than a client-side script problem.
- **www subdomain 403:** The `www` prefix is not configured as an alias. Users
  arriving at `www.divinedunlop.com` get a blank 403 error.
- **Recommended:** Check Ecwid's hosting dashboard for any rate-limiting,
  geographic restrictions, or SSL/domain configuration issues. The `www`
  subdomain needs either a redirect to the bare domain or proper DNS/hosting
  configuration.

---

## Summary of Deliverables

| Item | Location | Status |
|------|----------|--------|
| Config B source | `src/ddc-configB.js` | ✅ Ready |
| Config B release build | `release/3.13.2-configB/ddc.js` | ✅ Ready |
| Config B CSS (unchanged) | `release/3.13.2-configB/ddc.css` | ✅ Ready |
| Config B loader (HTML) | `ecwid/loader-3.13.2-configB.html` | ✅ Ready (pinned to `0808811`) |
| Config B loader (JS) | `ecwid/loader-3.13.2-configB.js` | ✅ Ready (pinned to `0808811`) |
| Config A instructions | This document | ✅ Ready |
| Config B diff | This document + `diff -u src/ddc.js src/ddc-configB.js` | ✅ Ready |
| Testing protocol | This document | ✅ Ready |
| Rollback instructions | This document | ✅ Ready |
| Deployment | — | ⏸ Awaiting approval |
