// CATALOGUE of every button of the large-screen television design: for every screen, a picture with the buttons numbered, and a
// table of what each does today, so that the owner can decide for each one: keep, remove, change or add.
// Buttons that are on every screen (tools, the fourteen topics, the rail, the selection panel, the bag) are lettered A to E and
// listed once; the buttons of a screen are numbered on it.
//
//   node tools/build-tv-design-preview.mjs && NODE_PATH=$(npm root -g) node tools/tv-button-catalogue.mjs
// Output: docs/tv-catalogue/*.jpg, docs/tv-catalogue/catalogue.json, docs/TV-BUTTON-CATALOGUE.md
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'docs', 'tv-catalogue'); mkdirSync(out, { recursive: true });
const FILE = pathToFileURL(join(root, 'docs', 'tv-preview', 'large-screen-design.html')).href;

const SCREENS = [
  ['start', 'Start: nothing chosen yet (Size)', '?step=0'], ['size-form', 'Size: the custom-size form open', '?step=0', 'click:[data-more]'],
  ['size-chosen', 'Size: chosen', '?step=0&demo=1'], ['firmness-empty', 'Firmness: nothing chosen, no weight or height', '?step=1'], ['firmness', 'Firmness: weight and height set, guidance shown', '?step=1&demo=1'],
  ['depth', 'Depth', '?step=2&demo=1'], ['cover-none', 'Cover: nothing chosen', '?step=3'], ['cover', 'Cover: one chosen', '?step=3&demo=1'],
  ['review', 'Review: all four chosen', '?step=4&demo=1'], ['review-bagged', 'Review: after Add to Bag (Go to Checkout)', '?step=4&demo=1&bag=1'],
['standard', 'Standard Product View (the shop\'s own page, stand-in)', '?view=std&demo=1'], ['gallery', 'View Model Gallery', '?gal=1&demo=1']
];
const PANELS = [['discover', 'intro'], ['discover', 'glance'], ['firmness', 'principle'], ['firmness', 'regulation'], ['firmness', 'who'], ['comfort', 'expect'], ['comfort', 'behaviour'], ['height', 'why'], ['covers', 'system'], ['benefits', 'origin'], ['benefits', 'why'], ['support', 'bearing'], ['support', 'together'], ['adaptation', 'elasticity'], ['adaptation', 'feel'], ['zones', 'map'], ['zones', 'detail'], ['ventilation', 'airflow'], ['ventilation', 'sleep'], ['hygiene', 'clean'], ['hygiene', 'picture'], ['certs', 'bodies'], ['certs', 'made'], ['warranty', 'cover'], ['warranty', 'conditions'], ['delivery', 'made']];
for (const [c, p] of PANELS) SCREENS.push([c + '-' + p, null, '?ch=' + c + '&pn=' + p]);

const vp = { width: 1366, height: 1024 };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: vp, screen: vp, deviceScaleFactor: 1 });
await ctx.route(/^https?:\/\//, (r) => (/media\.divinedunlop\.com|d2j6dbq0eux0bg\.cloudfront\.net/.test(r.request().url()) ? r.continue() : r.abort()));
const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message));

