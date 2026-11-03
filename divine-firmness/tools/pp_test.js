const { chromium } = require('playwright'); const fs=require('fs'),path=require('path');
const R='/home/user/animation/divine-firmness/release/1.0.0-inline/', A='/home/user/animation/divine-firmness/assets/';
fs.writeFileSync('/tmp/_pp.html','<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"></head><body style="margin:0">'+fs.readdirSync(R).filter(f=>/^\d\d_.*\.html$/.test(f)).sort().map(f=>'<div class="tile">'+fs.readFileSync(R+f,'utf8')+'</div>').join('\n')+'</body></html>');
const VPS=(process.env.VPS||'1194x834,834x1194,390x844').split(',').map(s=>s.split('x').map(Number));
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); let bad=0,n=0; const msgs=[]; let shots=0;
 for(const [w,h] of VPS){
  const c=await b.newContext({viewport:{width:w,height:h},hasTouch:true,deviceScaleFactor:1.3}); const p=await c.newPage();
  await p.route('https://cdn.jsdelivr.net/**',r=>{const f=path.basename(new URL(r.request().url()).pathname); const fp=A+f; fs.existsSync(fp)?r.fulfill({status:200,contentType:'image/webp',body:fs.readFileSync(fp)}):r.abort();});
  await p.goto('file:///tmp/_pp.html'); await p.waitForTimeout(1300);
  const two=async(a,b2)=>p.evaluate(([a,b2])=>{const t=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))};document.querySelector('input[name="dn-ppl"][value="two"]').click();document.getElementById('dn-tab-me').click();t('dn-kg',a);t('dn-cm',172);document.getElementById('dn-tab-pt').click();t('dn-kg',b2);t('dn-cm',165);document.getElementById('dn-tab-me').click()},[a,b2]);
  const one=async(kg,cm,prod)=>p.evaluate(([kg,cm,prod])=>{document.querySelector('input[name="dn-ppl"][value="one"]').click();document.querySelector(`input[name="dn-product"][value="${prod}"]`).click();const t=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))};t('dn-kg',kg);t('dn-cm',cm)},[kg,cm,prod]);
  const check=async(label)=>{ await p.evaluate(()=>document.querySelectorAll('.dn-pm img,.dn-pi,.dn-ri').forEach(i=>{i.loading='eager'})); await p.waitForTimeout(550); n++; const r=await p.evaluate(()=>{
    const bad=[]; const st=window.DDN_STATE; const recs=st.recs||[]; const rb=e=>e.getBoundingClientRect();
    const rel=new Set(); const N={SOFT:1,MEDIUM:2,FIRM:3,'EXTRA FIRM':4}; rel.add(N[st.me.lv]); if(st.pt) rel.add(N[st.pt.lv]); recs.forEach(r=>r.firmness.forEach(k=>rel.add(N[k])));
    const tiles=[...document.querySelectorAll('#dn-lvs div')]; tiles.forEach((d,i)=>{const vis=d.offsetParent!==null; if(vis!==rel.has(i+1)) bad.push('level tile '+(i+1)+(vis?' shown but not part of the result':' hidden but part of the result'))});
    if(!document.querySelector('#dn-lvs div.on')||document.querySelector('#dn-lvs div.on').offsetParent===null) bad.push('the regulation tile is not visible');
    document.querySelectorAll('#dn-picks .dn-pick').forEach((pk,i)=>{ const pm=pk.querySelector('.dn-pm'), isP=/Partners/.test(pk.querySelector('h4').textContent);
      if(isP!==!!pm) bad.push('pick '+i+(isP?' lacks the picture':' shows the picture without being partners'));
      if(pm){ const im=pm.querySelector('img'),l=pm.querySelector('.l'),r2=pm.querySelector('.r'),P=rb(pm),L=rb(l),Rr=rb(r2);
        if(!im.complete||!im.naturalWidth) bad.push('picture did not load');
        if(L.left<P.left+2||Rr.right>P.right-2||L.top<P.top||L.bottom>P.bottom) bad.push('core label outside the picture');
        if(L.right>Rr.left-6) bad.push('core labels touch');
        const half=P.left+P.width/2; if(L.right>half-4||Rr.left<half+4) bad.push('label crosses the middle seam');
        const ic=pk.querySelector('.dn-pi'),h4=rb(pk.querySelector('h4')); if(!ic) bad.push('no icon'); else { const I=rb(ic); if(I.left<h4.right&&I.right>h4.left&&I.top<h4.bottom&&I.bottom>h4.top) bad.push('icon overlaps the title'); if(I.right>rb(pk).right||I.top<rb(pk).top) bad.push('icon outside the card'); }
        if(pk.querySelector('.dn-stack')) bad.push('old drawn stack still there'); }
      if(rb(pk).right>innerWidth+1) bad.push('pick wider than the screen'); });
    document.querySelectorAll('#dn-ra a').forEach((a,i)=>{ const q=rb(a); const kids=[...a.children].map(rb); for(let x=0;x<kids.length;x++)for(let y=x+1;y<kids.length;y++){const A_=kids[x],B=kids[y]; if(A_.width&&B.width&&A_.left<B.right-1&&B.left<A_.right-1&&A_.top<B.bottom-1&&B.top<A_.bottom-1) bad.push('right card row '+i+' parts overlap');} if(q.right>innerWidth+1) bad.push('right card row wider than screen'); });
    if(document.documentElement.scrollWidth>innerWidth+1) bad.push('horizontal scroll');
    return {bad,recs:recs.map(r=>r.model+':'+r.firmness.join('+')),tiles:tiles.filter(d=>d.offsetParent!==null).length};
  }); if(r.bad.length){bad++; if(msgs.length<8) msgs.push(w+'x'+h+' '+label+' '+JSON.stringify(r.recs)+' => '+r.bad.join('; '));} return r; };
  const W=[40,50,62,80,95,110,125];
  for(const a of W) for(const b2 of W){ await two(a,b2); const r=await check(`two ${a}/${b2}`); if(shots<2&&r.recs.some(x=>/Partners/.test(x))&&a===125&&b2===62){ await (await p.$('#dn-picks')).scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await (await p.$('#dn-picks')).screenshot({path:`pp_picks_${w}.png`}); await (await p.$('.dn-ans')).scrollIntoViewIfNeeded(); await (await p.$('.dn-ans')).screenshot({path:`pp_card_${w}.png`}); shots++; } }
  for(const prod of ['mattress','topper']) for(const kg of [40,62,80,100,125]) for(const cm of [150,172,195]){ await one(kg,cm,prod); await check(`one ${prod} ${kg}kg ${cm}cm`); }
  await c.close();
 }
 await b.close(); console.log('checked',n,'configurations;',bad,'with a problem'); msgs.forEach(m=>console.log(' -',m));
})();
