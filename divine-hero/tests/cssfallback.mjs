// 1.20.13: when hero.css is missing or fails, the script fetches it again; if it never applies the bare section is hidden. usage: node tests/cssfallback.mjs [page]  (served on 8765)
import { chromium } from 'playwright';
const u = process.argv[2] || 'preview/section-local.html';
const b = await chromium.launch(); const out = [];
const ok = (c, m) => { out.push((c ? 'ok   ' : 'FAIL ') + m); };
async function run(mode) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); let n = 0;
  await p.route(/hero\.css/, (r) => { n++; if (mode === 'never' || (mode === 'once' && n === 1)) r.abort(); else r.continue(); });
  await p.goto(`http://127.0.0.1:8765/${u}`, { waitUntil: 'load' }); await p.waitForTimeout(2600);
  const s = await p.evaluate(() => { const r = document.querySelector('.ddh'); const h = document.querySelector('.ddh__hint'); return { marker: getComputedStyle(r).getPropertyValue('--ddh-css').trim(), nocss: r.hasAttribute('data-ddh-nocss'), display: getComputedStyle(r).display, hintOpacity: h ? getComputedStyle(h).opacity : null, srPos: getComputedStyle(document.querySelector('.ddh__sr')).position }; });
  await p.close(); return { n, s };
}
{ const r = await run('normal'); ok(r.s.marker === '1' && !r.s.nocss && r.n === 1, 'normal load: styled, the stylesheet is requested once ' + JSON.stringify(r)); }
{ const r = await run('once'); ok(r.s.marker === '1' && !r.s.nocss && r.s.srPos === 'absolute' && r.n >= 2, 'first request fails: the script fetches it again and the section is styled ' + JSON.stringify(r)); }
{ const r = await run('never'); ok(r.s.nocss && r.s.display === 'none', 'stylesheet never arrives: the bare section is hidden, not shown raw ' + JSON.stringify(r)); }
await b.close(); const bad = out.filter((l) => l.startsWith('FAIL')).length; console.log(out.join('\n')); console.log(`cssfallback: ${out.length - bad} passed, ${bad} failed`); process.exit(bad ? 1 : 0);
