/* The unified site loader, on the Ecwid imitation: Collection + selector + Experience (Baby & Junior and Botanic TV), with the network served locally.
   node experience/tests/loader-test.js */
const { chromium, devices } = require('playwright'); const path = require('path'); const fs = require('fs'); const cp = require('child_process');
const root = path.resolve(__dirname, '../..'), harness = path.resolve(__dirname, '../harness');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const sha = cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root }).toString().trim();
const build = live => cp.execFileSync('python3', [root + '/loader/build_loader.py', sha, live], { cwd: root }).toString();
const dist = fs.readdirSync(path.join(root, 'experience/dist'));
const tvName = dist.find(f => /^baby-tv-/.test(f)), phName = dist.find(f => /^baby-phone-/.test(f));
const loaderCode = live => { build(live); return fs.readFileSync(path.join(root, 'loader/divine-site-loader.js'), 'utf8'); };

/* the page: the harness page without its own bundle, with the loader instead (the way the site-wide code runs) */
function page(code, productId, pointer) {
  let h = fs.readFileSync(path.join(harness, 'tv.html'), 'utf8');
  h = h.replace('<script src="baby-tv.local.js"></script>', '');
  h = h.replace(/<script>window\.__DDTVX_CONFIG[^<]*<\/script>/, '');
  h = h.replace('<div class="ecwid-productBrowser-ProductPage-876311857"', '<div class="ecwid-productBrowser-ProductPage-' + productId + '"');
  h = h.replace(/<div id="ddtv-pointer"[^>]*><\/div>/, pointer);
  h = h.replace('productId:876311857', 'productId:' + productId);
  return h.replace('</body>', '<script>' + code.replace(/<\/script>/g, '<\\/script>') + '</script></body>');
}
const babyPointer = ch => `<div id="ddtv-pointer" hidden aria-label="p" data-ddtv-v="1" data-ddtv-model="baby" data-ddtv-channel="${ch}" data-ddtv-product="876311857" data-ddtv-tv="${tvName}" data-ddtv-phone="${phName}"></div>`;
const botanicPointer = `<div id="ddtv-pointer" hidden aria-label="p" data-ddtv-v="1" data-ddtv-model="botanic" data-ddtv-channel="live" data-ddtv-product="876405767" data-ddtv-tv="botanic-tv-0123456789abcdef0123.js" data-ddtv-phone="botanic-phone-0123456789abcdef0123.js"></div>`;

