// T1 regression tool: proves that a CSS refactor changes nothing that can be seen.
// It loads two copies of the preview page, and for every element of the page (the configurator and the description,
// including hidden elements) compares the computed values of ~90 properties, the generated ::before / ::after content,
// and the box (x, y, width, height). It does this in two states (accordions as they are, and all accordions open)
// and at three phone widths. Transitions and animations are switched off in the test page only, so that values are not
// read mid-transition.
//
//   NODE_PATH=$(npm root -g) node tools/t1-snapshot.mjs diff <before.html> <after.html> [--widths 360,390,430]
//   NODE_PATH=$(npm root -g) node tools/t1-snapshot.mjs hash <page.html>        # determinism check (prints per-state hashes)
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);

const PROPS = ['display', 'position', 'top', 'right', 'bottom', 'left', 'z-index', 'float', 'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'box-sizing', 'overflow-x', 'overflow-y',
  'color', '-webkit-text-fill-color', 'background-color', 'background-image', 'background-size', 'background-position',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
  'box-shadow', 'opacity', 'filter', 'transform', 'isolation', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-transform',
  'text-decoration-line', 'text-decoration-color', 'text-align', 'white-space', 'fill', 'stroke', 'stroke-width', 'gap', 'grid-template-columns', 'flex-direction',
  'align-items', 'justify-content', 'visibility', 'cursor', 'outline-color', 'outline-style', 'outline-width', 'text-shadow', 'vertical-align'];
const PSEUDO = ['content', 'display', 'position', 'width', 'height', 'background-color', 'background-image', 'border-top-left-radius', 'box-shadow', 'transform', 'opacity',
  'filter', 'left', 'right', 'top', 'bottom', 'color', 'z-index', 'margin-top', 'margin-bottom'];

// Source of the in-page function. detail=true returns one readable string per element, false returns one hash string.
export const SIG_SRC = `(function(){
  var P=${JSON.stringify(PROPS)}, Q=${JSON.stringify(PSEUDO)};
  function fnv(s,seed){var h=seed>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h;}
  function one(el){
    var cs=getComputedStyle(el),a=[],i,r=el.getBoundingClientRect();
    for(i=0;i<P.length;i++)a.push(cs.getPropertyValue(P[i]));
    a.push(Math.round(r.x*100)/100,Math.round(r.y*100)/100,Math.round(r.width*100)/100,Math.round(r.height*100)/100);
    ['::before','::after'].forEach(function(ps){var c=getComputedStyle(el,ps);if(c.content&&c.content!=='none'&&c.content!=='normal'){a.push(ps);for(var k=0;k<Q.length;k++)a.push(c.getPropertyValue(Q[k]));}});
    return a.join('|');
  }
  window.__els=function(){return [document.documentElement].concat([].slice.call(document.querySelectorAll('*')).filter(function(e){return e.tagName!=='STYLE';}));};   /* style elements paint nothing, and their number differs when stylesheets are merged */
  window.__sig=function(detail){
    var els=window.__els(),out=[];
    for(var i=0;i<els.length;i++){var s=one(els[i]);out.push(detail?s:(fnv(s,2166136261).toString(36)+fnv(s,5381).toString(36)));}
    return out;
  };
  window.__names=function(){return window.__els().map(function(e){return e.tagName.toLowerCase()+(e.className&&e.className.baseVal===undefined?'.'+String(e.className).trim().split(/\\s+/).slice(0,2).join('.'):'');});};
  window.__states=function(detail){
    var det=[].slice.call(document.querySelectorAll('details')),was=det.map(function(d){return d.open;});
    var A=window.__sig(detail);
    det.forEach(function(d){d.open=true;});
    var B=window.__sig(detail);
    det.forEach(function(d,i){d.open=was[i];});
    return {A:A,B:B};
  };
})()`;


// State probe: forces :hover, :focus and :active on every interactive element (through the DevTools protocol, so no mouse is needed)
// and reads the computed values that those states can change. Used by the consolidation (as part of the measurement) and by the hover check.
const HPROPS = new Set(['background-color', 'background-image', 'color', 'border-top-color', 'border-top-width', 'box-shadow', 'opacity', 'transform', 'text-decoration-line',
  'outline-color', 'outline-style', 'outline-width', 'fill', 'stroke', 'filter', 'cursor', '-webkit-text-fill-color']);
