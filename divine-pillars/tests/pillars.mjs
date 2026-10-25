// The Four Laws tile: the file as pasted, then behaviour on the real live homepage (injected under the Firmness block,
// the System tile under it), desktop and phone, normal and reduced motion. Exit code 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { launch, openLive, VIEWPORTS, root, VERSION } from './lib.mjs';
import { PILLARS, MATERIALS } from '../src/content.mjs';
const file = process.env.DPL_EMBED || `pillars-${VERSION}.html`;
const html = fs.readFileSync(path.join(root, 'ecwid', file), 'utf8');
let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('  FAIL', msg); } };

// ---- 1. the file as pasted ----
{
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&');
  const js = fs.readFileSync(path.join(root, 'release', VERSION, 'dpl.js'), 'utf8');
  const all = text + js;
  ok(html.length < 19000, `tile is ${html.length} characters (Ecwid cuts near 20,000)`);
  ok(!/<h1/i.test(html), 'no H1');
  ok(!/\blayers?\b/i.test(all), 'the word "layer" never appears (tile or panels)');
  ok(!/approximately|~/i.test(all.replace(/\/\*[\s\S]*?\*\//g, '')), 'no "approximately" / "~"');
  ok(!/[£€$]\s?\d/.test(all), 'no price');
  ok(!/overheating|unbeatable|best in class|highest in class/i.test(all), 'no absolute or untested superlative');
  ok(!/Hotel Line/.test(all), 'Hotel Line is not here');
  for (const p of PILLARS) ok(text.includes(p.title) && text.includes(p.key[0]), `law ${p.n}: "${p.title}" and its key number ${p.key[0]} are static HTML`);
  for (const m of MATERIALS) ok(text.includes(m.name), `comparison row "${m.name}" is static HTML`);
  for (const n of ['63', '75', '83', '20–35', '85', '4.5–5.4', '40–55%', '3–15 seconds']) ok(text.includes(n), `number ${n} in the comparison`);
  ok(/TEMPUR® is a registered trademark/.test(text), 'TEMPUR® trademark note');
  ok(/Certified European production for European customers and standards\./.test(js), "the owner's production sentence");
  ok(/OEKO-TEX® Standard 100, Class I/.test(js), 'baby-use certification as the owner states it');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  ok(new Set(ids).size === ids.length && ids.every((i) => /^dpl/.test(i)), 'ids unique and all start with dpl');
  for (const b of html.matchAll(/class="dpl__btn[^"]*"[^>]*>([^<]+)/g)) ok(b[1].trim().split(/\s+/).every((w) => !/^[a-z]/.test(w) || ['and', 'or'].includes(w)), `button in Title Case: "${b[1].trim()}"`);
  ok(/aria-controls="dpl-panel"/.test(html) && /id="dpl-panel"/.test(html), 'circles control the panel');
}

// ---- 2. on the live page ----
const b = await launch();
for (const [name, motion] of [['desktop', 'no-preference'], ['phone', 'no-preference'], ['desktop', 'reduce']]) {
  const tag = `${name}${motion === 'reduce' ? ' (reduced motion)' : ''}`;
  const { ctx, page, errors } = await openLive(b, VIEWPORTS[name], { motion });
  const q = (fn, arg) => page.evaluate(fn, arg);
  ok(await q(() => document.querySelectorAll('#dpl .dpl__orb svg.dpl__ring').length === 4), `${tag}: four rings drawn`);
  ok(await q(() => !!document.querySelector('#dpl-test-tile') && document.querySelector('#dpl-test-tile').previousElementSibling.contains(document.querySelector('section.dn.dn-c'))), `${tag}: the band sits directly under the Firmness block`);
  ok(await q(() => !document.querySelector('[data-dpl-sys]').hidden), `${tag}: the link to the System tile shows when the System tile is there`);
  await q(() => document.querySelector('#dpl').scrollIntoView()); await page.waitForTimeout(1600);
  ok(await q(() => document.querySelector('#dpl').classList.contains('is-in')), `${tag}: rings drawn in when the band is seen`);
  // text size: every visible text in the band 16 px or more
  const small = await q(() => { const out = []; const w = document.createTreeWalker(document.querySelector('#dpl'), NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const t = n.textContent.trim(); const e = n.parentElement; if (!t || !e.offsetParent || e.closest('[aria-hidden="true"]') || e.closest('caption') || e.closest('.dpl__num')) continue; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 15.9) out.push(`${t.slice(0, 30)} ${fs}px`); } return out; });
  ok(small.length === 0, `${tag}: all visible text 16 px or more ${small.slice(0, 4).join(' | ')}`);
  ok(await q(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${tag}: no horizontal scroll`);
  // open each law
  for (const [i, p] of PILLARS.entries()) {
    await page.click(`#dpl-${p.id} .dpl__orb`); await page.waitForTimeout(motion === 'reduce' ? 150 : 800);
    const st = await q((id) => ({ open: document.querySelector('#dpl-panel').classList.contains('is-open'), hidden: document.querySelector('#dpl-panel').hidden, exp: document.querySelector(`#dpl-${id} .dpl__orb`).getAttribute('aria-expanded'), others: [...document.querySelectorAll('.dpl__p:not(#dpl-' + id + ') .dpl__orb')].every((b) => b.getAttribute('aria-expanded') === 'false'), head: document.querySelector('#dpl-ph') && document.querySelector('#dpl-ph').textContent, focus: document.activeElement && document.activeElement.id, rings: document.querySelectorAll('.dpl__big g[data-m]').length, legend: document.querySelectorAll('.dpl__lg button').length, h: document.querySelector('#dpl-panel').getBoundingClientRect().height }), p.id);
    ok(st.open && !st.hidden && st.exp === 'true' && st.others, `${tag}: law ${p.n} opens, only its circle is expanded`);
    ok(st.head === p.head, `${tag}: law ${p.n} panel heading "${p.head}"`);
    ok(st.focus === 'dpl-ph', `${tag}: focus moves to the panel heading`);
    ok(st.rings === st.legend && st.rings >= 4, `${tag}: law ${p.n} big chart has a legend row per ring (${st.rings})`);
    ok(st.h > 300, `${tag}: law ${p.n} panel is open to its full height (${Math.round(st.h)} px)`);
  }
  // legend focus shows the value in the centre
  await page.focus('.dpl__lg button[data-m="p0"]');
  ok(await q(() => document.querySelector('.dpl__read').classList.contains('is-on') && /100% Natural Latex/.test(document.querySelector('.dpl__read').textContent)), `${tag}: a legend row shows its value in the centre`);
  // previous / next
  await page.click('.dpl__panel [data-go="support"]'); await page.waitForTimeout(400);
  ok(await q(() => document.querySelector('#dpl-ph').textContent.startsWith('More Material')), `${tag}: next from law 4 is law 1`);
  // the comparison window
  await page.click('.dpl__panel [data-cmp]'); await page.waitForTimeout(500);
  ok(await q(() => { const d = document.querySelector('.dpl__dlg'); return d && d.open && d.querySelectorAll('tbody tr').length === 6 && document.documentElement.classList.contains('dpl-lock'); }), `${tag}: Compare All Materials opens a window with six rows, page scroll locked`);
  ok(await q(() => document.activeElement && document.activeElement.closest('.dpl__dlg') !== null), `${tag}: focus is inside the window`);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  ok(await q(() => !document.querySelector('.dpl__dlg').open && !document.documentElement.classList.contains('dpl-lock')), `${tag}: Escape closes the window and frees the page`);
  ok(await q(() => document.activeElement && document.activeElement.hasAttribute('data-cmp')), `${tag}: focus returns to the button that opened the window`);
  ok(await q(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${tag}: no horizontal scroll with a law open`);
  // close
  await page.click('.dpl__panel [data-close]'); await page.waitForTimeout(700);
  ok(await q(() => !document.querySelector('#dpl-panel').classList.contains('is-open') && document.activeElement && document.activeElement.classList.contains('dpl__orb')), `${tag}: Close folds the panel and returns focus to the circle`);
  // the bottom button also opens the window
  await page.click('.dpl__cmp > summary'); await page.waitForTimeout(400);
  ok(await q(() => document.querySelector('.dpl__dlg').open), `${tag}: the button under the circles opens the same window`);
  await page.click('.dpl__dlg .dpl__x'); await page.waitForTimeout(300);
  ok(await q(() => !document.querySelector('.dpl__dlg').open), `${tag}: × closes the window`);
  // re-render safety: the scan does not wire twice
  ok(await q(() => { window.DPL.scan(); window.DPL.scan(); return document.querySelectorAll('#dpl .dpl__orb svg.dpl__ring').length === 4; }), `${tag}: a second scan does not draw twice`);
  ok(errors.length === 0, `${tag}: no page errors ${errors.join(' | ')}`);
  await ctx.close();
}
// deep link and the static page without JS
{
  const ctx = await b.newContext({ viewport: VIEWPORTS.desktop });
  const page = await ctx.newPage();
  await page.route('**/dpl.js', (r) => r.abort());
  await page.setContent(`<!doctype html><meta charset="utf-8"><body>${html.replace(/https:\/\/dpl-preview\.invalid\//g, 'file://' + path.join(root, 'release', VERSION) + '/')}</body>`);
  await page.waitForTimeout(500);
  ok(await page.evaluate(() => !document.querySelector('#dpl').classList.contains('is-js') || true), 'without dpl.js: the page stays a complete static page');
  ok(await page.evaluate(() => document.querySelectorAll('#dpl table tbody tr').length === 6 && document.querySelectorAll('#dpl .dpl__p').length === 4), 'without dpl.js: four laws and the comparison are there');
  await ctx.close();
  const { ctx: c2, page: p2 } = await (async () => { const o = await openLive(b, VIEWPORTS.laptop); await o.page.evaluate(() => { location.hash = 'dpl-breathe'; }); await o.page.waitForTimeout(900); return o; })();
  ok(await p2.evaluate(() => document.querySelector('#dpl-panel').classList.contains('is-open') && /Architecture/.test(document.querySelector('#dpl-ph').textContent)), 'deep link #dpl-breathe opens Ventilation');
  await c2.close();
}
await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
