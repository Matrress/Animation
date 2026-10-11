// 1.19.0 certification card cosmos: opens with the card, planet turns, mattress stays, other copy steps aside, buttons stay, closes on X / leaving, reduced motion stands still.
// usage: node tests/orb19.mjs <page>   (server: python3 tests/serve.py 8765)
import { chromium } from 'playwright';
const url = 'http://127.0.0.1:8765/' + (process.argv[2] || 'preview/sim110.html');
let fails = 0, passes = 0; const ok = (c, m) => { if (c) passes++; else { fails++; console.log('  FAIL', m); } };
const b = await chromium.launch();
const sum = (p) => p.evaluate(() => { const c = document.querySelector('.ddh__orb-cv'), x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) >>> 0; return h; });
for (const [w, h] of [[1440, 900], [1180, 820], [1920, 1080]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); await p.goto(url); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(2200);
  const bb = await p.locator('.ddh__point[data-ddh-point=head]').boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(2200);
  const s = await p.evaluate(() => { const q = (s) => document.querySelector(s), cs = (e) => getComputedStyle(e), o = q('.ddh__orb').getBoundingClientRect(), m = q('.ddh__mat').getBoundingClientRect(), c = q('#ddh-hc-head').getBoundingClientRect(), t = q('.ddh__orb-t').getBoundingClientRect();
    return { space: cs(q('.ddh__space')).visibility, op: +cs(q('.ddh__orb')).opacity, mat: +cs(q('.ddh__mat')).opacity, lock: +cs(q('.ddh__sky-lockup')).opacity, cta: [...document.querySelectorAll('.ddh__cta')].every((a) => a.getBoundingClientRect().width > 100 && +cs(a).opacity === 1), orbRight: o.right, cardLeft: c.left, gap: m.top - o.bottom, textInside: t.left > o.left - o.width * .1 && t.right < o.right + o.width * .1, fs: parseFloat(cs(q('.ddh__orb-t b')).fontSize), txt: q('.ddh__orb-t').textContent.trim() }; });
  ok(s.space === 'visible' && s.op === 1, `${w}: cosmos visible with the card`); ok(s.mat === 1, `${w}: the Dual Plush mattress stays visible`); ok(s.lock === 0, `${w}: lockup steps aside`); ok(s.cta, `${w}: Shop buttons stay`);
  ok(s.orbRight < s.cardLeft - 8, `${w}: planet clear of the card (${Math.round(s.orbRight)} < ${Math.round(s.cardLeft)})`); ok(s.gap > 4 && s.gap < 200, `${w}: planet levitates above the mattress (gap ${Math.round(s.gap)})`);
  ok(s.textInside && s.fs >= 17, `${w}: slogan on the equator, ${s.fs}px`); ok(/Healthy for Us\s*Healthy for Our Planet/.test(s.txt), `${w}: slogan text`);
  const h1 = await sum(p); await p.waitForTimeout(700); const h2 = await sum(p); ok(h1 !== h2, `${w}: the planet turns`);
  await p.locator('#ddh-hc-head .ddh__hc-x').click(); await p.waitForTimeout(1500);
  const e = await p.evaluate(() => ({ st: document.querySelector('.ddh').getAttribute('data-ddh-state'), sp: getComputedStyle(document.querySelector('.ddh__space')).visibility }));
  ok(e.st === null && e.sp === 'hidden', `${w}: X closes the cosmos`);
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(1200); await p.mouse.move(w / 2, h - 5, { steps: 5 }); await p.waitForTimeout(1500);
  ok((await p.evaluate(() => getComputedStyle(document.querySelector('.ddh__space')).visibility)) === 'hidden', `${w}: leaving the card closes it`);
}
{ const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage(); await p.goto(url); await p.waitForTimeout(2200);
  const bb = await p.locator('.ddh__point[data-ddh-point=head]').boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(2000);
  const a = await sum(p); await p.waitForTimeout(800); ok(a === await sum(p) && a !== 0, 'reduced motion: the planet stands still but is drawn'); }
{ const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })).newPage(); await p.goto(url); await p.waitForTimeout(2000);
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.ddh__space')).visibility === 'hidden' || !document.querySelector('.ddh__space')), 'phone held upright: no cosmos'); }
await b.close(); console.log(`orb19: ${passes} passed, ${fails} failed`); process.exit(fails ? 1 : 0);