async function run(b, o, code, html) {
  const ctx = await b.newContext(o); const p = await ctx.newPage(); const hits = []; const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/*', r => {
    const u = r.request().url();
    if (/^file:/.test(u) || /^data:/.test(u)) { return r.continue(); }
    hits.push(u);
    if (/jsdelivr\.net\/gh\/Matrress\/Animation@[0-9a-f]{40}\/divine-baby-junior\/experience\/dist\/baby-tv-/.test(u)) { return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(harness, 'baby-tv.local.js')) }); }
    if (/jsdelivr\.net\/gh\/Matrress\/Animation@[0-9a-f]{40}\/divine-baby-junior\/experience\/dist\/baby-phone-/.test(u)) { return r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(harness, 'baby-phone.local.js')) }); }
    if (/media\.divinedunlop\.com\/ddtv\/botanic-/.test(u)) { return r.fulfill({ contentType: 'application/javascript', body: 'window.__botanicLoaded=(window.__botanicLoaded||0)+1;' }); }
    if (/\/dbs\.js$/.test(u)) { return r.fulfill({ contentType: 'application/javascript', body: 'window.__dbsRan=1;' }); }
    if (/ddc\.js$/.test(u)) { return r.fulfill({ contentType: 'application/javascript', body: 'window.DDC=1;' }); }
    if (/ddc\.css$/.test(u)) { return r.fulfill({ contentType: 'text/css', body: '' }); }
    return r.abort();
  });
  const f = path.join(harness, 'loader-test.html'); fs.writeFileSync(f, html);
  return { ctx, p, hits, errs, go: q => p.goto('file://' + f + (q || '')) };
}
(async () => {
  const b = await chromium.launch();
  /* length and content */
  const code = loaderCode('876405767');
  ok(code.replace(/\n$/, '').length <= 4000, 'the unified loader is ' + code.replace(/\n$/, '').length + ' characters (limit 4000)');
  ok(/08088112777cbf09aa9bf7dad1386cb474bd5eae\/divine-collection\/release\/3\.13\.2-configB\//.test(code) && /release\/1\.6\.0\/dbs\.js/.test(code) && /media\.divinedunlop\.com\/ddtv\//.test(code), 'it names the Divine Collection files, the selector and the Experience folder');
  ok(!/eval\(|document\.wri|innerHTML/.test(code), 'no eval, document write or innerHTML in the loader');

  /* 1. Baby & Junior, test channel: nothing without the opt-in, mounted with ?ddtv=test */
  let t = await run(b, { viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }, code, page(code, 876311857, babyPointer('test')));
  await t.go(); await t.p.waitForTimeout(2500);
  ok(await t.p.evaluate(() => !document.getElementById('ddtv-experience')), 'Baby & Junior: not shown to visitors while it is on the test channel (no opt-in)');
  ok(await t.p.evaluate(() => !!window.DDC && window.__dbsRan === 1 && document.documentElement.classList.contains('ddc-js')), 'Collection and selector load on the page as before');
  ok(!t.hits.some(u => /experience\/dist\/baby-|ddtv\/baby-/.test(u)), 'the Baby & Junior files were not even requested');
  await t.ctx.close();
  t = await run(b, { viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }, code, page(code, 876311857, babyPointer('test')));
  await t.go('?ddtv=test'); await t.p.waitForSelector('#ddtv-experience', { timeout: 15000 }); await t.p.waitForTimeout(1200);
  ok(await t.p.evaluate(() => document.documentElement.classList.contains('ddtv-on') && !!document.getElementById('ddtv-experience').shadowRoot), 'Baby & Junior: ?ddtv=test mounts the television through the unified loader');
  ok(t.hits.some(u => /^https:\/\/cdn\.jsdelivr\.net\/gh\/Matrress\/Animation@[0-9a-f]{40}\/divine-baby-junior\/experience\/dist\//.test(u) && u.indexOf(tvName) > -1) && !t.hits.some(u => u.indexOf(phName) > -1) && !t.hits.some(u => /media\.divinedunlop\.com\/ddtv\/baby/.test(u)), 'only the television file was requested, from the repository through jsDelivr: nothing is uploaded to the media folder');
  ok(t.errs.length === 0, 'no page errors ' + t.errs.join('|'));
  await t.ctx.close();
  /* the same session, off */
  t = await run(b, { viewport: { width: 1440, height: 1000 } }, code, page(code, 876311857, babyPointer('test')));
  await t.go('?ddtv=test'); await t.p.waitForSelector('#ddtv-experience', { timeout: 15000 }); await t.p.evaluate(() => window.sessionStorage.setItem('ddtvTest', '1'));
  await t.p.goto('file://' + path.join(harness, 'loader-test.html') + '?ddtv=off'); await t.p.waitForTimeout(2000);
  ok(await t.p.evaluate(() => !document.getElementById('ddtv-experience') && window.__dbsRan === 1), '?ddtv=off: no television, the selector still loads');
  await t.ctx.close();
  /* the phone gets its own file */
  t = await run(b, { ...devices['iPhone 13'], reducedMotion: 'reduce' }, code, page(code, 876311857, babyPointer('test')));
  await t.go('?ddtv=test'); await t.p.waitForSelector('#ddp-cta', { timeout: 15000 });
  ok(!t.hits.some(u => u.indexOf(tvName) > -1) && t.hits.some(u => u.indexOf(phName) > -1), 'phone: the phone file is loaded, not the television');
  await t.ctx.close();
  /* 2. public launch: the id in LIVE, no opt-in, channel test or live */
  const codeLive = loaderCode('876405767,876311857');
  ok(codeLive.replace(/\n$/, '').length + 15 <= 4000, 'with the Baby & Junior id in LIVE the loader, with its script tags, is ' + (codeLive.replace(/\n$/, '').length + 15) + ' characters');
  t = await run(b, { viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }, codeLive, page(codeLive, 876311857, babyPointer('live')));
  await t.go(); await t.p.waitForSelector('#ddtv-experience', { timeout: 15000 });
  ok(await t.p.evaluate(() => document.documentElement.classList.contains('ddtv-on')), 'launch: Baby & Junior in LIVE shows the television to everyone');
  await t.ctx.close();
  /* 3. a bad pointer is refused and the page is given back whole */
  const bad = babyPointer('live').replace(tvName, 'x.js');
  t = await run(b, { viewport: { width: 1440, height: 1000 } }, codeLive, page(codeLive, 876311857, bad));
  await t.go(); await t.p.waitForTimeout(3000);
  ok(await t.p.evaluate(() => !document.getElementById('ddtv-experience') && document.documentElement.classList.contains('ddtv-go')) && !t.hits.some(u => /ddtv\/x\.js/.test(u)), 'a file name outside the rule is never loaded, and the shop page is given back');
  await t.ctx.close();
  /* 4. Botanic TV keeps working: its id is in LIVE, its pointer is on its page */
  t = await run(b, { viewport: { width: 1440, height: 1000 } }, code, page(code, 876405767, botanicPointer));
  await t.go(); await t.p.waitForTimeout(2500);
  ok(await t.p.evaluate(() => window.__botanicLoaded === 1) && t.hits.filter(u => /botanic-tv-0123456789abcdef0123\.js$/.test(u)).length === 1, 'Botanic TV: its page loads its television file through the unified loader (LIVE, no opt-in)');
  ok(await t.p.evaluate(() => !!document.getElementById('ddtv-early')), 'Botanic TV: the early style sheet that keeps its place is armed');
  await t.ctx.close();
  /* 5. a double load does nothing twice */
  t = await run(b, { viewport: { width: 1440, height: 1000 } }, code, page(code, 876405767, botanicPointer).replace('</body>', '<script>' + code + '</script></body>'));
  await t.go(); await t.p.waitForTimeout(1500);
  ok(t.hits.filter(u => /ddc\.js$/.test(u)).length === 1 && t.hits.filter(u => /dbs\.js$/.test(u)).length === 1 && await t.p.evaluate(() => document.querySelectorAll('#ddtv-early').length === 1), 'loaded twice: each file is requested once, one style sheet');
  await t.ctx.close();
  fs.unlinkSync(path.join(harness, 'loader-test.html'));
  build('876405767');                       /* leave the shipped file with the controlled-test setting */
  console.log(fails ? 'FAILURES: ' + fails : 'ALL PASSED'); await b.close(); process.exit(fails ? 1 : 0);
})();