// what each button does today, read from the data attributes and classes of the design
const DESCRIBE = `(() => {
  const t = (e) => (e.getAttribute('aria-label') || e.textContent || e.value || '').replace(/\\s+/g, ' ').trim();
  const grp = (e) => e.closest('.tools') ? 'A' : e.closest('#chbar') ? 'B' : e.closest('#rail') ? 'C' : e.closest('.mine') ? 'D' : (e.closest('#native') ? 'E' : null);
  const kind = (e) => {
    const d = e.dataset, l = t(e);
    if (d.gal != null) return ['Gallery', e.id === 'galbtn' ? 'Opens or closes the product photographs inside the television' : 'Closes the gallery and returns to where the customer was', 'the gallery / back'];
    if (d.view != null) return ['View switch', d.view === 'tv' ? 'Shows the television (Optimised Preview)' : 'Shows the shop\\'s own page without the television (Standard Product View)', d.view === 'tv' ? 'the television' : 'the shop\\'s own page'];
    if (d.gimg != null) return e.closest('.gth') ? ['Photograph', 'Shows this photograph large', 'the large photograph'] : ['Arrow', 'Shows the previous or next photograph', 'another photograph'];
    if (d.ch != null) return ['Topic', 'Opens the topic "' + l + '" at its first panel', 'the topic "' + l + '"'];
    if (d.pn != null) return ['Panel', 'Opens "' + l + '" inside the current topic', 'that panel'];
    if (d.rd != null) return ['Text part', 'Shows this part of the text on the right', 'that part of the text'];
    if (d.flat != null) return [/^Back/.test(l) ? 'Back' : 'Next', /^Back/.test(l) ? 'Goes to the previous panel of the whole presentation' : 'Goes to the next panel of the whole presentation', /^Back/.test(l) ? 'the previous panel' : 'the next panel'];
    if (d.size != null) return ['Size choice', 'Chooses this size: sets Ecwid\\'s own Size control', 'the same screen, size chosen'];
    if (d.firm != null) return ['Firmness choice', 'Chooses this firmness: sets Ecwid\\'s own Firmness control', 'the same screen, firmness chosen'];
    if (d.depth != null) return ['Depth choice', 'Chooses this depth: sets Ecwid\\'s own Depth control', 'the same screen, depth chosen'];
    if (d.cover != null) return ['Cover choice', 'Chooses this cover: sets Ecwid\\'s own Covers control and shows its information', 'the same screen, cover chosen'];
    if (d.next != null) return ['Continue', 'Goes to the next step of the order (disabled until this step is chosen)', 'the next step'];
    if (d.back != null) return ['Back', 'Goes to the previous step of the order', 'the previous step'];
    if (d.bag != null) return ['Add to Bag', 'Presses Ecwid\\'s own Add to Bag (disabled until size, firmness, depth and cover are chosen)', 'the same button turns into Go to Checkout'];
    if (d.checkout != null) return ['Go to Checkout', 'Opens the shopping cart, built from the four choices and the promotion; the e-mail is entered there, then checkout', 'the shopping cart'];
    if (d.more != null) return ['Custom size', 'Opens the contact form for another size', 'the form on this screen'];
    if (d.send != null) return ['Send', 'Sends the model, the size wanted and the email to Divine Dunlop support (the preview sends nothing)', 'a confirmation'];
    if (d.go != null) { const g = e.closest('#rail') ? 'Order step' : e.closest('.mine') ? 'Selection chip' : e.closest('.ri') ? 'Change' : 'Select your Botanic'; return [g, g === 'Order step' ? 'Goes to the order step "' + l.replace(/^Step \\d: /, '').split(',')[0] + '"' : g === 'Selection chip' ? 'Goes to the step where this is chosen' : g === 'Change' ? 'Goes back to that step to change the choice' : 'Goes to step 1 of the order (Size)', 'that step']; }
    if (e.tagName === 'A') return ['Link', 'Opens the specialist model (Orthopaedic Coconut Core) in its own product page, only when tapped', 'the specialist product page'];
    if (e.type === 'range') return ['Slider', 'Sets ' + (e.id === 'gw' ? 'body weight' : 'height') + '; the guidance follows; it never navigates', 'the guidance on this screen'];
    if (e.tagName === 'SELECT') return ['Option menu', 'The shop\\'s own option menu (stand-in): changes the same selection as the television', 'the television shows the same choice'];
    return ['Button', l, ''];
  };
  const els = [...document.querySelectorAll('button, a[href], input[type=range], select')].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 4 && r.height > 4 && cs.visibility !== 'hidden' && cs.display !== 'none'; });
  let n = 0; const rows = els.map((e) => { const g = grp(e), k = kind(e), r = e.getBoundingClientRect(); return { g, n: g ? null : ++n, label: t(e).slice(0, 60), kind: k[0], does: k[1], leads: k[2], disabled: !!e.disabled, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, el: els.indexOf(e) }; });
  return rows;
})()`;
const MARK = `(rows) => {
  document.querySelectorAll('.__m').forEach((e) => e.remove());
  const seen = {}, U = {};
  rows.filter((r) => r.g).forEach((r) => { const u = U[r.g] = U[r.g] || { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }; u.x0 = Math.min(u.x0, r.x); u.y0 = Math.min(u.y0, r.y); u.x1 = Math.max(u.x1, r.x + r.w); u.y1 = Math.max(u.y1, r.y + r.h); });
  rows.forEach((r) => {
    const tag = r.g ? (seen[r.g] ? null : r.g) : String(r.n); if (r.g) { seen[r.g] = 1; if (tag) { const u = U[r.g]; r = Object.assign({}, r, { x: u.x0 - 2, y: u.y0 - 2, w: u.x1 - u.x0 + 4, h: u.y1 - u.y0 + 4 }); } } if (!tag) return;
    const colour = r.g ? '#7B2CBF' : '#E8590C';
    const o = document.createElement('div'); o.className = '__m'; o.style.cssText = 'position:absolute;left:' + r.x + 'px;top:' + r.y + 'px;width:' + r.w + 'px;height:' + r.h + 'px;border:2px ' + (r.g ? 'dashed' : 'solid') + ' ' + colour + ';border-radius:6px;pointer-events:none;z-index:2147483000;box-sizing:border-box';
    const b = document.createElement('span'); b.textContent = tag; b.style.cssText = 'position:absolute;left:-2px;top:-2px;min-width:20px;height:20px;line-height:20px;text-align:center;padding:0 4px;background:' + colour + ';color:#fff;font:700 12px/20px system-ui,sans-serif;border-radius:5px 0 5px 0'; o.appendChild(b); document.body.appendChild(o);
  });
}`;


