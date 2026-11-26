/*
 * READ-ONLY, LOCAL (E2). The store module (dist/experience/botanic-tv.js) on the REAL Ecwid DOM of the public product 831592302:
 * the module is injected into a local copy of the page; nothing is saved in the store, nothing is added to a cart, Add to Bag is
 * never clicked. Run after `node tools/build-experience.mjs`.
 *
 *   X1 the television mounts above the shop's own product block, in its own Shadow DOM; the shop's options, price and Add to Bag stay
 *   S1 each of the four choices made on the television is set on Ecwid's own dropdown
 *   S2 a choice made in Ecwid's own dropdown appears on the television; S3 clearing it there clears it on the television
 *   S4 the price on the television is Ecwid's price (with the struck price and the discount note) after the changes
 *   S5 Add to Bag on the television is ready when the four are chosen; neither button is clicked
 *   S6 no cart, checkout or order request at any time; no page error of ours
 *   S7 only listed products start it; another product page removes it; coming back mounts it again
 *   S8 the description is still the shop's full text, folded (nothing of it shown, no fade) under one centred "Read the full description" button
 *
 *   NODE_PATH=$(npm root -g) node tests/live/experience-e2.cjs [width height] [shot.png]
 */
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const R = path.join(__dirname, '..', '..') + '/';
const W = +(process.argv[2] || 1366), H = +(process.argv[3] || 1000), SHOT = process.argv[4] || '';
const js = fs.readFileSync(R + 'dist/experience/botanic-tv.js', 'utf8');
const logos = fs.readFileSync(R + 'dist/experience/botanic-tv-logos.js', 'utf8');
let fails = 0; const ok = (c, m, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (d ? '  [' + d + ']' : '')); if (!c) fails++; };
const URL = 'https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop';

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, screen: { width: W, height: H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); const errs = [], posts = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('request', (r) => { if (r.method() === 'POST') posts.push(r.url()); });
  await p.route('https://media.divinedunlop.com/ddtv/botanic-tv-logos.js**', (r) => r.fulfill({ contentType: 'text/javascript', body: logos }));
  await p.route(/https:\/\/media\.divinedunlop\.com\/ddtv\/botanic-(cup|mattress)\./, (r) => { const n = /botanic-(cup|mattress)\./.exec(r.request().url())[1]; r.fulfill({ contentType: 'image/webp', body: fs.readFileSync(R + 'dist/experience/' + fs.readdirSync(R + 'dist/experience').find((f) => f.startsWith('botanic-' + n + '.'))) }); });
  await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForSelector('.details-product-option select', { timeout: 45000 }); await p.waitForTimeout(2500);
  try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2500 }); } catch (e) { /* no banner */ }
  const descBefore = await p.evaluate(() => (document.querySelector('.product-details__description') || {}).textContent.length);
  const seo = () => p.evaluate(() => ({ title: document.title, canon: (document.querySelector('link[rel=canonical]') || {}).href, ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((x) => x.textContent).join('|'), desc: (document.querySelector('meta[name=description]') || {}).content, robots: (document.querySelector('meta[name=robots]') || {}).content || '' }));
  const seoBefore = await seo();
  await p.evaluate((code) => { window.__ddtvAllow = [831592302]; (0, eval)(code); }, js);
  await p.waitForSelector('#ddtv-experience', { timeout: 15000 }); await p.waitForTimeout(1500);

  // X1
  const x1 = await p.evaluate(() => {
    const h = document.getElementById('ddtv-experience'), pd = document.querySelector('.product-details');
    return { before: !!(h && pd && (h.compareDocumentPosition(pd) & Node.DOCUMENT_POSITION_FOLLOWING)), shadow: !!(h && h.shadowRoot && h.shadowRoot.querySelector('.ddx .monitor')),
      native: document.querySelectorAll('.details-product-option select').length, bag: !![...document.querySelectorAll('button')].find((x) => /add to bag/i.test(x.textContent)), price: !!document.querySelector('.details-product-price__value'), ver: window.DDTVX && DDTVX.version };
  });
  ok(x1.before && x1.shadow && x1.native === 4 && x1.bag && x1.price, 'X1 the television is mounted above the shop\'s product block in its own Shadow DOM; the four dropdowns, the price and Add to Bag stay', JSON.stringify(x1));

  const native = () => p.evaluate(() => { const o = {}; document.querySelectorAll('.details-product-option').forEach((b) => { const t = (b.querySelector('.details-product-option__title') || {}).textContent || ''; const s = b.querySelector('select'); o[/size/i.test(t) ? 'size' : /depth/i.test(t) ? 'depth' : /firm/i.test(t) ? 'firmness' : 'cover'] = s.options[s.selectedIndex].text; }); return o; });
  const tv = (sel) => p.locator('#ddtv-experience ' + sel).first();
  const click = async (sel) => { await tv(sel).click(); await p.waitForTimeout(350); };

  // S1: the four choices, made on the television
  await click('[data-go="0"]'); await click('[data-sgrp="superking"]'); await click('[data-size="16"]'); await click('[data-confirm="size"]');
  await click('[data-go="1"]'); await click('[data-depth="1"]'); await click('[data-confirm="depth"]');
  await click('[data-go="2"]'); await click('[data-firm="Medium"]'); await click('[data-fconfirm]');
  await click('[data-go="3"]'); await click('[data-cover="1"]'); await click('[data-confirm="cover"]');
  await p.waitForTimeout(3000);
  const n1 = await native();
  ok(/180x200/.test(n1.size), 'S1 size chosen on the television is set on Ecwid\'s own SIZE', n1.size);
  ok(/24 cm/.test(n1.depth), 'S1 depth chosen on the television is set on Ecwid\'s own depth', n1.depth);
  ok(/MEDIUM/.test(n1.firmness), 'S1 firmness chosen on the television is set on Ecwid\'s own firmness', n1.firmness);
  ok(/Wool/.test(n1.cover), 'S1 cover chosen on the television is set on Ecwid\'s own COVERS', n1.cover);

  // S4: the price is Ecwid's
  const pr = await p.evaluate(() => {
    const sh = document.getElementById('ddtv-experience').shadowRoot, t = (e) => e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
    return { store: t(document.querySelector('.details-product-price__value')), storeOld: t(document.querySelector('.details-product-price-compare__container s')), storeBadge: t(document.querySelector('.product-details__product-price-discount')),
      tv: t(sh.querySelector('#price b')), tvOld: t(sh.querySelector('#price .pold')), tvBadge: t(sh.querySelector('#price .sv')) };
  });
  ok(pr.store && pr.store !== '£0' && pr.tv === pr.store && pr.tvOld === pr.storeOld && pr.tvBadge === pr.storeBadge, 'S4 the price, the struck price and the discount note on the television are Ecwid\'s own', JSON.stringify(pr));

  // S5: Add to Bag ready; not clicked
  const s5 = await p.evaluate(() => { const sh = document.getElementById('ddtv-experience').shadowRoot, b = sh.querySelector('#bag [data-bag]'); return { tvBag: !!b, enabled: b && !b.disabled, ready: b && b.classList.contains('ready') }; });
  ok(s5.tvBag && s5.enabled, 'S5 Add to Bag on the television is enabled with the four choices made (not clicked)', JSON.stringify(s5));

  // S2 / S3: the shop drives the television
  await p.evaluate(() => { const b = [...document.querySelectorAll('.details-product-option')].find((o) => /depth/i.test(o.textContent)); const s = b.querySelector('select'); s.selectedIndex = 3; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(1500);
  const st2 = await p.evaluate(() => DDTVX.state().tv);
  ok(st2.depth === '26', 'S2 depth chosen in Ecwid\'s own dropdown appears on the television', JSON.stringify(st2));
  await p.evaluate(() => { const b = [...document.querySelectorAll('.details-product-option')].find((o) => /firm/i.test(o.textContent)); const s = b.querySelector('select'); s.selectedIndex = 0; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(1500);
  const st3 = await p.evaluate(() => DDTVX.state());
  ok(st3.tv.firmness === null && st3.shop.firmness === null, 'S3 clearing firmness in Ecwid\'s dropdown clears it on the television', JSON.stringify(st3.tv));
  const n3 = await native();
  ok(/26 cm/.test(n3.depth) && /180x200/.test(n3.size) && /Wool/.test(n3.cover), 'S2 the television did not push back: Ecwid keeps the customer\'s own choice', JSON.stringify(n3));

  // S10 (owner, 26 Nov): the "Home / Store / Collection" row with its arrows is not shown with the television (it stays in the page for readers and search engines)
  const s10 = await p.evaluate(() => { const t = document.querySelector('.product-details__top'), bc = document.querySelector('.ec-breadcrumbs'); const r = t && t.getBoundingClientRect(); return { present: !!t, w: r ? Math.round(r.width) : null, h: r ? Math.round(r.height) : null, links: document.querySelectorAll('.ec-breadcrumbs a').length, wrapMT: (document.querySelector('.ins-tile__wrap') ? getComputedStyle(document.querySelector('.ins-tile__wrap')).marginTop : 'n/a') }; });
  ok(!s10.present || (s10.w <= 1 && s10.h <= 1 && s10.links >= 1 && (s10.wrapMT === 'n/a' || parseInt(s10.wrapMT, 10) <= 20)), 'S10 the breadcrumb row is not shown with the television (still in the page) and the page does not leave 100 px above it', JSON.stringify(s10));
  // S8: the description stays, folded
  const s8 = await p.evaluate(() => { const d = document.querySelector('.product-details__description'), f = document.querySelector('.ddtv-fold'), db = d.getBoundingClientRect(), fb = f && f.getBoundingClientRect(), cs = getComputedStyle(d); return { len: d.textContent.length, fold: !!f, folded: cs.maxHeight, mask: cs.webkitMaskImage || cs.maskImage || 'none', h: Math.round(db.height), below: !!fb && fb.bottom <= db.top + 1, centred: !!fb && Math.abs((fb.left + fb.width / 2) - (document.documentElement.clientWidth / 2)) < 160, aria: f && f.getAttribute('aria-expanded') }; });
  ok(s8.len === descBefore && s8.fold && s8.folded === '0px' && s8.h === 0 && /none/.test(s8.mask) && s8.below && s8.aria === 'false', 'S8 the shop\'s description is complete, folded to nothing (no peek, no fade) with one "Read the full description" button in the block above it', JSON.stringify(s8));

  // certificates: the logos arrive on demand
  await click('[data-ch="certs"]'); await p.waitForTimeout(800);
  const lg = await p.evaluate(() => document.getElementById('ddtv-experience').shadowRoot.querySelectorAll('img[src^="data:image"]').length);
  ok(lg > 0, 'the certificate logos load when Certifications is opened', String(lg));

  if (SHOT) { await p.evaluate(() => window.scrollTo(0, 0)); await click('[data-ch="discover"]'); await p.waitForTimeout(600); await p.screenshot({ path: SHOT, fullPage: false }); }

  // S12 (owner, 26 Nov): where the two views meet, an information block says what each is for; its buttons do something (switch the view, open the text)
  const s12 = await p.evaluate(() => { const i = document.getElementById('ddtv-info'), to = document.getElementById('ddtv-to-standard'), f = document.querySelector('.ddtv-fold'), d = document.querySelector('.product-details__description'); const r = (e) => e && e.getBoundingClientRect(); return { box: !!i, text: i ? i.textContent : '', toVisible: !!to && r(to).height > 20, foldVisible: !!f && r(f).height > 20, before: !!i && !!d && i.nextElementSibling === d, radius: i ? getComputedStyle(i).borderRadius : null }; });
  ok(s12.box && /Optimised Preview/.test(s12.text) && /Standard Product View/.test(s12.text) && /only need one of them/.test(s12.text) && s12.toVisible && s12.foldVisible && s12.before && parseInt(s12.radius, 10) >= 10, 'S12 an information block between the two views says what each is for, with two working buttons, rounded boxes (no pills)', JSON.stringify({ ...s12, text: s12.text.slice(0, 60) }));
  // S11 (owner, 26 Nov): the standard view shows the whole description and the page as the shop made it: no fold button, the breadcrumb row is back
  await p.evaluate(() => window.scrollTo(0, 0)); await p.locator('#ddtv-experience #vstd').first().click({ timeout: 15000 }); await p.waitForTimeout(1500);
  const s11 = await p.evaluate(() => { const f = document.querySelector('.ddtv-fold'), t = document.querySelector('.product-details__top'), r = t && t.getBoundingClientRect(); return { cls: document.documentElement.className, foldShown: !!f && getComputedStyle(f).display !== 'none', topW: r ? Math.round(r.width) : null, back: !!document.getElementById('ddtv-back'), selects: document.querySelectorAll('.details-product-option select').length, bag: !!document.querySelector('.details-product-purchase button, .details-product-purchase__add-to-bag') }; });
  ok(/ddtv-classic/.test(s11.cls) && !s11.foldShown && (s11.topW === null || s11.topW > 100) && s11.back && s11.selects >= 4, 'S11 the standard view: no fold button, the breadcrumb row is back, the shop\'s four selectors are there, one button returns to the optimised preview', JSON.stringify(s11));
  const s13 = await p.evaluate(() => { const b = document.getElementById('ddtv-backbox'), k = document.getElementById('ddtv-back'); return { box: !!b, text: b ? b.textContent : '', btn: !!k && k.getBoundingClientRect().height > 20, label: k ? k.textContent : '', info: !!document.getElementById('ddtv-info') }; });
  ok(s13.box && /You are in the Standard Product View/.test(s13.text) && /only need one of them/.test(s13.text) && s13.btn && /Optimised Preview/.test(s13.label) && !s13.info, 'S13 the standard view opens with the same kind of block (where you are, what the other view is for) and one working button back', JSON.stringify({ ...s13, text: s13.text.slice(0, 50) }));
  await p.click('#ddtv-back'); await p.waitForTimeout(1200);
  // S7: product guard
  await p.evaluate(() => DDTVX._test.onPage({ type: 'PRODUCT', productId: 1 }));
  const off = await p.evaluate(() => ({ host: !!document.getElementById('ddtv-experience'), cls: document.documentElement.classList.contains('ddtv-on'), fold: !!document.querySelector('.ddtv-fold') }));
  await p.evaluate(() => DDTVX._test.onPage({ type: 'PRODUCT', productId: 831592302 })); await p.waitForTimeout(800);
  const on = await p.evaluate(() => !!document.getElementById('ddtv-experience'));
  ok(!off.host && !off.cls && !off.fold && on, 'S7 another product removes the television and the fold; the listed product mounts it again', JSON.stringify({ off, on }));

  // S9: what search engines read stays Ecwid's
  const seoAfter = await seo();
  ok(JSON.stringify(seoAfter) === JSON.stringify(seoBefore) && seoBefore.ld.length > 100, 'S9 the title, canonical address, meta description, robots and the structured data stay exactly Ecwid\'s', seoBefore.title + ' · ' + seoBefore.canon);
  // S6
  const bad = posts.filter((u) => /cart|checkout|order|payment/i.test(u) && !/catalog/i.test(u));
  ok(bad.length === 0, 'S6 no cart, checkout or order request', bad.join(' | ') || posts.length + ' POSTs, all catalogue');
  const ours = errs.filter((e) => !/^Uncaught \(in promise\)/.test(e) && !/#<Object>/.test(e));
  ok(ours.length === 0, 'S6 no page error of ours', ours.join(' | '));
  console.log(fails ? `\n${fails} check(s) FAILED` : '\nAll experience checks passed (E2: real Ecwid DOM, local, nothing saved)');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
