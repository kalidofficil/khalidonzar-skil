# Cinematic build: design package

The Phase 5 deliverable for the `10k-websites` skill, written before generation and
trimmed for Tier 1. Everything below was decided with Khalid in a remote session on
2026-08-30. A local session should read this and resume at Phase 6, not re-ask Phase 2.

## Where this stopped, and why

The remote container's egress policy blocks Higgsfield's CDN
(`d8j0ntlcm91z4.cloudfront.net`) with a 403 on CONNECT. Generation worked, but the
files could not be pulled onto the machine, which blocks the inspection gate, the
scrub re-encode, the poster and ending frames, and the `assets/` folder the site
ships with. The build stopped before the video rather than spend credits on footage
that could be neither inspected nor processed. On a local machine none of that
applies.

Setup already verified: ffmpeg 6.1.1 with libx264, Node v22.22.2, Higgsfield
connected. Balance after the two frames below: 1207.88 credits, Plus plan.

## Decisions already made

| Question | Answer |
|---|---|
| Subject | Khalid Onzar, a real person and a real business |
| Audience | Agencies buying white-label media buying, not direct clients |
| Visuals | Real photos, uploaded by Khalid, plus generated cinematic footage |
| Feeling | Calm, safe hands |
| References | Khalid said he would paste links. None received yet. |
| Tier | Tier 1, one continuous 6-second shot |
| Hero concept | Storm into still |

## 1. The brand premise

The one idea: **work that comes back finished.** Research said the objection that
stops an agency owner is not that you will steal the client or embarrass them. It is
that handing work over creates work, because they have paid someone before and spent
their own evenings correcting it. Every section, the interactive moment and the
closing line serve that one idea. A section that does not serve it does not belong.

## 2. The palette

Direction named from the storm-into-still world. Final token values get sampled from
the approved footage after the video gate.

The page brightens as the visitor descends: the hero is storm dark, and the page
below settles into calm sea light. That descent from dark to light is the page's
structure, not a decoration.

```css
:root{
  --canvas:#EDF1F2;        /* cool pale sea light, never pure white */
  --panel:#E3E9EA;         /* cards and raised surfaces */
  --accent:#0B6B57;        /* deep sea green: the CTA and rare emphasis */
  --accent-hover:#095442;
  --accent-muted:#9FC0B6;  /* whisper level: borders, glows, particles */
  --text-secondary:#4A5A60;
  --text-primary:#0F1A22;  /* deep slate */
  --storm:#101821;         /* the hero's ground, tinted from the footage */
  --storm-panel:#18232F;
}
```

## 3. The type trio

- **Display:** Newsreader. Editorial, calm, real character, optical sizes and a
  usable italic.
- **Body:** Archivo. Quiet and clean at small sizes.
- **Mono:** Spline Sans Mono. Small labels and figures.

Never Inter or Roboto as display.

## 4. The band map

Hero sized at about 400vh for a single 6-second shot. Ranges are starting points,
validated later by the flick test. Copy ships verbatim.

| Band | Range | Footage moment | Copy | Entrance |
|---|---|---|---|---|
| 1 | 0.00 to 0.16 | deep inside the churning cloud | "You hand me the account." | drift-down, echoing the fall |
| 2 | 0.20 to 0.40 | falling through the cloud canyons | "I do not need managing." | scatter |
| 3 | 0.44 to 0.62 | punching through the underside, spray on the lens | "Nothing lands back on you." | word-punch with overshoot, echoing the impact |
| 4 | 0.66 to 0.82 | calm cold air, the sea appearing below | "Your name stays on it." | blur-to-sharp, echoing clarity arriving |
| 5 | 0.84 to 1.00 | the settle: still sea, first light | "It comes back finished." | word-by-word rise into a staged settle |

Band 5 subline: "White-label paid media for agencies. Meta, Google and TikTok, run
under your brand." CTA: "Start a conversation".

Band 1 opens settled, using the one-time load ramp handing over to scroll.

## 5. The static-hero copy block

For phones and reduced motion, composed over the ending frame:

- Headline: "It comes back finished."
- Subline: "White-label paid media for agencies. I run Meta, Google and TikTok under
  your brand, and your client never hears my name."
- CTA: "Start a conversation"

## 6. The below-fold outline

The sections are already written and screenshot-verified in the static build at the
repo root. Carry the copy over and re-dress it in this palette and type trio. In
order, all funnelling to one CTA anchor:

1. **Services.** Six ways agencies use him: white-label buying, account rescue,
   overflow capacity, pitch and audit support, client-ready reporting, tracking.
2. **Results.** Four figures and the blended ROAS chart with its table view.
3. **Selected work.** Three cases an agency handed over, each with a screenshot slot.
4. **Process.** Handover, triage, run, handback. The interactive moment lives here.
5. **About.** Bio and portrait. Khalid's own photo goes here.
6. **References.** Placeholder quotes. Not to be published as real.
7. **FAQ.** Answers the one real objection:
   - Q: "How do I know I will not end up fixing your work?"
   - A: "Start with the two week audit. Fixed fee, and you see exactly how I work
     before an account moves. If the read is that paid is not your problem, I will
     say so and refund the rest."
