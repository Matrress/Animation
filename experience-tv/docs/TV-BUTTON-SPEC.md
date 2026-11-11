# Specification of the large-screen buttons (the television)

Status: **template for the owner**. The owner specifies each button of the large monitor: what it shows, what it is called, and where it leads. This file is pre-filled with what the television does today (read from `products/botanic.config.js`: 14 chapters, 35 panels), so every decision is a change to a visible line, not a blank page. Nothing here changes the television yet.

It applies to **every large screen**: monitors, laptops and tablets of any make (the rule is in `docs/DEVICE-CLASSES.md`).

## How to fill it

For each line write one of: **keep**, **rename**, **merge into …**, **move to …**, **remove**, **new**. Then fill the right-hand columns only where the answer is not "keep".

| Column | Meaning |
|---|---|
| New label | The words on the button (British English, interface text only) |
| What it shows | The screen: which sections, which video, which selection, which facts |
| Leads to | The next screen or action (a step in the selection, a video, a link, a form) |
| Orientation | Forward (→), back (←), open (+), close (×), play (▶), leave the page (↗) |
| Notes | Anything else: when it appears, what it depends on, what Ecwid must do |

## A. The chapters and panels today

Today's order. "Group" is the television's own split: **Select** (the customer chooses) and **Learn** (the customer reads). "Tour" says whether the automatic presentation includes it.

| Chapter | Panel | Group | Screen | Tour | Decision | New label | What it shows | Leads to | Orientation |
|---|---|---|---|---|---|---|---|---|---|
| Discover | Introduction | – | hero | yes | | | | | |
| Discover | At a Glance | – | facts | yes | | | | | |
| Firmness | Choose | Select | choose | yes | | | | | |
| Firmness | Your firmness | Select | result (result) | no | | | | | |
| Firmness | Correct vs Softer | Learn | reader | yes | | | | | |
| Firmness | How It Works | Learn | reader | yes | | | | | |
| Firmness | Who It Is For | Learn | reader | yes | | | | | |
| Comfort | What To Expect | – | reader | yes | | | | | |
| Comfort | Latex Behaviour | – | reader | yes | | | | | |
| Height | Choose height | Select | choose | yes | | | | | |
| Height | Your height | Select | result (result) | no | | | | | |
| Height | Choose size | Select | choose (result) | yes | | | | | |
| Height | Why Height Matters | Learn | reader | yes | | | | | |
| Covers | Choose cover | Select | choose | yes | | | | | |
| Covers | Your cover | Select | result (result) | no | | | | | |
| Covers | Materials | Learn | compare | yes | | | | | |
| Covers | Cover System | Learn | reader | yes | | | | | |
| Benefits | Origin | – | points | yes | | | | | |
| Benefits | Why Latex | – | reader | yes | | | | | |
| Support | Bearing Force | – | points | yes | | | | | |
| Support | Support + Adaptation | – | reader | yes | | | | | |
| Adaptation | Elasticity | – | points | yes | | | | | |
| Adaptation | How It Feels | – | reader | yes | | | | | |
| 7-Zone | Zone Map | – | zones | yes | | | | | |
| 7-Zone | Zone By Zone | – | reader | yes | | | | | |
| Ventilation | Airflow | – | points | yes | | | | | |
| Ventilation | Why It Matters | – | reader | yes | | | | | |
| Hygiene | Cleaner Sleep | – | points | yes | | | | | |
| Hygiene | Realistic Picture | – | reader | yes | | | | | |
| Certifications | Certifications | – | points | yes | | | | | |
| Certifications | Where It Is Made | – | reader | yes | | | | | |
| Warranty | Warranty + Gift | – | numerals | yes | | | | | |
| Warranty | Conditions | – | reader | yes | | | | | |
| Delivery | Made To Order | – | reader | yes | | | | | |
| Delivery | Your Botanic | – | summary | yes | | | | | |

## B. Controls that belong to the whole television (today, to be confirmed against the running television)

| Control | Role | Decision | New label | What it shows or does | Leads to | Orientation |
|---|---|---|---|---|---|---|
| Chapter buttons (two rows of seven) | Navigation | | | | | |
| Previous / Next | Navigation | | | | | ← / → |
| Your selection (the four choices) | Summary | | | | | |
| Price (read from Ecwid, never calculated by us) | Information | | | | | |
| View Model Gallery | Opens the product's own photographs inside the monitor | | | | | ↗ in the monitor |
| Optimised Preview / Standard Product View | Switches between the television and the store's own page | | | | | |
| Full presentation video | Plays the whole video, with sound | | | | | ▶ |
| Small videos (about 7 to 10 seconds, looping) | Orientation only; they are not to be enlarged | | | | | |
| Classic View | The original description | | | | | |

## C. The selection, step by step (decisions that change the code)

Each line is a decision for the owner. Today's behaviour is on the left; the mobile configurator's approved behaviour is a candidate on the right.

| Topic | The television today | Approved on the phone (a candidate) | Decision |
|---|---|---|---|
| Order of the steps | Firmness, Height, Size, Covers | Size, Firmness, Depth, Cover, Review | |
| Size | A choose screen with the sizes drawn to scale | 22 sizes in 4 groups, price from Ecwid, "starting price" while only the size is chosen | |
| Firmness guidance | Choose the range that holds your body weight (approved values only) | Body weight and height guide the choice; the other firmnesses fade; Extra Firm is a link to the specialist model | |
| Extra Firm | A choice in the same list | A plain link to the Orthopaedic Coconut Core page, followed only when tapped | |
| Review | The "Your selection" panel | A "Review Your Order" step with the four choices and the price | |
| Custom sizes | – | A contact form: the model (filled in), the size wanted, an email for the reply; requests go to the owner's mailbox | |
| Price | Read from Ecwid | Read from Ecwid, never calculated by us | keep |

## D. Rules every button must follow

1. One role and one orientation (`docs/FINALISATION-PLAN.md`, section 2).
2. White text on the dark turquoise surfaces; dark text on the light ground; sky blue is a line or a mark, never text on a light ground.
3. A visible focus ring, a tap target of at least 44 px on touch, and a label for the screen reader.
4. The text of every chapter stays in the page (`docs/SEO-AND-PERFORMANCE-GUARDRAILS.md`); a button never hides content that only a click could bring back.
5. No price, option or cart action is calculated or stored by us; Ecwid stays the source of truth.
