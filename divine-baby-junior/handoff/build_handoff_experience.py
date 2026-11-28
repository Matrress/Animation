"""Handoff page for the Baby & Junior Experience 2.1.0 (the Botanic TV scheme): what to upload, what to paste, how to test.
Reuses the style and the copy script of the 1.1.0 handoff page. Output: handoff/ecwid-experience-2.1.0.html"""
import base64, html, pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
old = (root / 'handoff/ecwid-code-1.1.0.html').read_text()
style = re.search(r'<style>.*?</style>', old, re.S).group(0)
script = re.search(r'<script>.*?</script>', old, re.S).group(0)
dist = root / 'experience/dist'
tv = next(dist.glob('baby-tv-*.js')); ph = next(dist.glob('baby-phone-*.js'))
desc = (root / 'ecwid/description-2.1.0.html').read_text()
pointer = (dist / 'pointer.html').read_text().strip()
loader = (dist / 'loader-baby.js').read_text().strip()
dbs_loader = (root / 'ecwid/loader-1.1.0.js').read_text().strip()
b64 = lambda p: base64.b64encode(p.read_bytes()).decode()
dl = lambda p: f'<a class="dl" download="{p.name}" href="data:text/javascript;base64,{b64(p)}">Свали {p.name} ({p.stat().st_size // 1024} KB)</a>'
extra = '''<style>
.dl{display:inline-block;background:#fff;color:#003A68;font:600 14px/1 "DBJChillax",system-ui,sans-serif;padding:11px 18px;border-radius:999px;text-decoration:none;min-height:40px}
.dl:hover{background:#B2E3FB}.files{display:flex;flex-direction:column;gap:12px;padding:20px;background:#fff}
.files p{margin:0;font-size:15px;color:rgba(0,58,104,.78)}.files .row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 16px;border:1px solid rgba(0,58,104,.18);border-radius:14px}
.files .row .dl{background:#006591;color:#fff}.files .row .dl:hover{background:#003A68}
.row code,.step code{background:#E4E8F0;border-radius:6px;padding:1px 6px;font-size:13px}
</style>'''
page = f'''<!doctype html>
<html lang="bg">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Baby &amp; Junior · Experience за Ecwid</title>
{style}
{extra}
</head>
<body>
<main class="wrap">
  <p class="eyebrow">Ecwid · Dunlop Baby &amp; Junior · Experience 2.1.0</p>
  <h1>Схемата на Botanic TV, за бебешкия матрак</h1>
  <p class="lead">Три слоя, като при Botanic TV: телевизор (Optimised Preview), Standard Product View и телефонен слой. Опциите, цената, кошницата и касата остават на Ecwid. Нищо още не е в магазина.</p>

  <div class="steps">
    <div class="step"><b>1</b><h3>Два файла</h3><p>Качи двата JS файла в <code>media.divinedunlop.com/ddtv/</code> (както Botanic TV). Или ползвай втория loader по-долу и ги сервирай от jsDelivr.</p></div>
    <div class="step"><b>2</b><h3>Описанието</h3><p>Постави описанието по-долу (има скрития указател <code>#ddtv-pointer</code> най-отпред). Продуктът остава изключен.</p></div>
    <div class="step"><b>3</b><h3>Тест</h3><p>Отвори продукта с <code>?ddtv=test</code> (канал „test“, както при Botanic TV). <code>?ddtv=off</code> изключва всичко.</p></div>
  </div>

  <section class="card">
    <div class="card-head"><h2>Двата файла за качване</h2><span>имената са по правилото на loader-а: име-20 hex.js</span></div>
    <div class="files">
      <div class="row"><div><b>Телевизор</b><p>Optimised Preview и Standard Product View (десктоп и таблет)</p></div>{dl(tv)}</div>
      <div class="row"><div><b>Телефон</b><p>Ръководена конфигурация върху опциите на Ecwid</p></div>{dl(ph)}</div>
    </div>
  </section>

  <section class="card">
    <div class="card-head"><h2>Описание с указателя · description-2.1.0</h2><button class="copy" data-target="desc">Копирай описанието</button></div>
    <pre id="desc">{html.escape(desc)}</pre>
  </section>

  <section class="card">
    <div class="card-head"><h2>Само указателят</h2><button class="copy" data-target="pointer">Копирай указателя</button></div>
    <pre id="pointer">{html.escape(pointer)}</pre>
  </section>

  <section class="card">
    <div class="card-head"><h2>Loader за двата файла от jsDelivr (по избор)</h2><button class="copy" data-target="loader">Копирай loader-а</button></div>
    <pre id="loader">{html.escape(loader)}</pre>
  </section>

  <section class="card">
    <div class="card-head"><h2>Loader за селекцията в описанието (Standard Product View)</h2><button class="copy" data-target="dbsl">Копирай loader-а</button></div>
    <pre id="dbsl">{html.escape(dbs_loader)}</pre>
  </section>

  <div class="note"><b>Какво още не е направено и иска твое одобрение:</b> качването на двата файла в медията на магазина, записването на описанието в продукта, loader-ите (глобална настройка на сайта) и включването на продукта. Loader-ът на Botanic TV пуска само продуктите от своя списък <code>LIVE</code>; за каналa „test“ това не е нужно, но за публично пускане ID-то 876311857 трябва да влезе в списъка (или да ползваме втория loader). Продуктът е изключен, а Ecwid не показва изключен продукт на публичен адрес, така че тестът е през прегледа на Ecwid.</div>
</main>
<div class="toast" id="toast">Копирано</div>
{script}
</body>
</html>
'''
out = root / 'handoff/ecwid-experience-2.1.0.html'
out.write_text(page)
print(out, len(page) // 1024, 'KB')
