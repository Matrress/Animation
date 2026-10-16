// BioDunlop intro checks. Needs tools/serve.py on 8766 (repo root). usage: node tests/intro.mjs
import { chromium } from 'playwright';
const URL = (process.env.BASE || 'http://127.0.0.1:8766') + '/divine-biodunlop-intro/preview/intro.html';
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL', m); } };
const b = await chromium.launch();
const st = (p) => p.evaluate(() => document.documentElement.getAttribute('data-ddb'));
async function page(opts = {}, init) {
  const ctx = await b.newContext({ viewport: opts.vp || { width: 1440, height: 900 }, reducedMotion: opts.rm ? 'reduce' : 'no-preference', hasTouch: !!opts.touch, isMobile: !!opts.mobile });
  const pg = await ctx.newPage(); const media = [];
  pg.on('request', (r) => /ddb-/.test(r.url()) && media.push(r.url()));
  if (init) await pg.addInitScript(init);
  if (opts.seen) { const g = pg.goto.bind(pg); pg.goto = (u, o) => g(u + (u.includes('?') ? '&' : '?') + 'ddb=2', o); }      // ?ddb=2: no waiting, the points are there at once
  await pg.addInitScript(() => { window.__cls = 0; window.__ddbShift = 0; window.__lcp = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; if ((e.sources || []).some((x) => x.node && x.node.closest && x.node.closest('.ddb-line,.ddb-lx'))) window.__ddbShift += e.value; })).observe({ type: 'layout-shift', buffered: true }); new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lcp.push([Math.round(e.startTime), e.element && (e.element.className || e.element.tagName), e.size]))).observe({ type: 'largest-contentful-paint', buffered: true }); });
  return { ctx, pg, media };
}
const box = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); }, sel);
const centre = async (p, sel) => { const c = await box(p, sel); return [c[0] + c[2] / 2, c[1] + c[3] / 2]; };
const hstate = (p) => p.evaluate(() => document.querySelector('.ddh').getAttribute('data-ddh-state'));
const phase = (p) => p.evaluate(() => window.DDBIntro && window.DDBIntro.phase);
const ptsVisible = (p) => p.evaluate(() => getComputedStyle(document.querySelector('.ddh__points')).visibility === 'visible' && getComputedStyle(document.querySelector('.ddh__point')).opacity !== '0');
async function settled(p) { await p.waitForFunction(() => window.DDBIntro && window.DDBIntro.phase === 'idle', null, { timeout: 20000 }); }

