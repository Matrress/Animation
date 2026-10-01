# Divine DunlopDreams — homepage hero

| Path | What |
|---|---|
| `INSTALL.md` | **Copy-paste Ecwid installation** (one section), hosting, test and rollback procedure |
| `REPORT.md` | Engineering + design report: changes vs v26, Ecwid architecture, performance, accessibility, code audit, self-review |
| `ecwid/section-1.0.0.html` | The Ecwid section (production host). `-jsdelivr` = staging host; `.min` = whitespace-compact fallback |
| `release/1.0.0/` | Files to host: `hero.css`, `hero.js`, `assets/` |
| `src/` | Readable sources (`hero.css`, `hero.js`, `section.html` template) |
| `variants/` | Optional design variants A "Tone" and B "Large display" (not loaded by default) |
| `reports/compare/` | Screenshot matrix: v26 vs 1.0.0 at 19 device configurations, lockup close-ups, variants |
| `reports/matrix/*/metrics.json` | Raw geometry per viewport |
| `reference/` | Approved v26 files, unmodified, plus extracted assets and test harnesses |
| `tests/` | Build, screenshot matrix, pixel lockup scan, interaction (127 checks), perf, axe, guards |
| `hosting/_headers` | Cache/CORS headers for Cloudflare Pages or Netlify |
