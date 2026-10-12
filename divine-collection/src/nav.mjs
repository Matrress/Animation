// Divine DunlopDreams Collection — the decision navigator ("Which 100% natural latex mattress is right for you?").
// One content source for: the static route markup inside the mattress description, and the data the overlay script builds the
// Sizes and Firmness views from. Sizes and firmness are NOT re-typed here: they are read from the hero's own sources
// (divine-hero/src/sizes.json and the Firmness Regulation card in divine-hero/src/sheets.html), so there is one system, not two.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const heroSrc = path.join(here, '../../divine-hero/src');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const QUESTION = 'Which 100% natural latex mattress is right for you?';
export const HINT = 'Hover or tap to find your mattress';

export const INTRO = {
  eyebrow: 'Your need. Your mattress.',
  title: 'Every comfort need has a clear route.',
  text: 'Our natural latex collection is built around real comfort needs, different body proportions and different ways of sleeping. Start with the question that sounds most like you. We will show you the mattress concept designed to answer it.',
};

// Secondary markers only (small, after the model name, never in front of the need). Same wording as the collection grid labels.
export const LABELS = {
  botanic: ['Premium', 'Original'],
  botanic_dp: ['Premium', 'Dual Plush'],
  bio: ['Innovation', 'Latest Generation'],
  bio_dp: ['Innovation', 'Dual Plush'],
  ambient: ['Best Value'],
  ortho: ['Orthopaedic', 'Extra Firm'],
  partners: ['Partners', 'Individual Firmness'],
  hotel: ['Hotel Line'],
};
const FAMILY = { botanic: 'classic', botanic_dp: 'classic', bio: 'innov', bio_dp: 'innov', ortho: 'ortho', partners: 'partners', ambient: 'value', hotel: 'value' };

// six real customer routes, in this order. Model ids refer to src/data.mjs (url and name come from there). Hotel Line is not part of the navigator.
export const ROUTES = [
  {
    title: 'Balanced support and comfort',
    need: 'I want a balanced combination of solid support, adaptation and comfort.',
    answer: 'Botanic and Bio Comfort are the correct mattress concepts.',
    models: [
      { id: 'botanic', line: 'Original Dunlop comfort with solid support, natural elasticity and balanced adaptation.' },
      { id: 'bio', line: 'Our latest-generation latex core with finer pressure response, higher adaptability and a lighter comfort character.' },
    ],
  },
  {
    title: 'More adaptation and plush comfort',
    need: 'I want more adaptation and a softer, more enveloping plush comfort.',
    answer: 'The Dual Plush systems add a second comfort layer, allowing the body to receive greater adaptation without losing the support of the mattress beneath it.',
    models: [
      { id: 'botanic_dp', line: 'Original Dunlop support with an additional natural latex comfort layer for a plusher and more adaptive feel.' },
      { id: 'bio_dp', line: 'The Bio Comfort foundation combined with a separate responsive latex comfort layer for the highest level of adaptation.' },
    ],
  },
  {
    title: 'Newest and most technologically advanced',
    need: 'Which is your newest and most technologically advanced mattress?',
    answer: 'Bio Comfort is our latest-generation single-core latex mattress concept. Bio Comfort Dual Plush is our most complete and technologically advanced comfort system, combining the latest-generation mattress with an additional adaptable latex comfort layer.',
    models: [
      { id: 'bio', line: 'Our latest-generation single-core latex mattress, designed for finer adaptation, precise support and a lighter comfort response.' },
      { id: 'bio_dp', line: 'Our most complete and technologically advanced comfort system, combining the Bio Comfort foundation with a separate plush latex comfort layer.' },
    ],
  },
  {
    title: 'Best value',
    need: 'I want the best value natural latex mattress.',
    answer: 'Ambient is the Best Value model, created to deliver natural latex adaptation and dependable support in the most accessible mattress concept in the collection.',
    models: [{ id: 'ambient', line: 'A more accessible natural Dunlop latex mattress that keeps the essential balance of support, elasticity and adaptation.' }],
  },
  {
    title: 'Extra Firm orthopaedic comfort',
    need: 'I want Extra Firm, highly supportive orthopaedic comfort.',
    answer: 'Orthopaedic Coconut Coir is the solution for customers looking for the firmest and most strongly supportive comfort concept in the collection.',
    models: [{ id: 'ortho', line: 'Natural Dunlop latex reinforced with coconut coir for a flatter, more controlled and Extra Firm orthopaedic response.' }],
  },
  {
    title: 'Different comfort needs for partners',
    need: 'My partner and I need different firmness levels.',
    answer: 'Mattress for Partners allows each sleeper to have an individual firmness level while sharing one seamless sleeping surface.',
    models: [{ id: 'partners', line: 'Two individually regulated latex foundations, one for each sleeper, combined under one continuous shared comfort surface.' }],
  },
];