// the state of the design, as a key: which topic and panel are open, or the gallery / the standard view
const PRESS = `(i) => {
  const els = [...document.querySelectorAll('button, a[href], input[type=range], select')].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 4 && r.height > 4 && cs.visibility !== 'hidden' && cs.display !== 'none'; });
  const e = els[i]; if (!e) return false; e.click(); return true;
}`;
const STATE = `(() => {
  if (document.body.classList.contains('std')) return 'standard';
  const g = document.querySelector('#galbtn'); if (g && g.getAttribute('aria-pressed') === 'true') return 'gallery';
  const ch = document.querySelector('#chbar .ch[aria-current=true]'), pn = document.querySelector('#rail .pn[aria-current=true]');
  if (!ch) return 'other';
  return ch.dataset.ch + '/' + (pn ? pn.dataset.pn : '');
})()`;

const cat = { generated: new Date().toISOString().slice(0, 10), note: 'design preview, simulated store; not deployed', screens: [] };
let master = null;
for (const [id, title0, q, act] of SCREENS) {
  await page.goto(FILE + q); await page.waitForTimeout(/gallery|standard|cover/.test(id) ? 1500 : 300);
  if (act) { await page.click(act.slice(6)); await page.waitForTimeout(200); }
  const title = title0 || await page.evaluate(() => { const h = document.querySelector('#stageh'); return h ? h.textContent.replace(/\s+/g, ' ').trim() : ''; });
  const rows = await page.evaluate(DESCRIBE);
  if (!master) master = rows;
  await page.evaluate(`(${MARK})(${JSON.stringify(rows)})`);
  await page.screenshot({ path: join(out, id + '.jpg'), type: 'jpeg', quality: 72, fullPage: true });
  const key = await page.evaluate(STATE);
  cat.screens.push({ id, key, title, file: id + '.jpg', buttons: rows.filter((r) => !r.g).map((r) => ({ n: r.n, el: r.el, label: r.label, kind: r.kind, does: r.does, leads: r.leads, disabled: r.disabled, tag: r.tag })), groups: [...new Set(rows.filter((r) => r.g).map((r) => r.g))] });
  console.log(id + ': ' + rows.filter((r) => !r.g).length + ' own buttons, groups ' + [...new Set(rows.filter((r) => r.g).map((r) => r.g))].join(''));
}
// the buttons that are on every screen
await page.goto(FILE + '?step=0&demo=1'); const all0 = await page.evaluate(DESCRIBE);
const topics = all0.filter((r) => r.g === 'B'), tools = all0.filter((r) => r.g === 'A');
const railByChapter = {};
for (const c of ['discover', 'firmness', 'comfort', 'height', 'covers', 'benefits', 'support', 'adaptation', 'zones', 'ventilation', 'hygiene', 'certs', 'warranty', 'delivery']) { await page.goto(FILE + '?ch=' + c); railByChapter[c] = (await page.evaluate(DESCRIBE)).filter((r) => r.g === 'C' && r.kind === 'Panel').map((r) => r.label); }
const steps = all0.filter((r) => r.g === 'C' && r.kind === 'Order step'), chips = all0.filter((r) => r.g === 'D' && r.kind === 'Selection chip'), bagRows = all0.filter((r) => r.g === 'D' && r.kind === 'Add to Bag' || r.g === 'E');
cat.always = { A: tools.map((r) => ({ label: r.label, does: r.does })), B: topics.map((r) => ({ label: r.label, does: r.does })), C_panels: railByChapter, C_steps: steps.map((r) => ({ label: r.label.replace(/^Step \d: /, ''), does: r.does })), D: chips.map((r) => ({ label: r.label, does: r.does })), E: [{ label: 'Add to Bag / Go to Checkout (in "Your selection", and again below the television as the shop\'s own button)', does: 'One button with two faces: Add to Bag presses Ecwid\'s own button once all four choices are made; then it becomes Go to Checkout, which opens the shop\'s checkout; a changed choice turns it back into Add to Bag' }] };

