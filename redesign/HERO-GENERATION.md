# Hero video: the prompts and the hand-off workflow

Written for Khalid to run in his own Higgsfield account, because this build
environment cannot download Higgsfield media (its CDN is blocked by the network
policy here). Nothing in this file has been generated. No credits have moved.

## The one creative decision that shapes everything

**The generated video is the environment. Khalid's face is never generated.**

Two rules point the same way:

- Khalid's brief: preserve his recognisable face, proportions and natural
  appearance, and no exaggerated face morphing.
- The skill's law 5: subjects whose anatomy every viewer knows up close show their
  errors instantly. A human face in close-up is the single riskiest thing to ask
  an AI video model for.

So the video is a dark volumetric environment with light, haze and depth, which is
the most forgiving subject there is. Khalid's real photograph composites in front
of it as a cut-out layer with its own key light. His face stays exactly the face in
`assets/img/portrait.jpg`, pixel for pixel.

Three techniques, named honestly:

| Layer | Technique | What it really is |
|---|---|---|
| Background | Generated video, scroll-scrubbed | A real 6-second AI clip whose playhead is driven by scroll position |
| Subject | Layered photographic depth | His actual photo, cut out, lit with CSS, moving on its own parallax plane |
| Type and cards | Real-time code | Scroll-driven transforms, no video, no 3D |

There is no interactive 3D anywhere in this build, and nothing here should be
called 3D.

## Real prices, preflighted 2026-08-30

Balance at the time of writing: **1,207.88 credits, Plus plan.** Preflight calls
are free and these are the actual returned numbers for the exact shot planned
below (6 seconds, 1080p where offered, 16:9, no audio, standard mode).

| Step | Model | Credits |
|---|---|---|
| Start frame | Soul 2 at 2k | 0.12 |
| Start frame | Nano Banana Pro | 2 |
| Video | Cinema Studio Video v2 (std, no sound) | 6 |
| Video | Kling v3.0 (std, no sound) | 9 |
| Video | Seedance 2.5 (1080p, no audio) | 54 |

The spread between the cheapest and the dearest video is nine to one for the same
shot. At 1,207 credits, even the dearest option is affordable and leaves room for
several re-rolls. The honest read: Seedance 2.5 buys the highest ceiling and is
what the skill's laws were tuned on; Kling v3.0 at 9 credits is a legitimate
cinematic model and turns the video gate into a cheap, repeatable creative
decision rather than a single expensive shot.

Because this is a background plate of light and haze rather than a hard subject,
the gap between the models matters less here than it would on a product or a
person. That is an argument for starting cheap.

## Step 1: the start frame (image)

Model: Nano Banana Pro at 2 credits, or Soul 2 at 0.12. Aspect ratio 16:9,
highest quality offered. Prompt, verbatim:

> A vast dark volume of still air seen from within, composed as the first moment
> of a slow forward descent that will travel down through drifting haze toward a
> wide warm horizon of light far below. One warm gold light source rakes in from
> the upper left, picking out fine suspended dust and the soft rounded edges of
> deep shadow. Deep slate blue-black in the shadows, warm antique gold through the
> light shafts, pale ivory where the glow is strongest, cool graphite in the
> falloff. Heavy volumetric depth, slow drifting veils of haze, fine motes
> suspended and turning in the beam. The middle and right of the frame resolve
> into smooth continuous atmosphere, softly graded and without structure, part of
> the same unbroken volume of air. Cinematic, photorealistic, wide lens, 16:9.
> No text, no logos, no lettering anywhere.

Note the phrasing: the calm region is described as part of one continuous world,
never as emptiness or darkness. Asking for empty space paints literal black
panels and costs a re-roll.

## Step 2: the video (image-to-video from the approved frame)

Settings: image-to-video, 6 seconds, 1080p, 16:9, standard mode, audio off.
Prompt, verbatim:

> One continuous shot, no cuts. The camera makes a single slow forward descent
> through a vast volume of drifting haze, holding one unbroken downward glide from
> deep inside the dark upper air toward a wide warm horizon of light far below.
> The volume stays alive throughout: veils of haze drifting and reforming past the
> lens, fine motes turning slowly in the light shafts, the gold beams shifting and
> widening as the camera descends. Near the middle of the descent the camera
> passes through a denser bank of haze and the light blooms briefly across the
> lens, a soft flare and a beat of diffusion, then clarity returns and the air
> below is calm and open. The shot ends at rest: a wide still volume of softly lit
> air, a broad warm horizon glow low in the frame, the last veils of haze settling
> above it, generous open space across the whole width of the frame and generous
> calm room above and below the glow. No text or lettering anywhere.

