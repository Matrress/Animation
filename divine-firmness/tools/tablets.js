const { chromium } = require('playwright'); const fs=require('fs');
const R='/home/user/animation/divine-firmness/release/1.0.0-inline/';
const html='<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"></head><body style="margin:0">'+fs.readdirSync(R).filter(f=>/^\d\d_.*\.html$/.test(f)).sort().map(f=>'<div class="tile">'+fs.readFileSync(R+f,'utf8')+'</div>').join('\n')+'</body></html>';
fs.writeFileSync('/tmp/_tab.html',html);
const MAC='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const IPAD='Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const AND='Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const SAM='Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0 Safari/537.36';
const WIN='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 Edg/124.0';
const D=[
 ['iPad mini, mobile mode, portrait',744,1133,IPAD,2],['iPad mini, mobile mode, landscape',1133,744,IPAD,2],
 ['iPad 10.9, mobile mode, portrait',820,1180,IPAD,2],['iPad 10.9, mobile mode, landscape',1180,820,IPAD,2],
 ['iPad Pro 11, DESKTOP mode, landscape',1194,834,MAC,2],['iPad Pro 11, DESKTOP mode, portrait',834,1194,MAC,2],
 ['iPad Pro 12.9, DESKTOP mode, landscape',1366,1024,MAC,2],['iPad Pro 12.9, DESKTOP mode, portrait',1024,1366,MAC,2],
 ['Galaxy Tab (Chrome), portrait',800,1280,AND,2],['Galaxy Tab (Chrome), landscape',1280,800,AND,2],
 ['Galaxy Tab (Samsung Internet), landscape',1280,800,SAM,2],['Fire HD 8, portrait',600,1024,AND,1.5],
 ['Surface Pro (Edge), portrait',912,1368,WIN,2],['Surface Pro (Edge), landscape',1368,912,WIN,2]];
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const rows=[];
 for(const [name,w,h,ua,dpr] of D){
  const c=await b.newContext({viewport:{width:w,height:h},hasTouch:true,userAgent:ua,deviceScaleFactor:dpr,isMobile:/Mobile|Android/.test(ua)&&!/Macintosh/.test(ua)});
  const p=await c.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///tmp/_tab.html',{waitUntil:'load'}); await p.waitForTimeout(1300);
  const r={name};
  r.overflow=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  // slider by touch
  const s=await p.$('#dn-w'); await s.scrollIntoViewIfNeeded(); await p.waitForTimeout(250); const sb=await s.boundingBox();
  await p.touchscreen.tap(sb.x+sb.width*0.85,sb.y+sb.height/2); await p.waitForTimeout(600);
  r.slider=await p.evaluate(()=>{const st=window.DDN_STATE;return st?st.me.w+'kg/'+st.me.lv:'NO STATE'});
  // monitor reacts?
  r.monitor=await p.evaluate(()=>(document.querySelector('.ddv-rr .m')?.textContent||'').replace(/\s+/g,' ').trim().slice(0,28));
  // pins: tap all 8 in sequence
  let open=0,inView=0;
  for(let i=1;i<=8;i++){
    const btn=await p.$(`.ddv-hs[data-i="${i}"] button`); await btn.scrollIntoViewIfNeeded(); await p.waitForTimeout(700); await btn.tap(); await p.waitForTimeout(1300);
    const o=await p.evaluate(()=>{const i=document.getElementById('ddv-info');const q=i.getBoundingClientRect();return [!i.hidden,q.top>=-2&&q.bottom<=innerHeight+2]});
    if(o[0])open++; if(o[0]&&o[1])inView++;
  }
  r.pinsOpen=open+'/8'; r.panelFullyInView=inView+'/8';
  r.sliderPx=Math.round(sb.height); r.err=errs.length;
  rows.push(r); await c.close();
 }
 await b.close();
 const pad=(s,n)=>String(s).padEnd(n);
 console.log(pad('device',42),pad('overflow',9),pad('slider tap',22),pad('monitor',30),pad('pins open',10),pad('panel in view',14),'errors');
 rows.forEach(r=>console.log(pad(r.name,42),pad(r.overflow,9),pad(r.slider,22),pad(r.monitor,30),pad(r.pinsOpen,10),pad(r.panelFullyInView,14),r.err));
})();
