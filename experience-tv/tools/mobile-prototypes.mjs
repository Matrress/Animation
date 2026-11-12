// Design previews of three phone presentations of the approved BOTANIC description. NOT DEPLOYED, NOT PART OF ANY BUILD.
//
// Every option is made from the REAL description (source/botanic-original-description.html): its markup is moved,
// regrouped or folded by this script, never rewritten, and a completeness check proves that every piece of text in the
// source is still in the page (or is on the short, explicit list of decoration that a phone does not need).
// No product claim is written here. The only words added are interface words ("Play", "Read the full explanation").
//
//   NODE_PATH=$(npm root -g) node tools/mobile-prototypes.mjs [out-dir]
//
// Output: option-a.html, option-b.html, option-c.html, baseline-original.html (the description as it is today, in the
// same wrapper, for a fair comparison), and data/options-measure.json.
//
//   A  Optimised existing layout   same 13 sections, same order, same look; the weight and the spacing removed.
//   B  Compact progressive         every chapter: heading, one line, its key facts; the rest one tap away.
//   C  Hybrid editorial            decisions kept open, the five proof videos as one swipeable row, the educational
//                                  chapters as a flat list of rows, trust block (certifications, warranty) kept open.
//
// Shared by all three (the "media policy"): no video is requested until the visitor taps it. This is the largest
// single saving expected, and it is NOT measured here (the media host is not reachable from this machine).
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.argv[2] || join(root, 'docs', 'mobile', 'options');
mkdirSync(join(outDir, 'data'), { recursive: true });
const src = readFileSync(join(root, 'source', 'botanic-original-description.html'), 'utf8');

const FONT = '<link rel="preconnect" href="https://api.fontshare.com"><link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=chillax@300,400,500,600,700&display=swap">';

/* ------------------------------------------------------------------ shared CSS ------------------------------------- */
const BASE_CSS = `
/* ===== design preview: shared by A, B and C (phone only; nothing here would touch Ecwid's own controls) ===== */
#bp-top .b-leaf-divider, #bp-top .b-floating-top { display: none !important; }
#bp-top .b-sh__n { display: none; }                       /* section numbers: decoration (listed in the completeness report) */
/* media on demand: a poster-style box; the video file is requested only when the visitor taps it */
#bp-top .p-video { position: relative; aspect-ratio: 16 / 9; border-radius: 14px; overflow: hidden; background: linear-gradient(135deg, #364849, #42595B); display: block; width: 100%; padding: 0; border: 0; cursor: pointer; color: #fff; font: inherit; }
#bp-top .p-video video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
#bp-top .p-video .p-play { position: absolute; left: 50%; top: 50%; width: 54px; height: 54px; margin: -27px 0 0 -27px; border-radius: 50%; background: rgba(255,255,255,.92); }
#bp-top .p-video .p-play::before { content: ''; position: absolute; left: 21px; top: 16px; border-left: 16px solid #364849; border-top: 11px solid transparent; border-bottom: 11px solid transparent; }
#bp-top .p-video .p-cap { position: absolute; left: 12px; right: 12px; bottom: 9px; text-align: left; font-size: 12px; font-weight: 500; opacity: .92; }
#bp-top .p-media-note { font-size: 12px; color: var(--ink-soft); margin: 6px 2px 0; }
/* spacing: the same tokens, tighter */
#bp-top { --s3: 1rem; --s4: 1.4rem; --s5: 1.75rem; --s6: 2.1rem; }
#bp-top .b-sec { padding: var(--s5) 0; }
#bp-top .bw { padding: 0 .25rem; }
#bp-top .b-hero { padding-top: var(--s5); }
#bp-top .b-hero__grid { gap: var(--s4); padding-bottom: var(--s5); }
#bp-top .b-h1 { font-size: 2.2rem; }
#bp-top .b-sh__t { font-size: 1.45rem; margin-bottom: .6rem; }
#bp-top .b-sh__s, #bp-top .b-intro { font-size: 1rem; line-height: 1.65; }
#bp-top .b-prose p { margin-bottom: .85rem; line-height: 1.65; }
#bp-top .b-fc, #bp-top .b-hcol, #bp-top .b-bi, #bp-top .b-cert, #bp-top .b-zone-pill { padding: 1rem; box-shadow: none; }
#bp-top .b-mtv { padding: .75rem; box-shadow: none; }
#bp-top .b-wc { padding: 1.4rem 1.1rem; }
#bp-top .b-ocard, #bp-top .b-main-video-card { -webkit-backdrop-filter: none; backdrop-filter: none; }   /* GPU effect removed on phones */
#bp-top * { transition: none !important; }                                                              /* hover lifts mean nothing on touch */
/* preview chrome (not part of the proposal) */
body { margin: 0; background: #F7F7F7; }
.pv-wrap { max-width: 390px; margin: 0 auto; background: #fff; padding: 0 20px 40px; }
.pv-tag { font: 600 11px/1.4 system-ui, sans-serif; letter-spacing: .04em; text-transform: uppercase; background: #364849; color: #fff; padding: 8px 20px; margin: 0 -20px; }
`;

