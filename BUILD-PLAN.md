# Khalid Ounzar — Portfolio Rebuild
## Audit, reference analysis and build plan

Status: **awaiting approval.** No website code has been modified and no video has
been generated. Everything below is findings and proposals.

---

# 1. Current website findings

## 1.1 What exists

Static HTML/CSS/vanilla JS on GitHub Pages. No framework, no build step, no
runtime third-party requests. First screen 181 KB over 8 requests.

| file | lines | role |
|---|---|---|
| `index.html` | 473 | the single document |
| `assets/css/v3.css` | 571 | tokens, film stage, bands, cards, gate, contact |
| `assets/js/v3.js` | 589 | scroll↔playhead loop, gate, speaking moments, nav paint |
| `assets/css/capabilities.css` | 121 | capabilities section |
| `assets/js/capabilities.js` | 89 | the four-card arrival |
| `assets/css/case-studies.css` | 301 | case-study environment |
| `assets/js/case-studies.js` | 527 | scenes, hash routing, unpack, portal |
| `assets/data/case-studies.js` | ~270 | **single source of truth for every figure** |
| `legacy.html` + `styles.css` + `main.js` | 1,568 | V1 archive, not loaded by the site |

Current section order: film → positioning → capabilities → process → evidence
(case studies) → about → contact.

## 1.2 The engineering worth keeping

- **The scrub loop in `v3.js`.** One `requestAnimationFrame` tick, one scroll
  source of truth (`window.scrollY`), lerp smoothing, a one-frame seek threshold,
  a single in-flight seek, and a LEAP cut for scrollbar drags. Measured at
  **0.000 s drift across seven positions**, surviving fast, reverse and
  direction-change scrolling. This is the hardest part of the site and it is
  already built.
- **`window.__csFrame`** — a shared per-frame registry so new modules never add a
  second animation loop.
- **`assets/data/case-studies.js`** — null-not-zero discipline, `ctr.kind` stored
  beside every CTR, totals computed at runtime, no verdicts without business data.
- The letterbox-aware hero framing (`CROP` table, element shaped to the live
  picture) and the blurred same-frame surround.
- Reduced-motion, no-JS and video-failure branches, all tested.
- Hash routing (`#/ecommerce/product-01`) that survives without a server rewrite.

## 1.3 What the new brief deletes

| removed | consequence |
|---|---|
| The **gate** (`Unlock my portfolio` / `Unlock experience`) and its scroll lock | `v3.js` loses ~120 lines: gate state, buffer polling, the re-pin scroll guard, the reveal-at-0.867 s handoff |
| The **scroll-scrubbed hero** (20,046 px of pinned travel) | the hero becomes one viewport of ordinary autoplay. **The scrub machinery is not thrown away — it moves to the new laptop cinematic in §7**, which is the section that now needs it |
| The **two category entry cards** in Case Studies | products render directly on the page; the portal card→study transition is kept |
| The **`#positioning` block** ("I buy attention…", the small-accounts paragraph) | replaced by the three-stage animated introduction |
| The **About side portrait** | replaced by a typography-led layout |
| **Cobalt & Bone** (committed at `5b2ba6d`) | superseded by the lavender/violet system in §4 |

## 1.4 Source-material findings — read this before approving

1. **`Khalid_Ounzar_Portfolio_Master_Brief.md` does not exist.** It is not in the
   repository, not in the uploads directory, and not anywhere on this machine. The
   factual sources I actually have are `README.md` (16.8 KB, unusually complete),
   `assets/data/case-studies.js`, `cinematic/BRIEF.md` and `design/TOKENS.md`.
   **Everything factual in this plan is drawn from those.** If the master brief is
   a separate file, please attach it — some copy below may need correcting against it.

2. **Parker's and COBA do not appear anywhere in the project.** A case-insensitive
   search across every `.js`, `.html` and `.md` file returns zero matches. The
   Creative Strategy category is currently `status: "pending"` with the note *"This
   work is being prepared… it stays empty until there is something real to show."*
   I cannot write these case studies from nothing. See §9.

