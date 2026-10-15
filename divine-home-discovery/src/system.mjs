// The "System" tile (Ecwid tile 2): all of its words live here, in one place.
// Product facts are NOT typed here. They are passed in by build.mjs from the approved Collection 3.13.2 sources (data.mjs / nav.mjs)
// and from the Hero's Firmness Regulation card (the body-weight ranges). Only the explaining sentences are written below.
//
// The logic the page has to carry (owner brief): people are afraid to choose a firmness and a mattress online, so the order is
//   1 need  ->  2 body weight  ->  3 firmness  ->  4 depth / Dual Plush  ->  5 material  ->  6 production  ->  "a complete sleep system".
// Every step names its reason, so the visitor can see that the choice is arranged for certainty, not left to guesswork.

export function systemHtml({ M, T, FIRM, routes, ranges, esc, tc, ownAssets, bioImg, firmHex }) {
  const byId = Object.fromEntries([...M.models, ...T.models].map((m) => [m.id, m]));
  const short = (s) => esc(s);
  const link = (m) => `<a class="dsys__m" href="${m.url}">${esc(m.name)}</a>`;
  // a four-step firmness meter (Soft 1 ... Extra Firm 4): the order of the system is visible at a glance, in one colour, with no dependence on colour differences
  const fdot = (k) => `<i class="dsys__lv" style="--n:${'smfx'.indexOf(k) + 1}" aria-hidden="true"></i>`;

  // ---- 1. Solutions for Real Needs: one row per approved route (Collection nav.mjs), then the topper row ----
  const needRows = routes.map((r) => `<li class="dsys__row"><p class="dsys__need">“${esc(r.need)}”</p><p class="dsys__ans">${esc(r.a)}</p><p class="dsys__ms">${r.m.map((x) => link(byId[x.id])).join('')}</p></li>`).join('');
  const topperRow = `<li class="dsys__row"><p class="dsys__need">“I already have a mattress, and I want to improve it.”</p><p class="dsys__ans">${esc(T.lede)}</p><p class="dsys__ms">${T.models.map(link).join('')}</p></li>`;

  // ---- 2. Comfort & Regulation: the weight ranges are the Hero's own, read at build time ----
  const weight = ranges.map((r) => `<li class="dsys__w">${fdot(r.k)}<b>${esc(r.n)}</b><span>${esc(r.r)}</span></li>`).join('');
  const depths = M.models.filter((m) => m.id !== 'hotel').map((m) => `<li><b>${esc(m.name)}</b><span>${m.depth.items.map(esc).join('  ·  ')}</span></li>`).join('');
  const pairsOf = (id) => byId[id].firm.pairs;
  const partnerSplits = byId.partners.firm.split.map(([a, b]) => `${FIRM[a]} + ${FIRM[b]}`).join(', ');

  // ---- 4. Engineering: the three approved Dual Plush diagrams (Collection 3.13.2 assets) ----
  const dpUnique = [['s', 'm'], ['m', 'f'], ['f', 'x']];
  const dpFig = dpUnique.map(([t, b]) => `<li class="dsys__dpv"><img src="${ownAssets}dual-plush-${t}-${b}.svg" width="246" height="100" loading="lazy" decoding="async" alt="${esc(FIRM[t])} latex topper above a ${esc(FIRM[b])} latex mattress"><span>${esc(FIRM[t])} Topper <em>on</em> ${esc(FIRM[b])} Mattress</span></li>`).join('');

  // ---- 3. materials: what each model is made of is its own approved "type" line ----
  const typeRows = M.models.filter((m) => m.id !== 'hotel').map((m) => `<li><b>${esc(m.name)}</b><span>${esc(m.type)}</span></li>`).join('');
  const noList = M.principles.find(([h]) => /pure latex/i.test(h));   // "No springs, no memory foam, no synthetic foam core."
  const madeList = M.principles.find(([h]) => /made to order/i.test(h));
  if (!noList || !madeList) throw new Error('system: the Collection principles moved');

  const topics = [
    ['Solutions for Real Needs', 'Each model answers a real need, so you never choose from a random list.'],
    ['Comfort & Regulation', 'Your body weight points to your firmness. A rule, not a guess.'],
    ['Natural Materials', noList[1]],
    ['Engineering & Technology', 'Support, adaptation and Dual Plush, designed to work together.'],
    ['European Production', 'Certified European production for European customers and standards.'],
  ];

  const cards = topics.map(([t, s], i) => `<li><a class="dsys__c" href="#dsys-t${i + 1}" data-dsys-open="${i + 1}"><span class="dsys__n" aria-hidden="true">${i + 1}</span><b>${esc(tc(t))}</b><span class="dsys__cs">${esc(s)}</span></a></li>`).join('')
    + `<li><a class="dsys__c dsys__c--story" href="#dsys-story" data-dsys-open="story"><span class="dsys__n" aria-hidden="true">&rarr;</span><b>See the Complete Sleep System</b><span class="dsys__cs">Follow one clear path, from your need to a mattress made for you.</span></a></li>`;

  const panels = `
<section class="dsys__p" id="dsys-t1" data-i="1" data-title="${esc(tc(topics[0][0]))}" aria-labelledby="dsys-t1-h">
<h3 class="dsys__h" id="dsys-t1-h" tabindex="-1">${esc(tc(topics[0][0]))}</h3>
<p class="dsys__lead">This is not a collection of random models. It is a system of answers.</p>
<p class="dsys__tx">Start from what you need. Each answer below leads to the models that were made for it.</p>
<ul class="dsys__rows">${needRows}${topperRow}</ul>
</section>

<section class="dsys__p" id="dsys-t2" data-i="2" data-title="${esc(tc(topics[1][0]))}" aria-labelledby="dsys-t2-h">
<h3 class="dsys__h" id="dsys-t2-h" tabindex="-1">${esc(tc(topics[1][0]))}</h3>
<p class="dsys__lead">Choosing firmness online should not be a guess. In our system it is a rule.</p>
<p class="dsys__safe"><b>Arranged for certainty.</b> For us firmness is not a word on a label. It is the measured balance between the support the latex gives and the way it adapts to the body, calculated for each body weight. Engineering, not marketing.</p>
<ol class="dsys__st">
<li><h4>Start With Your Body Weight</h4><p>Your weight points to one support range. Follow the range for your body weight and your choice rests on engineering.</p><ul class="dsys__ws">${weight}</ul></li>
<li><h4>Choose Your Depth</h4><p>Every model comes in real, measured depths. Depth is chosen after firmness, never instead of it.</p><ul class="dsys__kv">${depths}</ul></li>
<li><h4>Between Two Firmnesses? Use Dual Plush</h4><p>Dual Plush combines two firmnesses in one system: the latex mattress follows the body-weight rule, and a latex topper on top follows the comfort you prefer. The support stays right for you, and the comfort is yours to choose.</p></li>
<li><h4>Two Sleepers, Two Regulations</h4><p>Mattress for Partners gives each partner a core regulated for their own body weight (${esc(partnerSplits)}) under one shared latex topper.</p></li>
</ol>
<p class="dsys__made"><b>${esc(tc(madeList[0]))}.</b> ${esc(madeList[1])} These are selection guidelines, not medical rules.</p>
</section>

<section class="dsys__p" id="dsys-t3" data-i="3" data-title="${esc(tc(topics[2][0]))}" aria-labelledby="dsys-t3-h">
<h3 class="dsys__h" id="dsys-t3-h" tabindex="-1">${esc(tc(topics[2][0]))}</h3>
<p class="dsys__lead">${esc(M.principles[0][0])}.</p>
<div class="dsys__two">
<div class="dsys__box2"><h4>What We Use</h4><ul class="dsys__kv">${typeRows}</ul></div>
<div class="dsys__box2 dsys__box2--no"><h4>What We Do Not Use</h4><ul class="dsys__no"><li>Springs</li><li>Memory foam</li><li>Synthetic foam core</li></ul></div>
</div>
</section>

<section class="dsys__p" id="dsys-t4" data-i="4" data-title="${esc(tc(topics[3][0]))}" aria-labelledby="dsys-t4-h">
<h3 class="dsys__h" id="dsys-t4-h" tabindex="-1">${esc(tc(topics[3][0]))}</h3>
<p class="dsys__lead">Support and comfort are two different jobs, so each gets its own part.</p>
<div class="dsys__two">
<div class="dsys__box2"><h4>Seven-Zone Support</h4><p class="dsys__tx">Botanic, Bio Comfort, Orthopaedic Coconut Coir and Ambient carry seven-zone support inside the latex, so the body is held differently where it needs to be.</p></div>
<div class="dsys__box2"><h4>Bio Comfort: Newest Technology</h4><p class="dsys__tx">A seven-zone cellular-capsule core with a 7-Zone Synchroniser above it, for a lighter Cloud Comfort feel and a fresh, breathable sleep climate.</p></div>
</div>
<h4 class="dsys__sub">Dual Plush: ${pairsOf('botanic_dp').length} Combinations in Botanic, ${pairsOf('bio_dp').length} in Bio Comfort</h4>
<p class="dsys__tx">A latex mattress with a latex topper on top is one system. The mattress gives the support and the latex topper gives the comfort. Only compatible neighbours are combined, never more than two firmnesses.</p>
<ul class="dsys__dp">${dpFig}</ul>
</section>

<section class="dsys__p" id="dsys-t5" data-i="5" data-title="${esc(tc(topics[4][0]))}" aria-labelledby="dsys-t5-h">
<h3 class="dsys__h" id="dsys-t5-h" tabindex="-1">${esc(tc(topics[4][0]))}</h3>
<div class="dsys__bio"><img src="${bioImg}" width="255" height="101" loading="lazy" decoding="async" alt="Bio Dunlop"><div><p class="dsys__lead">Fully Certified</p><p class="dsys__tx">Certified European production for European customers and standards.</p></div></div>
<p class="dsys__tx">The same system, the same rules and the same care sit behind every model.</p>
</section>

<section class="dsys__p dsys__p--story" id="dsys-story" data-i="story" data-title="Complete Story" aria-labelledby="dsys-story-h">
<h3 class="dsys__h" id="dsys-story-h" tabindex="-1">The Complete Sleep System</h3>
<ol class="dsys__chain">
<li><b>Your Need</b><span>Every model answers a real need.</span></li>
<li><b>Your Body Weight</b><span>Soft, Medium, Firm or Extra Firm: one rule for every model.</span></li>
<li><b>Your Comfort</b><span>Real depths, and Dual Plush when you are between two firmnesses.</span></li>
<li><b>Pure Natural Latex</b><span>${esc(noList[1])}</span></li>
<li><b>Certified European Production</b><span>For European customers and standards.</span></li>
<li><b>Made to Order</b><span>${esc(madeList[1])}</span></li>
</ol>
<p class="dsys__fin">More than a mattress. A complete sleep system.</p>
<p class="dsys__go"><a class="dsys__find" href="#ddhd-mattress" data-dsys-find>Find Your Latex Mattress</a></p>
</section>`;

  return `<section class="dsys" id="ddhd-system" data-dsys aria-labelledby="dsys-h">
<div class="dsys__in">
<div class="dsys__band">
<p class="dsys__eb">The Divine Latex Sleep System</p>
<h2 class="dsys__t" id="dsys-h">What makes our latex sleep system different?</h2>
<p class="dsys__sl">Every model has a reason to exist.</p>
<p class="dsys__as">Choosing a firmness and a mattress online can feel like a risk. This system is arranged to take that risk away: you start from your need, your body weight points to your support, and every step has a clear reason.</p>
<ul class="dsys__cards">${cards}</ul>
</div>
<div class="dsys__dlg" data-dsys-dlg>
<div class="dsys__body">
${panels}
</div>
</div>
</div>
</section>`;
}