const A_CSS = `
/* ===== A: optimised existing layout. Same sections, same order, same components. ===== */
#bp-top .b-hero-bar__grid { grid-auto-columns: minmax(150px, 60vw); }
`;

const B_CSS = `
/* ===== B: compact progressive. Each chapter: heading, one line, key facts, then one tap for the rest. ===== */
#bp-top .p-chapter { border: 1.5px solid var(--bg-deep); border-radius: var(--rl); background: var(--bg-card); margin: 0 0 .7rem; overflow: hidden; }
#bp-top .p-chapter > summary { list-style: none; cursor: pointer; padding: 1rem 1rem .85rem; display: block; }
#bp-top .p-chapter > summary::-webkit-details-marker { display: none; }
#bp-top .p-chapter .p-ch-title { font-weight: 700; font-size: 1.2rem; line-height: 1.2; color: var(--ink); display: block; }
#bp-top .p-chapter .p-ch-sub { display: block; font-size: .95rem; line-height: 1.5; color: var(--ink-mid); margin-top: .35rem; }
#bp-top .p-chapter .p-ch-facts { display: flex; flex-wrap: wrap; gap: .35rem .4rem; margin: .65rem 0 0; padding: 0; list-style: none; }
#bp-top .p-chapter .p-ch-facts li { background: var(--accent-mist); border: 1px solid var(--bg-deep); border-radius: 999px; padding: .2rem .65rem; font-size: .82rem; color: var(--ink); }
#bp-top .p-chapter .p-ch-more { display: block; margin-top: .7rem; font-size: .88rem; font-weight: 600; color: var(--accent-mid); }
#bp-top .p-chapter .p-ch-more::after { content: ' +'; }
#bp-top .p-chapter[open] .p-ch-more::after { content: ' \\2212'; }
#bp-top .p-chapter[open] .p-ch-more .p-open { display: none; }
#bp-top .p-chapter .p-body { padding: 0 1rem 1rem; }
#bp-top .p-chapter .p-body .b-sh { display: none; }          /* its text is the chapter summary above */
#bp-top .p-chapter .p-body .b-proof-layout { margin-bottom: .8rem; }
#bp-top .p-chapter .p-body .b-bgrid, #bp-top .p-chapter .p-body .b-htable, #bp-top .p-chapter .p-body .b-fcards, #bp-top .p-chapter .p-body .b-zone-grid { grid-template-columns: 1fr; }
`;