3. **Contact destinations are confirmed and need no question:**
   WhatsApp `https://wa.me/971589680262` · LinkedIn
   `linkedin.com/in/khalid-ounzar-664bbb424` · email `ounzar.khalid1999@gmail.com`.

4. **Still outstanding from earlier rounds:** six product images
   (`image.src: null` on all six), five masked Ads Manager screenshots, product 03
   metrics (`metrics: null`), and product 01's exact hook rate.

---

# 2. Reference analysis

Every reference below was decoded and inspected frame by frame with ffmpeg. Frame
sheets are in the scratchpad. Nothing here is inferred from a filename.

## 2.1 The purple/pink glass image

**What is visible:** a lavender-to-magenta sky gradient over a blurred lake and
mountains; a large frosted browser window floating on it with ~20 px corner radii;
a hairline white border that brightens along the top-left edge; a vertical rail of
frosted square icon tiles on the left; pill-shaped translucent tabs where the
selected tab is a *lighter* frosted fill rather than a different hue; content
cards that are opaque where they carry dense material and translucent where they
do not; one saturated magenta control (top-right) that glows; fine grain over the
whole image.

**What I take from it:**

| observed | where it goes |
|---|---|
| Lavender→magenta atmospheric gradient, never flat | page ground, hero surround, section bridges |
| Glass is *white at low alpha over colour*, not grey | `--glass-*` tokens |
| Border is a 1 px white hairline that varies in brightness around the edge | `--glass-border` + a lit top-left edge |
| Dense content sits on a **denser** surface | `--glass-3` / `--glass-solid` behind case-study text — this is the readability rule |
| Exactly one saturated pink control per view | primary buttons and the active state only |
| Selected state = more light, not another colour | nav, tabs, active project |
| Visible grain | one fixed SVG-noise overlay at 3–4 % |

**What I deliberately do not take:** the heavy outer glow around the window (it
would fight text), and the pale-pink-on-pale-pink text the brief also warns about.

## 2.2 Pinterest clip 1 — `91563c21…DIY_gift_ideas` (15.46 s, 720×1280, no cuts)

Not a motion reel: it is a **split-screen coding tutorial**. Top half is a browser
preview of an AirPods Max slider; bottom half is the code editor that builds it.

The preview shows a **previous / active / next carousel**: the active product is
sharp, large and centred; the neighbours are blurred, scaled down and pushed to the
edges; the background gradient re-tints to the active product's colour (green →
blue → red → white → graphite → mint). The editor pane confirms the technique
literally — `.previous { opacity:0; filter:blur(5px); transform:translateX(-100%) }`,
an `.inactive` blur class, `transition: 1s`, and a `setInterval(…, 1000)` autoplay.

**Adapted in:** Selected Work project focus (§6) — neighbouring projects blurred
and scaled at the edges, the focused one sharp, and the section's ambient tint
following the focused project. Driven by scroll position, not `setInterval`.

## 2.3 Pinterest clip 2 — `59d2d5a2…self-care_Sunday` (7.03 s, 720×720, no cuts)

An editorial page floating on a deep violet ground, transitioning between two
scenes ("Board **Arca**" → "Take **Shelter**").

Frame-by-frame, the movements are:

1. **Two-speed kinetic type.** The title is set in two weights and the halves
   translate at *different* rates — at 0.6 s "Boa…rca" is visibly compressed
   because the light word is exiting faster than the bold word. They cross.
2. **Layered horizontal parallax.** Hero object, ground, haze and title each
   travel left at their own rate.
3. **A fixed anchor.** The standing figure on the right does not move at all while
   the world slides past it.
4. **A route graph** along the bottom — dots on a curve — slides in sync and acts
   as a progress indicator, the active node held near centre.
5. **A deliberate empty beat** at 4.8–5.6 s: the scene clears to sky and ground
   before the next object enters from the right. A breath, not a cut.

