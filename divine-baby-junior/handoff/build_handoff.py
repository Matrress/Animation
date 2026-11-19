import base64, html, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
desc = (root / 'ecwid/description-0.9.0.html').read_text()
loader = (root / 'ecwid/loader-0.9.0.js').read_text().strip()
font = base64.b64encode((root.parent / '/dev/null').read_bytes() if False else b'').decode()
scratch = pathlib.Path('/tmp/claude-0/-home-user-Animation/14fb12be-58fb-599c-974a-ee4b14141df2/scratchpad/preview')
f400 = base64.b64encode((scratch / 'chillax-400.woff2').read_bytes()).decode()
f600 = base64.b64encode((scratch / 'chillax-600.woff2').read_bytes()).decode()
page = f'''<!doctype html>
<html lang="bg">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Baby &amp; Junior · код за Ecwid</title>
<style>
@font-face{{font-family:"DBJChillax";font-weight:400;font-display:swap;src:url(data:font/woff2;base64,{f400}) format("woff2")}}
@font-face{{font-family:"DBJChillax";font-weight:600;font-display:swap;src:url(data:font/woff2;base64,{f600}) format("woff2")}}
:root{{--ink:#003A68;--ink2:rgba(0,58,104,.78);--strong:#006591;--sky:#B2E3FB;--surf:#E4E8F0;--line:rgba(0,58,104,.18);--w:#fff}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--w);color:var(--ink);font:400 17px/1.6 "DBJChillax",system-ui,sans-serif;-webkit-font-smoothing:antialiased}}
.wrap{{max-width:980px;margin:0 auto;padding:56px 22px 80px}}
.eyebrow{{font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--strong);display:flex;align-items:center;gap:10px}}
.eyebrow::before{{content:"";width:18px;height:1px;background:var(--strong)}}
h1{{font-weight:400;font-size:44px;line-height:1.08;letter-spacing:-.02em;margin:14px 0 10px}}
.lead{{color:var(--ink2);font-size:18px;max-width:640px;margin:0}}
.steps{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:34px 0 8px}}
.step{{background:var(--surf);border:1px solid var(--line);border-radius:22px;padding:20px 20px 22px}}
.step b{{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--ink);color:#fff;font-size:14px;margin-bottom:12px}}
.step h3{{font-weight:600;font-size:18px;margin:0 0 6px}}
.step p{{margin:0;color:var(--ink2);font-size:15px;line-height:1.5}}
.card{{margin-top:40px;border:1px solid var(--line);border-radius:22px;overflow:hidden}}
.card-head{{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:var(--strong);color:#fff;padding:16px 20px}}
.card-head h2{{font-weight:600;font-size:18px;margin:0}}
.card-head span{{font-size:13px;color:var(--sky)}}
button.copy{{appearance:none;border:0;background:#fff;color:var(--ink);font:600 14px/1 "DBJChillax",system-ui,sans-serif;padding:11px 18px;min-height:40px;border-radius:999px;cursor:pointer}}
button.copy:hover{{background:var(--sky)}}
button.copy:focus-visible{{outline:2px solid #fff;outline-offset:2px}}
pre{{margin:0;background:#fff;padding:20px;overflow:auto;max-height:460px;font:400 13px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:var(--ink);white-space:pre-wrap;word-break:break-word}}
.note{{margin-top:28px;background:var(--surf);border-radius:18px;padding:18px 22px;color:var(--ink2);font-size:15px;line-height:1.6}}
.note b{{color:var(--ink);font-weight:600}}
.toast{{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);opacity:0;background:var(--ink);color:#fff;padding:12px 20px;border-radius:999px;font-size:14px;transition:opacity .25s ease,transform .25s ease;pointer-events:none}}
.toast.on{{opacity:1;transform:translateX(-50%)}}
@media (max-width:760px){{.steps{{grid-template-columns:1fr}}h1{{font-size:34px}}.wrap{{padding:36px 16px 60px}}}}
@media (prefers-reduced-motion:reduce){{.toast{{transition:none}}}}
</style>
</head>
<body>
<main class="wrap">
  <p class="eyebrow">Ecwid · Dunlop Baby &amp; Junior · 0.9.0</p>
  <h1>Код за описанието</h1>
  <p class="lead">Първо тестова категория, после живия сайт, и само след одобрение. Кодът е без скриптове и се копира с един клик.</p>

  <div class="steps">
    <div class="step"><b>1</b><h3>Тестова категория</h3><p>Catalog → Categories → Add category. Без продукти и без връзка с менюто.</p></div>
    <div class="step"><b>2</b><h3>Описание</h3><p>Description → бутон <code>&lt;&gt;</code> → изтрий всичко → постави кода по-долу → Save.</p></div>
    <div class="step"><b>3</b><h3>Провери</h3><p>Отвори категорията на компютър, iPad и телефон. Без селекцията, описанието е пълно и четливо.</p></div>
  </div>

  <section class="card">
    <div class="card-head"><h2>Описание · description-0.9.0</h2><button class="copy" data-target="desc">Копирай описанието</button></div>
    <pre id="desc">{html.escape(desc)}</pre>
  </section>

  <section class="card">
    <div class="card-head"><h2>Loader за селекцията · 283 знака</h2><button class="copy" data-target="loader">Копирай loader-а</button></div>
    <pre id="loader">{html.escape(loader)}</pre>
  </section>

  <div class="note"><b>Loader-ът не е инсталиран.</b> Той се поставя в сайтовото поле за Custom JavaScript и е промяна за целия сайт. Ще го сложим само след твое одобрение, първо в тестовата категория, ако Ecwid позволява. Без него описанието е пълно, но бутоните и двата куба не работят.</div>
</main>
<div class="toast" id="toast">Копирано</div>
<script>
(function(){{
  var toast=document.getElementById('toast'),t=0;
  function say(m){{toast.textContent=m;toast.classList.add('on');clearTimeout(t);t=setTimeout(function(){{toast.classList.remove('on');}},1600);}}
  document.querySelectorAll('button.copy').forEach(function(b){{
    b.addEventListener('click',function(){{
      var txt=document.getElementById(b.getAttribute('data-target')).textContent;
      var done=function(){{say('Копирано');}};
      var fail=function(){{var r=document.createRange();r.selectNodeContents(document.getElementById(b.getAttribute('data-target')));var s=window.getSelection();s.removeAllRanges();s.addRange(r);say('Натисни Ctrl+C / ⌘C');}};
      if(navigator.clipboard&&navigator.clipboard.writeText){{navigator.clipboard.writeText(txt).then(done,fail);}}else{{fail();}}
    }});
  }});
}})();
</script>
</body>
</html>
'''
out = root / 'handoff/ecwid-code-0.9.0.html'
out.write_text(page)
print(out, len(page))
