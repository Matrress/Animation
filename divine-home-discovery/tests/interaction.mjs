// Functional / accessibility checks against the real homepage with the section injected. Exit code 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch, openLive, VIEWPORTS, root, PREVIEW_HOST, VERSION } from './lib.mjs';
const src = fs.readdirSync(path.join(root, '.source'))[0];
const srcDir = path.join(root, '.source', src, 'divine-collection/src');
const { collections } = await import(pathToFileURL(path.join(srcDir, 'data.mjs')).href);
const { ROUTES } = await import(pathToFileURL(path.join(srcDir, 'nav.mjs')).href);
const models = [...collections.mattress.models, ...collections.topper.models];
let pass = 0, fail = 0; const failures = [];
const ok = (c, msg) => { if (c) pass++; else { fail++; failures.push(msg); console.log('  FAIL', msg); } };
const b = await launch();

// ---- 1. approved facts and links: every model, in the static HTML as served ----
{
  const { ctx, page } = await openLive(b, VIEWPORTS.desktop);
  const dom = await page.evaluate(() => [...document.querySelectorAll('#ddhd .ddhd__card')].map((c) => ({ id: c.dataset.id, name: c.querySelector('.ddhd__nm a').textContent.trim(), href: c.querySelector('.ddhd__nm a').href, go: c.querySelector('.ddhd__go').href, img: c.querySelector('img').getAttribute('src'), w: c.querySelector('img').getAttribute('width'), h: c.querySelector('img').getAttribute('height') })));
  ok(dom.length === 11, `11 cards (got ${dom.length})`);
  for (const m of models) {
    const c = dom.find((x) => x.id === m.id);
    ok(c && c.name === m.name, `${m.id}: name matches approved data`);
    ok(c && c.href === m.url && c.go === m.url, `${m.id}: both links are the approved product URL`);
    ok(c && /^\d+$/.test(c.w) && /^\d+$/.test(c.h), `${m.id}: explicit image width/height`);
  }
  ok(!dom.some((c) => /latest-design-latex-mattresses-cloud-comfort/.test(c.href)), 'retired Bio Comfort URL absent');
  const bioDp = await page.evaluate(() => { document.querySelector('#ddhd-m-bio_dp .ddhd__more').click(); return document.querySelector('.ddhd__panel').innerText; });
  ok(/25 cm . 20 \+ 5/.test(bioDp) && /28 cm . 20 \+ 8/.test(bioDp), 'Bio Comfort Dual Plush preview shows 25 cm (20 + 5) and 28 cm (20 + 8)');
  const h = await page.evaluate(() => ({ h1: document.querySelectorAll('#ddhd h1').length, heads: [...document.querySelectorAll('#ddhd h2,#ddhd h3,#ddhd h4')].map((e) => e.tagName).join(','), links: document.querySelectorAll('#ddhd a[href]').length, collections: [...document.querySelectorAll('#ddhd a[data-ddhd-collection]')].map((a) => a.href) }));
  ok(h.h1 === 0, 'no H1 inside the section');
  ok(h.heads.startsWith('H2,H3,H4') && !/H1/.test(h.heads), `heading order H2>H3>H4 (${h.heads.slice(0, 40)}...)`);
  ok(h.collections.includes(collections.mattress.url) && h.collections.includes(collections.topper.url), 'real links to both collection pages');
  await ctx.close();
}


