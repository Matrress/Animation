const acorn=require('/opt/node-tools/node_modules/acorn'),eg=require('/opt/node-tools/node_modules/escodegen');
const fs=require('fs');
function minJS(src){ // src may be wrapped in <script>..</script>
  const m=src.match(/^\s*<script>([\s\S]*)<\/script>\s*$/); const code=m?m[1]:src;
  const ast=acorn.parse(code,{ecmaVersion:2020});
  return '<script>'+eg.generate(ast,{format:{compact:true,semicolons:false,quotes:'single'}})+'</script>';
}
function minCSS(src){
  const m=src.match(/^\s*<style>([\s\S]*)<\/style>\s*$/); let c=m?m[1]:src;
  c=c.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').replace(/\s*([{};,>~])\s*/g,'$1').replace(/:\s+/g,':').replace(/;}/g,'}').trim();
  return '<style>'+c+'</style>';
}
function minHTML(h){ return h.replace(/<!--[\s\S]*?-->/g,'').replace(/>\s+</g,'><').replace(/\n\s*/g,' ').replace(/\s{2,}/g,' ').trim(); }
module.exports={minJS,minCSS,minHTML};
if(require.main===module){
  const [,, kind, inp, out]=process.argv; const s=fs.readFileSync(inp,'utf8');
  fs.writeFileSync(out,kind==='js'?minJS(s):kind==='css'?minCSS(s):minHTML(s)); console.log(kind,s.length,'->',fs.readFileSync(out,'utf8').length);
}
