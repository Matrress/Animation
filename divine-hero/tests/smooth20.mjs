// 1.20.0: cards grow out of their point; a real mouse path from the point into the card must never close it. usage: node tests/smooth20.mjs <url-path>
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://127.0.0.1:8765/';
const url = base + (process.argv[2] || 'preview/sim110.html');
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log('  FAIL', m); } };
const b = await chromium.launch();
for (const [vw, vh] of (process.env.QUICK ? [[1440, 900]] : [[1440, 900], [1180, 820], [1080, 668]])) {
  for (const reduce of (process.env.QUICK ? [false] : [false, true])) {
    const pg = await b.newPage({ viewport: { width: vw, height: vh }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
    await pg.goto(url); await pg.waitForTimeout(1800);
    for (const k of ['firmness', 'zones', 'weight', 'sizes', 'shoulder', 'head', 'system']) {
      const pt = pg.locator(`[data-ddh-point="${k}"]`); if (!(await pt.count())) continue;
      await pg.mouse.move(3, 3); await pg.waitForTimeout(450);
      const bb = await pt.boundingBox(); if (!bb) continue;
      const sx = bb.x + bb.width / 2, sy = bb.y + bb.height / 2;
      await pg.mouse.move(sx, sy); await pg.waitForTimeout(+(process.env.LAG || 40));
      const st = await pg.evaluate(() => document.querySelector('.ddh').getAttribute('data-ddh-state'));
      if (st !== k) continue;                                                           // this size shows no card for the point
      // while the card grows it must not catch the pointer (it starts as a small box right under the cursor)
      const top = await pg.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return !!(e && e.closest('.ddh__hc,.ddh__dpc')); }, [sx, sy]);
      if (!reduce) ok(!top, `${vw}x${vh}${reduce ? ' reduced' : ''} ${k}: the growing card does not take the pointer from its point`);
      const tg = await pg.evaluate((k) => { const c = document.querySelector(k === 'system' ? '.ddh__dpc' : `[data-ddh-card="${k}"]`); if (!c || getComputedStyle(c).display === 'none') return null; const o = c.offsetParent.getBoundingClientRect(); return { x: o.left + c.offsetLeft + c.offsetWidth / 2, y: o.top + c.offsetTop + c.offsetHeight * .6 }; }, k);
      if (!tg) continue;
      // a natural hand: straight to the card's centre in 12 steps over ~240 ms, starting 60 ms after the card appeared
      for (let i = 1; i <= 12; i++) { await pg.mouse.move(sx + (tg.x - sx) * i / 12, sy + (tg.y - sy) * i / 12); await pg.waitForTimeout(20); }
      await pg.waitForTimeout(900);
      const r = await pg.evaluate((k) => { const c = document.querySelector(k === 'system' ? '.ddh__dpc' : `[data-ddh-card="${k}"]`), cs = getComputedStyle(c); return { state: document.querySelector('.ddh').getAttribute('data-ddh-state'), disp: cs.display, op: cs.opacity, tf: cs.transform }; }, k);
      const tag = `${vw}x${vh}${reduce ? ' reduced' : ''} ${k}`;
      ok(r.state === k && r.disp !== 'none', `${tag}: card stays open when the mouse travels into it (${JSON.stringify(r)})`);
      ok(r.op === '1' && (r.tf === 'none' || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(r.tf)), `${tag}: card settled (opacity 1, no transform) ${r.op} ${r.tf}`);
    }
    await pg.close();
  }
}
{ // 1.20.2: the vertebrae of Spinal Alignment are an inline drawing (no picture to load) that arranges itself left to right in about a second
  const pg = await b.newPage({ viewport: { width: 1366, height: 1024 } }); const reqs = []; pg.on('request', (r) => /spine-graphic/.test(r.url()) && reqs.push(r.url()));
  await pg.goto(url); await pg.waitForTimeout(1800);
  const c = await pg.evaluate(() => { const r = document.querySelector('[data-ddh-point="back"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await pg.mouse.move(c.x, c.y); await pg.waitForTimeout(150);
  const early = await pg.evaluate(() => [...document.querySelectorAll('.ddh__spine path')].map((p) => +getComputedStyle(p).opacity));
  await pg.waitForTimeout(1150);
  const late = await pg.evaluate(() => { const sp = document.querySelector('.ddh__spine'), sv = sp.querySelector('svg'); const xs = [...sv.querySelectorAll('path')].map((p) => { const r = p.getBoundingClientRect(); return { x: r.left, o: +getComputedStyle(p).opacity, t: getComputedStyle(p).transform }; }); return { n: xs.length, xs, shown: getComputedStyle(sp).display !== 'none', w: sv.getBoundingClientRect().width }; });
  ok(early.length === 7, 'spine: seven vertebrae drawn (' + early.length + ')');
  ok(early[6] < .5, 'spine: the last vertebra is still on its way 150 ms in (' + early[6] + ')');
  ok(late.shown && late.xs.every((v) => v.o === 1 && (v.t === 'none' || v.t === 'matrix(1, 0, 0, 1, 0, 0)')) && late.xs.every((v, i, a) => !i || v.x > a[i - 1].x), 'spine: after about a second every vertebra rests in its place, left to right');
  ok(late.w > 300, 'spine: the drawing has its width (' + late.w + ')');
  ok(reqs.length === 0, 'spine: no picture file is requested (' + reqs.length + ')');
  await pg.close();
}
await b.close();
console.log(`${passes} passed, ${fails} failed`); process.exit(fails ? 1 : 0);
