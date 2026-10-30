// 1.20.5: the invitation button (upper left) opens the window "Our sleep system". usage: node tests/sys21.mjs <page>   (default preview/section-local.html, served on 8765)
import { chromium } from 'playwright';
const PAGE = process.argv[2] || 'preview/section-local.html';
const b = await chromium.launch(); const out = [];
const ok = (c, m) => { out.push((c ? 'ok   ' : 'FAIL ') + m); if (!c) console.log(out[out.length - 1]); };
async function page(vp, opts = {}, q = '') {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, ...opts }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.errs = errs;
  await p.goto(`http://127.0.0.1:8765/${PAGE}${PAGE.includes('?') ? '&' : '?'}x=1` + q, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(2600); return p;
}
const open = (p) => p.evaluate(() => document.querySelector('.ddh').getAttribute('data-ddh-open-sheet'));
{ // desktop
  const p = await page({ width: 1440, height: 900 });
  ok(await p.evaluate(() => { const h = document.querySelector('.ddh__hint'); return h.tagName === 'BUTTON' && !h.hidden && getComputedStyle(h).opacity === '1' && getComputedStyle(h).pointerEvents === 'auto'; }), 'pill is a visible, clickable button');
  // hover opens, leaving closes, click pins
  { const bb = await (await p.$('.ddh__hint')).boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(500);
    ok(await open(p) === 'sys', 'hovering the pill opens the window');
    await p.mouse.move(700, 880); await p.waitForTimeout(700); ok(await open(p) === null, 'leaving closes a hover-opened window');
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(500); await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.move(700, 880); await p.waitForTimeout(700);
    ok(await open(p) === 'sys', 'a click pins it open (it stays when the pointer leaves)');
    await p.keyboard.press('Escape'); await p.waitForTimeout(400); }
  await p.click('.ddh__hint'); await p.waitForTimeout(700);
  ok(await open(p) === 'sys' && await p.evaluate(() => document.querySelector('.ddh__hint').getAttribute('aria-expanded')) === 'true', 'click opens the window (aria-expanded true)');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.ddh__hint')).opacity) === '0', 'pill steps aside (dimmed) while open');
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  ok(await open(p) === null, 'Escape closes');
  ok(await p.evaluate(() => document.activeElement === document.querySelector('.ddh__hint')), 'focus returns to the pill');
  await p.click('.ddh__hint'); await p.waitForTimeout(600); await p.click('#ddh-sheet-sys .ddh__sh-x'); await p.waitForTimeout(400);
  ok(await open(p) === null, 'close button closes');
  await p.click('.ddh__hint'); await p.waitForTimeout(600); await p.mouse.click(5, 450); await p.waitForTimeout(400);
  ok(await open(p) === null, 'click outside closes');
  // keyboard: Tab to the pill, Enter opens; Tab stays inside
  await p.evaluate(() => document.activeElement.blur()); await p.focus('.ddh__hint'); await p.keyboard.press('Enter'); await p.waitForTimeout(600);
  ok(await open(p) === 'sys', 'Enter on the focused pill opens');
  const foc = []; for (let i = 0; i < 4; i++) { await p.keyboard.press('Tab'); foc.push(await p.evaluate(() => !!document.activeElement.closest('#ddh-sheet-sys'))); }
  ok(foc.every(Boolean), 'Tab keeps focus inside the dialog ' + foc);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  // other points still work
  const c = await p.evaluate(() => { const r = document.querySelector('[data-ddh-point="firmness"]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await p.mouse.move(c[0], c[1]); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => document.querySelector('.ddh').getAttribute('data-ddh-state')) === 'firmness', 'points still open their cards');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.ddh__hint')).visibility) === 'hidden', 'pill steps aside while a card is open');
  ok(p.errs.length === 0, 'no page errors ' + p.errs.join('|'));
}
{ // retired after three points: still there, compact
  const p = await page({ width: 1440, height: 900 }); 
  for (const k of ['shoulder', 'back', 'zones']) { const c = await p.evaluate((k) => { const r = document.querySelector('[data-ddh-point="' + k + '"]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, k); await p.mouse.move(c[0], c[1]); await p.waitForTimeout(900); }
  await p.mouse.move(700, 120); await p.waitForTimeout(1200);
  ok(await p.evaluate(() => { const h = document.querySelector('.ddh__hint'); return h.hasAttribute('data-gone') && getComputedStyle(h).visibility === 'visible' && getComputedStyle(h).opacity === '1' && getComputedStyle(h.querySelector('em')).display === 'none'; }), 'after three points the pill stays, compact (first line only)');
  await p.click('.ddh__hint'); await p.waitForTimeout(600); ok(await open(p) === 'sys', 'compact pill still opens the window');
}
{ // German: everything inside, nothing wider than the window
  const p = await page({ width: 1440, height: 900 }, {}, '&ddh-lang=de'); await p.waitForTimeout(1500);
  await p.click('.ddh__hint'); await p.waitForTimeout(800);
  const r = await p.evaluate(() => { const i = document.querySelector('#ddh-sheet-sys .ddh__sh-in'); return { h1: document.querySelector('.ddh__sy-h span').textContent, sw: i.scrollWidth, cw: i.clientWidth, sh: i.scrollHeight, ch: i.clientHeight, sr: document.querySelector('.ddh__hint small').textContent }; });
  ok(r.h1 === 'Das Fundament entwickeln.' && r.sw <= r.cw + 1, 'German text, no sideways overflow ' + JSON.stringify(r));
}
{ // 1.20.7: a picture on top of each of the three boxes; no overflow at 1440x900
  const p = await page({ width: 1440, height: 900 }); await p.click('.ddh__hint'); await p.waitForTimeout(900);
  const r = await p.evaluate(() => { const v = [...document.querySelectorAll('#ddh-sheet-sys .ddh__sy-v')], i = document.querySelector('#ddh-sheet-sys .ddh__sh-in'); return { n: v.length, hid: v.every((x) => x.getAttribute('aria-hidden') === 'true'), top: v.every((x) => x.getBoundingClientRect().height > 60 && x.getBoundingClientRect().width > 150), sh: i.scrollHeight, ch: i.clientHeight }; });
  ok(r.n === 3 && r.hid && r.top, 'three pictures, hidden from screen readers, visible ' + JSON.stringify(r));
  ok(r.sh <= r.ch + 1, 'whole window fits at 1440x900 without scrolling ' + JSON.stringify(r));
}
{ // tablet touch, landscape: full-screen window
  const p = await page({ width: 1180, height: 820 }, { hasTouch: true });
  await p.tap('.ddh__hint'); await p.waitForTimeout(800);
  ok(await open(p) === 'sys', 'tap opens (tablet)');
  ok(await p.evaluate(() => getComputedStyle(document.documentElement).overflow) === 'hidden', 'page scroll locked while open');
  await p.tap('#ddh-sheet-sys .ddh__sh-x'); await p.waitForTimeout(500); ok(await open(p) === null, 'tap on close closes (tablet)');
  ok(await p.evaluate(() => getComputedStyle(document.documentElement).overflow) !== 'hidden', 'page scroll restored');
}
await b.close(); const bad = out.filter((l) => l.startsWith('FAIL')).length; console.log(`sys21: ${out.length - bad} passed, ${bad} failed`); process.exit(bad ? 1 : 0);
