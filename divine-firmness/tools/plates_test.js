// Every configuration: the four monitor plates and the ring must be readable and never overlap.
// SAFARI=1 emulates WebKit's habit of leaving CSS letter-spacing out of getComputedTextLength / getBBox.
const { chromium } = require('playwright'); const fs=require('fs');
const R='/home/user/animation/divine-firmness/release/1.0.0-inline/';
const html='<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"></head><body style="margin:0">'+fs.readdirSync(R).filter(f=>/^\d\d_.*\.html$/.test(f)).sort().map(f=>'<div class="tile">'+fs.readFileSync(R+f,'utf8')+'</div>').join('\n')+'</body></html>';
fs.writeFileSync('/tmp/_pl.html',html);
const SAFARI=process.env.SAFARI==='1';
const VPS=(process.env.VPS||'1366x1024,1194x834,834x1194,390x844').split(',').map(s=>s.split('x').map(Number));
const inter=(a,b,g=0)=>!(a.right+g<=b.left||b.right+g<=a.left||a.bottom+g<=b.top||b.bottom+g<=a.top);
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); let totalBad=0,totalCfg=0; const samples=[];
 for(const [w,h] of VPS){
  const c=await b.newContext({viewport:{width:w,height:h},hasTouch:true,deviceScaleFactor:1});
  const p=await c.newPage();
  if(SAFARI) await p.addInitScript(()=>{
    const gl=SVGTextContentElement.prototype.getComputedTextLength; SVGTextContentElement.prototype.getComputedTextLength=function(){const ls=this.style.letterSpacing;this.style.letterSpacing='0px';const v=gl.call(this);this.style.letterSpacing=ls;return v};
    const gb=SVGGraphicsElement.prototype.getBBox; SVGGraphicsElement.prototype.getBBox=function(o){ if(this.tagName!=='text') return gb.call(this,o); const ls=this.style.letterSpacing;this.style.letterSpacing='0px';const v=gb.call(this,o);this.style.letterSpacing=ls;return v};
  });
  await p.goto('file:///tmp/_pl.html',{waitUntil:'load'}); await p.waitForTimeout(1500);
  const groups=await p.evaluate(()=>{const o={};document.querySelectorAll('.dn-ch[data-q]').forEach(g=>{o[g.dataset.q]=[...g.querySelectorAll('input')].map(i=>i.value)});return o});
  const set=async(kg,cm)=>p.evaluate(([kg,cm])=>{for(const [id,v] of [['dn-kg',kg],['dn-cm',cm]]){const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))}},[kg,cm]);
  const pick=async(q,v)=>p.evaluate(([q,v])=>{const r=document.querySelector(`input[name="dn-${q}"][value="${v}"]`);if(r&&!r.disabled)r.click()},[q,v]);
  const check=()=>p.evaluate(()=>{
    const g=id=>document.getElementById(id).getBoundingClientRect();
    const plates=[...document.querySelectorAll('.ddv-pl')].map(r=>r.getBoundingClientRect());
    const vals=['ddv-vh','ddv-vw','ddv-vf','ddv-vm'].map(g); const lab=[...document.querySelectorAll('.ddv-tb .ddv-l,.ddv-mtx .ddv-l')].map(e=>e.getBoundingClientRect());
    const scene=document.getElementById('ddv').getBoundingClientRect(); const bad=[]; const hidden=plates.every(q=>!q.width);
    if(!hidden) for(let i=0;i<4;i++)for(let j=i+1;j<4;j++) if(plates[i].width&&plates[j].width&&((a,b)=>!(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top))(plates[i],plates[j])) bad.push('plates '+i+'/'+j+' overlap');
    if(!hidden) for(let i=0;i<4;i++){const v=vals[i],pl=plates[i]; if(v.width&&(v.left<pl.left-2||v.right>pl.right+2||v.top<pl.top-2||v.bottom>pl.bottom+2)) bad.push('value '+i+' outside its plate by '+Math.round(Math.max(pl.left-v.left,v.right-pl.right,0))+'px'); if(pl.right>scene.right-2||pl.left<scene.left+2) bad.push('plate '+i+' outside scene');}
    const vf=vals[2],vm=vals[3]; if(!hidden&&vf.right>vm.left-6&&vf.top<vm.bottom&&vm.top<vf.bottom) bad.push('firmness text runs into model text');
    const cap=document.getElementById('ddv-dnc'),ring=document.querySelector('.ddv-dn svg').getBoundingClientRect(); const kids=[...cap.children].map(e=>e.getBoundingClientRect());
    const cx=(ring.left+ring.right)/2,cy=(ring.top+ring.bottom)/2,rad=ring.width*0.30; kids.forEach((k)=>{ if(k.width){ for(const [x,y] of [[k.left,k.top],[k.right,k.top],[k.left,k.bottom],[k.right,k.bottom]]) if(Math.hypot(x-cx,y-cy)>rad){ bad.push('ring text touches the ring arcs'); break; } } }); kids.forEach((k,i)=>{ if(k.width&&(k.left<ring.left+4||k.right>ring.right-4||k.top<ring.top+6||k.bottom>ring.bottom-6)) bad.push('ring text '+i+' leaves the ring')});
    for(let i=0;i<kids.length;i++)for(let j=i+1;j<kids.length;j++) if(kids[i].width&&kids[j].width&&kids[i].bottom>kids[j].top+1&&kids[i].top<kids[j].bottom-1&&kids[i].left<kids[j].right&&kids[j].left<kids[i].right) bad.push('ring texts overlap');

    const card=document.querySelector('.dn-ans').getBoundingClientRect();
    const ras=[...document.querySelectorAll('#dn-ra a')]; const recsN=(window.DDN_STATE&&window.DDN_STATE.recs||[]).length;
    if(ras.length!==Math.min(2,recsN)) bad.push('right card shows '+ras.length+' model links, engine gave '+recsN);
    ras.forEach((a,i)=>{const q=a.getBoundingClientRect(); if(q.left<card.left||q.right>card.right||q.width<120) bad.push('model link '+i+' outside the card'); const bb=a.querySelector('b').getBoundingClientRect(),ii=a.querySelector('i').getBoundingClientRect(); if(bb.right>ii.left+1&&bb.top<ii.bottom&&ii.top<bb.bottom) bad.push('model name overlaps its button '+i); if(!/^https:\/\/divinedunlop\.com\/products\//.test(a.href)) bad.push('bad link '+a.href);});
    for(let i=0;i+1<ras.length;i++){const a=ras[i].getBoundingClientRect(),b2=ras[i+1].getBoundingClientRect(); if(a.bottom>b2.top+1) bad.push('model links overlap');}
    const lv=[...document.querySelectorAll('.dn-ans .dn-lvs div')]; lv.forEach((d,i)=>{const q=d.getBoundingClientRect(); if(q.height>86) bad.push('level tile '+i+' still tall '+Math.round(q.height)); const t=d.querySelector('b').getBoundingClientRect(); if(t.right>q.right+1||t.left<q.left-1) bad.push('level tile '+i+' text leaves the tile');});
    const lvs=document.querySelector('.dn-ans .dn-lvs').getBoundingClientRect(); if(ras.length&&lvs.top<ras[ras.length-1].getBoundingClientRect().bottom) bad.push('level tiles above the result');
    const rd=document.getElementById('ddv-read'); if(hidden&&rd){const sc=scene; [...rd.querySelectorAll('*')].forEach(e=>{const q=e.getBoundingClientRect(); if(q.width&&q.right>sc.right+1) bad.push('read-out text leaves the scene')});}
    if(card.right>innerWidth+1) bad.push('right card wider than the screen');
    return {bad,txt:[vals[2].width|0,vals[3].width|0],f:document.getElementById('ddv-vf').textContent,m:document.getElementById('ddv-vm').textContent};
  });
  let n=0,bad=0;
  const run=async(label)=>{await p.waitForTimeout(330); const r=await check(); n++; if(r.bad.length){bad++; if(samples.length<6) samples.push(w+'x'+h+' '+label+' => '+r.bad.join('; ')+' ['+r.f+' | '+r.m+']')}};
  const W=[40,62,80,100,125],H=[150,185];
  for(const prod of ['mattress','topper']) for(const need of groups.need||['balance']) for(const pain of groups.pain||['no']){
    await pick('product',prod); await pick('need',need); await pick('pain',pain);
    for(const kg of W) for(const cm of H){ await set(kg,cm); await run(`${prod}/${need}/${pain} ${kg}kg ${cm}cm`); }
  }
  // two people
  await pick('product','mattress'); await pick('ppl','two');
  for(const [a,b2] of [[60,120],[100,45],[80,80],[125,40]]){ await p.evaluate(([a,b2])=>{const t=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))};document.getElementById('dn-tab-me').click();t('dn-kg',a);t('dn-cm',172);document.getElementById('dn-tab-pt').click();t('dn-kg',b2);t('dn-cm',165);document.getElementById('dn-tab-me').click()},[a,b2]); await run(`two ${a}/${b2}`); }
  if(process.env.ROTATE){ for(const [kg,cm,prod] of [[62,161,'topper'],[100,185,'mattress'],[40,150,'mattress'],[125,172,'topper']]){ await pick('ppl','one'); await pick('product',prod); await set(kg,cm); await p.setViewportSize({width:h,height:w}); await p.waitForTimeout(700); await run(`rotated ${prod} ${kg}kg ${cm}cm`); await p.setViewportSize({width:w,height:h}); await p.waitForTimeout(700); await run(`rotated back ${prod} ${kg}kg`); } }
  console.log(`${w}x${h}: ${n} configurations, ${bad} with a problem`); totalBad+=bad; totalCfg+=n; await c.close();
 }
 await b.close(); console.log(SAFARI?'(Safari text-measure emulation ON)':'(plain Chromium)', 'TOTAL',totalCfg,'configs,',totalBad,'with problems'); samples.forEach(s=>console.log(' -',s));
})();
