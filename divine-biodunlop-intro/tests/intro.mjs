// BioDunlop intro checks. Needs tools/serve.py on 8766 (repo root). usage: node tests/intro.mjs
import { chromium } from 'playwright';
const URL = (process.env.BASE || 'http://127.0.0.1:8766') + '/divine-biodunlop-intro/preview/intro.html';
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL', m); } };
const b = await chromium.launch();
const st = (p) => p.evaluate(() => document.documentElement.getAttribute('data-ddb'));
async function page(opts = {}, init) {
  const ctx = await b.newContext({ viewport: opts.vp || { width: 1440, height: 900 }, reducedMotion: opts.rm ? 'reduce' : 'no-preference', hasTouch: !!opts.touch, isMobile: !!opts.mobile });
  const pg = await ctx.newPage(); const media = [];
  pg.on('request', (r) => /ddb-(intro|poster)/.test(r.url()) && media.push(r.url()));
  if (init) await pg.addInitScript(init);
  await pg.addInitScript(() => { window.__cls = 0; window.__ddbShift = 0; window.__lcp = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; if ((e.sources || []).some((x) => x.node && x.node.closest && x.node.closest('.ddb,.ddb-line,.ddb-skip'))) window.__ddbShift += e.value; })).observe({ type: 'layout-shift', buffered: true }); new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lcp.push([Math.round(e.startTime), e.element && (e.element.className || e.element.tagName), e.size]))).observe({ type: 'largest-contentful-paint', buffered: true }); });
  if (opts.route) await ctx.route(/ddb-intro-.*\.(mp4|webm)/, opts.route);
  return { ctx, pg, media };
}
const box = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); }, sel);

