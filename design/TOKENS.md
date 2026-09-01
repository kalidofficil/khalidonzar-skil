# Version 2 — visual tokens

The palette is not applied to the footage. It is derived *from* it, then used for
everything that is not footage.

## What the film actually looks like

Twelve frames were sampled from each of the eight source clips and every pixel
classified by hue, saturation and value. The warm content of the film — lamp
light, wood, lit windows, the low sun on the tower — lands in a narrow band:

| clip | mean frame | warm pixels | mean warm hue | mean warm colour |
|---|---|---|---|---|
| 01 office introduction | `#4F4640` | 38.6% | 24° | `#624837` |
| 02 office pullback | `#504640` | 38.4% | 24° | `#624837` |
| 03 building exterior | `#4F4540` | 38.5% | 24° | `#624836` |
| 05 boardroom | `#676C72` | 17.5% | 23° | `#7E5A43` |
| 06 project room | `#776956` | 46.7% | 31° | `#907558` |
| 07 corridor | `#647278` | 5.1% | 23° | `#875C41` |
| 08 contact | `#544F45` | 35.2% | 30° | `#5F4B38` |
| 09 Dubai aerial | `#63757C` | 5.2% | 26° | `#906A4E` |

**Hue 20–35° in every clip.** Cinematic orange sits at 21° and warm amber at 33°,
so those two are literally the film's own colour. Ember (13°) and oxblood (6.5°)
are hotter than anything on screen, which is exactly why they work as accent and
shadow rather than as surfaces.

The other half of the finding: the film's warm colours are *dark and desaturated*
(`#624837`, `#907558`) — nothing on screen is vivid. So vivid orange is rationed
to accents and small marks, and the large surfaces use ink and the warm near-blacks
below.

## The grade

Version 1 cooled every clip to reconcile blue hour with daylight. That fought the
palette. Version 2 grades neutral-to-warm and lets the footage's own light carry
the colour. Faces are never pushed: the warm bias sits in mids and highlights, and
saturation moves at most ±5%.

## Colour

| token | value | role |
|---|---|---|
| `--ink` | `#0A0A0B` | the ground almost everything sits on |
| `--umber` | `#2A211A` | warm near-black, sampled between ink and the film's warm shadows |
| `--sepia` | `#3B2C22` | raised card ground on dark sections |
| `--oxblood` | `#45140E` | deep shadow field, the contact section's ground |
| `--ember` | `#E94516` | the hot accent — rules, marks, one word in a headline |
| `--orange` | `#FF6A1A` | primary accent on dark; the film's own hue |
| `--amber` | `#F5A13A` | secondary warm, figures and highlights |
| `--cream` | `#F3EBDD` | type on dark, and the light sections' ground |
| `--linen-2` | `#E8DECD` | card ground on light sections |
| `--stone` | `#C9BDB0` | secondary type on dark |
| `--warm-grey` | `#81756D` | rules and non-text marks only — fails AA as body text |

Text colours are separated per surface because one value cannot serve both grounds.

| surface | primary | secondary | tertiary | accent |
|---|---|---|---|---|
| dark (`--ink`) | `#F3EBDD` 16.3:1 | `#C9BDB0` 10.4:1 | `#8E827A` 5.3:1 | `#FF6A1A` 6.8:1 |
| light (`--cream`) | `#14100E` 15.9:1 | `#4A423C` 8.1:1 | `#6B6058` 5.1:1 | `#B32E08` 5.4:1 |

`--ember` on cream is 3.2:1 — display sizes and graphics only, never body text.
`--warm-grey` on cream is 3.8:1 — never type.

## Type

- **Instrument Serif** — display headlines, pull quotes, the closing line. One
  weight, high contrast, real character at size. Self-hosted, latin subset, 20 KB.
- **Manrope** — body, navigation, figures, labels, buttons. Variable 400–800,
  self-hosted, 24 KB.

Rules: sentence case; uppercase only on small utility labels with tracking; body
never below 15px; headlines carry deliberate line breaks rather than falling where
the box ends.

## Motion

| element | movement | settles |
|---|---|---|
| content cards | ≤4° rotateX, ≤3° rotateY, 14px depth | flat within 15% of viewport centre |
| section entrance | 18px rise, 600ms | once, never repeats |
| film | scroll-linked playhead, eased | speaking scenes hold |

All of it is removed under `prefers-reduced-motion`, and card rotation is halved
below 900px.

## The nine scenes and their seven joins

Scenes 4 and 5 are two halves of one source clip and share one file, so that join
does not exist. The remaining seven were chosen by measurement — the outgoing final
frame and the incoming first frame were compared for structure (normalised
correlation of a 24×16 luma signature) and exposure.

| join | structure | exposure Δ | transition |
|---|---|---|---|
| 1 → 2 introduction → pullback | 0.657 | 9 | optical dissolve, 260ms |
| 2 → 3 pullback → exterior | 0.244 | 30 | architectural wipe, 620ms |
| 3 → 4 exterior → boardroom | 0.172 | 22 | architectural wipe, 620ms |
| 4 → 5 boardroom → through the screen | — | — | none: one continuous clip |
| 5 → 6 transition → project room | 0.510 | 5 | optical dissolve, 260ms |
| 6 → 7 project room → corridor | 0.453 | 9 | optical dissolve, 260ms |
| 7 → 8 corridor → contact | 0.910 | 2 | frame match, 80ms cut |
| 8 → 9 contact → Dubai aerial | 0.912 | 2 | frame match, 80ms cut |

Two joins are near-perfect frame matches and take a cut. The two weakest are the
only places a wipe is used, and it is a dark vertical edge travelling the frame —
a mullion, not a page transition.

## One documented compromise

Source clip 03 opens on the same desk as clips 01 and 02 — its first 47% repeats
the scene the film has already left. It therefore enters at frame 70, the moment
the camera clears the glass, and runs to the end. Nothing is dropped; the clip is
joined at the only point where it does not send the viewer backwards.

## Framing

The stage is full-viewport, so each clip is cropped to 3:2 for desktop and 9:16
for mobile with a per-clip offset read off the footage, then CSS covers the real
viewport from there. Offsets protect, in order: Khalid's face, then the MacBook,
the boardroom screen, the team, and the skyline.