export const REASSURE = {
  title: 'Choose your mattress concept first.',
  text: 'Choose the model that answers your need, then set your size on its page. Sizes and firmness are explained below.',
  text2: 'Together, the collection covers the full range of standard UK and European sizes. Some specialised constructions, including Mattress for Partners, begin from specific widths. Custom sizes, depths and special shapes can also be discussed with us.',
  sizes: { title: 'All UK & EU Sizes', sub: 'One clear size system across the full collection.' },
  firmness: { title: 'Firmness Regulation', sub: 'Find the support level regulated for your body.' },
};

export const SIZES_TXT = {
  title: 'All UK & EU Sizes',
  sub: 'Width × length, organised within one UK and European size system.',
  custom: 'Custom size',
  contact: 'Contact us',
  note: 'Need a custom size, custom depth or special shape? Contact us and we will help configure it.',
  lead: 'Every model in the collection is available in all of these sizes, and any other size can be made to measure.',
  foot: 'All mattresses are made to order. Mattress for Partners, built for two sleepers, starts from UK Double.',
};

export const FIRM_TXT = {
  title: 'Firmness Regulation',
  sub: 'Support and adaptation, balanced to your body weight.',
  lead: 'Firmness is not a marketing label. It is body regulation based on weight, human proportions and the balance between support and adaptation.',
  solo: { h: 'Solo Firmness', x: 'One latex mattress or topper, one firmness: chosen by your body weight.', mm: 'Latex mattresses', tt: 'Latex topper' },
  dp: {
    h: 'Dual Plush System', x: 'Two firmnesses in one system.', mattress: 'Latex mattress', topper: 'Comfort layer', models: 'Models',
    points: ['The mattress foundation follows the body-weight regulation.', 'The upper comfort layer adjusts the surface feel.', 'The right support regulation can be combined with the comfort feeling you prefer.'],
  },
  partners: { h: 'Partners Comfort', x: 'Two sleepers, two body weights and two individual firmness regulations, combined within one continuous sleep surface.', one: 'One side', other: 'Other side' },
  ok: 'Follow the range for your body weight and your choice starts from a protected, body-based regulation. If you are between two firmnesses or prefer a more adaptive surface, Dual Plush keeps the mattress within the correct support range while the upper layer adjusts the comfort you feel.',
  note: 'Selection guidelines, not medical rules.',
};

// ---------- the one system: read from the hero sources ----------
export function heroSizes() {
  const j = JSON.parse(fs.readFileSync(path.join(heroSrc, 'sizes.json'), 'utf8'));
  if (j.sizes.length !== 22) throw new Error(`hero sizes.json: expected 22 sizes, found ${j.sizes.length}`);
  return { sizes: j.sizes.map((s) => ({ n: s.name, cm: s.cm, in: s.in })), contactUrl: j.contactUrl || null };
}

