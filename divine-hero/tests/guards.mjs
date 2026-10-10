// Static guards: copy parity with v26, CSS scoping, links, no placeholders. usage: node tests/guards.mjs
import fs from 'node:fs';
import { chromium } from 'playwright';
let fail = 0; const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fail++; };
// 1. CSS scoping: every selector must start with .ddh (or be @font-face/@keyframes internals)
for (const f of ['release/1.17.1/hero.css', 'variants/variant-a-tone.css', 'variants/variant-b-large-display.css']) {
  const css = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/@keyframes[^{]+\{([^{}]*\{[^}]*\})*[^}]*\}/g, '').replace(/@font-face\{[^}]*\}/g, '');
  const sels = [...css.matchAll(/([^{}@;]+)\{[^{}]*\}/g)].map((m) => m[1].trim()).filter((s) => s && !/^(from|to|\d+%)/.test(s));
  const split = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && !d) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
  // 1.7.0: the only rules outside .ddh — night mode lightens the transparent site header's text (colour only, only while
  // .ddh is in the night state, so the menu stays readable on the night sky). Anything else unscoped fails.
  const NIGHT_HEADER = /^html:has\(\.ddh\[data-ddh-state=night\]\) \.ins-tile--header (a|button|svg)$/;
  const bad = sels.flatMap(split).map((s) => s.trim()).filter((s) => !s.startsWith('.ddh') && !NIGHT_HEADER.test(s));
  ok(bad.length === 0, `${f}: ${sels.length} rules, all scoped to .ddh` + (bad.length ? ' — unscoped: ' + bad.slice(0, 5).join(' | ') : ''));
  ok(!/STATIC-HOST|example\.com|\.example/i.test(fs.readFileSync(f, 'utf8')), `${f}: no placeholder hosts`);
}
for (const f of fs.readdirSync('ecwid')) ok(!/STATIC-HOST|\.example\b|\{\{/.test(fs.readFileSync('ecwid/' + f, 'utf8')), `ecwid/${f}: no placeholders`);
// 2. copy parity (all text nodes, visible or not) between v26 and 1.0.0
const b = await chromium.launch();
const texts = async (u) => { const p = await b.newPage(); await p.goto('http://127.0.0.1:8765/' + u); const t = await p.$eval('.ddh', (e) => { const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); const out = []; while (w.nextNode()) { const s = w.currentNode.textContent.replace(/\s+/g, ' ').trim(); if (s) out.push(s); } return out; }); await p.close(); return t; };
const a = await texts('reference/harness-v26-h50.html'), c = await texts('preview/harness-polished-h50.html');
const removed = ['Mattresses', 'Toppers', 'Pillows']; // 1.2.0: duplicate menu bar removed at the owner's request (the Ecwid header already has these)
  // 1.4.1: SEO heading (screen-reader/search only) extended at the owner's request; it still contains the v26 line
  const H1_V26 = 'Divine DunlopDreams – Engineering Natural Latex Sleep System', H1_NOW = 'Divine DunlopDreams – 100% Natural Latex Mattresses, Toppers & Pillows. Engineering Natural Latex Sleep System';
  const a2 = a.filter((x) => !removed.includes(x)).map((x) => (x === H1_V26 ? H1_NOW : x));
  // 1.5.0: two new hotspots (sizes & depths; firmness by body weight) added at the owner's request
  a2.push('All UK & EU Sizes', 'Customisable', 'Mattress & Topper', 'Depths', 'Different Depths for', 'Different Levels of Adaptation', 'Firmness', 'Regulated by Body Weight', 'Soft', '·', 'Medium', '·', 'Firm', '·', 'Extra Firm', 'All UK and EU sizes and depths', 'Firmness by body weight');
  // 1.6.0: "conception" removed at the owner's request; "Dual Plush" is live text aligned with the mattress
  { const i = a2.indexOf('European production, certified for UK & EU. Dual Plush conception.'); if (i > -1) a2[i] = 'European production, certified for UK & EU. Dual Plush mattress and topper system.'; }
  a2.push('Dual Plush');
  // 1.7.0: night mode headline + "Latex" in the button labels (1.9.4: always shown)
  for (const t of ['Shop Your Mattress', 'Shop Your Topper']) { const i = a2.indexOf(t); if (i > -1) a2.splice(i, 1); }
  a2.push('Improve', 'the', 'Quality', 'of Your', 'Sleep', 'Night mode: improve the quality of your sleep', 'Shop Your', 'Latex Mattress', 'Shop Your', 'Latex Topper');
  // 1.10.0: the Bio Comfort point (screen-reader label + hover teaser)
  a2.push('Bio Comfort: our innovation, the finest latex mattress we make', 'Bio Comfort', 'Our innovation ·', 'Discover');   // 1.9.4: "Latex" shown always, one bold phrase
  a2.push('All UK & EU Sizes');   // 1.11.1: the global size guide's trigger (shown only with JS)
  // 1.14.0: the lower right point becomes Cover Options (its sizes copy retires; sizes live in the global size guide)
  for (const t of ['All UK & EU Sizes', 'Customisable', 'Mattress & Topper', 'Depths', 'Different Depths for', 'Different Levels of Adaptation', 'All UK and EU sizes and depths']) { const i = a2.indexOf(t); if (i > -1) a2.splice(i, 1); }
  a2.push('Cover Options', 'Four covers ·', 'every one with a zip', 'Cover options: four covers, every one with a zip');
  // 1.15.0: the invitation to explore the points (upper left)
  a2.push('Explore the sleep system', 'Hover over the glowing points', 'Tap the glowing points');
  const A = JSON.stringify(a2.slice().sort()), C = JSON.stringify(c.slice().sort()); // 1.2.0 reorders markup (visible parts first)
  ok(A === C, `copy identical to v26 apart from the removed menu bar, the 1.4.1 SEO heading, the 1.5.0 points, the 1.6.0 Dual Plush line and 1.7.0 night mode (${c.length} text nodes, order-independent)` + (A === C ? "" : "\n" + a2.filter((x) => !c.includes(x)).concat(c.filter((x) => !a2.includes(x))).join(' / ')));
ok(!c.some((s) => /No More Overheating/i.test(s)), '"No More Overheating" absent');
ok(!c.some((s) => /conception/i.test(s)), '"conception" absent (1.6.0)');
// 1.4.3: CTA hover must use any-hover so iPads with a trackpad/mouse darken on hover, not only on press
ok(/@media ?\(any-hover:hover\)\{\.ddh \.ddh__shop \.ddh__cta:hover/.test(fs.readFileSync('release/1.17.1/hero.css', 'utf8')), 'CTA hover gated by any-hover');
for (const s of ['High Support', 'Anatomical Balance', 'Orthopaedic Comfort', 'High Adaptability', 'Balance & Relief', 'Spinal Alignment', 'Original Dunlop Technology', '100% EU-UK Certified', 'Latex (Rubber) Foam', 'Dual Plush System', 'Natural Adaptation', 'Keeps Your Body on the Surface', 'Best Air Ventilation', 'Temperature Comfort']) ok(c.includes(s), 'copy present: ' + s);
const p = await b.newPage(); await p.goto('http://127.0.0.1:8765/preview/harness-polished-h50.html');
const bold = await p.$$eval('[data-ddh-copy=system] b', (bs) => bs.map((x) => x.textContent + ':' + getComputedStyle(x).fontWeight));
ok(bold.join() === 'Support:600,Comfort:600', 'Support / Comfort emphasised: ' + bold);
await b.close();
// 1.11.1: every language's sheets keep the structure of the English ones (a translated value must never leave English leftovers behind)
{ const cnt = (h, re) => (h.match(re) || []).length;
  const en = fs.readFileSync('release/1.17.1/sheets/en.html', 'utf8');
  for (const l of ['de', 'sv', 'fr', 'es', 'pt', 'el', 'fi', 'it']) { const h = fs.readFileSync(`release/1.17.1/sheets/${l}.html`, 'utf8');
    for (const [name, re] of [['firmness words', /ddh__f-[smfx]"/g], ['pair sketches', /ddh__dsk"/g], ['cards', /class="ddh__card[ "]/g], ['layer chips', /ddh__ly ddh__ly--/g]]) ok(cnt(h, re) === cnt(en, re), `sheets/${l}: same ${name} as English (${cnt(h, re)}/${cnt(en, re)})`); } }
// 1.14.0 owner rules for the context cards: Original Dunlop says nothing about layers; the weight ranges are exact (no "approximately"); covers: Cashmere is not a cotton blend
{ const LAYER = /layer|schicht|skikt|couche|camada|στρώσ|kerro[sk]|strat/i, APPROX = /approx|\bca\.|circa|około|περίπου|noin\b|cirka|environ|aprox|ungef|omkring/i;
  for (const l of ['en', 'de', 'sv', 'fr', 'es', 'pt', 'el', 'fi', 'it']) { const h = fs.readFileSync(`release/1.17.1/sheets/${l}.html`, 'utf8');
    const card = (k) => { const i = h.indexOf(`data-ddh-card="${k}"`); return h.slice(i, h.indexOf('</aside>', i)).replace(/<[^>]*>/g, ' '); };
    ok(!LAYER.test(card('zones')) && !(l === 'es' && /\bcapas?\b/i.test(card('zones'))), `${l}: the Original Dunlop card never mentions layers`);
    ok(!APPROX.test(card('weight')), `${l}: the firmness ranges carry no "approximately"`);
    { const i = h.indexOf('data-ddh-card="weight"'), blk = h.slice(i, h.indexOf('</aside>', i)); ok(/ddh__hc-dh/.test(blk) && /ddh__dsk"/.test(blk), `${l}: the firmness card names its Dual Plush combinations`); ok(/ddh__dsk"/.test(blk) && /ddh__fn-col[\s\S]*ddh__fn-col[\s\S]*ddh__fn-col/.test(blk) && (blk.match(/class="ddh__fn-m"/g) || []).length === 10, `${l}: 1.17.0 the firmness navigator has three systems (solo, Dual Plush, Partners) and links its 10 models`); }
    ok(/cv-cashmere/.test(h) && /cv-wool/.test(h) && !/Cotton Cashmere|Kaschmir-Baumwolle/i.test(card('sizes')), `${l}: four real covers, no "cotton cashmere"`); } }
console.log(fail ? `\n${fail} guard(s) failed` : '\nall guards passed'); process.exit(fail ? 1 : 0);
