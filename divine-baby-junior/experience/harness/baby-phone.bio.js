/* Divine DunlopDreams · Baby & Junior Experience: the phone layer (guided configuration).
   Same scheme as Botanic TV, for the Dunlop Baby & Junior mattress. Ecwid stays the executor: options, price, bag and checkout are the shop's own.
   Acts only on the listed product; ?ddtv=off switches it off. Built by experience/build.py. */
(function () {
  'use strict';
  if (/[?&]ddtv=off\b/.test(location.search) || window.__DDBABY_PHONE) { return; }
  window.__DDBABY_PHONE = 1;
var DATA = {"model":"baby","product":{"id":644897086,"brand":[["b","Dunlop"],["i","Baby & Junior"],["s","100%"],["b","Natural Latex"],["s","Mattress"]],"name":"Dunlop Baby & Junior 100% Natural Latex Mattress","intro":"A natural environment for your baby, from 100% natural latex: a single core of Dunlop latex in a quilted 100% cotton cover, with nothing else added. For your baby's first nights, and for your child's growing years.","heroHead":"One piece of natural latex"},"groups":[{"key":"cot","name":"Single sizes","sub":"Test"},{"key":"junior","name":"Double sizes","sub":"Test"}],"sizes":[{"w":80,"l":200,"g":"cot"},{"w":90,"l":200,"g":"cot"},{"w":100,"l":200,"g":"cot"},{"w":120,"l":200,"g":"junior"},{"w":140,"l":200,"g":"junior"}],"heights":[{"cm":23,"name":"23 cm","sub":"","desc":"Test."},{"cm":26,"name":"26 cm","sub":"","desc":"Test."}],"videos":{"origin":{"url":"https://media.divinedunlop.com/videos/natural-latex-milk-to-foam-origin.mp4","end":13.2,"label":"Where natural latex begins","poster":"https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-natural-latex-origin-film-poster-960.webp"},"vent":{"url":"https://media.divinedunlop.com/videos/natural-latex-airflow-ventilation-channels.mp4","end":0,"label":"Air moving through the latex","poster":"https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-natural-latex-ventilation-film-poster-960.webp"}},"keyFeatures":["100% natural Dunlop latex core","100% cotton cover that comes off","One-piece core, no glued layers","Ventilation channels","OEKO-TEX® Standard 100","A natural latex baby pillow, a gift"],"slides":[{"id":"closed","img":"closed","pos":"53%","label":"Closed","alt":"Dunlop Baby & Junior mattress with its cotton cover closed, showing the wide quilted waves and the zip along the side"},{"id":"open","img":"open","pos":"55%","label":"Open","alt":"Dunlop Baby & Junior mattress with the cotton cover unzipped and folded back to reveal the one-piece natural latex core"},{"id":"core","img":"latexcore","label":"Latex core","alt":"Cross-section of natural latex foam showing its rows of ventilation channels"},{"id":"quilt","img":"closed","pos":"40%","k":2,"oy":"40%","label":"Quilting","alt":"Close-up of the quilted 100% cotton cover with its wide transverse waves"},{"id":"zip","img":"closed","pos":"28%","k":2.1,"oy":"68%","label":"Zip","alt":"Close-up of the zip puller and the side panel of the cotton cover"},{"id":"cot","img":"cot","label":"In the cot","alt":"A baby asleep in a wooden cot"},{"id":"pillow","img":"pillow","label":"Sleeping","alt":"A baby asleep, resting on a white pillow"},{"id":"top","img":"top","fit":"contain","label":"From above","alt":"A mattress seen from above with a baby asleep on a pillow under a cream blanket"},{"id":"depths","img":"depths","fit":"contain","label":"Four depths","alt":"Baby Cot in 10 and 12 cm and Junior in 14 and 16 cm, drawn side by side"},{"id":"nursery","img":"nursery","fit":"contain","label":"Baby Cot and Junior","alt":"Baby Cot 10 and 12 cm and Junior 14 and 16 cm in a nursery setting"}],"topicSlide":{"discover":5,"origin":1,"healthy":5,"comfort":6,"firmness":7,"ventilation":2,"cover":3,"benefits":5,"delivery":0,"collections":9,"care":8},"facts":[{"l":"Material","v":"100% natural Dunlop latex","pills":["One-piece core"]},{"l":"Cover","v":"100% cotton","pills":["Quilted","Zip along the side","Washes at 40 °C"]},{"l":"Sizes","v":"10 sizes","pills":["Baby Cot · 4","Junior · 6"]},{"l":"Depths","v":"10 / 12 cm · 14 / 16 cm","pills":["Baby Cot 10 / 12","Junior 14 / 16"]},{"l":"Firmness","v":"Medium","pills":["One firmness"]},{"l":"Tested","v":"OEKO-TEX® Standard 100","pills":["For baby use"]},{"l":"Delivery","v":"Allow up to 20 days","pills":["Special packaging"]},{"l":"Included","v":"A natural latex baby pillow","pills":["A gift with every mattress"]}],"chapters":[{"id":"discover","label":"Discover","head":"A natural environment for your baby, topic by topic.","panels":[{"id":"intro","kind":"hero","label":"Introduction"},{"id":"glance","kind":"facts","label":"At A Glance","title":"Your baby's mattress at a glance"},{"id":"who","kind":"read","label":"Made For Your Family","title":"Made for your baby, and for your child as they grow","groups":[{"h":null,"blocks":[{"k":"p","t":"**Baby Cot Size** is made for your baby's cot or cot bed. **Junior Size** is made for the bed your child moves to next. Both are made from the same natural materials: a **100% natural Dunlop latex core** and a **100% cotton cover**."},{"k":"p","t":"Every size has the same Medium firmness, so the support your baby feels in the cot is the support your child feels in the bed."}]},{"h":"Before you choose","blocks":[{"k":"p","t":"Cot and bed sizes differ between manufacturers. Measure the **inside** of the frame, length and width, and check the maximum mattress depth your cot or bed allows."}]}]},{"id":"promise","kind":"read","label":"Our Promise","title":"What we promise you","groups":[{"h":null,"blocks":[{"k":"p","t":"**A natural environment for your baby.** Your baby sleeps on a core of 100% natural latex, under a cover of 100% cotton. There are no other materials, and no glued layers."},{"k":"p","t":"**Care for your baby's sleep, and for yours.** Steady support, a natural response to every movement and air moving through the core: a good sleeping surface for your baby, and, we hope, more rest for you."}]},{"h":"Honest, always","blocks":[{"k":"p","t":"We would rather you know exactly what you are buying for your baby than be told more than we can stand behind."}]}]}]},{"id":"origin","label":"Origin","head":"Your baby's mattress begins with a tree.","panels":[{"id":"milk","kind":"video","label":"From Tree To Foam","title":"Where your baby's natural latex begins","video":"origin","text":["Before it is a mattress, natural latex is the **milk of a rubber tree**, a plant that keeps growing after it is tapped. It is gathered, and **Dunlop Technology** turns it into foam.","In the film the milk flows, gathers and is poured into the shape that becomes the core of your baby's mattress."]},{"id":"plant","kind":"points","label":"Plant-Based","title":"Your baby sleeps on a plant, not on petroleum","items":[{"t":"Made from a plant","d":"Natural latex comes from the rubber tree. Many mattress foams, such as memory foam and standard polyurethane foam, are made from refined petroleum.","ic":"tree"},{"t":"A renewable source","d":"The tree is tapped for its milk and keeps growing.","ic":"sprout"},{"t":"One block","d":"The core is moulded as a single piece of 100% natural latex, with no glued layers.","ic":"layers"},{"t":"Open cells","d":"Latex foam is open-celled, so air can move through the mattress your baby sleeps on.","ic":"wind"}]},{"id":"dunlop","kind":"read","label":"Dunlop Technology","title":"One piece, made with Dunlop Technology","groups":[{"h":null,"blocks":[{"k":"p","t":"The core is made with **Dunlop Technology** as one moulded block, with rows of ventilation channels formed in it as it is moulded."},{"k":"p","t":"Because it is one piece, there are no glued layers to separate. Open the zip and the whole core is in view: nothing is hidden from you."}]}]}]},{"id":"healthy","label":"Healthy","head":"A natural, healthy environment for your baby to sleep in.","panels":[{"id":"means","kind":"points","label":"A Natural Environment","title":"A natural environment for your baby to sleep in","items":[{"t":"100% natural latex core","d":"Your baby sleeps on Dunlop latex from the rubber tree, moulded as one piece.","ic":"leaf"},{"t":"Only two materials","d":"A 100% natural latex core and a 100% cotton cover. No other materials, and no glued layers.","ic":"check"},{"t":"A core that breathes","d":"An open-cell structure with ventilation channels lets air move through your baby's mattress, not only across its top.","ic":"wind"},{"t":"A cover that comes off","d":"The 100% cotton cover unzips, comes off and washes at 40 °C, so your baby's sleeping surface is easy to keep fresh.","ic":"wash"}]},{"id":"clean","kind":"read","label":"A Clean Sleep","title":"A clean, hypoallergenic sleep environment","groups":[{"h":null,"blocks":[{"k":"p","t":"Your baby deserves a clean place to sleep. The mattress is made only from natural latex and cotton, with no other elements, and is tested for harmful substances."},{"k":"seal","t":"OEKO-TEX® Standard 100","d":"Tested for harmful substances, for baby use"}]},{"h":"Please note","blocks":[{"k":"p","t":"If anyone in your household has a latex allergy, please seek medical advice before you buy."}]}]},{"id":"air","kind":"read","label":"Air And Dryness","title":"Air, warmth and dryness for your baby","groups":[{"h":null,"blocks":[{"k":"p","t":"Babies and children sleep warm, and every night leaves some warmth and moisture behind. A core that lets air move through it, instead of holding it at the surface, helps keep your baby's sleeping surface fresher and drier."},{"k":"p","t":"This is why we made the ventilation channels a feature of the core itself, and not a surface treatment."}]},{"h":"Together with the room","blocks":[{"k":"p","t":"The room matters too. Keep your baby's room at a comfortable temperature, as the guidance for your cot advises."}]}]},{"id":"even","kind":"read","label":"Even Support","title":"Stable support for your baby","groups":[{"h":null,"blocks":[{"k":"p","t":"Natural latex is dense and elastic. It carries your baby evenly across the surface and answers every movement at once, with no slow recovery."},{"k":"p","t":"The mattress is made in one firmness, **Medium**, in every size and depth, so the support is the same from the cot to the junior bed."}]}]},{"id":"around","kind":"read","label":"The Whole Sleep Space","title":"The mattress is one part of a healthy sleep space","groups":[{"h":null,"blocks":[{"k":"p","t":"A healthy night for your baby also depends on the cot, the bedding, the temperature of the room and the way your baby is put down to sleep. The mattress is the part we make, and we make it from natural materials, with care."},{"k":"p","t":"Always follow current guidance from the **NHS** and **The Lullaby Trust**, together with the instructions supplied with your cot."}]}]}]},{"id":"comfort","label":"Comfort","head":"Your baby's comfort: stable support and natural adaptation.","panels":[{"id":"expect","kind":"read","label":"Your Baby's Comfort","title":"The comfort your baby will feel","groups":[{"h":null,"blocks":[{"k":"p","t":"Natural latex keeps your baby **on the surface** of the mattress and still follows their shape. It is the balance between **stable support** and **natural adaptation** that gives your baby the comfort of latex."},{"k":"p","t":"Your baby feels lightness and softness on top, and steady support underneath: a natural material, used with engineering precision."}]},{"h":"Held up, not wrapped","blocks":[{"k":"p","t":"Your baby is held up, not wrapped. There is no hollow to sink into and no slow recovery, so the comfort comes from the support itself."}]}]},{"id":"need","kind":"read","label":"Support And Adaptation","title":"Support and adaptation need each other","groups":[{"h":null,"blocks":[{"k":"p","t":"**Support comes from density.** Latex is dense, so it carries your baby's weight on the surface."},{"k":"p","t":"**Adaptation comes from elasticity.** Latex is elastic, so it follows your baby's shape and answers every movement."}]},{"h":"They need each other","blocks":[{"k":"p","t":"Adaptation without support lets a child sink. Support without adaptation is hard and unyielding. Your baby needs both, well balanced, and latex gives them together."}]}]},{"id":"support","kind":"points","label":"Support","title":"Stable support, from density","items":[{"t":"Dense, not hard","d":"Latex is very dense, almost twice as dense as many foams used in mattresses. That density carries your baby without a hard surface.","ic":"layers"},{"t":"On the surface","d":"Your baby rests on the mattress, not in a hollow that closes around them.","ic":"leaf"},{"t":"Even all over","d":"The weight is carried across the whole surface instead of pressing in one place.","ic":"scale"},{"t":"Keeps its shape","d":"A dense, elastic material keeps its shape under repeated use, night after night.","ic":"check"}]},{"id":"adapt","kind":"points","label":"Adaptation","title":"Instant, natural adaptation","items":[{"t":"An instant response","d":"There is no delay and no warming-up: the latex answers the moment your baby touches it. Memory foam is slow to respond.","ic":"sun"},{"t":"Weight shared out","d":"The load is shared across the surface instead of concentrating in one spot.","ic":"scale"},{"t":"Movement absorbed","d":"Every small movement in your baby's sleep is absorbed and answered as it happens.","ic":"heart"},{"t":"No slow recovery","d":"The surface resets at once, so your baby is never working out of a dip. This helps your baby sleep more comfortably.","ic":"moon"}]},{"id":"top","kind":"read","label":"Always On Top","title":"Your baby stays on top of the mattress","groups":[{"h":null,"blocks":[{"k":"p","t":"Your baby does not sink into this mattress. Your baby stays **on the top**, on the mattress, always."},{"k":"p","t":"Because your baby lies on the mattress and not in it, there is nothing to hold your baby back: turning, rolling and stretching take little effort."}]},{"h":"From the cot to the bed","blocks":[{"k":"p","t":"The **Baby Cot Size** is for the cot years. The **Junior Size** is for the bed that follows, in the same natural latex."}]}]},{"id":"calm","kind":"read","label":"Calm Nights","title":"A calmer night for your baby, and for you","groups":[{"h":null,"blocks":[{"k":"p","t":"Sleep matters so much for a baby, and a good sleeping environment helps it. A surface that supports your baby evenly, answers every movement and lets air move through is made to help your baby settle."},{"k":"p","t":"And when your baby is comfortable, you can rest more too."}]}]}]},{"id":"firmness","label":"Firmness","head":"One firmness, chosen for your growing child.","panels":[{"id":"medium","kind":"read","label":"Medium","title":"Medium, chosen for your growing child","groups":[{"h":null,"blocks":[{"k":"p","t":"The Baby & Junior range is made in a single firmness, **Medium**, in every size and depth. There is nothing for you to select."},{"k":"p","t":"Babies and growing children need steady, even support as their bodies develop. Medium is chosen to give a balance between your baby's weight and the support underneath, so your child can grow and sleep comfortably."}]}]},{"id":"growing","kind":"read","label":"Support For A Growing Body","title":"Support that grows with your child","groups":[{"h":null,"blocks":[{"k":"p","t":"A young body is changing all the time. The support should not be too hard, and it should not let your child sink. Natural latex does both jobs at once: it carries your child on the surface and gives way gently where the body presses."},{"k":"p","t":"Because latex is dense and elastic, the support stays even as your child gets taller and heavier, from the first cot to the junior bed."}]},{"h":"The same in every size","blocks":[{"k":"p","t":"Medium is the firmness of the whole range. We have not made soft or firm versions of this mattress, because it is made for babies and growing children."}]}]},{"id":"why","kind":"read","label":"Nothing To Choose","title":"Why you do not have to choose a firmness","groups":[{"h":null,"blocks":[{"k":"p","t":"For adults we recommend a firmness by body weight. That table is not used for babies and children: their weight changes so quickly that one balanced firmness serves them best."},{"k":"p","t":"So you only choose what your cot or bed needs, the **size** and the **depth**, and the firmness is already right for your baby."}]}]}]},{"id":"ventilation","label":"Ventilation","head":"Ventilation for your baby: breathing channels in the core.","panels":[{"id":"airflow","kind":"video","label":"Airflow","title":"Air moving through your baby's mattress","video":"vent","text":["The open-cell structure of natural latex, together with the **ventilation channels** formed in the core, lets air move through your baby's mattress.","These breathing channels are part of the core itself, moulded into the latex. They are not a coating or a surface treatment."]},{"id":"channels","kind":"points","label":"Breathing Channels","title":"Built to breathe, for your baby","items":[{"t":"Open cells","d":"Natural latex foam is open-celled, so air can pass through the material itself.","ic":"wind"},{"t":"Ventilation channels","d":"Rows of channels are formed in the core as it is moulded.","ic":"layers"},{"t":"Moulded in","d":"The channels are part of the one-piece core, not added afterwards.","ic":"check"},{"t":"Air keeps moving","d":"Air can move through the whole depth of the mattress, not only across its top.","ic":"sun"}]},{"id":"why","kind":"read","label":"Why It Matters","title":"Why ventilation matters for your child","groups":[{"h":null,"blocks":[{"k":"p","t":"Ventilation matters for children as much as for adults. Temperature comfort matters to everyone, and a child who is too warm is not comfortable. A child who is too cold is not comfortable either."},{"k":"p","t":"Warmth and moisture are what microbes like. The more air that moves through your baby's mattress, the less warmth and moisture is held there, and the less welcoming it is to them."}]},{"h":"Working all night","blocks":[{"k":"p","t":"This is why the channels matter to us, and why we explain them to you: they work quietly, all night, in every mattress."}]}]},{"id":"flow","kind":"flow","label":"How It Works","title":"From the structure to a fresher surface for your baby","steps":["Open-cell latex","Ventilation channels","Air moves through","A drier, fresher surface"],"close":"The channels do not change the temperature of the room. They help warmth and moisture move through your baby's mattress instead of staying inside it."}]},{"id":"cover","label":"Cover & Hygiene","head":"Your baby's cover and the hygiene of your baby's mattress.","panels":[{"id":"cotton","kind":"cover","label":"100% Cotton","title":"Your baby's cover: 100% cotton","text":["The cover is **100% cotton**, a natural fibre, and it is the part of the mattress closest to your baby. It is quilted in wide transverse waves and closes with a zip along the side.","The cover and the latex core are made together as one mattress: the cover is not a separate choice, and there are no other materials inside."]},{"id":"zip","kind":"read","label":"Comes Off, Washes Easily","title":"Your baby's cover comes off","groups":[{"h":null,"blocks":[{"k":"p","t":"A zip runs along the side, so the cover opens and comes off. The one-piece latex core inside can be seen whenever you like."},{"k":"p","t":"The cotton cover can be machine-washed at **40 °C**. Follow the care instructions supplied with your mattress."}]}]},{"id":"clean","kind":"points","label":"Cleaner Sleep","title":"Hygiene of your baby's mattress","items":[{"t":"Dry by design","d":"Air moving through the open-cell core helps keep your baby's surface drier than a closed foam would.","ic":"wind"},{"t":"A cover that comes off","d":"Unzip the cover along the side and take it off whenever it needs washing.","ic":"zip"},{"t":"Washes at 40 °C","d":"The cotton cover can be machine-washed at 40 °C.","ic":"wash"},{"t":"Nothing hidden","d":"One moulded block: there are no glued layers to trap anything between them.","ic":"check"}]},{"id":"care","kind":"read","label":"Keeping It Fresh","title":"Easy to look after","groups":[{"h":null,"blocks":[{"k":"p","t":"Take the cover off, wash it at **40 °C**, and put it back. It is a simple routine that fits easily into everyday life with a baby."},{"k":"p","t":"Use a fitted sheet made for the exact mattress size, and follow the care instructions supplied with your mattress."}]},{"h":"A good start","blocks":[{"k":"p","t":"A dry, ventilated core and a cover you can wash are a good start for a clean sleeping space for your baby. The rest is everyday care."}]}]}]},{"id":"benefits","label":"Benefits","head":"What your child gains from natural latex.","panels":[{"id":"grow","kind":"points","label":"A Healthy Place To Grow","title":"A healthy environment for your child to grow up in","items":[{"t":"A natural, plant-based material","d":"Your child grows up sleeping on 100% natural Dunlop latex, from the rubber tree.","ic":"tree"},{"t":"A surface that breathes","d":"Open cells and ventilation channels let air move through the mattress, night after night.","ic":"wind"},{"t":"Stable support as they grow","d":"Dense, elastic latex carries your child evenly, from the first cot to the junior bed.","ic":"sprout"},{"t":"A cover you can wash","d":"A 100% cotton cover that comes off and washes at 40 °C keeps the surface fresh.","ic":"wash"}]},{"id":"why","kind":"points","label":"Why Latex","title":"Why natural latex is different for your baby","items":[{"t":"Different from memory foam","d":"Latex responds at once. It does not wrap around your baby or recover slowly.","ic":"sun"},{"t":"A bio-based material","d":"Tapped from a renewable plant, and not made from petroleum.","ic":"leaf"},{"t":"One piece","d":"A single moulded block with ventilation channels and no glued layers.","ic":"layers"},{"t":"Made with Dunlop Technology","d":"The milk of the rubber tree, turned into foam by Dunlop Technology.","ic":"drop"}]},{"id":"last","kind":"read","label":"Made To Last","title":"A mattress for the years, not only the first months","groups":[{"h":null,"blocks":[{"k":"p","t":"Latex is dense and elastic, and a dense, elastic material keeps its shape and its response under repeated use."},{"k":"p","t":"Because the core is one piece, it does not rely on layers that can separate. It is made for the nights of a whole childhood."}]}]}]},{"id":"delivery","label":"Delivery","head":"Delivery of your baby's mattress, and a gift for your baby.","panels":[{"id":"order","kind":"read","label":"Delivery","title":"Delivery of your baby's mattress","groups":[{"h":null,"blocks":[{"k":"p","t":"Please allow up to **20 days** for your baby's mattress to be prepared and delivered."},{"k":"p","t":"It arrives in the size and depth you chose for your baby's cot or your child's bed."}]}]},{"id":"pack","kind":"read","label":"Special Packaging","title":"A special package for your baby's mattress","groups":[{"h":null,"blocks":[{"k":"p","t":"The mattress for your baby arrives in a special package made for it, so that it reaches you in good condition."},{"k":"p","t":"Remove all packaging, including any plastic wrapping, before use, and keep it away from children."}]}]},{"id":"pillow","kind":"read","label":"A Gift For Your Baby","title":"A gift for your baby: our natural latex pillow","groups":[{"h":null,"blocks":[{"k":"p","t":"Every Baby & Junior mattress comes with a gift: **our own baby pillow**, specially developed and made from natural latex, in the same natural philosophy as the mattress."},{"k":"p","t":"It is an added value of the collection, packed together with your baby's mattress, at no extra cost."}]},{"h":"Natural, like the mattress","blocks":[{"k":"p","t":"Natural latex, shaped for a small head. It belongs to the same natural environment as the mattress your baby sleeps on."}]}]},{"id":"use","kind":"read","label":"Using The Pillow","title":"How and when to use the pillow","groups":[{"h":null,"blocks":[{"k":"li","t":["**Purpose.** A head pillow for sleep, for your child in a cot bed or in a bed of their own.","**Age.** A baby under 12 months sleeps without a pillow, on a firm, flat mattress. Our pillow is for your child from 12 months, as the instructions supplied with it also state.","**Your baby's cot.** Keep the cot of a baby under 12 months clear: no pillow, and nothing loose.","**Follow the instructions.** Use and care instructions are supplied with the pillow. Always follow current guidance from the NHS and The Lullaby Trust."]}]},{"h":"For the years ahead","blocks":[{"k":"p","t":"The pillow is a gift for the years ahead, when your baby has grown into a child with a bed of their own."}]}]}]},{"id":"collections","label":"Baby & Junior","head":"Two collections, one natural philosophy, designed for growing years.","panels":[{"id":"two","kind":"duo","label":"Two Collections","title":"One natural philosophy. Two collections.","cols":[{"kicker":"Baby Cot","h":"For your baby's cot","d":"Compact sizes, made for the different constructions of baby cots and cot beds.","list":["**4 sizes:** 60 × 110, 60 × 120, 70 × 130, 70 × 140 cm","**2 depths:** 10 cm and 12 cm","Medium firmness, 100% natural Dunlop latex, 100% cotton cover"]},{"kicker":"Junior","h":"For your child's own bed","d":"Larger sizes and deeper mattresses, made for the move to a bed of your child's own and for the years that follow.","list":["**6 sizes:** 70 × 160, 80 × 160, 80 × 180, 80 × 200, 90 × 190, 90 × 200 cm","**2 depths:** 14 cm and 16 cm","Medium firmness, 100% natural Dunlop latex, 100% cotton cover"]}]},{"id":"depths","kind":"read","label":"Why 10, 12, 14 And 16","title":"Why there are four depths","groups":[{"h":null,"blocks":[{"k":"p","t":"Baby cots are built differently, so the Baby Cot collection has two depths, **10 cm** and **12 cm**. The choice depends on your cot's construction and on the maximum mattress depth its maker allows."},{"k":"p","t":"A child's own bed is a different job: it is used for longer. The Junior collection is made deeper, **14 cm** and **16 cm**, so there is more latex under your growing child over the years."}]},{"h":"Choose what fits","blocks":[{"k":"p","t":"A deeper mattress is not automatically a better one. The right depth is the one that suits your cot or bed, so please check its construction and its maximum mattress depth before you choose."}]}]},{"id":"which","kind":"read","label":"Which One Is Right?","title":"Baby Cot or Junior?","groups":[{"h":null,"blocks":[{"k":"p","t":"If you are buying for a cot or a cot bed, choose **Baby Cot**. If you are buying for a bed your child will sleep in on their own, choose **Junior**."},{"k":"li","t":["**Measure inside.** The inside length and width of the cot or bed frame.","**Check the depth.** The maximum mattress depth the cot or bed maker allows.","**Choose the collection** that matches the frame, then the size and the depth."]}]},{"h":"Not good and better","blocks":[{"k":"p","t":"The two collections share one natural philosophy: a 100% natural latex core and a 100% cotton cover. They are not different levels of quality, but two solutions for two stages of growing up."}]}]}]},{"id":"care","label":"Care & Fit","head":"Fit, care and safer sleep for your baby.","panels":[{"id":"fit","kind":"read","label":"Fit","title":"Find the right fit for your cot or bed","groups":[{"h":null,"blocks":[{"k":"p","t":"Cot and bed sizes differ between manufacturers. The right mattress is the one that matches the inside of your frame."},{"k":"li","t":["**Measure inside.** Length and width of the cot or bed frame, not the outside.","**Match the size.** It should fit snugly, with no gaps at the sides or ends.","**Check the depth.** Many cots state a maximum mattress depth: choose a depth within it.","**Follow your cot.** Use its instructions on mattress size and maximum depth."]}]}]},{"id":"before","kind":"read","label":"Before Use","title":"Before it goes in your baby's cot","groups":[{"h":null,"blocks":[{"k":"li","t":["**Unpacking.** Remove all packaging, including any plastic wrapping, before use, and keep it away from children.","**Bedding.** Use a fitted sheet made for the exact mattress size. Keep the sleeping surface flat and clear.","**Cover.** The cover comes off and can be washed at 40 °C. Follow the care instructions supplied with your mattress."]}]}]},{"id":"latex","kind":"read","label":"Latex & Safer Sleep","title":"Latex and safer sleep","groups":[{"h":"Contains natural rubber latex","blocks":[{"k":"p","t":"If anyone in your household has a latex allergy, please seek medical advice before you buy."}]},{"h":"Safer sleep","blocks":[{"k":"p","t":"Always follow current guidance from the NHS and The Lullaby Trust, together with the instructions supplied with your cot."}]}]}]}],"images":{"closed":{"src":"https://cdn.jsdelivr.net/gh/Matrress/Animation@c3cafc0705ba2ae2e9c8374bafa7ef7bed16bc63/divine-baby-junior/release/0.1.0/assets/dunlop-baby-junior-latex-mattress-cotton-cover-closed-1600.webp","srcset":"https://cdn.jsdelivr.net/gh/Matrress/Animation@c3cafc0705ba2ae2e9c8374bafa7ef7bed16bc63/divine-baby-junior/release/0.1.0/assets/dunlop-baby-junior-latex-mattress-cotton-cover-closed-800.webp 800w, https://cdn.jsdelivr.net/gh/Matrress/Animation@c3cafc0705ba2ae2e9c8374bafa7ef7bed16bc63/divine-baby-junior/release/0.1.0/assets/dunlop-baby-junior-latex-mattress-cotton-cover-closed-1600.webp 1600w"},"open":{"src":"https://cdn.jsdelivr.net/gh/Matrress/Animation@c3cafc0705ba2ae2e9c8374bafa7ef7bed16bc63/divine-baby-junior/release/0.1.0/assets/dunlop-baby-junior-latex-core-cotton-cover-open-1600.webp","srcset":"https://cdn.jsdelivr.net/gh/Matrress/Animation@c3cafc0705ba2ae2e9c8374bafa7ef7bed16bc63/divine-baby-junior/release/0.1.0/assets/dunlop-baby-junior-latex-core-cotton-cover-open-800.webp 800w, https://cdn.jsdelivr.net/gh/Matrress/Animation@c3cafc0705ba2ae2e9c8374bafa7ef7bed16bc63/divine-baby-junior/release/0.1.0/assets/dunlop-baby-junior-latex-core-cotton-cover-open-1600.webp 1600w"},"latexcore":{"src":"https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-natural-latex-core-ventilation-channels-1600.webp","srcset":"https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-natural-latex-core-ventilation-channels-800.webp 800w, https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-natural-latex-core-ventilation-channels-1600.webp 1600w"},"cot":{"src":"https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-baby-asleep-in-cot-1600.webp","srcset":"https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-baby-asleep-in-cot-800.webp 800w, https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-baby-asleep-in-cot-1600.webp 1600w"},"pillow":{"src":"https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-baby-asleep-on-pillow-1600.webp","srcset":"https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-baby-asleep-on-pillow-800.webp 800w, https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-baby-asleep-on-pillow-1600.webp 1600w"},"top":{"src":"https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-baby-on-pillow-mattress-top-view-1600.webp","srcset":"https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-baby-on-pillow-mattress-top-view-800.webp 800w, https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-baby-on-pillow-mattress-top-view-1600.webp 1600w"},"depths":{"src":"https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-baby-and-junior-depths-1600.webp","srcset":"https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-baby-and-junior-depths-800.webp 800w, https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-baby-and-junior-depths-1600.webp 1600w"},"nursery":{"src":"https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-baby-and-junior-depths-nursery-1600.webp","srcset":"https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-baby-and-junior-depths-nursery-800.webp 800w, https://cdn.jsdelivr.net/gh/Matrress/Animation@04a88f44070fb3a9df6482f9545563ce06ba5a79/divine-baby-junior/experience/assets/dunlop-baby-and-junior-depths-nursery-1600.webp 1600w"},"quilt":{"src":"https://cdn.jsdelivr.net/gh/Matrress/Animation@b0c161a67ae725da9db1cfeaa2eae2b82d7e9b0f/divine-baby-junior/release/0.2.0/assets/dunlop-baby-junior-cotton-cover-quilting-detail-660.webp"},"zip":{"src":"https://cdn.jsdelivr.net/gh/Matrress/Animation@b0c161a67ae725da9db1cfeaa2eae2b82d7e9b0f/divine-baby-junior/release/0.2.0/assets/dunlop-baby-junior-cotton-cover-zip-detail-340.webp"}},"logo":"https://cdn.jsdelivr.net/gh/Matrress/Animation@9d681f860c9dae7dd866236d6824f413443b8512/divine-home-discovery/assets/bio-dunlop.svg"};
var FONT400 = "https://cdn.jsdelivr.net/gh/Matrress/Animation@57479ca18f8e6bab02e2a4aa0ec4f0cf82578fad/divine-hero/release/1.17.1/assets/chillax-400.woff2";
var FONT600 = "https://cdn.jsdelivr.net/gh/Matrress/Animation@57479ca18f8e6bab02e2a4aa0ec4f0cf82578fad/divine-hero/release/1.17.1/assets/chillax-600.woff2";
var PH_CSS = ":host{all:initial;display:block}:host{--w:#FFFFFF;--ink:#003A68;--ink2:rgba(0,58,104,.92);--line:rgba(0,58,104,.26);--pk:#F8F2FC;--sky2:rgba(178,227,251,.55);--acc:#91E8F1;--surf:#E4E8F0;--strong:#006591;--r:12px;--rl:16px;--f:'DBJChillax','Chillax','Helvetica Neue',Arial,system-ui,sans-serif}*{box-sizing:border-box}button{font:inherit;color:inherit;cursor:pointer;margin:0}b{font-weight:600}:focus-visible{outline:3px solid var(--strong);outline-offset:2px}.sheet{position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;display:flex;flex-direction:column;background:var(--w);color:var(--ink);font-family:var(--f);font-size:16px;line-height:1.5;-webkit-font-smoothing:antialiased}.hd{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:calc(12px + env(safe-area-inset-top)) 16px 10px;border-bottom:1px solid var(--line);background:var(--w)}.hdt{display:flex;flex-direction:column;min-width:0}.hdt b{font-size:15px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stp{font-size:11.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--strong)}.x{flex:0 0 44px;width:44px;height:44px;border:1px solid var(--line);background:var(--w);border-radius:var(--r);font-size:26px;line-height:1;color:var(--ink)}.prog{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:10px 16px 0}.prog i{height:4px;border-radius:2px;background:var(--line)}.prog i.on{background:var(--strong)}.bd{flex:1 1 auto;overflow:auto;padding:16px 16px 20px;-webkit-overflow-scrolling:touch}.q{margin:0 0 6px;font-size:28px;line-height:1.12;font-weight:400;letter-spacing:-.015em}.sub{margin:0 0 14px;font-size:15.5px;line-height:1.5;color:var(--ink2)}.lab2{margin:16px 0 10px;font-size:12px;line-height:1.2;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--strong)}.fam,.cards{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}.card{display:flex;flex-direction:column;gap:2px;text-align:left;width:100%;background:var(--w);border:1.5px solid var(--line);border-radius:var(--rl);padding:16px 18px;color:var(--ink);min-height:64px}.card:active:not(:disabled){border-color:var(--ink)}.card:disabled{opacity:.5}.card .cm{font-size:22px;line-height:1.2;font-weight:600}.card .in{font-size:15px;color:var(--ink2)}.card .pr{font-size:16px;font-weight:600;margin-top:4px}.card .dsc{margin-top:6px;font-size:14.5px;line-height:1.45;color:var(--ink2)}.card.on{background:var(--strong);border-color:var(--strong);color:#fff}.card.on .in,.card.on .dsc{color:rgba(255,255,255,.92)}.fm1{font-size:20px;font-weight:600}.fm3{font-size:15px;color:var(--ink2)}.fm.on .fm3{color:rgba(255,255,255,.92)}.need{margin:14px 2px 0;font-size:14.5px;color:var(--ink2)}.rv{list-style:none;margin:0 0 12px;padding:0;display:grid;gap:8px}.rv li{display:flex;justify-content:space-between;gap:12px;background:var(--pk);border:1px solid var(--line);border-radius:var(--r);padding:13px 16px;font-size:15.5px}.rv li span{color:var(--ink2)}.rv li b{text-align:right}.rv li i,.rvp i{font-style:normal;font-weight:400;color:var(--ink2)}.rvp{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-radius:var(--rl);border:1.5px solid var(--strong);background:var(--w)}.rvp span{font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--strong)}.rvp b{font-size:26px}.guide{margin:12px 2px 0;text-align:center;font-size:14px;line-height:1.4;font-weight:600;color:var(--ink2)}.ft{display:flex;gap:10px;padding:12px 16px calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--line);background:var(--w)}.btn{flex:1 1 0;border:1.5px solid var(--strong);background:var(--strong);color:#fff;border-radius:var(--r);padding:15px 18px;font-weight:600;font-size:17px;line-height:1.2;min-height:52px}.btn:disabled{opacity:.45}.btn.ghost{flex:0 0 auto;background:var(--w);color:var(--ink);border-color:var(--line)}.btn.big.ready{box-shadow:0 0 0 4px var(--acc)}.toast{font-family:var(--f);position:fixed;left:50%;bottom:calc(86px + env(safe-area-inset-bottom));transform:translate(-50%,20px);opacity:0;pointer-events:none;background:var(--ink);color:#fff;border-radius:var(--r);padding:12px 18px;font-weight:600;font-size:15px;transition:opacity .25s,transform .25s;z-index:2147483001;max-width:calc(100vw - 32px);text-align:center}.toast.on{opacity:1;transform:translate(-50%,0)}@media (prefers-reduced-motion:reduce){*{transition:none!important}}.incl{margin:12px 2px 0;font-size:14.5px;line-height:1.45;color:rgba(0,58,104,.78)}.incl b{color:#003A68}.gsub{margin:-6px 0 10px;font-size:14.5px;color:var(--ink2)}.natl{display:flex;align-items:flex-start;gap:8px;margin:0 0 14px;padding:10px 12px;background:var(--pk);border:1px solid var(--line);border-radius:12px;font-size:13.5px;line-height:1.4;font-weight:600;color:var(--ink)}.natl svg{flex:0 0 16px;margin-top:2px;color:#009289}";
/* ===== core: the binding to Ecwid, shared by the television and the phone layer =====
   Ecwid stays the executor: options, price, bag and checkout are the store's own. This file only
   (1) reads and sets Ecwid's own dropdowns the way a customer would, (2) shows Ecwid's own price,
   (3) presses Ecwid's own Add to Bag button, only when the customer asks, and (4) keeps the selection laws. */
var doc = document, win = window;
function $(s, r) { return (r || doc).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
function txt(n) { return n ? String(n.textContent || '').replace(/[\s ]+/g, ' ').replace(/^ | $/g, '') : ''; }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function fire(node, type) {
  var e; try { e = new Event(type, { bubbles: true }); } catch (x) { e = doc.createEvent('Event'); e.initEvent(type, true, true); }
  node.dispatchEvent(e);
}
function inch(cm) { return (Math.round(cm / 2.54 * 10) / 10).toFixed(1); }
function isPhone() {
  var q = win.location.search, s = win.screen || {}, p = Math.min(s.width || 9999, s.height || 9999) < 600;
  if (/[?&]ddtv=tv\b/.test(q)) { p = false; } if (/[?&]ddtv=phone\b/.test(q)) { p = true; }
  return p;
}

/* ---------- the two choices the customer makes (firmness and cover are fixed for this model) ---------- */
var ROLE = { size: /^size\b/i, height: /height|depth/i };
var ROLES = ['size', 'height'];
var ORDER = [['size', 'Size'], ['height', 'Depth']];   /* the shop's own option is still called Height: the interface says Depth */
function shopRoot() {
  var c = $$('.product-details');
  for (var i = 0; i < c.length; i++) { if (c[i].offsetParent || c[i].getClientRects().length) { return c[i]; } }
  return c[0] || null;
}
function selectFor(role) {
  var r = shopRoot(); if (!r) { return null; }
  var bs = $$('.details-product-option', r);
  for (var i = 0; i < bs.length; i++) {
    var t = txt($('.details-product-option__title, .product-details-module__title, legend, label.form-control__label', bs[i])).replace(/[*\s]+$/, '');
    if (ROLE[role].test(t)) { return $('select', bs[i]); }
  }
  return null;
}
function chosenText(sel) {
  if (!sel || sel.selectedIndex < 0) { return null; }
  var o = sel.options[sel.selectedIndex], t = txt(o);
  if (!t || o.disabled || /^please\s+choose/i.test(t) || /contact\s+us/i.test(t)) { return null; }
  return t;
}
function dimsOf(t) { var m = /(\d{2,3})\s*[x×]\s*(\d{2,3})/.exec(String(t || '')); return m ? [+m[1], +m[2]].sort(function (a, b) { return a - b; }) : null; }
function cmOf(t) { var m = /(\d{1,2})\s*cm/i.exec(String(t || '')); return m ? m[1] : null; }
function shopKey(role, t) {
  if (t == null) { return null; }
  if (role === 'size') { var d = dimsOf(t); return d ? d.join('x') : null; }
  return cmOf(t);
}
function sizeKey(z) { return Math.min(z.w, z.l) + 'x' + Math.max(z.w, z.l); }
function sizeByKey(k) { for (var i = 0; i < DATA.sizes.length; i++) { if (sizeKey(DATA.sizes[i]) === k) { return DATA.sizes[i]; } } return null; }
function heightByKey(k) { for (var i = 0; i < DATA.heights.length; i++) { if (String(DATA.heights[i].cm) === String(k)) { return DATA.heights[i]; } } return null; }
/* the two collections have their own depths: Baby Cot 10 / 12 cm, Junior 14 / 16 cm. A depth without a group (the tests on Bio Comfort) goes with every size. */
function heightsFor(z) { return DATA.heights.filter(function (h) { return h.g == null || !z || h.g === z.g; }); }
function validPair(zk, hk) { var z = sizeByKey(zk), h = heightByKey(hk); return !!(z && h && (h.g == null || h.g === z.g)); }
function groupByKey(k) { for (var i = 0; i < DATA.groups.length; i++) { if (DATA.groups[i].key === k) { return DATA.groups[i]; } } return null; }
/* is this size / height among Ecwid's own options? (an option the store does not have is shown as not available yet) */
function shopHas(role, key) {
  var sel = selectFor(role); if (!sel) { return null; }                 /* null: the options have not arrived yet */
  for (var i = 0; i < sel.options.length; i++) { if (shopKey(role, txt(sel.options[i])) === key && (!sel.options[i].disabled || sel.options[i].hasAttribute('data-ddx-off'))) { return true; } }
  return false;
}

/* ---------- reading the shop and setting the shop ---------- */
var X = { S: { size: null, height: null, bagged: '' }, busy: false, probing: false, prices: {}, gone: {}, hooks: {} };
function readShop() { var o = {}; ROLES.forEach(function (r) { o[r] = shopKey(r, chosenText(selectFor(r))); }); return o; }
function setShop(role, key) {
  var sel = selectFor(role); if (!sel || key == null) { return false; }
  for (var i = 0; i < sel.options.length; i++) {
    if (shopKey(role, txt(sel.options[i])) === key && (!sel.options[i].disabled || sel.options[i].hasAttribute('data-ddx-off'))) {
      if (sel.selectedIndex !== i) { sel.selectedIndex = i; fire(sel, 'input'); fire(sel, 'change'); }
      return true;
    }
  }
  return false;
}
/* Defence in depth: in Ecwid's own Height dropdown the depths of the other collection are switched off, and a combination that does not exist is cleared.
   (Ecwid itself has only the 20 valid variations, so an invalid pair cannot be bought; this also keeps the dropdown honest.) */
function enforceOptions() {
  var hs = selectFor('height'), z = X.S.size && sizeByKey(X.S.size); if (!hs) { return; }
  for (var i = 0; i < hs.options.length; i++) {
    var o = hs.options[i], k = shopKey('height', txt(o)), h = k != null ? heightByKey(k) : null;
    var off = !!(z && h && h.g != null && h.g !== z.g);
    if (off) { if (!o.disabled) { o.disabled = true; o.setAttribute('data-ddx-off', '1'); } }
    else if (o.hasAttribute('data-ddx-off')) { o.disabled = false; o.removeAttribute('data-ddx-off'); }
  }
  var cur = hs.options[hs.selectedIndex]; if (cur && cur.hasAttribute('data-ddx-off') && !X.probing) { clearShop('height'); }
}
function clearShop(role) {
  var sel = selectFor(role); if (!sel || sel.selectedIndex <= 0 || !/^please\s+choose/i.test(txt(sel.options[0]))) { return; }
  X.busy = true; try { sel.selectedIndex = 0; fire(sel, 'input'); fire(sel, 'change'); } finally { X.busy = false; }
}
/* the customer's choice goes into the shop's dropdowns */
function push() {
  if (X.busy) { return; }
  var shop = readShop(); X.busy = true;
  try {
    if (X.S.size != null && X.S.height != null && !validPair(X.S.size, X.S.height)) { X.S.height = null; clearShop('height'); }
    ROLES.forEach(function (r) { var want = X.S[r]; if (want != null && want !== shop[r]) { setShop(r, want); if (r === 'size') { enforceOptions(); } } });
    enforceOptions();
  } finally { X.busy = false; }
}
/* the shop changed (the customer used Ecwid's own dropdowns): bring the selection up to date */
function pull() {
  if (X.busy) { return false; }
  var shop = readShop(), changed = false;
  ROLES.forEach(function (r) {
    if (X.S[r] === shop[r]) { return; }
    if (shop[r] != null && (r === 'size' ? !sizeByKey(shop[r]) : !heightByKey(shop[r]))) { return; }
    X.S[r] = shop[r]; changed = true;
  });
  if (X.S.size != null && X.S.height != null && !validPair(X.S.size, X.S.height)) { X.S.height = null; clearShop('height'); changed = true; }
  enforceOptions();
  return changed;
}

/* ---------- price: Ecwid's own text, never calculated here ---------- */
function rawPrice() { var r = shopRoot(), e = r && $('.details-product-price__value', r); return e ? e.textContent : ''; }
function priceNow() {
  var t = txt($('.details-product-price__value', shopRoot() || doc));
  return /\d/.test(t) && !/^[^\d]*0(?:[.,]0+)?[^\d]*$/.test(t.replace(/[\s ]/g, '')) ? t : '';
}
function numOf(t) { var n = parseFloat(String(t).replace(/,/g, '').replace(/[^\d.]/g, '')); return isNaN(n) ? null : n; }
function pkey(z, h) { return sizeKey(z) + '|' + h.cm; }
function priceOf(z, h) { return X.prices[pkey(z, h)] || ''; }
/* Ecwid now also holds the blocked combinations as Out of stock variations: a price is never taken from one, and it never goes into the tables */
function soldOut() { var r = shopRoot(); return !!r && !shopBagButton() && /out\s+of\s+stock|sold\s+out/i.test(r.textContent || ''); }
function remember() {
  var z = X.S.size && sizeByKey(X.S.size), h = X.S.height && heightByKey(X.S.height), p = priceNow();
  if (z && h && p && !soldOut()) { X.prices[pkey(z, h)] = p; }
}
/* Ecwid changes its price in one step, 250 to 480 ms after a change: wait for the real change (or, for an equal price, long enough) */
var pollT = 0;
function awaitPrice(before, cb, t) {
  t = t || 0; if (t === 0 && pollT) { win.clearTimeout(pollT); }
  var raw = rawPrice(), p = priceNow();
  if (p && ((raw !== before) || t >= 900)) { remember(); pollT = 0; cb(p); return; }
  if (t < 2600) { pollT = win.setTimeout(function () { awaitPrice(before, cb, t + 40); }, 40); } else { pollT = 0; cb(''); }
}
function missingCombos(only) {
  var list = []; DATA.sizes.forEach(function (z) { if (only && z !== only) { return; } heightsFor(z).forEach(function (h) { if (!X.prices[pkey(z, h)] && !X.gone[pkey(z, h)] && shopHas('size', sizeKey(z)) && shopHas('height', String(h.cm))) { list.push({ z: z, h: h }); } }); });
  return list;
}
/* Select each combination in Ecwid's own dropdowns, wait for the price to change, remember it, then put the customer's selection back.
   While it runs, Ecwid's price, its Add to Bag button and its dropdowns are blocked, so nothing wrong can be bought. */
function readCombos(list, progress, finish) {
  var ss = selectFor('size'), hs = selectFor('height'), buy = shopBagButton();
  if (X.probing || !ss || !hs || !buy || !list.length) { if (finish) { finish(false); } return; }
  X.probing = true; X.busy = true; if (X.hooks.state) { X.hooks.state(); }
  var root = shopRoot(), box = $('.details-product-price', root), blocks = [ss, hs].map(function (s0) { return s0.closest ? s0.closest('.details-product-option') : null; });
  var keep = { s: ss.selectedIndex, h: hs.selectedIndex, raw: rawPrice(), vis: box ? box.style.visibility : '', pe: buy.style.pointerEvents, bp: blocks.map(function (x) { return x ? x.style.pointerEvents : ''; }) };
  if (box) { box.style.visibility = 'hidden'; }
  buy.style.pointerEvents = 'none'; blocks.forEach(function (x) { if (x) { x.style.pointerEvents = 'none'; } });
  var i = 0;
  function idx(sel, role, key) { for (var k = 0; k < sel.options.length; k++) { if (shopKey(role, txt(sel.options[k])) === key) { return k; } } return -1; }
  function leave() {
    if (box) { box.style.visibility = keep.vis; } buy.style.pointerEvents = keep.pe;
    blocks.forEach(function (x, k) { if (x) { x.style.pointerEvents = keep.bp[k]; } });
    X.busy = false; X.probing = false; enforceOptions(); if (X.hooks.state) { X.hooks.state(); } if (finish) { finish(true); }
  }
  function restore() {
    var s2 = selectFor('size'), h2 = selectFor('height');
    try {
      if (s2 && s2.selectedIndex !== keep.s) { s2.selectedIndex = keep.s; fire(s2, 'input'); fire(s2, 'change'); }
      if (h2 && h2.selectedIndex !== keep.h) { h2.selectedIndex = keep.h; fire(h2, 'input'); fire(h2, 'change'); }
    } catch (e) { /* leave the dropdowns as they are */ }
    var w = 0;
    (function settle() { if (rawPrice() === keep.raw || w >= 1500) { leave(); return; } w += 40; win.setTimeout(settle, 40); }());
  }
  function next() {
    if (i >= list.length) { restore(); return; }
    var c = list[i++], s2 = selectFor('size'), h2 = selectFor('height');
    if (!s2 || !h2) { restore(); return; }
    var zi = idx(s2, 'size', sizeKey(c.z)), hi = idx(h2, 'height', String(c.h.cm)), before = rawPrice(), t = 0;
    if (zi < 0 || hi < 0) { next(); return; }
    s2.selectedIndex = zi; h2.selectedIndex = hi; fire(s2, 'input'); fire(s2, 'change'); fire(h2, 'input'); fire(h2, 'change');
    (function wait() {
      var raw = rawPrice(), p = priceNow();
      if ((raw !== before && p) || t >= 900) { if (p && soldOut()) { X.gone[pkey(c.z, c.h)] = 1; } else if (p) { X.prices[pkey(c.z, c.h)] = p; } if (progress) { progress(i, list.length); } if (X.hooks.prices) { X.hooks.prices(); } next(); return; }
      t += 25; win.setTimeout(wait, 25);
    }());
  }
  next();
}

/* ---------- the bag: Ecwid's own button, pressed only by the customer ---------- */
function shopBagButton() {
  var r = shopRoot(); if (!r) { return null; }
  var b = $$('button', r);
  for (var i = 0; i < b.length; i++) { if (/add\s+to\s+(bag|cart)/i.test(txt(b[i]))) { return b[i]; } }
  return null;
}
var bagAt = 0, bagSig = '';
function addToBag() {
  push(); var b = shopBagButton(); if (!b) { return false; }
  bagAt = Date.now(); bagSig = signature(); b.click(); return true;
}
function onCart() { if (!bagAt || Date.now() - bagAt > 15000) { return; } bagAt = 0; X.S.bagged = bagSig; if (X.hooks.draw) { X.hooks.draw(); } }
function openCart() { if (win.Ecwid && win.Ecwid.openPage) { win.Ecwid.openPage('cart'); } }

/* ---------- the selection laws (one place; the television and the phone layer share them) ----------
   1. The bag button is READY only when every choice is made: size and depth. Firmness (Medium) and cover (100% cotton) are fixed and have nothing to select.
   2. Once complete, changing a choice keeps the button active for the new configuration.
   3. When the bag holds exactly this configuration, the same button is Go to Checkout (it opens the shopping cart, Ecwid's own).
   4. Whatever is missing is named: "Still to choose: Size · Depth".
   5. A coupon or code is entered in the cart, never here. */
function missing() { return ORDER.filter(function (o) { return X.S[o[0]] == null; }).map(function (o) { return o[1]; }); }
function complete() { return missing().length === 0; }
function signature() { return complete() ? ORDER.map(function (o) { return o[0] + '=' + X.S[o[0]]; }).join('|') : ''; }
function bagFace() {
  if (!complete()) { return { face: 'add', enabled: false, ready: false, text: 'Add to Bag', guide: 'Still to choose: ' + missing().join(' · ') }; }
  if (soldOut()) { return { face: 'add', enabled: false, ready: false, text: 'Add to Bag', guide: 'This size and depth is not available' }; }
  if (X.S.bagged && X.S.bagged === signature()) { return { face: 'checkout', enabled: true, ready: false, text: 'Go to Checkout', guide: 'Added to your bag' }; }
  return { face: 'add', enabled: true, ready: true, text: 'Add to Bag', guide: X.S.bagged ? 'Your new choice is not in the bag yet: Add to Bag again' : 'Ready to order: size and depth chosen' };
}
function chosenLabel(role) {
  if (role === 'size') { var z = X.S.size && sizeByKey(X.S.size); return z ? (groupByKey(z.g).name + ' · ' + z.w + ' × ' + z.l + ' cm') : null; }
  var h = X.S.height && heightByKey(X.S.height); return h ? h.cm + ' cm' : null;
}

/* ---------- the picture carousels of the standard description ([data-dbg]): dots, mouse drag, arrow keys ---------- */
var reduce = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
function initCarousel(fig) {
  if (fig.__dbg) { return; }
  var v = $('.dbj-car__v', fig), slides = $$('.dbj-car__s', fig), d = $('.dbj-car__d', fig);
  if (!v || slides.length < 2 || !d) { return; }
  fig.__dbg = 1;
  var dots = [], raf = 0;
  function cur() { return Math.max(0, Math.min(slides.length - 1, Math.round(v.scrollLeft / (v.clientWidth || 1)))); }
  function go(i) { i = Math.max(0, Math.min(slides.length - 1, i)); var x = i * v.clientWidth; try { v.scrollTo({ left: x, behavior: reduce ? 'auto' : 'smooth' }); } catch (e) { v.scrollLeft = x; } }
  function mark() { var n = cur(); dots.forEach(function (b, k) { b.className = 'dbj-car__dot' + (k === n ? ' on' : ''); b.setAttribute('aria-current', k === n ? 'true' : 'false'); }); }
  slides.forEach(function (s, i) {
    var b = doc.createElement('button'); b.className = 'dbj-car__dot'; b.type = 'button'; b.setAttribute('aria-label', 'Picture ' + (i + 1) + ' of ' + slides.length);
    b.addEventListener('click', function () { go(i); }); d.appendChild(b); dots.push(b);
  });
  v.addEventListener('scroll', function () { if (!raf) { raf = win.requestAnimationFrame(function () { raf = 0; mark(); }); } }, { passive: true });
  v.addEventListener('keydown', function (e) { var k = e.key || e.keyCode; if (k === 'ArrowRight' || k === 39) { e.preventDefault(); go(cur() + 1); } else if (k === 'ArrowLeft' || k === 37) { e.preventDefault(); go(cur() - 1); } });
  var drag = null;
  v.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button !== 0) { return; } drag = { x: e.clientX, s: v.scrollLeft, moved: false }; });
  win.addEventListener('pointermove', function (e) { if (!drag) { return; } var dx = e.clientX - drag.x; if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; v.className += ' dbj-drag'; } if (drag.moved) { v.scrollLeft = drag.s - dx; } });
  win.addEventListener('pointerup', function () { if (!drag) { return; } var was = drag.moved; drag = null; if (was) { v.className = v.className.replace(/\s*dbj-drag/, ''); go(cur()); } });
  fig.className += ' dbj-car--on'; mark();
}
function carousels() { $$('[data-dbg]').forEach(initCarousel); }

