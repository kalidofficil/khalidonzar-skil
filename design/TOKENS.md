# Version 3 — visual tokens

The palette is not applied to the footage. It is measured *from* the master, then
used for everything that is not the master.

## What the master actually looks like

Thirty-four frames were sampled across `khalid-cinematic-master-v3.mp4` and every
pixel classified by hue, saturation and value.

| measure | value |
|---|---|
| mean frame | `#4B4D50` |
| warm pixels | 19.0% |
| mean warm colour | `#725641` |
| warm hue histogram | **20–30° 71%**, 10–20° 16%, 30–40° 12%, 0–10° 1% |

**Hue 20–30° carries 71% of the master's warm content.** Cinematic orange sits at
21° and warm amber at 33°, so those two are literally the film's own colour. Ember
(13°) and oxblood (6.5°) are hotter than anything on screen, which is exactly why
they work as accent and shadow rather than as surfaces. The master's warm colours
are also dark and desaturated (`#725641`), so vivid orange is rationed to accents
and small marks while the large surfaces stay ink.

## On the supplied colour references

The two reference screenshots are purple and magenta dominant — lilac glass over a
violet sunset, and a plum ground with hot-pink accents. That conflicts with the
brief's own palette and its avoid-list, which names purple-to-blue gradients and
rainbow colour, and with the instruction to adapt the references *to the footage*.

What was taken from them is therefore structural rather than chromatic: a deep
near-black ground, a single luminous saturated accent rather than many, a soft
glow field behind raised surfaces, rounded translucent card edges, and strong
separation between subject and ground. The hue was rotated from magenta into the
ember family the master already contains. The three motion references are
red / black / off-white and needed no such adjustment.

## Colour

| token | value | role |
|---|---|---|
| `--ink` | `#0A0A0B` | the ground almost everything sits on |
| `--umber` | `#241C16` | warm near-black, between ink and the master's warm shadows |
| `--sepia` | `#33261D` | raised card ground on dark surfaces |
| `--oxblood` | `#45140E` | deep shadow field; the contact section's ground |
| `--ember` | `#E94516` | the hot accent — rules, marks, one word in a headline |
| `--orange` | `#FF6A1A` | primary accent on dark; the master's own hue |
| `--amber` | `#F5A13A` | secondary warm; figures and highlights |
| `--cream` | `#F3EBDD` | type on dark, and the light sections' ground |
| `--linen` | `#E8DECD` | card ground on light surfaces |
| `--stone` | `#C9BDB0` | secondary type on dark |
| `--warm-grey` | `#81756D` | rules and non-text marks only — fails AA as body text |

Text colour is separated per surface, because no single value serves all three.

| surface | primary | secondary | tertiary | accent |
|---|---|---|---|---|
| ink `#0A0A0B` | `#F3EBDD` 16.3:1 | `#C9BDB0` 10.4:1 | `#8E827A` 5.3:1 | `#FF6A1A` 6.8:1 |
| sepia card `#33261D` | `#F3EBDD` | `#C9BDB0` | `#A0958C` 4.9:1 | `#F5A13A` |
| cream `#F3EBDD` | `#14100E` 15.9:1 | `#4A423C` 8.1:1 | `#6B6058` 5.1:1 | `#B32E08` 5.4:1 |

`#8E827A` is 3.9:1 on the sepia card ground, which is why cards use `#A0958C`
instead. The primary button is ink on ember at 5.0:1; cream on ember is 3.3:1 and
is never used.

## Type

- **Instrument Serif** — display headlines, the closing line, card titles. One
  weight, high contrast, real character at size. Self-hosted, latin, 20 KB.
- **Manrope** — body, navigation, figures, labels, buttons. Variable 400–800,
  self-hosted, 24 KB.

Sentence case; uppercase only on small utility labels with tracking; body never
below 15px; headlines carry deliberate line breaks.

## Motion

| element | entering | settled | receding |
|---|---|---|---|
| stacked card | `translateY(70vh) scale(.92) rotateX(6°)` opacity .75 | `translateY(0) scale(1) rotateX(0)` opacity 1 | `scale(.96)`, `translateZ(-46px)`, `brightness(.74)`, `blur(≤2px)` |
| grid card | — | flat within 16% of viewport centre | ≤4° tilt away from centre |
| section entrance | 18px rise, 750ms, once | — | — |

Measured in the browser: entering cards reach 5.52° and scale 0.920 at opacity
0.750; settled cards read 0.00° at scale 1.000; the card beneath recedes to 0.971
with 1.43px blur. Mobile caps rotation at 1.84°. All of it is removed under
`prefers-reduced-motion`.

## The master

| property | value |
|---|---|
| source | `khalid-cinematic-master-v3.mp4`, Release `cinematicmasterv3` |
| duration | 33.529 s |
| resolution | 1080 × 1448 (portrait, 0.746) |
| frame rate | 30 fps, 1004 frames |
| codec | H.264 Main, AAC-LC 44.1 kHz stereo |
| size | 48.81 MB, 12.08 Mbps |
| keyframes | every 1.000 s |

### Speaking windows, measured off the master's own audio

| moment | window | line |
|---|---|---|
| introduction | 0.25 – 4.95 s | “Hi, I’m Khalid. I’m a performance marketer based in Dubai. Welcome to my portfolio.” |
| contact | 27.35 – 30.20 s | “Let’s work together. Contact me.” |

Captions live in one `master.en.vtt` keyed to master time, because there is one
video.

### The three timestamps the hero is built on

| name | value | how it was fixed |
|---|---|---|
| reveal | **0.867 s** — master frame 26 | frames 0–59 were extracted as a contact sheet and the mouth band cropped and inspected frame by frame. Frames 0–25 catch the mouth mid-vowel; frame 26 is the first composed one, mouth closed, eyes to camera. The gate is fully opaque until the playhead passes it, so nothing before it is ever seen. Frame 26 is also the poster. |
| introduction ends | **4.880 s** | the voice envelope drops to the noise floor after “Welcome to my portfolio”, and the first visual scene cut lands on the same frame. |
| scroll range | **4.880 → 33.517 s** | the whole remainder of the master, silent, mapped onto the pinned section’s scroll span. Scroll cannot reach below 4.880 s, so the spoken line is never scrubbed or reversed. |

The master was **not** re-encoded for any of this. All three are read at runtime
off the existing derivative; only the two poster stills were re-cut, from frame 26
instead of frame 8.

### Two defects repaired in the derivative

The master carries bands of damaged green rows inherited from the source clips:
`y 1139–1149` between 25.8 s and 30.7 s, and `y 1302–1315` between 16.8 s and
21.5 s. Both are repaired by interpolation from their own borders. Nothing is
trimmed, reordered, re-timed or re-edited — the derivative is the same 33.529 s.

### On the requested 1920 × 1080

The master is portrait. Encoding a 1920 × 1080 derivative would mean discarding
about half the frame height and then upscaling the remaining 1080 px of width by
1.78×, which adds bytes and no detail. The derivative therefore keeps the master's
native 1080 × 1448 and the stage crops it per viewport with `object-fit: cover`,
driven by a timeline of `object-position` keyframes that keep the subject safe.
