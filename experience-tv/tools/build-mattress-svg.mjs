// Builds docs/mobile/premium/assets/botanic-mattress.svg (themed) and botanic-mattress-outline.svg (lines only)
// from the traced centre lines of the owner's mattress line drawing (tools/trace-mattress.py ->
// docs/mobile/premium/assets/mattress-lines.json). Two edges the tracer lost at a junction (the two right-hand diagonals)
// are added as the straight lines they are; every other point is the traced one.
//   node tools/build-mattress-svg.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const A = join(root, 'docs', 'mobile', 'premium', 'assets');
const d = JSON.parse(readFileSync(join(A, 'mattress-lines.json'), 'utf8'));
const [rightV, bottom, leftV, frontTop, topOutline] = d.polylines;
const rightTopEdge = [[1101, 499], [1715, 137]];            // front corner -> right corner (top face, right-hand edge)
const rightBottomEdge = [[1108, 714], [1716, 280]];         // lower edge of the right-hand side face
const P = pts => pts.map(p => p.join(' ')).join(' L ');
const path = pts => 'M ' + P(pts);
const rev = a => a.slice().reverse();
// faces, as closed polygons made of the traced points
const top = [...topOutline, ...rev(rightTopEdge).slice(0, 0), [1101, 499], ...frontTop.slice(0, 5).reverse().slice(1), ...[[995, 502]].slice(0, 0), [16, 289], [14, 275]];
const topFace = [...topOutline, [1101, 499], ...frontTop.slice(1, 5), [16, 289], [14, 275]];
const frontFace = [...frontTop.slice().reverse().slice(0, 0), [16, 289], [995, 502], [1035, 508], [1071, 508], [1086, 505], [1101, 499], [1108, 714], [1091, 720], [1068, 721], [988, 704], [200, 497], [31, 450], [20, 436], [15, 413], [8, 318], [8, 291], [14, 275]];
const sideFace = [[1101, 499], [1715, 137], [1717, 139], [1714, 173], [1714, 268], [1716, 280], [1108, 714]];
const [minx, miny, w, h] = [0, 0, d.width, d.height];
const strokes = [topOutline, frontTop, leftV, rightV, bottom, rightTopEdge, rightBottomEdge];
const lineAttrs = 'fill="none" stroke="var(--mat-line, currentColor)" stroke-width="var(--mat-line-width, 1.6)" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"';
const outlineOnly = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Mattress, outline"><title>Mattress, outline</title><g ${lineAttrs}>${strokes.map(s => `<path d="${path(s)}"/>`).join('')}</g></svg>\n`;
const themed = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Mattress"><title>Mattress</title>
<!-- Theming: set --mat-top, --mat-front, --mat-side (face fills), --mat-line and --mat-line-width on the element or a parent.
     Defaults are the Graphite Blue palette. Layers: #mat-faces (three fills), #mat-lines (the drawing), #mat-zones (optional, empty). -->
<defs><linearGradient id="mat-top-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--mat-top, #314058)"/><stop offset="1" stop-color="var(--mat-top-2, #263347)"/></linearGradient></defs>
<g id="mat-faces" stroke="none">
<polygon id="mat-face-side" fill="var(--mat-side, #1A2332)" points="${sideFace.map(p => p.join(',')).join(' ')}"/>
<polygon id="mat-face-front" fill="var(--mat-front, #202B3C)" points="${frontFace.map(p => p.join(',')).join(' ')}"/>
<polygon id="mat-face-top" fill="url(#mat-top-g)" points="${topFace.map(p => p.join(',')).join(' ')}"/>
</g>
<g id="mat-zones"></g>
<g id="mat-lines" ${lineAttrs} style="color: #C3D5ED">${strokes.map(s => `<path d="${path(s)}"/>`).join('')}</g>
</svg>\n`;
writeFileSync(join(A, 'botanic-mattress.svg'), themed);
writeFileSync(join(A, 'botanic-mattress-outline.svg'), outlineOnly);
console.log('wrote botanic-mattress.svg (' + themed.length + ' bytes) and botanic-mattress-outline.svg (' + outlineOnly.length + ' bytes)');
