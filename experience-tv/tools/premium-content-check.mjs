// Completeness and size of the refined Variant C content inside the integrated preview.
//   NODE_PATH=$(npm root -g) node tools/premium-content-check.mjs
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'source', 'botanic-original-description.html'), 'utf8');
const b = await chromium.launch();
const o = await b.newPage(); await o.route('**/*', r => (r.request().url().startsWith('http') ? r.abort() : r.continue())); await o.setContent('<div id="productDescription">' + src + '</div>');
const leaves = await o.evaluate(() => { const s = new Set(), w = document.createTreeWalker(document.querySelector('#bp-top'), NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (n.parentElement.closest('style,script')) continue; const t = n.textContent.replace(/\s+/g, ' ').trim(); if (t.length >= 3) s.add(t); } return [...s]; });
const ctx = await b.newContext(devices['iPhone 13']); const p = await ctx.newPage();
await p.route('**/*', r => { const u = r.request().url(); (u.startsWith('file:') || /cloudfront/.test(u)) ? r.continue() : r.abort(); });
await p.goto('file://' + join(root, 'docs/mobile/premium/preview/index.html') + '?chrome=0'); await p.waitForTimeout(1000);
const r = await p.evaluate(() => {
  const root = document.getElementById('bp-top'), all = root.textContent.replace(/\s+/g, ' ');
  const vis = (el) => { let n = 0; const walk = (x) => { if (x.nodeType === 3) { n += x.textContent.replace(/\s+/g, ' ').trim().length; return; } if (x.nodeType !== 1 || /^(STYLE|SCRIPT)$/.test(x.tagName)) return; const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden') return; if (x.tagName === 'DETAILS' && !x.open) { for (const c of x.children) if (c.tagName === 'SUMMARY') walk(c); return; } for (const c of x.childNodes) walk(c); }; walk(el); return n; };
  const hiddenByCss = Array.from(root.querySelectorAll('.b-fc__kg,.b-fc__st,.b-ocard,.b-hero__grid > div:first-child')).map(e => e.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean);
  return { all, height: Math.round(document.getElementById('desc-slot').getBoundingClientRect().height), nodes: root.getElementsByTagName('*').length, chars: all.length, visibleChars: vis(root), details: root.querySelectorAll('details').length, detailsOpen: root.querySelectorAll('details[open]').length, videoEls: root.querySelectorAll('video').length, videoBoxes: root.querySelectorAll('.p-video').length, hiddenByCss };
});
const OMIT = [/^\d{2}\s*—/, /^\d{2}$/, /^Back to Top$/i];
const missing = leaves.filter(t => !r.all.includes(t) && !OMIT.some(re => re.test(t)));
const out = { sourceTexts: leaves.length, missing, descriptionHeightPx: r.height, nodes: r.nodes, chars: r.chars, visibleChars: r.visibleChars, details: r.details, detailsOpen: r.detailsOpen, videoElements: r.videoEls, videoBoxes: r.videoBoxes, textHiddenByCssButPresentInDom: r.hiddenByCss };
writeFileSync(join(root, 'docs/mobile/premium/data/refined-c-check.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ ...out, textHiddenByCssButPresentInDom: out.textHiddenByCssButPresentInDom.length + ' items' }, null, 1));
await b.close();
