const { chromium } = require('playwright'); const fs=require('fs');
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const c=await b.newContext({viewport:{width:1194,height:834},hasTouch:true,userAgent:UA});
 const p=await c.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e.message||e)));
 await p.route('https://divinedunlop.com/firmnesses*',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:fs.readFileSync('synth.html','utf8')}));
 await p.goto('https://divinedunlop.com/firmnesses',{waitUntil:'load',timeout:120000});
 await p.waitForTimeout(9000);
 const st=await p.evaluate(()=>({flags:document.documentElement.className,banner:!!document.getElementById('t8'),api:typeof window.DDFT_API,dnInDom:!!document.getElementById('dn'),tilesDom:document.querySelectorAll('[tile-type=CUSTOM_CODE]').length,synInDom:[...document.querySelectorAll('[id^="tile-custom-code-SYN"]')].length}));
 console.log('after 9s:',JSON.stringify(st));
 // interaction on the real Ecwid page
 const s=await p.$('#dn-w'); await s.scrollIntoViewIfNeeded(); const sb=await s.boundingBox();
 await p.touchscreen.tap(sb.x+sb.width*0.8,sb.y+sb.height/2); await p.waitForTimeout(900);
 console.log('slider tap -> kg:',await p.evaluate(()=>document.getElementById('dn-kg').value),'state:',await p.evaluate(()=>JSON.stringify(window.DDN_STATE&&window.DDN_STATE.me)),'plate:',await p.evaluate(()=>document.querySelector('#dn-plates b')?.textContent));
 const btn=await p.$('.ddv-hs[data-i="3"] button'); await btn.scrollIntoViewIfNeeded(); await p.waitForTimeout(700); await btn.tap(); await p.waitForTimeout(1500);
 console.log('pin 3 tap -> info open:',await p.evaluate(()=>!document.getElementById('ddv-info').hidden),'title:',await p.evaluate(()=>document.getElementById('ddv-it').textContent));
 console.log('scene monitor:',await p.evaluate(()=>[...document.querySelectorAll('.ddv-rr .m')].map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,70))));
 console.log('errors:',JSON.stringify(errs.filter(e=>!/OnPageLoaded|^\[object|^Event$/.test(e)).slice(0,5)));
 await b.close();
})();