**Adapted in:** the three-stage introduction (§3, two-speed type), section-to-
section bridges (parallax + the empty beat used as a *transition*, never as a dead
screen), Selected Work horizontal travel, and the process rail (route graph).

## 2.4 Pinterest clip 3 — `52235781…cozy_valentine` (5.00 s, 720×540, no cuts)

A product card cycling through four items (Sofa cake → Blob sofa → Herb pods →
Sofa cake) — roughly **1.25 s per cycle: ~0.45 s moving, ~0.80 s held and readable.**

1. The whole assembly **slides left**; the outgoing colour panel and its 3D object
   exit left as the incoming one enters from the right.
2. **Directional motion blur** on every moving layer during the slide, resolving
   to zero at rest. This is the signature of the clip.
3. The right-hand **list rows swap with a stagger**, each row translating slightly
   behind the one above it.
4. Small **props overshoot** — they travel further than the main panel and settle
   slightly later.
5. The panel's **hue changes per item**; the title is masked by the panel's edge.

**Adapted in:** capability cards (§4) and process cards (§5) — enter with
directional blur that resolves to zero, supporting points staggered behind the
heading, and a hue that belongs to the card.

## 2.5 The screen recordings

Two files were attached. They are different:

- **`46ea5a1f-…20.08.56.webm` (25.4 s, 1920×1080)** — a screen capture of a
  YouTube tutorial, *Build a Premium Portfolio Website in 30 Minutes (Claude +
  Higgsfield)*, scrolling a finished portfolio. Useful as context for the target
  standard; it is **not** the laptop cinematic.
- **`d2f77e42-…20.09.58.webm` (13.5 s, 1920×1080)** — **this is the laptop
  cinematic reference.** Everything in §7 comes from it.

### The laptop sequence, frame by frame (6.0 s → 9.6 s of recording B)

| t | what is on screen |
|---|---|
| 6.0 s | Subject centred in a dark room, magenta/violet rim light behind him. He holds a **closed** laptop at chest height; only its edge is lit. |
| 6.4 s | The lid is **open**, screen to camera, showing a lavender/pink wallpaper with type on it. His face is above the screen, now lit by it. |
| 6.8 s | Camera has **pushed in**. The screen fills most of the frame; the face is cropped to the top edge. |
| 7.2 s | Camera is **inside the bezel**. Only the screen's gradient and its type remain. |
| 7.6 s | **White blowout** — the screen overexposes to near-white. |
| 8.0 s | The blowout retreats to a glow band at the top and the **next section's real content rises from beneath it**. |
| 8.4–9.6 s | The section settles, fully readable. |

**The essential technique: the white blowout is the seam.** It is what lets
generated video hand off to real DOM without a visible cut. I will reproduce that
exactly — and it is also why the final hand-off belongs in the website rather than
in the video.

---

# 3. Assets and components preserved

**Kept unchanged:** the master film and its four derivatives, both posters, the
caption track, `master.en.vtt`, the six-product data file and its honesty rules,
hash routing, the portal card→study transition, Instrument Serif + Manrope
(self-hosted, preloaded), `scripts/serve.js`, `scripts/build-media.sh`,
`legacy.html`.

**Kept and relocated:** the scrub loop (hero → laptop cinematic), `window.__csFrame`,
the `html.rm` reduced-motion branch, the video-failure poller, `paintNav`.

**Retired:** the gate, the hero pin, the two category entry cards, `#positioning`,
the About portrait figure, the Cobalt & Bone tokens.

---

# 4. Palette and typography

## 4.1 Tokens — all colour in one `:root` block in `v3.css`

