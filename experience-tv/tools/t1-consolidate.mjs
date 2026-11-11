// T1: consolidate the description colour layers into one stylesheet plus one design-token file, WITHOUT changing the look.
//
// Input (cascade order): src/archive/description-light.css, description-turquoise.css, description-hybrid.css
// Method, in this order:
//   1. Parse the three layers into declarations, one per (selector, property), in cascade order.
//   2. Exact duplicates: when the same selector sets the same property again later (same priority), the earlier declaration can
//      never apply; it is dropped. (A later normal declaration never beats an earlier !important one; then the later one is dropped.)
//   3. Measured removal: every remaining declaration is tentatively removed, and the page is measured again (computed values of every
//      element, ::before / ::after, and every box, in two states, at 390 px). If anything differs the declaration is put back.
//      Declarations in :hover / :focus / :active style selectors, and declarations whose selector matches nothing on this page, are never
//      removed (they are not tested by a static page).
//   4. Tokens: every colour, repeated gradient and repeated shadow becomes a named custom property (src/design-tokens.css).
//
//   NODE_PATH=$(npm root -g) node tools/t1-consolidate.mjs <baseline.html> [--no-oracle]
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openPage, stateProbe } from './t1-snapshot.mjs';
const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..'), SRC = join(root, 'docs/mobile/premium/src');
const LAYERS = ['description-light.css', 'description-turquoise.css', 'description-hybrid.css'];
const IDS = ['description-light', 'description-turquoise', 'description-hybrid'];

