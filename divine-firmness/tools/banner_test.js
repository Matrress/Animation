const { chromium } = require('playwright'); const fs=require('fs');
const R='/home/user/animation/divine-firmness/release/1.0.0-inline/';
const files=fs.readdirSync(R).filter(f=>/^\d\d_.*\.html$/.test(f)).sort();
const page=(tx)=>'<!doctype html><html><head><meta charset=utf-8></head><body style="margin:0">'+files.map(f=>'<div class="tile">'+tx(f,fs.readFileSync(R+f,'utf8'))+'</div>').join('\n')+'</body></html>';
const V={
 full:(f,s)=>s,
 no04:(f,s)=>/^04_/.test(f)?'':s,
 old04_without_zone_rules:(f,s)=>/^04_/.test(f)?s.replace(/\.ddv-zq\{[^}]*\}/,'').replace(/\.ddv-zq \.zb\{[^}]*\}/,''):s,
 no08:(f,s)=>/^08_/.test(f)?'':s,
 no09:(f,s)=>/^09_/.test(f)?'':s,
};
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for(const [k,t] of Object.entries(V)){ fs.writeFileSync('/tmp/_ban_'+k+'.html',page(t));
  const p=await b.newPage(); await p.route('https://cdn.jsdelivr.net/**',r=>r.abort()); await p.goto('file:///tmp/_ban_'+k+'.html#dn-chk'); await p.waitForTimeout(3500);
  const r=await p.evaluate(()=>{const e=document.getElementById('dn-t8');return e?[e.textContent,getComputedStyle(e).backgroundColor]:['(no banner)','']}); console.log(k.padEnd(26),r[1].padEnd(18),r[0]); await p.close(); }
 await b.close();})();
