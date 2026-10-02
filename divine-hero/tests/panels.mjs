// 1.5.0: the two "window 3" panels in every language at common viewports, inside an Ecwid imitation page.
// Fails if a line overlaps the zones point, slides under the header, touches the LATEX lockup or spills its box.
// usage: node tests/panels.mjs <sim-url-path>
import { chromium } from 'playwright';
const url = (process.env.BASE || 'http://127.0.0.1:8765/') + (process.argv[2] || 'preview/sim150.html');
const b = await chromium.launch(); let bad = 0, n = 0;
for (const [w, h] of [[667, 375], [844, 390], [1024, 768], [1180, 820], [1280, 720], [1366, 768], [1366, 1024], [1440, 900], [1536, 864], [1920, 1080], [2560, 1440]]) for (const loc of ['en-GB', 'de-DE', 'fi-FI', 'el-GR', 'fr-FR', 'pt-PT', 'es-ES', 'it-IT', 'sv-SE']) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, locale: loc })).newPage();
  await p.goto(url); await p.evaluate(() => document.fonts.ready);
  if (loc !== 'en-GB') await p.waitForFunction(() => document.querySelector('.ddh').getAttribute('data-ddh-lang'), null, { timeout: 4000 }).catch(() => {});
  await p.waitForTimeout(150);
  for (const k of ['sizes', 'weight']) {
    n++;
    const r = await p.evaluate((k) => {
      const q = (s) => document.querySelector(s).getBoundingClientRect();
      const z = q('[data-ddh-point=zones]'), hdr = document.querySelector('.ins-tile--header'), lk = q('.ddh__sky-lockup');
      document.querySelector(`[data-ddh-point=${k}]`).click();
      const ls = [...document.querySelectorAll(`[data-ddh-copy=${k}] strong,[data-ddh-copy=${k}] span`)], lines = ls.map((e) => e.getBoundingClientRect());
      const zc = { x: z.x + z.width / 2, y: z.y + z.height / 2 };
      return { zones: lines.some((l) => zc.x > l.left - 10 && zc.x < l.right + 10 && zc.y > l.top - 10 && zc.y < l.bottom + 10), header: !!hdr && Math.min(...lines.map((l) => l.top)) < hdr.getBoundingClientRect().bottom + 4, lockup: lines.some((l) => l.right > lk.left && l.left < lk.right && l.bottom > lk.top && l.top < lk.bottom), spill: ls.some((e) => e.scrollWidth > e.clientWidth + 1), lang: document.querySelector(`[data-ddh-copy=${k}]`).getAttribute('lang') };
    }, k);
    const wantLang = loc === 'en-GB' ? null : loc.slice(0, 2);
    if (r.zones || r.header || r.lockup || r.spill || r.lang !== wantLang) { bad++; console.log('  FAIL', w, h, loc, k, JSON.stringify(r)); }
  }
  await p.close();
}
console.log(`${n - bad} passed, ${bad} failed`); await b.close();
process.exitCode = bad ? 1 : 0;
