// Every word and number of the "Four Laws" section, in one place. build.mjs puts the summary into the static tile
// and the detailed panels into dpl.js. Numbers come from the owner's technical brief (2026-10-25):
// densities of our production, published TEMPUR values, and typical ranges per material class from technical guides
// and independent technical sheets. Nothing here is typed twice.

export const HEAD = {
  eyebrow: 'Why Natural Dunlop Latex',
  title: 'One Natural Material. <b>Four Laws</b> of Good Sleep.',
  lede: 'A good mattress has to carry the body, adapt to it, let it breathe and keep the sleep space clean. Natural Dunlop latex does all four in one material. Tap a circle to see the physics and the numbers behind it.',
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
  cols: ['Density', 'Resilience', 'Recovery', 'Support Factor (SAG)', 'Air Channels', 'Heat Response'],
  rows: {
    pu: ['20–35 kg/m³', '25–45%', 'Fast', '1.9', 'Usually none', 'Moderate'],
    hr: ['35–60 kg/m³', '50–70%', 'Fast', '2.9–3.8', 'Usually none', 'Formula dependent'],
    mem: ['35–80 kg/m³, most 45–60', 'Under 20%', '3–15 seconds', '2.4–3.2', 'Usually none', 'High: softens with heat'],
    tempur: ['85 kg/m³ (published)', 'Not published', 'Deliberately delayed', 'Not published', 'Depends on the construction', 'Softens with body heat'],
    dun: ['63 · 75 · 83 kg/m³', '40–55%', 'Immediate', '4.5–5.4', 'Moulded through the core', 'Low'],
    bio: ['Natural Dunlop core', 'Natural Dunlop core', 'Immediate and local', 'To be measured', 'Full depth plus capsule spaces', 'Low'],
  },
  note: 'Typical ranges per material class from technical guides and published studies. TEMPUR® values as published by Tempur. Natural Dunlop: our production densities (Soft 63, Medium 75, Firm 83 kg/m³) and independent technical sheets for 100% natural Dunlop latex. Whole-core values for Bio Comfort are not yet measured and are not shown as numbers. TEMPUR® is a registered trademark of its owner and is named for comparison only.',
};

