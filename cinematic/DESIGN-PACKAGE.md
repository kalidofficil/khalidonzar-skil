# Design package: The Gap

The Phase 5 deliverable, rewritten. It supersedes `BRIEF.md`, which was written for a
different audience and a hero film this environment cannot produce. `BRIEF.md` stays in
the folder as the record of the storm-into-still concept, which is still buildable in a
local session.

## What changed, and why

Three decisions were remade with Khalid on 2026-08-30:

| Was | Now | Reason |
|---|---|---|
| Agencies buying white-label media | Business owners and e-commerce brands, direct | Khalid's answer. His own case studies and process copy were already written for them. |
| Khalid Onzar | Khalid Ounzar | Khalid's answer. The repo had it wrong. |
| Invented metrics and placeholder quotes | His real campaign figures, no testimonials | Khalid's answer. Nothing invented ships. Testimonials are dropped rather than faked. |

The palette from `BRIEF.md` was sampled from storm footage that is not being used, so it
goes. The type trio stays: it was decided with Khalid and it still fits.

## The environment constraint, stated once

This cloud container's egress policy returns 403 on Higgsfield's file host
(`d8j0ntlcm91z4.cloudfront.net`). Generation works and the balance is intact
(1207.88 credits, Plus), but no generated file can be pulled down to inspect, encode
or ship. Verified directly, not assumed. So the hero is drawn, not filmed. The scrub
engineering is unchanged; SVG geometry is driven by scroll instead of video time, which
is the same standard minus the Blob loader. A local session can still make the film and
slot it behind this hero without touching the band map.

## 1. The brand premise

**A good cost per purchase is not a profit.**

In cash on delivery, Ads Manager counts a sale the moment someone taps. The money is
decided later, on the confirmation call and at the customer's door. Refusals run fifteen
to thirty percent, returns pass forty percent without confirmation calls, and cash lands
a week or two after the van does. So the reported number is a claim, not a result.

