// Structural audit of a product description: what each section says, how much of it is text and how much is
// structure, what it costs the browser, and what is duplicated. READ-ONLY and OFFLINE: it loads the stored source
// file in a local Chromium with all network blocked. It measures the markup; it does not measure media (the media
// host is not reachable from where this was written; see docs/mobile/MOBILE-OPTIMISATION-STUDY.md).
//
//   NODE_PATH=$(npm root -g) node tools/audit-description.mjs [source.html] [rootSelector] [out.json]
//
// Defaults audit the Botanic reference description (#bp-top). Widths: 350 px is the content column of a phone
// (390 px viewport, the store's own side padding); 720 px is a tablet column; 560 is the left column on desktop.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcPath = process.argv[2] || join(root, 'source', 'botanic-original-description.html');
const rootSel = process.argv[3] || '#bp-top';
const outPath = process.argv[4] || join(root, 'docs', 'mobile', 'data', 'botanic-audit.json');
const src = readFileSync(srcPath, 'utf8');

const WIDTHS = [350, 560, 720];

const browser = await chromium.launch();
const result = { source: srcPath.replace(root + '/', ''), rootSelector: rootSel, sourceBytes: Buffer.byteLength(src), widths: WIDTHS, blocks: [], global: {} };

for (const w of WIDTHS) {
  const page = await browser.newPage({ viewport: { width: w + 40, height: 900 } });
  await page.route('**/*', r => (r.request().url().startsWith('http') ? r.abort() : r.continue()));
  await page.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0"><div style="width:${w}px;margin:0 auto"><div id="productDescription">${src}</div></div>`);
  const data = await page.evaluate((rootSel) => {
    const rootEl = document.querySelector(rootSel);
    const isStructural = (el) => el.tagName === 'STYLE' || el.tagName === 'SCRIPT';
    const kids = Array.from(rootEl.children).filter(el => !isStructural(el));
    // Group: every top-level child, but merge the decorative leaf dividers into a single "dividers" block.
    const blocks = [];
    let dividers = null;
    for (const el of kids) {
      const cls = (el.className + '');
      const kind = el.tagName === 'SECTION' ? 'section' : /leaf-divider/.test(cls) ? 'divider' : /hero-bar/.test(cls) ? 'nav' : /b-hero$/.test(cls) || /\bb-hero\b/.test(cls) ? 'hero' : /b-cta/.test(cls) ? 'cta' : /floating/.test(cls) ? 'floating' : 'other';
      if (kind === 'divider') { if (!dividers) { dividers = { els: [], kind: 'dividers', id: 'dividers' }; blocks.push(dividers); } dividers.els.push(el); continue; }
      blocks.push({ els: [el], kind, id: el.id || (kind === 'nav' ? (el.tagName === 'NAV' ? 'section-nav-bar' : 'key-features-bar') : kind) });
    }
    const heavy = (cs) => {
      const f = [];
      if (cs.backdropFilter && cs.backdropFilter !== 'none') f.push('backdrop-filter');
      if (cs.filter && cs.filter !== 'none') f.push('filter');
      if (cs.animationName && cs.animationName !== 'none') f.push('animation');
      if (cs.transitionProperty && cs.transitionDuration && cs.transitionDuration !== '0s') f.push('transition');
      if (cs.mixBlendMode && cs.mixBlendMode !== 'normal') f.push('blend');
      if (cs.willChange && cs.willChange !== 'auto') f.push('will-change');
      if (cs.boxShadow && cs.boxShadow !== 'none') f.push('shadow');
      if (/gradient/.test(cs.backgroundImage)) f.push('gradient');
      if (cs.position === 'sticky' || cs.position === 'fixed') f.push('sticky/fixed');
      return f;
    };
    const textOf = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
    const visibleChars = (el) => {
      // text that is on screen without a click: not inside a closed <details> (except its <summary>) and not display:none
      let n = 0;
      const walk = (node) => {
        if (node.nodeType === 3) { n += node.textContent.replace(/\s+/g, ' ').trim().length; return; }
        if (node.nodeType !== 1) return;
        if (node.tagName === 'STYLE' || node.tagName === 'SCRIPT') return;
        const cs = getComputedStyle(node);
        if (cs.display === 'none') return;
        if (node.tagName === 'DETAILS' && !node.open) { const s = node.querySelector(':scope > summary'); if (s) n += textOf(s).length; return; }
        for (const c of node.childNodes) walk(c);
      };
      walk(el);
      return n;
    };
    const out = blocks.map(b => {
      const nodes = b.els.reduce((a, e) => a + 1 + e.getElementsByTagName('*').length, 0);
      const h = b.els.reduce((a, e) => a + e.getBoundingClientRect().height, 0);
      const all = b.els.flatMap(e => [e, ...e.getElementsByTagName('*')]);
      const feat = {};
      for (const e of all) { for (const f of heavy(getComputedStyle(e))) feat[f] = (feat[f] || 0) + 1; }
      const chars = b.els.reduce((a, e) => a + textOf(e).length, 0);
      const words = b.els.reduce((a, e) => a + (textOf(e).match(/\S+/g) || []).length, 0);
      const vis = b.els.reduce((a, e) => a + visibleChars(e), 0);
      const q = (s) => b.els.reduce((a, e) => a + e.querySelectorAll(s).length, 0);
      const headings = b.els.flatMap(e => Array.from(e.querySelectorAll('h1,h2,h3,h4,h5,h6'))).map(x => x.tagName.toLowerCase() + ': ' + textOf(x).slice(0, 60));
      const title = (() => { const e = b.els[0]; const h = e.querySelector('h1,h2,h3'); return h ? textOf(h).slice(0, 70) : ''; })();
      return {
        id: b.id, kind: b.kind, title, heightPx: Math.round(h), nodes, chars, words, visibleChars: vis,
        imgs: q('img'), videos: q('video'), autoplayVideos: q('video[autoplay]'), details: q('details'), tables: q('table'), svgs: q('svg'), links: q('a[href]'), anchors: q('a[href^="#"]'),
        inputs: q('input'), headings, effects: feat
      };
    });
    // Duplicate text: leaf blocks of at least 40 characters that appear more than once in the whole description.
    const seen = new Map();
    for (const e of rootEl.querySelectorAll('p,li,div,span,summary,h1,h2,h3,h4,td,th,label')) {
      if (e.children.length > 0 && !/^(P|LI|SUMMARY|H1|H2|H3|H4)$/.test(e.tagName)) continue;
      const t = textOf(e);
      if (t.length < 40) continue;
      seen.set(t, (seen.get(t) || 0) + 1);
    }
    const dups = Array.from(seen.entries()).filter(([, n]) => n > 1).map(([t, n]) => ({ text: t.slice(0, 90), copies: n }));
    return { blocks: out, dups, total: { heightPx: Math.round(rootEl.getBoundingClientRect().height), nodes: rootEl.getElementsByTagName('*').length, chars: textOf(rootEl).length, words: (textOf(rootEl).match(/\S+/g) || []).length, visibleChars: visibleChars(rootEl) } };
  }, rootSel);
  if (w === 350) { result.blocks = data.blocks.map(b => ({ ...b, heightByWidth: { 350: b.heightPx } })); result.duplicates = data.dups; result.total350 = data.total; }
  else { data.blocks.forEach((b, i) => { result.blocks[i].heightByWidth[w] = b.heightPx; }); result['total' + w] = data.total; }
  await page.close();
}

