// Static guards: copy parity with v26, CSS scoping, links, no placeholders. usage: node tests/guards.mjs
import fs from 'node:fs';
import { chromium } from 'playwright';
let fail = 0; const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) fail++; };
// 1. CSS scoping: every selector must start with .ddh (or be @font-face/@keyframes internals)
for (const f of ['release/1.4.3/hero.css', 'variants/variant-a-tone.css', 'variants/variant-b-large-display.css']) {
  const css = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/@keyframes[^{]+\{([^{}]*\{[^}]*\})*[^}]*\}/g, '').replace(/@font-face\{[^}]*\}/g, '');
  const sels = [...css.matchAll(/([^{}@;]+)\{[^{}]*\}/g)].map((m) => m[1].trim()).filter((s) => s && !/^(from|to|\d+%)/.test(s));
  const split = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && !d) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
  const bad = sels.flatMap(split).map((s) => s.trim()).filter((s) => !s.startsWith('.ddh'));
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
  const A = JSON.stringify(a2.slice().sort()), C = JSON.stringify(c.slice().sort()); // 1.2.0 reorders markup (visible parts first)
  ok(A === C, `copy identical to v26 apart from the removed menu bar and the 1.4.1 SEO heading (${c.length} text nodes, order-independent)` + (A === C ? '' : '\n' + a2.filter((x) => !c.includes(x)).concat(c.filter((x) => !a2.includes(x))).join(' / ')));
ok(!c.some((s) => /No More Overheating/i.test(s)), '"No More Overheating" absent');
// 1.4.3: CTA hover must use any-hover so iPads with a trackpad/mouse darken on hover, not only on press
ok(/@media ?\(any-hover:hover\)\{\.ddh \.ddh__shop \.ddh__cta:hover/.test(fs.readFileSync('release/1.4.3/hero.css', 'utf8')), 'CTA hover gated by any-hover');
for (const s of ['High Support', 'Anatomical Balance', 'Orthopaedic Comfort', 'High Adaptability', 'Balance & Relief', 'Spinal Alignment', 'Original Dunlop Technology', '100% EU-UK Certified', 'Latex (Rubber) Foam', 'Dual Plush System', 'Natural Adaptation', 'Keeps Your Body on the Surface', 'Best Air Ventilation', 'Temperature Comfort']) ok(c.includes(s), 'copy present: ' + s);
const p = await b.newPage(); await p.goto('http://127.0.0.1:8765/preview/harness-polished-h50.html');
const bold = await p.$$eval('[data-ddh-copy=system] b', (bs) => bs.map((x) => x.textContent + ':' + getComputedStyle(x).fontWeight));
ok(bold.join() === 'Support:600,Comfort:600', 'Support / Comfort emphasised: ' + bold);
await b.close();
console.log(fail ? `\n${fail} guard(s) failed` : '\nall guards passed'); process.exit(fail ? 1 : 0);
