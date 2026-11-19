(function(){
  function init(){
  var s=document.getElementById('dz7');
  if(!s)return false;
  if(s.__dz7)return true;
  s.__dz7=1;
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      es.forEach(function(x){s.classList[x.isIntersecting?'add':'remove']('dz7-vis')});
    },{threshold:.05}).observe(s);
  }else{s.classList.add('dz7-vis')}
  var tip=document.getElementById('dz7-tip'),tipx=document.getElementById('dz7-tipx'),hint=document.getElementById('dz7-hint'),tw=s.querySelector('.dz7-tipw');
  var zs=s.querySelectorAll('.dz7-zq,.dz7-names li'),hits=s.querySelectorAll('.dz7-hit'),flash=document.getElementById('dz7-flash'),cur=null;
  if(!window.matchMedia('(hover:hover)').matches&&hint)hint.textContent='Tap a zone to see what it does.';
  function mark(z){for(var k=0;k<zs.length;k++)zs[k].classList[zs[k].getAttribute('data-z')===z?'add':'remove']('on')}
  function show(z,btn){
    var li=s.querySelector('.dz7-list [data-z="'+z+'"]');
    if(!li)return;
    cur=z;
    tip.innerHTML=li.innerHTML;
    var wr=tw.getBoundingClientRect(),br=btn.getBoundingClientRect(),cx=br.left+br.width/2-wr.left,w=tip.offsetWidth,left=Math.max(0,Math.min(cx-w/2,tw.clientWidth-w));
    tip.style.left=left+'px';
    tip.style.setProperty('--ax',Math.max(22,Math.min(w-22,cx-left))+'px');
    tipx.classList.add('show');
    s.setAttribute('data-on','1');
    mark(z);
    flash.classList.remove('go');void flash.getBoundingClientRect();flash.classList.add('go');
  }
  function hide(){cur=null;tipx.classList.remove('show');s.removeAttribute('data-on');mark('')}
  for(var k=0;k<hits.length;k++){
    (function(h){
      var z=h.getAttribute('data-z');
      h.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse')show(z,h)});
      h.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')hide()});
      h.addEventListener('click',function(e){if(e.pointerType&&e.pointerType!=='mouse'||e.detail===0){cur===z?hide():show(z,h)}});
      h.addEventListener('focus',function(){show(z,h)});
      h.addEventListener('blur',hide);
    })(hits[k]);
  }
  document.addEventListener('pointerdown',function(e){if(cur&&e.pointerType!=='mouse'&&!s.contains(e.target))hide()});
  return true;
  }
  if(init())return;
  var n=0,t=setInterval(function(){if(init()||++n>40)clearInterval(t)},250);
  document.addEventListener('DOMContentLoaded',init);
})();
