// READ-ONLY: opens the public live product page in a local browser and compares its description with the supplied source.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'source', 'botanic-original-description.html');
const LIVE = 'https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop';
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const extract = () => {
  const root = document.querySelector('#bp-top') ? (document.querySelector('.dd-botanic-page') || document.querySelector('#bp-top').parentElement) : null;
  if (!root) return null;
  // ALL text nodes, including text inside collapsed <details> and hidden panels (innerText would skip those).
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement && /^(SCRIPT|STYLE)$/.test(n.parentElement.tagName)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const lines = []; let tn;
  while ((tn = walker.nextNode())) { const t = tn.nodeValue.replace(/\s+/g, ' ').trim(); if (t.length > 2) lines.push(t); }
  return {
    html: root.outerHTML.length,
    ids: [...root.querySelectorAll('[id]')].map(e => e.id).sort(),
    counts: { video: root.querySelectorAll('video').length, source: root.querySelectorAll('source').length, img: root.querySelectorAll('img').length, svg: root.querySelectorAll('svg').length, style: root.querySelectorAll('style').length, script: root.querySelectorAll('script').length, iframe: root.querySelectorAll('iframe').length, a: root.querySelectorAll('a').length },
    videoSrc: [...root.querySelectorAll('video')].map(v => (v.currentSrc || v.getAttribute('src') || (v.querySelector('source') || {}).src || '').replace(/^https?:\/\/[^/]+/, '')),
    imgSrc: [...root.querySelectorAll('img')].map(i => (i.getAttribute('src') || '').replace(/^https?:\/\/[^/]+/, '')).slice(0, 60),
    lines,
  };
};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }));
  // source
  const ps = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await ps.setContent('<body>' + fs.readFileSync(SRC, 'utf8') + '</body>');
  const src = await ps.evaluate(extract);
  // live
  const pl = await b.newPage({ viewport: { width: 1440, height: 900 } });
  let live = null, opts = null, err = null;
  try {
    await pl.goto(LIVE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await pl.waitForSelector('#bp-top', { timeout: 45000 });
    await pl.waitForTimeout(2500);
    live = await pl.evaluate(extract);
    opts = await pl.evaluate(() => [...document.querySelectorAll('.details-product-option')].map(o => ({ title: (o.querySelector('.details-product-option__title') || {}).textContent, values: [...o.querySelectorAll('option')].map(x => x.textContent.trim()) })));
  } catch (e) { err = String(e).slice(0, 300); }
  console.log('SOURCE', JSON.stringify({ html: src && src.html, counts: src && src.counts, lines: src && src.lines.length, ids: src && src.ids.length }));
  if (err) { console.log('LIVE ERROR', err); }
  if (live) {
    console.log('LIVE  ', JSON.stringify({ html: live.html, counts: live.counts, lines: live.lines.length, ids: live.ids.length }));
    const s = new Set(src.lines), l = new Set(live.lines);
    const onlyLive = live.lines.filter(x => !s.has(x)), onlySrc = src.lines.filter(x => !l.has(x));
    console.log('IDS only in live:', live.ids.filter(x => !src.ids.includes(x)).slice(0, 40));
    console.log('IDS only in source:', src.ids.filter(x => !live.ids.includes(x)).slice(0, 40));
    console.log('TEXT lines only in LIVE (' + onlyLive.length + '):'); onlyLive.slice(0, 40).forEach(x => console.log('  L>', x.slice(0, 160)));
    console.log('TEXT lines only in SOURCE (' + onlySrc.length + '):'); onlySrc.slice(0, 40).forEach(x => console.log('  S>', x.slice(0, 160)));
    console.log('VIDEO live:', live.videoSrc); console.log('VIDEO src :', src.videoSrc);
    console.log('LIVE OPTIONS:', JSON.stringify(opts));
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