const C_CSS = `
/* ===== C: hybrid editorial. Decisions open; proof videos as one swipeable row; the rest as flat rows. ===== */
#bp-top .p-proof { margin: 0 -20px; padding: var(--s5) 20px; background: var(--bg-deep); }
#bp-top .p-proof h3 { font-size: 1.45rem; font-weight: 700; color: var(--ink); margin: 0 0 .35rem; }
#bp-top .p-proof > p { font-size: .98rem; line-height: 1.55; color: var(--ink-mid); margin: 0 0 1rem; }
#bp-top .p-row { display: grid; grid-auto-flow: column; grid-auto-columns: 82%; gap: .75rem; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: .5rem; -webkit-overflow-scrolling: touch; }
#bp-top .p-row .b-mtv { scroll-snap-align: start; margin: 0; background: var(--bg-card); }
#bp-top .p-row .b-mtv__head { display: none; }
#bp-top .p-row .b-mtv__base { display: none; }
#bp-top .p-notes { margin-top: var(--s5); }
#bp-top .p-notes > h3 { font-size: 1.45rem; font-weight: 700; color: var(--ink); margin: 0 0 .35rem; }
#bp-top .p-notes > p { font-size: .98rem; line-height: 1.55; color: var(--ink-mid); margin: 0 0 .8rem; }
#bp-top .p-note { border-top: 1.5px solid var(--bg-deep); }
#bp-top .p-note:last-child { border-bottom: 1.5px solid var(--bg-deep); }
#bp-top .p-note > summary { list-style: none; cursor: pointer; padding: .9rem 0; display: flex; justify-content: space-between; gap: .75rem; align-items: baseline; }
#bp-top .p-note > summary::-webkit-details-marker { display: none; }
#bp-top .p-note .p-n-title { font-weight: 700; font-size: 1.05rem; color: var(--ink); }
#bp-top .p-note .p-n-sub { display: block; font-weight: 400; font-size: .9rem; color: var(--ink-soft); margin-top: .2rem; line-height: 1.45; }
#bp-top .p-note > summary::after { content: '+'; font-size: 1.3rem; color: var(--accent-mid); flex: none; }
#bp-top .p-note[open] > summary::after { content: '\\2212'; }
#bp-top .p-note .p-body { padding: 0 0 1rem; }
#bp-top .p-note .p-body .b-sh { display: none; }
#bp-top .p-note .p-body .b-bgrid, #bp-top .p-note .p-body .b-zone-grid { grid-template-columns: 1fr; }
#bp-top .p-note .p-body .b-proof-layout { display: block; }
`;

/* tiny behaviour for the previews only: tap a poster, then (and only then) the video is requested */
const PREVIEW_JS = `
(function () {
  function openFor(id) { var t = id && document.getElementById(id.replace(/^#/, '')); if (t && t.tagName === 'DETAILS') t.open = true; }
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href^="#bp-"]'); if (a) openFor(a.getAttribute('href')); });
  if (location.hash) openFor(location.hash);
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.p-video[data-src]'); if (!b) return;
    var v = document.createElement('video'); v.src = b.getAttribute('data-src'); v.controls = true; v.playsInline = true; v.autoplay = true; v.setAttribute('aria-label', b.getAttribute('data-label') || '');
    if (b.hasAttribute('data-loop')) { v.loop = true; v.muted = true; }
    b.removeAttribute('data-src'); b.innerHTML = ''; b.appendChild(v);
  });
})();
`;