{ // 1. desktop: the model is shown still, then the points come out of it one after another and pulse
  const { ctx, pg, media } = await page();
  await pg.goto(URL, { waitUntil: 'domcontentloaded' }); await pg.waitForFunction(() => document.querySelector('.ddh__img'), null, { timeout: 5000 });
  ok(await st(pg) === 'pending' && await phase(pg) === 'reveal' || await st(pg) === 'pending', 'desktop: on load the points wait (' + await st(pg) + '/' + await phase(pg) + ')');
  ok(!(await ptsVisible(pg)) && await pg.evaluate(() => getComputedStyle(document.querySelector('.ddh__sky-lockup')).visibility === 'hidden'), 'desktop: no point, no hint, no wordmark note while the model is first shown');
  ok(await pg.evaluate(() => [...document.querySelectorAll('.ddh__cta')].every((a) => { const r = a.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return a.contains(e); })), 'desktop: both Shop buttons stay visible and clickable');
  ok(await pg.evaluate(() => document.querySelectorAll('h1').length) === 1, 'desktop: still exactly one H1');
  ok(!(await pg.$('.ddb video')) && !(await pg.$('.ddb')) && !(await pg.$('.ddb-skip')), 'desktop: no film, no stage, no Skip button');
  await pg.waitForFunction(() => document.documentElement.hasAttribute('data-ddb-lit'), null, { timeout: 6000 });
  ok(await st(pg) === null && await phase(pg) === 'idle', 'desktop: the points are released (' + await st(pg) + '/' + await phase(pg) + ')');
  await pg.waitForTimeout(100);
  const grow = await pg.evaluate(() => [...document.querySelectorAll('.ddh__points .ddh__point')].slice(0, 4).map((p) => { const a = p.getAnimations().find((x) => x.animationName === 'ddb-lit'); return a ? Math.round(a.effect.getComputedTiming().delay) : -1; }));
  ok(grow.every((x) => x >= 0) && grow[1] > grow[0] && grow[3] > grow[2], 'desktop: the points grow out one after another (delays ' + grow + ' ms)');
  await pg.waitForTimeout(3300);
  const anim = await pg.evaluate(() => { const b = document.querySelector('.ddh__point'); return [getComputedStyle(b, '::after').animationName, getComputedStyle(b, '::after').animationPlayState]; });
  ok(anim[0] === 'ddh-point-beat' && anim[1] === 'running', 'desktop: the points pulse as always ' + anim);
  const c = await centre(pg, '[data-ddh-point="firmness"]'); await pg.mouse.move(c[0], c[1]); await pg.waitForTimeout(350);
  ok(await hstate(pg) === 'firmness', 'desktop: the hero is interactive (' + await hstate(pg) + ')');
  ok(!media.some((u) => /ddb-(turn|again|poster)/.test(u)), 'desktop: no turning film is requested (' + media.length + ' ddb files)');
  ok(await pg.evaluate(() => window.__ddbShift) === 0, 'desktop: no layout shift from the intro (page CLS ' + (await pg.evaluate(() => window.__cls)).toFixed(4) + ')');
  await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(150);
  ok(await st(pg) === 'pending' && !(await ptsVisible(pg)), 'a reload shows the model first, points waiting again (' + await st(pg) + ')');
  await pg.goto(URL + '?ddb=2'); await pg.waitForTimeout(500);
  ok(await st(pg) === null && await ptsVisible(pg), '?ddb=2: the points are there at once');
  await ctx.close();
}
{ // 2. reduced motion, phone, Data Saver, 3G: nothing waits; the points are there at once
  for (const [name, opts, init, pts] of [['reduced motion', { rm: true }, null, true], ['phone 390x844', { vp: { width: 390, height: 844 }, touch: true, mobile: true }, null, false], ['Data Saver', {}, () => Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '4g' } }), true], ['3g', {}, () => Object.defineProperty(navigator, 'connection', { value: { saveData: false, effectiveType: '3g' } }), true]]) {
    const { ctx, pg, media } = await page(opts, init); await pg.goto(URL); await pg.waitForTimeout(900);
    ok(await st(pg) === null && !media.length, `${name}: nothing waits, no media downloaded (${media.length})`);
    if (pts) ok(await ptsVisible(pg), `${name}: the points are there immediately`);
    await ctx.close();
  }
}
{ // 3. nothing turns: the Spinal Alignment point is the hero's own screen at once; the wordmark does nothing
  const { ctx, pg, media } = await page({ seen: true });
  await pg.goto(URL); await settled(pg);
  const bc = await centre(pg, '[data-ddh-point="back"]'); await pg.mouse.move(bc[0], bc[1]); await pg.waitForTimeout(400);
  ok(await hstate(pg) === 'back' && await pg.evaluate(() => getComputedStyle(document.querySelector('.ddh__screen--back')).display) !== 'none', 'spinal: the Spinal Alignment screen starts at once (' + await hstate(pg) + ')');
  ok(await ptsVisible(pg), 'spinal: the other points stay as in the hero');
  await pg.waitForTimeout(500);
  ok(await pg.evaluate(() => [...document.querySelectorAll('.ddh__spine path')].some((p) => getComputedStyle(p).animationName === 'ddh-vert')), 'spinal: the vertebra animation runs');
  const pr = await box(pg, '.ddh__plane'); await pg.mouse.move(5, 5); await pg.waitForTimeout(300); await pg.mouse.move(pr[0] + pr[2] * 0.5, pr[1] + pr[3] * 0.31); await pg.waitForTimeout(1300);
  ok(!media.some((u) => /ddb-(turn|again)/.test(u)) && !(await pg.$('.ddb video')), 'wordmark: resting on it starts nothing (no film at all)');
  await ctx.close();
}
{ // 8. Original Dunlop Technology: the natural-sourcing video next to the card (wide) or inside it (narrow); stops and rewinds when the card closes
  for (const [vp, mode] of [[{ width: 1440, height: 900 }, 'side'], [{ width: 1024, height: 768 }, 'side'], [{ width: 1180, height: 820 }, 'card'], [{ width: 900, height: 700 }, 'card']]) {
    const { ctx, pg, media } = await page({ seen: true, vp }); await pg.goto(URL); await settled(pg);
    const zc = await centre(pg, '[data-ddh-point="zones"]'); await pg.mouse.move(zc[0], zc[1]); await pg.waitForTimeout(1500);
    const tag = `${vp.width}x${vp.height}`;
    ok(await hstate(pg) === 'zones', `${tag}: the Original Dunlop Technology card opens`);
    ok(await pg.evaluate(() => document.documentElement.getAttribute('data-ddb-lx')) === mode, `${tag}: the video is shown ${mode === 'side' ? 'in the window' : 'inside the card'} (${await pg.evaluate(() => document.documentElement.getAttribute('data-ddb-lx'))})`);
    ok(media.some((u) => /ddb-latex/.test(u)), `${tag}: the video file is requested only now`);
    const hd = await pg.evaluate(() => { const n = document.querySelector('.ddb-hc-n'); return n && [n.textContent, getComputedStyle(n).display, getComputedStyle(n.parentNode.querySelector('.ddh__hc-s')).display]; });
    ok(hd && hd[0] === 'Naturally Sourced · Custom-Made Sleep Systems' && hd[1] !== 'none' && hd[2] === 'none', `${tag}: the secondary line is in the blue band, exact wording (${hd})`);
    const info = await pg.evaluate((mode) => { const el = document.querySelector(mode === 'side' ? '.ddb-lx' : '.ddb-lx-card'), v = el.querySelector('video'), cs = getComputedStyle(el); return { op: cs.opacity, vis: cs.visibility, rad: cs.borderRadius, t: v && v.currentTime, paused: v && v.paused, muted: v && v.muted, pi: v && v.hasAttribute('playsinline'), bg: cs.backgroundImage.includes('ddb-latex-poster'), text: el.textContent.trim() }; }, mode);
    ok(info.vis === 'visible' && +info.op > 0.98 && !info.paused && info.muted && info.pi, `${tag}: it plays, silent and inline (${JSON.stringify(info)})`);
    ok(info.bg && info.text === '', `${tag}: poster fallback present, no text over the video`);
    if (mode === 'side') {
      ok(/^26px/.test(info.rad), `${tag}: same corner radius as the card (${info.rad})`);
      await pg.waitForFunction(() => !document.querySelector('.ddb-lx').getAnimations().length, null, { timeout: 5000 }).catch(() => {});
      const wb = await box(pg, '.ddb-lx'), pb = await box(pg, '.ddh__plane');
      ok(Math.abs(wb[0] - (pb[0] + pb[2] * .033)) <= 2 && Math.abs(wb[2] - pb[2] * .394) <= 2, `${tag}: the window lies in the marked area (${wb} in ${pb})`);
      const cb = await box(pg, '[data-ddh-card="zones"]'); ok(wb[0] + wb[2] < cb[0] - 4, `${tag}: it does not touch the card (${wb[0] + wb[2]} < ${cb[0]})`);
    }
    await pg.waitForTimeout(700);
    const t1 = await pg.evaluate((m) => document.querySelector(m === 'side' ? '.ddb-lx video' : '.ddb-lx-card video').currentTime, mode);
    ok(t1 > 0.3, `${tag}: it keeps playing while the card is open (${t1.toFixed(2)} s)`);
    const fc = await centre(pg, '[data-ddh-point="sizes"]'); await pg.mouse.move(5, 5); await pg.waitForTimeout(100); await pg.mouse.move(fc[0], fc[1]); await pg.waitForTimeout(800);
    const gone = await pg.evaluate((m) => { const v = document.querySelector(m === 'side' ? '.ddb-lx video' : '.ddb-lx-card video'); return { s: document.documentElement.hasAttribute('data-ddb-lx'), paused: v.paused, t: v.currentTime }; }, mode);
    ok(!gone.s && gone.paused && gone.t === 0, `${tag}: another hotspot: the video stops and rewinds (${JSON.stringify(gone)})`);
    await ctx.close();
  }
}
{ // 9. reduced motion: the card still explains with the poster, nothing moves
  const { ctx, pg } = await page({ rm: true, vp: { width: 1440, height: 900 } }); await pg.goto(URL); await pg.waitForTimeout(800);
  const zc = await centre(pg, '[data-ddh-point="zones"]'); await pg.mouse.move(zc[0], zc[1]); await pg.waitForTimeout(1200);
  const r = await pg.evaluate(() => ({ lx: document.documentElement.getAttribute('data-ddb-lx'), v: !!document.querySelector('.ddb-lx video'), line: !!document.querySelector('.ddb-hc-n') }));
  ok(r.lx === 'side' && !r.v && r.line, 'reduced motion: the window shows the poster only, no video, the line is there (' + JSON.stringify(r) + ')');
  await ctx.close();
}
await b.close();
console.log(`intro: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
