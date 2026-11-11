// Builds the large-screen DESIGN PREVIEW (docs/tv-preview/large-screen-design.html) and its pictures.
// Not the engine and not deployed: a design for the owner to approve. Data are the approved description texts (DDDATA of the
// graphite preview), the real firmness rule (DDFirmnessCore, extracted unchanged), and the size labels read from Ecwid on 11 Nov 2026.
//
//   node tools/build-premium-preview.mjs && NODE_PATH=$(npm root -g) node tools/build-tv-design-preview.mjs
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = join(root, 'docs', 'mobile', 'premium');
const out = join(root, 'docs', 'tv-preview'); mkdirSync(out, { recursive: true });

const g = readFileSync(join(P, 'preview', 'graphite.html'), 'utf8');
const a = g.indexOf('window.DDDATA=') + 'window.DDDATA='.length;
const D = JSON.parse(g.slice(a, g.indexOf(';</script>', a)));
const core = g.match(/<script id="firmness-core">([\s\S]*?)<\/script>/)[1];

// sizes: the real labels from Ecwid (public product, 11 Nov 2026); name = the label without its dimensions and price
const rows = JSON.parse(readFileSync(join(P, 'data', 'size-prices-e2.json'), 'utf8')).rows.filter((r) => r.dims);
D.sizes = rows.map((r) => ({
  label: r.label, dims: r.dims, mod: r.labelModifier,
  name: r.label.replace(/\s*[–-]?\s*\d+\s*[x×]\s*\d+.*$/, '').replace(/\s*\.$/, '').trim()
}));
D.depths = D.depths.map((d, i) => Object.assign(d, { mod: [0, 156, 190][i] }));
D.covers = D.covers.map((c, i) => Object.assign(c, { mod: [0, 0, 0, 77][i] }));


