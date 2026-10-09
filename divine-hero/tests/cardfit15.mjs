// context-card fit: for every card, per viewport and language: compaction tier, scrollHeight vs clientHeight (anything above 0 is hidden or needs scrolling), gap between band and first content.
// usage: node tests/cardfit15.mjs <page> [--langs en,de..] [WxH ...]
import { chromium } from 'playwright';
const args = process.argv.slice(2); let langs = ['en']; const li = args.indexOf('--langs'); if (li > -1) langs = args.splice(li, 2)[1].split(',');
const [u, ...vps] = args; const list = (vps.length ? vps : ['1080x668', '1180x700', '1280x720', '1366x768', '1440x900']).map((s) => s.split('x').map(Number));
const b = await chromium.launch(); let bad = 0, n = 0;
for (const lang of langs) for (const [w, h] of list) for (const k of ['shoulder', 'zones', 'firmness', 'weight', 'sizes']) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  await p.goto(`http://127.0.0.1:8765/${u}?ddh-lang=${lang}`, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(2300);
  const bb = await (await p.$(`.ddh__point[data-ddh-point=${k}]`)).boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 4 }); await p.waitForTimeout(1900);
  const r = await p.evaluate((k) => { const c = document.querySelector('#ddh-hc-' + k); const cs = getComputedStyle(c); if (cs.display === 'none') return { closed: true }; const hd = c.querySelector('.ddh__hc-hd'); const nx = [...c.querySelector('.ddh__hc-in').children].filter((e) => e !== hd && e.offsetParent && getComputedStyle(e).display !== 'none')[0]; const gap = nx ? Math.round(nx.getBoundingClientRect().top - hd.getBoundingClientRect().bottom) : null; return { tight: c.getAttribute('data-tight'), over: c.scrollHeight - c.clientHeight, ch: c.clientHeight, gap, h: Math.round(c.getBoundingClientRect().height), imgs: [...c.querySelectorAll('img')].map((i) => i.complete && i.naturalWidth > 0) }; }, k);
  n++; const flag = r.closed || r.over > 1 || (r.gap !== null && r.gap < 12) || (r.imgs || []).includes(false);
  if (flag) { bad++; console.log(lang, w + 'x' + h, k, JSON.stringify(r)); }
  await p.context().close();
}
await b.close(); console.log(`cardfit15: ${n} cards, ${bad} with problems`); process.exit(bad ? 1 : 0);