/* ------------------------------------------------------------------ in-page transforms ----------------------------- */
// Each transform runs in the browser on the real description DOM and returns nothing; the page is serialised afterwards.
const TRANSFORMS = String.raw`
(function () {
  const T = e => (e.textContent || '').replace(/\s+/g, ' ').trim();
  const q = (r, s) => r.querySelector(s), qa = (r, s) => Array.from(r.querySelectorAll(s));
  const el = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const root = q(document, '#bp-top');

  /* ---- media on demand: every <video> becomes a poster-style button; nothing is requested until it is tapped ---- */
  function mediaOnDemand() {
    // Hero: the autoplaying teaser loop is retired on phones; the card plays the FULL presentation (with sound) on tap.
    const heroFrame = q(root, '.b-main-video-frame');
    const modalVideo = q(root, '.b-video-modal video');
    const heroFull = modalVideo ? ((q(modalVideo, 'source') || {}).getAttribute ? q(modalVideo, 'source').getAttribute('src') : modalVideo.getAttribute('src')) : '';
    const heroLabel = modalVideo ? (modalVideo.getAttribute('aria-label') || '') : '';
    if (heroFrame && heroFull) {
      heroFrame.replaceChildren(el('<button type="button" class="p-video" data-src="' + esc(heroFull) + '" data-label="' + esc(heroLabel) + '"><span class="p-play"></span><span class="p-cap">Play the full video — ' + esc(heroLabel) + '</span></button>'));
    }
    qa(root, '.b-video-modal').forEach(m => m.remove());      // the :target modal is not needed when the card plays in place
    // The five proof loops: a poster-style box each; the file is requested only when tapped
    qa(root, 'video').forEach(v => {
      const srcEl = q(v, 'source'); const url = (srcEl && srcEl.getAttribute('src')) || v.getAttribute('src') || '';
      const label = v.getAttribute('aria-label') || '';
      const b = el('<button type="button" class="p-video" data-src="' + esc(url) + '" data-label="' + esc(label) + '" data-loop="1"><span class="p-play"></span><span class="p-cap">Play — ' + esc(label) + '</span></button>');
      (v.closest('.b-mtv__frame') || v.parentElement).replaceChildren(b);
    });
  }
  function stripDecor() {
    qa(root, '.b-leaf-divider, .b-floating-top').forEach(e => e.remove());
  }
  function stripSectionNav() { const n = q(root, 'nav.b-hero-bar'); if (n) n.remove(); }

  /* ---- facts per chapter: exact text lifted from the section's own components (no wording of mine) ---- */
  function facts(sec) {
    const id = sec.id; const out = [];
    const take = (s, f) => qa(sec, s).forEach(e => { const t = f ? f(e) : T(e); if (t) out.push(t); });
    if (id === 'bp-firmness') take('.b-fc', e => T(q(e, '.b-fc__name')) + ' ' + T(q(e, '.b-fc__kg')));
    else if (id === 'bp-height') take('.b-hcol', e => T(q(e, '.b-hcol__cm')) + ' cm — ' + T(q(e, '.b-hcol__n')));
    else if (id === 'bp-covers') take('.b-cover-menu summary', e => T(q(e, 'strong')) + ' · ' + T(q(e, '.b-cover-menu__tag')));
    else if (id === 'bp-benefits' || id === 'bp-support' || id === 'bp-adaptation' || id === 'bp-ventilation' || id === 'bp-hygiene') take('.b-bi__t');
    else if (id === 'bp-zones') take('.b-zone-pill__name');
    else if (id === 'bp-certs') take('.b-cert__m');
    else if (id === 'bp-warranty') { const wv = qa(sec, '.b-wv'), wu = qa(sec, '.b-wu'); wv.forEach((e, i) => out.push(T(e) + ' ' + T(wu[i] || e))); }
    return out;
  }
  function leadOf(sec) {
    const s = q(sec, '.b-sh__s'); if (s) return T(s);
    const p = q(sec, '.b-comfort-card p'); if (p) return T(p);
    const n = q(sec, '.b-fconf__notice'); if (n) return T(n);
    return '';
  }
  function titleOf(sec) { const h = q(sec, '.b-sh__t'); return h ? T(h) : T(q(sec, '.b-sh__n') || sec).replace(/^\d+\s*—\s*/, ''); }
  function labelOf(sec) { const n = q(sec, '.b-sh__n'); return n ? T(n).replace(/^\d+\s*—\s*/, '') : ''; }
  function bodyOf(sec) { const bw = q(sec, '.bw'); return bw; }

  const mode = window.__MODE__;
  mediaOnDemand(); stripDecor();

  if (mode === 'A') {
    /* nothing regrouped: same sections, same order. The section navigation bar stays (13 anchors, scrollable). */
  }

  if (mode === 'B') {
    stripSectionNav();
    qa(root, 'section.b-sec').forEach(sec => {
      const decision = ['bp-firmness', 'bp-height', 'bp-covers', 'bp-warranty', 'bp-delivery'].indexOf(sec.id) >= 0 && sec.id !== 'bp-warranty' && sec.id !== 'bp-delivery';
      const f = facts(sec);
      const bw = bodyOf(sec);
      const det = document.createElement('details'); det.className = 'p-chapter'; det.id = sec.id;
      if (sec.id === 'bp-firmness') det.open = true;                       // the decision chapter starts open
      const sum = document.createElement('summary');
      const h = q(bw, '.b-sh__t'), sub = q(bw, '.b-sh__s');
      if (h) { h.classList.add('p-ch-title'); sum.appendChild(h); }       // the real heading moves into the summary (outline kept)
      else { sum.appendChild(el('<span class="p-ch-title">' + esc(titleOf(sec)) + '</span>')); }
      if (sub) { sub.classList.add('p-ch-sub'); sum.appendChild(sub); }
      else if (sec.id === 'bp-comfort') { const lead = q(bw, '.b-comfort-card p'); if (lead) sum.appendChild(el('<span class="p-ch-sub">' + esc(T(lead)) + '</span>')); }
      if (f.length) sum.appendChild(el('<ul class="p-ch-facts" aria-hidden="true">' + f.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>'));
      sum.appendChild(el('<span class="p-ch-more">Read the full explanation</span>'));
      const body = document.createElement('div'); body.className = 'p-body'; body.append(...Array.from(bw.childNodes));
      // one level only: the chapter's own explanation <details> are opened, so there are no accordions inside accordions
      qa(body, '.b-dstack details, .b-cover-menu details').forEach(d => { d.open = true; });
      det.append(sum, body);
      sec.replaceWith(det);
    });
  }

  if (mode === 'C') {
    stripSectionNav();
    const keepOpen = ['bp-firmness', 'bp-height', 'bp-covers'];
    const trust = ['bp-certs', 'bp-warranty'];
    const notesIds = ['bp-comfort', 'bp-benefits', 'bp-support', 'bp-adaptation', 'bp-zones', 'bp-ventilation', 'bp-hygiene'];
    const secs = {}; qa(root, 'section.b-sec').forEach(s => { secs[s.id] = s; });
    // 1) the proof videos move into one swipeable row (moved, not copied)
    const proof = document.createElement('div'); proof.className = 'p-proof'; proof.id = 'bp-proof';
    proof.innerHTML = '<h3>See the material at work</h3><p>Five short proofs, one tap each.</p><div class="p-row"></div>';
    const row = q(proof, '.p-row');
    ['bp-benefits', 'bp-adaptation', 'bp-zones', 'bp-ventilation', 'bp-certs'].forEach(id => { const m = q(secs[id], '.b-mtv'); if (m) row.appendChild(m); });
    // 2) educational chapters become flat rows under one heading
    const notes = document.createElement('div'); notes.className = 'p-notes'; notes.id = 'bp-notes';
    notes.innerHTML = '<h3>The technical detail</h3><p>Open any row for the full approved explanation.</p>';
    notesIds.forEach(id => {
      const sec = secs[id]; const bw = bodyOf(sec);
      const det = document.createElement('details'); det.className = 'p-note'; det.id = id;
      const sum = document.createElement('summary'); const wrapSpan = document.createElement('span'); sum.appendChild(wrapSpan);
      const h = q(bw, '.b-sh__t'), sub = q(bw, '.b-sh__s');
      if (h) { h.classList.add('p-n-title'); wrapSpan.appendChild(h); } else wrapSpan.appendChild(el('<span class="p-n-title">' + esc(titleOf(sec)) + '</span>'));
      if (sub) { sub.classList.add('p-n-sub'); wrapSpan.appendChild(sub); }
      else if (id === 'bp-comfort') { const lead = q(bw, '.b-comfort-card p'); if (lead) wrapSpan.appendChild(el('<span class="p-n-sub">' + esc(T(lead)) + '</span>')); }
      det.append(sum);
      const body = document.createElement('div'); body.className = 'p-body'; body.append(...Array.from(bw.childNodes));
      qa(body, '.b-dstack details').forEach(d => { d.open = true; });
      det.append(body); notes.appendChild(det); sec.remove();
    });
    // 3) order: firmness, height, covers (decisions) -> proof row -> technical rows -> certifications -> warranty -> delivery
    const anchor = secs['bp-covers'];
    anchor.after(proof); proof.after(notes);
    // trust and delivery stay where they were (after the notes)
    notes.after(secs['bp-certs']); secs['bp-certs'].after(secs['bp-warranty']);
  }
})();
`;

