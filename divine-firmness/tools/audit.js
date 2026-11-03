const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
const R='/home/user/animation/divine-firmness/release/1.0.0-inline/', AS='/home/user/animation/divine-firmness/assets/';
const html='<!doctype html><html lang="en"><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"></head><body style="margin:0">'+fs.readdirSync(R).filter(f=>/^\d\d_.*\.html$/.test(f)).sort().map(f=>'<div class="tile">'+fs.readFileSync(R+f,'utf8')+'</div>').join('\n')+'</body></html>';
fs.writeFileSync('/tmp/_aud.html',html);
const MAC='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const VPS=[[1366,945],[1194,760],[834,1110],[390,844]];
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); let problems=0; const say=(m)=>console.log(m);
for(const [w,h] of VPS){
 const c=await b.newContext({viewport:{width:w,height:h},userAgent:MAC,hasTouch:w<900});const p=await c.newPage();
 const errs=[],fails=[],cons=[];
 p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(['error','warning'].includes(m.type()))cons.push(m.type()+': '+m.text().slice(0,140))});
 p.on('requestfailed',r=>fails.push(r.url().slice(0,100)));
 await p.route('https://cdn.jsdelivr.net/**',r=>{const f=AS+path.basename(new URL(r.request().url()).pathname); fs.existsSync(f)?r.fulfill({path:f}):r.fulfill({status:404,body:''})});
 await p.route('https://d2gt4h1eeousrn.cloudfront.net/**',r=>r.fulfill({status:200,contentType:'image/webp',body:Buffer.alloc(10)}));
 await p.goto('file:///tmp/_aud.html'); await p.waitForTimeout(1500);
 const set=async(id,v)=>p.evaluate(([id,v])=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))},[id,v]);
 const res={};
 res.overflow=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 // level sweep: border colours must follow the level
 res.levels=[];
 for(const kg of [45,60,90,125]){ await set('dn-kg',kg); await set('dn-cm',172); await p.waitForTimeout(500);
   res.levels.push(await p.evaluate(()=>{const s=document.getElementById('dn-plates').textContent.replace(/\s+/g,' ').trim().slice(0,40);return [s,getComputedStyle(document.querySelector('#dn .dn-row .dn-card')).borderTopColor,getComputedStyle(document.getElementById('ddv')).borderTopColor]})); }
 // two persons
 await p.evaluate(()=>{const r=document.querySelector('input[name=dn-ppl][value=two]');r.click()}); await p.waitForTimeout(600);
 await p.evaluate(()=>document.getElementById('dn-tab-pt').click()); await p.waitForTimeout(300);
 await set('dn-kg',58); await set('dn-cm',165); await p.waitForTimeout(700);
 res.two=await p.evaluate(()=>({pp:document.getElementById('ddv').getAttribute('data-pp'),plates:document.getElementById('dn-plates').textContent.replace(/\s+/g,' ').trim().slice(0,70),fig:getComputedStyle(document.getElementById('ddv-fig')).display}));
 await p.evaluate(()=>document.querySelector('input[name=dn-ppl][value=one]').click()); await p.waitForTimeout(700);
 res.back=await p.evaluate(()=>({pp:document.getElementById('ddv').getAttribute('data-pp'),fig:getComputedStyle(document.getElementById('ddv-fig')).display,hsl:getComputedStyle(document.getElementById('ddv-hsl')).display}));
 // topper
 await p.evaluate(()=>document.querySelector('input[name=dn-product][value=topper]').click()); await p.waitForTimeout(600);
 res.topper=await p.evaluate(()=>[...document.querySelectorAll('#dn-ra a')].map(a=>a.getAttribute('href').replace('https://divinedunlop.com/products/','')));
 await p.evaluate(()=>document.querySelector('input[name=dn-product][value=mattress]').click()); await p.waitForTimeout(400);
 // all result links are on-site product pages
 res.badLinks=await p.evaluate(()=>[...document.querySelectorAll('a[href]')].map(a=>a.href).filter(h=>!/^https:\/\/divinedunlop\.com\/|^mailto:support@divinedunlop\.com|^#|^file:/.test(h)));
 // form: empty + bad email
 await p.evaluate(()=>{const d=document.getElementById('dn-ct');d.open=true}); await p.waitForTimeout(200);
 await p.evaluate(()=>document.querySelector('#dn-form .dn-go').click()); await p.waitForTimeout(300);
 res.formEmpty=await p.evaluate(()=>document.getElementById('dn-fm').textContent.slice(0,80));
 await p.evaluate(()=>{const e=document.getElementById('dn-fe');e.value='not-an-email';e.dispatchEvent(new Event('input',{bubbles:true}))}); await p.evaluate(()=>document.querySelector('#dn-form .dn-go').click()); await p.waitForTimeout(300);
 res.formBad=await p.evaluate(()=>document.getElementById('dn-fm').textContent.slice(0,80));
 // all accordions open: no overflow
 await p.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true)); await p.waitForTimeout(300);
 res.overflowOpen=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 // a11y quick
 res.a11y=await p.evaluate(()=>{const o={};const lab=e=>e.labels&&e.labels.length||e.getAttribute('aria-label')||e.getAttribute('aria-labelledby');o.inputsNoLabel=[...document.querySelectorAll('input:not([type=hidden]),textarea,select')].filter(e=>!lab(e)).map(e=>e.id||e.name).slice(0,5);o.buttonsNoName=[...document.querySelectorAll('button')].filter(e=>!(e.textContent.trim()||e.getAttribute('aria-label'))).map(e=>e.id||e.className).slice(0,5);o.linksNoName=[...document.querySelectorAll('a')].filter(e=>!(e.textContent.trim()||e.getAttribute('aria-label'))).length;o.imgNoAlt=[...document.querySelectorAll('img:not([alt])')].length;o.h1=document.querySelectorAll('h1').length;return o});
 say(`\n=== ${w}x${h}`); say(JSON.stringify(res)); say('pageerrors: '+JSON.stringify(errs)); say('failed requests: '+JSON.stringify(fails)); say('console: '+JSON.stringify(cons.slice(0,6)));
 if(errs.length||fails.length||res.overflow||res.overflowOpen||res.badLinks.length) problems++;
 await c.close();
}
await b.close(); say('\nAUDIT viewports with problems: '+problems);})();
