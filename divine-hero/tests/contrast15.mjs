// 1.15.0 readability audit: every visible text node in the open selector / card / Bio screen: colour contrast against the real backdrop and type size.
// usage: node tests/contrast15.mjs <page> [WxH] [--min-contrast 7] [--min-size 15]   (server: python3 tests/serve.py 8765)
import { chromium } from 'playwright';
const args = process.argv.slice(2); const flag = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : Number(args.splice(i, 2)[1]); };
const minC = flag('--min-contrast', 7), minS = flag('--min-size', 15);
const [u, vp = '1180x820'] = args; const [w, h] = vp.split('x').map(Number);
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
await p.goto('http://127.0.0.1:8765/' + u, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(2200);
const probe = () => {
  const parse = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; const a = m[1].split(',').map(Number); return { r: a[0], g: a[1], b: a[2], a: a.length > 3 ? a[3] : 1 }; };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
  const ratio = (a, b2) => { const x = lum(a), y = lum(b2); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const roots = [...document.querySelectorAll('.ddh__sheet:not([hidden]), .ddh__hc')].filter((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 50); const root = roots[0]; if (!root) return null;
  const out = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    const t = n.textContent.trim(); if (!t) continue; const el = n.parentElement; const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue; const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    if (el.closest('.ddh__sr') || el.closest('[aria-hidden=true]') && !el.closest('.ddh__sheet,.ddh__hc')) continue;
    let bg = { r: 228, g: 232, b: 242, a: 1 }, layers = [];
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= .99) break; } }
    for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
    let worst = null; for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const bi = getComputedStyle(e).backgroundImage; if (bi && bi.includes('gradient')) { const st = [...bi.matchAll(/rgba?\([^)]+\)/g)].map((m) => parse(m[0])).filter((c) => c && c.a > .9); if (st.length) { worst = st; break; } } }
    let fg = parse(cs.color); let op = 1; for (let e = el; e && e !== root.parentElement; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity); fg = { ...fg, a: fg.a * op }; fg = over(fg, bg);
    let cc = ratio(fg, bg); if (worst) cc = Math.min(...worst.map((st) => ratio(fg, st))); out.push({ t: t.slice(0, 44), up: cs.textTransform === 'uppercase', size: parseFloat(cs.fontSize), wt: cs.fontWeight, c: +cc.toFixed(2), cls: (el.className && el.className.baseVal === undefined ? el.className : '').toString().split(' ').slice(0, 2).join('.') });
  }
  return out;
};
const run = async (label) => { const r = await p.evaluate(probe); if (!r) { console.log(label, 'nothing open'); return []; } const bad = r.filter((x) => x.c < minC || x.size < (x.up ? minS - 1.5 : minS)); console.log(`${label}: ${r.length} text runs, ${bad.length} below contrast ${minC} or size ${minS}px; lowest contrast ${Math.min(...r.map((x) => x.c))}, smallest ${Math.min(...r.map((x) => x.size))}px`); for (const x of bad.slice(0, 40)) console.log('   ', JSON.stringify(x)); return bad; };
let total = 0;
for (const [name, via] of [['mattress', 'cta'], ['mattress', 'nav'], ['topper', 'cta'], ['topper', 'nav']]) {
  await p.mouse.move(2, h - 2); await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  if (via === 'cta') await p.hover(`.ddh__cta[data-ddh-sheet=${name}]`); else await p.hover(`.ins-tile--header a:has-text("${name === 'mattress' ? 'Mattresses' : 'Toppers'}")`);
  await p.waitForTimeout(700); total += (await run(`${name}/${via} guide`)).length;
  const first = await p.$('.ddh__sheet:not([hidden]) [data-ddh-pv-btn], .ddh__sheet:not([hidden]) .ddh__mc, .ddh__sheet:not([hidden]) .ddh__card[data-ddh-pv-for], .ddh__sheet:not([hidden]) a.ddh__card'); 
  if (first) { await first.hover(); await p.waitForTimeout(600); total += (await run(`${name}/${via} preview`)).length; }
}
for (const pt of ['shoulder', 'zones', 'firmness', 'weight', 'sizes', 'bio']) {
  await p.mouse.move(2, h - 2); await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(2000); const bb = await (await p.$(`.ddh__point[data-ddh-point=${pt}]`)).boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 4 }); await p.waitForTimeout(900); total += (await run('point ' + pt)).length;
}
await b.close(); console.log('TOTAL below threshold:', total); process.exit(total ? 1 : 0);