```
ATMOSPHERE      --void #1B0F2E   --night #2A1650   --violet-900 #3D1E6D
                --violet-700 #6B3FB8   --violet-600 #7B4FC8   --violet-500 #8B5FD6
                --lavender-400 #A98BE8  --lavender-300 #C4A9EE
                --lavender-200 #DCC8F5  --lavender-100 #EFE4FB  --paper #F6EFFD

PINK            --pink-500 #E96BC8  --pink-300 #F7A8E2  --pink-ink #A11A79

INK (on light)  --ink #2A1650   --ink-2 #4A2F7A   --ink-3 #5B4285

GLASS           --glass-1 rgba(255,255,255,.10)   --glass-2 rgba(255,255,255,.16)
                --glass-3 rgba(255,255,255,.26)   --glass-deep rgba(45,22,80,.62)
                --glass-border rgba(255,255,255,.34)
                --glass-border-lit rgba(255,255,255,.55)
                --blur-1 18px  --blur-2 28px  --blur-3 40px

GRAIN           --grain-opacity .035
MOTION          --ease-out cubic-bezier(.16,1,.3,1)  --ease cubic-bezier(.22,.61,.36,1)
                --dur-fast 320ms  --dur 640ms  --dur-slow 1000ms
```

## 4.2 Measured contrast (computed, not assumed)

| pair | ratio | |
|---|---|---|
| `--paper` on `--void` | 16.18:1 | AAA |
| `--paper` on `--night` | 14.06:1 | AAA |
| `--lavender-200` on `--night` | 10.25:1 | AAA |
| `--ink` on `--lavender-100` | 12.91:1 | AAA |
| `--ink` on `--lavender-300` | 7.72:1 | AAA |
| `--ink-2` on `--lavender-200` | 6.88:1 | AA |
| `--ink-3` on `--lavender-100` | 6.70:1 | AA |
| `--pink-500` on `--void` | 6.41:1 | AA |
| `--pink-ink` on `--lavender-100` | 5.84:1 | AA |
| `--paper` on `--glass-deep` over night | 11.87:1 | AAA |

**Two rules that fall out of the measurement:**

- **`--violet-500 #8B5FD6` fails as a button fill** — white on it is 4.46:1.
  Primary buttons use `--violet-600 #7B4FC8` (5.53:1) or `--violet-700` (6.93:1).
- **`--pink-500` is never body text on a light ground.** On light, pink text is
  `--pink-ink #A11A79`. `--pink-500` is for dark grounds and for fills.

Dense content (case studies, About, Contact form) sits on `--glass-3` or
`--glass-deep`, never on `--glass-1`. This is the direct answer to *"do not put
low-contrast white text over pale pink backgrounds."*

## 4.3 Typography — keep the existing pair, change the scale

Instrument Serif (display) + Manrope (sans) are already self-hosted, subset and
preloaded; swapping them costs two new font loads and buys nothing the brief
asks for. "Large, expressive typography" is delivered by **scale and treatment**,
not a new family:

- Display: `clamp(3.2rem, 9vw, 9rem)`, `line-height: .92`, `letter-spacing: -.035em`.
- The two-speed kinetic treatment from clip 2 uses Instrument Serif roman against
  Instrument Serif *italic* for the moving half.
- Body stays Manrope at the current comfortable size; measure capped at 62 ch.

## 4.4 Footage and images keep their own colour

No tint, duotone or filter is applied to the master film, the posters, product
photographs or Ads Manager screenshots. Blending happens **around** them: a
lavender vignette on the surrounding surface, a violet scrim only where type must
sit over the picture, and glass frames at the edges.

---

# 5. Proposed section copy

Copy fixed by the brief is marked **[exact]**. Everything else is a proposal.

### §2 Introduction **[exact]**
> I'm Khalid Ounzar.
> Performance Marketer & Creative Strategist.
> I connect strategy, cinematic creative, and paid media to help brands grow.

### AI-footage disclosure (relocated, discreet)
Next to the film's info control:
> The cinematic environments are AI-generated visualisations. The company, office
> and team shown are not a real employer.

### §3 Capabilities
Heading **[exact]**: Strategy. Creative. Performance.
Sub **[exact]**: Four connected skills that bring the idea, the ad, and the
customer journey together.

**01 Paid Media** — Meta Ads strategy and daily buying for cash-on-delivery
products. Structure and pacing set against the offer, not the platform's estimate.
· 1,064 reported purchases at $0.56 on one campaign · $0.95 CPM held across
131,120 impressions