// Global facts about the CSS shipped with the description.
{
  const page = await browser.newPage();
  await page.route('**/*', r => (r.request().url().startsWith('http') ? r.abort() : r.continue()));
  await page.setContent(`<!doctype html><meta charset="utf-8"><body><div id="productDescription">${src}</div></body>`);
  result.global = await page.evaluate((rootSel) => {
    const styles = Array.from(document.querySelectorAll('style'));
    const css = styles.map(s => s.textContent).join('\n');
    let rules = 0, media = new Set(), keyframes = 0, imp = (css.match(/!important/g) || []).length, unusedRules = 0, usedRules = 0, hasRules = 0, supports = 0;
    const countRules = (list) => {
      for (const r of list) {
        if (r.type === 1) { rules++; try { if (document.querySelector(r.selectorText)) usedRules++; else unusedRules++; } catch (e) { hasRules++; } }
        else if (r.type === 4) { media.add(r.conditionText || r.media.mediaText); countRules(r.cssRules); }
        else if (r.type === 7) keyframes++;
        else if (r.type === 12) { supports++; countRules(r.cssRules); }
      }
    };
    for (const ss of Array.from(document.styleSheets)) { try { countRules(ss.cssRules); } catch (e) { /* ignore */ } }
    const rootEl = document.querySelector(rootSel);
    const clone = rootEl.cloneNode(true);
    return {
      styleBlocks: styles.length, cssChars: css.length, cssRules: rules, cssRulesMatchingSomething: usedRules, cssRulesMatchingNothing: unusedRules, selectorsThatThrow: hasRules,
      mediaQueries: Array.from(media), keyframes, importantCount: imp, supportsBlocks: supports,
      scriptsInDescription: document.querySelectorAll('#productDescription script').length, iframes: document.querySelectorAll('iframe').length,
      markupChars: rootEl.outerHTML.length, inlineStyleAttrs: rootEl.querySelectorAll('[style]').length, classCount: new Set(Array.from(rootEl.querySelectorAll('[class]')).flatMap(e => (e.className + '').split(/\s+/))).size,
      headingOutline: Array.from(rootEl.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => h.tagName.toLowerCase()).join(' ').replace(/(\bh\d\b)( \1)+/g, '$1…'),
      h1Count: rootEl.querySelectorAll('h1').length,
      imgsWithoutAlt: Array.from(rootEl.querySelectorAll('img')).filter(i => !i.getAttribute('alt')).length,
      videosWithoutLabel: Array.from(rootEl.querySelectorAll('video')).filter(v => !v.getAttribute('aria-label')).length,
      imgsMissingDimensions: Array.from(rootEl.querySelectorAll('img')).filter(i => !(i.getAttribute('width') && i.getAttribute('height'))).length,
      videosMissingPoster: Array.from(rootEl.querySelectorAll('video')).filter(v => !v.getAttribute('poster')).length,
      videoPreload: Array.from(rootEl.querySelectorAll('video')).map(v => (v.getAttribute('preload') || 'default') + (v.hasAttribute('autoplay') ? '+autoplay' : '') + (v.hasAttribute('controls') ? '+controls' : '')),
      detailsTotal: rootEl.querySelectorAll('details').length,
      jsDependency: 'none (no <script> in the description; every interaction is <details>, radio inputs or :target)'
    };
  }, rootSel);
  await page.close();
}
await browser.close();

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(result, null, 1));

