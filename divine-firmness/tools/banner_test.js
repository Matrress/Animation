const { chromium } = require('playwright'); const fs=require('fs');
const R='/home/user/animation/divine-firmness/release/1.0.0-inline/';
const html='<!doctype html><html><head><meta charset=utf-8></head><body>'+fs.readdirSync(R).filter(f=>/^\d\d_/.test(f)).sort().map(f=>fs.readFileSync(R+f,'utf8')).join('\n')+'</body></html>';
fs.writeFileSync('/tmp/_bn.html',html);
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for(const h of ['','#dn-chk']){const p=await b.newPage();await p.goto('file:///tmp/_bn.html'+h);await p.waitForTimeout(800);
  console.log('url hash',JSON.stringify(h),'banner visible:',await p.evaluate(()=>!!document.getElementById('dn-t8')),'flags:',await p.evaluate(()=>document.documentElement.className));}
 await b.close()})();
