// Builds the ONE package the owner uses: nothing to assemble, nothing to choose.
//
//   node tools/build-package.mjs [--base=https://media.divinedunlop.com/ddtv/] [--products=876405767]
//
// It builds the phone layer and the television (same --base and --products), then writes dist/package/ and one zip:
//   botanic-ddtv-package.zip
//     upload/ddtv/…        the five files, to be uploaded as one folder (to the --base address)
//     paste/1-loader.txt   → Ecwid → Website → Advanced website settings → Custom JavaScript code
//     paste/2-description.html → the product's Description, HTML mode
//     PASTE-ME.html        a page with the two blocks and a Copy button each, and the steps
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pass = process.argv.slice(2).filter((a) => /^--(base|products)=/.test(a));
const run = (f) => execFileSync('node', [join(root, 'tools', f), ...pass], { stdio: ['ignore', 'pipe', 'inherit'], cwd: root }).toString();
run('build-phone.mjs'); run('build-experience.mjs');

const D = join(root, 'dist', 'experience'), P = join(root, 'dist', 'package');
rmSync(P, { recursive: true, force: true });
mkdirSync(join(P, 'upload', 'ddtv'), { recursive: true }); mkdirSync(join(P, 'paste'), { recursive: true });
const logosFile = readdirSync(D).find((f) => /^botanic-tv-logos-[0-9a-f]{20}\.js$/.test(f));
const pictureFiles = readdirSync(D).filter((f) => /^botanic-(cup|mattress)-[0-9a-f]{20}\.(webp|jpg|png)$/.test(f));
for (const f of ['botanic-tv.js', 'botanic-phone.js', logosFile, ...pictureFiles]) copyFileSync(join(D, f), join(P, 'upload', 'ddtv', f));
const loader = readFileSync(join(D, 'loader.html'), 'utf8').trim();
const desc = readFileSync(join(D, 'botanic-description.html'), 'utf8');
writeFileSync(join(P, 'paste', '1-loader.txt'), loader);
writeFileSync(join(P, 'paste', '2-description.html'), desc);
const base = /https:\/\/[^'"]+\/ddtv\//.exec(loader)[0];
const products = /L=\[([^\]]*)\]/.exec(loader)[1];
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const page = `<!doctype html><html lang="bg"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Botanic: поставяне наведнъж</title>
<style>
body{margin:0;font:16px/1.5 system-ui,Arial,sans-serif;background:#FBFBED;color:#2E3633}
main{max-width:920px;margin:0 auto;padding:28px 20px 60px}
h1{font-size:28px;margin:0 0 6px} h2{font-size:20px;margin:34px 0 8px}
.n{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#434239;color:#FBFBED;font-weight:700;margin-right:8px}
.box{background:#FEFEF6;border:1px solid #DDD6C4;border-radius:14px;padding:16px 18px;margin:10px 0}
textarea{width:100%;height:150px;border:1px solid #CFC8B4;border-radius:10px;padding:10px;font:12px/1.4 ui-monospace,Menlo,monospace;background:#fff;color:#2E3633}
button{font:700 17px/1.2 system-ui,Arial,sans-serif;border:2px solid #FBFBED;border-radius:12px;padding:14px 22px;background:#6E8601;color:#fff;box-shadow:0 0 0 2px #3F4440;cursor:pointer;margin:10px 0}
button.done{background:#434239}
code{background:#EFEBDD;border-radius:6px;padding:1px 6px} small{color:#646155}
</style></head><body><main>
<h1>Botanic: поставяне наведнъж</h1>
<p>Всичко е готово и проверено. Остават <b>3 стъпки</b>: качваш една папка и поставяш два блока. Нищо не се сглобява и нищо не се избира.</p>
<p><small>Продукт: <b>${products}</b> · Файловете се зареждат от: <code>${base}</code></small></p>

<h2><span class="n">1</span>Качи папката <code>upload/ddtv/</code></h2>
<div class="box">В пакета (zip) има папка <code>upload/ddtv/</code> с 5 файла. Качи <b>цялата папка</b> така, че файловете да се отварят на:<br><code>${base}botanic-tv.js</code> (и другите четири до него).<br>Видеата не се качват: те остават на сегашните си линкове.</div>

<h2><span class="n">2</span>Зареждащ скрипт</h2>
<div class="box">Ecwid админ → <b>Website</b> → <b>Advanced website settings</b> → <b>Custom JavaScript code</b> → Add code → постави → Save.
<textarea id="t1" readonly>${esc(loader)}</textarea>
<button data-for="t1">Копирай зареждащия скрипт</button> <small>${loader.length} знака · проверка ${sha(loader)}</small></div>

<h2><span class="n">3</span>Описание на продукта</h2>
<div class="box">Ecwid админ → <b>Catalog → Products</b> → продукт <b>${products}</b> → Description → бутон <b>&lt;&gt;</b> (HTML режим) → <b>изтрий всичко</b> → постави → Save. Продуктът остава изключен.
<textarea id="t2" readonly>${esc(desc)}</textarea>
<button data-for="t2">Копирай описанието</button> <small>${desc.length} знака · проверка ${sha(desc)}</small></div>

<h2>След това</h2>
<div class="box">Кажи ми, и пускам проверките на истинския адрес: телевизорът на лаптоп и iPad, мобилният слой на iPhone, четирите избора в двете посоки, цената и промоциите на Ecwid, без заявка към количката.<br>
<b>Връщане назад:</b> махаш зареждащия скрипт от Custom JavaScript code и всичко е както преди. За един преглед: добави <code>?ddtv=off</code> в края на адреса.</div>
<script>
document.querySelectorAll('button[data-for]').forEach(function(b){b.addEventListener('click',function(){
  var t=document.getElementById(b.dataset.for);t.focus();t.select();
  var ok=false;try{ok=document.execCommand('copy');}catch(e){}
  if(navigator.clipboard&&!ok){navigator.clipboard.writeText(t.value).then(function(){mark(b);});return;}
  mark(b);});});
function mark(b){b.classList.add('done');b.textContent='Копирано ✓ (постави го сега)';}
</script></main></body></html>`;
writeFileSync(join(P, 'PASTE-ME.html'), page);
writeFileSync(join(P, 'README.txt'), `Botanic Experience: package (base ${base}, products ${products})\n1. upload/ddtv/  → upload the whole folder to ${base}\n2. paste/1-loader.txt → Ecwid → Website → Advanced website settings → Custom JavaScript code\n3. paste/2-description.html → the product's Description, HTML mode\nPASTE-ME.html has both blocks with a Copy button.\n`);

const zip = join(root, 'dist', 'botanic-ddtv-package.zip');
rmSync(zip, { force: true });
execFileSync('python3', ['-c', `import zipfile,os,sys
p,z=sys.argv[1],sys.argv[2]
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as f:
    for d,_,fs in os.walk(p):
        for n in sorted(fs): f.write(os.path.join(d,n), os.path.relpath(os.path.join(d,n),p))`, P, zip]);
console.log(`package ready: dist/botanic-ddtv-package.zip (${readFileSync(zip).length} bytes)\n  loader ${loader.length} characters, description ${desc.length} characters, products ${products}, base ${base}`);
