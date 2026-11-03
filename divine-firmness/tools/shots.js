const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for(const [name,w,h] of [['land',1194,834],['port',834,1194]]){
  const c=await b.newContext({viewport:{width:w,height:h},hasTouch:true,deviceScaleFactor:1.5}); const p=await c.newPage();
  await p.addInitScript(()=>{const gl=SVGTextContentElement.prototype.getComputedTextLength;SVGTextContentElement.prototype.getComputedTextLength=function(){const ls=this.style.letterSpacing;this.style.letterSpacing='0px';const v=gl.call(this);this.style.letterSpacing=ls;return v};const gb=SVGGraphicsElement.prototype.getBBox;SVGGraphicsElement.prototype.getBBox=function(o){if(this.tagName!=='text')return gb.call(this,o);const ls=this.style.letterSpacing;this.style.letterSpacing='0px';const v=gb.call(this,o);this.style.letterSpacing=ls;return v}});
  await p.goto('file:///tmp/_pl.html'); await p.waitForTimeout(1500);
  await p.evaluate(()=>{const t=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))};document.querySelector('input[name="dn-product"][value="topper"]').click();t('dn-kg',62);t('dn-cm',161);});
  await p.waitForTimeout(700);
  await p.evaluate(()=>document.getElementById('ddv').scrollIntoView()); await p.waitForTimeout(500);
  await p.screenshot({path:`sc_scene_${name}.png`});
  const card=await p.$('.dn-ans'); await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  await p.screenshot({path:`sc_card_${name}.png`});
  await c.close();
 }
 await b.close();
})();
