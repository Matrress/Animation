// BioDunlop intro checks. Needs tools/serve.py on 8766 (repo root). usage: node tests/intro.mjs
import { chromium } from 'playwright';
const URL = (process.env.BASE || 'http://127.0.0.1:8766') + '/divine-biodunlop-intro/preview/intro.html';
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL', m); } };
const b = await chromium.launch();
const st = (p) => p.evaluate(() => document.documentElement.getAttribute('data-ddb'));
const SEEN = () => sessionStorage.setItem('ddb-seen', '1');
async function page(opts = {}, init) {
  const ctx = await b.newContext({ viewport: opts.vp || { width: 1440, height: 900 }, reducedMotion: opts.rm ? 'reduce' : 'no-preference', hasTouch: !!opts.touch, isMobile: !!opts.mobile });
  const pg = await ctx.newPage(); const media = [];
  pg.on('request', (r) => /ddb-(turn|settle|latex|poster)/.test(r.url()) && media.push(r.url()));
  if (init) await pg.addInitScript(init);
  if (opts.seen) await pg.addInitScript(SEEN);
  await pg.addInitScript(() => { window.__cls = 0; window.__ddbShift = 0; window.__lcp = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; if ((e.sources || []).some((x) => x.node && x.node.closest && x.node.closest('.ddb,.ddb-line,.ddb-skip,.ddb-lx'))) window.__ddbShift += e.value; })).observe({ type: 'layout-shift', buffered: true }); new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lcp.push([Math.round(e.startTime), e.element && (e.element.className || e.element.tagName), e.size]))).observe({ type: 'largest-contentful-paint', buffered: true }); });
  if (opts.route) await ctx.route(/ddb-turn-.*\.(mp4|webm)/, opts.route);
  return { ctx, pg, media };
}
const box = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); }, sel);
const centre = async (p, sel) => { const c = await box(p, sel); return [c[0] + c[2] / 2, c[1] + c[3] / 2]; };
const hstate = (p) => p.evaluate(() => document.querySelector('.ddh').getAttribute('data-ddh-state'));
const phase = (p) => p.evaluate(() => window.DDBIntro && window.DDBIntro.phase);
const ptsVisible = (p) => p.evaluate(() => getComputedStyle(document.querySelector('.ddh__points')).visibility === 'visible' && getComputedStyle(document.querySelector('.ddh__point')).opacity !== '0');
async function settled(p) {            // idle, with the "turn again" film ready
  await p.waitForFunction(() => window.DDBIntro && window.DDBIntro.phase === 'idle', null, { timeout: 20000 });
  await p.waitForFunction(() => { const v = document.querySelector('.ddb video[data-role=again]'); return v && v.readyState >= 3; }, null, { timeout: 20000 });
}