/* ------------------------------------------------------------------ build + measure --------------------------------- */
const browser = await chromium.launch();

async function build(mode) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route('**/*', r => (r.request().url().startsWith('http') ? r.abort() : r.continue()));
  await page.setContent(`<!doctype html><meta charset="utf-8"><body><div id="productDescription">${src}</div></body>`);
  if (mode !== 'ORIGINAL') {
    await page.evaluate(`window.__MODE__ = ${JSON.stringify(mode)};`);
    await page.evaluate(TRANSFORMS);
  }
  const html = await page.evaluate(() => document.getElementById('productDescription').innerHTML);
  await page.close();
  return html;
}

function wrap(mode, descHtml) {
  const extra = mode === 'A' ? A_CSS : mode === 'B' ? B_CSS : mode === 'C' ? C_CSS : '';
  const label = { A: 'A — optimised existing layout', B: 'B — compact progressive', C: 'C — hybrid editorial', ORIGINAL: 'The description as it is today (for comparison)' }[mode];
  const lite = mode === 'ORIGINAL' ? '' : `<style id="mobile-lite">${BASE_CSS}${extra}</style><script>${PREVIEW_JS}</script>`;
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BOTANIC phone preview ${mode} (design preview, not deployed)</title>${FONT}<style>body{margin:0;background:#F7F7F7}.pv-wrap{max-width:390px;margin:0 auto;background:#fff;padding:0 20px 40px}.pv-tag{font:600 11px/1.4 system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;background:#364849;color:#fff;padding:8px 20px;margin:0 -20px}</style></head><body><div class="pv-wrap"><div class="pv-tag">Design preview, not deployed · ${label}</div><div id="productDescription" class="product-details__product-description">${descHtml}</div></div>${lite}</body></html>`;
}

const modes = ['ORIGINAL', 'A', 'B', 'C'];
const files = {};
for (const m of modes) {
  const html = wrap(m, await build(m));
  const name = m === 'ORIGINAL' ? 'baseline-original.html' : 'option-' + m.toLowerCase() + '.html';
  writeFileSync(join(outDir, name), html);
  files[m] = { name, html };
}

// ---- measure each file at phone width ----
async function measure(m, throttle) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const net = []; page.on('request', r => { if (/media\.divinedunlop\.com/.test(r.url())) net.push(r.url()); });
  await page.route('**/*', r => (r.request().url().startsWith('http') ? r.abort() : r.continue()));
  const cdp = await ctx.newCDPSession(page); await cdp.send('Performance.enable');
  if (throttle) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('file://' + join(outDir, files[m].name), { waitUntil: 'load' });
  await page.waitForTimeout(600);
  const met = {}; for (const x of (await cdp.send('Performance.getMetrics')).metrics) met[x.name] = x.value;
  const d = await page.evaluate(() => {
    const T = e => (e.textContent || '').replace(/\s+/g, ' ').trim();
    const root = document.getElementById('productDescription');
    const visible = (el) => { let n = 0; const walk = (node) => { if (node.nodeType === 3) { n += node.textContent.replace(/\s+/g, ' ').trim().length; return; } if (node.nodeType !== 1 || /^(STYLE|SCRIPT)$/.test(node.tagName)) return; const cs = getComputedStyle(node); if (cs.display === 'none' || cs.visibility === 'hidden') return; if (node.tagName === 'DETAILS' && !node.open) { for (const c of node.children) if (c.tagName === 'SUMMARY') walk(c); return; } for (const c of node.childNodes) walk(c); }; walk(el); return n; };
    const bp = document.getElementById('bp-top');
    return {
      heightPx: Math.round(root.getBoundingClientRect().height), screens844: +(root.getBoundingClientRect().height / 844).toFixed(1),
      nodes: bp.getElementsByTagName('*').length, chars: T(bp).length, visibleChars: visible(bp),
      detailsTotal: bp.querySelectorAll('details').length, detailsOpen: bp.querySelectorAll('details[open]').length,
      videoElements: bp.querySelectorAll('video').length, videoPlaceholders: bp.querySelectorAll('.p-video').length, imgs: bp.querySelectorAll('img').length,
      lazyImgs: bp.querySelectorAll('img[loading=lazy]').length,
      backdropFilters: Array.from(bp.querySelectorAll('*')).filter(e => { const s = getComputedStyle(e); return s.backdropFilter !== 'none' && s.backdropFilter; }).length,
      transitions: Array.from(bp.querySelectorAll('*')).filter(e => getComputedStyle(e).transitionDuration.replace(/[0s,\s]/g, '') !== '').length,
      shadows: Array.from(bp.querySelectorAll('*')).filter(e => getComputedStyle(e).boxShadow !== 'none').length,
      links: bp.querySelectorAll('a[href]').length, ids: Array.from(bp.querySelectorAll('[id]')).map(e => e.id)
    };
  });
  const sizes = { fileBytes: Buffer.byteLength(files[m].html), fileGzipBytes: gzipSync(files[m].html).length };
  const css = files[m].html.match(/<style[^>]*>[\s\S]*?<\/style>/g) || [];
  sizes.cssChars = css.reduce((a, s) => a + s.length, 0) - (files[m].html.match(/<style>body[\s\S]*?<\/style>/) || [''])[0].length;
  sizes.markupChars = Buffer.byteLength(files[m].html) - sizes.cssChars;
  await ctx.close();
  return { ...d, ...sizes, mediaRequestsAtLoad: net.length, layoutMs: Math.round((met.LayoutDuration || 0) * 1000), styleMs: Math.round((met.RecalcStyleDuration || 0) * 1000), scriptMs: Math.round((met.ScriptDuration || 0) * 1000), taskMs: Math.round((met.TaskDuration || 0) * 1000), layoutCount: met.LayoutCount, restyleCount: met.RecalcStyleCount };
}