{ // 1. desktop, first visit: plays over the hero picture, waits for the hero's points, hands over to the live hero
  const { ctx, pg, media } = await page();
  await pg.goto(URL); await pg.waitForTimeout(400);
  ok(await st(pg) === 'play', 'desktop: the intro plays on the first visit (' + await st(pg) + ')');
  ok(JSON.stringify(await box(pg, '.ddb')) === JSON.stringify(await box(pg, '.ddh__img')), 'desktop: the stage lies exactly on the hero picture ' + await box(pg, '.ddb') + ' / ' + await box(pg, '.ddh__img'));
  ok(await pg.evaluate(() => getComputedStyle(document.querySelector('.ddh__points')).visibility) === 'hidden', 'desktop: the hero points wait during the film');
  ok(await pg.evaluate(() => [...document.querySelectorAll('.ddh__cta')].every((a) => { const r = a.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return a.contains(e); })), 'desktop: both Shop buttons stay visible and clickable during the film');
  ok(await pg.evaluate(() => document.querySelectorAll('h1').length) === 1, 'desktop: still exactly one H1');
  ok(await pg.evaluate(() => /natural latex milk to a complete natural latex sleep system/.test(document.querySelector('.ddb-line').textContent)), 'desktop: the story line is real HTML text');
  const skipName = await pg.evaluate(() => { const s = document.querySelector('.ddb-skip'); return s && (s.getAttribute('aria-label') || s.textContent); });
  ok(/skip/i.test(skipName || ''), 'desktop: a named Skip button exists (' + skipName + ')');
  ok(media.some((u) => /ddb-intro-1280\.(mp4|webm)/.test(u)), 'desktop: the 1280 film is chosen');
  await pg.waitForFunction(() => { const v = document.querySelector('.ddb video'); return v && v.currentTime > 4.6; }, null, { timeout: 15000 });
  ok(await pg.evaluate(() => document.querySelector('.ddb-line').hasAttribute('data-on')) === false, 'desktop: the line has left before the model turns');
  await pg.waitForFunction(() => !document.documentElement.hasAttribute('data-ddb'), null, { timeout: 15000 });
  ok(!(await pg.$('.ddb')) && !(await pg.$('.ddb-skip')), 'desktop: after the film the stage and Skip are gone');
  ok(await pg.evaluate(() => getComputedStyle(document.querySelector('.ddh__points')).visibility) === 'visible', 'desktop: the hero points are back');
  await pg.waitForTimeout(1900);
  const c = await box(pg, '[data-ddh-point="firmness"]'); await pg.mouse.move(c[0] + c[2] / 2, c[1] + c[3] / 2); await pg.waitForTimeout(300);
  ok(await pg.evaluate(() => document.querySelector('.ddh').getAttribute('data-ddh-state')) === 'firmness', 'desktop: the hero is interactive right after the hand-over');
  ok(await pg.evaluate(() => window.__ddbShift) === 0, 'desktop: the intro causes no layout shift (page CLS ' + (await pg.evaluate(() => window.__cls)).toFixed(4) + ', the same as Hero 1.20.2 alone)');
  console.log('  LCP entries', JSON.stringify(await pg.evaluate(() => window.__lcp)));
  // 2. same session: the film never replays (back from a product page)
  await pg.reload(); await pg.waitForTimeout(300);
  ok(await st(pg) === null && !(await pg.$('.ddb video')), 'same session: no replay');
  await ctx.close();
}
{ // 3. Skip by button and by Escape: the hero is there at once, the keyboard user lands on the first Shop button
  const { ctx, pg } = await page();
  await pg.goto(URL); await pg.waitForSelector('.ddb-skip:not([data-wait])'); await pg.waitForTimeout(200);
  await pg.focus('.ddb-skip'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(400);
  ok(await st(pg) === null, 'skip (keyboard): the hero is back within 0.4 s');
  ok(await pg.evaluate(() => document.activeElement && document.activeElement.classList.contains('ddh__cta')), 'skip (keyboard): focus moves to the first Shop button');
  await ctx.close();
  const p2 = await page(); await p2.pg.goto(URL); await p2.pg.waitForSelector('.ddb-skip'); await p2.pg.waitForTimeout(300);
  await p2.pg.keyboard.press('Escape'); await p2.pg.waitForTimeout(400);
  ok(await st(p2.pg) === null, 'Escape skips the intro'); await p2.ctx.close();
}
{ // 4. reduced motion, phone, Data Saver: no intro, no media downloaded
  for (const [name, opts, init] of [['reduced motion', { rm: true }], ['phone 390x844', { vp: { width: 390, height: 844 }, touch: true, mobile: true }], ['Data Saver', {}, () => Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '4g' } })], ['3g', {}, () => Object.defineProperty(navigator, 'connection', { value: { saveData: false, effectiveType: '3g' } })]]) {
    const { ctx, pg, media } = await page(opts, init); await pg.goto(URL); await pg.waitForTimeout(1200);
    ok(await st(pg) === null && media.length === 0, `${name}: the hero shows directly, nothing downloaded (${media.length})`);
    await ctx.close();
  }
}
{ // 5. failure and slowness: never an empty stage
  const { ctx, pg } = await page({ route: (r) => r.fulfill({ status: 404, body: '' }) }); await pg.goto(URL); await pg.waitForTimeout(1500);
  ok(await st(pg) === null && !(await pg.$('.ddb')), 'missing film: the hero appears at once'); await ctx.close();
  const s = await page({ route: () => {} }); await s.pg.goto(URL, { waitUntil: 'domcontentloaded' }); await s.pg.waitForTimeout(2000);
  ok(await st(s.pg) === 'play', 'stalled film: the poster holds for a moment'); await s.pg.waitForTimeout(2600);
  ok(await st(s.pg) === null, 'stalled film: after 4 s the hero appears'); await s.ctx.close();
}
{ // 6. tablet: the lighter 960 film, same alignment
  const { ctx, pg, media } = await page({ vp: { width: 1024, height: 768 }, touch: true }); await pg.goto(URL); await pg.waitForTimeout(800);
  ok(await st(pg) === 'play' && media.some((u) => /ddb-intro-960\.(mp4|webm)/.test(u)), 'tablet 1024x768: plays the 960 film');
  ok(JSON.stringify(await box(pg, '.ddb')) === JSON.stringify(await box(pg, '.ddh__img')), 'tablet: the stage lies exactly on the hero picture');
  await ctx.close();
  const p = await page({ vp: { width: 820, height: 1180 }, touch: true }); await p.pg.goto(URL); await p.pg.waitForTimeout(800);
  ok(await st(p.pg) === 'play', 'tablet upright 820x1180: plays'); await p.ctx.close();
}
await b.close();
console.log(`intro: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
