import { chromium } from 'playwright';
const url = process.argv[2]; const vps = [[390,844,3],[1024,1366,2],[1366,768,1],[1440,900,2],[1920,1080,1]];
const b = await chromium.launch();
for (const [w,h,d] of vps) {
  const p = await (await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:d})).newPage();
  await p.goto(url); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(200);
  const r = await p.evaluate(() => {
    const ink = (el, txt) => { const cs = getComputedStyle(el); const c = document.createElement('canvas').getContext('2d');
      c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; const m = c.measureText(txt);
      return { fs: parseFloat(cs.fontSize), asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent, fAsc: m.fontBoundingBoxAscent, fDesc: m.fontBoundingBoxDescent, left: m.actualBoundingBoxLeft, right: m.actualBoundingBoxRight, adv: m.width, lh: cs.lineHeight }; };
    const word = document.querySelector('.ddh__sky-word'); const L = word.children[0], X = word.children[4];
    const rL = L.getBoundingClientRect(), rX = X.getBoundingClientRect();
    const iL = ink(L,'L'), iX = ink(X,'X');
    // line box: height = fs*lh, baseline = top + (lh*fs - (fAsc+fDesc))/2 + fAsc (unscaled), scaled from top by s
    const s = .75, fs = iL.fs, lhpx = parseFloat(getComputedStyle(word).lineHeight);
    const top = word.getBoundingClientRect().top;
    const base = top + ((lhpx - (iL.fAsc + iL.fDesc)) / 2 + iL.fAsc) * s;
    const inkTop = base - iL.asc * s, inkBot = base + iL.desc * s;
    const nav = [...document.querySelectorAll('.ddh__hero-nav a')]; const rg = document.createRange(); rg.selectNodeContents(nav[0]); const nb = rg.getBoundingClientRect();
    const navInk = ink(nav[0], 'Mattresses'); const navCs = getComputedStyle(nav[0]);
    const navBase = nb.top + ((nb.height - (navInk.fAsc + navInk.fDesc)) / 2) + navInk.fAsc;
    const cert = document.querySelector('.ddh__sky-cert>span:last-child'); const cr = document.createRange(); cr.selectNodeContents(cert); const cb = cr.getBoundingClientRect();
    const cInk = ink(cert.querySelector('b'), 'European Production');
    const certCapTop = cb.top + ((parseFloat(getComputedStyle(cert).lineHeight) - (cInk.fAsc + cInk.fDesc)) / 2) + cInk.fAsc - cInk.asc;
    const leaf = document.querySelector('.ddh__leaf').getBoundingClientRect();
    const lock = document.querySelector('.ddh__sky-lockup').getBoundingClientRect();
    return { lockL: lock.left, lockR: lock.right, inkLeftL: rL.left - iL.left, inkRightX: rX.left + iX.right, latexInkTop: inkTop, latexInkBot: inkBot,
      navInkBot: navBase + navInk.desc, navBaseline: navBase, navLeft: nb.left, navFont: navCs.fontFamily,
      certCapTop, certBottom: cb.bottom, leafL: leaf.left, leafT: leaf.top, leafB: leaf.bottom,
      gapNavToLatex: inkTop - navBase, gapLatexToCert: certCapTop - inkBot };
  });
  console.log(w+'x'+h, JSON.stringify(r, (k,v)=> typeof v==='number'? +v.toFixed(1): v));
}
await b.close();