// ---- 1b. visual-system requirements: Dual Plush diagrams = the Collection 3.13.2 SVG assets; no green text; no black buttons ----
{
  const { ctx, page } = await openLive(b, VIEWPORTS.desktop);
  const OWN = `https://cdn.jsdelivr.net/gh/Matrress/Animation@f4d9318a14f32ede544936f332f3ff4e5e800768/divine-collection/release/3.13.2/assets/`;
  for (const [id, pairs] of [['botanic_dp', collections.mattress.models.find((m) => m.id === 'botanic_dp').firm.pairs], ['bio_dp', collections.mattress.models.find((m) => m.id === 'bio_dp').firm.pairs]]) {
    await page.evaluate((id) => document.querySelector(`#ddhd-m-${id} .ddhd__more`).click(), id);
    await page.waitForTimeout(300);
    await page.evaluate(() => document.querySelectorAll('.ddhd__panel img').forEach((i) => { i.loading = 'eager'; }));
    await page.waitForFunction(() => [...document.querySelectorAll('.ddhd__dpv-i')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 15000 }).catch(() => {});
    const d = await page.evaluate(() => [...document.querySelectorAll('.ddhd__panel .ddhd__dpv')].map((li) => ({ src: li.querySelector('img').src, alt: li.querySelector('img').alt, ok: li.querySelector('img').naturalWidth > 0, vis: li.querySelector('img').getBoundingClientRect().width > 100, txt: li.innerText.replace(/\s+/g, ' ') })));
    ok(d.length === pairs.length, `${id}: one SVG diagram per approved combination (${d.length}/${pairs.length})`);
    pairs.forEach(([t1, b1], i) => {
      ok(d[i] && d[i].src === `${OWN}dual-plush-${t1}-${b1}.svg`, `${id}: diagram ${i + 1} is the Collection asset dual-plush-${t1}-${b1}.svg`);
      ok(d[i] && d[i].ok && d[i].vis, `${id}: diagram ${i + 1} loaded and visible`);
      ok(d[i] && d[i].alt === `${collections.mattress.models[0] && ({ s: 'Soft', m: 'Medium', f: 'Firm', x: 'Extra Firm' })[t1]} topper above a ${({ s: 'Soft', m: 'Medium', f: 'Firm', x: 'Extra Firm' })[b1]} mattress`, `${id}: diagram ${i + 1} alt text states topper-over-mattress`);
    });
    ok(await page.evaluate(() => !document.querySelector('.ddhd__panel .ddhd__pf .ddhd__stk')), `${id}: combinations are not repeated as a second list`);
    await page.evaluate(() => document.querySelector('.ddhd__x').click());
  }
  await page.evaluate(() => document.querySelector('.ddhd__chip[data-route="1"]').click());
  const colours = await page.evaluate(() => {
    const out = [], rgb2hsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const dd = mx - mn; s = l > .5 ? dd / (2 - mx - mn) : dd / (mx + mn); h = mx === r ? ((g - b) / dd + (g < b ? 6 : 0)) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h *= 60; } return [h, s, l]; };
    document.querySelector('#ddhd-m-bio_dp .ddhd__more').click();
    for (const e of document.querySelectorAll('#ddhd *')) {
      if (!e.offsetParent && e.tagName !== 'BODY') continue;
      const own = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own) continue;
      const m = getComputedStyle(e).color.match(/\d+(\.\d+)?/g).map(Number); const [h, s, l] = rgb2hsl(m[0], m[1], m[2]);
      if (h >= 75 && h <= 180 && s > .2 && l > .12 && l < .95) out.push(e.className + ' ' + getComputedStyle(e).color);
    }
    const btns = [...document.querySelectorAll('#ddhd button, #ddhd a.ddhd__cta, #ddhd .ddhd__tab[aria-selected="true"]')].filter((e) => e.offsetParent).map((e) => { const bg = getComputedStyle(e).backgroundImage + ' ' + getComputedStyle(e).backgroundColor; return [e.className, bg]; });
    const pureBlack = btns.filter(([, bg]) => /rgb\(0, 0, 0\)|#000\b|rgb\(([0-3]), ([0-3]), ([0-3])\)/.test(bg));
    return { green: out, pureBlack, surfaces: [getComputedStyle(document.querySelector('#ddhd-m-botanic')).backgroundImage.slice(0, 80), getComputedStyle(document.querySelector('.ddhd__panel')).backgroundImage.slice(0, 80)] };
  });
  ok(colours.green.length === 0, 'no green text anywhere in the section: ' + JSON.stringify(colours.green.slice(0, 4)));
  ok(colours.pureBlack.length === 0, 'no pure-black button/surface backgrounds: ' + JSON.stringify(colours.pureBlack.slice(0, 3)));
  ok(/linear-gradient/.test(colours.surfaces[0]) && /linear-gradient/.test(colours.surfaces[1]), 'cards and preview panel are blue-graphite gradient surfaces');
  await ctx.close();
}


