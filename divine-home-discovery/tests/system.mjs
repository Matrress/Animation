// The System tile (tile 2) and its link from the navigator (tile 1): behaviour, accessibility, mapping to the approved data.
// Runs against the real live homepage with BOTH tiles injected (navigator, then the System tile directly below it). Exit code 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch, openLive, VIEWPORTS, root, VERSION, PREVIEW_HOST } from './lib.mjs';
const src = fs.readdirSync(path.join(root, '.source'))[0];
const srcDir = path.join(root, '.source', src, 'divine-collection/src');
const { collections } = await import(pathToFileURL(path.join(srcDir, 'data.mjs')).href);
const { ROUTES } = await import(pathToFileURL(path.join(srcDir, 'nav.mjs')).href);
const sysHtml = fs.readFileSync(path.join(root, 'ecwid', process.env.DDHD_EMBED2 || `system-${VERSION}.html`), 'utf8');
const navHtml = fs.readFileSync(path.join(root, 'ecwid', process.env.DDHD_EMBED || `section-${VERSION}.html`), 'utf8');
let pass = 0, fail = 0; const failures = [];
const ok = (c, msg) => { if (c) pass++; else { fail++; failures.push(msg); console.log('  FAIL', msg); } };
const b = await launch();

// ---- 1. the files as pasted (raw HTML, before any script) ----
{
  const text = sysHtml.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&');
  for (const t of ['Solutions for Real Needs', 'Comfort & Regulation', 'Natural Materials', 'Engineering & Technology', 'European Production']) ok(sysHtml.includes(t.replace('&', '&amp;')) || sysHtml.includes(t), `raw HTML: topic "${t}"`);
  ok(/What makes our latex sleep system different\?/.test(sysHtml), 'raw HTML: the question');
  ok(/Every model has a reason to exist\./.test(sysHtml), 'raw HTML: "Every model has a reason to exist."');
  ok(/More than a mattress\. A complete sleep system\./.test(sysHtml) && /Find Your Latex Mattress/.test(sysHtml), 'raw HTML: story ending and call to action');
  ok(/This is not a collection of random models\. It is a system of answers\./.test(text), 'raw HTML: "a system of answers"');
  ok(/Arranged for certainty/.test(text) && /Engineering, not marketing/.test(text), 'raw HTML: the firmness section says it is arranged for certainty');
  ok(!/<h1/i.test(sysHtml), 'no H1');
  ok(!/\blayers?\b/i.test(text), 'the word "layer" never appears');
  ok(!/approximately|\babout \d|~/i.test(text), 'no "approximately" / "~"');
  ok(!/[£€$]\s?\d/.test(text), 'no price');
  ok(!/\b(baby|babies|infant|OEKO|ISO 9001)\b/i.test(text), 'no certificate or baby claim without a supplied document');
  ok(!/Hotel Line/.test(text), 'Hotel Line is not in the System tile');
  ok(sysHtml.length < 19000, `tile 2 is ${sysHtml.length} characters (Ecwid limit is about 20,000)`);
  ok(navHtml.length < 19700, `tile 1 is ${navHtml.length} characters`);
  const ids = [...sysHtml.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  ok(new Set(ids).size === ids.length, 'tile 2: no duplicate ids');
  const both = [...navHtml.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]).concat(ids);
  ok(new Set(both).size === both.length, 'tile 1 + tile 2: no duplicate ids between the tiles');
  // the body-weight ranges are the Hero's own
  for (const r of ['up to 48 kg', '47–83 kg', '85–110 kg', 'from 120 kg']) ok(text.includes(r), `Hero weight range "${r}" present verbatim`);
  // every route of the navigator is a row, with the approved product URLs
  for (const r of ROUTES) for (const m of r.models) {
    const mm = [...collections.mattress.models, ...collections.topper.models].find((x) => x.id === m.id);
    ok(sysHtml.includes(`href="${mm.url}">${mm.name}</a>`), `route "${r.title}": ${mm.name} links to its approved URL`);
  }
  for (const m of collections.topper.models) ok(sysHtml.includes(`href="${m.url}">${m.name}</a>`), `topper row: ${m.name} links to its approved URL`);
  ok(/href="#ddhd-system"[^>]*data-ddhd-system/.test(navHtml) && /id="ddhd-system"/.test(sysHtml), 'tile 1 link and tile 2 id agree (#ddhd-system)');
  ok(/Explore the System/.test(navHtml) && /Explore how every model, material and comfort configuration is built around a real customer need\./.test(navHtml), 'tile 1: the trigger text');
  ok(navHtml.indexOf('ddhd__sys"') > navHtml.indexOf('ddhd__pick') && navHtml.indexOf('ddhd__sys"') < navHtml.indexOf('id="ddhd-mattress"'), 'tile 1: the link sits between the choice and the views (above "What Matters Most to You?")');
  ok(!/<h1/i.test(navHtml), 'tile 1: still no H1');
}