// Console summary
const pad = (s, n) => String(s).padEnd(n).slice(0, n);
console.log(`Source ${result.source}: ${result.sourceBytes} bytes, ${result.global.cssChars} CSS chars, ${result.global.markupChars} markup chars`);
console.log(pad('block', 18) + pad('kind', 9) + pad('h@350', 8) + pad('h@560', 8) + pad('h@720', 8) + pad('nodes', 7) + pad('chars', 7) + pad('visible', 8) + pad('img', 4) + pad('vid', 4) + pad('det', 4) + 'effects');
for (const b of result.blocks) {
  console.log(pad(b.id, 18) + pad(b.kind, 9) + pad(b.heightByWidth[350], 8) + pad(b.heightByWidth[560], 8) + pad(b.heightByWidth[720], 8) + pad(b.nodes, 7) + pad(b.chars, 7) + pad(b.visibleChars, 8) + pad(b.imgs, 4) + pad(b.videos, 4) + pad(b.details, 4) + Object.entries(b.effects).map(([k, v]) => k + ':' + v).join(' '));
}
console.log('TOTAL @350: ' + JSON.stringify(result.total350));
console.log('GLOBAL: ' + JSON.stringify({ ...result.global, headingOutline: undefined, videoPreload: undefined }));
console.log('Duplicated text blocks: ' + result.duplicates.length);
console.log('wrote ' + outPath);