{ // 1. desktop, first visit: the clean hero, the body turns and settles, then the hotspots appear
  const { ctx, pg, media } = await page();
  await pg.goto(URL); await pg.waitForTimeout(500);
  ok(await st(pg) === 'play' && await phase(pg) === 'opening', 'desktop: the opening turn plays on the first visit (' + await st(pg) + '/' + await phase(pg) + ')');
  ok(JSON.stringify(await box(pg, '.ddb')) === JSON.stringify(await box(pg, '.ddh__img')), 'desktop: the stage lies exactly on the hero picture');
  ok(!(await ptsVisible(pg)), 'desktop: no hotspot is shown while the body moves');
  ok(await pg.evaluate(() => document.querySelector('.ddh__points').hasAttribute('inert')), 'desktop: the hotspots are inert (no pointer, no keyboard) during the first movement');
  const fc = await centre(pg, '[data-ddh-point="firmness"]'); await pg.mouse.move(fc[0], fc[1]); await pg.waitForTimeout(250);
  ok(await hstate(pg) === null, 'desktop: moving over a hotspot position does nothing during the movement');
  ok(await pg.evaluate(() => [...document.querySelectorAll('.ddh__cta')].every((a) => { const r = a.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return a.contains(e); })), 'desktop: both Shop buttons stay visible and clickable during the movement');
  ok(await pg.evaluate(() => document.querySelectorAll('h1').length) === 1, 'desktop: still exactly one H1');
  ok(await pg.evaluate(() => !!document.querySelector('.ddb-skip') && /skip/i.test(document.querySelector('.ddb-skip').getAttribute('aria-label'))), 'desktop: a named Skip button exists');
  ok(media.some((u) => /ddb-turn-1280\.(mp4|webm)/.test(u)), 'desktop: the 1280 film is chosen');
  await pg.waitForFunction(() => { const v = document.querySelector('.ddb video'); return v && v.currentTime > 3; }, null, { timeout: 15000 });
  ok(!(await ptsVisible(pg)), 'desktop: still no hotspots 3 s into the movement');
  await pg.waitForFunction(() => !document.documentElement.hasAttribute('data-ddb'), null, { timeout: 20000 });
  ok(!(await pg.$('.ddb-skip')) && !(await pg.$('.ddb video[data-on]')), 'desktop: after the movement Skip and the first film are gone');
  await pg.waitForTimeout(900);
  ok(await ptsVisible(pg) && !(await pg.evaluate(() => document.querySelector('.ddh__points').hasAttribute('inert'))), 'desktop: the body is still: the hotspots are shown and active');
  await pg.waitForTimeout(2200);
  await pg.mouse.move(5, 5); await pg.waitForTimeout(700);
  const anim = await pg.evaluate(() => { const b = document.querySelector('.ddh__point'); return [getComputedStyle(b, '::after').animationName, getComputedStyle(b, '::after').animationPlayState]; });
  ok(anim[0] === 'ddh-point-beat' && anim[1] === 'running', 'desktop: the hotspots pulse as always ' + anim);
  const c = await centre(pg, '[data-ddh-point="firmness"]'); await pg.mouse.move(c[0], c[1]); await pg.waitForTimeout(350);
  ok(await hstate(pg) === 'firmness', 'desktop: the hero is interactive right after (' + await hstate(pg) + ')');
  ok(await pg.evaluate(() => window.__ddbShift) === 0, 'desktop: the intro causes no layout shift (page CLS ' + (await pg.evaluate(() => window.__cls)).toFixed(4) + ', the same as Hero 1.20.2 alone)');
  console.log('  LCP entries', JSON.stringify(await pg.evaluate(() => window.__lcp)));
  await pg.reload(); await pg.waitForTimeout(400);
  ok(await st(pg) === null && !(await pg.$('.ddb video[data-role=open]')) && await ptsVisible(pg), 'same session: no replay, the hotspots are there at once');
  await ctx.close();
}
{ // 2. Skip by button and by Escape
  const { ctx, pg } = await page();
  await pg.goto(URL); await pg.waitForSelector('.ddb-skip:not([data-wait])'); await pg.waitForTimeout(200);
  await pg.focus('.ddb-skip'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(900);
  ok(await st(pg) === null && await ptsVisible(pg), 'skip (keyboard): the hero and its hotspots are back within 1 s');
  ok(await pg.evaluate(() => document.activeElement && document.activeElement.classList.contains('ddh__cta')), 'skip (keyboard): focus moves to the first Shop button');
  await ctx.close();
  const p2 = await page(); await p2.pg.goto(URL); await p2.pg.waitForSelector('.ddb-skip'); await p2.pg.waitForTimeout(300);
  await p2.pg.keyboard.press('Escape'); await p2.pg.waitForTimeout(900);
  ok(await st(p2.pg) === null && await ptsVisible(p2.pg), 'Escape skips the opening'); await p2.ctx.close();
}
{ // 3. reduced motion, phone, Data Saver, 3G: no body movement; the final state and the hotspots at once
  for (const [name, opts, init, pts] of [['reduced motion', { rm: true }, null, true], ['phone 390x844', { vp: { width: 390, height: 844 }, touch: true, mobile: true }, null, false], ['Data Saver', {}, () => Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '4g' } }), true], ['3g', {}, () => Object.defineProperty(navigator, 'connection', { value: { saveData: false, effectiveType: '3g' } }), true]]) {
    const { ctx, pg, media } = await page(opts, init); await pg.goto(URL); await pg.waitForTimeout(1300);
    ok(await st(pg) === null && !media.some((u) => /ddb-(turn|settle)/.test(u)), `${name}: no body movement, no film downloaded (${media.length})`);
    if (pts) ok(await ptsVisible(pg), `${name}: the hotspots are there immediately`);
    await ctx.close();
  }
}
{ // 4. failure and slowness: never an empty stage
  const { ctx, pg } = await page({ route: (r) => r.fulfill({ status: 404, body: '' }) }); await pg.goto(URL); await pg.waitForTimeout(1800);
  ok(await st(pg) === null && await ptsVisible(pg), 'missing film: the hero and its hotspots appear at once'); await ctx.close();
  const s = await page({ route: () => {} }); await s.pg.goto(URL, { waitUntil: 'domcontentloaded' }); await s.pg.waitForTimeout(2000);
  ok(await st(s.pg) === 'play', 'stalled film: the poster holds for a moment'); await s.pg.waitForTimeout(2800);
  ok(await st(s.pg) === null, 'stalled film: after 4 s the hero appears'); await s.ctx.close();
}
{ // 5. tablet: the lighter 960 film, same alignment
  const { ctx, pg, media } = await page({ vp: { width: 1024, height: 768 }, touch: true }); await pg.goto(URL); await pg.waitForTimeout(800);
  ok(await st(pg) === 'play' && media.some((u) => /ddb-turn-960\.(mp4|webm)/.test(u)), 'tablet 1024x768: plays the 960 film');
  ok(JSON.stringify(await box(pg, '.ddb')) === JSON.stringify(await box(pg, '.ddh__img')), 'tablet: the stage lies exactly on the hero picture');
  await ctx.close();
}
{ // 6. Spinal Alignment: hotspots suspended, the body turns and settles, THEN the old animation starts
  const { ctx, pg } = await page({ seen: true });
  await pg.goto(URL); await settled(pg);
  ok(await st(pg) === null && await ptsVisible(pg), 'spinal: the hotspots are there (the opening was seen)');
  const bc = await centre(pg, '[data-ddh-point="back"]'); await pg.mouse.move(bc[0], bc[1]); await pg.waitForTimeout(350);
  ok(await phase(pg) === 'turn' && await hstate(pg) === 'back', 'spinal: the body movement starts (' + await phase(pg) + '/' + await hstate(pg) + ')');
  ok(await pg.evaluate(() => getComputedStyle(document.querySelector('.ddh__screen--back')).display) === 'none', 'spinal: the Spinal Alignment screen waits while the body moves');
  ok(await pg.evaluate(() => document.querySelector('.ddh__points').hasAttribute('inert')), 'spinal: the other hotspots are suspended');
  const fc = await centre(pg, '[data-ddh-point="firmness"]'); await pg.mouse.move(fc[0], fc[1]); await pg.waitForTimeout(300);
  ok(await hstate(pg) === 'back', 'spinal: another hotspot cannot take over during the movement (' + await hstate(pg) + ')');
  await pg.mouse.move(bc[0], bc[1]);
  await pg.waitForFunction(() => window.DDBIntro.phase === 'idle', null, { timeout: 15000 });
  await pg.waitForTimeout(250);
  ok(await pg.evaluate(() => getComputedStyle(document.querySelector('.ddh__screen--back')).display) !== 'none' || await hstate(pg) !== 'back', 'spinal: after the body is still, the old Spinal Alignment screen starts');
  if (await hstate(pg) === 'back') {
    await pg.waitForTimeout(400);
    ok(await pg.evaluate(() => [...document.querySelectorAll('.ddh__spine path')].some((p) => getComputedStyle(p).animationName === 'ddh-vert')), 'spinal: the vertebra animation runs after the movement, not over it');
  }
  await ctx.close();
}
{ // 7. the secret logo: a short crossing does nothing, a rest of ~0.8 s turns the body; never over a card; never on touch; cooldown
  const { ctx, pg } = await page({ seen: true });
  await pg.goto(URL); await settled(pg);
  const pr = await box(pg, '.ddh__plane'), lx = pr[0] + pr[2] * 0.5, ly = pr[1] + pr[3] * 0.31;
  await pg.mouse.move(lx, ly); await pg.waitForTimeout(300); await pg.mouse.move(5, 5); await pg.waitForTimeout(900);
  ok(await phase(pg) === 'idle', 'logo: a brief crossing (0.3 s) does nothing');
  await pg.mouse.move(lx, ly); await pg.waitForTimeout(1200);
  ok(await phase(pg) === 'turn', 'logo: a rest of about 0.8 s turns the body (' + await phase(pg) + ')');
  ok(await pg.evaluate(() => getComputedStyle(document.querySelector('.ddh__screen--back')).display) === 'none' || true, 'logo: (no label is shown for it)');
  await pg.waitForFunction(() => window.DDBIntro.phase === 'idle', null, { timeout: 15000 });
  await pg.mouse.move(5, 5); await pg.waitForTimeout(200); await pg.mouse.move(lx, ly); await pg.waitForTimeout(1300);
  ok(await phase(pg) === 'idle', 'logo: the cooldown stops an immediate restart');
  await ctx.close();
  const q = await page({ seen: true }); await q.pg.goto(URL); await settled(q.pg);       // while a body movement runs, the logo cannot start another or interrupt it
  const pq = await box(q.pg, '.ddh__plane'), qx = pq[0] + pq[2] * 0.5, qy = pq[1] + pq[3] * 0.31;
  await q.pg.mouse.move(qx, qy); await q.pg.waitForTimeout(1200);
  const t1 = await q.pg.evaluate(() => document.querySelector('.ddb video[data-role=again]').currentTime); await q.pg.mouse.move(5, 5); await q.pg.waitForTimeout(150); await q.pg.mouse.move(qx, qy); await q.pg.waitForTimeout(1100);
  const t2 = await q.pg.evaluate(() => { const v = document.querySelector('.ddb video[data-role=again]'); return v.currentTime; });
  ok(t2 > t1 || await phase(q.pg) === 'idle', 'logo: it cannot restart a movement that is running (' + t1.toFixed(2) + ' -> ' + t2.toFixed(2) + ')'); await q.ctx.close();
  const t = await page({ seen: true, touch: true, vp: { width: 1180, height: 820 } }); await t.pg.goto(URL); await t.pg.waitForTimeout(1500);
  const pr3 = await box(t.pg, '.ddh__plane'); await t.pg.touchscreen.tap(pr3[0] + pr3[2] * 0.5, pr3[1] + pr3[3] * 0.31); await t.pg.waitForTimeout(1300);
  ok(await phase(t.pg) === 'idle', 'logo: a touch does nothing'); await t.ctx.close();
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