// ---- 2. desktop behaviour ----
{
  const { ctx, page, errors } = await openLive(b, VIEWPORTS.desktop);
  await page.waitForFunction(() => window.DSYS && document.querySelector('#ddhd-system.is-js .dsys__box'), null, { timeout: 15000 });
  const s0 = await page.evaluate(() => ({
    order: (() => { const a = document.querySelector('#ddhd'), s = document.querySelector('#ddhd-system'); return !!(a.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING); })(),
    trig: (() => { const t = document.querySelector('a[data-ddhd-system]'); const r = t.getBoundingClientRect(); const v = document.querySelector('#ddhd-mattress .ddhd__needs').getBoundingClientRect(); const h = document.querySelector('.ddhd__hd').getBoundingClientRect(); return { vis: !t.hidden && r.height > 0, above: r.top >= h.bottom - 1 && r.bottom <= v.top + 1, h: r.height }; })(),
    open: !!document.querySelector('.dsys__dlg.is-open'),
    copies: document.querySelectorAll('#dsys-t1').length,
    cards: document.querySelectorAll('#ddhd-system .dsys__cards a').length,
  }));
  ok(s0.order, 'tile 2 follows the navigator in the page');
  ok(s0.trig.vis && s0.trig.above, `the "Explore the System" link sits under the question and above the needs (${JSON.stringify(s0.trig)})`);
  ok(!s0.open, 'closed on load');
  ok(s0.copies === 1 && s0.cards === 6, 'one copy of each topic; band has 5 topic cards + the story card');

  const y0 = await page.evaluate(() => { window.scrollTo(0, 400); return window.scrollY; });
  await page.hover('a[data-ddhd-system]'); await page.waitForTimeout(350);
  const hov = await page.evaluate(() => getComputedStyle(document.querySelector('a[data-ddhd-system]')).boxShadow);
  ok(/rgb/.test(hov) && hov !== 'none', 'trigger has the ambient hover glow');
  await page.focus('a[data-ddhd-system]');
  await page.keyboard.press('Enter'); await page.waitForTimeout(450);
  const o1 = await page.evaluate(() => {
    const box = document.querySelector('.dsys__box'), dlg = document.querySelector('.dsys__dlg');
    return { open: dlg.classList.contains('is-open'), role: box.getAttribute('role'), modal: box.getAttribute('aria-modal'), label: box.getAttribute('aria-label'), inBody: dlg.parentElement.parentElement === document.body,
      pg: document.querySelector('.dsys__pg').textContent, ovf: document.documentElement.style.overflow, focus: !!document.activeElement.closest('.dsys__box'),
      title: document.querySelector('.dsys__p:not([hidden]) .dsys__h').textContent, shown: [...document.querySelectorAll('.dsys__p')].filter((p) => !p.hidden).length,
      copies: document.querySelectorAll('#dsys-t1').length };
  });
  ok(o1.open && o1.role === 'dialog' && o1.modal === 'true' && /latex sleep system/i.test(o1.label), 'Enter on the link opens one modal dialog with a name');
  ok(o1.inBody, 'the dialog sits under <body> while open (cannot be trapped by a tile)');
  ok(o1.pg === '1 of 5' && /Solutions for Real Needs/.test(o1.title) && o1.shown === 1, `opens on topic 1 ("${o1.pg}")`);
  ok(o1.ovf === 'hidden' && o1.focus && o1.copies === 1, 'page scroll locked, focus inside, still one copy of the content');

  await page.click('.dsys__btn:not(.dsys__btn--ghost)'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => document.querySelector('.dsys__pg').textContent) === '2 of 5', 'Next -> 2 of 5');
  const t2 = await page.evaluate(() => { const p = document.querySelector('.dsys__p:not([hidden])'); return { t: p.innerText, ws: [...p.querySelectorAll('.dsys__w')].map((w) => w.innerText.replace(/\s+/g, ' ')) }; });
  ok(/Arranged for certainty/.test(t2.t) && /Dual Plush/.test(t2.t) && t2.ws.length === 4, 'topic 2 shows the certainty statement, Dual Plush, 4 weight ranges');
  ok(t2.ws.join('|') === 'Soft up to 48 kg|Medium 47–83 kg|Firm 85–110 kg|Extra Firm from 120 kg', `topic 2 ranges: ${t2.ws.join(' | ')}`);
  await page.click('.dsys__btn--ghost'); await page.waitForTimeout(100);
  ok(await page.evaluate(() => document.querySelector('.dsys__pg').textContent) === '1 of 5', 'Previous -> 1 of 5');
  ok(await page.evaluate(() => document.querySelector('.dsys__btn--ghost').disabled), 'Previous is disabled on topic 1');
  for (let i = 1; i <= 5; i++) {
    await page.click(`#dsys-tab-${i}`); await page.waitForTimeout(80);
    const r = await page.evaluate(() => ({ pg: document.querySelector('.dsys__pg').textContent, sel: document.querySelector('.dsys__tab[aria-selected="true"]').id, vis: [...document.querySelectorAll('.dsys__p')].filter((p) => !p.hidden).length }));
    ok(r.pg === `${i} of 5` && r.sel === `dsys-tab-${i}` && r.vis === 1, `direct topic ${i}: ${r.pg}`);
  }
  // keyboard: arrows move between topics, Escape closes and returns focus to the link
  await page.click('#dsys-tab-1'); await page.focus('.dsys__h:visible, .dsys__x'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(80);
  ok(await page.evaluate(() => document.querySelector('.dsys__pg').textContent) === '2 of 5', 'ArrowRight -> next topic');
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(80);
  ok(await page.evaluate(() => document.querySelector('.dsys__pg').textContent) === '1 of 5', 'ArrowLeft -> previous topic');
  // focus trap: many Tab presses never leave the dialog
  let leaked = false;
  for (let i = 0; i < 30; i++) { await page.keyboard.press('Tab'); if (!(await page.evaluate(() => !!document.activeElement.closest('.dsys__box')))) leaked = true; }
  for (let i = 0; i < 12; i++) { await page.keyboard.press('Shift+Tab'); if (!(await page.evaluate(() => !!document.activeElement.closest('.dsys__box')))) leaked = true; }
  ok(!leaked, 'Tab and Shift+Tab keep the focus inside the dialog');
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  const c1 = await page.evaluate(() => ({ open: !!document.querySelector('.dsys__dlg.is-open'), host: document.querySelectorAll('[data-dsys-host]').length, ovf: document.documentElement.style.overflow, back: !!document.querySelector('#ddhd-system .dsys__in .dsys__dlg'), focus: document.activeElement.matches('a[data-ddhd-system]'), y: window.scrollY }));
  ok(!c1.open && c1.host === 0 && c1.back, 'Escape closes; the content returns to its tile (no leftovers under <body>)');
  ok(c1.ovf === '' && Math.abs(c1.y - y0) < 4, `scroll unlocked and the page is where it was (${y0} -> ${c1.y})`);
  ok(c1.focus, 'focus returns to the link that opened the dialog');
  // the band's own cards open the matching topic; a press on the dark area closes
  await page.evaluate(() => document.querySelector('#ddhd-system').scrollIntoView());
  await page.click('.dsys__cards a[data-dsys-open="4"]'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.querySelector('.dsys__pg').textContent) === '4 of 5', 'topic card 4 opens topic 4');
  const dp = await page.evaluate(() => ({ imgs: document.querySelectorAll('.dsys__p:not([hidden]) .dsys__dp img').length, ok: [...document.querySelectorAll('.dsys__p:not([hidden]) .dsys__dp img')].every((i) => /dual-plush-[smfx]-[smfx]\.svg$/.test(i.src)), txt: document.querySelector('.dsys__p:not([hidden])').innerText }));
  ok(dp.imgs === 3 && dp.ok, 'topic 4 uses the three approved Collection Dual Plush diagrams');
  ok(/3 Combinations in Botanic, 2 in Bio Comfort/.test(dp.txt) && /latex topper/i.test(dp.txt), 'topic 4 states 3 + 2 combinations in "latex topper" wording');
  await page.mouse.click(8, 8); await page.waitForTimeout(250);
  ok(!(await page.evaluate(() => !!document.querySelector('.dsys__dlg.is-open'))), 'a press on the dark area closes the dialog');
  // the story: topic 5 -> Next -> story -> "Find Your Latex Mattress" returns to the navigator
  await page.click('.dsys__cards a[data-dsys-open="5"]'); await page.waitForTimeout(250);
  ok(/Next|See the Complete System/.test(await page.evaluate(() => document.querySelector('.dsys__btn:not(.dsys__btn--ghost)').textContent)) && await page.evaluate(() => document.querySelector('.dsys__btn:not(.dsys__btn--ghost)').textContent) === 'See the Complete System', 'topic 5: Next reads "See the Complete System"');
  await page.click('.dsys__btn:not(.dsys__btn--ghost)'); await page.waitForTimeout(200);
  const st = await page.evaluate(() => ({ pg: document.querySelector('.dsys__pg').textContent, fin: document.querySelector('.dsys__p:not([hidden]) .dsys__fin').textContent, steps: document.querySelectorAll('.dsys__p:not([hidden]) .dsys__chain li').length, cta: document.querySelector('.dsys__btn:not(.dsys__btn--ghost)').textContent, ctaVisible: (() => { const r = document.querySelector('.dsys__btn:not(.dsys__btn--ghost)').getBoundingClientRect(); return r.height > 40 && r.bottom <= innerHeight; })() }));
  ok(st.pg === 'Complete Story' && /More than a mattress\. A complete sleep system\./.test(st.fin) && st.steps === 6 && st.cta === 'Find Your Latex Mattress' && st.ctaVisible, 'story: six steps, the final statement, the call to action always in view in the footer');
  await page.click('.dsys__btn:not(.dsys__btn--ghost)'); await page.waitForTimeout(900);
  const f = await page.evaluate(() => ({ open: !!document.querySelector('.dsys__dlg.is-open'), tab: document.querySelector('#ddhd-tab-mattress').getAttribute('aria-selected'), view: !document.querySelector('#ddhd-mattress').hidden, top: document.querySelector('#ddhd').getBoundingClientRect().top, focus: document.activeElement.id, ovf: document.documentElement.style.overflow }));
  ok(!f.open && f.tab === 'true' && f.view && f.ovf === '', 'the final button closes the dialog and shows the mattress choice');
  ok(f.top > -40 && f.top < 200 && f.focus === 'ddhd-tab-mattress', `...at the navigator, focus on the mattress tab (top ${Math.round(f.top)})`);
  // the navigator is still whole
  const nav = await page.evaluate(() => ({ cards: document.querySelectorAll('#ddhd .ddhd__card').length, panels: document.querySelectorAll('.ddhd__panel').length }));
  ok(nav.cards === 11, 'the navigator still has its 11 cards');
  // idempotent init + re-render
  await page.evaluate(() => { window.DSYS.scan(); window.DSYS.scan(); window.DDHD.scan(); });
  ok(await page.evaluate(() => document.querySelectorAll('.dsys__box').length === 1 && document.querySelectorAll('.dsys__nav').length === 1), 'scan() twice: still one dialog frame');
  await page.evaluate((html) => {   // Ecwid re-renders the tile: remove it, put a new copy in the same place
    const s = document.querySelector('#ddhd-system'); const w = s.parentElement; s.remove();
    w.append(document.createRange().createContextualFragment(html));
  }, sysHtml);
  await page.waitForTimeout(200); await page.evaluate(() => window.DSYS.scan());
  ok(await page.evaluate(() => document.querySelectorAll('#ddhd-system').length === 1 && document.querySelectorAll('.dsys__box').length === 1), 're-render: one tile, one frame');
  await page.evaluate(() => document.querySelector('a[data-ddhd-system]').click()); await page.waitForTimeout(300);
  ok(await page.evaluate(() => !!document.querySelector('.dsys__dlg.is-open') && document.querySelector('.dsys__pg').textContent === '1 of 5'), 're-render: the link still opens it');
  await page.evaluate(() => { const s = document.querySelector('#ddhd-system'); s.remove(); window.DSYS.scan(); });
  ok(await page.evaluate(() => document.documentElement.style.overflow === '' && !document.querySelector('[data-dsys-host]')), 'tile removed while open: the page is released');
  ok(errors.length === 0, `no script errors (${errors.join(' / ')})`);
  await ctx.close();
}