8. **Contact.** The single call to action.

Form handling on a static site: mailto, so a real enquiry reaches a real inbox.
The existing build already does this and falls back cleanly.

Footer carries no fictional-brand disclosure, because the brand is real.

## 7. The vector layer plan

**The signature element: the horizon line.** One hairline that runs the whole page.
It is jagged and turbulent through the storm bands, settles dead straight at the
moment the film breaks into calm, and then becomes the rule that separates every
section below. Drawn by hand in SVG, self-drawing on scroll. Remove it and the page
changes, which is the test it has to pass.

**The interactive moment: press and hold to hand it over.** Holding settles a jagged
line into a straight one. Completing it lights the section's content in sequence.
Releasing early eases the progress back down rather than snapping. Reduced motion
gets the finished state with no hold required.

Whisper-level particles: fine spray drifting in the hero, stilling below the settle.
One fixed background layer behind everything, a slow drift in the footage's grade,
cycling at 60 seconds or longer.

## 8. The engineering list

The full standard in `references/scrub-pipeline.md`: Blob fetch with the loading ring,
dt-normalized lerp on a resting rAF loop, gated seeks with the deadlock escape,
delta-gated DOM writes, band pacing validated by the flick test, the four-layer
legibility system audited at 3.5:1 on worst frames, the five static-hero gates kept
live with change listeners, complete-without-video, and the whole-site-animated
standard.

## 9. The copy gate

Every viewer-facing line above ships verbatim. The built page must pass the Phase 9
grep gate, zero em dashes and zero stock words, plus the body-copy sweep for AI
tells, before anyone sees it.

## The prompts, already written

### Start frame (16:9, 2k)

> Aerial view from high inside a vast storm system, looking straight down into deep
> churning cloud canyons, composed as the first moment of a long vertical descent
> that will fall through the cloud and break out into calm air above a still sea.
> Cold pre-dawn light from above rakes across the cloud tops, and far below a faint
> pale glow marks where the storm thins. Wet slate grey, deep blue-black shadow, cold
> silver highlights on the cloud edges, one distant pale horizon glow. Heavy
> volumetric depth, drifting veils of vapour, fine spray in the air. The left third
> of the frame resolves into smooth unbroken cloud haze, softly lit and without
> structure, part of the same continuous sky. Cinematic, photorealistic, wide lens,
> 16:9. No text, no logos, no lettering anywhere.

### Video (image-to-video, 1080p, 6 seconds, standard, no audio)

> One continuous shot, no cuts. The camera falls straight down through heavy
> turbulent storm cloud, holding a single unbroken vertical descent from deep inside
> the cloud canyons to open air below. The cloud stays alive throughout: walls of
> vapour tearing past the lens, veils shredding and reforming, light shifting as the
> camera drops. Near the middle of the fall the camera punches through the underside
> of the storm, and the boundary is physical: spray flicks across the lens, droplets
> bead and streak, a beat of blur, then clarity. Below the cloud the air is calm and
> cold, and the camera slows as it settles into a wide steady hover above a still sea
> at first light. The shot ends at rest: a flat calm sea filling the lower frame, a
> pale horizon line of first light across it, the last thin veil of cloud drifting
> away above, the water almost motionless, generous open sky above the horizon and
> generous calm water below it. No text or lettering anywhere.

Generous margin above and below the horizon is deliberate: the site's header sits
over the top of the frame and cover-cropping eats the edges.

## Prices, already preflighted

| Call | Credits |
|---|---|
| Start frame, Soul Location | 0.12 |
| Start frame, Nano Banana Pro | 2 |
| Start frame, Recraft V4.1 at 2k | 8 |

The video model still has to be preflighted and chosen by Khalid, with the real
numbers in front of him, before any video credits move.

## Frames already generated

Both are in Khalid's Higgsfield library, 2.12 credits spent:

- `2df51c05-eaa8-4e9b-87e8-d2f986d5352e`, Soul Location, 2048x1152. **Warning:** this
  job came back with an empty prompt field and a house style attached
  ("Manawatū Coast"), so the model applied a location preset instead of the written
  shot. Decline the preset and retry literally, per the skill.
- `6f697654-5ccf-41d5-a663-cc1bef9eff05`, Nano Banana Pro, 2752x1536, full prompt kept.

Neither has been inspected. Inspect before animating.

## First moves for a local session

1. Confirm setup: ffmpeg, Node, Higgsfield connected.
2. Look at both frames above and pick one, or retry the start frame literally.
3. Ask Khalid for his reference links, which he said he would paste and has not yet.
4. Get his photo and dashboard screenshots into `assets/img/`.
5. Preflight the video models, present the real numbers, let him choose.
6. Resume the skill at Phase 6, step 4.

Deploy folder for this build is `cinematic/`. Raw generations and review copies stay
outside it, in `review/`, which is gitignored.
