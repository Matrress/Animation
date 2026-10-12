# BioDunlop intro – Google visibility and performance

## What Google can rely on

Google does not read the story from video frames. It comes from the page text:

* **Unchanged:** the hero's single H1 ("Divine DunlopDreams – 100% Natural Latex Mattresses, Toppers & Pillows. Engineering Natural Latex Sleep System"), its screen-reader lines ("European production, certified for UK & EU. Dual Plush mattress and topper system."), the point labels and both Shop links (same URLs).
* **Added, one sentence, real HTML:** `From natural latex milk to a complete natural latex sleep system.` (`.ddb-line`). It is visible during the intro and stays in the DOM afterwards (visually hidden, like the hero's existing `.ddh__sr` lines). No hidden keyword paragraphs.
* **The film has no burned-in text.** The supplied videos' caption "Natural Origin & Natural Sleep System" was cropped away.
* **Stable URLs:** after integration, the film and poster have versioned, cacheable jsDelivr URLs pinned to a commit, for example `…/Animation@<sha>/divine-biodunlop-intro/release/0.1.0-dev/assets/ddb-intro-1280.mp4` and `…/ddb-poster-1280.webp`. jsDelivr serves `robots.txt` with `Allow: /`, so it does not block them. Check this again at release time.

## VideoObject structured data: honest status

`seo/videoobject.draft.json` is a **draft. It is not inserted into the candidate section.** Three things are still missing:
1. **The final film.** Publishing data for a prototype would describe the wrong video.
2. **`uploadDate`.** It must be the real date the final file goes live.
3. **The homepage is not a video watch page.** Google mainly shows video results for pages where the video is the main content. A decorative, muted, 8-second opening without controls on a shop homepage is unlikely to get a video result. Structured data does not change that and never guarantees one.

**Recommendation (no thin page).** Publish the full, longer origin film (tree → latex milk → Dunlop foam → mattress) on a real content page that already deserves to exist, for example "Our natural latex: from tree to sleep system", "Quality & Benefits" or a journal article. That page gets a visible player with controls, a transcript-style description and the VideoObject with real values. The homepage keeps the short intro and links to that page in its normal content. Do not create a page only to collect a video result.

## Google Search Console checklist (final release)

- [ ] URL Inspection → *Test live URL* on the homepage. Rendered HTML contains the H1 once, `.ddb-line` and both Shop links. The screenshot shows either the hero or the poster, never an empty block.
- [ ] Rendered page resources: intro.css, intro.js, film and poster load with 200, none "blocked by robots.txt".
- [ ] The film URL opens directly in a browser (crawlable) and the poster URL returns an image.
- [ ] Rich Results Test / Schema validator on the page that carries the VideoObject (watch page): no errors, `thumbnailUrl` and `contentUrl` reachable.
- [ ] Mobile: Lighthouse mobile run. The intro never runs on phones, so mobile CWV must equal 1.20.2's.
- [ ] Core Web Vitals report (field data) 28 days after release: LCP, CLS and INP for desktop compared with the weeks before.
- [ ] Page indexing: homepage "Indexed", canonical unchanged.
- [ ] Video indexing report (only for the watch page): status and reason if not indexed.

## Performance strategy

| Concern | What the intro does |
|---|---|
| Phones (most traffic, slower networks) | Never runs, never downloads film or poster (gate + CSS-only poster) |
| LCP | The hero picture keeps `fetchpriority="high"`. The stage, poster and video have the same box as the hero picture, so they never become a *larger* LCP candidate. The poster is 30–50 KB. |
| CLS | The stage is absolutely positioned inside the existing plane: 0 layout shift (tested) |
| INP / main thread | Two small listeners, no per-frame JS (the story line uses `timeupdate`, about 4 per second), no framework, no third-party player |
| Bandwidth | One film per visit: 1280 (MP4 1.25 MB / WebM 0.83 MB) when the stage is wider than 1100 device pixels, otherwise 960 (MP4 0.63 MB / WebM 0.51 MB). `preload=auto` only after the gate said yes. No audio track. Once per session. |
| Slow or failing network | Data Saver or 2G/3G (where the browser reports it) → no intro. Video error → hero at once. No first frame within 4 s → hero. |
| Caching | Versioned, immutable URLs (jsDelivr pinned commit) |
| Formats | H.264 MP4 first (Chrome, Safari, Edge, Firefox play it); VP9 WebM second, only for browsers without H.264 (e.g. Chromium builds without proprietary codecs). The browser downloads exactly one. AV1 skipped: not universal on Safari. |

## Measured locally (Chromium, preview server)

Measured values are in the final report and `tests/intro.mjs` output: CLS during the whole intro, LCP entries, file sizes.
