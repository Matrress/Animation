/*
 * READ-ONLY, LOCAL. THE TWO GALLERIES (owner, 26-27 Nov): on a copy of the REAL test product page (this browser only, nothing saved, no cart request),
 * with the standard module and the television build put in.
 *   G1  the shop's own picture block is not shown where the module stands (a big picture put into it stays 1 px): nothing is pushed apart under the television
 *   G2  TELEVISION, Your selection: slide 0 is the mattress with its Ready mark, then one slide per picture (8); every picture is fitted whole and stays inside the card; NO field behind any picture; cut-outs carry a shadow
 *   G3  swiping moves the dots; the dots work; there are NO arrows in the card; opening a topic brings its picture, and a part of a topic its own (Adaptation -> Adjustable beds)
 *   G4  a tap enlarges the picture, inside the screen's own frame and at most 70 % of it, no field behind it, a close X, TWO NAVIGATION ARROWS (previous / next, round-robin); the dots, Esc and a tap outside work
 *   G5  STANDARD MODULE: the header's photo slot is a gallery (slider, round dots, no arrows in the slot, no field; the first picture is the large COVER of the header, the others fitted whole); the dots work; a tap opens the picture at most 70 % of the screen; the X and Esc close it
 *   G6  all the pictures load from the real media host (no mock)
 *   Run after `node tools/build-standard-module.mjs` and `node tools/build-experience.mjs`.
 */