Khalid's whole value is the distance between the claim and the result. He already said
it in his own skills copy ("landing pages, orders, confirmation, delivery and real
profitability"); it just was not the point of the page. Now every section serves it. A
section that does not teach or prove the gap does not belong.

## 2. The palette as CSS tokens

A cool instrument-grade paper with navy ink and one red. The red is the CTA and the gap
marks, nothing else. The quiet blue is reserved for reported figures, so "reported" and
"real" are readable as two colours before a word is read.

```css
:root{
  --canvas:#EEF0F4;        /* pale cool paper, never white */
  --panel:#E4E8EE;         /* cards and raised surfaces */
  --panel-2:#DADFE7;       /* the deeper inset */
  --ink:#0F1A2B;           /* deep navy, the body ink */
  --text-secondary:#48566B;
  --accent:#C62B38;        /* the single red: CTA, focus, the gap */
  --accent-hover:#A31F2B;
  --accent-muted:#E7C0C4;  /* whisper level: borders, glows */
  --data:#2B54B8;          /* the reported line and its figures */
  --rule:#C3CBD7;          /* the horizon rule at rest */
}
```

Measured against `--canvas`: ink 15.3:1, secondary 6.6:1, accent 4.9:1, data blue 6.0:1,
white on accent 5.5:1. Every one clears its floor with room.

## 3. The type trio

Carried over from `BRIEF.md`, unchanged.

- **Display:** Newsreader, 500 and 600, plus the 600 italic. Editorial and calm, with a
  real italic. An editorial serif against instrument-grade figures is the tension the
  page runs on.
- **Body:** Archivo, 400 and 500.
- **Mono:** Spline Sans Mono, 400 and 500. Labels, figures, the readouts.

Never Inter or Roboto as display.

## 4. The band map

The hero is 400vh. Scroll progress drives an SVG scene rather than a video: a reported
line climbs, a second lower line appears beneath it, and the distance between them is
measured by a caliper that opens as the last band lands. Copy ships verbatim.

The hero opens in Khalid's own confident voice. The buyers' pain language does its work
below the fold, per the placement rule.

| Band | Range (starting point) | Scene moment | Copy (verbatim) | Entrance |
|---|---|---|---|---|
| 1 | 0.00 to 0.18 | the reported line draws upward, figures locking into a row | "I read ad accounts for a living." | grid snap-align, echoing figures landing in a table |
| 2 | 0.22 to 0.42 | the line holds its peak, the reported total settles | "Most of them look fine." | word-punch with overshoot, echoing the confident beat |
| 3 | 0.46 to 0.64 | a second line fades in below the first | "Then I check what got delivered." | drift-down, echoing the lower line arriving |
| 4 | 0.68 to 0.84 | the caliper opens across the distance between the two lines | "That distance is the whole job." | halves parting, echoing the caliper jaws opening |
| 5 | 0.86 to 1.00 | the scene stills, the measurement holds | "I find the gap between reported and real." | word-by-word rise into a staged settle |

Band 5 subline: "Meta ads and COD e-commerce. I read the campaign, the funnel and the
delivery, then tell you which number to trust." CTA: "Start a conversation".

Band 1 opens settled, via the one-time load ramp handing over to scroll.

## 5. The static-hero copy block

For phones and reduced motion, composed over the settled scene:

- Headline: "I find the gap between reported and real."
- Subline: "Meta ads and COD e-commerce. I read the campaign, the funnel and the
  delivery, then tell you which number to trust."
- CTA: "Start a conversation"

## 6. The below-fold outline

Every section funnels to `#contact`.

1. **The gap.** The premise, taught in plain words, and the home of the interactive
   moment. Kicker "THE ONE THING", headline "A good cost per purchase is not a profit."
2. **Selected work.** Six real campaigns, Khalid's own titles and descriptions, his own
   figures. Screenshot slots for the dashboards he uploads.
3. **What I actually look at.** His six skills, verbatim, with one title rewritten
   because the original tripped the copy gate.
4. **How it works.** His five process steps, verbatim.
5. **About.** New copy in his voice, and his portrait.
6. **FAQ.** The four objections research turned up, answered straight.
7. **Contact.** The single call to action.

**No testimonials.** The old build carried two placeholder quotes. Real quotes or none,
and there are none yet, so the section is gone rather than faked.

**Form handling:** mailto to `ounzar.khalid1999@gmail.com`, with a `data-endpoint`
attribute ready if a form service is added later. The success state tells the truth about
where the message went.

**Footer** carries no fictional-brand disclosure, because the brand is real.

## 7. The vector layer plan

**The signature element: the gap rule.** One hairline that runs the entire page. In the
hero it is the baseline the reported line is measured from. Between every section below
it becomes the divider, and at three points it opens into a caliper: two end serifs and a
measured span, drawn on scroll. Sometimes flush, sometimes open. Remove it and the page
loses its argument, which is the test it has to pass.

**The interactive moment: press and hold to run the confirmations.** In the gap section.
Holding walks a thousand reported orders down through the confirmation rate and then the
delivery rate, and the true cost per delivered order counts up as it goes. Releasing
early eases back rather than snapping. Completing it lights the section's three readouts
in sequence. Reduced motion gets the finished state with no hold. It is labelled as a
worked example at typical Moroccan rates, never as a client result.

Whisper-level: a slow drift on one fixed background layer (a faint plotted grid in the
footage-free world's own grade, cycling at 90 seconds), and a soft pulse on the live
figures.

## 8. The engineering list

The full standard in `references/scrub-pipeline.md`, minus the Blob loader, which has no
video to load: dt-normalized lerp on a resting rAF loop, delta-gated DOM writes, band
pacing validated by the flick test, the four-layer legibility system (the scene is drawn,
so contrast is controlled rather than sampled, and the audit is run against the rendered
page), the five static-hero gates kept live with change listeners, complete-without-
JavaScript, and the whole-site-animated standard.

## 9. The copy gate

Every viewer-facing line above ships verbatim. The built page must pass the Phase 9 grep
gate, zero em dashes and zero stock words, plus the body-copy sweep for AI tells, before
anyone sees it.

Two of Khalid's own lines are rewritten to clear it, and both rewrites are recorded here
so nothing drifts silently:

- His card title "Data-Driven Optimization" becomes "Optimization from the numbers".
  "Data-driven" is on the stock-word list.
- His case title "COD E-commerce — Meta Ads (Morocco)" becomes "COD e-commerce on Meta
  Ads, Morocco". The original carries an em dash.

Deliberate devices that stay: the reported-versus-real pairing throughout, and the
staccato hero bands.
