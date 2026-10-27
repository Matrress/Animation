// Every word and number of the "Four Laws" section, in one place. build.mjs puts the summary into the static tile
// and the detailed panels into dpl.js. Numbers come from the owner's technical brief (2026-10-25):
// densities of our production, published TEMPUR values, and typical ranges per material class from technical guides
// and independent technical sheets. Nothing here is typed twice.

export const HEAD = {
  eyebrow: 'Why Natural Latex Mattresses and Toppers',
  title: 'One Natural Material. <b>Four Laws</b> of Good Sleep.',
  planet: ['Healthy for Us', 'Healthy for', 'Our Planet'],   // the slogan across the turning Earth (the Hero's own words)
  lede: 'A good mattress has to come from clean material, carry the body, adapt to it and let it breathe. Natural Dunlop latex does all four in one material, in every Natural Latex Mattress and Natural Latex Topper we make. Tap a circle to see the engineering and the numbers behind it.',
};

// the six material classes of the comparison. TEMPUR is its own class, never mixed with ordinary memory foam.
export const MATERIALS = [
  { id: 'pu', name: 'Standard PU Foam', how: 'Surface compression, weaker progressive support' },
  { id: 'hr', name: 'HR Foam', how: 'High bounce, quality depends on the formula' },
  { id: 'mem', name: 'Memory Foam', how: 'Slow viscoelastic sinking' },
  { id: 'tempur', name: 'TEMPUR® Material', how: 'Temperature-activated viscoelastic contouring' },
  { id: 'dun', name: 'Natural Dunlop Latex', how: 'Immediate elastic adaptation with progressive support', ours: true },
  { id: 'bio', name: 'Bio Comfort', how: 'Material, capsule, progressive and zonal adaptation', ours: true },
];

// the comparison table: one row per material, the same order as MATERIALS
export const COMPARE = {
  cols: ['Density', 'Resilience', 'Recovery', 'Progressive Response (SAG)', 'Air Channels', 'Heat Response'],
  rows: {
    pu: ['20–35 kg/m³', '25–45%', 'Fast', '1.9', 'Usually none', 'Moderate'],
    hr: ['35–60 kg/m³', '50–70%', 'Fast', '2.9–3.8', 'Usually none', 'Formula dependent'],
    mem: ['35–80 kg/m³, most 45–60', 'Under 20%', '3–15 seconds', '2.4–3.2', 'Usually none', 'High: softens with heat'],
    tempur: ['83–85 kg/m³ (published, one material of the build)', 'Not published', 'Deliberately delayed', 'Not published', 'Depends on the construction', 'Softens with body heat'],
    dun: ['63 · 75 · 83 · 88 kg/m³, whole core', '40–55%', 'Immediate', '4.5–5.4', 'Moulded through the core', 'Low'],
    bio: ['Natural Dunlop core', 'Natural Dunlop core', 'Immediate and local', 'To be measured', 'Full depth plus capsule spaces', 'Low'],
  },
  note: 'Typical ranges per material class from technical guides and published studies. TEMPUR® values as published by Tempur; its density describes one material of the build, not the whole core. Natural Dunlop: the density of our whole core (Soft 63, Medium 75, Firm 83, Extra Firm 88 kg/m³) and independent technical sheets for 100% natural Dunlop latex. Whole-core values for Bio Comfort are not yet measured and are not shown as numbers. TEMPUR® is a registered trademark of its owner and is named for comparison only.',
};

