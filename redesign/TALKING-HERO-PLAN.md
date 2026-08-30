# Production plan: the spoken introduction hero

Direction change requested 2026-08-30. "The Frame" prototype is paused, not
deleted; it stays at `redesign/prototype/` and still runs.

Nothing has been generated for this direction. No credits spent. Balance at time
of writing: **1,205.88, Plus plan.**

## 1. Portrait access: confirmed

`assets/img/portrait.jpg`, 800x1000 RGB, on this branch. Opened and inspected.
A frontal, chest-up studio headshot on a plain light-grey background, navy
three-piece suit, even frontal lighting.

## 2. The delivery workflow, tested rather than assumed

This was the previous blocker, so all three legs were tested today.

| Leg | Result |
|---|---|
| **Upload into Higgsfield** | **Works.** `media_upload` returns a presigned S3 URL on `s3.amazonaws.com`, which is not the blocked host. A real PUT of `portrait.jpg` returned **HTTP 200, 52,126 bytes**, and `media_confirm` registered it as media `d6c3d5a1-0490-40df-adf1-391c88c50a73`. |
| **Drive generation** | Works. Model catalog, cost preflights and job submission all respond. |
| **Download the result** | **Still blocked.** `curl` and `WebFetch` both get 403 at the egress proxy for `d8j0ntlcm91z4.cloudfront.net`. The Higgsfield sandbox reaches it, but binary cannot be moved through a chat transcript intact, which was tested and failed on a 3 KB thumbnail. |

**So the loop is:** assets go in from here, generation runs from here, and each
output is downloaded by Khalid from his Higgsfield library and attached back into
the chat for inspection and committing. One round trip per asset, two in total.

Before any download, the output can be **pre-screened objectively in the sandbox**:
dimensions, duration, frame-to-frame stability of the face region, and whether the
mouth region actually moves against the audio envelope. That catches an obviously
broken take without costing a download. It does not replace looking at it.

## 3. Which tools actually do what

Verified from the model catalog and the `narrator` workflow, not assumed.

### Identity consistency: two paths, and they are not equal

| Path | Input | Works with | Trade-off |
|---|---|---|---|
| **Soul character** (`show_characters` action=train) | **5 to 20 photographs**, about 10 minutes to train | `soul_2` and `soul_cinematic` **image models only** | Strongest identity. Cannot be used directly by a video model, so it produces the still frame, which then drives the video. |
| **Reference Element** (`show_reference_elements` action=create) | **one photograph**, instant | Nano Banana Pro, Seedream, Cinema Studio, Kling 3.0, Seedance 2.0 | Weaker identity lock. This is the only path open with the single photo on hand. |

### Speech and lip-sync

Models that accept an `audio_references` input, which is what allows **Khalid's own
recorded voice** to drive the mouth rather than a synthetic voice:

- **`wan2_7`** — described as "synchronized audio, character-consistent video",
  tagged `sync`. Takes `start_image` + `audio_references`. **Duration 2 to 15s.**
- `seedance_2_5` — up to 30s, `omni_reference` mode, identity references.
- `seedance_2_0` / `_mini`, `grok_video_v15` — also accept audio references.

**Honest limit on this claim:** these models *accept* an audio reference and are
*described* as sync-capable. Lip-sync accuracy on this specific face has **not**
been verified, because verifying it requires generating. That is exactly what the
still-frame gate and the video gate are for.

**On voice:** the `narrator` workflow does no voice cloning by design. That is fine
here, because the plan uses Khalid's actual recording as the audio track rather
than synthesising an imitation of him. A separate explicit consent flow exists for
cloning if it is ever wanted; it is not proposed.

## 4. Costs, preflighted today (preflight calls are free)

| Step | Model | Credits |
|---|---|---|
| Still frame, identity + suit + setting | `nano_banana_pro` with an Element reference | 2 |
| Still frame, alternative | `soul_2` at 2k (needs a trained Soul) | 0.12 |
| **Talking video, 15s, 1080p** | **`wan2_7`** | **37.5** |
| Talking video, 10s, 1080p | `wan2_7` | 25 |
| Talking video, 20s, 1080p | `seedance_2_5` omni_reference | 180 |
| Talking video, 20s, 1080p | `flux_3_video` | 180 |
| Optional silent idle clip, 5s | `wan2_7` | ~12.5 |

