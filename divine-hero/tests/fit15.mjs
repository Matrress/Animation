// 1.15.0 fit matrix: both selectors, every guide and every model preview, opened from the hero button and from the site menu, per viewport and language.
// Reports clipped text (ellipsis / hidden overflow), elements sticking out of the panel and scrolling panels.   usage: node tests/fit15.mjs <page> [--langs en,de,...] [WxH ...]
import { chromium } from 'playwright';
const args = process.argv.slice(2); let langs = ['en'];
const li = args.indexOf('--langs'); if (li > -1) langs = args.splice(li, 2)[1].split(',');
const [u, ...vps] = args; const list = (vps.length ? vps : ['1051x700', '1180x820', '1280x720', '1366x768', '1440x900', '1920x1080']).map((s) => s.split('x').map(Number));
const b = await chromium.launch(); let bad = 0, checks = 0;
const probe = () => {
  const s = document.querySelector('.ddh__sheet:not([hidden])'); if (!s) return { err: 'no sheet' };
  const inn = s.querySelector('.ddh__sh-in'), R = inn.getBoundingClientRect(), out = [];
  if (inn.scrollHeight > inn.clientHeight + 1) out.push('panel scrolls ' + inn.scrollHeight + '>' + inn.clientHeight);
  for (const e of inn.querySelectorAll('*')) {
    const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') continue; if (e.closest('[hidden]') || e.closest('.ddh__sr')) continue;
    const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue; const nm = (e.className && e.className.baseVal === undefined ? e.className : e.tagName).toString().split(' ')[0];
    if (r.right > R.right + 1 || r.bottom > R.bottom + 1 || r.left < R.left - 1 || r.top < R.top - 1) { if (!/shadow/.test(nm)) out.push('outside: ' + nm + ' "' + (e.textContent || '').trim().slice(0, 24) + '"'); continue; }
    if (cs.overflowY !== 'visible' && !/img|picture/i.test(e.tagName) && e.scrollHeight > e.clientHeight + 1 && e.clientHeight > 30) out.push('container scrolls/clips: ' + nm + ' ' + e.scrollHeight + '>' + e.clientHeight);
    if (/ddh__pv|ddh__pvs|ddh__g-/.test(nm) === false && !e.closest('.ddh__pv')) { /* children of a preview / guide are checked against it below */ }
    const pvBox = e.closest('.ddh__pv'); if (pvBox && e !== pvBox) { const B = pvBox.getBoundingClientRect(); if (r.top < B.top - 1 || r.bottom > B.bottom + 1) out.push('sticks out of its panel: ' + nm + ' "' + (e.textContent || '').trim().slice(0, 24) + '"'); }
    const txt = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (txt && (cs.overflow !== 'visible' || cs.textOverflow === 'ellipsis') && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)) out.push('clipped: ' + nm + ' "' + e.textContent.trim().slice(0, 28) + '" ' + e.scrollWidth + '/' + e.clientWidth + 'x' + e.scrollHeight + '/' + e.clientHeight);
  }
  return { out };
};
for (const lang of langs) for (const [w, h] of list) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  await p.goto(`http://127.0.0.1:8765/${u}?ddh-lang=${lang}`, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(2200);
  for (const name of ['mattress', 'topper']) for (const via of ['cta', 'nav']) {
    await p.mouse.move(2, h - 2); await p.keyboard.press('Escape'); await p.waitForTimeout(350);
    if (via === 'cta') await p.hover(`.ddh__cta[data-ddh-sheet=${name}]`); else await p.hover(`.ins-tile--header a:has-text("${name === 'mattress' ? 'Mattresses' : 'Toppers'}")`);
    await p.waitForTimeout(650);
    const cards = await p.$$(`.ddh__sheet--${name} .ddh__sel .ddh__mc`);
    for (let i = -1; i < cards.length; i++) {
      if (i >= 0) { await cards[i].hover(); await p.waitForTimeout(260); }
      const r = await p.evaluate(probe); checks++;
      if (r.err) { console.log(lang, w + 'x' + h, name, via, i, r.err); bad++; continue; }
      if (r.out.length) { bad++; console.log(lang, w + 'x' + h, name, via, i < 0 ? 'guide' : 'model#' + i, '\n   ' + [...new Set(r.out)].slice(0, 6).join('\n   ')); }
    }
  }
    // the global size guide and the Dual Plush card
  { await p.mouse.move(2, h - 2); await p.keyboard.press('Escape'); await p.waitForTimeout(350); await p.hover('.ddh__sz'); await p.waitForTimeout(900);
    const r = await p.evaluate(() => { const e = document.querySelector('#ddh-sizes'); if (!e || e.hidden) return 'closed'; return e.scrollHeight > e.clientHeight + 1 ? 'size guide scrolls ' + e.scrollHeight + '>' + e.clientHeight : ''; }); checks++; if (r) { bad++; console.log(lang, w + 'x' + h, 'sizeguide', r); } }
  { await p.mouse.move(2, h - 2); await p.keyboard.press('Escape'); await p.waitForTimeout(350);
    const bb = await (await p.$('.ddh__point[data-ddh-point=system]')).boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 4 }); await p.waitForTimeout(1300);
    const r = await p.evaluate(() => { const c = document.querySelector('#ddh-dpc'); if (!c || getComputedStyle(c).display === 'none') return 'closed'; const i = c.querySelector('.ddh__dpc-in'); const bad = []; if (i.scrollHeight > i.clientHeight + 1) bad.push('dpc clips ' + i.scrollHeight + '>' + i.clientHeight); const R = i.getBoundingClientRect(); for (const e of i.querySelectorAll('li,a,h3,p')) { const q = e.getBoundingClientRect(); if (q.width && (q.bottom > R.bottom + 1 || q.right > R.right + 1)) bad.push('outside ' + (e.className || e.tagName)); } return bad.join('; '); }); checks++; if (r && r !== 'closed') { bad++; console.log(lang, w + 'x' + h, 'dpc', r); } }
  // the Bio Comfort screen, both tabs, opened from its point
  for (const tab of ['bio', 'dp']) {
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(2200); await p.mouse.move(2, h - 2); await p.waitForTimeout(300);
    const bb = await (await p.$('.ddh__point[data-ddh-point=bio]')).boundingBox(); await p.mouse.move(bb.x + 8, bb.y + 8); await p.waitForTimeout(1200);
    if (tab === 'dp') { const t = await p.$('#ddh-bio-tab-dp'); if (t) { await t.click(); await p.waitForTimeout(400); } }
    const r = await p.evaluate(probe); checks++;
    if (r.err) { bad++; console.log(lang, w + 'x' + h, 'bio', tab, r.err); } else if (r.out.length) { bad++; console.log(lang, w + 'x' + h, 'bio', tab, '\n   ' + [...new Set(r.out)].slice(0, 6).join('\n   ')); }
  }
  await p.context().close();
}
await b.close(); console.log(`fit15: ${checks} checks, ${bad} with problems`); process.exit(bad ? 1 : 0);