// ---- 1d. owner's rule: Dual Plush wording never says "layer" (always latex topper) ----
{
  const { ctx, page } = await openLive(b, VIEWPORTS.desktop);
  const texts = [];
  for (const r of [1, 2]) {
    texts.push(await page.evaluate((r) => { document.querySelector(`.ddhd__chip[data-route="${r}"]`).click(); return document.querySelector('#ddhd .ddhd__guide').innerText; }, r));
  }
  for (const id of ['botanic_dp', 'bio_dp']) texts.push(await page.evaluate((id) => { document.querySelector(`#ddhd-m-${id} .ddhd__more`).click(); return document.querySelector('.ddhd__panel').innerText; }, id));
  ok(texts.every((t) => t.length > 40), 'Dual Plush guide and previews rendered');
  ok(texts.every((t) => !/layer/i.test(t)), 'Dual Plush wording never says "layer": ' + JSON.stringify(texts.filter((t) => /layer/i.test(t)).map((t) => (t.match(/.{30}layer.{20}/i) || [''])[0])));
  ok(/topper/i.test(texts[0]), 'Dual Plush guide says "topper"');
  await ctx.close();
}

// ---- 1e. owner's 0.5.0: Bio Dunlop mark (header, preview, bottom) with a hover/tap window; Dual Plush principle replaces "Layers with a job" ----
{
  const { ctx, page } = await openLive(b, VIEWPORTS.desktop);
  const s = await page.evaluate(async () => ({
    marks: document.querySelectorAll('#ddhd .ddhd__bio').length,
    hdr: document.querySelectorAll('#ddhd .ddhd__vh .ddhd__bio').length, ftr: document.querySelectorAll('#ddhd .ddhd__ft .ddhd__bio').length,
    imgs: [...document.querySelectorAll('#ddhd .ddhd__bio-i')].every((i) => /assets\/bio-dunlop\.svg$/.test(i.src)) && await fetch(document.querySelector('#ddhd .ddhd__bio-i').src).then((r) => r.ok && /svg/.test(r.headers.get('content-type'))),
    pr: [...document.querySelectorAll('#ddhd-mattress .ddhd__pr li')].map((l) => l.textContent),
    layersWithJob: /layers with a job/i.test(document.querySelector('#ddhd').innerText),
  }));
  ok(s.marks === 4 && s.hdr === 2 && s.ftr === 2, `Bio Dunlop mark in both views' header and bottom (${s.marks}: ${s.hdr} header, ${s.ftr} bottom)`);
  ok(s.imgs, 'Bio Dunlop SVG loads');
  ok(!s.layersWithJob && s.pr.some((t) => /^Dual Plush A latex mattress with a latex topper on top is one system: the mattress gives the support and the latex topper gives the comfort\.$/.test(t.trim())), 'principle text is the owner\'s Dual Plush wording: ' + JSON.stringify(s.pr));
  // mouse hover opens the window, leaving closes it
  await page.evaluate(() => document.querySelector('#ddhd-mattress .ddhd__vh .ddhd__bio').scrollIntoView({ block: 'center' }));
  const box = await page.locator('#ddhd-mattress .ddhd__vh .ddhd__bio-i').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(500);
  const o = await page.evaluate(() => { const d = document.querySelector('#ddhd-mattress .ddhd__vh .ddhd__bio'); const p = d.querySelector('.ddhd__bio-p'); const r = p.getBoundingClientRect(); return { open: d.open, txt: p.innerText, vis: r.width > 200 && r.height > 40, inView: r.left >= 0 && r.right <= innerWidth }; });
  ok(o.open && o.vis && o.inView && /^Fully Certified\s+Certified European production for European customers and standards\.$/i.test(o.txt.trim()) && !/Bio Dunlop/.test(o.txt), 'hover opens the window with the wording: ' + JSON.stringify(o));
  await page.mouse.move(5, 5); await page.waitForTimeout(600);
  ok(await page.evaluate(() => !document.querySelector('#ddhd-mattress .ddhd__vh .ddhd__bio').open), 'leaving closes the hover window');
  // click pins it, Escape closes
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.waitForTimeout(400);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.move(5, 5); await page.waitForTimeout(600);
  ok(await page.evaluate(() => document.querySelector('#ddhd-mattress .ddhd__vh .ddhd__bio').open), 'a click keeps the window open');
  await page.keyboard.press('Escape');
  ok(await page.evaluate(() => !document.querySelector('#ddhd-mattress .ddhd__vh .ddhd__bio').open), 'Escape closes it');
  // preview panel has one, inside the panel, and the window stays inside the viewport
  await page.evaluate(() => document.querySelector('#ddhd-m-botanic_dp .ddhd__more').click());
  const pv = await page.evaluate(() => { const d = document.querySelector('.ddhd__panel .ddhd__bio'); if (!d) return null; d.querySelector('summary').click(); const p = d.querySelector('.ddhd__bio-p').getBoundingClientRect(); return { open: d.open, w: p.width, left: p.left, right: p.right, vw: innerWidth }; });
  ok(pv && pv.open && pv.left >= 0 && pv.right <= pv.vw, 'preview panel mark opens its window: ' + JSON.stringify(pv));
  await ctx.close();
  const t2 = await openLive(b, VIEWPORTS.phone);
  const tp = await t2.page.evaluate(() => { const d = document.querySelector('#ddhd-mattress .ddhd__vh .ddhd__bio'); d.scrollIntoView({ block: 'center' }); d.querySelector('summary').click(); const p = d.querySelector('.ddhd__bio-p').getBoundingClientRect(); return { open: d.open, left: p.left, right: p.right, vw: innerWidth }; });
  ok(tp.open && tp.left >= 0 && tp.right <= tp.vw, 'phone: a tap opens the window inside the screen: ' + JSON.stringify(tp));
  await t2.ctx.close();
}