/* ===== the phone layer: a guided configuration over Ecwid's own options (same scheme as Botanic TV's phone layer) =====
   Phones only, listed products only. The shop's own dropdowns, price, bag and checkout stay in the page and do the work. */
var CFG = win.__DDPHONE_CONFIG = win.__DDPHONE_CONFIG || {};
CFG.products = CFG.products || [DATA.product.id];
var PH = null, ctaBtn = null, ctaNote = null, shopWatch = null, lastPid = null, booted = false;
function rich(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
function pageStylePhone() {
  if (!doc.getElementById('ddp-font')) {
    var f = doc.createElement('style'); f.id = 'ddp-font';
    f.textContent = '@font-face{font-family:"DBJChillax";font-style:normal;font-weight:400;font-display:swap;src:url(' + FONT400 + ') format("woff2")}@font-face{font-family:"DBJChillax";font-style:normal;font-weight:600;font-display:swap;src:url(' + FONT600 + ') format("woff2")}' +
      '#ddp-cta{display:block;width:100%;margin:14px 0 6px;padding:16px 18px;border:2px solid #003A68;border-radius:16px;background:#006591;color:#fff;font:600 18px/1.2 DBJChillax,Chillax,"Helvetica Neue",Arial,sans-serif;text-align:center;cursor:pointer;box-shadow:0 0 0 3px #91E8F1}' +
      '#ddp-cta:active{background:#003A68}' +
      '#ddp-note{margin:0 0 12px;padding:10px 14px;border:1px solid rgba(0,58,104,.18);border-radius:12px;background:#E4E8F0;color:#003A68;font:400 14.5px/1.45 DBJChillax,Chillax,"Helvetica Neue",Arial,sans-serif}' +
      '#ddp-note b{font-weight:600}' +
      'html.ddp-lock,html.ddp-lock body{overflow:hidden!important}';
    (doc.head || doc.documentElement).appendChild(f);
  }
}
/* the guided steps */
var PSTEPS = ['size', 'depth', 'review'];
function phSheetHtml(U) {
  var idx = PSTEPS.indexOf(U.step) + 1, body = '', foot = '';
  if (U.step === 'size') {
    body = '<h2 class="q">What size is your baby&#39;s cot or bed?</h2><p class="sub">Choose your size. Every size in centimetres and in inches.</p>' + DATA.groups.map(function (g) {
      return '<p class="lab2">' + esc(g.name) + ' · ' + DATA.heights.filter(function (h) { return h.g == null || h.g === g.key; }).map(function (h) { return h.cm; }).join(' / ') + ' cm deep</p><p class="gsub">' + esc(g.sub) + '</p><div class="cards">' + DATA.sizes.filter(function (z) { return z.g === g.key; }).map(function (z) {
        var on = X.S.size === sizeKey(z), av = shopHas('size', sizeKey(z));
        return '<button type="button" class="card sz' + (on ? ' on' : '') + '" data-pick-size="' + sizeKey(z) + '"' + (av === false ? ' disabled' : '') + '><span class="cm">' + z.w + ' × ' + z.l + ' cm</span><span class="in">' + inch(z.w) + ' × ' + inch(z.l) + ' in</span></button>'; }).join('') + '</div>'; }).join('');
    body += '<p class="need">Cot and bed sizes differ between manufacturers: measure the <b>inside</b> of the frame.</p>';
    foot = '<button type="button" class="btn" data-go="depth"' + (X.S.size ? '' : ' disabled') + '>Continue to Depth</button>';
  } else if (U.step === 'depth') {
    var z = X.S.size && sizeByKey(X.S.size);
    if (!z) {
      body = '<h2 class="q">How deep should the mattress be?</h2><p class="sub">The depths depend on the collection, so choose your size first.</p><p class="need">Baby Cot sizes come in <b>10 or 12 cm</b>. Junior sizes come in <b>14 or 16 cm</b>.</p>';
      foot = '<button type="button" class="btn" data-go="size">Choose your size</button>';
    } else {
      var hz = heightsFor(z);
      body = '<h2 class="q">How deep should the mattress be?</h2><p class="sub">' + esc(groupByKey(z.g).name) + ' comes in ' + hz.map(function (h) { return h.cm; }).join(' or ') + ' cm. Length and width stay the same: check the maximum mattress depth your cot or bed allows. A deeper mattress is not automatically a better one.</p><div class="cards">' + hz.map(function (h) {
        var p = priceOf(z, h), on = X.S.height === String(h.cm), av = shopHas('height', String(h.cm));
        return '<button type="button" class="card hc' + (on ? ' on' : '') + '" data-pick-height="' + h.cm + '"' + (av === false ? ' disabled' : '') + '><span class="cm">' + h.cm + ' cm</span><span class="in">' + inch(h.cm) + ' in</span>' + (p ? '<span class="pr">' + esc(p) + '</span>' : '') + '<span class="dsc">' + esc(h.desc) + '</span></button>'; }).join('') + '</div>';
      foot = '<button type="button" class="btn ghost" data-go="size">Back</button><button type="button" class="btn" data-go="review"' + (X.S.height ? '' : ' disabled') + '>Review</button>';
    }
  } else {
    var fc = bagFace();
    body = '<h2 class="q">Review your order</h2><ul class="rv">' + ORDER.map(function (o) { return '<li><span>' + o[1] + '</span><b>' + (chosenLabel(o[0]) ? esc(chosenLabel(o[0])) : '<i>Not chosen yet</i>') + '</b></li>'; }).join('') +
      '</ul><p class="bp s incl">Every mattress is <b>Medium</b> firmness with a <b>100% cotton</b> cover. Both are explained in the description; there is nothing to select.</p><div class="rvp"><span>Price</span><b>' + (complete() && priceNow() ? esc(priceNow()) : '<i>Choose a size and a depth</i>') + '</b></div><p class="guide">' + esc(fc.guide) + '</p>';
    foot = '<button type="button" class="btn ghost" data-go="depth">Back</button><button type="button" class="btn big' + (fc.ready ? ' ready' : '') + '" data-bag="1"' + (fc.enabled ? '' : ' disabled') + '>' + fc.text + '</button>';
  }
  return '<header class="hd"><div class="hdt"><span class="stp">Step ' + idx + ' of 3</span><b>' + esc(DATA.product.name) + '</b></div><button type="button" class="x" data-close aria-label="Close the configuration">×</button></header><div class="prog">' + PSTEPS.map(function (s, i) { return '<i class="' + (i < idx ? 'on' : '') + '"></i>'; }).join('') + '</div><div class="bd"><p class="natl"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16z" fill="currentColor"/></svg>A natural environment for your baby · 100% natural latex · 100% cotton cover</p>' + body + '</div><footer class="ft">' + foot + '</footer>';
}
function phoneCss() { return PH_CSS; }
function openSheet() {
  if (PH) { return; }
  pageStylePhone();
  var hostEl = doc.createElement('div'); hostEl.id = 'ddp-sheet'; doc.body.appendChild(hostEl);
  var R = hostEl.attachShadow ? hostEl.attachShadow({ mode: 'open' }) : hostEl;
  R.innerHTML = '<style>' + phoneCss() + '</style><div class="sheet" role="dialog" aria-modal="true" aria-label="Configure your mattress"></div><div class="toast" role="status"></div>';
  var U = { step: nextStepP() }, sh = $('.sheet', R), toast = $('.toast', R);
  function draw() { sh.innerHTML = phSheetHtml(U); var b = $('.bd', sh); if (b && draw.keep != null) { b.scrollTop = draw.keep; } }
  function say(t) { toast.textContent = t; toast.classList.add('on'); win.clearTimeout(say.t); say.t = win.setTimeout(function () { toast.classList.remove('on'); }, 2600); }
  function close() { doc.documentElement.classList.remove('ddp-lock'); if (hostEl.parentNode) { hostEl.parentNode.removeChild(hostEl); } PH = null; X.hooks.draw = null; X.hooks.prices = null; X.hooks.state = null; refreshCta(); }
  sh.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('button') : null; if (!t || t.disabled) { return; } var v;
    if (t.hasAttribute('data-close')) { close(); return; }
    if ((v = t.getAttribute('data-go'))) { U.step = v; draw.keep = 0; draw(); return; }
    if ((v = t.getAttribute('data-pick-size'))) {
      var prev = rawPrice(); X.S.size = v; push(); draw();
      if (X.S.height) { awaitPrice(prev, function () { draw(); readOthers(); }); }
      return;
    }
    if ((v = t.getAttribute('data-pick-height'))) { var prev2 = rawPrice(); X.S.height = v; push(); draw(); awaitPrice(prev2, function () { draw(); readOthers(); }); return; }
    if (t.hasAttribute('data-bag')) { var f = bagFace(); if (f.face === 'checkout') { close(); openCart(); } else if (f.enabled) { if (addToBag()) { say('Added to your bag'); } else { say('The store\'s bag button is not ready yet. Please try again.'); } } draw(); return; }
  });
  function readOthers() { var z = X.S.size && sizeByKey(X.S.size); if (!z) { return; } var miss = missingCombos(z); if (miss.length) { win.setTimeout(function () { readCombos(miss, null, function () { draw(); }); }, 150); } }
  X.hooks.draw = draw; X.hooks.prices = draw; X.hooks.state = draw;
  doc.documentElement.classList.add('ddp-lock'); PH = { host: hostEl, draw: draw, close: close }; draw();
  var fb = $('.btn:not(:disabled)', sh); if (fb && fb.focus) { try { fb.focus({ preventScroll: true }); } catch (e) { /* ok */ } }
}
function nextStepP() { return X.S.size == null ? 'size' : X.S.height == null ? 'depth' : 'review'; }
/* the button and its one-line status, in the shop's own options block */
function refreshCta() {
  if (!ctaBtn || !ctaNote) { return; }
  var z = X.S.size && sizeByKey(X.S.size), h = X.S.height && heightByKey(X.S.height), fc = bagFace();
  ctaBtn.textContent = complete() ? 'Review your mattress' : (X.S.size || X.S.height ? 'Continue configuring' : 'Configure Your Mattress');
  ctaNote.innerHTML = complete() ? '<b>' + esc(chosenLabel('size')) + ' · ' + esc(chosenLabel('height')) + '</b>' + (priceNow() ? ' · ' + esc(priceNow()) : '') : esc(fc.guide);
}
function mountCta() {
  if (ctaBtn && doc.body.contains(ctaBtn)) { return true; }
  var r = shopRoot(); if (!r) { return false; }
  var first = $('.details-product-option', r); if (!first || !first.parentNode) { return false; }
  pageStylePhone();
  ctaBtn = doc.createElement('button'); ctaBtn.type = 'button'; ctaBtn.id = 'ddp-cta'; ctaBtn.onclick = openSheet;
  ctaNote = doc.createElement('p'); ctaNote.id = 'ddp-note'; ctaNote.setAttribute('aria-live', 'polite');
  first.parentNode.insertBefore(ctaNote, first); first.parentNode.insertBefore(ctaBtn, ctaNote);
  doc.documentElement.classList.add('ddtv-phone'); pull(); refreshCta();
  shopWatch = setInterval(function () { if (!doc.hidden && !X.busy) { if (pull() && PH) { PH.draw(); } refreshCta(); carousels(); } }, 1200);
  doc.addEventListener('change', function (e) { if (!X.busy && e.target && e.target.closest && e.target.closest('.details-product-option')) { win.setTimeout(function () { pull(); refreshCta(); if (PH) { PH.draw(); } }, 120); } }, true);
  carousels(); return true;
}
function unmountPhone() { if (PH) { PH.close(); } if (ctaBtn && ctaBtn.parentNode) { ctaBtn.parentNode.removeChild(ctaBtn); } if (ctaNote && ctaNote.parentNode) { ctaNote.parentNode.removeChild(ctaNote); } ctaBtn = null; ctaNote = null; clearInterval(shopWatch); doc.documentElement.classList.remove('ddtv-phone'); }
function onPage(page) {
  var pid = page && page.type === 'PRODUCT' ? Number(page.productId) : null;
  if (pid != null && CFG.products.indexOf(pid) >= 0) { if (lastPid !== pid) { unmountPhone(); } var tries = 0; (function go() { if (!mountCta() && ++tries < 60) { setTimeout(go, 150); } })(); lastPid = pid; }
  else { unmountPhone(); lastPid = null; }
}
function currentProductId() { var n = $('[class*="ecwid-productBrowser-ProductPage-"]'), m = n && /ecwid-productBrowser-ProductPage-(\d+)/.exec(String(n.className)); return m ? Number(m[1]) : null; }
function boot() {
  if (booted) { return; } booted = true; var E = win.Ecwid;
  E.OnPageLoaded.add(onPage); if (E.OnCartChanged) { E.OnCartChanged.add(onCart); }
  var id = currentProductId(); if (id == null && win.__ddtvPage) { id = Number(win.__ddtvPage.productId); }
  if (id != null) { onPage({ type: 'PRODUCT', productId: id }); }
}
(function waitEcwid(n) { if (win.Ecwid && win.Ecwid.OnPageLoaded) { boot(); return; } if (n < 300) { setTimeout(function () { waitEcwid(n + 1); }, 100); } })(0);

}());
