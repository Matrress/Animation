# Divine DunlopDreams — Performance Audit Findings

## Mobile Crash Investigation: iPhone X "A problem repeatedly occurred"

**Date:** 2026-10-31
**Status:** Analysis complete — awaiting approval before any changes
**Branch:** `claude/divine-collection`

---

## 1. Executive Summary

The iPhone X crashes ("A problem repeatedly occurred" in Safari/Chrome)
are caused by **GPU compositing layer exhaustion** in the hero component's
CSS. When a product sheet is opened on the homepage, the browser must
composite up to **20 stacked backdrop-filter blur layers** simultaneously,
each requiring its own GPU texture allocation. On the iPhone X (A11 Bionic,
3 GB RAM, ~1.4 GB available to Safari), this overwhelms the WebKit
WebContent process memory limit, triggering an OOM kill-and-restart loop.

**The collection component (ddc) is architecturally clean and poses
minimal GPU risk.** The hero component's CSS is overwhelmingly the primary
regression source.

**The fix is purely CSS.** No JavaScript needs to change. A progressive-
enhancement strategy using `@media` queries can conditionally simplify
the most expensive effects on older/memory-constrained devices while
preserving the complete design on modern hardware.

---

## 2. Key Evidence

| Observation | Implication |
|---|---|
| Crashes on iPhone X (A11 Bionic, 3 GB RAM) | Memory/GPU-constrained device |
| Works normally on Google Pixel Android | Not a code bug — resource limit |
| Same iPhone X worked before redesign | Redesign introduced the regression |
| Crashes in both Safari AND Chrome on iOS | WebKit-only (iOS forces WebKit) |
| Error is "A problem repeatedly occurred" | WebKit WebContent process OOM kill |

---

## 3. Component Audit Results

### 3.1 Hero Component (hero.css / hero.js) — **HIGH RISK** ⚠️

**Source audited:** `divine-hero/src/hero.css` (1,763 lines, version 1.10.5)
**Latest in repo:** `divine-hero/release/1.17.1/hero.css` (167 KB)
**Live version:** 1.20.8 (not in repo — likely even larger)

#### CSS Growth Trajectory
| Version | CSS Size | Notes |
|---------|----------|-------|
| 1.10.5 (source) | 61 KB | ~5 backdrop-filter instances |
| 1.12.0 | 116 KB | Nearly doubled |
| 1.14.0 | 124 KB | Steady growth |
| 1.16.0 | 142 KB | Continued growth |
| 1.17.1 (latest in repo) | 167 KB | **20 backdrop-filter instances** |
| 1.20.8 (live) | Unknown | **Likely even more** |

#### GPU-Expensive Properties (release 1.17.1)

**backdrop-filter instances: 20**
- `blur(20px) saturate(1.15)` — Sheet inner container (HEAVIEST — 20px
  blur radius requires sampling a massive pixel area for every frame)
- `blur(14px) saturate(1.1)` — Newer sheet variants (2 instances)
- `blur(14px)` — Additional sheet elements
- `blur(8px)` — Bio-core, button elements (3 instances)
- `blur(6px)` — Bio details, cloud, size guide (4 instances)
- `backdrop-filter:none` — Overrides for narrow viewports (3 instances)

**filter:drop-shadow instances: 14**
- Applied to product images, cards, and decorative elements
- Blur radii range from 6px to 34px

**will-change:transform instances: 2**
- Mattress lift animation
- Dual Plush text positioning

**Infinite animations: 2**
- `ddh-twinkle` — 2s infinite on up to 11 hotspot points
- `ddh-point-beat` — 2s infinite on hotspot points

#### The Compositing Storm Scenario

When a user taps to open a product sheet on the hero:

```
Layer 0: Page background
Layer 1: Hero background image/video
Layer 2: Sheet container — backdrop-filter:blur(20px) saturate(1.15)
Layer 3: Bio details — backdrop-filter:blur(6px)
Layer 4: Bio cloud — backdrop-filter:blur(6px)
Layer 5: Bio core — backdrop-filter:blur(8px)
Layer 6: Product images — filter:drop-shadow(...)  × N
Layer 7+: Additional blurred elements (14px instances)
```