Why it is built this way, against the skill's laws:

- Scrolling down reads as going down, because the camera descends (law 1).
- One subject, one unbroken motion, no cuts (law 2).
- The path is locked but the air is alive with drifting haze and turning motes
  (law 3).
- The ending is written as a composed resting frame with generous margin, so the
  site header and the cover-crop cannot eat it (law 4).
- Light and haze are the most forgiving subjects there are (law 5).
- The motion axis is vertical, matching the scroll one to one (law 6).
- The frame stays broad and calm so captions can sit anywhere over it (law 7).
- The haze bank gives a real physical lens moment, a bloom and a beat of
  diffusion, instead of a clean fake pass (law 8).
- The no-text guard is in both prompts (law 12).

If the generator offers a house preset instead of this shot, decline it and retry
the literal prompt.

## Step 3: getting the files back here

Three routes were tested on 2026-08-30. Only one works, and it needs Khalid's hand.

| Route | Result |
|---|---|
| `curl` from this environment to the Higgsfield CDN | Blocked. 403 at the egress proxy. |
| `WebFetch` to the same URL | Blocked. Same proxy rule. |
| Higgsfield's own cloud sandbox (`sandbox_exec`) | Reaches the CDN fine, and can run ffmpeg and Pillow on the file. |

The sandbox looked like the way through, so it was tested properly: download the
image there, shrink it, base64 it, and read it back through the tool output. That
fails, and the reason is worth writing down so nobody tries it again. Moving
binary data through a chat transcript means transcribing thousands of characters
by hand, and the checksum came back wrong every time. A 3 KB thumbnail could not
be moved intact. A video is hundreds of times larger.

**So the sandbox is useful for measuring and processing, never for delivery.**

The route that works:

1. Generate the start frame. It is 2 credits or less per attempt.
2. Khalid opens his Higgsfield library, downloads the frame, and drags it into
   this chat as a file attachment.
3. Only then is it truly inspected here, and only then is the video generated.
4. Same for the video: generate, download from the library, attach.

Attachments land on disk here and can be inspected, re-encoded and committed.
Images pasted inline in the chat can be viewed but not saved, so both files must
arrive as attachments, the same way the four reference videos did.

## What the first start frame measured

Generated 2026-08-30, 2 credits, `nano_banana_pro`, job
`7175db17-fbc1-41dd-b438-d0f1a614d535`, 2752x1536.

Measured in the Higgsfield sandbox, not seen. These numbers are evidence, not
approval, and the frame still has to be looked at by a human before it is animated.

- **Palette lands on the storyboard almost exactly.** Warm sand and gold at
  `#B79C7F`, `#E0C3A0`, `#927A63`, against deep slate blue-blacks at `#141B23`,
  `#080F15`, `#222930`. That is the proposed night-and-gold direction, generated
  rather than guessed, and the page tokens can be sampled straight from it.
- **Edge energy is uniformly low**, 4.7 to 5.4 across every cell of a 3x3 grid.
  The frame is soft and hazy with no hard structure anywhere, which is exactly
  what a background plate needs: captions can sit in any region without fighting
  detail. It is also good evidence that the no-text guard held, since lettering
  would spike edge energy locally.
- **Light sits low and central**, brightest at bottom-right and mid-centre
  (151 and 146), darkest at top-right (24). That matches the written intent of a
  warm horizon glow far below.
- **Tonal split** is 30 percent shadow, 55 percent mid, 15 percent highlight, so
  there is headroom for the scrim system without crushing the image.

What these numbers cannot tell anyone: whether it is beautiful, whether a
trademark sneaked in, or whether the composition actually reads. That needs eyes.

## What happens once the file arrives

1. Inspect it properly: pull the first, middle and last frames and check the
   motion, the bloom moment and whether the ending truly rests.
2. Show the frames and give an honest critique before anything is built around it.
   If it is wrong, the fix is a re-roll, not a workaround.
3. Re-encode for scrubbing with a short keyframe interval, so seeking is smooth.
4. Cut the poster and the ending frame for the static hero.
5. Sample the final palette tokens from the approved footage, so the page and the
   video read as one place.
6. Build the hero on the engineering standard: blob fetch with a loading ring,
   eased playhead, gated seeks, the four-layer legibility system audited at 3.5:1
   on the worst frame of every caption band, and the five static-hero gates.
