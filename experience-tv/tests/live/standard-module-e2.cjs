/*
 * READ-ONLY, LOCAL. The STANDARD MODULE (dist/standard/botanic-standard-description.html) put into a copy of the REAL public test product page
 * in this browser only, together with the television build; nothing is saved in the shop, no cart request, Add to Bag is never clicked.
 *   Run after `node tools/build-standard-module.mjs` and `node tools/build-experience.mjs`.
 *
 *   M1  all 13 topics are there, closed; no script in the module; no video is fetched, none autoplays or preloads
 *   M2  the approved text is whole: only the section numbers and the labels of the left-out loop video / the radio tabs are missing
 *   M3  no pill shapes (rounded boxes only) in the module and the information blocks
 *   M4  GREEN (owner, 26 Nov): text on every green surface is light, measured on the real pixels (the shop's own filter turned it black once);
 *       green is at most 10 % of what is on the screen (the design aims at far less)
 *   M5  the shop's own selectors stay within reach beside the text on wide screens
 *   M6  the information blocks between the two views exist and their buttons work
 *   M7  THE TELEVISION'S COLOURS (owner, 26 Nov): every surface of the module is one of the television's colours (coffee, slate, deep slate, olive-grey, latte, vanilla, paper, the green) and dark and light rows both stand;
 *       every inscription is readable (4.5:1 measured on the real colours) and light on the dark rows
 *   M11 no wasted space: the header's photo is as tall as its text panel; the last row of every card grid reaches the right edge (no half-empty rows)
 *   M8  the word Botanic is always green (every occurrence in the module, in its own span), light enough to read on the chocolate
 *   M9  after "Add to Bag" (classes set by hand, nothing is clicked or added): "Go to Checkout" is a different colour from the green "Add to Bag", its text is light on the real pixels
 *   M10 the photos (the owner's photo in the header, gallery photos in the strip and the closing card) are in the module, load, have alt text and sizes
 */