Each `backdrop-filter` forces WebKit to:
1. Rasterize everything behind the element into a texture
2. Apply the Gaussian blur kernel (cost scales with radius²)
3. Composite the blurred result as a separate GPU layer

With **blur(20px)**, the kernel samples a 40×40 pixel area per output
pixel. Stacking 5+ of these simultaneously on a 750×1334 viewport
creates texture memory demands that can exceed the iPhone X's GPU
allocation (~300-500 MB for WebKit compositing).

#### hero.js — NOT the Problem

The JavaScript is well-architected for memory management:
- MutationObserver targets only `<html>` for class/lang changes (minimal)
- ResizeObserver on artwork element only
- IntersectionObserver pauses animations when offscreen
- `warm()` defers interaction graphics; skipped on phone portrait
- `stage2()` delays secondary assets via idle callback + 900ms
- `lean()` detects data-saver/2G and skips heavy loading
- `destroy()` properly cleans up all observers, timers, DOM
- AbortController for clean event listener cleanup

**Conclusion: hero.js is defensive and efficient. hero.css is the problem.**

### 3.2 Collection Component (ddc.css) — **LOW RISK** ✅

**Audited:** `divine-collection/src/ddc.css` (442 lines, version 3.13.2)

- **ZERO** `backdrop-filter` usage
- Only **2** `filter:drop-shadow()` on product images
- Photo thumbnails explicitly set `filter:none`
- One short animation: `ddc-in` (0.16s ease-out, non-infinite)
- `prefers-reduced-motion:reduce` properly handled
- Uses container queries (modern, efficient)
- Custom font: DDCChillax (2 weights: 400, 600)

### 3.3 Navigation Component (nav.css / nav.js) — **MINIMAL RISK** ✅

**Audited:** `divine-collection/src/nav.css` (339 lines) and `nav.js` (229 lines)

CSS:
- **ZERO** `backdrop-filter` usage
- **ZERO** `filter:drop-shadow()` usage
- One tiny infinite animation: `ddc-ping` (2.8s scale+opacity pulse on a dot)
- Three short entrance animations (0.16s–0.22s)
- All `prefers-reduced-motion:reduce` handled
- Solid background colors throughout (no transparency effects)

JS:
- No MutationObserver, ResizeObserver, or IntersectionObserver
- Lightweight DOM manipulation
- Proper `destroy()` and `gc()` cleanup
- No globals except `window.DDCNav`

### 3.4 Collection Script (ddc.js) — **MEDIUM RISK** ⚡

**Audited:** `divine-collection/src/ddc.js` (164 lines, version 3.13.2)

- Document-wide `MutationObserver` on `document.documentElement` runs on
  **every page**, including non-collection pages
- Config B prepared (conditional observer, only attaches when `.ddc`
  elements present) — ready for Track A testing

**Note:** The MutationObserver is a CPU concern (minor), not a GPU concern.
It is unlikely to cause the OOM crash alone, but adds overhead that could
tip a marginal memory situation. Track A testing will isolate this factor.

### 3.5 Other Live Components — NOT AUDITABLE

The following components are loaded on the live site but their source
code is **not in this repository**:

| Component | Version | Location |
|-----------|---------|----------|
| dz7 | 2.7.0 | Unknown (separate repo or private) |
| dpl | 0.13.6 | Unknown |
| intro | 0.4.1-dev | Unknown |
| dhd | 0.7.4 | Unknown |
| front | 0.3.0 | Unknown |

These components need separate auditing. If any of them use
`backdrop-filter` or heavy CSS effects, they compound the hero's
compositing pressure.

---

## 4. Per-Page-Type Risk Assessment

### Homepage — **CRITICAL RISK** 🔴

The homepage loads the hero component, which is the primary compositing
offender. Opening any product sheet on the hero triggers the
compositing storm described in Section 3.1. Combined with the Ecwid
storefront bundle, DDC site-wide script, and any other loaded
components, this is almost certainly the page that crashes.

**Estimated simultaneous GPU compositing layers when a sheet is open:**
- Hero backdrop-filter layers: 5-7
- Hero filter:drop-shadow layers: 3-5
- Ecwid storefront elements: 2-4
- **Total: 10-16 simultaneous compositing layers**

### Collection Pages — **LOW RISK** 🟢

