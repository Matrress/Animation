/*
 * READ-ONLY, LOCAL. THE TWO GALLERIES (owner, 26 Nov): on a copy of the REAL test product page (this browser only, nothing saved, no cart request),
 * with the standard module and the television build put in.
 *   G1  the shop's own picture block is not shown where the module stands (a big picture put into it stays 1 px): nothing is pushed apart under the television
 *   G2  TELEVISION, Your selection: slide 0 is the mattress with its Ready mark, then one slide per picture; every picture is fitted whole (contain) and stays inside the card
 *   G3  swiping (scroll) moves the dots; the dots and the arrows work; opening a topic brings its own picture (Comfort -> the comfort picture)
 *   G4  a tap enlarges the picture, but only inside the screen's own frame (the monitor); the X, Esc and a tap outside close it; the card is as it was
 *   G5  STANDARD MODULE: the header's photo slot is a gallery (slider, dots), every picture fitted whole; the dots and arrows work; a tap opens the lightbox, the X and Esc close it
 *   G6  all the pictures load from the real media host (no mock) and each has alt text and size
 *   Run after `node tools/build-standard-module.mjs` and `node tools/build-experience.mjs`.
 */
const { chromium } = require('playwright'); const fs = require('fs'); const R = '/home/user/Animation/experience-tv/';
const js = fs.readFileSync(R + 'dist/experience/botanic-tv.js', 'utf8'), logos = fs.readFileSync(R + 'dist/experience/' + fs.readdirSync(R + 'dist/experience').find((f) => /^botanic-tv-logos-[0-9a-f]{20}\.js$/.test(f)), 'utf8');
const html = fs.readFileSync(R + 'dist/standard/botanic-standard-description.html', 'utf8');
const URL = 'https://divinedunlop.com/products/botanic-experience-tv-test-draft?cb=' + Date.now();
let fails = 0; const ok = (c, m, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (d ? '  [' + d + ']' : '')); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const vp = { width: 1366, height: 1024 };
  const ctx = await b.newContext({ viewport: vp, screen: vp }); const p = await ctx.newPage(); const errs = [], bad = [];
  p.on('pageerror', (e) => { if (!/in promise/.test(e.message)) errs.push(e.message.slice(0, 90)); });
  p.on('response', (r) => { if (/media\.divinedunlop\.com\/ddtv\/botanic-gal-/.test(r.url()) && r.status() !== 200) bad.push(r.status() + ' ' + r.url().split('/').pop()); });
  await p.route(/media\.divinedunlop\.com\/ddtv\/botanic-tv-[0-9a-f]{20}\.js/, (r) => r.abort());
  await p.route(/media\.divinedunlop\.com\/ddtv\/botanic-tv-logos-[0-9a-f]{20}\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: logos }));
  await p.goto(URL, { waitUntil: 'commit', timeout: 90000 }); await p.waitForSelector('.details-product-option select', { timeout: 80000 }); await p.waitForTimeout(3500);
  try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2000 }); } catch (e) { /* none */ }
  await p.waitForTimeout(1500);
  await p.evaluate((h) => { const o = document.querySelector('.dd-botanic-page'); (o ? o.parentElement : document.querySelector('.product-details__description')).innerHTML = h; }, html); await p.waitForTimeout(1500);
  // a big picture in the shop's own picture block (as when the owner gave the product a main picture)
  await p.evaluate(() => { const g = document.querySelector('.product-details__gallery'); if (g) { g.classList.remove('details-gallery--no-images'); g.innerHTML = '<div id="fakepic" style="width:900px;height:700px;background:#7aa"></div>'; } });
  await p.evaluate((code) => { window.__ddtvAllow = [876405767]; (0, eval)(code); }, js);
  await p.waitForSelector('#ddtv-experience', { timeout: 30000 }); await p.waitForTimeout(3500);
  // G1
  const g1 = await p.evaluate(() => { const g = document.querySelector('.product-details__gallery'), r = g.getBoundingClientRect(), f = document.getElementById('fakepic').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), picH: Math.round(f.height) }; });
  ok(g1.w <= 2 && g1.h <= 2, 'G1 a big picture in the shop\'s own picture block takes no room where the module stands', JSON.stringify(g1));
  // G2
  const g2 = await p.evaluate(() => { const sh = document.getElementById('ddtv-experience').shadowRoot, mi = sh.querySelector('#mi'), mr = mi.getBoundingClientRect(); const sl = [...mi.querySelectorAll('.mg-s')]; const imgs = [...mi.querySelectorAll('img.gp')];
    return { n: sl.length, s0: !!mi.querySelector('.mg-s0 .mic img'), cont: imgs.every((i) => getComputedStyle(i).objectFit === 'contain'), inside: imgs.every((i) => { const r = i.getBoundingClientRect(), s = i.closest('.mg-s').getBoundingClientRect(); return r.width <= s.width + 1 && r.height <= s.height + 1; }), alt: imgs.every((i) => (i.getAttribute('alt') || '').length > 10 && +i.getAttribute('width') > 100), dots: mi.querySelectorAll('.mg-dot').length, card: [Math.round(mr.width), Math.round(mr.height)] }; });
  ok(g2.n === 8 && g2.s0 && g2.cont && g2.inside && g2.alt && g2.dots === 8, 'G2 Your selection: the mattress slide + 7 pictures, each fitted whole (contain), inside the card, with alt text and size; 8 dots', JSON.stringify(g2));
  // G3
  const swipe = await p.evaluate(async () => { const sh = document.getElementById('ddtv-experience').shadowRoot, v = sh.querySelector('#mi .mg-v'); v.scrollTo({ left: v.clientWidth * 3, behavior: 'auto' }); await new Promise((r) => setTimeout(r, 400)); const cur = [...sh.querySelectorAll('#mi .mg-dot')].findIndex((d) => d.getAttribute('aria-current') === 'true'); return cur; });
  ok(swipe === 3, 'G3a after a swipe to the 4th picture the 4th dot is the current one', 'dot ' + swipe);
  await p.evaluate(() => { document.getElementById('ddtv-experience').shadowRoot.querySelector('#mi .mg-dot[data-mgi="5"]').click(); }); await p.waitForTimeout(900);
  const dot5 = await p.evaluate(() => { const v = document.getElementById('ddtv-experience').shadowRoot.querySelector('#mi .mg-v'); return Math.round(v.scrollLeft / v.clientWidth); });
  await p.evaluate(() => { document.getElementById('ddtv-experience').shadowRoot.querySelector('#mi .mg-next').click(); }); await p.waitForTimeout(900);
  const nxt = await p.evaluate(() => { const v = document.getElementById('ddtv-experience').shadowRoot.querySelector('#mi .mg-v'); return Math.round(v.scrollLeft / v.clientWidth); });
  ok(dot5 === 5 && nxt === 6, 'G3b a tap on a dot and on the arrow moves the pictures', dot5 + ' then ' + nxt);
  const topicKeys = await p.evaluate(() => [...document.getElementById('ddtv-experience').shadowRoot.querySelectorAll('#mi .mg-s[data-key]')].map((s) => s.dataset.key));
  const topic = async (id) => { await p.evaluate((i) => { const b = document.getElementById('ddtv-experience').shadowRoot.querySelector('[data-ch="' + i + '"]'); b && b.click(); }, id); await p.waitForTimeout(1300); return p.evaluate(() => { const v = document.getElementById('ddtv-experience').shadowRoot.querySelector('#mi .mg-v'); const i = Math.round(v.scrollLeft / v.clientWidth); const s = v.querySelectorAll('.mg-s')[i]; return s ? s.dataset.key || 'mattress' : null; }); };
  const t1 = await topic('comfort'), t2 = await topic('zones'), t3 = await topic('support');
  ok(t1 === 'comfort' && t2 === 'zones' && t3 === 'support' && topicKeys.includes('comfort'), 'G3c opening a topic brings its own picture (Comfort, 7-Zone, Support)', [t1, t2, t3].join(' / ') + ' of ' + topicKeys.join(','));
  // G4
  await p.evaluate(() => { document.getElementById('ddtv-experience').shadowRoot.querySelector('#mi .mg-s[data-key="comfort"] .mg-p').click(); }); await p.waitForTimeout(600);
  const g4 = await p.evaluate(() => { const h = document.getElementById('ddtv-experience'), sh = h.shadowRoot, z = sh.querySelector('#mgz'), m = sh.querySelector('.monitor'); if (!z || z.hidden) return { open: false }; const zr = z.getBoundingClientRect(), mr = m.getBoundingClientRect(), im = z.querySelector('img').getBoundingClientRect(); return { open: true, inMonitor: zr.left >= mr.left - 1 && zr.top >= mr.top - 1 && zr.right <= mr.right + 1 && zr.bottom <= mr.bottom + 1, imgInside: im.left >= zr.left - 1 && im.right <= zr.right + 1 && im.top >= zr.top - 1 && im.bottom <= zr.bottom + 1, close: !!z.querySelector('[data-mgzc]'), count: (z.querySelector('.mg-zt b') || {}).textContent }; });
  ok(g4.open && g4.inMonitor && g4.imgInside && g4.close, 'G4a a tap enlarges the picture, only inside the screen\'s own frame, with a close button', JSON.stringify(g4));
  await p.evaluate(() => { document.getElementById('ddtv-experience').shadowRoot.querySelector('#mgz [data-mgzs="1"]').click(); }); await p.waitForTimeout(400);
  const nextCount = await p.evaluate(() => document.getElementById('ddtv-experience').shadowRoot.querySelector('#mgz .mg-zt b').textContent);
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  const closedEsc = await p.evaluate(() => document.getElementById('ddtv-experience').shadowRoot.querySelector('#mgz').hidden);
  await p.evaluate(() => { document.getElementById('ddtv-experience').shadowRoot.querySelector('#mi .mg-p').click(); }); await p.waitForTimeout(400);
  await p.evaluate(() => { document.getElementById('ddtv-experience').shadowRoot.querySelector('#mgz [data-mgzc]').click(); }); await p.waitForTimeout(300);
  const closedX = await p.evaluate(() => document.getElementById('ddtv-experience').shadowRoot.querySelector('#mgz').hidden);
  await p.evaluate(() => { document.getElementById('ddtv-experience').shadowRoot.querySelector('#mi .mg-p').click(); }); await p.waitForTimeout(400);
  await p.evaluate(() => { const z = document.getElementById('ddtv-experience').shadowRoot.querySelector('#mgz'); z.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await p.waitForTimeout(300);
  const closedTap = await p.evaluate(() => document.getElementById('ddtv-experience').shadowRoot.querySelector('#mgz').hidden);
  ok(/ \/ 8$/.test(nextCount || '') && closedEsc && closedX && closedTap, 'G4b the enlarged picture has next/previous; Esc, the X and a tap outside close it', 'counter ' + nextCount + ' | esc ' + closedEsc + ' x ' + closedX + ' tap ' + closedTap);
  // G5: the standard view
  await p.evaluate(() => { const b = document.getElementById('ddtv-to-standard'); b && b.click(); }); await p.waitForTimeout(1800);
  const g5 = await p.evaluate(() => { const g = document.querySelector('.dd-gal'); if (!g) return { found: false }; const sl = [...g.querySelectorAll('.dd-gal__s')], imgs = [...g.querySelectorAll('.dd-gal__s img')]; const gr = g.getBoundingClientRect();
    return { found: true, wired: g.getAttribute('data-ddg'), n: sl.length, dots: g.querySelectorAll('.dd-gal__dot').length, cont: imgs.every((i) => getComputedStyle(i).objectFit === 'contain'), inside: imgs.every((i) => { const r = i.getBoundingClientRect(), s = i.closest('.dd-gal__s').getBoundingClientRect(); return r.width <= s.width + 1 && r.height <= s.height + 1; }), alt: imgs.every((i) => (i.getAttribute('alt') || '').length > 10 && +i.getAttribute('width') > 100), size: [Math.round(gr.width), Math.round(gr.height)], arrows: g.querySelectorAll('.dd-gal__a').length }; });
  ok(g5.found && g5.wired === '1' && g5.n === 8 && g5.dots === 8 && g5.cont && g5.inside && g5.alt && g5.arrows === 2 && g5.size[0] > 200 && g5.size[0] < 700, 'G5a the module\'s header photo slot is a gallery: 8 pictures, 8 dots, 2 arrows, every picture fitted whole, a moderate size', JSON.stringify(g5));
  await p.evaluate(() => { document.querySelectorAll('.dd-gal__dot')[4].click(); }); await p.waitForTimeout(900);
  const m4 = await p.evaluate(() => { const v = document.querySelector('.dd-gal__v'); return { i: Math.round(v.scrollLeft / v.clientWidth), on: [...document.querySelectorAll('.dd-gal__dot')].findIndex((d) => /\bon\b/.test(d.className)) }; });
  await p.evaluate(() => { document.querySelector('.dd-gal__next').click(); }); await p.waitForTimeout(900);
  const m5 = await p.evaluate(() => { const v = document.querySelector('.dd-gal__v'); return Math.round(v.scrollLeft / v.clientWidth); });
  ok(m4.i === 4 && m4.on === 4 && m5 === 5, 'G5b a tap on a dot and on the arrow moves the pictures and the dots', JSON.stringify(m4) + ' then ' + m5);
  await p.evaluate(() => { document.querySelectorAll('.dd-gal__s img')[2].click(); }); await p.waitForTimeout(600);
  const lb = await p.evaluate(() => { const l = document.getElementById('ddtv-lb'); if (!l) return { open: false }; const r = l.getBoundingClientRect(), im = l.querySelector('img').getBoundingClientRect(); return { open: true, full: Math.round(r.width) === innerWidth && Math.round(r.height) === innerHeight, imgOk: im.width > 300 && im.right <= r.right + 1 && im.bottom <= r.bottom + 1, close: !!l.querySelector('[data-s="x"]'), counter: l.querySelector('.ddtv-lb__t b').textContent }; });
  ok(lb.open && lb.full && lb.imgOk && lb.close, 'G5c a tap on a picture opens it large over the page, with a close button', JSON.stringify(lb));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300); const lbEsc = await p.evaluate(() => !document.getElementById('ddtv-lb'));
  await p.evaluate(() => { document.querySelectorAll('.dd-gal__s img')[1].click(); }); await p.waitForTimeout(400); await p.evaluate(() => { document.querySelector('#ddtv-lb [data-s="x"]').click(); }); await p.waitForTimeout(300); const lbX = await p.evaluate(() => !document.getElementById('ddtv-lb'));
  ok(lbEsc && lbX && await p.evaluate(() => document.documentElement.style.overflow === ''), 'G5d Esc and the X close it and give the page its scrolling back', 'esc ' + lbEsc + ' x ' + lbX);
  // G6
  const pics = await p.evaluate(() => [...document.querySelectorAll('.dd-gal__s img')].map((i) => i.src));
  const codes = []; for (const u of pics) codes.push(+require('child_process').execFileSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', u]).toString());
  ok(pics.length === 8 && codes.every((c) => c === 200) && bad.length === 0, 'G6 all pictures are on the real media host (no mock)', codes.join(',') + (bad.length ? ' bad: ' + bad.join(' ') : ''));
  ok(errs.length === 0, 'no page error of ours', errs.join(' | '));
  console.log(fails ? `\n${fails} gallery check(s) FAILED` : '\nAll gallery checks passed (real Ecwid page, this browser only, nothing saved)'); await b.close(); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
