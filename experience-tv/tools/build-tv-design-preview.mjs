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
  ['firmness', 'Firmness', [['choose', 'Select Your Firmness', 'step:firmness'], ['principle', 'Correct vs Softer', 'read:0'], ['regulation', 'How It Works', 'read:1'], ['who', 'Who It Is For', 'read:2']]],
  ['comfort', 'Comfort', [['expect', 'What To Expect', 'article'], ['behaviour', 'Latex Behaviour', 'read:0'], ['density', 'How Density Works', 'density']]],
  ['height', 'Height', [['sizes', 'Select Your Size', 'step:size'], ['heights', 'Select Your Depth', 'step:depth'], ['why', 'Why Height Matters', 'read:0']]],
  ['covers', 'Covers', [['choose', 'Select Your Cover', 'step:cover'], ['system', 'Cover System', 'read:4']]],
  ['benefits', 'Benefits', [['origin', 'Origin', 'points'], ['why', 'Why Latex', 'read:0']]],
  ['support', 'Support', [['bearing', 'Bearing Force', 'points'], ['together', 'Support + Adaptation', 'read:0'], ['density', 'How Density Works', 'density']]],
  ['adaptation', 'Adaptation', [['elasticity', 'Elasticity', 'points'], ['feel', 'How It Feels', 'read:0'], ['adjustable', 'Adjustable Beds', 'adjust']]],
  ['zones', '7-Zone', [['map', 'Zone Map', 'zones'], ['detail', 'Zone By Zone', 'read:0']]],
  ['ventilation', 'Ventilation', [['airflow', 'Airflow', 'points'], ['sleep', 'Why It Matters', 'read:0']]],
  ['hygiene', 'Hygiene', [['clean', 'Cleaner Sleep', 'points'], ['picture', 'Realistic Picture', 'read:0']]],
  ['certs', 'Certifications', [['bodies', 'Certifications', 'certs'], ['made', 'Where It Is Made', 'read:0']]],
  ['warranty', 'Warranty', [['cover', 'Warranty + Gift', 'numerals'], ['conditions', 'Conditions', 'read:0']]],
  ['delivery', 'Delivery', [['made', 'Made To Order', 'read:0'], ['journey', 'Delivery Journey', 'journey'], ['yours', 'Your Botanic', 'step:review']]]
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
    res.facts = q(top, '.b-ocard__item').map((e) => ({ l: T(e.querySelector('.b-ocard__lbl')), v: T(e.querySelector('.b-ocard__val')), pills: q(e, '.b-pill, .b-ocard__pills > span').map(T) }));
    res.factsTitle = T(top.querySelector('.b-ocard__title'));
    res.features = q(top, ':scope > div.b-hero-bar .b-hero-bar__item').map(T).filter((t, i, a) => t && a.indexOf(t) === i);
    res.factsNote = T(top.querySelector('.b-ocard__note'));
    return res;
  }, ROOTS);
  await xb.close();
  D.hero = X.hero; D.facts = X.facts; D.factsTitle = X.factsTitle; D.features = X.features; D.factsNote = X.factsNote;
  const TC = (t) => t.split(' ').map((w) => (w === 'vs' ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
  D.chapters = SPEC.map(([id, label, panels]) => {
    const x = X[id];
    return {
      id, label: TC(label), head: x.head || null, media: MEDIA_CAP[id] || null,
      panels: panels.map(([pid, plabel, kind]) => {
        const o = { id: pid, label: TC(plabel), kind: kind.split(':')[0] };
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

// ---- the owner's two mattress drawings (supplied as SVG): one for the three depths, one for the "ready to order" icon ----
function mattressParts(file) {
  const svg = readFileSync(join(P, 'assets', file), 'utf8');
  const ms = [...svg.matchAll(/transform="matrix\(([^)]*)\)"/g)].map((m) => m[1].split(',').map(Number));
  const ds = [...svg.matchAll(/<path d="([^"]*)"/g)].map((m) => m[1]);
  if (ms.length !== 3 || ds.length !== 2) throw new Error(file + ': unexpected structure');
  return { outer: ms[0], ta: [ms[1][0], ms[1][3], ms[1][4], ms[1][5]], tb: [ms[2][0], ms[2][3], ms[2][4], ms[2][5]], out: ds[0], inn: ds[1] };
}
D.mattress = { depth: mattressParts('owner-mattress-depth.svg'), icon: mattressParts('owner-mattress-icon.svg') };

// ---- the seven-zone sketch: the same recoloured illustration as the mobile preview (original geometry) ----
{
  const z = readFileSync(join(root, 'products', 'botanic.zones.js'), 'utf8'); const zs = JSON.parse(z.match(/zonesSvg = ("(?:[^"\\]|\\.)*")/s)[1]);
  const map = { '#1B5568': '#2A3950', '#0B2A38': '#151C26', '#D9EEF0': '#E4EBF5', '#9ACFD5': '#B4C4DB', '#66B3BA': '#8CA2C2', '#E9FFFD': '#E4EBF5', '#8CEBE4': '#B4C4DB', '#4FD3CB': '#8CA2C2', '#7FE8E0': '#A9BDD9' };
  let o = zs.replace(/#[0-9A-Fa-f]{6}/g, (m) => map[m.toUpperCase()] || m).replace('rgba(79,211,203,.18)', 'rgba(140,162,194,.18)').replace('rgba(79,211,203,.20)', 'rgba(140,162,194,.20)');
  const tier = { 1: 'c', 2: 's', 3: 'c', 4: 'r', 5: 'c', 6: 's', 7: 's' }; let n = 0;
  o = o.replace(/(<g data-z="(\d)"[^>]*>)(<g clip-path="url\(#dz7-z\d\)"><g><use href="#dz7-mp" fill=")url\(#dz7-gz\)/g, (m, a, zz, c) => { n++; return a.replace('<g data-z="' + zz + '"', '<g data-z="' + zz + '" data-tone="' + tier[zz] + '"') + c + 'url(#zt-' + tier[zz] + ')'; });
  if (n !== 7) throw new Error('expected 7 zone fills, found ' + n);
  const grad = (id, c, a, b2, c2) => '<linearGradient id="zt-' + id + '" gradientUnits="userSpaceOnUse" x1="0" y1="250" x2="0" y2="760"><stop offset="0" stop-color="' + c + '" stop-opacity="' + a + '"/><stop offset=".4" stop-color="' + c + '" stop-opacity="' + b2 + '"/><stop offset="1" stop-color="' + c + '" stop-opacity="' + c2 + '"/></linearGradient>';
  o = o.replace('</defs>', grad('s', '#B7C9E3', .82, .58, .34) + grad('c', '#7C97C0', .84, .60, .36) + grad('r', '#46628F', .96, .78, .55) + '</defs>');
  const cx = [367, 870, 1260, 1610, 1975, 2285, 2532];
  const labels = '<g aria-hidden="true">' + cx.map((x, i) => '<text x="' + x + '" y="655" text-anchor="middle" font-size="84" font-weight="700" fill="' + (tier[i + 1] === 's' ? '#151C26' : '#F2F6FB') + '" font-family="Chillax,Arial,sans-serif">Z' + (i + 1) + '</text>').join('') + '</g>';
  const at = o.indexOf('<use href="#dz7-bd" fill="rgba('); if (at < 0) throw new Error('body outline not found');
  // the composition: the mattress, the body and the zones only; no sky and no background (the original viewBox already fits the drawing: y 27 to 750)
  let full = o.slice(0, at) + labels + o.slice(at);
  D.zoneSketch = full; D.zoneTier = tier;
}
const tpl = readFileSync(join(root, 'tools', 'tv-design-preview.template.html'), 'utf8');
const rules = readFileSync(join(root, 'engine', 'selection-rules.js'), 'utf8');
/* ---- REFERENCE ROUND (owner, 13–15 November 2026): the PRIMARY screenshots of the three PDFs ----
   ASSETS: the owner's own pictures, byte for byte from modules already on the site (see assets/botanic/PROVENANCE.md).
   CURATED: the copy the owner approved in the PRIMARY screenshots where it differs from the description; every entry names its
   screenshot. Claims on the legal list are carried as approved but marked for verification in docs/BOTANIC-REFERENCE-AUDIT.md. */
{
  const A = join(root, 'assets', 'botanic'), b64 = (f) => 'data:image/webp;base64,' + readFileSync(join(A, f)).toString('base64');
  D.eng = JSON.parse(readFileSync(join(A, 'engineering-view.json'), 'utf8'));
  const bio = readFileSync(join(A, 'bio-dunlop.svg'), 'utf8'), bp = [...bio.matchAll(/<path[^>]*d="([^"]+)"/g)].map((m) => m[1]);
  D.bioWord = { vb: '1540 -1370 2460 470', d: bp.slice(12) };          // the wordmark "Bio Dunlop" (paths 12-23), drawn in one ink
  D.bioMark = { vb: '2400 -1372 360 376', d: [bp[21], bp[20]] };      // the D with the spiral (paths 20-21)
  D.moon = b64('q-dd-moon-88.webp'); D.core = b64('q-latex-closeup.webp'); D.bowl = b64('q-latex-milk-bowl-cut-700.webp');
  D.abSketch = JSON.parse(readFileSync(join(A, 'adjustable-sketch.json'), 'utf8')); D.pins = b64('q-latex-pins.webp');
  D.logos = { oeko: b64('q-logo-oekotex-mono.webp'), hohenstein: b64('q-logo-hohenstein-mono.webp'), iso9001: b64('q-logo-iso9001-mono.webp'), iso14001: b64('q-logo-iso14001-mono.webp'), siemens: b64('q-logo-siemens-monitoring-mono.webp') };
}
/* OWNER 16 Nov (VIII): the real films and photographs of the description, so the preview shows them (in the shop they come
   from the same addresses). The Standard Product View keeps the whole approved description, as the shop page does. */
{
  const V = 'https://media.divinedunlop.com/videos/';
  D.videos = { discover: V + 'botanic-natural-latex-mattress-premium-presentation-loop.mp4', benefits: V + 'natural-latex-milk-to-foam-origin.mp4', adaptation: V + 'natural-latex-elasticity-adjustable-bed.mp4', zones: V + 'natural-latex-7-zone-spinal-alignment.mp4', ventilation: V + 'natural-latex-airflow-ventilation-channels.mp4', certs: V + 'natural-latex-durability-pressure-test.mp4' };
  D.descHtml = readFileSync(join(root, 'source', 'botanic-original-description.html'), 'utf8');
}
D.curated = {
  // 01 D25324CF: hero, selective bold in the introduction
  'discover/intro': { title: 'Know your {Botanic}', bold: ['100% Organic Original Dunlop latex', 'precise balance', 'anatomical adaptation', 'orthopaedic support'] },
  // 03 5748F204: the firmness question band
  'firmness/choose': { kicker: 'Dunlop firmness regulations according to body proportions', kicker2: 'Based on engineering research', title: 'What [Support] and [Adaptation] does your body need?', sub: 'We regulate the mattress to your body, not by feel. With the proven Dunlop engineering method, we provide a reliable and precise selection.',
    support: 'Keeps your body at the surface, without the deep sinking sensation of memory foam.', adapt: 'Distributes body weight in the most adaptive way, optimising pressure relief and muscle relaxation.' },
  // 04 DCCDF5C4 (05 alternate for the bold words)
  'firmness/principle': { title: 'Firmness Is Body Regulation', sub: 'Not simply Soft or Firm. We match the response of Dunlop latex to body weight and proportions for Support and Adaptation.',
    labels: ['Firmness is body regulation', 'Softer is not automatically more comfortable', 'Firmness works like clothing size', 'Every level can feel adaptive', 'Use the firmness cards'],
    first: { h: 'Firmness is regulated for your body.', html: ['Not a choice between <b>Soft</b> and <b>Firm</b>. We regulate <b>natural Dunlop latex</b> for your <b>body weight</b> and <b>proportions</b>.', 'Latex is an <b>engineering tool</b>: it follows your contours, distributes pressure and balances <b>Support</b> with <b>Adaptation</b>.', 'Like clothing size, <b>the right fit matters.</b>'] } },
  // 06 BOTANIC_How_It_Works_full_size
  'firmness/regulation': { title: 'How body-regulated firmness works', sub: 'Body weight sets the starting range. Proportions refine the fit. Dunlop latex provides the balance of Support and Adaptation.',
    labels: ['Overview', 'Start with body weight', 'Why body weight, not preference'],
    first: { h: 'Overview', html: ['Body weight establishes the initial firmness range. Height and body proportions refine how that load is distributed across the mattress.', 'Natural Dunlop latex responds to the body, combining stable surface Support with precise Adaptation and more balanced pressure relief.', 'The goal is the right fit, not simply a softer feel.'] } },
  // 07 BD75A829
  'firmness/who': { title: 'Who Is This Mattress For?', labels: ['Overview', 'Who Is It Not For?'],
    first: { h: 'Overview', html: ['Botanic is for people looking for the precise balance of <b>support</b> and <b>adaptation</b> in a classic, <b>single-core</b> natural Dunlop latex mattress.', 'Its <b>7-zone</b> structure responds to body contours. We select the firmness using <b>body weight</b> and <b>proportions</b>, rather than asking you to guess between Soft, Medium or Firm.', 'If you prefer the feel of two different comfort levels, explore <b>Botanic Dual Plush</b> as an alternative.'] } },
  // 08 48FE0C04
  'comfort/expect': { labels: ['Keep you on the surface', 'Why we repeat these words', 'When sitting, adaptation is deeper'],
    first: { h: 'It is important to know this', html: ['When you lie on the mattress, the latex comfort system is designed to <b>keep you on the surface</b> rather than let you sink deeply.', 'This creates the correct balance between support and adaptation.', 'When you sit and concentrate your body weight in one smaller area, you get much deeper adaptation and compression than when lying down.', 'Latex can still feel light and adaptive while keeping the body supported.'] } },
  // 09 5EBD2CD0 (layout) + 10 alternate (the six topics and their copy); the dark box of 09 becomes a plain line inside the card
  'comfort/behaviour': { title: 'Support Is the {Foundation} for Real Adaptation',
    first: { h: 'The Balance Between Support And Adaptation', html: ['A high-quality mattress works through a <b>sequence</b>: first it provides <b>support</b>, and on this stable base the body can achieve <b>proper adaptation</b>.', '<b>Without support, there is no good adaptation.</b> Support keeps the body in the right position, prevents excessive sinking and gives the latex the controlled condition it needs to adjust precisely to your shape.', 'Support is <b>more than just firmness.</b> It is the structural stability of the mattress: the way it carries, guides and balances your body for a wide range of comfort benefits.'],
      foot: '<b>Support is the foundation of stability:</b> it maintains body positioning, enables precise adaptation and helps preserve natural skeletal alignment.' } },
  // 13 BOTANIC_Height_Why_It_Matters_balanced
  'height/why': { labels: ['How much latex is present', 'One core, one calibration'],
    first: { h: 'Height shapes the latex response', html: ['All three Botanic heights use the same 7-zone Dunlop latex technology, designed for support and adaptation.', 'A greater core depth provides more natural latex to respond to body load, allowing its engineered, orthopaedic and anatomical qualities to be expressed with additional adaptation depth.', '20, 24 and 26 cm all offer these benefits. Choose the comfort depth that suits you.'] } },
  // 16 BOTANIC_Covers_Zip_40C_corrected (the alternate, because the PRIMARY 15 headline is on the legal list)
  'covers/system': { title: 'The Cover Is Part of the Sleep System', sub: 'More than an accessory.' },
  // 20 00000FF9
  'support/together': { labels: ['The usual compromise', 'Density carries the body', 'They amplify each other'], quote: 'Support and adaptation are both part of our system. This is what distinguishes latex mattresses from others, because one cannot exist without the other.' },
  // 22 BOTANIC_Adaptation_How_It_Feels_Text_Only: the agreed sentence, inside the white card
  'adaptation/feel': { labels: ['At first glance', 'Your body does not sink', 'The shoulders compress only as far as needed', 'Movement is absorbed in real time'],
    foot: 'Natural Dunlop latex follows your body’s contours without enveloping you like memory foam or creating a sinking sensation. It responds instantly, with no adjustment delay.' },
  // 26 BOTANIC_Ventilation_Airflow_minimal_technical: the process row under the video, and the closing sentence
  'ventilation/airflow': { flow: ['Open-cell latex', 'Ventilation channels', 'Continuous airflow', 'Drier microclimate', 'Temperature comfort'], close: 'Temperature comfort is one of the key factors for healthy, full and restorative sleep.' },
  // 27 IMG_5827: a separate card that is not a button
  'ventilation/sleep': { labels: ['Overview', 'A Note On Claims'], note: { k: 'Temperature comfort', t: 'Temperature comfort is one of the key factors for deep, restorative sleep.' } },
  // 32 BOTANIC_Warranty_Three_Horizontal_Rows: the third row rewritten so the pillows are never conditional (master prompt)
  'warranty/cover': { third: { k: 'The complete sleep system', v: 'Complete your set', b: 'A compatible bed base or a Botanic topper completes the support, comfort and durability the mattress is designed for. The two pillows come with the mattress either way.' } },
  // 33 FB9568A4: 12% of the selected height (Botanic heights only)
  'warranty/conditions': { labels: ['Structural indentations (12%)', 'Rotate three times in the first six months'] },
  // owner 16 Nov: How Density Works (owner's infographic, redrawn in the system); shown in Comfort and in Support
  'density': { title: 'How Density Works', sub: 'The logic behind Support and comfort in natural Dunlop latex.',
    cards: [['Density', 'The material foundation', 'A well-structured latex foam creates a stronger and more stable base.'],
      ['Stable Structure', 'Better structural integrity', 'The material holds its shape and performance more consistently under repeated pressure.'],
      ['Consistent Firmness', 'Support works more reliably', 'Firmness stays more controlled and predictable when the structure is stable.'],
      ['Adaptive Comfort', 'Elasticity can respond better', 'Natural latex can contour and recover more effectively when supported by a stable internal structure.']],
    band: 'Density is the foundation. Firmness regulates Support. Elasticity delivers Adaptation.',
    note: 'Density does not replace firmness or elasticity. It helps them perform more consistently over time.' },
  // owner 16 Nov: adjustable beds (a settings-style screen, like the car's climate page)
  'adaptation/adjustable': { title: 'Suitable For Adjustable Beds', sub: 'Botanic is a mattress for every bed, and it is suitable for adjustable beds as well. One continuous natural latex core, without springs, follows the positions of an adjustable base and returns to its full shape when the base is flat.',
    positions: ['Flat', 'Reading', 'Relax', 'Legs Up', 'Zero Gravity'],
    points: [['Suitable for adjustable beds', 'Botanic can also be used on adjustable bed bases. It is not made only for them.'], ['Follows the base', 'The single latex core bends with the head and leg sections, without folds or gaps.'], ['The zones stay with you', 'The seven zones keep their place under the body as the base moves.'], ['Back to shape', 'When the base is flat again, the latex returns to its full shape.']] },
  // 34 3D3269B4
  'delivery/made': { title: 'Production and delivery note', sub: 'Every Botanic mattress is prepared to order on the basis of your confirmed configuration.', made: 'Individually made to your specification', custom: 'Your Botanic mattress is custom made to your confirmed configuration, including size, height, firmness level and cover material.' },
  // 35 7EDDE74B
  'delivery/yours': { flow: ['Add to your bag', 'Go to Checkout', 'Place your Order'] }
};
/* IGNITION: the start-up of the television, shown each time it is switched on (page start and every press of Optimised
   Preview). Minimal, like a car's instrument panel waking up. The two facts are mandatory and are the description's own
   (hero bar: "100% Organic · Dunlop Technology"); a later model sets its own name and facts here. */
D.ignition = { name: 'BOTANIC', facts: [['Material', '100% Natural Latex'], ['Process', 'Dunlop Technology']],
  pillars: [['Explore', '11 topics, one clear way in'], ['Select & Buy', 'Four choices, then one button'], ['Custom', 'Made to order, to your confirmed specification']],
  tagline: 'Custom Dunlop Natural Environment for Healthy Sleep', sub: 'One custom presentation module: it explores, it selects and it customises.' };
/* HOUSE STYLE OF THE TEXT (owner, 15 November 2026), applied to every text the television shows:
   - short dashes only: the long dash (—) becomes the short one (–);
   - Support and Adaptation always begin with a capital S and A.
   Ecwid's own labels (sizes, covers), addresses and pictures are never touched. */
{
  const SKIP = new Set(['descHtml', 'videos', 'id', 'key', 'step', 'kind', 'sizes', 'images', 'img', 'url', 'eng', 'bioWord', 'bioMark', 'moon', 'core', 'bowl', 'logos', 'zoneSketch', 'zoneTier', 'mattress', 'specialist', 'product']);
  const fix = (t) => t.replace(/\s*—\s*/g, ' – ').replace(/\bsupport\b/g, 'Support').replace(/\badaptation\b/g, 'Adaptation');
  const walk = (o) => { for (const k of Object.keys(o)) { if (SKIP.has(k)) continue; const v = o[k]; if (typeof v === 'string') o[k] = fix(v); else if (v && typeof v === 'object') walk(v); } };
  walk(D);
}
const html = tpl.replace('/*__CORE__*/', () => core).replace('/*__RULES__*/', () => rules).replace('/*__DATA__*/', () => JSON.stringify(D).replace(/<\//g, '<\\/').replace(/<!--/g, '<\\u0021--'));
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
  await ctx.route(/^https?:\/\//, (r) => (/^https:\/\/(media\.divinedunlop\.com|d2j6dbq0eux0bg\.cloudfront\.net)\//.test(r.request().url()) ? r.continue() : r.abort()));   // only the cover photographs are loaded; fonts fall back
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(id + ': ' + e.message));
  const url = pathToFileURL(file).href;
  for (const [name, q] of [['1-size', '?step=0&demo=1'], ['2-firmness', '?step=2&demo=1'], ['3-depth', '?step=1&demo=1'], ['4-cover', '?step=3&demo=1'], ['5-review', '?step=4&demo=1'], ['6-bagged', '?step=4&demo=1&bag=1'], ['7-cover-none', '?step=3'], ['8-discover', '?ch=discover&pn=intro&demo=1'], ['9-glance', '?ch=discover&pn=glance'], ['10-firmness-read', '?ch=firmness&pn=regulation'], ['11-comfort-read', '?ch=comfort&pn=behaviour&rd=2'], ['12-zones', '?ch=zones&pn=map'], ['13-certs', '?ch=certs&pn=bodies'], ['14-warranty', '?ch=warranty&pn=cover'], ['15-benefits', '?ch=benefits&pn=origin'], ['16-gallery', '?gal=1&demo=1'], ['17-standard', '?view=std&demo=1'], ['18-zones-detail', '?ch=zones&pn=detail'], ['19-promo15', '?step=4&demo=1&promo=15'], ['20-promo17-std', '?view=std&demo=1&promo=17'], ['21-checkout', '?view=co&demo=1&bag=1']]) {
    await page.goto(url + q); await page.waitForTimeout(/cover|gallery|standard/.test(name) ? 1800 : 250);
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