// ---- 3. every viewport: fit, targets, type size ----
for (const name of Object.keys(VIEWPORTS)) {
  const { ctx, page } = await openLive(b, VIEWPORTS[name]);
  await page.waitForFunction(() => window.DSYS && document.querySelector('#ddhd-system.is-js .dsys__box'), null, { timeout: 15000 });
  const band = await page.evaluate(() => { const s = document.querySelector('#ddhd-system'); return { over: document.documentElement.scrollWidth - window.innerWidth, minH: Math.min(...[...s.querySelectorAll('.dsys__band a')].map((a) => a.getBoundingClientRect().height)), tr: document.querySelector('a[data-ddhd-system]').getBoundingClientRect() }; });
  ok(band.over <= 0, `${name}: no horizontal page overflow with both tiles (${band.over})`);
  ok(band.minH >= 44, `${name}: band cards are at least 44px high (${Math.round(band.minH)})`);
  await page.evaluate(() => document.querySelector('a[data-ddhd-system]').click()); await page.waitForTimeout(300);
  for (let i = 1; i <= 5; i++) {
    await page.click(`#dsys-tab-${i}`); await page.waitForTimeout(120);
    const r = await page.evaluate(() => {
      const box = document.querySelector('.dsys__box'), body = document.querySelector('.dsys__body'), p = document.querySelector('.dsys__p:not([hidden])');
      const small = []; const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) { const n = walker.currentNode; if (!n.textContent.trim()) continue; const cs = getComputedStyle(n.parentElement); if (parseFloat(cs.fontSize) < 16 || parseInt(cs.fontWeight, 10) < 400) small.push(n.textContent.trim().slice(0, 30) + ':' + cs.fontSize + '/' + cs.fontWeight); }
      const ctl = [...box.querySelectorAll('button,a')].filter((e) => e.offsetParent && !e.hidden).map((e) => e.getBoundingClientRect()).filter((r) => r.height > 0);
      const tabs = [...box.querySelectorAll('.dsys__tab')].map((t) => t.getBoundingClientRect().height);
      return { hOver: body.scrollWidth - body.clientWidth, boxOver: box.scrollWidth - box.clientWidth, small, minCtl: Math.min(...ctl.map((r) => r.height)), minTab: Math.min(...tabs), fits: box.getBoundingClientRect().bottom <= window.innerHeight + 1 && box.getBoundingClientRect().right <= window.innerWidth + 1 };
    });
    ok(r.hOver <= 1 && r.boxOver <= 1, `${name} topic ${i}: no horizontal overflow in the dialog (${r.hOver}/${r.boxOver})`);
    ok(r.small.length === 0, `${name} topic ${i}: all text is 16px or larger and never thin (${r.small.slice(0, 3)})`);
    ok(r.minCtl >= 44 && r.minTab >= 44, `${name} topic ${i}: every control is at least 44px high (${Math.round(r.minCtl)}/${Math.round(r.minTab)})`);
    ok(r.fits, `${name} topic ${i}: the dialog fits the screen`);
  }
  await ctx.close();
}