**02 Creative Strategist** **[exact]** — I turn audience insights into creative
angles, hooks, scripts, and storyboards for ads and cinematic brand content.
Testing connects the creative idea to campaign performance.
· Hooks, concepts, and scripts for paid social **[exact]**
· AI-assisted visuals and video production **[exact]**

**03 Landing Pages** — The page is the second half of the ad. One promise carried
from the hook to the buy button, built or rebuilt around the offer.
· Offer, bundle and guarantee structure · Built or rebuilt around a validated product

**04 Measurement & Optimisation** — Reported, delivered and confirmed are three
different numbers. Daily buying decisions made on the one that matters.
· Budget pacing, audience and placement decisions · COD confirmation and delivery
tracked apart from platform reporting

### §4 Process (order **[exact]**)

**Research & Insights** — Product and competitor research before a dirham is spent:
Facebook Ads Library for what is already running, 1688 for what is being sourced.
*A product research team searched Chinese marketplaces; I worked from what that
research surfaced.*

**Creative Strategy** — Audience insights turned into angles, hooks, scripts and
storyboards. The creative idea is written to be testable, not just watchable. *Mine.*

**Production & Launch** — Creative produced, the landing page built or rebuilt
around the offer, the campaign structured and launched. *Mine.*

**Measurement & Optimisation** — Daily buying against campaign metrics, then the
part the dashboard does not show: COD confirmation, delivery, returns and what is
left afterwards. *Buying is mine. Confirmation calls, importing and delivery
belong to the owner and the team.*

### §5 Results statement **[exact]**
> Strategy is only useful when it produces results.

### §7 About (proposed)
> I buy Meta Ads for physical products sold cash on delivery, and I build the
> creative that carries them.
>
> That market rewards a particular kind of care. The platform will happily report
> purchases that never arrive, so the job does not end at the dashboard — product
> research, competitor teardowns and post-purchase analysis take as much of my
> week as the buying does.
>
> The creative side is not a separate skill. Audience insight becomes an angle, an
> angle becomes a hook, a hook becomes a script and a storyboard, and the campaign
> tells me within days whether the idea was right. Writing the creative and buying
> the media with the same pair of hands is the whole advantage.
>
> Based in Dubai. Google Ads and TikTok Ads are supporting skills — I use them
> where a campaign calls for them and would not present myself as a specialist in
> either.

### §8 Contact
Heading: **Let's build what performs.**
Primary **[exact]**: Let's Talk on WhatsApp → `https://wa.me/971589680262`
Secondary **[exact]**: Connect on LinkedIn → `linkedin.com/in/khalid-ounzar-664bbb424`
Quiet third option: email + the existing enquiry form, demoted below the buttons.

---

# 6. Motion specification

Format: **trigger · movement · timing or scroll distance · readable end state ·
mobile / reduced-motion.**

### M1 · Hero (§1)
Autoplay muted at `playbackRate 1`, `playsinline`, poster + visible play control.
No pin, no scrub, no gate. One viewport (`100svh`). Nav and a single scroll cue
over the footage on a violet scrim. **Scroll passes straight over it at any time.**
*Mobile:* the 720×966 derivative; `preload="metadata"`. *Reduced motion:* poster
with native controls, film on demand.

### M2 · Introduction, three stages (§2) — from clip 2
Trigger: section top crosses 80 % viewport. Pinned for **160 vh**.
- 0–30 %: *"I'm Khalid Ounzar."* — two-speed entry, "I'm" arriving from above at
  1.0×, the name from the left at 1.35×, crossing mid-flight, resolving together.
- 30–62 %: stage 1 masks upward behind a horizon line as *"Performance Marketer &
  Creative Strategist."* rises through it.
- 62–100 %: both clear left at different rates; the third line scales up from 0.94
  and settles.