const { chromium } = require('playwright'); const fs = require('fs'); const R = '/home/user/Animation/experience-tv/';
const js = fs.readFileSync(R + 'dist/experience/botanic-tv.js', 'utf8'), logos = fs.readFileSync(R + 'dist/experience/' + fs.readdirSync(R + 'dist/experience').find((f) => /^botanic-tv-logos-[0-9a-f]{20}\.js$/.test(f)), 'utf8');
const html = fs.readFileSync(R + 'dist/standard/botanic-standard-description.html', 'utf8'), report = fs.readFileSync(R + 'dist/standard/REPORT.txt', 'utf8');
const URL = 'https://divinedunlop.com/products/botanic-experience-tv-test-draft?cb=' + Date.now();
let fails = 0; const ok = (c, m, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (d ? '  [' + d + ']' : '')); if (!c) fails++; };
// pixel analysis of a screenshot, run in the page: dark pixels (text that is not light), green pixels (hue 62-105, saturated), all pixels
const analyse = async (b64) => {
  const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data; let dark = 0, green = 0; const n = d.length / 4;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2], l = r * .299 + g * .587 + b * .114, mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn;
    if (l < 70) dark++;
    if (dd >= 40 && mx === g) { const h = 60 * (((b - r) / dd) + 2), L = (mx + mn) / 510; if (h >= 62 && h <= 105 && L > .12 && L < .62) green++; }
  }
  return { dark, green, n };
};
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const vp = { width: 1366, height: 1024 }; const ctx = await b.newContext({ viewport: vp, screen: vp }); const p = await ctx.newPage(); const errs = [], media = [];
  p.on('pageerror', (e) => { if (!/in promise/.test(e.message)) errs.push(e.message.slice(0, 90)); }); p.on('request', (r) => { if (/\.mp4/.test(r.url())) media.push(r.url().split('/').pop()); });
  await p.route(/media\.divinedunlop\.com\/ddtv\/botanic-tv-[0-9a-f]{20}\.js/, (r) => r.abort()); await p.route(/media\.divinedunlop\.com\/ddtv\/botanic-tv-logos-[0-9a-f]{20}\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: logos }));
  await p.goto(URL, { waitUntil: 'commit', timeout: 90000 }); await p.waitForSelector('.details-product-option select', { timeout: 80000 }); await p.waitForTimeout(3500);
  try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2000 }); } catch (e) { /* none */ }
  await p.waitForTimeout(2000); media.length = 0;
  await p.evaluate((h) => { const o = document.querySelector('.dd-botanic-page'); (o ? o.parentElement : document.querySelector('.product-details__description')).innerHTML = h; }, html); await p.waitForTimeout(2500);
  // M1
  const m1 = await p.evaluate(() => { const t = [...document.querySelectorAll('#bp-top .dd-t')], v = [...document.querySelectorAll('#bp-top video')]; return { topics: t.length, open: t.filter((x) => x.open).length, firstOpen: !!(t[0] && t[0].open && t[0].id === 'bp-firmness'), scripts: document.querySelectorAll('#bp-top script').length, videos: v.length, preloadNone: v.every((x) => x.getAttribute('preload') === 'none'), autoplay: v.some((x) => x.hasAttribute('autoplay')), loop: v.some((x) => x.hasAttribute('loop')) }; });
  ok(m1.topics === 13 && m1.open === 1 && m1.firstOpen && m1.scripts === 0 && m1.videos >= 6 && m1.preloadNone && !m1.autoplay && !m1.loop && media.length === 0, 'M1 13 topics, only the first (Firmness) open; no script; every video waits for its play button; nothing fetched', JSON.stringify({ ...m1, fetched: media }));
  // M2
  const lost = (report.match(/WORDS LOST[^\n]*: ([^\n]*)/) || [, ''])[1].trim().split(/\s+/).filter(Boolean).map((x) => x.replace(/×\d+$/, ''));
  const allowed = new Set(['organic', 'premium', 'main', 'video', 'cotton', 'wool', 'aloe', 'vera', 'cashmere', 'silver']), unexpected = lost.filter((w) => !allowed.has(w) && !/^\d{2}$/.test(w) && w !== 'none');
  ok(unexpected.length === 0, 'M2 every approved word is in the module (only section numbers and the repeated labels of the left-out radio tabs and loop video are not)', unexpected.join(' ') || 'nothing missing');
  // M3
  const m3 = await p.evaluate(() => { const bad = []; for (const e of document.querySelectorAll('#bp-top *')) { const r = e.getBoundingClientRect(); if (r.width < 30 || r.height < 14) continue; const c = getComputedStyle(e); if (parseFloat(c.borderTopLeftRadius) >= 60 || /9999|999px/.test(c.borderTopLeftRadius)) bad.push(e.className + ':' + c.borderTopLeftRadius); } return bad.slice(0, 5); });
  ok(m3.length === 0, 'M3 no pill shapes in the module (rounded boxes only)', m3.join(' | '));
  // M5
  const m5 = await p.evaluate(() => ({ pos: getComputedStyle(document.querySelector('.product-details__sidebar')).position }));
  await p.evaluate(() => { document.getElementById('bp-firmness').open = true; document.getElementById('bp-firmness').scrollIntoView(); window.scrollBy(0, 400); }); await p.waitForTimeout(600);
  const sb = await p.evaluate(() => { const r = document.querySelector('.product-details__sidebar').getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height) }; });
  ok(m5.pos === 'sticky' && sb.top >= 0 && sb.top <= 40, 'M5 the shop\'s selectors stay beside the text while reading (wide screens)', JSON.stringify({ ...m5, ...sb }));
  // M4: pixels on every green surface + green share, in several views
  const greens = ['.details-product-purchase__add-to-bag .form-control__button'];
  let worstShare = 0; const darkReport = [];
  for (const [name, setup] of [['top of the module', async () => { await p.evaluate(() => { document.querySelectorAll('.dd-t[open]').forEach((d) => { d.open = false; }); window.scrollTo(0, document.getElementById('bp-top').getBoundingClientRect().top + scrollY - 20); }); }], ['firmness open', async () => { await p.evaluate(() => { document.getElementById('bp-firmness').open = true; document.getElementById('bp-firmness').scrollIntoView(); }); }], ['covers open', async () => { await p.evaluate(() => { document.querySelectorAll('.dd-t[open]').forEach((d) => { d.open = false; }); document.getElementById('bp-covers').open = true; document.getElementById('bp-covers').scrollIntoView(); }); }]]) {
    await setup(); await p.waitForTimeout(700); const shot = await p.screenshot(); const r = await p.evaluate(analyse, shot.toString('base64')); worstShare = Math.max(worstShare, 100 * r.green / r.n);
  }
  const bagBox = await p.evaluate((sel) => { const e = document.querySelector(sel); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, greens[0]); await p.waitForTimeout(500);
  const bagShot = await p.screenshot({ clip: { x: bagBox.x, y: bagBox.y, width: bagBox.w, height: bagBox.h } }); const bag = await p.evaluate(analyse, bagShot.toString('base64'));
  ok(bag.dark === 0 && bag.green > 500, 'M4 "Add to Bag" (green): its text is light on the real pixels (no black pixel), measured on the rendering and not on the style sheet', JSON.stringify(bag));
  // M7 + M8 + M10 (module): contrast of every text, the green word, the photos
  await p.evaluate(() => { document.querySelectorAll('#bp-top details').forEach((d) => { d.open = true; }); }); await p.waitForTimeout(600);
  const m7 = await p.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true });
    const rgb = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
    const lum = (c) => { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    const bgOf = (e) => { for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c[3] > .9) return c; } return [255, 255, 255, 1]; };
    const bad = [], dark = new Set(); let n = 0, lowest = 99, onDark = 0;
    for (const e of document.querySelectorAll('#bp-top *')) {
      if (!e.closest('#bp-top') || e.closest('video') || e.tagName === 'STYLE' || e.tagName === 'IMG') continue;
      const own = [...e.childNodes].some((t) => t.nodeType === 3 && t.textContent.trim().length > 0); if (!own) continue;
      const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
      const st = getComputedStyle(e), fg = rgb(st.color), bg = bgOf(e), k = ratio(fg, bg); n++;
      const large = parseFloat(st.fontSize) >= 24 || (parseFloat(st.fontSize) >= 18.6 && parseInt(st.fontWeight, 10) >= 700);
      const isBg = lum(bg) < .12; if (isBg) onDark++;
      if (!(e.closest('.dd-grp'))) lowest = Math.min(lowest, k);
      if (k < (large ? 3 : 4.5)) bad.push((e.className || e.tagName) + ' ' + st.color + ' on rgb(' + bg.slice(0, 3).join(',') + ') = ' + k.toFixed(2));
      // on a dark chocolate card the inscription must be light (white, vanilla, pistachio or the lifted green)
      if (isBg && lum(fg) < .25) bad.push('NOT LIGHT on chocolate: ' + (e.className || e.tagName) + ' ' + st.color);
    }
    const PAL = [[67, 66, 57], [58, 57, 50], [56, 68, 66], [46, 54, 51], [100, 97, 85], [105, 104, 98], [221, 214, 196], [251, 251, 237], [254, 254, 246], [255, 255, 255], [110, 134, 1], [86, 105, 1]], near = (c) => PAL.some((q) => Math.abs(q[0] - c[0]) <= 3 && Math.abs(q[1] - c[1]) <= 3 && Math.abs(q[2] - c[2]) <= 3);
    const seen = new Map(); for (const e of document.querySelectorAll('#bp-top *')) { const r = e.getBoundingClientRect(); if (r.width < 8 || r.height < 8 || e.tagName === 'IMG') continue; const c = rgb(getComputedStyle(e).backgroundColor); if (c[3] < .9) continue; const k = c.slice(0, 3).join(','); seen.set(k, (seen.get(k) || 0) + 1); }
    const foreign = [...seen.keys()].filter((k) => !near(k.split(',').map(Number))), darkKinds = [...seen.keys()].filter((k) => lum(k.split(',').map(Number)) < .13).length, lightKinds = [...seen.keys()].filter((k) => lum(k.split(',').map(Number)) > .6).length;
    const cards = { foreign, darkKinds, lightKinds };
    return { checked: n, onDark, lowest: +lowest.toFixed(2), bad: bad.slice(0, 14), cards };
  });
  ok(m7.bad.length === 0 && m7.onDark > 100 && m7.cards.foreign.length === 0 && m7.cards.darkKinds >= 3 && m7.cards.lightKinds >= 2, 'M7 only the television\'s colours are used, dark rows and light rows both stand; every inscription is readable (' + m7.checked + ' texts checked, lowest contrast ' + m7.lowest + ':1) and light on the dark ones', JSON.stringify(m7));
  const m8 = await p.evaluate(() => {
    const w = document.createTreeWalker(document.getElementById('bp-top'), NodeFilter.SHOW_TEXT); const miss = []; let all = 0, green = 0, n;
    while ((n = w.nextNode())) { const re = /\bbotanic\b/gi; let m; while ((m = re.exec(n.textContent))) { all++; const sp = n.parentElement; const c = getComputedStyle(sp).color; const mm = c.match(/\d+/g).map(Number); const isGreen = sp.classList.contains('dd-bo') && mm[1] > mm[0] && mm[1] > mm[2] + 60; if (isGreen) green++; else miss.push(n.textContent.slice(Math.max(0, m.index - 12), m.index + 14)); } }
    return { all, green, miss: miss.slice(0, 5) };
  });
  ok(m8.all >= 10 && m8.miss.length === 0, 'M8 the word Botanic is green everywhere it is written in the module (' + m8.green + ' of ' + m8.all + ')', JSON.stringify(m8));
  await p.evaluate(() => { document.querySelectorAll('#bp-top img').forEach((i) => i.scrollIntoView()); window.scrollTo(0, 0); }); await p.waitForTimeout(2500);
  const m10 = await p.evaluate(() => { const f = (i) => i && { ok: i.complete && i.naturalWidth > 0, alt: i.alt.length > 20, size: !!(i.getAttribute('width') && i.getAttribute('height')), lazy: i.loading === 'lazy', host: new URL(i.src).host }; const duo = [...document.querySelectorAll('.dd-duo img')].map(f); return { header: f(document.querySelector('.dd-ph img')), end: f(document.querySelector('.dd-end__p img')), duo: duo.length === 2 && duo.every((x) => x.ok && x.alt && x.size && x.lazy) }; });
  ok(m10.header && m10.end && m10.duo && [m10.header, m10.end].every((x) => x.ok && x.alt && x.size && x.lazy && /cloudfront|media\.divinedunlop/.test(x.host)), 'M10 the owner\'s photo (header) and three gallery photos (strip, closing card) are in the module: they load, have alt text and sizes (no layout jump), are lazy', JSON.stringify(m10));
  // M11: no wasted space (all topics are open here)
  await p.evaluate(() => { document.querySelectorAll('#bp-top .dd-t').forEach((d) => { d.open = true; }); }); await p.waitForTimeout(500);
  const m11 = await p.evaluate(() => {
    const hdT = document.querySelector('.dd-hd__t').getBoundingClientRect(), hdP = document.querySelector('.dd-ph').getBoundingClientRect(), hd = document.querySelector('.dd-hd').getBoundingClientRect();
    const half = []; for (const g of document.querySelectorAll('#bp-top .dd-g[class*="dd-n"]')) { if (/dd-n22/.test(g.className)) continue; const gr = g.getBoundingClientRect(); if (gr.width < 300 || !g.offsetParent) continue; const kids = [...g.children].filter((k) => k.getBoundingClientRect().height > 2); const bottom = Math.max(...kids.map((k) => Math.round(k.getBoundingClientRect().top))); const last = kids.filter((k) => Math.round(k.getBoundingClientRect().top) === bottom); const right = Math.max(...last.map((k) => k.getBoundingClientRect().right)); if (right < gr.right - 3) half.push(g.className + ' n=' + kids.length + ' right ' + Math.round(right) + ' of ' + Math.round(gr.right)); }
    return { sameHeight: Math.abs(hdT.height - hdP.height) <= 2, photoH: Math.round(hdP.height), panelH: Math.round(hdT.height), photoRight: Math.abs(hdP.right - hd.right) <= 2, half: half.slice(0, 5) };
  });
  ok(m11.sameHeight && m11.photoRight && m11.half.length === 0, 'M11 no wasted space: the header photo is as tall as its text panel and reaches the right edge; the last row of every card grid reaches the right edge (no half-empty rows)', JSON.stringify(m11));
  // M9: the shop's own states after "Add to Bag", set by hand
  await p.evaluate(() => { document.querySelectorAll('#bp-top details').forEach((d) => { d.open = false; }); document.querySelector('.details-product-purchase').scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(500);
  const clip = async (sel) => { const r = await p.evaluate((s) => { const e = document.querySelector(s); e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; }, sel); await p.waitForTimeout(300); const shot = await p.screenshot({ clip: { x: r.x, y: r.y, width: r.w, height: r.h } }); return p.evaluate(analyse, shot.toString('base64')); };
  await p.evaluate(() => { document.querySelector('.details-product-purchase').classList.add('details-product-purchase--in-bag', 'details-product-purchase--add-more', 'details-product-purchase--checkout'); }); await p.waitForTimeout(900);
  const co = await clip('.details-product-purchase__checkout .form-control__button'), mo = await clip('.details-product-purchase__add-more .form-control__button');
  const cols = await p.evaluate(() => { const g = (s) => { const e = document.querySelector(s + ' .form-control__button'); const c = getComputedStyle(e); return { bg: c.backgroundColor, fg: c.color, t: e.textContent.trim() }; }; return { checkout: g('.details-product-purchase__checkout'), more: g('.details-product-purchase__add-more'), bag: g('.details-product-purchase__add-to-bag') }; });
  ok(/Go to Checkout/.test(cols.checkout.t) && cols.checkout.bg !== cols.bag.bg && cols.checkout.bg === 'rgb(67, 66, 57)' && cols.checkout.fg === 'rgb(255, 255, 255)' && co.green === 0 && co.dark > 3000 && co.dark / co.n > .5, 'M9 after Add to Bag the button becomes "Go to Checkout" in the television\'s coffee (the bag was green): white text, a different colour on the real pixels; "Add More" is outlined', JSON.stringify({ cols, checkoutPixels: co, morePixels: mo }));
  await p.evaluate(() => { document.querySelector('.details-product-purchase').classList.remove('details-product-purchase--in-bag', 'details-product-purchase--add-more', 'details-product-purchase--checkout'); });
  // the television build: the information blocks and their green buttons
  await p.evaluate((code) => { window.__ddtvAllow = [876405767]; window.__ddtvPage = { type: 'PRODUCT', productId: 876405767 }; (0, eval)(code); }, js); await p.waitForSelector('#ddtv-experience', { timeout: 30000 }); await p.waitForTimeout(3000);
  const ib = await p.evaluate(() => { const i = document.getElementById('ddtv-info'), t = document.getElementById('ddtv-to-standard'); i.scrollIntoView({ block: 'center' }); const r = t.getBoundingClientRect(); return { box: !!i, x: r.left, y: r.top, w: r.width, h: r.height, radius: getComputedStyle(i).borderTopLeftRadius, btnRadius: getComputedStyle(t).borderTopLeftRadius }; }); await p.waitForTimeout(500);
  const bs = await p.screenshot({ clip: { x: ib.x + 7, y: ib.y + 7, width: ib.w - 14, height: ib.h - 14 } }); const ibr = await p.evaluate(analyse, bs.toString('base64'));
  ok(ibr.dark === 0 && ibr.green > 300, 'M4 the green button of the information block: light text on the real pixels', JSON.stringify(ibr));
  const fullShot = await p.screenshot(); const fr = await p.evaluate(analyse, fullShot.toString('base64')); worstShare = Math.max(worstShare, 100 * fr.green / fr.n);
  ok(worstShare <= 10, 'M4 green is at most 10 % of what is on the screen in every view tried (worst ' + worstShare.toFixed(2) + ' %)', worstShare.toFixed(2) + ' %');
  ok(parseFloat(ib.radius) >= 10 && parseFloat(ib.radius) < 40 && parseFloat(ib.btnRadius) < 40, 'M3 the information block and its button are rounded boxes, not pills', JSON.stringify({ r: ib.radius, b: ib.btnRadius }));
  // M13 (owner, 26 Nov): the shop's own product title is not shown above the module, but stays in the page
  const m13 = await p.evaluate(() => { const t = [...document.querySelectorAll('.product-details__product-title')]; const vis = t.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 1 || r.height > 1; }); return { count: t.length, visible: vis.length, text: (t[0] && t[0].textContent.trim().slice(0, 30)) || '' }; });
  ok(m13.count >= 1 && m13.visible === 0 && m13.text.length > 0, 'M13 the shop\'s product title is kept in the page but not shown above the module', JSON.stringify(m13));
  // M12: the television's certificate logos are really on the media host (a mocked route hid a 404 once): the name the television asks for answers 200 with the built bytes
  {
    const tvJs = fs.readFileSync(R + 'dist/experience/botanic-tv.js', 'utf8'); const m = /(botanic-tv-logos-[0-9a-f]{20}\.js)\?v=/.exec(tvJs);
    const crypto = require('crypto'); let st = 0, same = false;
    if (m) { try { const body = require('child_process').execFileSync('curl', ['-s', '-w', '\n%{http_code}', 'https://media.divinedunlop.com/ddtv/' + m[1]], { maxBuffer: 5e6 }).toString(); const code = +body.trim().split('\n').pop(); st = code; if (code === 200) { const txt = body.slice(0, body.lastIndexOf('\n')); same = crypto.createHash('sha256').update(Buffer.from(txt)).digest('hex') === crypto.createHash('sha256').update(logos).digest('hex'); } } catch (e) { st = 'error ' + e.message; } }
    ok(!!m && st === 200 && same, 'M12 the certificate logos the television asks for are on the media host and are the built file (no 404)', JSON.stringify({ file: m && m[1], status: st, same }));
    // every picture the television asks for (the mattress and the cup) is on the media host too: a name that is not there shows a broken picture
    const pics = [...new Set([...tvJs.matchAll(/__BASE__(botanic-[a-z]+-[0-9a-f]{20}\.webp)/g)].map((x) => x[1]).concat([...tvJs.matchAll(/'(botanic-(?:cup|mattress)-[0-9a-f]{20}\.webp)'/g)].map((x) => x[1])))];
    const codes = pics.map((f) => { try { return [f, +require('child_process').execFileSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', 'https://media.divinedunlop.com/ddtv/' + f]).toString()]; } catch (e) { return [f, 'error']; } });
    ok(pics.length >= 2 && codes.every((x) => x[1] === 200), 'M12b the mattress and cup pictures the television asks for are on the media host (no broken picture in Your selection)', JSON.stringify(codes));
  }
  // M6
  await p.click('#ddtv-to-standard'); await p.waitForTimeout(1500);
  const m6 = await p.evaluate(() => ({ cls: document.documentElement.className, box: !!document.getElementById('ddtv-backbox'), btn: (document.getElementById('ddtv-back') || {}).textContent, selects: document.querySelectorAll('.details-product-option select').length, topics: document.querySelectorAll('.dd-t').length }));
  await p.click('#ddtv-back'); await p.waitForTimeout(1500); const m6b = await p.evaluate(() => ({ cls: document.documentElement.className, info: !!document.getElementById('ddtv-info'), box: !!document.getElementById('ddtv-backbox') }));
  ok(/ddtv-classic/.test(m6.cls) && m6.box && /Optimised Preview/.test(m6.btn) && m6.selects >= 4 && m6.topics === 13 && /ddtv-on/.test(m6b.cls) && m6b.info && !m6b.box, 'M6 the two information blocks and their buttons work: to the standard view and back, with the selectors and the 13 topics there', JSON.stringify({ m6, m6b }));
  ok(errs.length === 0, 'no page error of ours', errs.join(' | '));
  console.log(fails ? `\n${fails} check(s) FAILED` : '\nAll standard-module checks passed (real Ecwid page, this browser only, nothing saved)'); await b.close(); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