// chart kinds: 'radial' = one ring per material, arc length = value / max (a range draws solid to its low end, light to its high end)
//              'petals' = four equal forms around the circle (pillar 4 has no scale to compare, only facts)
export const PILLARS = [
  {
    id: 'support', label: 'Support', n: 1, title: 'Support', verb: 'Carries', img: 'support',
    alt: 'A woman lying on her side on a seven-zone latex mattress, her spine straight',
    key: ['1.8–2.4×', 'the density of standard mattress foam'],
    short: 'More supporting material in every cubic metre, answering the body at once.',
    head: 'More Material. More Responsive Support.',
    chart: {
      kind: 'radial', unit: 'kg/m³', max: 90, label: 'Density',
      card: ['pu', 'mem', 'tempur', 'dun'],
      rings: [
        { m: 'pu', lo: 20, hi: 35, v: '20–35 kg/m³' },
        { m: 'hr', lo: 35, hi: 60, v: '35–60 kg/m³' },
        { m: 'mem', lo: 45, hi: 60, v: '45–60 kg/m³, range 35–80' },
        { m: 'tempur', lo: 85, v: '85 kg/m³ (published)' },
        { m: 'dun', lo: 63, hi: 83, v: '63 · 75 · 83 kg/m³', name: 'Natural Dunlop Soft · Medium · Firm' },
      ],
    },
    body: [
      'Standard mattress foam commonly has a density of 20–35 kg/m³. Our natural Dunlop latex is produced at 63 kg/m³ for Soft, 75 kg/m³ for Medium and 83 kg/m³ for Firm.',
      'Even our Soft latex starts at 1.8 times the upper density of conventional foam. Medium is 2.1 times and Firm 2.4 times.',
      'Density alone does not set firmness. It tells how much supporting material there is, how durable it is and how well it keeps its original performance. Natural Dunlop latex adds immediate elasticity and progressive resistance to that density, and seven anatomical zones carry the head, shoulders, back, pelvis, knees, legs and ankles.',
    ],
    stats: [['63 kg/m³', 'Soft'], ['75 kg/m³', 'Medium'], ['83 kg/m³', 'Firm'], ['20–35 kg/m³', 'Standard foam']],
    vs: {
      q: 'How Is This Different From TEMPUR®?',
      a: 'TEMPUR® is a premium viscoelastic material with a published density of 85 kg/m³, comparable to our Firm latex. The two work differently: TEMPUR® responds slowly to body heat and pressure, natural Dunlop latex responds immediately and returns energy through its natural elasticity. The difference is the type of response, not the density.',
    },
  },
  {
    id: 'adapt', label: 'Adaptability', n: 2, title: 'Adaptability', verb: 'Adapts', img: 'adapt',
    alt: 'A woman resting on a latex mattress that follows the curve of an adjustable bed',
    key: ['4.5–5.4', 'progressive support factor (SAG)'],
    short: 'Adapts the instant you move and pushes back as pressure grows. Held on the surface, not in it.',
    head: 'Adaptation Through Elasticity, Not Delayed Sinking.',
    chart: {
      kind: 'radial', unit: 'SAG factor', max: 6, label: 'Support factor',
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
      'Memory foam adapts by slowly letting the body sink into the material. Natural Dunlop latex adapts through immediate elastic deformation and progressive resistance: as pressure grows, the support grows with it.',
      'When you move, the latex follows and recovers at once, keeping contact without holding the previous impression. This is supportive cloud comfort: it does not envelop or press, it keeps you on the surface with a balance of support and adaptation.',
      'A high bounce alone is not adaptation: HR foam can rebound more. Real adaptation needs an immediate response plus progressive support, and that is where latex leads, with low energy loss (hysteresis 20–32%).',
      'Bio Comfort refines this on four levels: material, capsule, progressive and 7-Zone Synchroniser adaptation. Its cellular-capsule core lets each area respond on its own, while the Synchroniser spreads pressure across the surface.',
    ],
    quote: 'Memory foam remembers where the body was. Natural latex responds to where the body is.',
    stats: [['Immediate', 'Latex recovery'], ['3–15 s', 'Memory foam recovery'], ['40–55%', 'Latex resilience'], ['Under 20%', 'Memory foam resilience']],
    vs: {
      q: 'And TEMPUR®?',
      a: 'TEMPUR® publishes no ISO resilience or recovery values. It confirms a temperature-sensitive response and delayed recovery, and feels firmer at 18 °C or below. Its adaptation is real, but viscoelastic. Ours is dynamic and elastic.',
    },
  },
  {
    id: 'breathe', label: 'Ventilation', n: 3, title: 'Ventilation', verb: 'Breathes', img: 'breathe',
    alt: 'Cross-section of a latex core with air rising through its vertical channels',
    key: ['3 scales', 'of airflow in Bio Comfort'],
    short: 'Open cells, channels through the full depth and open capsule spaces let heat and moisture leave.',
    head: 'Temperature Comfort Through Architecture, Not Chemical Cooling.',
    chart: {
      kind: 'radial', unit: 'airflow scales', max: 3, label: 'Airflow scales',
      card: ['pu', 'mem', 'dun', 'bio'],
      rings: [
        { m: 'pu', lo: 1, v: '1: micro-cells' },
        { m: 'mem', lo: 1, v: '1: finer cells' },
        { m: 'tempur', lo: 1, v: '1: channels depend on the construction' },
        { m: 'dun', lo: 2, v: '2: open cells and vertical channels' },
        { m: 'bio', lo: 3, v: '3: cells, channels and capsule spaces' },
      ],
    },
    body: [
      'No passive foam produces cold. The aim is to stop heat and moisture building up above the comfort zone at body contact, 32.3–33.8 °C.',
      'Natural Dunlop latex breathes on two scales: its open-cell structure and vertical channels moulded through the whole core. Bio Comfort adds a third: open spaces between its capsules, so air and moisture also move sideways, away from the area under the body. When you turn, the capsules compress and recover and move a small volume of air through the channels: passive air exchange through movement.',
      'Memory foam can be open-cell and still sleep warmer: it softens with body heat, the body sinks deeper, more skin touches the foam, and slow recovery limits airflow when you turn.',
      'Bio Comfort uses no cooling gels, no phase-change coatings and no synthetic cool-to-the-touch finish. Its geometry stays open all night: designed to reduce heat and moisture build-up, for a drier, more temperature-balanced sleep microclimate.',
    ],
    stats: [['Open-cell', 'Latex structure'], ['Full depth', 'Vertical channels'], ['Sideways', 'Bio Comfort capsule airflow'], ['32.3–33.8 °C', 'Skin contact comfort zone']],
    vs: {
      q: 'And TEMPUR®?',
      a: 'TEMPUR® reports a seven-hour climate-mannequin test, but not its full conditions or the competitor results. Its SmartCool effect sits mainly in the cover: cooling at first touch, not airflow through the core.',
    },
  },
  {
    id: 'natural', label: 'Origin', n: 4, title: 'Natural & Bio Origin', verb: 'Is Natural', img: 'natural',
    alt: 'Natural latex flowing from a rubber tree into a collecting cup',
    key: ['100%', 'natural Dunlop latex'],
    short: 'Natural support and natural adaptation, fully certified and produced in Europe.',
    head: 'Natural Support. Natural Adaptation. A Clean Place to Sleep.',
    chart: { kind: 'petals', label: 'Origin', petals: ['100% Natural Latex', '100% Bio-Recyclable', 'Fully Certified', 'Made in Europe'] },
    body: [
      '100% natural Dunlop latex. No springs, no memory foam, no synthetic foam base. The support and the adaptation both come from the same natural material.',
      '100% bio-recyclable and biodegradable: healthy for us, healthy for our planet. No cooling gels and no chemical coatings: the comfort comes from the material and its architecture.',
      'Fully certified, including certification for baby use (OEKO-TEX® Standard 100, Class I).',
      'Certified European production for European customers and standards. Every mattress is made in Europe, with no production outsourced outside it, and made to order: size, firmness, depth and cover as confirmed with you.',
    ],
    stats: [['100%', 'Natural latex'], ['100%', 'Bio-recyclable'], ['Class I', 'OEKO-TEX® for babies'], ['Europe', 'Production']],
  },
];

export const FOOT = {
  compare: 'Compare All Materials',
  system: 'See How We Build Your System',
  systemLead: 'Four laws, one material. Next: how we turn them into your mattress.',
};
