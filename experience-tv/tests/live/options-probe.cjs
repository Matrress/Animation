/*
 * READ-ONLY, LOCAL. How do the native Ecwid options of the public Botanic page (831592302) behave?
 *
 * Reports: the option blocks in order (title, control type, required, choices and their labels, selectors), the price
 * state before anything is chosen, and the price and the other options after each choice, so that the order of a guided
 * flow and the dependencies between options rest on observation. It chooses values in this LOCAL page only; nothing is
 * saved, no cart is touched, and Add to Bag is never clicked (it is only inspected: present, enabled, its text).
 *
 *   NODE_PATH=$(npm root -g) node tests/live/options-probe.cjs [iphone|desktop] [out.json]
 */
const { chromium, devices } = require('playwright');
const fs = require('fs');
const URL_ = 'https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop';
const PROFILE = process.argv[2] || 'iphone';
const OUT = process.argv[3] || '';
const ctxOpts = PROFILE === 'iphone' ? devices['iPhone 13'] : { viewport: { width: 1440, height: 900 } };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext(ctxOpts);
  const p = await ctx.newPage();
  const events = [];
  await p.goto(URL_, { waitUntil: 'load', timeout: 120000 });
  await p.waitForSelector('.details-product-option', { timeout: 60000 });
  await p.waitForTimeout(3000);
  try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2500 }); } catch (e) {}

  const snap = () => p.evaluate(() => {
    const T = e => (e && e.textContent || '').replace(/\s+/g, ' ').trim();
    const price = document.querySelector('.details-product-price__value, .product-details__product-price .details-product-price__value, [class*="product-price"] [class*="value"]');
    const priceBlock = document.querySelector('.product-details__product-price, .details-product-price');
    const opts = Array.from(document.querySelectorAll('.details-product-option')).map((o, i) => {
      const sel = o.querySelector('select');
      const radios = o.querySelectorAll('input[type=radio]'), checks = o.querySelectorAll('input[type=checkbox]');
      const title = T(o.querySelector('.details-product-option__title, .form-control__label, label'));
      const control = sel ? 'select' : radios.length ? 'radio' : checks.length ? 'checkbox' : (o.querySelector('input,textarea') ? 'input' : 'other');
      return {
        index: i, classes: o.className.replace(/\s+/g, ' ').slice(0, 120), title,
        control, required: /\*/.test(T(o.querySelector('.form-control__label, label'))) || !!o.querySelector('[aria-required=true],[required]'),
        value: sel ? sel.value : null,
        selectedLabel: sel ? (sel.options[sel.selectedIndex] || {}).text : null,
        choices: sel ? Array.from(sel.options).map(x => ({ v: x.value, t: x.text.replace(/\s+/g, ' ').trim(), disabled: x.disabled })) : [],
        selectId: sel ? sel.id : null, selectName: sel ? sel.name : null
      };
    });
    const atb = Array.from(document.querySelectorAll('button')).find(x => /add to (bag|cart)/i.test(x.textContent));
    return {
      priceText: priceBlock ? T(priceBlock) : null, priceValue: price ? T(price) : null,
      options: opts,
      addToBag: atb ? { text: T(atb), disabled: atb.disabled || atb.getAttribute('aria-disabled') === 'true' } : null,
      errorsVisible: Array.from(document.querySelectorAll('.form-control--error, .form-control__inline-label--error, [class*="error"]')).filter(e => e.offsetParent).map(e => T(e).slice(0, 80)).slice(0, 5),
      ecwid: !!window.Ecwid
    };
  });

  const initial = await snap();
  // Lifecycle: what Ecwid exposes, whether option nodes survive a choice, which events fire, how fast the price follows.
  const life = await p.evaluate(async () => {
    const out = { ecwidKeys: window.Ecwid ? Object.keys(window.Ecwid).filter(k => /^On|^get|^refresh|^open|^init|^Cart/.test(k)).slice(0, 60) : null };
    const sel = document.querySelector('.details-product-option--SIZE select'); const wrap = document.querySelector('.details-product-option--SIZE');
    const price = () => (document.querySelector('.details-product-price__value') || {}).textContent;
    if (!sel) return out;
    sel.__mark = 1; wrap.__mark = 1; const priceEl = document.querySelector('.details-product-price__value'); if (priceEl) priceEl.__mark = 1;
    const ev = []; ['input', 'change', 'click', 'focusin'].forEach(t => document.addEventListener(t, e => ev.push(t + ':' + (e.target.tagName || '') + (e.isTrusted ? '' : '(synthetic)')), true));
    const before = price(); const t0 = performance.now(); let tPrice = null;
    const mo = new MutationObserver(() => { if (tPrice === null && price() !== before) tPrice = performance.now() - t0; }); mo.observe(document.body, { subtree: true, childList: true, characterData: true });
    const opt = Array.from(sel.options).find(o => /UK King/.test(o.text)); sel.value = opt.value; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 1500)); mo.disconnect();
    const sel2 = document.querySelector('.details-product-option--SIZE select');
    out.afterChange = { selectNodeSurvived: !!(sel2 && sel2.__mark), optionBlockSurvived: !!(document.querySelector('.details-product-option--SIZE') || {}).__mark, priceNodeSurvived: !!((document.querySelector('.details-product-price__value') || {}).__mark), priceBefore: before, priceAfter: price(), msUntilPriceChanged: tPrice === null ? null : Math.round(tPrice), eventsSeen: ev.slice(0, 8) };
    // restore the local state
    sel2.value = sel2.options[0].value; sel2.dispatchEvent(new Event('input', { bubbles: true })); sel2.dispatchEvent(new Event('change', { bubbles: true }));
    return out;
  });
  console.log('LIFECYCLE', JSON.stringify(life));
  await p.waitForTimeout(1000);
  const steps = [];
  // Choose, in the order the page lists them, the FIRST real choice of each select (a LOCAL, unsaved selection).
  const n = initial.options.filter(o => o.control === 'select').length;
  for (let k = 0; k < n; k++) {
    const state = await snap();
    const o = state.options.filter(x => x.control === 'select')[k];
    const first = o.choices.find(c => c.v !== '' && !c.disabled && !/^(select|please choose)/i.test(c.t));
    if (!first) { steps.push({ option: o.title, skipped: 'no concrete choice' }); continue; }
    const t0 = Date.now();
    await p.locator('.details-product-option').nth(o.index).locator('select').selectOption(first.v);
    await p.waitForTimeout(1200);
    const after = await snap();
    steps.push({ chose: o.title, label: first.t, priceBefore: state.priceValue, priceAfter: after.priceValue, addToBagAfter: after.addToBag, others: after.options.map(x => ({ title: x.title, selected: x.selectedLabel, choiceCount: x.choices.length, choices: x.choices.map(c => c.t).slice(0, 30) })), ms: Date.now() - t0 });
  }
  const final = await snap();
  // dependency check: does changing the FIRST option change the lists of the others?
  const dep = [];
  const sizeOpt = initial.options.findIndex(o => /size/i.test(o.title));
  if (sizeOpt >= 0 && initial.options[sizeOpt].choices.length > 2) {
    const base = (await snap()).options.map(o => o.choices.map(c => c.t).join('|'));
    const alt = initial.options[sizeOpt].choices.filter(c => c.v !== '' && !/^(select|please choose)/i.test(c.t));
    for (const c of [alt[0], alt[Math.floor(alt.length / 2)], alt[alt.length - 1]].filter(Boolean)) {
      await p.locator('.details-product-option').nth(sizeOpt).locator('select').selectOption(c.v);
      await p.waitForTimeout(900);
      const s = await snap();
      dep.push({ size: c.t, price: s.priceValue, otherListsSameAsBefore: s.options.map((o, i) => i === sizeOpt ? true : o.choices.map(x => x.t).join('|') === base[i]) });
    }
  }
  const out = { lifecycle: life, url: URL_, profile: PROFILE, date: new Date().toISOString(), initial, steps, final, sizeDependency: dep, note: 'local selections only; nothing saved; Add to Bag never clicked' };
  console.log('INITIAL price:', initial.priceText, '| value:', initial.priceValue, '| add to bag:', JSON.stringify(initial.addToBag));
  initial.options.forEach(o => console.log(`  #${o.index} "${o.title}" ${o.control} required=${o.required} choices=${o.choices.length}: ${o.choices.slice(0, 6).map(c => c.t).join(' / ')}${o.choices.length > 6 ? ' …' : ''}`));
  steps.forEach(s => console.log('STEP', s.chose || s.option, '->', s.label || s.skipped, '| price', s.priceBefore, '->', s.priceAfter, '| add to bag', JSON.stringify(s.addToBagAfter)));
  dep.forEach(d => console.log('SIZE', d.size, '| price', d.price, '| other option lists unchanged:', JSON.stringify(d.otherListsSameAsBefore)));
  if (OUT) { fs.mkdirSync(require('path').dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(out, null, 1)); console.log('wrote ' + OUT); }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
