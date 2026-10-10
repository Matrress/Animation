// Ecwid Instant Site category-page imitation for testing the .ddc descriptions in context.
// - storefront CSS with the id-prefixed selectors Ecwid uses (html#ecwid_html body#ecwid_body …) styling description p/ul/li/a/h2/h3/img/button,
//   inflated line-height, a different site font
// - breadcrumbs, H1, the description, sort control and the native product grid (with the £0 / £0.90 prices seen live)
// - client-side routing: the store re-renders the description with innerHTML on every page change (so inline scripts never run),
//   a fake Ecwid.OnPageLoaded fires after each render, Back/Forward re-render through popstate
// Query: ?w=<px> description width cap · ?mode=js (default: loader = CSS + JS) | css (stylesheet only) | none (raw HTML) · ?page=mattress|topper|product
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const frag = (k) => fs.readFileSync(path.join(root, `preview/fragment-${k}.html`), 'utf8');
const grid = {
  mattress: [['PREMIUM', 'BOTANIC- 100% Organic Latex Mattress -Dunlop Technology', '£0'], ['PREMIUM', 'BOTANIC DUAL PLUSH 100% Organic Latex Mattress + Organic Latex topper- Dunlop Technology', '£0'], ['EXCLUSIVE', 'BIO COMFORT 100% Organic Latex Mattress Innovation Cloud Comfort', '£0'], ['INNOVATION', 'BIO COMFORT DUAL PLUSH 100% Organic Latex Mattress + Organic Latex Topper- Premium Latest Design- Cloud Comfort', '£0'], ['Orthopaedic', 'ORTHOPAEDIC Coconut Coirs + 100% Organic Latex Dunlop Technology', '£0'], ['Best Price', 'AMBIENT- Optimised Value 100% Natural Dunlop latex mattress', '£0'], ['Best Price', 'HOTEL LINE Optimised Value 100% Dunlop latex mattress', '£0.90'], ['', 'Dunlop Natural Latex Mattress for PARTNERS (product name as published)', '£0']],
  topper: [['', 'BIO SUPPORT 100% Organic Latex Topper Dunlop Technology', '£0'], ['', 'BIO SUPPORT DUAL 100% Organic Latex Topper', '£0'], ['', 'Latex Topper for Partners - FIRM & MEDIUM 100% Natural Rubber Foam', '£0']],
};
const pages = {
  mattress: { title: 'Latex Mattresses Collection', desc: frag('mattress'), grid: grid.mattress, cat: 101 },
  topper: { title: 'Latex Toppers Collection', desc: frag('topper'), grid: grid.topper, cat: 102 },
  probe: { title: 'DDC Test (probe)', desc: fs.readFileSync(path.join(root, 'ecwid/probe-1.0.0.html'), 'utf8'), grid: [], cat: 199 },
};
const html = `<!DOCTYPE html><html lang="en" id="ecwid_html"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ecwid category imitation · Divine DunlopDreams Collection</title>
<style>
body{margin:0;font-family:Georgia,"Times New Roman",serif;color:#333;background:#fff}
.ins-tile--announcement{height:44px;display:flex;align-items:center;justify-content:center;background:#b9d0de;font:15px system-ui;color:#234}
.ins-tile--header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 4%;border-bottom:1px solid #e3e7ea;position:sticky;top:0;background:#fff;z-index:50}
.ins-tile--header nav{display:flex;gap:22px;flex-wrap:wrap;font:15px system-ui}
.ins-tile--header nav a{color:#234;text-decoration:none}
.logo{width:46px;height:46px;border-radius:50%;background:radial-gradient(circle at 40% 45%,#2b6f86,#123 70%)}
.ins-tile p,.ins-tile span{line-height:1.9}
.ec-size{max-width:1440px;margin:0 auto;padding:24px 4% 60px}
html#ecwid_html body#ecwid_body .ec-size .ec-store{font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#333}
html#ecwid_html body#ecwid_body .ec-size .ec-store .ec-breadcrumbs{font:14px system-ui;color:#777;margin-bottom:10px}
html#ecwid_html body#ecwid_body .ec-size .ec-store .ec-breadcrumbs a{color:#777}
html#ecwid_html body#ecwid_body .ec-size .ec-store h1.page-title{font:600 34px/1.2 Georgia,serif;margin:0 0 18px}
html#ecwid_html body#ecwid_body .ec-size .ec-store .grid__description{max-width:var(--descw,none);margin:0 auto 28px;font-size:17px;line-height:1.9;color:#555;text-align:center}
html#ecwid_html body#ecwid_body .ec-size .ec-store .grid__description p{margin:0 0 1.3em;line-height:1.9;font-size:17px}
html#ecwid_html body#ecwid_body .ec-size .ec-store .grid__description ul,html#ecwid_html body#ecwid_body .ec-size .ec-store .grid__description ol{margin:1em 0;padding-left:2.2em;list-style:disc}
html#ecwid_html body#ecwid_body .ec-size .ec-store .grid__description li{margin:0 0 .6em;line-height:1.9}
html#ecwid_html body#ecwid_body .ec-size .ec-store .grid__description a{color:#1a73e8;text-decoration:underline;font-weight:700}
html#ecwid_html body#ecwid_body .ec-size .ec-store .grid__description h2,html#ecwid_html body#ecwid_body .ec-size .ec-store .grid__description h3{font:700 26px/1.3 Georgia,serif;margin:1.2em 0 .6em;color:#000;text-transform:uppercase}
html#ecwid_html body#ecwid_body .ec-size .ec-store .grid__description img{margin:12px auto;border:4px solid #eee;max-width:100%}
html#ecwid_html body#ecwid_body .ec-size .ec-store .grid__description span{line-height:2}
html#ecwid_html body#ecwid_body .ec-size .ec-store button{background:#000;color:#fff;border:1px solid #000;padding:12px 24px;text-transform:uppercase;letter-spacing:.12em;font-size:12px;border-radius:3px;width:100%}
html#ecwid_html body#ecwid_body .ec-size .ec-store .ec-sort{display:flex;justify-content:flex-end;font:14px system-ui;margin:0 0 16px;padding-top:10px;border-top:1px solid #eee}
html#ecwid_html body#ecwid_body .ec-size .ec-store .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:28px}
html#ecwid_html body#ecwid_body .ec-size .ec-store .grid-product{font:14px system-ui;color:#333}
html#ecwid_html body#ecwid_body .ec-size .ec-store .grid-product__img{aspect-ratio:1;background:#eef1f3;margin-bottom:10px}
html#ecwid_html body#ecwid_body .ec-size .ec-store .grid-product__label{font-size:11px;letter-spacing:.1em;color:#2b6f86}
html#ecwid_html body#ecwid_body .ec-size .ec-store .grid-product__price{font-weight:700;margin-top:6px}
.pp{padding:40px 0;font:16px system-ui}
</style></head><body id="ecwid_body">
<div class="ins-tile ins-tile--announcement">Free delivery · 20-day made-to-order production</div>
<header class="ins-tile ins-tile--header"><span class="logo"></span><nav><a href="?page=mattress" data-route="mattress">Mattresses</a><a href="?page=topper" data-route="topper">Toppers</a><a href="?page=product" data-route="product">A product page</a></nav><span style="font:14px system-ui">Email Us</span></header>
<div class="ec-size"><div class="ec-store" id="store"></div></div>
<script>
// tiny Ecwid stand-in: OnPageLoaded + re-rendering with innerHTML on every route change
(function(){
  var P=${JSON.stringify(pages).replace(/<\//g, "<\\/")};
  var q=new URLSearchParams(location.search), mode=q.get('mode')||'js', w=q.get('w');
  if(w) document.documentElement.style.setProperty('--descw', w+'px');
  var cbs=[]; window.Ecwid={OnPageLoaded:{add:function(f){cbs.push(f)}},_renders:0};
  if(mode==='js'||mode==='css'){var l=document.createElement('link');l.rel='stylesheet';l.href='../release/1.0.0/ddc.css';document.head.appendChild(l);}
  if(mode==='js'){var s=document.createElement('script');s.src='../release/1.0.0/ddc.js';s.defer=true;document.head.appendChild(s);}
  function render(page){
    var st=document.getElementById('store'), p=P[page];
    if(!p){st.innerHTML='<div class="pp"><p class="ec-breadcrumbs"><a href="?page=mattress" data-route="mattress">Latex Mattresses Collection</a> / Product</p><h1 class="page-title">Product page</h1><p>Configuration and purchase happen here. Use the browser Back button.</p></div>';}
    else st.innerHTML='<div class="ec-breadcrumbs"><a href="#">Home</a> / <a href="#">Store</a> / '+p.title+'</div><h1 class="page-title">'+p.title+'</h1><div class="grid__description"><div class="grid__description-inner">'+p.desc+'</div></div><div class="ec-sort">Sort by: Recommended ▾</div><div class="grid">'+p.grid.map(function(g){return '<div class="grid-product"><div class="grid-product__img"></div><div class="grid-product__label">'+g[0]+'</div><div class="grid-product__title">'+g[1]+'</div><div class="grid-product__price">'+g[2]+'</div></div>'}).join('')+'</div>';
    window.Ecwid._renders++;
    setTimeout(function(){cbs.forEach(function(f){f({type:p?'CATEGORY':'PRODUCT',categoryId:p?p.cat:0})})},30);
  }
  function go(page,push){ if(push) history.pushState({page:page},'','?'+new URLSearchParams(Object.assign(Object.fromEntries(q),{page:page})).toString()); render(page); }
  document.addEventListener('click',function(e){
    var a=e.target.closest('a'); if(!a) return;
    var r=a.getAttribute('data-route');
    if(!r && /divinedunlop\\.com\\/products\\//.test(a.href)){ r='product'; }
    if(r){ e.preventDefault(); go(r,true); window.scrollTo(0,0); }
  });
  addEventListener('popstate',function(e){ render((e.state&&e.state.page)||q.get('page')||'mattress'); });
  history.replaceState({page:q.get('page')||'mattress'},'');
  render(q.get('page')||'mattress');
})();
</script>
</body></html>`;
fs.writeFileSync(path.join(root, 'preview/sim.html'), html);
console.log('preview/sim.html', html.length);