// chart kinds: 'radial' = one ring per material, arc length = value / max (a range draws solid to its low end, light to its high end)
//              'petals' = four equal forms around the circle (the law of origin has no scale to compare, only facts)
// sub: the deeper paragraphs under a law, opened on demand. fig: 'zones' (the seven zones) or a chain of cause and effect.
export const PILLARS = [
  {
    id: 'natural', label: 'Origin', n: 1, title: 'Natural & Bio Origin', verb: 'Is Natural', img: 'natural',
    alt: 'Natural latex flowing from a rubber tree into a collecting cup',
    key: ['100%', 'natural Dunlop latex'],
    short: 'Natural support and natural adaptation, fully certified and produced in Europe.',
    head: 'Natural Support. Natural Adaptation. A Clean Place to Sleep.',
    chart: { kind: 'petals', label: 'Origin', petals: ['100% Natural Latex', '100% Bio-Recyclable', 'Fully Certified', 'Made in Europe'] },
    body: [
      '100% natural Dunlop latex. No springs, no memory foam, no synthetic foam base. The support and the adaptation both come from the same natural material, and the three laws that follow are properties of that material, not of added parts.',
      '100% bio-recyclable and biodegradable: healthy for us, healthy for our planet. No cooling gels and no chemical coatings: the comfort comes from the material and its architecture.',
      'Fully certified, including certification for baby use (OEKO-TEX® Standard 100, Class I).',
      'Certified European production for European customers and standards. Every mattress is made in Europe, with no production outsourced outside it, and made to order: size, firmness, depth and cover as confirmed with you.',
    ],
    stats: [['100%', 'Natural latex'], ['100%', 'Bio-recyclable'], ['Class I', 'OEKO-TEX® for babies'], ['Europe', 'Production']],
  },
  {
    id: 'support', label: 'Support', n: 2, title: 'Support', verb: 'Carries', img: 'support',
    alt: 'A woman lying on her side on a seven-zone latex mattress, her spine straight',
    key: ['On, Not In', 'the body is held above the mattress and topper'],
    short: 'Support carries the body on the surface, so the spine keeps its line instead of sinking into the mattress.',
    head: 'Support Holds the Body Above the Mattress, Not Inside It.',
    chart: {
      kind: 'radial', unit: 'kg/m³', max: 90, label: 'Density',
      card: ['pu', 'mem', 'tempur', 'dun'],
      rings: [
        { m: 'pu', lo: 20, hi: 35, v: '20–35 kg/m³' },
        { m: 'hr', lo: 35, hi: 60, v: '35–60 kg/m³' },
        { m: 'mem', lo: 45, hi: 60, v: '45–60 kg/m³, range 35–80' },
        { m: 'tempur', lo: 83, hi: 85, v: '83–85 kg/m³, one material of the build', rv: '83–85 kg/m³' },
        { m: 'dun', lo: 63, hi: 88, v: '63 · 75 · 83 · 88 kg/m³, whole core', rv: '88 kg/m³', name: 'Natural Dunlop, Soft to Extra Firm' },
      ],
    },
    body: [
      'Good support keeps the body on the surface of the mattress and topper, not inside them. The shoulders and hips are allowed in just enough, the waist and the back are held from below, and the spine keeps its natural line.',
      'That needs material. The density of our natural Dunlop latex is the density of the whole core: 63 kg/m³ in Soft, 75 in Medium, 83 in Firm and 88 kg/m³ in Extra Firm. Standard mattress foam is commonly 20–35 kg/m³. In the Orthopaedic, natural coconut coir is added to the Extra Firm latex and raises the density of the base further still.',
      'Density alone does not set firmness. It tells how much supporting material there is, how durable it is and how well it keeps its original performance. Natural Dunlop latex adds immediate elasticity and progressive resistance to that density.',
    ],
    sub: [
      {
        t: 'Seven Zones and the Stretching Effect', fig: 'zones',
        zones: [['Head', 14], ['Shoulders', 17], ['Back', 13], ['Pelvis', 17], ['Knees', 12], ['Legs', 14], ['Ankles', 13]],
        body: [
          'Every model we make is zoned in seven. Each zone has its own support, matched to the part of the body that lies on it: head, shoulders, back, pelvis, knees, legs and ankles.',
          'Together the zones create the stretching effect: the heavier parts are carried, the lighter ones are not pushed up, and the spine lies long and straight, held from below instead of bent into the mattress.',
        ],
      },
    ],
    stats: [['88 kg/m³', 'Extra Firm core'], ['83 kg/m³', 'Firm core'], ['63 · 75 kg/m³', 'Soft · Medium core'], ['20–35 kg/m³', 'Standard foam']],
    vs: {
      q: 'How Is This Different From TEMPUR®?',
      a: 'TEMPUR® publishes a density of 83–85 kg/m³ for one material of its build. Our numbers are the density of the whole natural latex core: 83 kg/m³ in Firm and 88 kg/m³ in Extra Firm, and more again where natural coconut coir is added. The response differs too: TEMPUR® answers slowly to body heat and pressure, natural Dunlop latex answers at once and returns energy through its natural elasticity.',
    },
  },
  {
    id: 'adapt', label: 'Adaptability', n: 3, title: 'Adaptability', verb: 'Adapts', img: 'adapt',
    alt: 'A woman resting on a latex mattress that follows the curve of an adjustable bed',
    key: ['Instant', 'adaptation, the moment you move'],
    short: 'Follows every movement at once and recovers at once. No delayed sinking, no impression left behind.',
    head: 'Instant Adaptation Through Elasticity, Not Delayed Sinking.',
    chart: {
      kind: 'radial', unit: 'ratio', max: 6, label: 'Progressive Response',
      card: ['pu', 'mem', 'hr', 'dun'],
      rings: [
        { m: 'pu', lo: 1.9, v: '1.9' },
        { m: 'mem', lo: 2.4, hi: 3.2, v: '2.4–3.2' },
        { m: 'hr', lo: 2.9, hi: 3.8, v: '2.9–3.8' },
        { m: 'tempur', none: true, v: 'Not published' },
        { m: 'dun', lo: 4.5, hi: 5.4, v: '4.5–5.4' },
      ],
    },
    body: [
      'Natural Dunlop latex adapts the instant pressure arrives, through elastic deformation, and the instant you move it recovers. Memory foam adapts by slowly letting the body sink in, and takes 3 to 15 seconds to come back.',
      'Its resistance is progressive: as pressure grows, the support grows with it. The ring shows that response (the SAG ratio of firmness under deep and light pressure): 4.5–5.4 for natural Dunlop latex, 2.4–3.2 for memory foam.',
      'When you turn, the latex follows and keeps contact without holding the previous impression. This is supportive cloud comfort: it does not envelop or press, it keeps you on the surface. And a high bounce alone is not adaptation: HR foam can rebound more. Real adaptation is an immediate response plus progressive support, with low energy loss (hysteresis 20–32%).',
    ],
    quote: 'Memory foam remembers where the body was. Natural latex responds to where the body is.',
    sub: [
      {
        t: 'Four Levels of Adaptation in Bio Comfort', list: [
          ['Material', 'The natural latex itself answers at once, everywhere it is touched.'],
          ['Capsule', 'The cellular-capsule core lets each small area respond on its own.'],
          ['Progressive', 'Resistance rises as pressure rises, so deeper pressure meets more support.'],
          ['Zonal', 'The 7-Zone Synchroniser spreads pressure across the surface, zone by zone.'],
        ],
      },
    ],
    stats: [['Immediate', 'Latex recovery'], ['3–15 s', 'Memory foam recovery'], ['40–55%', 'Latex resilience'], ['Under 20%', 'Memory foam resilience']],
    vs: {
      q: 'And TEMPUR®?',
      a: 'TEMPUR® publishes no ISO resilience or recovery values. It confirms a temperature-sensitive response and delayed recovery, and feels firmer at 18 °C or below. Its adaptation is real, but viscoelastic and delayed. Ours is instant and elastic.',
    },
  },
  {
    id: 'breathe', label: 'Ventilation', n: 4, title: 'Ventilation', verb: 'Breathes', img: 'breathe',
    alt: 'Cross-section of a latex core with air rising through its vertical channels',
    key: ['No More Overheating', 'air moves through the whole core'],
    short: 'Open cells and channels through the full depth carry heat and moisture away, all night.',
    head: 'Ventilation. Temperature Comfort. No More Overheating.',
    chain: [
      ['Ventilation', 'Open cells and channels through the full core'],
      ['Temperature Comfort', 'Heat and moisture leave instead of building up'],
      ['No More Overheating', 'A drier, balanced sleep climate all night'],
    ],
    chart: {
      kind: 'radial', unit: 'airflow scales', max: 3, label: 'Airflow Scales',
      card: ['pu', 'mem', 'dun', 'bio'],
      rings: [
        { m: 'pu', lo: 1, v: '1: micro-cells', rv: '1 scale' },
        { m: 'mem', lo: 1, v: '1: finer cells', rv: '1 scale' },
        { m: 'tempur', lo: 1, v: '1: channels depend on the construction', rv: '1 scale' },
        { m: 'dun', lo: 2, v: '2: open cells and vertical channels', rv: '2 scales' },
        { m: 'bio', lo: 3, v: '3: cells, channels and capsule spaces', rv: '3 scales' },
      ],
    },
    body: [
      'Natural latex breathes by its structure. Its cells are open, and our cores have vertical channels moulded through the whole depth, so the warm, moist air under the body has a way out and fresh air a way in.',
      'Bio Comfort adds a third scale: open spaces between its capsules, so air and moisture also move sideways, away from the area under the body. When you turn, the core compresses and recovers and moves a small volume of air through the channels: passive air exchange through movement.',
      'Memory foam can be open-cell and still sleep warmer: it softens with body heat, the body sinks deeper, more skin touches the foam, and slow recovery limits airflow when you turn.',
    ],
    sub: [
      {
        t: 'Temperature Comfort, the Underrated Factor', body: [
          'Temperature comfort decides how deeply and how calmly you sleep, and it is the factor most often left out. At body contact the comfort zone is 32.3–33.8 °C. Above it, the body turns, sweats and wakes.',
          'No passive material produces cold. Cooling gels and coatings feel cool at first touch and then warm up. Open latex with channels through the full core does something different: it keeps heat and moisture from building up, from the first minute to the last, with no gels, no phase-change coatings and no synthetic finishes.',
        ],
      },
      {
        t: 'A Hygienic, Hypoallergenic Sleep Space', chain: [
          ['High Ventilation', 'A drier microclimate in the core'],
          ['Fewer Mites and Bacteria', 'They need warmth and moisture to grow'],
          ['Hypoallergenic Sleep', 'A cleaner space night after night'],
        ],
        body: [
          'Natural latex is anti-dust-mite, antibacterial and hypoallergenic by nature, and ventilation keeps it that way: a dry, airy core gives mites, mould and bacteria little to live on.',
          'That is why natural latex is so often chosen by people with allergies and by people with asthma.',
        ],
      },
    ],
    stats: [['Open-cell', 'Latex structure'], ['Full depth', 'Vertical channels'], ['Sideways', 'Bio Comfort capsule airflow'], ['32.3–33.8 °C', 'Skin contact comfort zone']],
    vs: {
      q: 'And TEMPUR®?',
      a: 'TEMPUR® reports a seven-hour climate-mannequin test, but not its full conditions or the competitor results. Its SmartCool effect sits mainly in the cover: cooling at first touch, not airflow through the core.',
    },
  },
];