const { chromium } = require('playwright'); const fs = require('fs'); const R = '/home/user/Animation/experience-tv/';
const js = fs.readFileSync(R + 'dist/experience/botanic-tv.js', 'utf8'), logos = fs.readFileSync(R + 'dist/experience/' + fs.readdirSync(R + 'dist/experience').find((f) => /^botanic-tv-logos-[0-9a-f]{20}\.js$/.test(f)), 'utf8');
const html = fs.readFileSync(R + 'dist/standard/botanic-standard-description.html', 'utf8');
const GJ = JSON.parse(fs.readFileSync(R + 'products/botanic.gallery.json', 'utf8')), NG = GJ.items.length, NCUT = GJ.items.filter((x) => x.cut).length;   // TV: the mattress slide + NG; module: the cover + the mattress + NG
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
    const clear = (e) => { const c = getComputedStyle(e).backgroundColor; return c === 'rgba(0, 0, 0, 0)' || c === 'transparent'; };
    return { n: sl.length, s0: !!mi.querySelector('.mg-s0 .mic img'), cont: imgs.every((i) => getComputedStyle(i).objectFit === 'contain'), inside: imgs.every((i) => { const r = i.getBoundingClientRect(), s = i.closest('.mg-s').getBoundingClientRect(); return r.width <= s.width + 1 && r.height <= s.height + 1; }), alt: imgs.every((i) => (i.getAttribute('alt') || '').length > 10 && +i.getAttribute('width') > 100), dots: mi.querySelectorAll('.mg-dot').length, noField: sl.every(clear) && imgs.every(clear) && clear(mi.querySelector('.mg-v')), shadow: imgs.filter((i) => i.closest('.cut')).every((i) => /drop-shadow/.test(getComputedStyle(i).filter)), cuts: imgs.filter((i) => i.closest('.cut')).length, round: [...mi.querySelectorAll('.mg-dot')].every((d) => getComputedStyle(d).borderTopLeftRadius === '50%' || parseFloat(getComputedStyle(d).borderTopLeftRadius) >= 7), arrows: mi.querySelectorAll('.mg-a,[data-mgstep]').length, card: [Math.round(mr.width), Math.round(mr.height)] }; });
  ok(g2.n === NG + 1 && g2.s0 && g2.cont && g2.inside && g2.alt && g2.dots === NG + 1 && g2.noField && g2.shadow && g2.cuts === NCUT && g2.round && g2.arrows === 0, 'G2 Your selection: the mattress slide + every picture of the list, fitted whole, inside the card, no field behind any, cut-outs with a shadow, round dots, no arrows', JSON.stringify(g2));
  // G3
  const swipe = await p.evaluate(async () => { const sh = document.getElementById('ddtv-experience').shadowRoot, v = sh.querySelector('#mi .mg-v'); v.scrollTo({ left: v.clientWidth * 3, behavior: 'auto' }); await new Promise((r) => setTimeout(r, 400)); return [...sh.querySelectorAll('#mi .mg-dot')].findIndex((d) => d.getAttribute('aria-current') === 'true'); });
  ok(swipe === 3, 'G3a after a swipe to the 4th picture the 4th dot is the current one', 'dot ' + swipe);
  await p.evaluate(() => { document.getElementById('ddtv-experience').shadowRoot.querySelector('#mi .mg-dot[data-mgi="6"]').click(); }); await p.waitForTimeout(900);
  const d6 = await p.evaluate(() => { const v = document.getElementById('ddtv-experience').shadowRoot.querySelector('#mi .mg-v'); return Math.round(v.scrollLeft / v.clientWidth); });
  await p.evaluate(() => { document.getElementById('ddtv-experience').shadowRoot.querySelector('#mi .mg-dot[data-mgi="2"]').click(); }); await p.waitForTimeout(900);
  const d2 = await p.evaluate(() => { const v = document.getElementById('ddtv-experience').shadowRoot.querySelector('#mi .mg-v'); return Math.round(v.scrollLeft / v.clientWidth); });
  ok(d6 === 6 && d2 === 2, 'G3b a tap on a dot moves the pictures (forward and back)', d6 + ' then ' + d2);
  const topic = async (id, pn) => { await p.evaluate(([i, q]) => { const r = document.getElementById('ddtv-experience').shadowRoot; const b = r.querySelector('[data-ch="' + i + '"]'); b && b.click(); if (q) { const c = r.querySelector('[data-pn="' + q + '"]'); c && c.click(); } }, [id, pn]); await p.waitForTimeout(1400); return p.evaluate(() => { const v = document.getElementById('ddtv-experience').shadowRoot.querySelector('#mi .mg-v'); const i = Math.round(v.scrollLeft / v.clientWidth); const s = v.querySelectorAll('.mg-s')[i]; return s ? s.dataset.key || 'mattress' : null; }); };
  const tk = []; for (const [id, pn] of [['comfort'], ['zones'], ['support'], ['benefits'], ['hygiene'], ['adaptation'], ['adaptation', 'adjustable'], ['support', 'surface'], ['comfort', 'surface'], ['ventilation'], ['discover']]) tk.push(await topic(id, pn));
  ok(tk.join(',') === 'comfort,zones,support,benefits,hygiene,adaptation,adaptation/adjustable,support/surface,support/surface,ventilation,discover', 'G3c opening a topic brings its own picture; a part of a topic its own (Adjustable beds); one picture serves two parts (Keeps You On The Surface in Support and in Comfort); Ventilation its own', tk.join(', '));
  // G4
  await p.evaluate(() => { document.getElementById('ddtv-experience').shadowRoot.querySelector('#mi .mg-s[data-key="adaptation"] .mg-p').click(); }); await p.waitForTimeout(700);
  const g4 = await p.evaluate(() => { const h = document.getElementById('ddtv-experience'), sh = h.shadowRoot, z = sh.querySelector('#mgz'), m = sh.querySelector('.monitor'); if (!z || z.hidden) return { open: false }; const zr = z.getBoundingClientRect(), mr = m.getBoundingClientRect(), ib = z.querySelector('.mg-zb').getBoundingClientRect(), im = z.querySelector('img').getBoundingClientRect(); const clear = (e) => getComputedStyle(e).backgroundColor === 'rgba(0, 0, 0, 0)';
    return { open: true, inMonitor: zr.left >= mr.left - 1 && zr.top >= mr.top - 1 && zr.right <= mr.right + 1 && zr.bottom <= mr.bottom + 1, share: [Math.round(ib.width / mr.width * 100), Math.round(ib.height / mr.height * 100)], imgShare: [Math.round(im.width / mr.width * 100), Math.round(im.height / mr.height * 100)], noField: clear(z.querySelector('.mg-zb')) && clear(z.querySelector('img')), close: !!z.querySelector('[data-mgzc]'), arrows: z.querySelectorAll('.mg-zn').length, dots: z.querySelectorAll('.mg-dot').length }; });
  ok(g4.open && g4.inMonitor && g4.share[0] <= 71 && g4.share[1] <= 71 && g4.imgShare[0] <= 71 && g4.imgShare[1] <= 71 && g4.noField && g4.close && g4.arrows === 2 && g4.dots === NG + 1, 'G4a a tap enlarges the picture inside the screen\'s frame, at most 70 % of it, no field behind it, a close X, dots, no arrows', JSON.stringify(g4));
  await p.evaluate(() => { document.getElementById('ddtv-experience').shadowRoot.querySelector('#mgz .mg-dot[data-mgzi="5"]').click(); }); await p.waitForTimeout(400);
  const zl = await p.evaluate(() => document.getElementById('ddtv-experience').shadowRoot.querySelector('#mgz .mg-zt').textContent);
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  const closedEsc = await p.evaluate(() => document.getElementById('ddtv-experience').shadowRoot.querySelector('#mgz').hidden);
  await p.evaluate(() => { document.getElementById('ddtv-experience').shadowRoot.querySelector('#mi .mg-p').click(); }); await p.waitForTimeout(400);
  await p.evaluate(() => { document.getElementById('ddtv-experience').shadowRoot.querySelector('#mgz [data-mgzc]').click(); }); await p.waitForTimeout(300);
  const closedX = await p.evaluate(() => document.getElementById('ddtv-experience').shadowRoot.querySelector('#mgz').hidden);
  await p.evaluate(() => { document.getElementById('ddtv-experience').shadowRoot.querySelector('#mi .mg-p').click(); }); await p.waitForTimeout(400);
  await p.evaluate(() => { const z = document.getElementById('ddtv-experience').shadowRoot.querySelector('#mgz'); z.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await p.waitForTimeout(300);
  const closedTap = await p.evaluate(() => document.getElementById('ddtv-experience').shadowRoot.querySelector('#mgz').hidden);
  ok(zl.length > 2 && closedEsc && closedX && closedTap, 'G4b in the enlarged view the dots move to another picture (its name is under it); Esc, the X and a tap outside close it', 'label ' + zl + ' | esc ' + closedEsc + ' x ' + closedX + ' tap ' + closedTap);
  // G5: the standard view
  await p.evaluate(() => { const b = document.getElementById('ddtv-to-standard'); b && b.click(); }); await p.waitForTimeout(1800);
  const g5 = await p.evaluate(() => { const g = document.querySelector('.dd-gal'); if (!g) return { found: false }; const sl = [...g.querySelectorAll('.dd-gal__s')], imgs = [...g.querySelectorAll('.dd-gal__s img')]; const gr = g.getBoundingClientRect(); const clear = (e) => getComputedStyle(e).backgroundColor === 'rgba(0, 0, 0, 0)';
    return { found: true, wired: g.getAttribute('data-ddg'), n: sl.length, dots: g.querySelectorAll('.dd-gal__dot').length, cont: imgs.filter((i) => !i.closest('.dd-cover')).every((i) => getComputedStyle(i).objectFit === 'contain') && imgs.filter((i) => i.closest('.dd-cover')).every((i) => getComputedStyle(i).objectFit === 'cover'), inside: imgs.every((i) => { const r = i.getBoundingClientRect(), s = i.closest('.dd-gal__s').getBoundingClientRect(); return r.width <= s.width + 1 && r.height <= s.height + 1; }), alt: imgs.every((i) => (i.getAttribute('alt') || '').length > 10 && +i.getAttribute('width') > 100), noField: clear(g) && sl.every(clear) && imgs.every(clear), round: [...g.querySelectorAll('.dd-gal__dot')].every((d) => parseFloat(getComputedStyle(d).borderTopLeftRadius) >= 3), arrows: g.querySelectorAll('button').length, size: [Math.round(gr.width), Math.round(gr.height)] }; });
  ok(g5.found && g5.wired === '1' && g5.n === NG + 2 && g5.dots === NG + 2 && g5.cont && g5.inside && g5.alt && g5.noField && g5.round && g5.arrows === 0 && g5.size[0] > 200 && g5.size[0] < 700, 'G5a the module\'s header photo slot is a gallery: the pictures after the cover, round dots, no arrows, no field behind any, the first one a cover, the others fitted whole', JSON.stringify(g5));
  await p.evaluate(() => { document.querySelectorAll('.dd-gal__dot')[4].click(); }); await p.waitForTimeout(900);
  const m4 = await p.evaluate(() => { const v = document.querySelector('.dd-gal__v'); return { i: Math.round(v.scrollLeft / v.clientWidth), on: [...document.querySelectorAll('.dd-gal__dot')].findIndex((d) => /\bon\b/.test(d.className)) }; });
  ok(m4.i === 4 && m4.on === 4, 'G5b a tap on a dot moves the pictures and the dots', JSON.stringify(m4));
  await p.evaluate(() => { document.querySelectorAll('.dd-gal__s img')[2].click(); }); await p.waitForTimeout(600);
  const lb = await p.evaluate(() => { const l = document.getElementById('ddtv-lb'); if (!l) return { open: false }; const r = l.getBoundingClientRect(), bx = l.querySelector('.ddtv-lb__b').getBoundingClientRect(), im = l.querySelector('img').getBoundingClientRect(); return { open: true, share: [Math.round(bx.width / innerWidth * 100), Math.round(bx.height / innerHeight * 100)], img: [Math.round(im.width / innerWidth * 100), Math.round(im.height / innerHeight * 100)], noField: getComputedStyle(l.querySelector('.ddtv-lb__b')).backgroundColor === 'rgba(0, 0, 0, 0)', close: !!l.querySelector('button'), arrows: l.querySelectorAll('button').length, dots: l.querySelectorAll('.ddtv-lb__d i').length }; });
  ok(lb.open && lb.share[0] <= 71 && lb.share[1] <= 71 && lb.img[0] <= 71 && lb.img[1] <= 71 && lb.noField && lb.close && lb.arrows === 3 && lb.dots === NG + 2, 'G5c a tap on a picture opens it large over the page: at most 70 % of the screen, no field behind it, a close X, dots', JSON.stringify(lb));
  await p.evaluate(() => { document.querySelectorAll('#ddtv-lb .ddtv-lb__d i')[6].click(); }); await p.waitForTimeout(300);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300); const lbEsc = await p.evaluate(() => !document.getElementById('ddtv-lb'));
  await p.evaluate(() => { document.querySelectorAll('.dd-gal__s img')[1].click(); }); await p.waitForTimeout(400); await p.evaluate(() => { document.querySelector('#ddtv-lb button').click(); }); await p.waitForTimeout(300); const lbX = await p.evaluate(() => !document.getElementById('ddtv-lb'));
  ok(lbEsc && lbX && await p.evaluate(() => document.documentElement.style.overflow === ''), 'G5d Esc and the X close it and give the page its scrolling back', 'esc ' + lbEsc + ' x ' + lbX);
  // G5e: in the large view the arrows go to the next and previous picture (and round)
  await p.evaluate(() => { document.querySelectorAll('.dd-gal__s img')[0].click(); }); await p.waitForTimeout(500);
  const a0 = await p.evaluate(() => [...document.querySelectorAll('#ddtv-lb .ddtv-lb__d i')].findIndex((d) => d.className === 'on'));
  await p.evaluate(() => { document.querySelector('#ddtv-lb [data-s="n"]').click(); }); await p.waitForTimeout(250);
  const a1 = await p.evaluate(() => [...document.querySelectorAll('#ddtv-lb .ddtv-lb__d i')].findIndex((d) => d.className === 'on'));
  await p.evaluate(() => { document.querySelector('#ddtv-lb [data-s="p"]').click(); document.querySelector('#ddtv-lb [data-s="p"]').click(); }); await p.waitForTimeout(250);
  const a2 = await p.evaluate(() => [...document.querySelectorAll('#ddtv-lb .ddtv-lb__d i')].findIndex((d) => d.className === 'on'));
  const aGeo = await p.evaluate(() => { const b = document.querySelector('#ddtv-lb .ddtv-lb__b').getBoundingClientRect(), p = document.querySelector('#ddtv-lb [data-s="p"]').getBoundingClientRect(), n = document.querySelector('#ddtv-lb [data-s="n"]').getBoundingClientRect(); return p.right <= b.left + 4 && n.left >= b.right - 4 && Math.abs((p.top + p.height / 2) - innerHeight / 2) < 4; });
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  ok(a0 === 0 && a1 === 1 && a2 === NG + 1 && aGeo, 'G5e the arrows of the large view go to the next / previous picture (and round the ends), at the sides of the picture, vertically centred', [a0, a1, a2, aGeo].join(','));
  // G5f: the first picture is the large cover of the header: it fills the whole slot (as tall as the text panel)
  const cov = await p.evaluate(() => { const v = document.querySelector('.dd-gal__v'), im = document.querySelector('.dd-gal__s.dd-cover img'), t = document.querySelector('.dd-hd__t'), vr = v.getBoundingClientRect(), ir = im.getBoundingClientRect(), tr = t.getBoundingClientRect(); return { fill: Math.abs(ir.height - vr.height) < 2 && Math.abs(ir.width - vr.width) < 2, tall: vr.height >= tr.height - 40, h: Math.round(vr.height), th: Math.round(tr.height), w: Math.round(vr.width), fit: getComputedStyle(im).objectFit }; });
  ok(cov.fill && cov.tall && cov.fit === 'cover', 'G5f the header\'s first picture is the large cover: it fills the slot beside the text (as tall as the text panel)', JSON.stringify(cov));
  // G6
  const pics = await p.evaluate(() => [...document.querySelectorAll('.dd-gal__s img')].map((i) => i.src));
  const codes = []; for (const u of pics) codes.push(+require('child_process').execFileSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', u]).toString());
  ok(pics.length === NG + 2 && codes.every((c) => c === 200) && bad.length === 0, 'G6 all pictures are on the real media host (no mock)', codes.join(',') + (bad.length ? ' bad: ' + bad.join(' ') : ''));
  ok(errs.length === 0, 'no page error of ours', errs.join(' | '));
  console.log(fails ? `\n${fails} gallery check(s) FAILED` : '\nAll gallery checks passed (real Ecwid page, this browser only, nothing saved)'); await b.close(); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
