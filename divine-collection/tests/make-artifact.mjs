// Self-contained review page (one HTML file): the real ddc.css / ddc.js / description markup, with pictures and Chillax embedded
// as data URIs because the review host blocks jsDelivr. For review only; production uses the pinned jsDelivr files.
// usage: node tests/make-artifact.mjs <out.html>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..'), repo = path.join(root, '..');
const outFile = process.argv[2];
const b64 = (f, t) => `data:${t};base64,${fs.readFileSync(f).toString('base64')}`;
const heroAssets = path.join(repo, 'divine-hero/release/1.17.1/assets');
let css = fs.readFileSync(path.join(root, 'release/2.0.0/ddc.css'), 'utf8')
  .replace(/url\(https:\/\/cdn\.jsdelivr\.net\/[^)]*?\/(chillax-\d+\.woff2)\)/g, (m, f) => `url(${b64(path.join(heroAssets, f), 'font/woff2')})`);
const js = fs.readFileSync(path.join(root, 'release/2.0.0/ddc.js'), 'utf8');
const frag = (k) => fs.readFileSync(path.join(root, `preview/fragment-${k}.html`), 'utf8')
  .replace(/src="\.\.\/\.\.\/divine-hero\/release\/1\.17\.1\/assets\/([\w-]+\.webp)"/g, (m, f) => `src="${b64(path.join(heroAssets, f), 'image/webp')}"`)
  .replace(/src="\.\.\/release\/2\.0\.0\/assets\/([\w-]+\.webp)"/g, (m, f) => `src="${b64(path.join(root, 'release/2.0.0/assets', f), 'image/webp')}"`)
  .replace(/<a /g, '<a target="_blank" rel="noopener" ');
const pages = {
  mattress: { title: 'Latex Mattresses Collection', desc: frag('mattress'), n: ['BOTANIC- 100% Organic Latex Mattress -Dunlop Technology', 'BOTANIC DUAL PLUSH 100% Organic Latex Mattress + Organic Latex topper- Dunlop Technology', 'BIO COMFORT 100% Organic Latex Mattress Innovation Cloud Comfort', 'BIO COMFORT DUAL PLUSH 100% Organic Latex Mattress + Organic Latex Topper', 'ORTHOPAEDIC Coconut Coirs + 100% Organic Latex Dunlop Technology', 'AMBIENT- Optimised Value 100% Natural Dunlop latex mattress', 'HOTEL LINE Optimised Value 100% Dunlop latex mattress', 'Dunlop Natural Latex Mattress for PARTNERS'] },
  topper: { title: 'Latex Toppers Collection', desc: frag('topper'), n: ['BIO SUPPORT 100% Organic Latex Topper Dunlop Technology', 'BIO SUPPORT DUAL 100% Organic Latex Topper', 'Latex Topper for Partners - FIRM & MEDIUM 100% Natural Rubber Foam'] },
};
const html = `<title>Divine DunlopDreams Collection Preview</title>
<style>
/* Review frame: a quiet imitation of the Ecwid category page around the real module. Deliberately light only, like the store. */
:root{--pg:#ffffff;--ink:#14223b;--muted:#4a5664;--rule:#dde3e3;--band:#eef2f5;--note:#e9f0f4;color-scheme:light}
body{background:var(--pg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{max-width:1320px;margin:0 auto;padding-inline:16px;padding-block:16px 48px}
.bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding-block:10px;border-bottom:1px solid var(--rule)}
.bar b{font-weight:600}
.tabs{display:flex;gap:6px;flex-wrap:wrap}
.tabs button{min-height:44px;padding:8px 16px;border:0;border-radius:999px;background:var(--band);color:var(--ink);font:600 15px system-ui,sans-serif;cursor:pointer}
.tabs button[aria-pressed=true]{background:#313d4c;color:#fff}
.tabs button:focus-visible{outline:3px solid #2f7da8;outline-offset:2px}
.note{margin-block:14px;padding:12px 14px;border-radius:12px;background:var(--note);color:var(--ink);max-width:90ch}
.note p{margin:0}.note p+p{margin-top:6px}
.crumb{margin-top:18px;color:var(--muted);font-size:14px}
h1.t{margin:6px 0 18px;font:600 clamp(26px,4vw,34px)/1.2 Georgia,"Times New Roman",serif;color:#1d2530;text-wrap:balance}
.sort{display:flex;justify-content:space-between;gap:12px;margin-top:8px;padding-top:12px;border-top:1px solid var(--rule);color:var(--muted);font-size:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;margin-top:14px}
.card{min-width:0;font-size:13.5px;color:#333}
.card i{display:block;aspect-ratio:1;max-width:100%;background:#eef1f3;border-radius:6px;margin-bottom:8px}
${css}
</style>
<div class="wrap">
<div class="bar"><span><b>Divine DunlopDreams Collection 2.0.0</b> · review preview, not live</span><div class="tabs" role="group" aria-label="Category"><button type="button" id="tab-m" data-p="mattress" aria-pressed="true">Latex Mattresses</button><button type="button" id="tab-t" data-p="topper" aria-pressed="false">Latex Toppers</button></div></div>
<div class="note"><p>This is the new one-screen collection map as it would sit in the category Description, above Ecwid's own product grid (the grey cards below stand in for it). On a computer, rest the pointer on a model to open its card, click to go to the model page. On an iPad or phone, tap once for the card, tap again (or View model) to open the model page. "View model" opens the real product page in a new tab.</p><p>Switching category re-renders the description the way Ecwid does, so the interface starts again from its overview.</p></div>
<div id="store"></div>
</div>
<script>${js}</script>
<script>
(function(){
  var P=${JSON.stringify(pages).replace(/<\//g, '<\\/')};
  var store=document.getElementById('store');
  function render(k){
    var p=P[k];
    store.innerHTML='<p class="crumb">Home / Store / '+p.title+'</p><h1 class="t">'+p.title+'</h1>'+p.desc+'<div class="sort"><span>Ecwid product grid (stays below while the new interface is reviewed)</span><span>Sort by: Recommended</span></div><div class="grid">'+p.n.map(function(n){return '<div class="card"><i></i>'+n+'</div>'}).join('')+'</div>';
    document.querySelectorAll('.tabs button').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-p')===k?'true':'false')});
    if(window.DDC) window.DDC.scan();
  }
  document.querySelectorAll('.tabs button').forEach(function(b){b.addEventListener('click',function(){render(b.getAttribute('data-p'))})});
  render('mattress');
})();
</script>
`;
fs.writeFileSync(outFile, html);
console.log(outFile, (html.length / 1024).toFixed(0) + ' KB');
