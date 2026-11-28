// Preview of the CURRENT buttons of the large-screen television, on the real engine (simulated store page), for the owner to build on.
// For every screen and every device size it takes a picture of the television with each GROUP of buttons outlined in its own colour
// and marked with a letter, and writes the legend (what the group is, how many, what it says, role and orientation today).
//
//   node tools/build-embed.mjs && NODE_PATH=$(npm root -g) node tools/tv-button-map.mjs
// Output: docs/tv-preview/*.png, docs/tv-preview/legend.json (read by docs/TV-BUTTON-MAP.md)
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'docs', 'tv-preview'); mkdirSync(out, { recursive: true });
const page0 = pathToFileURL(join(root, 'dist', 'embed', 'test-page.html')).href;

// kind of button -> what it is today (role and orientation as proposed in docs/FINALISATION-PLAN.md, section 2)
const KINDS = {
  'ddtv__btn': { name: 'Chapter button', role: 'Navigation', orient: 'to a chapter (→)' },
  'ddtv__tab': { name: 'Panel tab', role: 'Navigation inside the chapter', orient: 'sideways' },
  'ddtv__chip': { name: 'Selection chip (Size, Depth, Firmness, Cover)', role: 'Summary and shortcut', orient: 'to the screen where that choice is made (→)' },
  'ddtv__galbtn': { name: 'View Model Gallery', role: 'Media: the product photographs inside the monitor', orient: 'open (↗ in the monitor)' },
  'sc-btn': { name: 'Action on a screen', role: 'Primary or secondary action', orient: 'forward (→)' },
  'sc-play': { name: 'Play the full video', role: 'Media', orient: 'play (▶)' },
  'ddtv__nav': { name: 'Previous / Next', role: 'Navigation', orient: 'back (←) / forward (→)' },
  'ddtv__play': { name: 'Play or pause the presentation', role: 'Media: the automatic tour', orient: 'play (▶) / pause' },
  'sc-seg': { name: 'Firmness choice', role: 'Selection: sets the store\'s own control', orient: 'none (a choice)' },
  'sc-slabcard': { name: 'Depth choice', role: 'Selection: sets the store\'s own control', orient: 'none (a choice)' },
  'sc-size': { name: 'Size choice', role: 'Selection: sets the store\'s own control', orient: 'none (a choice)' },
  'sc-swatch': { name: 'Cover choice', role: 'Selection: sets the store\'s own control', orient: 'none (a choice)' },
  'sc-point__h': { name: 'Point heading (expands)', role: 'Disclosure', orient: 'open (+) / close (×)' },
  'ddtv__switch': { name: 'Optimised Preview / Standard Product View', role: 'View switch', orient: 'to the store\'s own page and back' }
};
const COLOURS = ['#E8590C', '#1971C2', '#2F9E44', '#9C36B5', '#C2255C', '#0C8599', '#F08C00', '#5F3DC4', '#087F5B', '#A61E4D', '#364FC7', '#B35C00', '#495057', '#D9480F'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const PROFILES = [
  { id: 'ipad-pro-portrait', label: 'iPad Pro 12.9 (3rd gen), portrait, 1024 x 1366, touch', vp: { width: 1024, height: 1366 }, touch: true },
  { id: 'ipad-pro-landscape', label: 'iPad Pro 12.9 (3rd gen), landscape, 1366 x 1024, touch', vp: { width: 1366, height: 1024 }, touch: true },
  { id: 'desktop', label: 'Desktop monitor, 1440 x 900, mouse', vp: { width: 1440, height: 900 }, touch: false }
];
const STATES = [
  ['discover', 'intro', 'Opening: the introduction'], ['height', 'sizes', 'Choose size'], ['firmness', 'choose', 'Choose firmness'],
  ['height', 'heights', 'Choose depth'], ['covers', 'choose', 'Choose cover'], ['ventilation', 'airflow', 'A "points" screen (ventilation)'],
  ['firmness', 'principle', 'A reading screen (firmness principle)'], ['delivery', 'yours', 'Closing: your Botanic']
];
const browser = await chromium.launch(); const legend = { generated: new Date().toISOString().slice(0, 10), note: 'simulated store page, the real engine; not a live store', shots: [] };
for (const p of PROFILES) {
  const ctx = await browser.newContext({ viewport: p.vp, screen: p.vp, hasTouch: p.touch, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => sessionStorage.setItem('ddtv:botanic:splash', '1')); await ctx.route(/^https?:\/\//, (r) => r.abort());
  const page = await ctx.newPage(); await page.goto(page0);
  await page.waitForFunction(() => window.DDTV && DDTV.current, null, { timeout: 8000 }); await page.waitForTimeout(700);
  for (const [c, pn, title] of STATES) {
    await page.evaluate(([c, pn]) => DDTV.current.go(c, pn), [c, pn]); await page.waitForTimeout(700);
    const info = await page.evaluate(({ KINDS, COLOURS, LETTERS }) => {
      document.querySelectorAll('.__map').forEach((e) => e.remove());
      const host = DDTV.current.host, hb = host.getBoundingClientRect(), sx = scrollX, sy = scrollY;
      const els = [...DDTV.current.shadow.querySelectorAll('button, a[href], [role=button], summary')].map((e) => {
        const q = e.getBoundingClientRect(); if (q.width < 6 || q.height < 6) return null;
        const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return null;
        const cls = String(e.className).split(/\s+/); const kind = cls.find((k) => KINDS[k]) || (e.classList.contains('ddtv__switch') || /Optimised|Standard/i.test(e.textContent) ? 'ddtv__switch' : null);
        const label = (e.getAttribute('aria-label') || e.innerText || e.title || '').replace(/\s+/g, ' ').trim().slice(0, 40);
        return { kind: kind || 'other:' + (cls[0] || e.tagName.toLowerCase()), label, x: q.left + sx, y: q.top + sy, w: q.width, h: q.height };
      }).filter(Boolean);
      const groups = {}; els.forEach((e) => { (groups[e.kind] = groups[e.kind] || []).push(e); });
      // one letter and one colour per KIND of button, the same on every screen (the order of the table of kinds)
      const kindOrder = Object.keys(KINDS), idx = (k) => { const i = kindOrder.indexOf(k); return i >= 0 ? i : kindOrder.length + Object.keys(groups).indexOf(k); };
      const order = Object.keys(groups).sort((a, b) => idx(a) - idx(b));
      const result = order.map((k) => ({ letter: LETTERS[idx(k)], kind: k, colour: COLOURS[idx(k) % COLOURS.length], count: groups[k].length, labels: groups[k].slice(0, 6).map((e) => e.label).filter(Boolean) }));
      order.forEach((k) => groups[k].forEach((e, j) => { const i = idx(k);
        const d = document.createElement('div'); d.className = '__map';
        d.style.cssText = `position:absolute;left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px;border:2px solid ${COLOURS[i % COLOURS.length]};box-sizing:border-box;border-radius:6px;pointer-events:none;z-index:2147483000`;
        if (j === 0 || groups[k].length < 5) { const b = document.createElement('span'); b.textContent = LETTERS[i]; b.style.cssText = `position:absolute;left:-2px;top:-2px;min-width:18px;height:18px;line-height:18px;text-align:center;background:${COLOURS[i % COLOURS.length]};color:#fff;font:700 12px/18px system-ui,sans-serif;border-radius:5px 0 5px 0`; d.appendChild(b); }
        document.body.appendChild(d);
      }));
      return { clip: { x: Math.max(0, hb.left + sx - 4), y: Math.max(0, hb.top + sy - 4), width: Math.min(hb.width + 8, document.documentElement.scrollWidth), height: hb.height + 8 }, groups: result };
    }, { KINDS, COLOURS, LETTERS });
    const file = `${p.id}-${c}-${pn}.png`;
    await page.screenshot({ path: join(out, file), clip: info.clip, fullPage: true });
    legend.shots.push({ profile: p.id, profileLabel: p.label, chapter: c, panel: pn, title, file, groups: info.groups.map((g) => ({ ...g, ...(KINDS[g.kind] || { name: g.kind, role: 'not yet classified', orient: '' }) })) });
    console.log(p.id + ' ' + c + '/' + pn + ': ' + info.groups.map((g) => g.letter + '=' + g.kind + '×' + g.count).join(' '));
  }
  await ctx.close();
}
writeFileSync(join(out, 'legend.json'), JSON.stringify(legend, null, 1));
await browser.close();