Each stage holds **≥ 0.9 s / ≥ 25 % of its scroll span** fully still and readable.
*Mobile:* 120 vh, single-speed, no masking. *Reduced motion:* all three lines
stacked, visible, no pin. **All three are real `<h1>`/`<p>` text at all times.**

### M3 · Capabilities heading (§3)
Trigger: heading crosses 75 %. "Strategy." drops from −80 px with a 12 px
overshoot (520 ms) · "Creative." at +180 ms · "Performance." at +360 ms, the last
word picking up `--pink-500`. Total 1.04 s, then a **600 ms hold before the cards
move.** *Reduced motion:* all three visible immediately.

### M4 · Capability cards (§3) — from clip 3
Trigger: card row crosses 78 %. Each card enters from +40 % of its own width to
the right, `blur(10px) → 0`, `opacity 0 → 1`, settling with a 6 px overshoot.
**640 ms each, 150 ms stagger.** The `<h3>` leads; the two supporting points
follow at 60 ms intervals behind it. Rest state is flat, unblurred, tap-sized.
*Mobile:* one column, 180 px travel, no blur (cost), same stagger.
*Reduced motion:* no transform, no blur.

### M5 · Process rail (§4) — from clips 2 + 3
A horizontal route graph beneath four glass cards; the active node fills as its
card reaches centre. Cards translate in with the same blur-to-zero as M4.
Scroll-linked over **120 vh**, not pinned. *Mobile:* vertical rail down the left
edge, cards stacked. *Reduced motion:* static list, nodes all filled.

### M6 · Results statement → Selected Work (§5→§6) — from clip 2's empty beat
The statement scales from 0.96 to 1.0 and holds. Then the **transition is the
bridge, not a gap**: the line clears upward at 1.3× while the first project row
enters from below at 1.0× — they overlap for 240 ms, so no empty screen ever
exists. Total 90 vh. *Reduced motion:* a normal section break.

### M7 · Selected Work (§6) — from clip 1
All six campaigns and every creative project render directly on the page. Category
labels ("E-commerce / Paid Media", "Creative Strategy / Brand Content") group them;
**no entry cards, no gate.** The focused project is sharp and at `scale(1)`;
neighbours sit at `scale(.94)` with `blur(3px)` and 62 % opacity, resolving as they
reach centre. The section's ambient tint lerps toward the focused project's hue.
Card → case study keeps the existing 640 ms portal.
*Mobile:* single column, no blur, focus effect disabled. *Reduced motion:* a plain grid.

### M8 · Laptop cinematic (§7) — see §7 below
Scroll-controlled. **Reuses the existing scrub loop.**

### M9 · About reveal (§8)
Continues directly out of M8's white blowout: the blowout retreats upward over
320 ms as the About type rises 40 px into place, staggered 80 ms per paragraph.
No separate entrance. *Reduced motion:* visible immediately.

### M10 · Contact (§9)
Restrained by instruction. Buttons rise 16 px with a 90 ms stagger; the WhatsApp
button carries one slow pink edge pulse (2.4 s, `prefers-reduced-motion` off only).

### M11 · Global
One fixed SVG-noise grain layer at 3.5 %, `pointer-events:none`. Nav links get a
pink underline that wipes in from the left over 240 ms. All per-frame work goes
through the existing `window.__csFrame` registry — **one loop for the whole site.**

---

# 7. The laptop cinematic — storyboard and production

## 7.1 Shot list, taken from recording B

| # | shot | source frame |
|---|---|---|
| 1 | Wide. Dark room. Khalid centred, closed laptop held at chest height. Magenta/violet rim light behind him, practical light low. | 6.0 s |
| 2 | He opens the lid. Screen light rises onto his face and chest as the gap widens. | 6.0→6.4 s |
| 3 | Camera pushes in. Screen fills two-thirds of frame; face crops to the top edge. | 6.8 s |
| 4 | Camera crosses the bezel. Only the screen's lavender gradient remains. | 7.2 s |
| 5 | **White blowout.** | 7.6 s |
| 6 | Blowout retreats upward; About rises from beneath it. | 8.0→8.4 s |