// ---- the information chapters: the approved description, broken into buttons (read from the source, never retyped) ----
const SPEC = [
  ['discover', 'Discover', [['intro', 'Introduction', 'hero'], ['glance', 'At a Glance', 'facts']]],
  ['firmness', 'Firmness', [['choose', 'Choose', 'step:firmness'], ['principle', 'Correct vs Softer', 'read:0'], ['regulation', 'How It Works', 'read:1'], ['who', 'Who It Is For', 'read:2']]],
  ['comfort', 'Comfort', [['expect', 'What To Expect', 'article'], ['behaviour', 'Latex Behaviour', 'read:0']]],
  ['height', 'Height', [['sizes', 'Choose size', 'step:size'], ['heights', 'Choose depth', 'step:depth'], ['why', 'Why Height Matters', 'read:0']]],
  ['covers', 'Covers', [['choose', 'Choose cover', 'step:cover'], ['system', 'Cover System', 'read:4']]],
  ['benefits', 'Benefits', [['origin', 'Origin', 'points'], ['why', 'Why Latex', 'read:0']]],
  ['support', 'Support', [['bearing', 'Bearing Force', 'points'], ['together', 'Support + Adaptation', 'read:0']]],
  ['adaptation', 'Adaptation', [['elasticity', 'Elasticity', 'points'], ['feel', 'How It Feels', 'read:0']]],
  ['zones', '7-Zone', [['map', 'Zone Map', 'zones'], ['detail', 'Zone By Zone', 'read:0']]],
  ['ventilation', 'Ventilation', [['airflow', 'Airflow', 'points'], ['sleep', 'Why It Matters', 'read:0']]],
  ['hygiene', 'Hygiene', [['clean', 'Cleaner Sleep', 'points'], ['picture', 'Realistic Picture', 'read:0']]],
  ['certs', 'Certifications', [['bodies', 'Certifications', 'certs'], ['made', 'Where It Is Made', 'read:0']]],
  ['warranty', 'Warranty', [['cover', 'Warranty + Gift', 'numerals'], ['conditions', 'Conditions', 'read:0']]],
  ['delivery', 'Delivery', [['made', 'Made To Order', 'read:0'], ['yours', 'Your Botanic', 'step:review']]]
];
const ROOTS = { discover: '#bp-top', firmness: '#bp-firmness', comfort: '#bp-comfort', height: '#bp-height', covers: '#bp-covers', benefits: '#bp-benefits', support: '#bp-support', adaptation: '#bp-adaptation', zones: '#bp-zones', ventilation: '#bp-ventilation', hygiene: '#bp-hygiene', certs: '#bp-certs', warranty: '#bp-warranty', delivery: '#bp-delivery' };
const MEDIA_CAP = { benefits: 'Milk to foam: where latex begins', adaptation: 'Elasticity: the instant response', zones: 'Seven zones, head to feet', ventilation: 'Airflow through the channels', certs: 'Durability under pressure' };
{
  const xb = await chromium.launch(); const xp = await xb.newPage();
  await xp.route('**/*', (r) => (r.request().url().startsWith('http') ? r.abort() : r.continue()));
  await xp.setContent('<div id="productDescription">' + readFileSync(join(root, 'source', 'botanic-original-description.html'), 'utf8') + '</div>');
  const X = await xp.evaluate((ROOTS) => {
    const T = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
    const q = (r, s) => Array.from(r.querySelectorAll(s));
    const groupsOf = (d) => {
      const sum = d.querySelector('summary'), body = d.querySelector('.d-body') || d, groups = []; let cur = null;
      const start = (h) => { cur = { h, blocks: [] }; groups.push(cur); };
      const w = document.createTreeWalker(body, NodeFilter.SHOW_ELEMENT); let n;
      while ((n = w.nextNode())) {
        const tg = n.tagName;
        if (/^H[2-6]$/.test(tg)) { start(T(n)); continue; }
        if (tg === 'P' || tg === 'LI') { if (!cur) start(null); const t = T(n); if (t) cur.blocks.push({ k: tg === 'LI' ? 'li' : 'p', t }); continue; }
        if (n.classList && n.classList.contains('b-irow')) { if (!cur) start(null); cur.blocks.push({ k: 'row', a: T(n.querySelector('.b-ilab')), b: T(n.querySelector('.b-ival')) }); }
      }
      return { q: T(sum).replace(/^\+\s*/, ''), groups: groups.filter((g) => g.blocks.length) };
    };
    const res = {};
    for (const [id, sel] of Object.entries(ROOTS)) {
      const r = document.querySelector(sel), o = {};
      const sh = id === 'discover' ? null : r.querySelector('.b-sh');
      if (sh) o.head = { title: T(sh.querySelector('.b-sh__t')).replace(/^\d+\s*—\s*/, ''), sub: T(sh.querySelector('.b-sh__s')) || null };
      o.details = id === 'discover' ? [] : q(r, 'details').map(groupsOf);
      if (id !== 'discover') {
        o.points = q(r, '.b-bi').map((e) => ({ t: T(e.querySelector('.b-bi__t')), d: T(e.querySelector('.b-bi__d')) }));
        o.certs = q(r, '.b-cert').map((e) => ({ m: T(e.querySelector('.b-cert__m')), s: T(e.querySelector('.b-cert__s')), d: T(e.querySelector('.b-cert__d')) }));
        o.zones = q(r, '.b-zone-pill').map((e) => ({ n: T(e.querySelector('.b-zone-pill__name')), note: T(e.querySelector('.b-zone-pill__note')) }));
        o.warranty = q(r, '.b-wrow > .b-wc').map((e) => ({ k: T(e.querySelector('.b-over')), v: T(e.querySelector('.b-wv')), u: T(e.querySelector('.b-wu')), b: T(e.querySelector('.b-wb')) }));
      }
      res[id] = o;
    }
    res.comfortParas = q(document, '#bp-comfort .b-comfort-card p').map(T);
    const top = document.querySelector('#bp-top');
    res.hero = { eyebrow: T(top.querySelector('.b-eyebrow')), headline: T(top.querySelector('.b-h1')), intro: T(top.querySelector('.b-intro')), note: T(top.querySelector('.b-hero-rule')) };
    res.facts = q(top, '.b-ocard__item').map((e) => ({ l: T(e.querySelector('.b-ocard__lbl')), v: T(e.querySelector('.b-ocard__val')), pills: q(e, '.b-pill').map(T) }));
    res.factsTitle = T(top.querySelector('.b-ocard__title'));
    res.features = q(top, ':scope > div.b-hero-bar .b-hero-bar__item').map(T).filter((t, i, a) => t && a.indexOf(t) === i);
    res.factsNote = T(top.querySelector('.b-ocard__note'));
    return res;
  }, ROOTS);
  await xb.close();
  D.hero = X.hero; D.facts = X.facts; D.factsTitle = X.factsTitle; D.features = X.features; D.factsNote = X.factsNote;
  D.chapters = SPEC.map(([id, label, panels]) => {
    const x = X[id];
    return {
      id, label, head: x.head || null, media: MEDIA_CAP[id] || null,
      panels: panels.map(([pid, plabel, kind]) => {
        const o = { id: pid, label: plabel, kind: kind.split(':')[0] };
        if (kind.startsWith('step:')) o.step = kind.slice(5);
        else if (kind.startsWith('read:')) { const d = x.details[+kind.slice(5)]; o.title = d.q; o.groups = d.groups; }
        else if (kind === 'article') { o.title = x.head.title; o.groups = [{ h: null, blocks: X.comfortParas.map((t) => ({ k: 'p', t })) }]; }
        else if (kind === 'points') o.items = x.points;
        else if (kind === 'certs') o.items = x.certs;
        else if (kind === 'zones') o.items = x.zones;
        else if (kind === 'numerals') o.items = x.warranty;
        return o;
      })
    };
  });
  // every text of the description that a panel shows is read from the source above; report what was taken
  const cnt = D.chapters.reduce((n, c) => n + c.panels.length, 0);
  console.log('information chapters:', D.chapters.length, 'chapters,', cnt, 'panels; groups per reader:', D.chapters.flatMap((c) => c.panels.filter((p) => p.groups).map((p) => c.id + '/' + p.id + ':' + p.groups.length)).join(' '));
}
const tpl = readFileSync(join(root, 'tools', 'tv-design-preview.template.html'), 'utf8');
const html = tpl.replace('/*__CORE__*/', () => core).replace('/*__DATA__*/', () => JSON.stringify(D));
const file = join(out, 'large-screen-design.html');
writeFileSync(file, html);
console.log('wrote', file, html.length, 'bytes; sizes', D.sizes.length);

