const { chromium } = require('playwright'); const fs=require('fs');
const R='/home/user/animation/divine-firmness/release/1.0.0-inline/';
fs.writeFileSync('/tmp/_sk.html','<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"></head><body style="margin:0">'+fs.readdirSync(R).filter(f=>/^\d\d_.*\.html$/.test(f)).sort().map(f=>'<div class="tile">'+fs.readFileSync(R+f,'utf8')+'</div>').join('\n')+'</body></html>');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for(const [n,w,h] of [['desk',1194,900],['phone',390,844]]){const c=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1.3});const p=await c.newPage();await p.goto('file:///tmp/_sk.html');await p.waitForTimeout(1200);
  const els=await p.$$('#dn-sk .dn-sk > div'); const i=els.length-2; await els[i].screenshot({path:`sk_${n}_sit.png`}); await els[i+1].screenshot({path:`sk_${n}_lie.png`}); await c.close();}
 await b.close();})();