## 7.2 Division of labour — and why

**Shots 1–4 are generated video. Shots 5–6 are built in the website.**

Generating the screen-to-About hand-off would bake unreadable AI interface text
into the frame and lock the transition's timing to the video. Instead the
generated clip ends on the lavender screen fill; the blowout and the About reveal
are CSS over the final frame. This is exactly how the reference does it — the
white blowout hides the seam — and it keeps the hand-off editable.

## 7.3 Identity continuity

Character reference: `assets/cinematic/master-poster.jpg` (1080×1448, master frame
26 — mouth closed, eyes to camera), plus two further frames sampled from the
master at 12.05 s and 21.55 s for profile and wardrobe. Wardrobe matches the hero
(navy suit, open collar). Negative direction covers identity drift, hand
distortion, unstable laptop geometry and generated screen text.

## 7.4 Credits — measured, not estimated

Balance: **59.63 credits, Plus plan.** No free unlimited allowance
(`unlim.available: false`). Preflighted costs for 5 s:

| model | config | credits |
|---|---|---|
| Seedance 2.5 | 720p | 32.50 |
| Seedance 2.0 | fast, 720p, silent | 17.50 |
| **Kling v3.0** | **std, sound off** | **7.50** |
| gpt-image-2.5 | one 16:9 still | 1.00 |

**Proposed spend — 25.5 of 59.63, leaving 34 in reserve:**

1. 3 × keyframe stills (closed laptop / open laptop / screen fill) — **3 credits**.
   Cheap, and they lock composition, wardrobe and likeness before any video spend.
2. 2 × Kling v3.0 5 s `start_image` + `end_image` runs — **15 credits**. Start and
   end frames give direct control of the camera move, which is the whole shot.
3. 1 × retry allowance — **7.5 credits**.

If the two-shot approach fails on identity, the fallback is one Seedance 2.0 fast
run with `image_references` (17.5), still inside the remaining balance. I will
report actual spend after each step and stop if quality is not there.

## 7.5 Website playback

Scroll-controlled over **180 vh**, reusing `v3.js`'s existing loop verbatim:
lerp smoothing, one-frame seek threshold, single in-flight seek, LEAP for drags.
Format decision is **measured, not assumed** — I will test video scrubbing against
a 60-frame WebP sequence on a throttled mobile profile and pick on results.
*Mobile:* a shorter, lower-bitrate derivative; frame sequence if scrubbing stalls.
*Reduced motion:* a single still of the open laptop, then About. No pin.

---

# 8. Case-study content and evidence gaps

Rendered directly on the main page, grouped by label.

**E-commerce / Paid Media — six products, all with real data**

| # | reported purchases | CPA | spend | impressions | CPM | CTR |
|---|---|---|---|---|---|---|
| 01 | 1,064 | $0.56 | $596.63 | 246,404 | $2.42 | 2.87 % *(all)* |
| 02 | 441 | $0.28 | $125.02 | 131,120 | $0.95 | 3.24 % *(all)* |
| 03 | — | — | — | — | — | — |
| 04 | 328 | $1.47 | $480.93 | 608,805 | $0.79 | 1.81 % *(link)* |
| 05 | 229 | $2.14 | $491.15 | 1,068,666 | $0.46 | 2.29 % *(link)* |
| 06 | 173 | $1.77 | $306.00 | 168,620 | $1.81 | 2.02 % *(link)* |

Totals stay computed at runtime (2,235 purchases, $1,999.73, 2,223,615
impressions, five campaigns). Every honesty rule is preserved: reported purchases
never called delivered orders; link CTR never mixed with CTR (all); no revenue,
ROAS, profit, delivery rate or confirmation rate; no scale/iterate/kill verdict
without business data; product 03 renders a sentence, not a zero.

**Creative Strategy / Brand Content — blocked**

The brief asks for Parker's and COBA. Neither exists in the project in any form.
I will not invent a concept, a contribution or a deliverable. Until you supply
them the group renders its existing honest note rather than filler.