// ---- 4. touch: swipe, and the phone's reach ----
{
  const { ctx, page } = await openLive(b, VIEWPORTS.phone);
  await page.waitForFunction(() => window.DSYS && document.querySelector('#ddhd-system.is-js .dsys__box'), null, { timeout: 15000 });
  await page.evaluate(() => document.querySelector('a[data-ddhd-system]').click()); await page.waitForTimeout(300);
  const swipe = (dx, dy = 0) => page.evaluate(([dx, dy]) => {
    const body = document.querySelector('.dsys__body');
    const mk = (type, x, y) => { const t = new Touch({ identifier: 1, target: body, clientX: x, clientY: y }); return new TouchEvent(type, { touches: type === 'touchend' ? [] : [t], changedTouches: [t], bubbles: true, cancelable: true }); };
    body.dispatchEvent(mk('touchstart', 200, 300)); body.dispatchEvent(mk('touchend', 200 + dx, 300 + dy));
  }, [dx, dy]);
  await swipe(-140); await page.waitForTimeout(150);
  ok(await page.evaluate(() => document.querySelector('.dsys__pg').textContent) === '2 of 5', 'swipe left -> next topic');
  await swipe(140); await page.waitForTimeout(150);
  ok(await page.evaluate(() => document.querySelector('.dsys__pg').textContent) === '1 of 5', 'swipe right -> previous topic');
  await swipe(-30, 120); await page.waitForTimeout(150);
  ok(await page.evaluate(() => document.querySelector('.dsys__pg').textContent) === '1 of 5', 'a vertical scroll is not a swipe');
  await swipe(-140); await swipe(-140); await swipe(-140); await swipe(-140); await swipe(-140); await swipe(-140); await page.waitForTimeout(200);
  ok(await page.evaluate(() => document.querySelector('.dsys__pg').textContent) === 'Complete Story', 'swiping on reaches the story and stops there');
  await ctx.close();
}