// ---- 1c. owner's 0.3.0 rules: Title Case, thin frame, line colour, weights, family edge, ambient glow, comfort sizes and contrast ----
{
  const { ctx, page } = await openLive(b, VIEWPORTS.desktop);
  const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const ratio = (a, bg) => { const [x, y] = [lum(a), lum(bg)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
  // Title Case on every button / chip / tab / card title / function line / link-button
  const bad = await page.evaluate(() => {
    const MINOR = new Set(['and', 'or', 'with', 'for', 'of', 'to', 'the', 'a', 'an', 'in', 'on', 'at', 'by', 'from', 'vs']);
    const sels = ['.ddhd__chip', '.ddhd__tab-n', '.ddhd__tab-c', '.ddhd__more span:first-child', '.ddhd__nm a', '.ddhd__fn', '.ddhd__all a', '.ddhd__needs-h', '.ddhd__pr b', '.ddhd__dpb'];
    const out = [];
    for (const s of sels) for (const e of document.querySelectorAll('#ddhd ' + s)) {
      const txt = e.textContent.replace(/\s+/g, ' ').trim();
      txt.split(' ').forEach((tok, i) => { const m = /^[^A-Za-z]*([A-Za-z][A-Za-z\u2019']*)/.exec(tok); if (!m) return; const w = m[1]; if (/^(cm|mm|kg)$/.test(w)) return; if (i > 0 && MINOR.has(w.toLowerCase())) { if (w !== w.toLowerCase()) out.push(s + ': "' + txt + '" ' + w); return; } if (w[0] !== w[0].toUpperCase()) out.push(s + ': "' + txt + '" ' + w); });
    }
    return out;
  });
  ok(bad.length === 0, 'Title Case on all buttons, chips, tabs and card labels: ' + JSON.stringify(bad.slice(0, 5)));
  const v = await page.evaluate(() => {
    const cs = (s) => getComputedStyle(document.querySelector(s));
    const fam = (id) => getComputedStyle(document.querySelector('#ddhd-m-' + id)).getPropertyValue('--fam').trim();
    return { frame: cs('.ddhd__fig').marginTop, fnColor: cs('#ddhd-m-botanic_dp .ddhd__fn').color, fnWeight: cs('.ddhd__fn').fontWeight, nameSize: parseFloat(cs('.ddhd__nm').fontSize), moreW: cs('.ddhd__more').fontWeight, moreStroke: cs('.ddhd__more').webkitTextStrokeWidth, chipStroke: cs('.ddhd__chip').webkitTextStrokeWidth, edge: getComputedStyle(document.querySelector('#ddhd-m-botanic'), '::after').content, famAttr: document.querySelectorAll('#ddhd [data-fam]').length,
      fams: { botanic: fam('botanic'), botanic_dp: fam('botanic_dp'), bio: fam('bio'), bio_dp: fam('bio_dp'), ambient: fam('ambient'), hotel: fam('hotel'), ortho: fam('ortho'), partners: fam('partners') },
      ladeSize: parseFloat(cs('.ddhd__hd .ddhd__lede').fontSize), ladeColor: cs('.ddhd__hd .ddhd__lede').color };
  });
  ok(parseFloat(v.frame) <= 6, `thin frame round the picture (${v.frame})`);
  ok(v.fnColor === 'rgb(164, 212, 220)' && v.fnWeight === '600', `line under the name is #a4d4dc and semi-bold (${v.fnColor}, ${v.fnWeight})`);
  ok(v.nameSize >= 24, `model name is large (${v.nameSize}px)`);
  ok(v.moreW === '600' && parseFloat(v.moreStroke) > 0 && parseFloat(v.chipStroke) > 0, `button text is heavier: weight ${v.moreW} + hairline stroke (${v.moreStroke}/${v.chipStroke})`);
  ok(v.edge === 'none' && v.famAttr === 0, `no coloured family edge on the cards (${v.edge}, ${v.famAttr} data-fam)`);
  ok(v.ladeSize >= 17.5 && /rgb\(27, 56, 78\)/.test(v.ladeColor), `header text is larger and darker (${v.ladeSize}px ${v.ladeColor})`);
  // contrast (AAA 7:1) of the text colours on the lightest blue-graphite stop and on the mint
  const darkBg = '#263650';
  for (const [name, hex] of [['snow', '#f7fbfd'], ['ice', '#d5e8f1'], ['sky', '#bfe3f1'], ['aqua (#a4d4dc)', '#a4d4dc'], ['mist', '#b4cbd8']]) ok(ratio(hex, darkBg) >= 7, `${name} on blue-graphite >= 7:1 (${ratio(hex, darkBg).toFixed(1)})`);
  for (const [name, hex] of [['ink', '#0e2234'], ['ink2', '#1b384e'], ['blue', '#1d5a86']]) ok(ratio(hex, '#e6f6fa') >= 6.5, `${name} on the mint area >= 6.5:1 (${ratio(hex, '#e6f6fa').toFixed(1)})`);
  // ambient glow on EVERY kind of button (hover; press is the same rule for touch)
  await page.evaluate(() => document.querySelector('#ddhd-m-botanic .ddhd__more').click());
  await page.waitForTimeout(400);
  const targets = ['.ddhd__chip[data-route="1"]', '.ddhd__tab:not([aria-selected="true"])', '#ddhd-m-ortho .ddhd__more', '.ddhd__panel .ddhd__cta', '.ddhd__panel .ddhd__x'];
  for (const sel of targets) {
    await page.locator(sel).first().scrollIntoViewIfNeeded();
    await page.locator(sel).first().hover();
    await page.waitForTimeout(450);
    const sh = await page.evaluate((s) => getComputedStyle(document.querySelector(s)).boxShadow, sel);
    ok(/rgba?\(76, 195, 238/.test(sh), `ambient glow on hover: ${sel}`);
  }
  await ctx.close();
}

// ---- 2. interaction, mouse + keyboard ----
{
  const { ctx, page, errors } = await openLive(b, VIEWPORTS.desktop);
  const S = (sel) => page.locator(sel);
  ok(await S('#ddhd-mattress').isVisible() && !(await S('#ddhd-topper').isVisible()), 'default: mattresses visible, toppers hidden');
  ok((await S('.ddhd__tab[aria-selected="true"]').getAttribute('data-tab')) === 'mattress', 'tab semantics: mattress selected');
  ok((await S('.ddhd__sw').getAttribute('role')) === 'tablist' && (await S('#ddhd-mattress').getAttribute('role')) === 'tabpanel', 'tablist / tabpanel roles');
  // open a preview with the mouse
  await S('#ddhd-m-botanic .ddhd__more').click();
  ok((await S('.ddhd__panel').count()) === 1, 'one panel after opening');
  ok((await S('#ddhd-m-botanic .ddhd__more').getAttribute('aria-expanded')) === 'true', 'opener aria-expanded=true');
  const pos = await page.evaluate(() => { const p = document.querySelector('.ddhd__pli'); const cards = [...document.querySelectorAll('.ddhd__grid--mattress > .ddhd__card')]; return { prev: p.previousElementSibling.dataset.id, ids: cards.map((c) => c.dataset.id) }; });
  ok(pos.prev === 'bio_dp', `panel sits after the end of the clicked row (after ${pos.prev})`);
  ok((await S('.ddhd__panel .ddhd__cta').getAttribute('href')) === collections.mattress.models[0].url, 'panel CTA = approved Botanic URL');
  const txt = await S('.ddhd__panel').innerText();
  ok(/Who it suits/i.test(txt) && /How it is built/i.test(txt) && /How it differs/i.test(txt) && /Depths/i.test(txt) && /20 cm/.test(txt), 'panel answers who / built / differs / depths');
  // only one at a time
  await S('#ddhd-m-ortho .ddhd__more').click();
  ok((await S('.ddhd__panel').count()) === 1 && (await S('#ddhd-m-botanic .ddhd__more').getAttribute('aria-expanded')) === 'false', 'opening another closes the first (one at a time)');
  ok((await page.evaluate(() => document.querySelector('.ddhd__pli').previousElementSibling.dataset.id)) === 'partners', 'second row: panel after the 8th card');
  // jump link inside the panel
  await S('.ddhd__panel .ddhd__jump').first().click();
  ok((await S('.ddhd__panel').count()) === 1, 'jump link keeps a single panel');
  // Escape returns focus to the opener
  await page.keyboard.press('Escape');
  ok((await S('.ddhd__panel').count()) === 0, 'Escape closes');
  const f = await page.evaluate(() => document.activeElement && document.activeElement.className + '|' + (document.activeElement.closest('.ddhd__card') || {}).id);
  ok(/ddhd__more/.test(f), `focus returns to an opener button (${f})`);
  // outside click
  await S('#ddhd-m-bio .ddhd__more').click();
  await page.mouse.click(20, 300);
  ok((await S('.ddhd__panel').count()) === 0, 'outside pointer closes the preview');
  // keyboard: focus an opener, Enter, focus moves into the panel, Escape back
  await S('#ddhd-m-ambient .ddhd__more').focus();
  await page.keyboard.press('Enter');
  ok(await page.evaluate(() => document.activeElement.classList.contains('ddhd__panel')), 'keyboard open moves focus into the preview');
  await page.keyboard.press('Tab');
  ok(await page.evaluate(() => !!document.activeElement.closest('.ddhd__panel') && document.activeElement.classList.contains('ddhd__x')), 'Tab goes to the close button first');
  await page.keyboard.press('Escape');
  ok(await page.evaluate(() => document.activeElement.closest('#ddhd-m-ambient') != null), 'Escape returns to the Ambient opener');
  // needs: highlight, never hide
  await S('.ddhd__chip[data-route="1"]').click();
  const need = await page.evaluate(() => ({ match: [...document.querySelectorAll('.ddhd__card.is-match')].map((c) => c.dataset.id), dim: document.querySelectorAll('.ddhd__card.is-dim').length, vis: [...document.querySelectorAll('.ddhd__grid--mattress .ddhd__card')].every((c) => c.offsetParent !== null), guide: !document.querySelector('.ddhd__guide').hidden, links: [...document.querySelectorAll('.ddhd__guide a')].map((a) => a.href) }));
  ok(JSON.stringify(need.match.sort()) === JSON.stringify(ROUTES[1].models.map((m) => m.id).sort()), `route 2 matches ${need.match}`);
  ok(need.dim === 8 - ROUTES[1].models.length && need.vis, 'non-matching cards dimmed, all 8 still visible');
  ok(need.guide && need.links.length === ROUTES[1].models.length, 'guidance box lists the matching models with real links');
  ok((await S('.ddhd__chip[aria-pressed="true"]').count()) === 1, 'exactly one chip pressed');
  // switching view keeps the need, closes preview
  await S('#ddhd-m-botanic .ddhd__more').click();
  await S('#ddhd-tab-topper').click();
  ok(await S('#ddhd-topper').isVisible() && !(await S('#ddhd-mattress').isVisible()) && (await S('.ddhd__panel').count()) === 0, 'view switch shows toppers and closes the preview');
  await S('#ddhd-tab-mattress').click();
  ok((await S('.ddhd__card.is-match').count()) === ROUTES[1].models.length, 'need selection survives a view switch');
  await S('.ddhd__g-all').click();
  ok((await S('.ddhd__card.is-dim').count()) === 0 && (await S('.ddhd__guide').isHidden()), 'Show all models resets');
  // tabs keyboard
  await S('#ddhd-tab-mattress').focus(); await page.keyboard.press('ArrowRight');
  ok((await S('#ddhd-tab-topper').getAttribute('aria-selected')) === 'true', 'ArrowRight moves to toppers');
  await page.keyboard.press('Home');
  ok((await S('#ddhd-tab-mattress').getAttribute('aria-selected')) === 'true', 'Home moves to mattresses');
  // toppers preview: Dual Plush / layer combinations present
  await S('#ddhd-tab-topper').click(); await S('#ddhd-m-t_dual .ddhd__more').click();
  const tp = await S('.ddhd__panel').innerText();
  ok(/upper layer over/.test(tp) && /12 cm/.test(tp), 'Bio Support Dual preview shows layer combinations and thickness');
  await S('.ddhd__x').click();
  // deep link
  await page.evaluate(() => { location.hash = '#ddhd-m-bio_dp'; });
  await page.waitForTimeout(400);
  ok((await S('.ddhd__panel').count()) === 1 && /Bio Comfort Dual Plush/.test(await S('.ddhd__panel h4').innerText()), 'hash #ddhd-m-bio_dp opens that preview');
  ok(errors.filter((e) => /ddhd|DDHD/i.test(e)).length === 0, 'no ddhd script errors: ' + JSON.stringify(errors.filter((e) => /ddhd|DDHD/i.test(e))));
  // ---- events (for GTM later), exactly once per action, even after the section is re-created ----
  const pristine = fs.readFileSync(path.join(root, 'ecwid', `section-${VERSION}.html`), 'utf8').match(/<section[\s\S]*<\/section>/)[0];
  await page.evaluate(() => history.replaceState(null, '', location.pathname));
  const rerender = await page.evaluate((html) => {
    const count = { preview: 0 }; document.addEventListener('ddhd:preview', () => count.preview++);
    for (let i = 0; i < 5; i++) { // Instant Site unloads and reloads the tile: a fresh section element each time
      const old = document.querySelector('#ddhd'); const holder = document.createElement('div'); holder.innerHTML = html; old.replaceWith(holder.firstElementChild);
      holder.firstChild; document.querySelector('#ddhd').classList.add('is-js'); window.DDHD.scan();
    }
    document.querySelector('#ddhd-m-botanic .ddhd__more').click();
    return { preview: count.preview, panels: document.querySelectorAll('.ddhd__panel').length, ready: document.querySelectorAll('#ddhd[data-ddhd]').length };
  }, pristine);
  ok(rerender.preview === 1 && rerender.panels === 1 && rerender.ready === 1, `5 re-renders: one click = one event, one panel (${JSON.stringify(rerender)})`);
  await ctx.close();
}

// ---- 3. touch: iPad + phone, tap opens, no hover needed, orientation change keeps one correctly placed panel ----
for (const name of ['ipad-landscape', 'ipad-portrait', 'phone']) {
  const { ctx, page } = await openLive(b, VIEWPORTS[name]);
  await page.locator('#ddhd-m-bio .ddhd__fig').tap();
  ok((await page.locator('.ddhd__panel').count()) === 1, `${name}: tapping a card picture opens the preview`);
  const geo = await page.evaluate(() => { const p = document.querySelector('.ddhd__panel').getBoundingClientRect(); return { w: p.width, over: document.documentElement.scrollWidth > innerWidth + 1, ax: parseFloat(getComputedStyle(document.querySelector('.ddhd__pli')).getPropertyValue('--ax')) }; });
  ok(!geo.over, `${name}: no horizontal overflow with a preview open`);
  ok(geo.ax > 0 && geo.ax < geo.w, `${name}: the notch points into the panel (${geo.ax}/${Math.round(geo.w)})`);
  await page.setViewportSize({ width: VIEWPORTS[name].height, height: VIEWPORTS[name].width });   // rotate
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => ({ n: document.querySelectorAll('.ddhd__panel').length, prev: document.querySelector('.ddhd__pli') && document.querySelector('.ddhd__pli').previousElementSibling.dataset.id, over: document.documentElement.scrollWidth > innerWidth + 1, cols: getComputedStyle(document.querySelector('.ddhd__grid--mattress')).gridTemplateColumns.split(' ').length }));
  ok(after.n === 1 && !after.over, `${name}: after rotation still one panel, no overflow (cols ${after.cols}, after ${after.prev})`);
  await ctx.close();
}

// ---- 4. layout at every device size ----
const expectCols = { desktop: [4, 3], laptop: [4, 3], 'ipad-landscape': [4, 3], 'ipad-landscape-xl': [4, 3], 'ipad-portrait': [2, 1], phone: [1, 1] };
for (const [name, vp] of Object.entries(VIEWPORTS)) {
  const { ctx, page } = await openLive(b, vp);
  const g = await page.evaluate(() => {
    const m = getComputedStyle(document.querySelector('.ddhd__grid--mattress')).gridTemplateColumns.split(' ').length;
    document.querySelector('#ddhd-tab-topper').click();
    const t = getComputedStyle(document.querySelector('.ddhd__grid--topper')).gridTemplateColumns.split(' ').length;
    const over = document.documentElement.scrollWidth > innerWidth + 1;
    const tiny = [...document.querySelectorAll('#ddhd .ddhd__nm,#ddhd .ddhd__fn,#ddhd .ddhd__chip,#ddhd .ddhd__more')].filter((e) => e.offsetParent && parseFloat(getComputedStyle(e).fontSize) < 15).length;
    const small = [...document.querySelectorAll('#ddhd .ddhd__more,#ddhd .ddhd__chip,#ddhd .ddhd__tab')].filter((e) => e.offsetParent && e.getBoundingClientRect().height < 47.5).length;
    return { m, t, over, tiny, small };
  });
  ok(g.m === expectCols[name][0] && g.t === expectCols[name][1], `${name}: ${g.m}-col mattresses, ${g.t}-col toppers (want ${expectCols[name]})`);
  ok(!g.over, `${name}: no horizontal overflow`);
  ok(g.tiny === 0, `${name}: no text under 15px on card names, function lines, chips and buttons`);
  ok(g.small === 0, `${name}: tap targets are at least 48px high`);
  await ctx.close();
}

// ---- 5. reduced motion ----
{
  const { ctx, page } = await openLive(b, VIEWPORTS.desktop, { motion: 'reduce' });
  await page.locator('#ddhd-m-botanic .ddhd__more').click();
  const a = await page.evaluate(() => ({ anim: getComputedStyle(document.querySelector('.ddhd__panel')).animationName, tr: getComputedStyle(document.querySelector('#ddhd-m-botanic')).transitionDuration }));
  ok(a.anim === 'none' && /^0s/.test(a.tr), `reduced motion: no animation/transition (${JSON.stringify(a)})`);
  await ctx.close();
}

// ---- 6. no JavaScript: the whole range, every link ----
{
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.route(PREVIEW_HOST + '**', (route) => { const f = path.join(root, 'release', VERSION, new URL(route.request().url()).pathname); route.fulfill({ status: 200, contentType: 'text/css', body: fs.existsSync(f) ? fs.readFileSync(f) : '' }); });
  await page.route('https://nojs.test/', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><meta charset=utf-8><body style="margin:0">' + fs.readFileSync(path.join(root, 'ecwid', `section-${VERSION}.html`), 'utf8') }));
  await page.goto('https://nojs.test/');
  const n = await page.evaluate(() => ({ cards: [...document.querySelectorAll('.ddhd__card')].filter((c) => c.offsetParent).length, topper: document.querySelector('#ddhd-topper').offsetParent !== null, go: [...document.querySelectorAll('.ddhd__go')].filter((a) => a.offsetParent).length, more: [...document.querySelectorAll('.ddhd__more')].filter((a) => a.offsetParent).length, chips: [...document.querySelectorAll('.ddhd__chip')].filter((a) => a.offsetParent && a.tagName === 'A').length, dead: [...document.querySelectorAll('.ddhd__js')].filter((e) => e.offsetParent).length }));
  ok(n.cards === 11 && n.topper, `no-JS: all 11 models visible, both views (${n.cards})`);
  ok(n.go === 11 && n.more === 0, 'no-JS: every card has a visible "View model" link and no dead button');
  ok(n.chips === 6 && n.dead === 0, 'no-JS: six need links (jump to a model), JS-only controls hidden');
  await ctx.close();
}
await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) { console.log(failures.join('\n')); process.exit(1); }