const PROFILES = [
  ['ipad-pro-landscape', { width: 1366, height: 1024 }, true],
  ['ipad-pro-portrait', { width: 1024, height: 1366 }, true],
  ['desktop', { width: 1440, height: 900 }, false]
];
const browser = await chromium.launch();
const errs = [];
for (const [id, vp, touch] of PROFILES) {
  const ctx = await browser.newContext({ viewport: vp, screen: vp, hasTouch: touch, deviceScaleFactor: 1 });
  await ctx.route(/^https?:\/\//, (r) => (/^https:\/\/media\.divinedunlop\.com\//.test(r.request().url()) ? r.continue() : r.abort()));   // only the cover photographs are loaded; fonts fall back
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(id + ': ' + e.message));
  const url = pathToFileURL(file).href;
  for (const [name, q] of [['1-size', '?step=0&demo=1'], ['2-firmness', '?step=1&demo=1'], ['3-depth', '?step=2&demo=1'], ['4-cover', '?step=3&demo=1'], ['5-review', '?step=4&demo=1'], ['6-bagged', '?step=4&demo=1&bag=1'], ['7-cover-none', '?step=3'], ['8-discover', '?ch=discover&pn=intro&demo=1'], ['9-glance', '?ch=discover&pn=glance'], ['10-firmness-read', '?ch=firmness&pn=regulation'], ['11-comfort-read', '?ch=comfort&pn=behaviour&rd=2'], ['12-zones', '?ch=zones&pn=map'], ['13-certs', '?ch=certs&pn=bodies'], ['14-warranty', '?ch=warranty&pn=cover'], ['15-benefits', '?ch=benefits&pn=origin']]) {
    await page.goto(url + q); await page.waitForTimeout(name === '4-cover' || name === '7-cover-none' ? 1500 : 250);
    await page.screenshot({ path: join(out, `design-${id}-${name}.png`), fullPage: true });
  }
  // the first-time state: nothing chosen yet, step 1
  await page.goto(url); await page.waitForTimeout(200);
  await page.screenshot({ path: join(out, `design-${id}-0-start.png`), fullPage: true });
  await ctx.close();
}
await browser.close();
if (errs.length) { console.log('PAGE ERRORS', errs); process.exit(1); }
console.log('no page errors; pictures in docs/tv-preview/design-*.png');