function splitTop(s, sep) {
  const out = []; let depth = 0, q = null, cur = '';
  for (const c of s) {
    if (q) { cur += c; if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === '(' || c === '[') depth++; if (c === ')' || c === ']') depth--;
    if (c === sep && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function parse(text) {
  const rules = []; let i = 0, comment = '';
  while (i < text.length) {
    if (/\s/.test(text[i])) { i++; continue; }
    if (text.startsWith('/*', i)) { const j = text.indexOf('*/', i + 2); comment += (comment ? '\n' : '') + text.slice(i, j + 2).trim(); i = j + 2; continue; }
    if (text[i] === '@') throw new Error('at-rules are not supported (offset ' + i + ')');
    const b = text.indexOf('{', i), sel = text.slice(i, b).trim(); let j = b + 1, depth = 0, q = null;
    for (; j < text.length; j++) { const c = text[j]; if (q) { if (c === q) q = null; continue; } if (c === '"' || c === "'") { q = c; continue; } if (c === '(') depth++; else if (c === ')') depth--; else if (c === '}' && depth === 0) break; }
    const body = text.slice(b + 1, j).replace(/\/\*[\s\S]*?\*\//g, '');
    const decls = splitTop(body, ';').filter(Boolean).map(d => { const k = d.indexOf(':'); let value = d.slice(k + 1).trim(), important = false; if (/!important\s*$/.test(value)) { important = true; value = value.replace(/\s*!important\s*$/, '').trim(); } return { prop: d.slice(0, k).trim(), value, important }; });
    rules.push({ comment, selectors: splitTop(sel, ','), decls }); comment = ''; i = j + 1;
  }
  return rules;
}

// Entries: one per (rule, selector, declaration), in cascade order.
function entriesOf(rules) {
  const E = [];
  rules.forEach((r, ri) => r.selectors.forEach(sel => r.decls.forEach(d => E.push({ ri, sel, prop: d.prop, value: d.value, imp: d.important, alive: true, locked: false }))));
  return E;
}
const line = (sel, ds) => { const body = ds.map(d => d.prop + ': ' + d.value + (d.imp ? ' !important' : '') + ';').join(' '); return (sel + ' { ' + body + ' }').length < 150 ? sel + ' { ' + body + ' }' : sel + ' {\n' + ds.map(d => '  ' + d.prop + ': ' + d.value + (d.imp ? ' !important' : '') + ';').join('\n') + '\n}'; };
function emit(rules, E, valueMap) {
  const out = []; const byRule = new Map(); E.forEach(e => { if (!e.alive) return; (byRule.get(e.ri) || byRule.set(e.ri, []).get(e.ri)).push(e); });
  rules.forEach((r, ri) => {
    const es = byRule.get(ri); if (!es) return;
    const perSel = new Map(); es.forEach(e => (perSel.get(e.sel) || perSel.set(e.sel, []).get(e.sel)).push(e));
    const groups = new Map();
    for (const [sel, ds] of perSel) { const key = ds.map(d => d.prop + ':' + d.value + ':' + d.imp).join(';'); (groups.get(key) || groups.set(key, { sels: [], ds }).get(key)).sels.push(sel); }
    let first = true;
    for (const g of groups.values()) { const ds = g.ds.map(d => ({ prop: d.prop, value: valueMap ? valueMap(d.value) : d.value, imp: d.imp })); out.push((first && r.comment ? r.comment + '\n' : '') + line(g.sels.join(', '), ds)); first = false; }
  });
  return out.join('\n') + '\n';
}

const STATE = /:(hover|focus|focus-visible|focus-within|active|checked|disabled|visited|link|target)\b/;
const NAMES = { '50cdfd': 'sky', '1a5c7e': 'teal', '163d57': 'teal-deep', '0b1c2a': 'abyss', '173a52': 'band-top', '10293f': 'band-end', '0e2a3e': 'frame-top', '0e2030': 'frame-end',
  '1b3650': 'zone-card', '2a5a7a': 'teal-line', '9adcf8': 'leaf-light', '3fa3d9': 'leaf-dark', '272d32': 'ink', '3e474d': 'ink-2', '5b666e': 'ink-3', 'f2f7f9': 'ground', 'ffffff': 'white',
  'd3e0e5': 'line', 'e4eef1': 'notice', '2e363c': 'graphite-1', '232b31': 'graphite-2', '1f6a8f': 'teal-hover', '2f565a': 'petrol', '1e3036': 'depth' };

async function main() {
  const baseline = process.argv[2], noOracle = process.argv.includes('--no-oracle');
  const texts = LAYERS.map(f => readFileSync(join(SRC, 'archive', f), 'utf8').replace(/^\s*\/\*[\s\S]*?\*\/\s*/, ''));   // the file header describes the older direction
  const rules = parse(texts.join('\n')); const E = entriesOf(rules);
  const stats = { layerBytes: texts.reduce((a, t) => a + t.length, 0), layerImportant: texts.reduce((a, t) => a + (t.match(/!important/g) || []).length, 0), rulesBefore: rules.length, declarationsBefore: E.length };
  stats.colourLiteralsBefore = texts.reduce((a, t) => a + (t.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) || []).length, 0);

  // 2. exact duplicates
  const win = new Map();
  for (const e of E) { const k = e.sel + '\0' + e.prop, w = win.get(k); if (!w) { win.set(k, e); continue; } if (w.imp && !e.imp) e.alive = false; else { w.alive = false; win.set(k, e); } }
  stats.droppedExactDuplicates = E.filter(e => !e.alive).length;

  // 3. measured removal
  const { chromium } = require('playwright'); const browser = await chromium.launch();
  const { page, ctx } = await openPage(browser, baseline, 390);
  await page.evaluate(() => { window.__base = JSON.stringify(window.__states(false)); });
  const probe = await stateProbe(page, ctx); const baseState = JSON.stringify(await probe.sig());
  console.log('state probe: ' + probe.count + ' interactive elements x 3 states');
  const setCss = css => page.evaluate(c => { var s = ['description-light', 'description-turquoise', 'description-hybrid'].map(i => document.getElementById(i)); s[0].textContent = c; s[1].textContent = ''; s[2].textContent = ''; return JSON.stringify(window.__states(false)) === window.__base; }, css).then(async same => same && JSON.stringify(await probe.sig()) === baseState);
  const roundTrip = await setCss(emit(rules, E));
  console.log('round trip after exact-duplicate removal equals baseline:', roundTrip); if (!roundTrip) throw new Error('exact-duplicate removal changed the page; stopping');
  const sels = [...new Set(E.map(e => e.sel))];
  const matched = await page.evaluate(ss => ss.map(s => { try { return document.querySelectorAll(s.replace(/::?(before|after)\s*$/, '')).length > 0; } catch (e) { return false; } }), sels);
  const isMatched = new Map(sels.map((s, i) => [s, matched[i]]));
  E.forEach(e => { e.locked = STATE.test(e.sel) || !isMatched.get(e.sel); });
  stats.lockedHover = E.filter(e => e.alive && STATE.test(e.sel)).length; stats.lockedUnmatched = E.filter(e => e.alive && !STATE.test(e.sel) && !isMatched.get(e.sel)).length;
  let removed = 0, tested = 0;
  const cacheFile = process.env.T1_CACHE, reuse = process.argv.includes('--reuse'), revalidate = process.argv.includes('--revalidate');
  if (reuse && cacheFile) { const c = JSON.parse(readFileSync(cacheFile, 'utf8')); E.forEach((e, i) => { if (e.alive && !e.locked) e.alive = c[i]; }); console.log('reused measured result from', cacheFile); }
  else if (!noOracle) {
    // --revalidate: after the list of measured properties was widened, only the declarations an earlier run removed are tested again
    // (a declaration kept by a weaker measurement is still needed under a stronger one)
    const prior = revalidate && cacheFile ? JSON.parse(readFileSync(cacheFile, 'utf8')) : null;
    for (const [i, e] of E.entries()) {
      if (!e.alive || e.locked) continue;
      if (prior && prior[i]) continue;
      e.alive = false; tested++;
      const same = await setCss(emit(rules, E));
      if (same) { removed++; } else e.alive = true;
      if (tested % 25 === 0) console.log(`  tested ${tested}, removed ${removed}`);
    }
  }
  if (cacheFile && !reuse) writeFileSync(cacheFile, JSON.stringify(E.map(e => e.alive)));
  stats.removedByMeasurement = E.filter(e => !e.alive).length - stats.droppedExactDuplicates; stats.testedByMeasurement = reuse ? 'reused from an earlier measured run' : tested;
  const finalOk = await setCss(emit(rules, E)); console.log('final consolidated CSS equals baseline (before tokens):', finalOk); if (!finalOk) throw new Error('final CSS differs from baseline');
  await browser.close();

  // 4. tokens
  const alive = E.filter(e => e.alive);
  const norm = v => v.replace(/\s+/g, ' ').toLowerCase();
  const wholeCount = new Map();
  for (const e of alive) { const long = !/var\(/.test(e.value) && (/gradient\(/.test(e.value) || e.prop === 'box-shadow'); if (long) { const k = norm(e.value); wholeCount.set(k, (wholeCount.get(k) || 0) + 1); } }
  const wholeTokens = new Map(); let gi = 0, si = 0;
  for (const e of alive) { const k = norm(e.value); if ((wholeCount.get(k) || 0) >= 2 && !wholeTokens.has(k)) { const isShadow = e.prop === 'box-shadow'; wholeTokens.set(k, { name: isShadow ? `--dd-shadow-${++si}` : `--dd-grad-${++gi}`, value: e.value, sel: e.sel }); } }
  const hexSet = new Map(), rgbSet = new Map();
  const canon = h => { h = h.replace('#', '').toLowerCase(); return h.length === 3 ? h.split('').map(c => c + c).join('') : h; };
  const colourName = h => NAMES[h] || 'c-' + h;
  const tok = v => v
    .replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, (m, h) => { h = canon(h); hexSet.set(h, 1); return `var(--dd-${colourName(h)})`; })
    .replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/g, (m, r, g, b, a) => { const h = [r, g, b].map(n => (+n).toString(16).padStart(2, '0')).join(''); rgbSet.set(h, [r, g, b].join(', ')); return `rgba(var(--dd-rgb-${colourName(h)}), ${a})`; });
  const valueMap = v => { const w = wholeTokens.get(norm(v)); return w ? `var(${w.name})` : tok(v); };
  const css = emit(rules, E, valueMap);
  // gradients and shadows first: their definitions use colours that must also get a token
  const gradLines = [...wholeTokens.values()].map(w => `  /* used first by ${w.sel.slice(0, 60)} */\n  ${w.name}: ${tok(w.value)};`);
  const tokenLines = [];
  [...hexSet.keys()].sort().forEach(h => tokenLines.push(`  --dd-${colourName(h)}: #${h.toUpperCase()};`));
  [...rgbSet.entries()].sort().forEach(([h, t]) => tokenLines.push(`  --dd-rgb-${colourName(h)}: ${t};`));
  const tokens = `/* DESIGN TOKENS: the single place for the colour system of the Graphite preview.
   Created by tools/t1-consolidate.mjs (T1) from the approved layers. Edit the values here, never in a rule.
   --dd-<name>        a colour (solid)
   --dd-rgb-<name>    the same colour as "r, g, b", used for transparent versions: rgba(var(--dd-rgb-sky), .22)
   --dd-grad-N / --dd-shadow-N   a gradient or shadow used more than once */
:root {
${tokenLines.join('\n')}
${gradLines.join('\n')}
}
`;
  // the configurator palette (Graphite Blue) belongs to the same file: read unchanged from the baseline page
  const cfg = /\.gx \{ ((?:--[a-z0-9-]+: [^;]+; ?)+)/.exec(readFileSync(baseline, 'utf8'));
  const cfgBlock = cfg ? '\n/* Configurator (Graphite Blue) palette, moved here unchanged from graphite.css. Same selector, same values. */\n.gx {\n' + (cfg[1].match(/--[a-z0-9-]+: [^;]+;/g) || []).map(x => '  ' + x).join('\n') + '\n}\n' : '';
  stats.rulesAfter = css.split('\n').filter(l => /\{\s*$|\{.*\}\s*$/.test(l)).length; stats.declarationsAfter = alive.length; stats.cssBytes = css.length; stats.importantAfter = (css.match(/!important/g) || []).length;
  stats.colourLiteralsAfter = (css.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d/g) || []).length; stats.colourTokens = hexSet.size; stats.rgbTokens = rgbSet.size; stats.wholeValueTokens = wholeTokens.size;
  writeFileSync(join(SRC, 'description.css'), '/* DESCRIPTION colour layer of the Graphite preview (direction H, blue-teal). One file, in cascade order, values from design-tokens.css.\n   Generated by tools/t1-consolidate.mjs from src/archive/description-{light,turquoise,hybrid}.css; verified identical by tools/t1-snapshot.mjs. */\n' + css);
  writeFileSync(join(SRC, 'design-tokens.css'), tokens + cfgBlock);
  writeFileSync(join(root, 'docs/mobile/premium/data/t1-consolidation.json'), JSON.stringify(stats, null, 1));
  console.log(JSON.stringify(stats, null, 1));
}
await main();
