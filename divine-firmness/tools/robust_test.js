const { chromium } = require('playwright');
const fs=require('fs');
const R='/home/user/animation/divine-firmness/release/1.0.0-inline/';
const files=fs.readdirSync(R).filter(f=>/^\d\d_.*\.html$/.test(f)).sort();
const blk=Object.fromEntries(files.map(f=>[f.slice(0,2),fs.readFileSync(R+f,'utf8')]));
// ecwid-like wrapper: each block in its own tile div, plus an aggressive global stylesheet
const ECW='<style>body{font:16px Arial}input{box-sizing:border-box}*{box-sizing:border-box}</style>';
function page(order,skip=[]){ return '<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">'+ECW+'</head><body>'+order.filter(n=>!skip.includes(n)).map(n=>'<div class="tile" id="tile-'+n+'">'+blk[n]+'</div>').join('\n')+'</body></html>'; }
const norm=['01','02','03','04','05','06','07','08','09','10','11'];
const scriptsFirst=['07','08','09','01','02','03','04','05','06','10','11'];
async function run(name,html,after,opts={}){
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const p=await b.newPage({viewport:{width:1280,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e.message||e)));
  fs.writeFileSync('/tmp/_rt.html',html);
  await p.goto('file:///tmp/_rt.html'+(opts.hash||''),{waitUntil:'load'});
  if(after) await after(p);
  await p.waitForTimeout(900);
  const r=await p.evaluate(()=>{
    const q=s=>document.querySelector(s);
    const vis=[...document.querySelectorAll('.ddv-tip')].filter(e=>e.offsetParent!==null).length;
    const h=document.documentElement.className;
    const chk=q('#dn-chk'); 
    return {flags:h, tipsVisible:vis, kg:q('#dn-kg')&&q('#dn-kg').value, st:window.DDN_STATE&&window.DDN_STATE.me&&{w:window.DDN_STATE.me.w,lv:window.DDN_STATE.me.lv},
      chkDisplay:chk&&getComputedStyle(chk).display, chkText:chk&&chk.innerText.replace(/\s+/g,' ').slice(0,200)};
  });
  console.log(name.padEnd(34),JSON.stringify(r),errs.length?('ERR '+errs.join('|')):'');
  await b.close(); return r;
}
const slide=async p=>{ await p.evaluate(()=>{const s=document.getElementById('dn-w'); s.value=105; s.dispatchEvent(new Event('input',{bubbles:true}));}); await p.waitForTimeout(400); };
(async()=>{
  await run('A normal order, slider 105',page(norm),slide);
  await run('B scripts before markup',page(scriptsFirst),slide);
  await run('C DOM replaced after load',page(norm),async p=>{
     await p.waitForTimeout(500);
     await p.evaluate(()=>{ for(const id of ['dn','ddv']){ const e=document.getElementById(id); const c=e.cloneNode(true); e.replaceWith(c);} });
     await p.waitForTimeout(2500); await slide(p); });
  await run('D without 08/09 (no hash)',page(norm,['08','09']),null);
  await run('E without 08/09 + #dn-chk',page(norm,['08','09']),null,{hash:'#dn-chk'});
  await run('F complete + #dn-chk',page(norm),null,{hash:'#dn-chk'});
})();