// ---- 5. reduced motion: nothing moves by itself ----
{
  const { ctx, page } = await openLive(b, VIEWPORTS.desktop, { motion: 'reduce' });
  await page.waitForFunction(() => window.DSYS && document.querySelector('#ddhd-system.is-js .dsys__box'), null, { timeout: 15000 });
  await page.evaluate(() => document.querySelector('a[data-ddhd-system]').click()); await page.waitForTimeout(3500);
  const r = await page.evaluate(() => ({ pg: document.querySelector('.dsys__pg').textContent, anim: getComputedStyle(document.querySelector('.dsys__box')).animationName }));
  ok(r.pg === '1 of 5', 'no automatic carousel: still 1 of 5 after 3.5 s');
  ok(r.anim === 'none', `reduced motion: the dialog does not animate (${r.anim})`);
  await ctx.close();
}

// ---- 6. a missing picture must not break anything ----
{
  const { ctx, page, errors } = await openLive(b, VIEWPORTS.desktop);
  await page.route(/dual-plush-[smfx]-[smfx]\.svg|bio-dunlop\.svg/, (r) => r.abort());
  await page.evaluate(() => document.querySelector('a[data-ddhd-system]').click()); await page.waitForTimeout(300);
  await page.click('#dsys-tab-4'); await page.click('#dsys-tab-5'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => !!document.querySelector('.dsys__dlg.is-open') && /Certified European production/.test(document.querySelector('.dsys__p:not([hidden])').innerText)), 'pictures blocked: the text still reads and the dialog still works');
  await ctx.close();
}