export const PROBE = 'a, button, summary, input, [role="button"], .b-hero-bar__item, .p-video, .gx-card, .gx-chip, .gx-btn, .pil';
export async function stateProbe(page, ctx) {
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: PROBE });
  const labels = [];
  for (const nodeId of nodeIds) { const { node } = await cdp.send('DOM.describeNode', { nodeId }); const at = node.attributes || []; const i = at.indexOf('class'); labels.push(node.nodeName.toLowerCase() + (i >= 0 ? '.' + at[i + 1].split(' ').slice(0, 2).join('.') : '')); }
  async function sig() {
    const out = [];
    for (const nodeId of nodeIds) for (const st of ['hover', 'focus', 'active']) {
      await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [st] });
      const { computedStyle } = await cdp.send('CSS.getComputedStyleForNode', { nodeId });
      out.push(computedStyle.filter(p => HPROPS.has(p.name)).map(p => p.name + '=' + p.value).join('|'));
      await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
    }
    return out;
  }
  return { sig, labels, count: nodeIds.length };
}

export async function openPage(browser, file, width) {
  const ctx = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(file).href + '?chrome=0', { waitUntil: 'load' });
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}' });
  await page.waitForTimeout(1200);
  await page.evaluate(SIG_SRC);
  return { page, ctx };
}

async function main() {
  const [mode, a, b, ...rest] = process.argv.slice(2);
  const wi = rest.indexOf('--widths');
  const widths = (wi >= 0 ? rest[wi + 1] : '360,390,430').split(',').map(Number);
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  if (mode === 'hash') {
    for (const w of widths) {
      const { page, ctx } = await openPage(browser, a, w);
      const s = await page.evaluate(() => window.__states(false));
      const h = x => { let v = 0; for (const t of x) for (let i = 0; i < t.length; i++) v = (Math.imul(v, 31) + t.charCodeAt(i)) >>> 0; return v.toString(36); };
      console.log(`width ${w}: elements ${s.A.length}, state A ${h(s.A)}, state B ${h(s.B)}`);
      await ctx.close();
    }
  } else if (mode === 'diff') {
    let total = 0;
    for (const w of widths) {
      const A = await openPage(browser, a, w), B = await openPage(browser, b, w);
      const sa = await A.page.evaluate(() => window.__states(true)), sb = await B.page.evaluate(() => window.__states(true));
      const names = await A.page.evaluate(() => window.__names());
      const ca = await A.page.evaluate(() => window.__els().length), cb = await B.page.evaluate(() => window.__els().length);
      let diffs = 0, shown = 0;
      if (ca !== cb) { console.log(`width ${w}: DOM differs (${ca} vs ${cb} elements)`); diffs++; }
      for (const st of ['A', 'B']) {
        const n = Math.min(sa[st].length, sb[st].length);
        for (let i = 0; i < n; i++) {
          if (sa[st][i] !== sb[st][i]) {
            diffs++;
            if (shown++ < 12) {
              const xa = sa[st][i].split('|'), xb = sb[st][i].split('|'); const bad = [];
              for (let k = 0; k < xa.length; k++) if (xa[k] !== xb[k]) bad.push((PROPS[k] || 'box/pseudo#' + k) + ': ' + xa[k] + ' -> ' + xb[k]);
              console.log(`  state ${st} element ${i} <${names[i]}>: ${bad.slice(0, 4).join(' ; ')}`);
            }
          }
        }
      }
      console.log(`width ${w}: ${sa.A.length} elements x 2 states compared, differing elements: ${diffs}`);
      total += diffs; await A.ctx.close(); await B.ctx.close();
    }
    console.log(total === 0 ? 'RESULT: identical (no computed style, generated content or box differs)' : `RESULT: ${total} difference(s)`);
    process.exitCode = total === 0 ? 0 : 1;
  } else { console.error('mode: diff | hash'); process.exit(2); }
  await browser.close();
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