**Other / Concept Work** — hair salon (*Campaign concept*) and real estate
(*Sample strategy*), no figures, labels intact.

**Open gaps:** six product images · five masked Ads Manager screenshots ·
product 03 metrics · product 01 hook rate · **all Parker's and COBA material.**

---

# 9. Mobile, accessibility, performance

**Performance.** Backdrop-filter is the real risk: it is the most expensive
property in this design and the brief explicitly asks that it not make mobile
scrolling sluggish. Rules: at most **three** blurred surfaces composited at once;
`--blur-1 18px` on mobile against 28–40 px on desktop; no `backdrop-filter` on
anything that also animates `transform` in the same frame; grain is one fixed
layer, never per-card. I will measure scroll FPS on a throttled mobile profile and
report it — if a section cannot hold 50 fps, its blur drops to a flat translucent
fill on mobile.

**Media.** Hero `preload="metadata"` with poster; the laptop clip loads only when
Selected Work enters the viewport; product images lazy with explicit dimensions;
responsive sources at 720 / 1080.

**Accessibility.** Every animated line is real text at all times. Keyboard order
follows the DOM; focus rings are 2 px `--pink-500` on dark and `--pink-ink` on
light, both measured. `prefers-reduced-motion` unpins everything, removes blur and
transform, and shows a still for the laptop shot. The page is complete with video
blocked and with JavaScript off. All text meets AA on its own ground — verified by
photographing the rendered page and sampling behind each text run, the method used
in the last round.

---

# 10. Implementation phases

| phase | work | gate |
|---|---|---|
| 0 | This plan | **your approval** |
| 1 | Palette + glass + grain + typography into shared tokens; every existing section repainted | preview |
| 2 | Hero: gate deleted, autoplay full-screen, controls, disclosure relocated | preview |
| 3 | Introduction (M2) + capabilities heading and cards (M3–M4) | preview |
| 4 | Process (M5), results→work bridge (M6), Selected Work flattened (M7) | preview |
| 5 | Laptop cinematic: keyframes → video → scroll scrub → About hand-off | **credit check before generating** |
| 6 | About (M9), Contact (M10), footer | preview |
| 7 | Cross-browser, mobile FPS, contrast, keyboard, reduced motion, no-JS | full report |

---

# 11. Acceptance checklist

- [ ] No gate. Hero footage fills the first viewport and plays automatically, muted, inline, with visible controls and a working poster fallback.
- [ ] Scrolling is never blocked; the visitor can leave the hero at any moment.
- [ ] The three introduction lines appear as specified, hold still long enough to read, and are real HTML.
- [ ] "Strategy." / "Creative." / "Performance." arrive in order and the completed heading holds before the cards move.
- [ ] Four capability cards, correct copy, clip-3 motion, readable and tappable on mobile.
- [ ] Four process steps in the exact order, my contribution separated from the owner's and the team's.
- [ ] The results statement flows into Selected Work with no empty screen and no second gate.
- [ ] All six campaigns and every creative project are visible on the main page; each card opens its study.
- [ ] Reported ≠ delivered; link CTR ≠ CTR (all); no invented revenue, ROAS, profit or missing figures.
- [ ] Laptop cinematic: same face, hair, beard and wardrobe as the hero; stable hands and laptop; no generated interface text; scroll-controlled; releases into About.
- [ ] About has no side portrait and is typography-led.
- [ ] Contact: WhatsApp primary, LinkedIn secondary, both live and correct.
- [ ] Lavender/violet/glass applied everywhere; footage and screenshots keep their own colour.
- [ ] Every colour, glass value, type step, spacing step and motion constant lives in shared variables.
- [ ] AA contrast everywhere, measured in a browser.
- [ ] Keyboard, focus, reduced motion, no-JS and video-blocked paths all work.
- [ ] Mobile holds ≥ 50 fps while scrolling; no horizontal overflow at 390 px.
- [ ] Nothing published publicly without approval.
