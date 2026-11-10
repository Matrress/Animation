// Loads a browser-style config file (window.DDTV_PRODUCTS.x = …, window.DDTV_ASSETS.x = …) into a sandbox and returns
// the window object it filled. Used by the validator and the registry tool. No dependencies.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export function loadScripts(files, seed = {}) {
  const win = Object.assign({ DDTV_PRODUCTS: {}, DDTV_ASSETS: {}, DDTV_PROFILES: {} }, seed);
  win.window = win;
  const ctx = vm.createContext(win);
  for (const f of [].concat(files)) vm.runInContext(readFileSync(f, 'utf8'), ctx, { filename: f });
  return win;
}

// The engine's asset module (engine/ddtv-assets.js) in a minimal sandbox, so tools use the engine's own functions.
export function loadAssetsModule(root) {
  const win = { DDTV: { util: { each: (l, f) => { for (let i = 0; i < l.length; i++) f(l[i], i); } } } };
  win.window = win;
  vm.runInContext(readFileSync(`${root}/engine/ddtv-assets.js`, 'utf8'), vm.createContext(win), { filename: 'ddtv-assets.js' });
  return win.DDTV.assets;
}
