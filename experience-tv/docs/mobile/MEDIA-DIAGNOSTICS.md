# Media diagnostics (measured)

Date: 2026-11-11. Read-only: the script downloads public files from the media host to a temporary folder and changes nothing on the host or in the store.

## How it was run

```
NODE_USE_ENV_PROXY=1 node tools/media-probe.mjs probe     # sizes, types, range support, cache headers
NODE_USE_ENV_PROXY=1 node tools/media-probe.mjs frames    # codec, bitrate, duration, faststart, candidate poster frames
```

`NODE_USE_ENV_PROXY=1` is needed on Node 22.21 or later, because Node's built-in `fetch` does not read `HTTPS_PROXY` by default. Without it the script reports `ENOTFOUND` in this environment; on the owner's own machine it is not needed. `frames` needs `ffmpeg` and `ffprobe`. No credentials are used.

**What blocked it before.** The first run returned 403. The 403 was not from the media host: this environment's network policy refused the connection (`CONNECT tunnel failed, response 403`), because `media.divinedunlop.com` was not on the allowed-hosts list. The host was added to the personal environment "Animation (Ecwid storefront access)" with the owner's approval; it stays allowed for later sessions and can be removed in the environment's network settings.

## Result

Total of all 11 files: **10.43 MB** (7 videos 10.0 MB, 4 cover textures 0.45 MB). Every file answers 200, supports byte ranges (`accept-ranges: bytes`) and carries `cache-control: max-age=31536000` (one year).

| Video | Codec | Size (px) | Duration | Bitrate | File | Starts before it is fully downloaded (faststart) | Proposed poster frame |
|---|---|---|---|---|---|---|---|
| `botanic-natural-latex-mattress-premium-presentation-loop` | h264 | 910x512 | 12 s | 313 kbit/s | 0.45 MB | yes | `f35.jpg` |
| `botanic-natural-latex-mattress-premium-presentation-full` | h264 | 910x512 | 62.3 s | 442 kbit/s | 3.29 MB | yes | `f05.jpg` |
| `natural-latex-milk-to-foam-origin` | h264 | 910x512 | 21.5 s | 680 kbit/s | 1.74 MB | yes | `f25.jpg` |
| `natural-latex-elasticity-adjustable-bed` | h264 | 910x418 | 12 s | 250 kbit/s | 0.36 MB | yes | `f65.jpg` |
| `natural-latex-7-zone-spinal-alignment` | h264 | 910x512 | 51.8 s | 261 kbit/s | 1.61 MB | yes | `f15.jpg` |
| `natural-latex-airflow-ventilation-channels` | h264 | 910x512 | 12.4 s | 575 kbit/s | 0.85 MB | yes | `f90.jpg` |
| `natural-latex-durability-pressure-test` | h264 | 910x512 | 15.7 s | 909 kbit/s | 1.7 MB | yes | `f80.jpg` |

Cover textures (WebP): natural cotton 0.10 MB, cotton and wool 0.09 MB, aloe vera 0.19 MB, cashmere and silver ions 0.06 MB.

## What this means

1. **The media is light.** The heaviest file is the full presentation video at 3.29 MB; the loop that would open the page is 0.45 MB. Earlier we assumed the media was the main weight on phones. It is not. The weight to control on phones is the script, the styles and the DOM of the Product TV, not the video.
2. **Playback can start early and seek.** All videos have `faststart`, and the host supports range requests, so a phone can play without waiting for the whole file.
3. **Caching is already good.** One-year cache headers mean a returning visitor downloads nothing.
4. **Quality on large screens is the open point.** All videos are 910 × 512 at 250 to 909 kbit/s. That is sharp enough for a phone, but a 27 inch monitor will upscale it. For the large-screen TV screen we should decide whether to keep these files or to add a larger rendition (for example 1280 × 720 or 1920 × 1080) used only on large screens. This is the owner's decision, with the cost: a 1080p rendition of the 62 s presentation video would be several times larger than 3.29 MB.
5. **Poster frames are proposals only.** The script scores sharpness and mid brightness; the owner chooses by eye from `docs/mobile/premium/frames/contact-sheet.html`.

## Limits of this measurement

File sizes and headers only. It does not measure transfer time on a slow connection, decode cost on a real phone or tablet, or how the video behaves in each browser engine. Those remain open (stage T3 and T4 of the finalisation plan).

Data: `docs/mobile/premium/data/media-probe.json`, `docs/mobile/premium/frames/frames.json`, candidate frames in `docs/mobile/premium/frames/`.