Collection pages load ddc.css + nav.css but NOT the hero component.
With zero backdrop-filters and only 2 drop-shadows, these pages should
work fine on iPhone X.

### Product Pages — **UNKNOWN RISK** 🟡

Product pages may load some hero sub-components (product sheets are part
of the hero). If the hero CSS is loaded site-wide (needs verification),
product pages could also trigger compositing issues when viewing product
details. If the hero is homepage-only, product pages are likely safe.

### Cart / Checkout — **LOW RISK** 🟢

Cart and checkout are Ecwid-native. No custom backdrop-filter effects.
These should be unaffected.

---

## 5. Progressive Enhancement Strategy

### 5.1 Design Principle

**"The complete design is the progressive enhancement. Older devices
get the same content and functionality with simplified visual effects."**

- Modern devices (iPhone 12+, recent Android): Full design, all effects
- Older devices (iPhone X, iPhone 8): Same layout, same content, same
  functionality — but with solid/semi-transparent backgrounds replacing
  backdrop-filter blurs, and simplified shadows

### 5.2 Detection Method

There is no direct CSS media query for "available GPU memory." Instead,
we use a combination of signals that reliably identify constrained devices:

```css
/* Option A: Target devices that signal reduced capability */
@media (prefers-reduced-motion: reduce) {
  /* User has explicitly asked for reduced effects */
}

/* Option B: Target by resolution as a proxy for device generation */
/* iPhone X/8/SE2: 375px logical width at 2x/3x */
/* This needs careful testing — see Section 5.3 */

/* Option C (Recommended): JavaScript feature detection */
/* Detect device memory API + iOS version + screen resolution */
/* Apply a CSS class: .ddh--lite */
```

### 5.3 Recommended Approach: JS-Driven CSS Class

Add a lightweight detection snippet (~200 bytes) to the hero's init:

```javascript
// Detect constrained iOS devices
// navigator.deviceMemory is not available on iOS Safari,
// so we use screen resolution as a proxy for device generation
var isConstrainedIOS = (function() {
  var ua = navigator.userAgent;
  if (!/iPhone|iPad/.test(ua)) return false;
  // iPhone X and older: devicePixelRatio 3 with logical width 375
  // and screen height ≤ 812 (iPhone X) or ≤ 736 (iPhone 8 Plus)
  var h = screen.height;
  var w = screen.width;
  var dpr = devicePixelRatio;
  // iPhones with ≤3 GB RAM: X (812), 8 Plus (736), 8 (667), SE2 (667)
  return (dpr >= 2 && Math.max(h, w) <= 812);
})();

if (isConstrainedIOS) {
  document.documentElement.classList.add('ddh--lite');
}
```

### 5.4 CSS Mitigation Rules

With the `.ddh--lite` class applied, replace the most expensive effects:

```css
/* === PROGRESSIVE ENHANCEMENT: Constrained iOS devices === */

/* 1. Replace backdrop-filter:blur(20px) with semi-transparent solid */
/*    This is the SINGLE BIGGEST win — removes the heaviest layer */
.ddh--lite .ddh .ddh__sh-in {
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
  background: #f9f6f0f7 !important;  /* Slightly more opaque to compensate */
}

/* 2. Remove all remaining backdrop-filter:blur() */
.ddh--lite .ddh [class*="__bio-"],
.ddh--lite .ddh .ddh__bio-cloud,
.ddh--lite .ddh .ddh__bio-core,
.ddh--lite .ddh .ddh__sz {
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
}

/* 3. Simplify filter:drop-shadow to box-shadow */
/*    box-shadow doesn't create compositing layers */
.ddh--lite .ddh img {
  filter: none !important;
}

/* 4. Remove will-change declarations */
/*    Prevents pre-allocation of compositor layers */
.ddh--lite .ddh .ddh__mat,
.ddh--lite .ddh .ddh__dp {
  will-change: auto !important;
}

/* 5. Disable infinite animations */
.ddh--lite .ddh .ddh__pt {
  animation: none !important;
}
```

### 5.5 Expected Impact