**Recommended budget: about 90 to 100 credits**, which covers 2 or 3 still-frame
attempts, 2 video attempts, and a short silent idle clip. Against 1,205.88 that is
comfortable, and it is roughly a fifth of what a single 20s Seedance take costs.

### The duration problem, stated plainly

The draft script is 30 words. At normal delivery that reads in about 13 to 15
seconds, which fits `wan2_7`'s 15 second ceiling in **one continuous take**. If
Khalid's actual recording runs longer than 15 seconds, the options become a 20s
Seedance take at 180 credits, or two clips cut at a sentence boundary. A single
unbroken take is better for a talking head, so the recommendation is to keep the
recording at or under 15 seconds.

## 5. The composition

A medium shot, 16:9, him seated at a desk, framed slightly right of centre so the
left third stays clear for the site's typography.

- **Him:** upper body from mid-chest, head in the upper third, eyes on the lens.
  Charcoal or midnight-navy tailored suit, crisp white shirt, understated tie.
- **Laptop:** open silver MacBook on the desk to his right (frame left), angled
  away so the screen is not legible, occupying the lower left. Screen content is
  never readable, which avoids inventing a fake interface.
- **Room:** minimal premium interior, soft depth, a warm practical light out of
  focus behind him. No signage, no logos, no legible text anywhere.
- **Light:** warm directional key from frame left at about 45 degrees, gentle fill,
  natural skin tones. Not glamour lighting, not orange.
- **Camera:** a slow push-in of roughly 4 percent over the clip. Nothing else moves.
- **Typography lane:** the left third and the lower third stay uncluttered.

### Deliberate risk reductions

- **Hands stay out of frame or rest still on the desk.** Hands are the most common
  AI failure and gesturing multiplies the risk. "Restrained gestures" is
  interpreted here as near-stillness.
- **The laptop sits at a simple angle and slightly soft**, because hard product
  geometry in sharp focus is where deformation shows.
- **No jewellery, no patterned tie, no lanyard**, all of which drift between frames.

## 6. The script, pending approval

Khalid's draft, unchanged:

> "Hi, I'm Khalid Ounzar, a performance marketer based in Dubai. I connect paid
> advertising, creative testing and landing pages to help brands turn attention
> into customers. Welcome to my portfolio."

30 words, approximately 13 to 15 seconds at natural pace.

## 7. Website behaviour, as specified

- Spoken playback is **separate** from any scroll animation.
- The default hero shows a **poster frame**, or optionally a short **silent** idle
  clip. No endlessly looping mouth movement.
- A **"Meet Khalid"** control starts playback with sound and captions.
- Captions are authored from the approved script, not auto-transcribed, so they
  match exactly.
- The control is keyboard reachable, playback never autostarts with sound, and
  reduced motion gets the poster frame with the control still available.

## 8. Order of operations

1. Khalid supplies the missing materials in section 9.
2. Register the identity reference. If 5+ photos arrive, train a Soul; otherwise
   create an Element from the single portrait.
3. **Generate one still frame.** Roughly 2 credits.
4. Khalid downloads it, attaches it here, and it is inspected for likeness, suit,
   setting, hands and laptop. Re-roll until approved. **Gate.**
5. Only after the frame and the audio are both approved, generate the video.
6. Inspect for face drift across frames, mouth against audio, hand distortion and
   laptop deformation. Re-roll if any fail. **Gate.**
7. Only then integrate into the site.

## 9. Missing materials

1. **The voice recording.** Khalid reading the script aloud, as a file attachment.
   Phone voice memo is fine in a quiet room. **Keep it at or under 15 seconds** to
   stay in one continuous take on the cheap model. This is the hard blocker for the
   talking version.
2. **More photographs, strongly recommended.** 5 to 20 of him, varied angles
   (front, three-quarter left and right, slight up and down), consistent recent
   appearance, good even light, no sunglasses. This unlocks Soul training and is
   the single biggest improvement available to identity fidelity. With only the one
   frontal headshot, the model has to invent his seated body, his hands and a new
   suit, and **perfect likeness cannot be promised from one photograph.**
3. **Script approval**, or an edited version.
4. **Suit colour:** charcoal or midnight navy.
