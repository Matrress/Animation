const { chromium } = require('playwright');
const info=p=>p.evaluate(()=>({open:!document.getElementById('ddv-info').hidden,title:document.getElementById('ddv-it').textContent,y:Math.round(scrollY)}));
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 // --- desktop mouse, large screen
 let c=await b.newContext({viewport:{width:1366,height:1000}}); let p=await c.newPage();
 await p.goto('file:///tmp/_pl.html'); await p.waitForTimeout(1500);
 const pin=n=>`.ddv-hs[data-i="${n}"] button`;
 await p.evaluate(()=>document.getElementById('ddv').scrollIntoView()); await p.waitForTimeout(500);
 const y0=(await info(p)).y;
 await p.hover(pin(3)); await p.waitForTimeout(400); let r=await info(p); console.log('MOUSE hover pin 3 -> open:',r.open,'|',r.title,'| page scrolled:',r.y-y0);
 await p.hover(pin(6)); await p.waitForTimeout(400); r=await info(p); console.log('MOUSE hover pin 6 -> open:',r.open,'|',r.title);
 await p.click(pin(6)); await p.waitForTimeout(300); r=await info(p); console.log('MOUSE click on open pin 6 -> still open:',r.open);
 await p.mouse.move(5,5); await p.waitForTimeout(300); r=await info(p); console.log('MOUSE leaves the pin -> stays open for reading:',r.open);
 await p.keyboard.press('Escape'); await p.waitForTimeout(200); console.log('Escape closes:',!(await info(p)).open);
 // quick pass over a pin (hover intent) must not open it
 await p.mouse.move(5,5); const bb=await (await p.$(pin(2))).boundingBox(); await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2); await p.mouse.move(5,5); await p.waitForTimeout(350); console.log('quick flyover does not open:',!(await info(p)).open);
 await c.close();
 // --- laptop-size screen: panel below the fold
 c=await b.newContext({viewport:{width:1280,height:640}}); p=await c.newPage(); await p.goto('file:///tmp/_pl.html'); await p.waitForTimeout(1500);
 await p.evaluate(()=>document.getElementById('ddv').scrollIntoView()); await p.waitForTimeout(400);
 const ya=(await info(p)).y; await p.hover(pin(3)); await p.waitForTimeout(900); r=await info(p); console.log('LAPTOP 640px high, hover pin 3 -> open:',r.open,'| page moved by',r.y-ya,'px');
 await c.close();
 // --- touch (iPad)
 c=await b.newContext({viewport:{width:1194,height:834},hasTouch:true,userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'}); p=await c.newPage(); await p.goto('file:///tmp/_pl.html'); await p.waitForTimeout(1500);
 const bt=await p.$(pin(4)); await bt.scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
 await bt.tap(); await p.waitForTimeout(1200); r=await info(p); console.log('TOUCH tap pin 4 -> open:',r.open,'|',r.title);
 const bt5=await p.$(pin(5)); await bt5.scrollIntoViewIfNeeded(); await p.waitForTimeout(800); await bt5.tap(); await p.waitForTimeout(1200); r=await info(p); console.log('TOUCH tap pin 5 while 4 open -> now:',r.title);
 await bt5.tap(); await p.waitForTimeout(800); console.log('TOUCH tap the same pin again -> stays open:',(await info(p)).open);
 await b.close();
})();
