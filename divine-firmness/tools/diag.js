const { chromium } = require('playwright');
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const c=await b.newContext({viewport:{width:1194,height:834},hasTouch:true,userAgent:UA});
 const p=await c.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('https://divinedunlop.com/firmnesses?cb='+Date.now(),{waitUntil:'load',timeout:120000});
 await p.waitForTimeout(8000);
 const st=await p.evaluate(()=>({
   htmlFlags:document.documentElement.className, api:typeof window.DDFT_API,
   dn:!!document.getElementById('dn'), ddv:!!document.getElementById('ddv'),
   hsButtons:document.querySelectorAll('.ddv-hs button').length,
   chkPanel:!!document.getElementById('dn-chk'),
   scriptsWithMain:[...document.scripts].filter(s=>/function main\(root\)/.test(s.textContent)).length,
   scriptsWithBoot:[...document.scripts].filter(s=>/function boot\(\)/.test(s.textContent)).length,
   scriptsWithLV:[...document.scripts].filter(s=>/LV=\{'SOFT'/.test(s.textContent)).map(s=>s.textContent.length),
   tipsVisible:[...document.querySelectorAll('.ddv-tip')].filter(e=>e.offsetParent).length,
 }));
 console.log(JSON.stringify(st));
 // mutation churn inside the module and scene
 await p.evaluate(()=>{window.__mut=0;new MutationObserver(m=>{window.__mut+=m.length}).observe(document.getElementById('dn'),{subtree:true,childList:true,attributes:true});});
 await p.waitForTimeout(3000);
 console.log('mutations in #dn in 3s:', await p.evaluate(()=>window.__mut));
 // listeners on first pin and slider via CDP
 const cdp=await c.newCDPSession(p);
 const ev=async(sel)=>{const r=await cdp.send('Runtime.evaluate',{expression:`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return 'missing';const L=getEventListeners(e);return Object.fromEntries(Object.entries(L).map(([k,v])=>[k,v.length]))})()`,includeCommandLineAPI:true}); return r.result.value;};
 console.log('pin1 button listeners', JSON.stringify(await ev('.ddv-hs[data-i="1"] button')));
 console.log('dn-w listeners', JSON.stringify(await ev('#dn-w')));
 console.log('dn-kg listeners', JSON.stringify(await ev('#dn-kg')));
 // real tap on pin 1
 const btn=await p.$('.ddv-hs[data-i="1"] button'); if(btn){await btn.scrollIntoViewIfNeeded(); await p.waitForTimeout(600); const bb=await btn.boundingBox(); await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2); await p.waitForTimeout(900);}
 console.log('after tap info hidden:', await p.evaluate(()=>document.getElementById('ddv-info')?.hidden), 'title:', await p.evaluate(()=>document.getElementById('ddv-it')?.textContent));
 // slider via input event
 await p.evaluate(()=>{const s=document.getElementById('dn-w'); s.value=105; s.dispatchEvent(new Event('input',{bubbles:true}));});
 await p.waitForTimeout(800);
 console.log('after slider: kg', await p.evaluate(()=>document.getElementById('dn-kg').value), 'DDN_STATE', await p.evaluate(()=>JSON.stringify(window.DDN_STATE&&window.DDN_STATE.me)));
 console.log('errors', JSON.stringify(errs.slice(0,8)));
 await b.close();
})();
