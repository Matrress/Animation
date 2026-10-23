// screenshots of an Ecwid-imitation page. usage: node tests/simshot.mjs <url-path> <prefix> [WxH@dpr ...]
import { chromium } from 'playwright';
const [,, u, prefix, ...vps] = process.argv;
const list = (vps.length ? vps : ['1366x845@1', '1440x900@1', '1920x1080@1', '1024x1366@1', '390x750@2']).map((s) => { const [wh, d] = s.split('@'); const [w, h] = wh.split('x').map(Number); return [w, h, +d || 1]; });
const b = await chromium.launch();
for (const [w, h, d] of list) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d, hasTouch: w < 1100, isMobile: w < 700 })).newPage();
  await p.goto('http://127.0.0.1:8765/' + u, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700);
  const info = await p.evaluate(() => {
    const q = (s) => document.querySelector(s), R = (e) => e && e.getBoundingClientRect();
    const hero = R(q('.ddh')), hdr = R(q('.ins-tile--header')), lock = R(q('.ddh__sky-lockup')), shop = R(q('.ddh__shop'));
    const pts = [...document.querySelectorAll('.ddh__point')].map((b) => { const r = b.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { k: b.dataset.ddhPoint, x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), hittable: !!(top && (top === b || b.contains(top))) }; });
    const ctas = [...document.querySelectorAll('.ddh__cta')].map((a) => { const r = a.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { y: Math.round(r.top), b: Math.round(r.bottom), hittable: !!(top && (top === a || a.contains(top))) }; });
    return { heroTop: Math.round(hero.top), heroBottom: Math.round(hero.bottom), vh: innerHeight, headerBottom: hdr && Math.round(hdr.bottom), lockTop: lock && Math.round(lock.top), lockBottom: lock && Math.round(lock.bottom), safe: getComputedStyle(q('.ddh')).getPropertyValue('--ddh-safe'), pts, ctas };
  });
  console.log(`${w}x${h}`, JSON.stringify(info));
  await p.screenshot({ path: `/tmp/claude-0/${prefix}-${w}x${h}.jpg`, type: 'jpeg', quality: 70 });
}
await b.close();