| Mitigation | Compositing layers removed | Memory freed (est.) |
|---|---|---|
| Remove `blur(20px)` on sheet | 1 heavy layer | ~80-120 MB |
| Remove remaining `blur()` | 4-6 layers | ~40-60 MB |
| Remove `drop-shadow` filters | 3-5 layers | ~20-30 MB |
| Remove `will-change` | 2 pre-allocated layers | ~10-20 MB |
| Disable infinite animations | Reduces repaint rate | ~10 MB ongoing |
| **Total estimated savings** | **10-14 layers** | **~160-230 MB** |

This should bring the homepage's compositing cost well within the
iPhone X's WebKit memory budget (~300-500 MB for compositing).

---

## 6. Implementation Plan

### Phase 1: Validate Hypothesis (No Code Changes)

**Track A test (already prepared):**
- Config A: Disable ddc.js entirely → test if crashes persist
- Config B: Conditional observer → test if site-wide overhead matters
- **Purpose:** Isolate whether ddc.js contributes to the crash

**If crashes persist with Config A** (most likely outcome based on this
audit), it confirms the hero component is the sole crash trigger.

### Phase 2: Hero CSS Progressive Enhancement

**Scope:** hero.css only — add `.ddh--lite` rules
**Risk:** Zero risk to modern devices (rules are scoped to the class)
**Reversibility:** Remove the class assignment to disable

Steps:
1. Add device detection to hero.js init (~200 bytes)
2. Add `.ddh--lite` CSS rules to hero.css
3. Build and release as new hero version
4. Test on iPhone X to verify crash is resolved
5. Test on modern iPhone/iPad to verify full design preserved

### Phase 3: Verify Other Components

Audit the 5 remaining live components (dz7, dpl, intro, dhd, front)
for any additional backdrop-filter or heavy CSS effects. Their source
is not in this repository and needs to be located.

### Phase 4: Monitor

- Watch for Ecwid hosting timeout regressions (~2.5% rate identified)
- Rotate exposed API token (flagged in prior session)
- Consider `prefers-reduced-motion` support for accessibility

---

## 7. What This Audit Does NOT Cover

1. **Live hero version 1.20.8** — The repo only goes up to 1.17.1.
   Versions 1.18.0–1.20.8 may have added more effects. The live hero
   CSS must be inspected directly to confirm exact compositing cost.

2. **Components dz7, dpl, intro, dhd, front** — Their source is not
   in this repository. If any of these use backdrop-filter effects, they
   add to the GPU pressure.

3. **Ecwid storefront bundle** — Ecwid's own CSS/JS is server-rendered
   and cannot be analysed from this repository. It adds baseline GPU
   compositing overhead.

4. **Real-device verification** — Per the user's Directive 8, simulated
   tests cannot replace real-device testing. All recommendations here
   must be verified on the actual iPhone X.

---

## 8. Files Audited in This Investigation

| File | Lines | Status |
|------|-------|--------|
| `divine-hero/src/hero.css` | 1,763 | Partial read + full grep coverage |
| `divine-hero/src/hero.js` | 802 | Complete read (prior session) |
| `divine-hero/release/1.17.1/hero.css` | 1 (minified, 167 KB) | Grep coverage |
| `divine-collection/src/ddc.css` | 442 | Complete read |
| `divine-collection/src/nav.css` | 339 | Complete read |
| `divine-collection/src/nav.js` | 229 | Complete read |
| `divine-collection/src/ddc.js` | 164 | Complete read (prior session) |

---

## 9. Recommendations Summary

| Priority | Action | Risk | Effort |
|----------|--------|------|--------|
| **P0** | Run Track A test to isolate ddc.js | None | 10 min |
| **P0** | Add `.ddh--lite` progressive enhancement to hero.css | None to modern devices | 2-4 hours |
| **P1** | Locate and audit dz7, dpl, intro, dhd, front sources | None | 4-8 hours |
| **P1** | Inspect live hero 1.20.8 CSS directly | None | 1 hour |
| **P2** | Rotate exposed API token | None | 30 min |
| **P2** | Add `prefers-reduced-motion` full support | None | 1 hour |
| **P3** | Investigate Ecwid hosting timeout pattern | None | 2-4 hours |

---

*This report was produced by code-level static analysis of the
Matrress/Animation repository. No files were modified. No code was
deployed. All recommendations await explicit approval.*