// WHERE EACH BUTTON LEADS: every enabled button of every screen is pressed once, on a fresh copy of that screen; the state after the
// press is matched with the screen pictures above. A press that leaves the state unchanged is a choice: the customer stays there.
const dp = await browser.newContext({ viewport: vp, screen: vp }); await dp.route(/^https?:\/\//, (r) => (/media\.divinedunlop\.com|d2j6dbq0eux0bg\.cloudfront\.net/.test(r.request().url()) ? r.continue() : r.abort()));
const dpg = await dp.newPage();
const KEYS = {}; for (const sc of cat.screens) if (sc.key && !KEYS[sc.key]) KEYS[sc.key] = sc.id;
const titleOf = (id) => (cat.screens.find((x) => x.id === id) || {}).title;
for (const sc of cat.screens) {
  const q = SCREENS.find((x) => x[0] === sc.id)[2];
  for (const btn of sc.buttons) {
    if (btn.disabled || btn.el == null || /^(a|select|input)$/i.test(btn.tag || '')) { btn.dest = { key: null, screen: null, text: btn.disabled ? 'off until its condition is met' : 'not pressed (link or field)' }; continue; }
    await dpg.goto(FILE + q); await dpg.waitForTimeout(/gallery|standard/.test(sc.id) ? 900 : 250);
    if (sc.id === 'size-form') await dpg.click('[data-more]').catch(() => {});
    const before = await dpg.evaluate(STATE);
    const pressed = await dpg.evaluate(([src, i]) => (new Function('return (' + src + ')')())(i), [PRESS, btn.el]).catch(() => false);
    await dpg.waitForTimeout(260);
    const after = await dpg.evaluate(STATE);
    const where = await dpg.evaluate(() => { const c = document.querySelector('#chbar .ch[aria-current=true]'), p = document.querySelector('#rail .pn[aria-current=true]'); return ((c ? c.textContent.trim() : '') + (p ? ' · ' + p.textContent.trim() : '')).trim(); });
    if (!pressed) { btn.dest = { key: null, screen: null, text: 'not pressed' }; continue; }
    if (after === before) btn.dest = { key: after, screen: sc.id, where, text: 'stays here (a choice is made)' };
    else btn.dest = { key: after, screen: KEYS[after] || null, where, text: where || after };
  }
}
await dp.close();
writeFileSync(join(out, 'catalogue.json'), JSON.stringify(cat, null, 1));
await browser.close();

// the document
const L = [];
const total = cat.screens.reduce((n, s) => n + s.buttons.length, 0);
L.push('# Catalogue of the buttons of the large-screen television (design preview)\n');
L.push(`Generated ${cat.generated} from the design preview (\`docs/tv-preview/large-screen-design.html\`, simulated store, not deployed). **${cat.screens.length} screens**, each with its picture and the buttons numbered on it. For every button the last column is yours: **Keep, Remove, Change** (say how) or **Add** (what is missing). Reply with the screen name and the number, for example "firmness #3: change the label to ...".\n`);
L.push('How to read the pictures: an **orange** frame with a number is a button of that screen; a **purple dashed** frame with a letter (A to E) is a button group that is on every screen and is listed once, in the next section. Everything is rounded, the blue buttons are the bright-blue family.\n');
L.push('## Buttons that are on every screen (A to E)\n');
L.push('### A. Tools (top right)\n\n| Button | What it does today | Your decision |\n|---|---|---|');
cat.always.A.forEach((r) => L.push(`| ${r.label} | ${r.does} | |`));
L.push('\n### B. The fourteen topics (top of the television, two rows)\n\n| Button | What it does today | Your decision |\n|---|---|---|');
cat.always.B.forEach((r) => L.push(`| ${r.label} | ${r.does} | |`));
L.push('\n### C. The left menu: this topic\'s panels, and your order\n\nThe panels change with the topic:\n\n| Topic | Panel buttons | Your decision |\n|---|---|---|');
for (const [c, ps] of Object.entries(cat.always.C_panels)) L.push(`| ${c} | ${ps.join(' · ')} | |`);
L.push('\nBelow the panels, always the same five order steps:\n\n| Button | What it does today | Your decision |\n|---|---|---|');
cat.always.C_steps.forEach((r) => L.push(`| ${r.label} | ${r.does} | |`));
L.push('\n### D. Your selection (right): the four chips\n\n| Button | What it does today | Your decision |\n|---|---|---|');
cat.always.D.forEach((r) => L.push(`| ${r.label.split(/\s/)[0]} | ${r.does} | |`));
L.push('\n### E. Add to Bag / Go to Checkout\n\n| Button | What it does today | Your decision |\n|---|---|---|');
cat.always.E.forEach((r) => L.push(`| ${r.label} | ${r.does} | |`));
L.push('\n## Screen by screen\n');
L.push('| # | Screen | Own buttons |\n|---|---|---|');
cat.screens.forEach((s, i) => L.push(`| ${i + 1} | [${s.title}](#${s.id}) | ${s.buttons.length} |`));
for (const s of cat.screens) {
  L.push(`\n### ${s.id}\n\n**${s.title}**\n\n![${s.title}](tv-catalogue/${s.file})\n`);
  if (!s.buttons.length) { L.push('No buttons of its own: only the groups A to E.\n'); continue; }
  L.push('| No. | Button | Kind | What it does today | Leads to | Your decision |\n|---|---|---|---|---|---|');
  s.buttons.forEach((b) => L.push(`| ${b.n} | ${b.label.replace(/\|/g, '/')}${b.disabled ? ' (off until its condition is met)' : ''} | ${b.kind} | ${b.does} | ${b.dest && b.dest.text ? (b.dest.where && !/^stays/.test(b.dest.text) ? '→ ' + b.dest.where + (b.dest.screen ? ' (picture: [' + b.dest.screen + '](#' + b.dest.screen + '))' : '') : b.dest.text) : b.leads} | |`));
}
L.push(`\n---\n${total} numbered buttons over ${cat.screens.length} screens, plus the always-present groups. Regenerate after any change: \`node tools/build-tv-design-preview.mjs && NODE_PATH=$(npm root -g) node tools/tv-button-catalogue.mjs\`. The buttons of today's live television (before this design) are in \`docs/TV-BUTTON-MAP.md\`.\n`);
writeFileSync(join(root, 'docs', 'TV-BUTTON-CATALOGUE.md'), L.join('\n'));
if (errs.length) { console.log('PAGE ERRORS', errs); process.exit(1); }
console.log('wrote docs/TV-BUTTON-CATALOGUE.md,', cat.screens.length, 'screens,', total, 'numbered buttons');