// ---- completeness: every text of the original must still be in the page (or on the omission list) ----
const OMITTED_OK = [/^\d{2}\s*—/, /^\d{2}$/, /^Back to Top$/i, /^Z\d$/];     // section numbers, floating Back to Top, zone codes are decoration
async function completeness(m) {
  const orig = await browser.newPage();
  await orig.route('**/*', r => (r.request().url().startsWith('http') ? r.abort() : r.continue()));
  await orig.setContent(`<!doctype html><meta charset="utf-8"><body><div id="productDescription">${src}</div></body>`);
  const leaves = await orig.evaluate(() => {
    const out = new Set();
    const w = document.createTreeWalker(document.querySelector('#bp-top'), NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) { if (n.parentElement.closest('style,script')) continue; const t = n.textContent.replace(/\s+/g, ' ').trim(); if (t.length >= 3) out.add(t); }
    return Array.from(out);
  });
  await orig.close();
  const page = await browser.newPage();
  await page.route('**/*', r => (r.request().url().startsWith('http') ? r.abort() : r.continue()));
  await page.goto('file://' + join(outDir, files[m].name));
  const all = await page.evaluate(() => (document.getElementById('bp-top').textContent || '').replace(/\s+/g, ' '));
  await page.close();
  const missing = leaves.filter(t => !all.includes(t) && !OMITTED_OK.some(re => re.test(t)));
  return { sourceTexts: leaves.length, missing };
}

