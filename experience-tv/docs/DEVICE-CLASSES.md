# Device classes: what "a large screen" means (stage T0)

Status: **adopted from the owner's statement of 11 November 2026**: everything above a phone is a large screen. No device is named in the code; the engine and the loader decide from what the browser reports.

## 1. The rule

| Class | Rule | What it gets |
|---|---|---|
| **Phone** | The shortest side of the physical screen is under 600 CSS pixels (`screen.width`, `screen.height`) | The phone layer: the short guided configurator and the shortened description. The television bundle is never requested. |
| **Large screen** | The shortest side of the screen is 600 CSS pixels or more | The television, whose main job is to guide the selection and show the model. |

This is the rule the engine already uses (`Television.prototype.isPhone`) and the loader proposal uses (`docs/mobile/premium/proposals/loader-gate.js`). It does not depend on orientation (a phone held sideways has the same shortest side), on rotation, or on how wide a desktop window is dragged. A foldable phone unfolded to about 673 pixels counts as a large screen, which follows from the owner's rule.

Large screens are one class for behaviour. For layout, the television reacts to the **width of its own container**, not to the device (see the plan, stage T1):

| Layout | When | Today's form |
|---|---|---|
| Stacked | The container is narrower than the two-column minimum (portrait tablets, narrow windows) | The television full width above the product block |
| Two columns | Landscape tablets, laptops, monitors | The television at the top of the left column, the options beside it |
| Wide | Large monitors and ultrawide screens | Not yet defined; to be decided together with the owner's button specification |

## 2. Input, by capability

| Capability | Test | Effect |
|---|---|---|
| Touch | `pointer: coarse`, `maxTouchPoints` | Tap targets of at least 44 px; no behaviour that needs hover |
| Mouse and keyboard | `pointer: fine`, `hover: hover` | Hover states may add emphasis, never information |
| Both (a touch laptop, a tablet with a keyboard) | both present | Neither is assumed; the interface must work with either at any moment |
| Reduced motion | `prefers-reduced-motion` | No continuous motion; the small videos stay still |

## 3. Browser engines

| Engine | Examples |
|---|---|
| Blink | Chrome, Edge, Samsung Internet, Huawei Browser, Opera |
| WebKit | Safari on iPadOS and macOS (every browser on iPadOS uses WebKit) |
| Gecko | Firefox |

No code path asks which brand it is. A difference between the engines is handled by testing the feature (for example the fullscreen interface), never by the browser's name.

## 4. The reference device and the devices to be recorded

| Device | Screen as the browser reports it | Engine | Status |
|---|---|---|---|
| **iPad Pro 12.9 inch, 3rd generation (2018)** | 1024 × 1366 CSS pixels in portrait, 1366 × 1024 in landscape, device pixel ratio 2 | WebKit (Safari, iPadOS) | **The owner's real test device** (E4, in use) |
| A tablet of another make (for example Samsung Galaxy Tab, Huawei MatePad, Lenovo, Xiaomi, Microsoft Surface) | to be recorded when tested | Blink (or WebKit, Gecko) | Not yet tested on a real device |
| Laptop and monitor, 14 to 27 inch and wider | to be recorded when tested | any | Not yet tested on a real device |

The sizes of devices other than the owner's iPad Pro are deliberately not written here: they are recorded from the device when it is tested, not from memory.

## 5. What is tested, and how much it proves

| Test | What it proves | Level |
|---|---|---|
| `tests/guardrails.mjs`, rule G8: the same screen and four browser names (iPad Safari, Samsung Internet, Huawei Browser, Edge) | The layout does not change with the browser's name | Simulated, Chromium only |
| `tests/embed.mjs`, `tests/smoke.mjs` | The television's own logic on iPad-sized and desktop screens | Simulated |
| The owner's tests on the iPad Pro | Real Safari behaviour at this size | E4 (one device) |

What is **not** yet proven: Samsung Internet and Huawei Browser behaviour (video decoding, fullscreen, scrolling), real touch laptops, and large monitors beyond 1920 pixels. These stay open until a device of each kind is tested.