// ---- 7. tile 1 without tile 2: the link hides itself instead of leading nowhere ----
{
  process.env.DDHD_NO_SYSTEM = '1';
  const { ctx, page } = await openLive(b, VIEWPORTS.desktop);
  const hidden = await page.evaluate(() => document.querySelector('a[data-ddhd-system]').hidden || document.querySelector('a[data-ddhd-system]').getBoundingClientRect().height === 0);
  ok(hidden, 'navigator installed alone: the "Explore the System" link is hidden');
  delete process.env.DDHD_NO_SYSTEM;
  await ctx.close();
}

// ---- 8. no script: both tiles read as complete documents ----
{
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.route(PREVIEW_HOST + '**', (route) => { const f = path.join(root, 'release', VERSION, new URL(route.request().url()).pathname); route.fulfill({ status: 200, contentType: f.endsWith('.css') ? 'text/css' : 'application/octet-stream', body: fs.existsSync(f) ? fs.readFileSync(f) : '' }); });
  await page.route('https://nojs.test/', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><meta charset=utf-8><body style="margin:0">' + navHtml + sysHtml }));
  await page.goto('https://nojs.test/');
  const n = await page.evaluate(() => ({ panels: [...document.querySelectorAll('.dsys__p')].filter((p) => p.offsetParent && p.getBoundingClientRect().height > 40).length, link: !document.querySelector('a[data-ddhd-system]').hidden && document.querySelector('a[data-ddhd-system]').getBoundingClientRect().height > 0, dlg: getComputedStyle(document.querySelector('.dsys__dlg')).display, over: document.documentElement.scrollWidth - innerWidth }));
  ok(n.panels === 6 && n.dlg !== 'none', `no-JS: five topics and the story are all visible, one after another (${n.panels})`);
  ok(n.link, 'no-JS: the navigator link is visible and scrolls to the System tile');
  ok(n.over <= 0, 'no-JS: no horizontal overflow');
  await ctx.close();
}

// ---- 9. colour pairs (the real tokens) ----
{
  const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const cr = (a, b2) => { const [x, y] = [lum(a), lum(b2)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const pairs = [['#f7fbfd', '#1c2939', 'snow on graphite'], ['#d5e8f1', '#1c2939', 'ice on graphite'], ['#a4d4dc', '#1c2939', 'aqua on graphite'], ['#a4d4dc', '#243449', 'aqua on the dialog top'], ['#d5e8f1', '#243449', 'ice on the dialog top'], ['#0e2234', '#a4d4dc', 'ink on aqua (buttons)'], ['#0e2234', '#e6f4f9', 'ink on the light card'], ['#174d75', '#e6f4f9', 'blue on the light card'], ['#174d75', '#ffffff', 'trigger button blue on white']];
  for (const [a, b2, n] of pairs) ok(cr(a, b2) >= 7, `contrast ${n}: ${cr(a, b2).toFixed(1)}:1 (needs 7:1)`);
}

await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) { console.log(failures.join('\n')); process.exit(1); }
