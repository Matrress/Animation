# Indexing and performance guardrails

Status: **standing rules**, checked automatically by `tests/guardrails.mjs` after every change to the television. The owner's requirement: the work must be smooth for the customer **and** for Google, and it must keep indexing.

## 1. What Google does with this page

- **Mobile-first indexing.** Google indexes the version of the page that a *smartphone* crawler sees. Whatever the phone layer shows and hides is what is indexed.
- **It renders, but it does not click.** Content that exists in the page when it loads is seen; content that appears only after a tap (loaded on click) is not. Accordions that are already in the page are indexed.
- **Hidden text is a risk, not a ban.** Text hidden by CSS stays in the page and is read, but it can count for less. It is never removed by us.
- **No cloaking.** Googlebot must receive the same content as a customer on the same kind of device. Choosing the phone layer or the television by the screen size is allowed; showing Google different text from the customer is not.
- **Structured data comes from Ecwid.** The store generates it. Earlier measurements found its `price` at `0.0` in the page source. That is Ecwid's behaviour and our layer does not touch it; whether it can be corrected is a setting in Ecwid, to be checked by the owner.

## 2. The rules, and the check for each

| Rule | The check | Today |
|---|---|---|
| **G1** The text of the description is never removed or changed in the page | The television's page and the store's own page (`?ddtv=off`) have identical description text: 31,314 characters | Pass |
| **G2** Every link of the description keeps its real address | All 29 links identical, none `javascript:` | Pass |
| **G3** Structured data (JSON-LD) is never touched | Same block before and after the television starts | Pass |
| **G4** Media is not requested before it is needed | The number of video requests at load, and of videos that preload fully | **Ratchet:** 8 requests, 2 with `preload="auto"`. **Target open**, see section 3 |
| **G5** No layout shift caused by our layer | Cumulative Layout Shift on load | Desktop and landscape tablet 0.000. **Portrait tablet 0.60 and 0.53: target open**, see section 3 |
| **G6** No page errors, no failed requests to our own files | Counted in every profile | Pass |
| **G7** `?ddtv=off` leaves the store's page as delivered | No television element | Pass |
| **G8** The layout depends on capabilities, never on the browser's name | Four browser names on the same screen give the identical result | Pass |

A *ratchet* means: today's state may not get worse, and a target is written next to it. The check fails if the state gets worse; it does not hide the target.

What the checks are, and are not: they run on a simulated store page in Chromium. They prove our code keeps the rules. They are not a Google rendering, not a Lighthouse score and not a real device.

## 3. The two open targets (found by the checks, not caused by T1)

1. **Videos are requested at load (G4).** On every large screen the television requests all seven videos, and two of them (the 3.29 MB full presentation and the 0.45 MB opening loop) preload fully. The small videos use `preload="metadata"`. Only the opening loop is needed at the start.
   *Proposed:* the full presentation video gets `preload="none"` and a poster, and plays only when the customer opens it; each small video waits until its chapter is near. This saves up to about 3.3 MB at load (about 70 % of the video bytes), and the short videos keep looping as they do now. The full presentation video still plays in full.
2. **The product block jumps when the television is inserted on a portrait tablet (G5).** The block with the options moves from 92 to 1019 pixels in one step, because the television is 927 pixels tall and is inserted above it. This is a real layout shift (0.60 against a "good" limit of 0.10), and a customer sees it.
   *Proposed:* reserve the television's height before the engine loads, with a few lines of CSS in the loader that run at once (a placeholder with the television's aspect ratio), and let the engine fill it.

Neither change is made yet; both are part of stage T of the plan and need the owner's button specification first.

## 3b. Media (measured)

Total 10.43 MB for all 11 media files; the opening loop is 0.45 MB. All videos are H.264, with `faststart` and `Range` support, and a one-year cache. The small videos are meant to stay as they are (about 7 to 10 seconds, looping, only to orient the customer); each model also has a full presentation video that can be watched in full. See `docs/mobile/MEDIA-DIAGNOSTICS.md`.

## 4. Budgets (proposed, for the owner to confirm)

| What | Budget |
|---|---|
| Cumulative Layout Shift | below 0.1 on every device class |
| Interaction to Next Paint | below 200 ms for every button of the television |
| Largest Contentful Paint | not worse than the store's own page (it is an Ecwid gallery image; we do not slow it) |
| Our script at load | the television's bundle is 284 KB (71 KB gzip) today; it may not grow without a measured reason |
| Video at load | the opening loop only (0.45 MB) |
| Third parties | none added by us |

## 5. What these checks cannot give, and what will

- **Rendered HTML as Google sees it:** Search Console, URL Inspection, on the live URL, after go-live.
- **Field data:** the Chrome UX Report and Search Console's Core Web Vitals, for the real product page.
- **A lab score:** PageSpeed Insights or Lighthouse on the test product, which needs the test product to be reachable and the owner's approval (the E3 procedure).
- **Indexing itself:** the `site:` query and the Pages report in Search Console, a few weeks after go-live. Parameters such as `?ddtv=off` are never linked from the page, so they should not be crawled.

## 6. For every change

Before a change is committed: `node tools/build-embed.mjs`, `NODE_PATH=$(npm root -g) node tests/guardrails.mjs`, the engine tests, and, for the phone preview, the 62 checks. A change that gets any ratchet worse is not merged.
