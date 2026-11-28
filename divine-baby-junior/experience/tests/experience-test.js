/* The Baby Experience on the Ecwid imitation: both views, the selection laws, the prices, tablets and phones.
   node experience/tests/experience-test.js OUTDIR */
const { chromium, devices } = require('playwright'); const path = require('path'); const fs = require('fs');
const out = process.argv[2] || 'docs/shots';
const tv = 'file://' + path.resolve(__dirname, '../harness/tv.html'), ph = 'file://' + path.resolve(__dirname, '../harness/phone.html');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const PRICE = { '60x110': [239, 279], '60x120': [255.78, 295.78], '70x130': [269, 309], '70x140': [289, 329], '70x160': [309, 369], '80x160': [359, 419], '80x180': [409, 469], '80x200': [469, 529] };
const fmt = n => '£' + (Number.isInteger(n) ? n : n.toFixed(2));
const SR = "document.getElementById('ddtv-experience').shadowRoot";
const ev = (p, code) => p.evaluate(code);
const click = (p, sel) => p.evaluate('(' + SR + ').querySelector(' + JSON.stringify(sel) + ').click()');
const idle = p => p.waitForFunction(() => { const r = document.getElementById('ddtv-experience').shadowRoot; return !r.querySelector('[data-readall][disabled]') && document.querySelector('.details-product-price').style.visibility !== 'hidden'; }, null, { timeout: 60000 });
const q = (code) => '(' + SR + ').' + code;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(tv); await p.waitForSelector('#ddtv-experience'); await p.waitForTimeout(1200);
  ok(await ev(p, "!!document.getElementById('ddtv-experience').shadowRoot && document.documentElement.classList.contains('ddtv-on')"), 'the television mounts on the product page');
  ok(await ev(p, "getComputedStyle(document.querySelector('.product-details__sidebar')).width === '1px' && getComputedStyle(document.querySelector('.product-details__product-title')).width === '1px'"), 'Ecwid\'s sidebar and title are out of sight in the television (still in the page)');
  ok(await ev(p, "getComputedStyle(document.querySelector('.product-details__description')).maxHeight === '0px' && !!document.getElementById('ddtv-info')"), 'the description is folded under the television, with the two-ways block');
  ok(await ev(p, "document.querySelector('#ddtv-pointer') && document.querySelector('#ddtv-pointer').getAttribute('data-ddtv-model') === 'baby' && document.querySelector('#ddtv-pointer').getAttribute('data-ddtv-product') === '876311857'"), 'the pointer element for this product is in the description');

  /* ---------- explore: the topics, as organised from the Botanic Experience ---------- */
  const topics = await ev(p, '[...' + q('querySelectorAll("[data-topic]")') + '].map(b => b.textContent.trim())');
  ok(topics.join() === 'Discover,Origin,Healthy,Comfort,Benefits,Ventilation,Hygiene,Cover,Firmness,Care & Fit', 'Explore has the ten topics, in this order: ' + topics.join(' / '));
  ok(topics.indexOf('Healthy') > -1 && !topics.some(t => /Deliver|7-zone|Seven|Size|Height|Depth/i.test(t)), 'a Healthy topic is there; no Delivery, no 7-zone, and no Size or Depth topic in Explore (those are in Select & Buy)');
  ok(await ev(p, q('querySelectorAll("[data-part]")') + '.length === 4'), 'Discover has 4 parts (A to D)');
  ok(await ev(p, q('querySelector("video[data-vkey=origin]")') + ' && ' + q('querySelector("video[data-vkey=origin]")') + '.getAttribute("data-end") === "13.2"'), 'the origin film (latex falls, gathers, pours) is at the start of Explore, trimmed to 13.2 s');
  await click(p, '.act [data-goto]'); await p.waitForTimeout(200);
  ok(await ev(p, q('querySelector(".kid.on")') + '.textContent.indexOf("At A Glance") > -1'), 'Next moves to the next part (At A Glance)');
  const sections = {};
  for (const t of ['origin', 'healthy', 'comfort', 'benefits', 'ventilation', 'hygiene', 'cover', 'firmness', 'care']) {
    await click(p, '[data-topic="' + t + '"]'); await p.waitForTimeout(120);
    sections[t] = await ev(p, '({n:' + q('querySelectorAll("[data-part]")') + '.length, imgs:' + q('querySelectorAll(".answer img")') + '.length, vid:[...' + q('querySelectorAll("video[data-vkey]")') + '].map(v=>v.dataset.vkey).join(), txt:' + q('querySelector(".answer")') + '.textContent.length})');
  }
  ok(Object.values(sections).every(s => s.n >= 2 && s.txt > 150), 'every topic has two or more parts with real content: ' + Object.keys(sections).map(k => k + ':' + sections[k].n).join(' '));
  ok(Object.values(sections).every(s => s.imgs === 0), 'no gallery inside the Explore content: the pictures live in the card on the right');
  ok(sections.origin.vid === 'origin' && sections.ventilation.vid === 'vent', 'films: origin in Origin, airflow in Ventilation');
  await click(p, '[data-topic="firmness"]'); await p.waitForTimeout(150);
  ok(await ev(p, q('querySelector(".answer")') + '.textContent.indexOf("Medium") > -1 && !' + q('querySelector(".answer")') + '.querySelector("[data-pick-size],[data-pick-height]")'), 'Firmness is explained in Explore, with nothing to select');
  await click(p, '[data-topic="cover"]'); await p.waitForTimeout(150);
  ok(await ev(p, q('querySelector(".answer")') + '.textContent.indexOf("100% cotton") > -1 && !' + q('querySelector(".answer")') + '.querySelector("[data-pick-size],[data-pick-height]")'), 'Cover is explained in Explore, with nothing to select');
  /* the picture card follows the topic, beside the mattress */
  const slideAt = async () => ev(p, '(function(){var v=' + q('querySelector("#mine .slv")') + ';return Math.round(v.scrollLeft/v.clientWidth);})()');
  ok(await slideAt() === 3, 'Cover: the right-hand card shows the quilting picture (3)');
  await click(p, '[data-topic="origin"]'); await p.waitForTimeout(150); const sO = await slideAt();
  await click(p, '[data-topic="ventilation"]'); await p.waitForTimeout(150); const sV = await slideAt();
  ok(sO === 1 && sV === 2, 'Origin shows the open mattress (1); Ventilation shows the latex core with its channels (2)');
  ok(await ev(p, q('querySelectorAll("#mine .slv .sl")') + '.length === 6 && ' + q('querySelectorAll("#mine .dot")') + '.length === 6'), 'the card holds 5 photographs and the size drawing, with dots');
  /* the film: a card that opens large, and closes */
  await click(p, '[data-play="vent"]'); await p.waitForTimeout(200);
  ok(await ev(p, '!' + q('getElementById("vmodal")') + '.hidden && /airflow-ventilation/.test(' + q('getElementById("vfull")') + '.getAttribute("src"))'), 'the film opens large');
  await click(p, '.vclose'); ok(await ev(p, q('getElementById("vmodal")') + '.hidden && !' + q('getElementById("vfull")') + '.getAttribute("src")'), 'the film closes and stops');
  await click(p, '#allbtn'); ok(await ev(p, '!' + q('getElementById("all")') + '.hidden && ' + q('querySelectorAll(".allc button")') + '.length >= 25'), 'All topics lists every part');
  await p.evaluate('(' + SR + ').querySelector(".ddx").dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))');
  ok(await ev(p, q('getElementById("all")') + '.hidden'), 'Escape closes All topics');
  const shown = await ev(p, q('textContent'));
  ok(!/12 cm|4\.7 in/.test(shown), 'no 12 cm anywhere in the television');
  ok(!/\bHeight\b/.test(shown), 'the word Height is not used: it is Depth');
  const tvJs = fs.readFileSync(path.resolve(__dirname, '../dist/' + fs.readdirSync(path.resolve(__dirname, '../dist')).find(f => /^baby-tv-/.test(f))), 'utf8');
  const css = (/var TV_CSS = ("(?:[^"\\]|\\.)*");/.exec(tvJs) || [])[1]; const hex = new Set(((css ? JSON.parse(css) : '').match(/#[0-9A-Fa-f]{3,8}\b/g) || []).map(h => h.toUpperCase().replace('#', '')));
  const allowed = new Set(['003A68', '006591', 'B2E3FB', '91E8F1', 'E4E8F0', 'FFFFFF', 'FFF']);
  ok([...hex].every(h => allowed.has(h)), 'palette guard: only the Bio Comfort colours in the television CSS ' + [...hex].filter(h => !allowed.has(h)).join(','));
  const content = JSON.stringify(JSON.parse(/var DATA = (\{.*?\});\nvar /s.exec(tvJs)[1]).chapters);
  ok(!/coir|coconut/i.test(tvJs) && !/organic|hypoallergenic|waterproof|washable|medically|newborn|SIDS|clinically|certified|safest|healthiest|best for (your )?baby|anti-?bacterial|dust ?mite/i.test(content), 'no coir, organic, hypoallergenic, waterproof, certified, superlative or medical wording in the content');

  /* ---------- select & buy: only Size and Depth ---------- */
  await click(p, '#galbtn'); await p.waitForTimeout(200);
  ok(await ev(p, q('querySelectorAll(".steps .stp")') + '.length === 2 && ' + q('querySelectorAll(".steps .stp .st1")') + '[0].textContent === "Size" && ' + q('querySelectorAll(".steps .stp .st1")') + '[1].textContent === "Depth"'), 'the order card has two choices only: Size and Depth (plus Review)');
  ok(await ev(p, '!/Firmness|Cover|Cotton/i.test(' + q('querySelector(".order")') + '.textContent + ' + q('querySelector(".answer")') + '.textContent)'), 'Firmness and Cover are not in Select & Buy: nothing to select there');
  const grp = await ev(p, '[...' + q('querySelectorAll(".grp")') + '].map(g => g.querySelector(".lab2").textContent.split(" · ")[0] + ":" + g.querySelectorAll("[data-pick-size]").length + ":" + Math.round(g.getBoundingClientRect().top))');
  ok(grp.length === 2 && /^Baby Cot Size:4:/.test(grp[0]) && /^Junior Size:4:/.test(grp[1]) && +grp[1].split(':')[2] > +grp[0].split(':')[2], 'Baby Cot Size and Junior Size are stacked, one under the other, four sizes each: ' + grp.join(' | '));
  let g = await ev(p, '({guide:' + q('querySelector(".guide")') + '.textContent, dis:' + q('querySelector(".bag")') + '.disabled})');
  ok(g.dis && /Still to choose: Size · Depth/.test(g.guide), 'law 4: the bag button is off and names what is missing: ' + g.guide);
  await click(p, '[data-pick-size="60x120"]'); await p.waitForTimeout(300);
  g = await ev(p, '({guide:' + q('querySelector(".guide")') + '.textContent, dis:' + q('querySelector(".bag")') + '.disabled})');
  ok(g.dis && /Still to choose: Depth/.test(g.guide), 'law 4: after the size, only the depth is missing: ' + g.guide);
  ok(await ev(p, 'document.querySelector(".details-product-option--Size select").value.indexOf("60 × 120") > -1'), 'the size goes into Ecwid\'s own dropdown');
  await click(p, '[data-next="depth"]'); await click(p, '[data-pick-height="10"]'); await p.waitForTimeout(500); await idle(p); await p.waitForTimeout(1800); await idle(p);
  const a = await ev(p, '({price:document.getElementById("proto-price").textContent, mine:' + q('querySelector(".pv")') + '.textContent, hc:[...' + q('querySelectorAll(".hc .pr")') + '].map(e=>e.textContent), s:document.querySelector(".details-product-option--Size select").value, h:document.querySelector(".details-product-option--Height select").value, vis:document.querySelector(".details-product-price").style.visibility, pe:document.getElementById("proto-add").style.pointerEvents, face:' + q('querySelector(".bag")') + '.textContent, ready:' + q('querySelector(".bag")') + '.classList.contains("ready"), slide:Math.round(' + q('querySelector("#mine .slv")') + '.scrollLeft/' + q('querySelector("#mine .slv")') + '.clientWidth)})');
  console.log('after choosing', JSON.stringify(a));
  ok(a.price === fmt(255.78) && a.mine === fmt(255.78), 'the television shows Ecwid\'s price: ' + a.mine);
  ok(a.hc.join() === fmt(255.78) + ',' + fmt(295.78), 'both depths of the size show the prices Ecwid gave: ' + a.hc.join(' / '));
  ok(/60 × 120/.test(a.s) && /10 cm/.test(a.h) && a.vis !== 'hidden' && a.pe !== 'none', 'the customer\'s selection and Ecwid\'s price and bag are back after the other depth was read');
  ok(/Add to Bag/.test(a.face) && a.ready, 'law 1: size and depth chosen, the bag button is READY');
  ok(a.slide === 5, 'the picture card shows the chosen size drawn in proportion');
  await click(p, '.bag'); await p.waitForTimeout(700);
  ok(await ev(p, 'window.__bagClicks === 1'), 'the bag button presses Ecwid\'s own Add to Bag once');
  ok(/Go to Checkout/.test(await ev(p, q('querySelector(".bag")') + '.textContent')), 'law 3: when the bag holds this choice, the button becomes Go to Checkout');
  await click(p, '.bag'); ok(await ev(p, 'window.__cartOpened === 1 && window.__bagClicks === 1'), 'Go to Checkout opens Ecwid\'s shopping cart (and does not add again)');
  await click(p, '[data-step="depth"]'); await click(p, '[data-pick-height="14"]'); await p.waitForTimeout(1500);
  g = await ev(p, '({t:' + q('querySelector(".bag")') + '.textContent, guide:' + q('querySelector(".guide")') + '.textContent})');
  ok(/Add to Bag/.test(g.t) && /not in the bag yet/.test(g.guide), 'law 2: a changed choice makes the button Add to Bag again: ' + g.guide);
  ok(await ev(p, 'document.getElementById("proto-price").textContent === "' + fmt(295.78) + '"'), 'the new price is Ecwid\'s (' + fmt(295.78) + ')');
  /* review */
  await click(p, '[data-step="review"]'); ok(await ev(p, q('querySelectorAll(".rv li")') + '.length === 2 && ' + q('querySelector(".rvp b")') + '.textContent === "' + fmt(295.78) + '"'), 'Review lists Size and Depth only, with Ecwid\'s price');
  /* every price */
  await click(p, '[data-step="prices"]'); await p.waitForTimeout(200);
  await click(p, '[data-readall]'); await p.waitForTimeout(400);
  ok(await ev(p, 'document.querySelector(".details-product-price").style.visibility === "hidden" && document.getElementById("proto-add").style.pointerEvents === "none" && document.querySelector(".details-product-option--Size").style.pointerEvents === "none"'), 'while every price is read, Ecwid\'s price, Add to Bag and dropdowns are blocked');
  await p.waitForFunction(() => document.querySelectorAll('#ddtv-experience').length && !document.getElementById('ddtv-experience').shadowRoot.querySelector('[data-readall]'), null, { timeout: 60000 }); await p.waitForTimeout(800);
  const cells = await ev(p, '[...' + q('querySelectorAll(".mxb")') + '].map(b => b.textContent)');
  const want = []; Object.keys(PRICE).forEach(k => PRICE[k].forEach(n => want.push(fmt(n))));
  ok(cells.length === 16 && cells.every((t, i) => t === want[i]), 'all 16 prices read, each equal to Ecwid\'s own: ' + cells.join(' '));
  const back = await ev(p, '({s:document.querySelector(".details-product-option--Size select").value, h:document.querySelector(".details-product-option--Height select").value, vis:document.querySelector(".details-product-price").style.visibility, pe:document.getElementById("proto-add").style.pointerEvents, price:document.getElementById("proto-price").textContent})');
  ok(/60 × 120/.test(back.s) && /14 cm/.test(back.h) && back.vis !== 'hidden' && back.pe !== 'none' && back.price === fmt(295.78), 'the customer\'s selection (60 × 120, 14 cm) and Ecwid\'s price are back after the full read');
  ok(!/£/.test(fs.readFileSync(path.resolve(__dirname, '../src/data.json'), 'utf8')) && !/£\d/.test(fs.readFileSync(path.resolve(__dirname, '../src/tv.js'), 'utf8') + fs.readFileSync(path.resolve(__dirname, '../src/core.js'), 'utf8') + fs.readFileSync(path.resolve(__dirname, '../src/phone.js'), 'utf8')), 'no price is typed into the content or the scripts');
  /* matrix cell */
  await click(p, '[data-pair="70x130,10"]'); await p.waitForTimeout(1200);
  ok(await ev(p, 'document.querySelector(".details-product-option--Size select").value.indexOf("70 × 130") > -1 && document.getElementById("proto-price").textContent === "' + fmt(269) + '"'), 'a matrix price selects its size and depth in Ecwid (70 × 130, 10 cm, ' + fmt(269) + ')');
  /* reverse sync */
  await p.selectOption('.details-product-option--Size select', { label: 'Junior Size: 80 × 200 cm (31.5″ × 78.7″)' }); await p.waitForTimeout(1800);
  ok(await ev(p, q('querySelector(".stp[data-step=size] .st2")') + '.textContent.indexOf("80 × 200") === 0'), 'the television follows Ecwid\'s own dropdown');
  await p.screenshot({ path: out + '/x-tv-final.png' });

  /* ---------- the two views ---------- */
  await click(p, '[data-view="std"]'); await p.waitForTimeout(500);
  ok(await ev(p, 'document.documentElement.classList.contains("ddtv-classic") && !!document.getElementById("ddtv-backbox") && getComputedStyle(document.getElementById("ddtv-experience")).display === "none" && getComputedStyle(document.querySelector(".product-details__sidebar")).width !== "1px" && getComputedStyle(document.querySelector(".product-details__description")).maxHeight !== "0px"'), 'Standard Product View: the shop\'s own page is back (sidebar, description), with the way back');
  ok(await ev(p, 'document.querySelector(".details-product-option--Size select").value.indexOf("80 × 200") > -1'), 'the choice made in the television is in the shop\'s dropdowns');
  ok(await ev(p, 'document.querySelectorAll(".dbj-car__dot").length === 5'), 'the description\'s gallery has its dots in the standard view');
  await p.click('#ddtv-back'); await p.waitForTimeout(500);
  ok(await ev(p, 'document.documentElement.classList.contains("ddtv-on") && !document.getElementById("ddtv-backbox")'), 'Optimised Preview: back from the standard view');
  await p.click('#ddtv-fold, .ddtv-fold'); await p.waitForTimeout(300);
  ok(await ev(p, 'document.documentElement.classList.contains("ddtv-desc-open") && getComputedStyle(document.querySelector(".product-details__description")).maxHeight !== "0px"'), 'Read the full description opens the folded description');
  ok(errs.length === 0, 'no page errors ' + errs.join('|'));
  await ctx.close();

  /* ?ddtv=off switches everything off */
  const c0 = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p0 = await c0.newPage(); await p0.goto(tv + '?ddtv=off'); await p0.waitForTimeout(1500);
  ok(await p0.evaluate(() => !document.getElementById('ddtv-experience')), '?ddtv=off: nothing is mounted');
  await c0.close();

  /* ---------- tablets and narrow windows ---------- */
  for (const [w, h, name] of [[1024, 768, 'ipad-landscape'], [834, 1100, 'ipad-portrait'], [700, 900, 'narrow']]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); const qq = await c.newPage(); await qq.goto(tv); await qq.waitForSelector('#ddtv-experience'); await qq.waitForTimeout(900);
    let ov = await qq.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(ov <= 0, name + ' (' + w + ' px): Explore has no horizontal overflow (' + ov + ')');
    await (await qq.$('#ddtv-experience')).screenshot({ path: out + '/x-' + name + '-explore.png' });
    await qq.evaluate('(' + SR + ').querySelector("#galbtn").click()'); await qq.waitForTimeout(200);
    ov = await qq.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(ov <= 0, name + ' (' + w + ' px): Select & Buy has no horizontal overflow (' + ov + ')');
    await (await qq.$('#ddtv-experience')).screenshot({ path: out + '/x-' + name + '.png' });
    await c.close();
  }

  /* ---------- the phone ---------- */
  const c3 = await b.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' }); const p3 = await c3.newPage(); const e3 = []; p3.on('pageerror', e => e3.push(e.message));
  await p3.goto(ph); await p3.waitForSelector('#ddp-cta'); await p3.waitForTimeout(600);
  ok(await p3.evaluate(() => !document.getElementById('ddtv-experience')), 'phone: the television does not start');
  ok(await p3.evaluate(() => { const c = document.getElementById('ddp-cta'), o = document.querySelector('.details-product-option'); return c.parentNode === o.parentNode && !!(c.compareDocumentPosition(o) & 4); }), 'phone: the Configure button sits above Ecwid\'s own options');
  ok(await p3.evaluate(() => document.getElementById('ddp-note').textContent.indexOf('Still to choose: Size · Depth') === 0), 'phone: the status line names what is missing');
  await p3.click('#ddp-cta'); await p3.waitForTimeout(300);
  const SP = "document.getElementById('ddp-sheet').shadowRoot";
  const pc = sel => p3.evaluate('(' + SP + ').querySelector(' + JSON.stringify(sel) + ').click()');
  ok(await p3.evaluate('getComputedStyle(document.documentElement).overflow === "hidden"'), 'phone: the page behind the sheet does not scroll');
  ok(await p3.evaluate('(' + SP + ').querySelector("[data-go=depth]").disabled'), 'phone: Continue is off until a size is chosen');
  ok(await p3.evaluate('(' + SP + ').querySelectorAll("[data-pick-size]").length === 8 && (' + SP + ').querySelectorAll(".lab2").length === 2'), 'phone: Baby Cot Size and Junior Size are both listed, stacked');
  await pc('[data-pick-size="80x180"]'); await p3.waitForTimeout(300);
  ok(await p3.evaluate('document.querySelector(".details-product-option--Size select").value.indexOf("80 × 180") > -1'), 'phone: the size goes into Ecwid\'s dropdown');
  await pc('[data-go="depth"]'); await pc('[data-pick-height="14"]'); await p3.waitForTimeout(3000);
  ok(await p3.evaluate('[...(' + SP + ').querySelectorAll(".hc .pr")].map(e=>e.textContent).join() === "' + fmt(409) + ',' + fmt(469) + '"'), 'phone: both depths show Ecwid\'s prices (' + fmt(409) + ' / ' + fmt(469) + ')');
  await pc('[data-go="review"]'); await p3.waitForTimeout(300);
  ok(await p3.evaluate('(' + SP + ').querySelector(".rvp b").textContent === "' + fmt(469) + '" && (' + SP + ').querySelectorAll(".rv li").length === 2'), 'phone: the review lists Size and Depth, with Ecwid\'s price ' + fmt(469));
  await pc('[data-bag]'); await p3.waitForTimeout(700);
  ok(await p3.evaluate('window.__bagClicks === 1 && /Go to Checkout/.test((' + SP + ').querySelector("[data-bag]").textContent)'), 'phone: Add to Bag presses Ecwid\'s button, then the button is Go to Checkout');
  await p3.screenshot({ path: out + '/x-phone-review.png' });
  await pc('[data-close]'); await p3.waitForTimeout(300);
  ok(await p3.evaluate(() => !document.getElementById('ddp-sheet') && getComputedStyle(document.documentElement).overflow !== 'hidden' && /^Review your mattress/.test(document.getElementById('ddp-cta').textContent)), 'phone: closing returns the page; the button now says Review your mattress');
  ok(await p3.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, 'phone: no horizontal overflow');
  ok(e3.length === 0, 'no page errors on the phone ' + e3.join('|'));
  console.log(fails ? 'FAILURES: ' + fails : 'ALL PASSED'); await b.close();
  process.exit(fails ? 1 : 0);
})();
