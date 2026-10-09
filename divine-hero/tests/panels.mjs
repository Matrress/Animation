// 1.12.0: where a context card replaces a copy, the card must clear the header and the LATEX lockup and show all of its content.
// 1.5.0/1.5.1: every copy of the shared window (7 originals + 2 panels) in every language at common viewports, inside an Ecwid imitation page.
// Fails if a line overlaps the zones point, slides under the header, touches the LATEX lockup, spills its box,
// comes down into the woman's hair (1.5.1), or (1.6.0) has weak contrast against the photo behind it: the photo and the
// logo plate are composited on a canvas exactly as shown and the darkest 10% of each line's background is compared with
// the line's own ink (WCAG ratio, must be >= MIN_CONTRAST).
// usage: node tests/panels.mjs <sim-url-path>
import { chromium } from 'playwright';
const url = (process.env.BASE || 'http://127.0.0.1:8765/') + (process.argv[2] || 'preview/sim150.html');
const MIN_CONTRAST = +(process.env.MIN_CONTRAST || 4);
const b = await chromium.launch(); let bad = 0, n = 0, worst = 99;
for (const [w, h] of [[667, 375], [844, 390], [1024, 768], [1180, 820], [1280, 720], [1366, 768], [1366, 1024], [1440, 900], [1536, 864], [1920, 1080], [2560, 1440]]) for (const loc of ['en-GB', 'de-DE', 'fi-FI', 'el-GR', 'fr-FR', 'pt-PT', 'es-ES', 'it-IT', 'sv-SE']) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, locale: loc })).newPage();
  await p.goto(url); await p.evaluate(() => document.fonts.ready);
  if (loc !== 'en-GB') await p.waitForFunction(() => document.querySelector('.ddh').getAttribute('data-ddh-lang'), null, { timeout: 4000 }).catch(() => {});
  await p.waitForTimeout(150);
  for (const k of ['shoulder', 'zones', 'head', 'system', 'firmness', 'temperature', 'sizes', 'weight']) {
    n++;
    const r = await p.evaluate(async (k) => {
      const q = (s) => document.querySelector(s).getBoundingClientRect();
      const z = q('[data-ddh-point=zones]'), hdr = document.querySelector('.ins-tile--header'), lk = q('.ddh__sky-lockup');
      document.querySelector(`[data-ddh-point=${k}]`).click();
      await new Promise((ok) => setTimeout(ok, 260)); // lockup fade (opacity .2s)
      for (const im of document.querySelectorAll('.ddh__plate')) { im.loading = 'eager'; try { await im.decode(); } catch (e) {} }
      const card = document.querySelector(`[data-ddh-card=${k}]`); // 1.12.0: on larger screens a context card replaces the short copy
      if (card && getComputedStyle(card).display !== 'none') {
        const c = card.getBoundingClientRect(), hb = hdr ? hdr.getBoundingClientRect().bottom : 0, lb = document.querySelector('.ddh__sky-lockup').getBoundingClientRect().bottom, inn = card.querySelector('.ddh__hc-in') || card;
        return { card: true, contrast: 99, hair: false, zones: false, header: c.top < hb + 4, lockup: c.top < lb + 8, spill: inn.scrollHeight > inn.clientHeight + 1 || card.scrollHeight > card.clientHeight + 1 || c.right > innerWidth || c.bottom > innerHeight, lang: document.querySelector(`[data-ddh-copy=${k}]`).getAttribute('lang') };
      }
      const ls = [...document.querySelectorAll(`[data-ddh-copy=${k}] strong,[data-ddh-copy=${k}] span`)], lines = ls.map((e) => e.getBoundingClientRect());
      const zc = { x: z.x + z.width / 2, y: z.y + z.height / 2 };
      const pl = document.querySelector('.ddh__plane').getBoundingClientRect();
      const HAIR = [[50, 100], [52, 100], [54, 49.7], [56, 49.4], [58, 45.5], [60, 47.8], [62, 42.7], [64, 43], [66, 42.2], [68, 41.8], [70, 41.9], [72, 42.7], [74, 44.4], [76, 100]];
      const hairY = (xp) => { for (let i = 1; i < HAIR.length; i++) if (xp <= HAIR[i][0]) { const [x0, y0] = HAIR[i - 1], [x1, y1] = HAIR[i]; return Math.min(y0, y1) === 100 ? Math.min(y0, y1) : y0 + (y1 - y0) * (xp - x0) / (x1 - x0); } return 100; };
      const hair = lines.some((l) => { for (let t = 0; t <= 1; t += .1) { const xp = (l.left + t * l.width - pl.left) / pl.width * 100; if (l.bottom > pl.top + hairY(xp) / 100 * pl.height - 4) return true; } return false; });
      const lin = (v) => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
      const lum = (r, g, b) => .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);
      const cv = document.createElement('canvas'); cv.width = Math.round(pl.width); cv.height = Math.round(pl.height); const cx = cv.getContext('2d');
      const draw = (im) => { const q = im.getBoundingClientRect(); if (q.width && getComputedStyle(im).display !== 'none' && getComputedStyle(im.closest('.ddh__screen') || im).display !== 'none') cx.drawImage(im, q.left - pl.left, q.top - pl.top, q.width, q.height); };
      draw(document.querySelector('.ddh__img'));
      document.querySelectorAll('.ddh__screen--brand .ddh__plate').forEach(draw);
      let contrast = 99;
      ls.forEach((el, i) => {
        const l = lines[i], x0 = Math.max(0, Math.floor(l.left - pl.left)), y0 = Math.max(0, Math.floor(l.top - pl.top)), w = Math.min(cv.width - x0, Math.ceil(l.width)), h = Math.min(cv.height - y0, Math.ceil(l.height));
        if (w < 2 || h < 2) return;
        const px = cx.getImageData(x0, y0, w, h).data, Ls = [];
        for (let j = 0; j < px.length; j += 4) Ls.push(lum(px[j], px[j + 1], px[j + 2]));
        Ls.sort((a, b2) => a - b2);
        const m = getComputedStyle(el).color.match(/\d+(\.\d+)?/g).map(Number), ink = lum(m[0], m[1], m[2]);
        const bg = Ls[Math.floor(Ls.length * .1)], c = bg > ink ? (bg + .05) / (ink + .05) : (ink + .05) / (bg + .05);
        contrast = Math.min(contrast, c);
      });
      return { contrast: +contrast.toFixed(2), hair, zones: lines.some((l) => zc.x > l.left - 10 && zc.x < l.right + 10 && zc.y > l.top - 10 && zc.y < l.bottom + 10), header: !!hdr && Math.min(...lines.map((l) => l.top)) < hdr.getBoundingClientRect().bottom + 4, lockup: +getComputedStyle(document.querySelector('.ddh__sky-lockup')).opacity > .05 && lines.some((l) => l.right > lk.left && l.left < lk.right && l.bottom > lk.top && l.top < lk.bottom), spill: ls.some((e) => e.scrollWidth > e.clientWidth + 1), lang: document.querySelector(`[data-ddh-copy=${k}]`).getAttribute('lang') };
    }, k);
    const wantLang = loc === 'en-GB' ? null : loc.slice(0, 2);
    worst = Math.min(worst, r.contrast);
    if (r.contrast < MIN_CONTRAST || r.hair || r.zones || r.header || r.lockup || r.spill || r.lang !== wantLang) { bad++; console.log('  FAIL', w, h, loc, k, JSON.stringify(r)); }
  }
  await p.close();
}
console.log(`${n - bad} passed, ${bad} failed (lowest line contrast ${worst})`); await b.close();
process.exitCode = bad ? 1 : 0;