const result = { date: new Date().toISOString(), width: 390, note: 'Offline lab measurement of the description alone, without Ecwid, without the network. Media is not measured.', options: {} };
for (const m of modes) {
  const a = await measure(m, false), b = await measure(m, true);
  const c = m === 'ORIGINAL' ? { sourceTexts: 0, missing: [] } : await completeness(m);
  result.options[m] = { ...a, cpu4x: { layoutMs: b.layoutMs, styleMs: b.styleMs, scriptMs: b.scriptMs, taskMs: b.taskMs }, completeness: c };
}
await browser.close();
writeFileSync(join(outDir, 'data', 'options-measure.json'), JSON.stringify(result, null, 1));

const pad = (s, n) => String(s).padEnd(n).slice(0, n);
console.log(pad('', 10) + ['ORIGINAL', 'A', 'B', 'C'].map(m => pad(m, 11)).join(''));
const rows = [['height px', 'heightPx'], ['screens (844)', 'screens844'], ['DOM nodes', 'nodes'], ['visible chars', 'visibleChars'], ['all chars', 'chars'], ['details', 'detailsTotal'], ['video elems', 'videoElements'], ['video boxes', 'videoPlaceholders'], ['backdrop-flt', 'backdropFilters'], ['shadows', 'shadows'], ['file bytes', 'fileBytes'], ['gzip bytes', 'fileGzipBytes'], ['css chars', 'cssChars'], ['layout ms', 'layoutMs'], ['style ms', 'styleMs']];
for (const [lab, k] of rows) console.log(pad(lab, 14) + ['ORIGINAL', 'A', 'B', 'C'].map(m => pad(result.options[m][k], 11)).join(''));
for (const m of ['A', 'B', 'C']) console.log(m + ' completeness: ' + result.options[m].completeness.missing.length + ' missing of ' + result.options[m].completeness.sourceTexts + (result.options[m].completeness.missing.length ? ' -> ' + result.options[m].completeness.missing.slice(0, 5).map(s => '"' + s.slice(0, 50) + '"').join(', ') : ''));
