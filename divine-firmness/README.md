# Divine DunlopDreams · Firmness Navigator · Fine-Tuning page

Preview build 0.4.0 (concept 4, contour scene). Not live.

## What is here

- `release/0.4.0-preview/` holds the seven Instant Site custom-code sections for divinedunlop.com/firmnesses, in page order. Each section is given once and stays under 20 KB.
  1. Module design (CSS)
  2. Scene design (CSS)
  3. Intro and the contour scene (markup)
  4. The navigator: questions, result, contact form (markup)
  5. The firmness engine (unchanged rules, `window.DDFT_API`)
  6. Navigator behaviour (JS), sends `ddn:state`
  7. Scene behaviour (JS), listens to `ddn:state`
- `assets/` holds the model photo shown at point 8 (jsDelivr, commit `33b9eb8`) and the greyscale latex foam texture recoloured per regulation (commit `be4159b`).
- `src/` holds the readable sources and `build.py`, which minifies them into the seven sections.
- `preview/concept4.html` is the self-contained preview with the photo inlined.

## Rules the scene keeps

- The firmness comes only from the engine. The scene never computes a regulation.
- Loops (foam, equaliser, glowing points) run only while the scene is on screen and stop under reduced motion.
- The cards below keep their Pantone greys. Only their edges follow the colour of the scene.
