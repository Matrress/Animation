const { chromium } = require('playwright'); const fs=require('fs'),path=require('path');
const A='/home/user/animation/divine-firmness/assets/';
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for (const [w,h] of [[1194,834],[390,844]]) {
 const c=await b.newContext({viewport:{width:w,height:h},hasTouch:w<900}); const p=await c.newPage();
 await p.route('https://cdn.jsdelivr.net/**',r=>{const f=path.basename(new URL(r.request().url()).pathname); const fp=A+f; fs.existsSync(fp)?r.fulfill({status:200,contentType:'image/webp',body:fs.readFileSync(fp)}):r.abort();});
 await p.goto('file:///tmp/_back.html'); await p.waitForTimeout(1500);
 const set=(id,v)=>p.evaluate(([id,v])=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))},[id,v]);
 // user clicks the visible labels
 await p.getByText('Me and my partner',{exact:true}).first().click(); await p.waitForTimeout(300);
 await p.getByRole('button',{name:'Me'}).first().click().catch(()=>{});
 await p.evaluate(()=>document.getElementById('dn-tab-me').click()); await set('dn-kg',50); await set('dn-cm',172);
 await p.evaluate(()=>document.getElementById('dn-tab-pt').click()); await set('dn-kg',80); await set('dn-cm',165);
 await p.evaluate(()=>document.getElementById('dn-tab-me').click()); await p.waitForTimeout(700);
 const a=await p.evaluate(()=>({two:DDN_STATE.two, lvs:[...document.querySelectorAll('#dn-lvs div')].map(d=>d.textContent.trim().slice(0,12)+(d.offsetParent?'':'(hidden)')).join(' | '), picks:[...document.querySelectorAll('#dn-picks h4')].map(e=>e.textContent).join(' | '), pp:document.getElementById('ddv').dataset.pp}));
 console.log(w,'PARTNERS:',JSON.stringify(a));
 await p.getByText('Just me',{exact:true}).first().click(); await p.waitForTimeout(900);
 const r=await p.evaluate(()=>({two:DDN_STATE.two, lvs:[...document.querySelectorAll('#dn-lvs div')].map(d=>d.textContent.trim().slice(0,12)+(d.offsetParent?'':'(hidden)')).join(' | '), picks:[...document.querySelectorAll('#dn-picks h4')].map(e=>e.textContent).join(' | '), pp:document.getElementById('ddv').dataset.pp, ppv:(document.querySelector('.ddv-ppv')||{}).style&&document.querySelector('.ddv-ppv').style.display, plates:[...document.querySelectorAll('#dn-plates small')].map(e=>e.textContent).join(' | '), tabsHidden:document.getElementById('dn-tabs').hidden, scenePartnerText: /Partners/.test(document.getElementById('ddv').textContent)}));
 console.log(w,'JUST ME:',JSON.stringify(r));
 await c.close(); }
 await b.close();})();
