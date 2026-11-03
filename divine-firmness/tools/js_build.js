// Build the two JS sections with terser (mangled locals), ASCII only. \xNN escapes are fixed afterwards by nohex.py.
const T=require('/tmp/claude-0/-home-user-animation/578b9d4c-a6ae-55a4-a36b-c2fabe1ee389/scratchpad/tnode/node_modules/terser');
const fs=require('fs');
(async()=>{
 for(const [src,out] of [['v4/mod.js','blocks/out/6_JS_module.html'],['visual/ddv.js','blocks/out/7_JS_visual.html']]){
  const s=fs.readFileSync(src,'utf8'); const m=s.match(/^\s*<script>([\s\S]*)<\/script>\s*$/); const code=m?m[1]:s;
  const r=await T.minify(code,{compress:{passes:2,ecma:2015},mangle:true,format:{ascii_only:true,comments:false}});
  if(r.error) throw r.error;
  fs.writeFileSync(out,'<script>'+r.code+'</script>'); console.log(src,code.length,'->',r.code.length+17);
 }
})();