export function heroFirmness() {
  const s = fs.readFileSync(path.join(heroSrc, 'sheets.html'), 'utf8');
  const i = s.indexOf('id="ddh-hc-weight"');
  if (i < 0) throw new Error('hero sheets.html: the Firmness Regulation card moved');
  const blk = s.slice(i, s.indexOf('</aside>', i));
  const ranges = [...blk.matchAll(/<li class="ddh__hcf-(\w)"><b[^>]*>([^<]*)<\/b><span[^>]*>([^<]*)<\/span>/g)].map((m) => ({ k: m[1], n: m[2], r: m[3] }));
  if (ranges.map((r) => r.k).join('') !== 'smfx') throw new Error('hero firmness ranges changed');
  // solo rows: <li><a class="ddh__fn-m" href>NAME</a><span class="ddh__fn-st">…c--s is-on…</span>
  const rows = [...blk.matchAll(/<li><a class="ddh__fn-m" href="([^"]+)">(?:<span[^>]*>)?([^<]*)(?:<\/span>)?<\/a><span class="ddh__fn-st"[^>]*>(.*?)<\/span>/g)].map((m) => ({
    u: m[1], n: m[2], on: [...m[3].matchAll(/ddh__fn-c--(\w) is-on/g)].map((x) => x[1]).join(''),
  }));
  const anchors = [...blk.matchAll(/<a class="ddh__fn-m" href="([^"]+)">(?:<span[^>]*>)?([^<]*)/g)].map((m) => ({ u: m[1], n: m[2] }));
  const byName = (n) => anchors.find((a) => a.n === n);
  const dpm = ['Botanic Dual Plush', 'Bio Comfort Dual Plush', 'Bio Support Dual'].map((n) => ({ n, u: (byName(n) || {}).u }));
  const par = ['Mattress for Partners', 'Partners Topper'].map((n) => ({ n, u: (byName(n) || {}).u }));
  const combos = [...blk.matchAll(/<!--ISO:(\w):(\w)-->/g)].map((m) => [m[1], m[2]]);
  if (rows.length !== 5 || dpm.some((m) => !m.u) || par.some((m) => !m.u) || combos.length !== 3) throw new Error('hero firmness card: structure changed, update src/nav.mjs');
  return { ranges, soloModels: rows.slice(0, 4), topperModels: rows.slice(4), dpModels: dpm, partnerModels: par, combos };
}

// ---------- static markup that lives inside the mattress description (real text, real links, visible without JavaScript;
// the script moves the same block into the dialog) ----------
export function navMarkup(models) {
  const byId = Object.fromEntries(models.map((m) => [m.id, m]));
  // one model = one link: name, small markers, "View". No second sentence, no second link.
  const card = (r) => {
    const m = byId[r.id]; if (!m) throw new Error(`navigator: unknown model ${r.id}`);
    const lab = LABELS[r.id].map((t) => `<span>${esc(t)}</span>`).join(' ');
    return `<li class="ddc__m ddc-f-${FAMILY[r.id]}"><a class="ddc__m-a" href="${m.url}"><span class="ddc__m-x"><span class="ddc__m-n">${esc(m.name)}</span>\n<span class="ddc__m-f">${lab}</span></span>\n<span class="ddc__m-go">${esc(r.cta || 'View')}</span></a></li>`;
  };
  // question -> models: the title IS the question, the models ARE the answer
  const routes = ROUTES.map((rt, i) => `<li class="ddc__r ddc__r--${i + 1}"><h4 class="ddc__r-t"><span class="ddc__r-n">${i + 1}</span> <span class="ddc__r-q">${esc(rt.title)}</span></h4>\n<ul class="ddc__md ddc__md--${rt.models.length}">\n${rt.models.map(card).join('\n')}\n</ul></li>`).join('\n');
  return `<div class="ddc__nv">
<div class="ddc__nv-h"><p class="ddc__nv-eb">${esc(INTRO.eyebrow)}</p>
<h3 class="ddc__nv-t">${esc(INTRO.title)}</h3></div>
<ol class="ddc__rt">
${routes}
</ol>
<div class="ddc__rs"></div>
</div>`;
}

// the payload the script embeds
export function navData(ownBase) {
  return {
    own: ownBase,
    q: QUESTION, hint: HINT,
    reassure: REASSURE, sz: { ...SIZES_TXT, ...heroSizes() }, fm: { ...FIRM_TXT, ...heroFirmness() },
  };
}