export const FOOT = {
  compare: 'Compare All Materials',
  system: 'See How We Build Your System',
  systemLead: 'Four laws, one material. Next: how we turn them into your mattress.',
};

// The engineering creed between the two parts. The owner's own words (resource artwork, 2026-10-26).
export const CREED = {
  quote: ['For us, a mattress is not a piece of furniture.', 'For us, the mattress is a conception for healthy sleep.'],
  text: 'We work at engineering level. Every number in this section comes from our production, from published values or from independent technical sheets. Marketing only shows what the engineering already does.',
};

// The second structure: what makes US different, once the four laws of the material are clear.
// Facts: approved Collection 3.13.2 (pure latex systems: no springs, no memory foam, no synthetic foam core; Dual Plush is a latex
// mattress for support plus a separate latex topper for comfort, two different latex firmnesses, 3 pairings in Botanic, 2 in Bio
// Comfort; Mattress for Partners = two individually regulated latex mattresses under one shared topper; Orthopaedic = Extra Firm
// natural Dunlop latex stabilised with coconut coir, two firm sides; made to order in size, firmness, depth and cover) and the
// owner's whole-core densities (Soft 63, Medium 75, Firm 83, Extra Firm 88 kg/m3). The owner confirmed (2026-10-25) that the
// coconut coir is a natural product, and (2026-10-26) that Dual Plush is a secured system: the topper goes to the next adequate
// firmness, not a free choice. No body-weight ranges here: they live in the Firmness block above and in the Hero card.
export const DIFF = {
  eyebrow: 'How We Are Different',
  title: 'Only Natural Dunlop Latex. <b>Engineered Around You.</b>',
  lede: 'The four laws belong to the material. What we do with it is ours: engineering research, custom-made production, firmness regulated by engineering rules, and solutions for one sleeper, for two, and for firm orthopaedic comfort. Every Natural Latex Mattress and Natural Latex Topper is made to order.',
  // nine cells, three to a row. Wellness leads; 'more' = its longer text, a native <details> in the cell (readable without script) that opens across the whole row.
  tiles: [
    {
      id: 'wellness', icon: 'moon', title: 'Wellness by Engineering',
      text: 'Wellness is not an add-on or an extra feature. It is the outcome of an engineered sleep concept.',
      more: {
        label: 'Full Wellness Concept',
        paras: [
          'Sleep is the body’s most powerful natural regenerative process. During sleep, cellular regeneration is at its strongest, and the nervous and musculoskeletal systems recover at a deep level.',
          'Cell division is essential for tissue repair, recovery and long-term balance in the body. It happens most effectively during deep, uninterrupted sleep. When the body is given the right conditions, this process unfolds naturally and correctly, without stress or disruption.',
          'For this regeneration to happen properly, the body needs a correctly engineered sleep environment, not a subjective feeling of softness or comfort:',
        ],
        list: [
          'Anatomical adaptation that follows the natural curves of the body.',
          'Orthopaedic support that stabilises the spine and distributes load correctly.',
          'A genuinely natural and clean environment, free from synthetic foams and harmful emissions.',
          'Continuous ventilation and thermal balance for calm, uninterrupted sleep.',
        ],
        close: 'When these elements work together by design, sleep becomes deep, stable and regenerative. That is what wellness means in real sleep engineering.',
      },
    },
    { id: 'research', icon: 'research', title: 'Engineering Research', text: 'Everything we regulate follows one idea: you can shop online with peace of mind. We give you rules for every choice, not only a list of our options, so when you follow our regulations your selection is in order. Comfort is personal. Even so, we keep regulations and service without compromises.' },
    { id: 'pure', icon: 'leaf', title: 'Pure Natural Dunlop Latex', text: 'Natural Dunlop latex in every Natural Latex Mattress and Natural Latex Topper. No springs, no memory foam, no synthetic foam core. Even the coconut coir in our Orthopaedic is natural.' },
    { id: 'regulated', icon: 'slider', title: 'Firmness Regulated by Body Weight', text: 'Your weight sets Soft, Medium, Firm or Extra Firm by engineering rules, not by guesswork. The whole core is made at 63, 75, 83 and 88 kg/m³.' },
    { id: 'dual', icon: 'pair', title: 'The Dual Plush System', text: 'A latex mattress for support and a latex topper for comfort, with nothing between them. The topper is regulated to the next adequate firmness, not chosen freely, so the comfort is tuned and the support stays secured.' },
    { id: 'partners', icon: 'partners', title: 'Partner’s Comfort', text: 'A side for her and a side for him. Mattress for Partners is two individually regulated latex mattresses under one shared topper, so each side has the firmness its sleeper needs.' },
    { id: 'ortho', icon: 'spine', title: 'Firm Orthopaedic Comfort', text: 'For sleepers who want only firm comfort: Extra Firm natural Dunlop latex stabilised with natural coconut coir, with two firm sides and seven-zone support.' },
    { id: 'custom', icon: 'stack', title: 'Custom Made, in High Variety', text: 'Every Natural Latex Mattress and Natural Latex Topper is custom made. You choose among many variations to reach the balance you need between anatomical support and design, and bring home a selection of verified, certified solutions. Heights are customised too, not only the standard size, because individuality is part of the product.' },
    { id: 'order', icon: 'frame', title: 'Fine-Tuned Before It Is Made', text: 'Size, depth, firmness and cover are confirmed with you, so every sleep system is made for one body and one bed.' },
  ],
  quote: 'Not one mattress for everyone. A natural latex solution made for you.',
  ctas: { mattress: 'Find Your Natural Latex Mattress', topper: 'Find Your Natural Latex Topper', firmness: 'Find Your Firmness' },
};
