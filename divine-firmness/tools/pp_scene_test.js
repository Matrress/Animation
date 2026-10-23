const { chromium } = require('playwright'); const fs=require('fs'),path=require('path');
const R='/home/user/animation/divine-firmness/release/1.0.0-inline/', A='/home/user/animation/divine-firmness/assets/';
fs.writeFileSync('/tmp/_pps.html','<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"></head><body style="margin:0">'+fs.readdirSync(R).filter(f=>/^\d\d_.*\.html$/.test(f)).sort().map(f=>'<div class="tile">'+fs.readFileSync(R+f,'utf8')+'</div>').join('\n')+'</body></html>');
const VPS=(process.env.VPS||'1440x900,1194x834,834x1194,390x844').split(',').map(s=>s.split('x').map(Number));
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); let bad=0,n=0; const msgs=[]; const errs=[];
 for(const [w,h] of VPS){
  const c=await b.newContext({viewport:{width:w,height:h},hasTouch:w<900,deviceScaleFactor:1.3}); const p=await c.newPage();
  p.on('pageerror',e=>errs.push(w+'x'+h+' '+e.message));
  await p.route('https://cdn.jsdelivr.net/**',r=>{const f=path.basename(new URL(r.request().url()).pathname); const fp=A+f; fs.existsSync(fp)?r.fulfill({status:200,contentType:'image/webp',body:fs.readFileSync(fp)}):r.abort();});
  await p.goto('file:///tmp/_pps.html'); await p.waitForTimeout(1500);
  const setTwo=(a,b2)=>p.evaluate(([a,b2])=>{const t=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))};document.querySelector('input[name="dn-ppl"][value="two"]').click();document.getElementById('dn-tab-me').click();t('dn-kg',a);t('dn-cm',172);document.getElementById('dn-tab-pt').click();t('dn-kg',b2);t('dn-cm',165);document.getElementById('dn-tab-me').click()},[a,b2]);
  const setOne=(kg,cm)=>p.evaluate(([kg,cm])=>{document.querySelector('input[name="dn-ppl"][value="one"]').click();const t=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))};t('dn-kg',kg);t('dn-cm',cm)},[kg,cm]);
  const vis=(sel)=>`(()=>{const e=document.querySelector('${sel}');return !!e&&e.offsetParent!==null&&e.getBoundingClientRect().width>0})()`;
  const check=async(label,expectPP)=>{ n++;
    await p.evaluate(()=>document.querySelectorAll('.ddv-ppv img').forEach(i=>{i.loading='eager'})); await p.waitForTimeout(700);
    const r=await p.evaluate((expectPP)=>{ const bad=[]; const root=document.getElementById('ddv'); const rb=e=>e.getBoundingClientRect(); const V=e=>e&&e.offsetParent!==null&&rb(e).width>0;
      const html=document.documentElement; if(!html.classList.contains('ddv-ok')) bad.push('scene script not running'); if(!html.classList.contains('dn-ok')) bad.push('module script not running');
      const pp=root.getAttribute('data-pp')==='1'; if(pp!==expectPP) bad.push('data-pp is '+pp+', expected '+expectPP);
      const fig=document.querySelector('.ddv-fig'),hsl=document.querySelector('.ddv-hsl'),eq=document.querySelector('.ddv-eq'),ppv=document.querySelector('.ddv-ppv'),info=document.getElementById('ddv-info');
      if(expectPP){
        if(V(fig)) bad.push('model scene still visible'); if(V(hsl)||[...document.querySelectorAll('.ddv-hs')].some(V)) bad.push('points still visible'); if(V(eq)) bad.push('equalizers still visible'); if(V(info)) bad.push('explanation panel visible');
        if(!V(ppv)) bad.push('partners block not visible'); else {
          const pm=ppv.querySelector('.dn-pm'),im=pm.querySelector('img'),l=pm.querySelector('.l'),r2=pm.querySelector('.r'),P=rb(pm),L=rb(l),Rr=rb(r2),st=rb(root.querySelector('.ddv-stage')),RT=rb(root);
          if(!im.complete||!im.naturalWidth) bad.push('picture did not load');
          if(L.left<P.left+2||Rr.right>P.right-2||L.top<P.top||L.bottom>P.bottom||Rr.bottom>P.bottom) bad.push('label outside the picture');
          if(L.right>Rr.left-6) bad.push('labels touch'); const half=P.left+P.width/2; if(L.right>half-4||Rr.left<half+4) bad.push('label crosses the seam');
          if(P.width<Math.min(300,innerWidth*0.6)) bad.push('picture too small ('+Math.round(P.width)+')');
          if(P.left<RT.left||P.right>RT.right+0.5) bad.push('picture outside the scene card');
          const t=ppv.querySelector('.pt'); if(!V(t)||!V(t.querySelector('img'))) bad.push('emblem header missing');
          const cs=[...ppv.querySelectorAll('.pc span')].map(rb); if(cs.length!==2||cs.some(x=>!x.width)) bad.push('captions missing'); else if(cs[0].left<cs[1].right&&cs[1].left<cs[0].right&&cs[0].top<cs[1].bottom&&cs[1].top<cs[0].bottom) bad.push('captions overlap');
          const ic=rb(t.querySelector('img')); if(ic.top<P.bottom&&ic.bottom>P.top&&ic.left<P.right&&ic.right>P.left) bad.push('emblem lies over the mattress picture');
          if(ppv.innerText.trim().length<10) bad.push('no text');
        }
        const rr=document.getElementById('ddv-rr'); if(!/Mattress for Partners/.test(rr.textContent)) bad.push('readout does not show the model');
        if(html.scrollWidth>innerWidth+1) bad.push('horizontal scroll ('+html.scrollWidth+')');
        if(document.querySelector('.ddv-hs')&&root.hasAttribute('data-p')) bad.push('a point still marked open');
      } else {
        if(!V(fig)) bad.push('model scene not back'); if(V(ppv)) bad.push('partners block still visible'); if(!V(document.querySelector('.ddv-hs'))&&innerWidth>560) bad.push('points not back');
      }
      return bad; },expectPP);
    if(r.length){bad++; msgs.push(w+'x'+h+' '+label+' => '+r.join('; '));} };
  // 1. start state: no partners
  await check('start',false);
  // 2. open point 4 (single person), then choose partners
  const opened=await p.evaluate(()=>{const li=document.querySelector('.ddv-hs[data-i="4"]');if(!li)return false;const bt=li.querySelector('button');bt.click();return document.getElementById('ddv-info').hidden===false});
  if(w>560&&!opened){bad++;msgs.push(w+'x'+h+' point did not open before partners');}
  const pairs=[[50,80],[50,110],[80,50],[62,95],[125,62],[40,125]];
  let any=0;
  for(const [a,b2] of pairs){ await setTwo(a,b2); await p.waitForTimeout(450);
    const isP=await p.evaluate(()=>window.DDN_STATE&&window.DDN_STATE.recs[0]&&/Partners/.test(window.DDN_STATE.recs[0].model));
    await check('two '+a+'/'+b2+(isP?' (partners)':' (not partners)'),!!isP); if(isP) any++;
    if(isP&&a===50&&b2===80){ const info=await p.evaluate(()=>document.getElementById('ddv-info').hidden); if(!info){bad++;msgs.push(w+'x'+h+' info panel left open after partners');}
      await (await p.$('.ddv-stage')).scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await (await p.$('#ddv')).screenshot({path:`pps_${w}.png`}); }
  }
  if(!any){bad++;msgs.push(w+'x'+h+' no partners configuration found');}
  // 3. back to one person: scene returns, points work again
  await setOne(76,172); await p.waitForTimeout(500); await check('back to one',false);
  if(w>560){ const ok=await p.evaluate(async()=>{const li=document.querySelector('.ddv-hs[data-i="3"]');li.querySelector('button').click();await new Promise(r=>setTimeout(r,300));return !document.getElementById('ddv-info').hidden});
    if(!ok){bad++;msgs.push(w+'x'+h+' points do not open after returning from partners');} }
  await c.close();
 }
 await b.close(); console.log('checked',n,'states;',bad,'with a problem'); msgs.slice(0,25).forEach(m=>console.log(' -',m)); console.log('page errors:',errs.length); errs.slice(0,5).forEach(e=>console.log(' *',e));
})();
