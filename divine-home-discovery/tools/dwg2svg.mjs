// One-off converter: the owner's AutoCAD drawing (assets/source/bio-dunlop.dwg) -> assets/bio-dunlop.svg
// Usage (needs `npm i @mlightcad/libredwg-web` somewhere): node dwg2svg.mjs <in.dwg> <out.svg> <path-to-libredwg-web-wasm-dir>
// Only the SOLID hatches carry the artwork: each boundary edge is a cubic B-spline with triple interior knots = a chain of exact cubic Beziers.
import fs from 'node:fs';
import { Dwg_File_Type, LibreDwg } from '@mlightcad/libredwg-web';
const [inp, outp, wasm] = process.argv.slice(2);
const lib = await LibreDwg.create(wasm);
const buf = fs.readFileSync(inp);
const db = lib.convert(lib.dwg_read_data(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), Dwg_File_Type.DWG));
const S = 1000, r = (n) => Math.round(n * S);
const colour = { 134: '#009289', 88: '#092600' };   // 134 = the splines' own true colour 0x009289; 88 = AutoCAD index colour (the leaf veins)
const bez = (e) => {
  const k = e.knots, c = e.controlPoints, d = e.degree;
  if (d !== 3 || (c.length - 1) % 3) throw new Error('not a Bezier chain');
  for (let i = d + 1; i < k.length - d - 1; i += 3) if (!(k[i] === k[i + 1] && k[i + 1] === k[i + 2] && k[i + 3] > k[i])) throw new Error('knots are not triple');
  let s = `M${r(c[0].x)} ${-r(c[0].y)}`;
  for (let i = 1; i < c.length; i += 3) s += `C${[0, 1, 2].map((j) => `${r(c[i + j].x)} ${-r(c[i + j].y)}`).join(' ')}`;
  return s;
};
const paths = []; let X0 = 1e9, X1 = -1e9, Y0 = 1e9, Y1 = -1e9;
const bump = (x, y) => { X0 = Math.min(X0, x); X1 = Math.max(X1, x); Y0 = Math.min(Y0, y); Y1 = Math.max(Y1, y); };
for (const e of db.entities) {
  if (e.type !== 'HATCH') continue;
  let d = '';
  for (const p of e.boundaryPaths) {
    let first = true;
    for (const ed of p.edges) {
      if (ed.type === 4) { d += (first ? '' : '') + bez(ed); ed.controlPoints.forEach((q) => bump(r(q.x), -r(q.y))); }
      else if (ed.type === 1) { d += (first ? `M${r(ed.start.x)} ${-r(ed.start.y)}` : '') + `L${r(ed.end.x)} ${-r(ed.end.y)}`; bump(r(ed.start.x), -r(ed.start.y)); bump(r(ed.end.x), -r(ed.end.y)); }
      else throw new Error('edge type ' + ed.type);
      first = false;
    }
    d += 'Z';
  }
  paths.push([colour[e.colorIndex], d]);
}
const pad = 20;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${X0 - pad} ${Y0 - pad} ${X1 - X0 + 2 * pad} ${Y1 - Y0 + 2 * pad}" role="img" aria-label="Bio Dunlop">${paths.map(([c, d]) => `<path fill="${c}" fill-rule="evenodd" d="${d}"/>`).join('')}</svg>\n`;
fs.writeFileSync(outp, svg);
console.log(outp, svg.length, 'bytes; viewBox', X1 - X0 + 2 * pad, 'x', Y1 - Y0 + 2 * pad);
