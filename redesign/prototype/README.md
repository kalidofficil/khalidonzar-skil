# Hero prototype: "The Frame"

A working prototype of the hero sequence only, built so the motion can be judged
before anything else is approved. **This is not the site.** The live site at the
repository root is untouched.

Open `redesign/prototype/index.html` through a local web server, not by
double-clicking it. From the repository root:

    python3 -m http.server 8000

then visit `http://localhost:8000/redesign/prototype/index.html`.

A server is needed because the page loads the portrait and the self-hosted fonts
by path, and browsers block those on `file://` URLs.

## The four scroll stages

Scroll progress through the pinned hero maps to 0 to 1, and every visual is a
pure function of that number. That is why scrolling back up runs the sequence
backwards rather than replaying it.

| Stage | Progress | What happens |
|---|---|---|
| 1 | 0.00 to 0.14 | Portrait in shadow. "KHALID" oversized behind him, his head and shoulder occluding the middle letters. |
| 2 | 0.14 to 0.52 | A directional key light sweeps across him. The oversized name hands over to the composed name block, which assembles word by word. |
| 3 | 0.52 to 0.86 | He steps back a plane. Three verified campaign figures arrive at three parallax depths. |
| 4 | 0.86 to 1.00 | The ground climbs to cream, he leaves frame, and the case-study section takes over with no seam. |

## How the light works

Two copies of the same photograph are stacked. The lower copy is the same pixels
at `brightness(.34)`; the upper copy is at full exposure. A linear-gradient mask
on the upper copy slides across it as you scroll, so a soft light edge travels
over him at 103 degrees. A warm-white band rides the same edge at low opacity and
fades once the light has passed.

This matters for two reasons Khalid asked about:

- **It is directional, not a global fade.** The lit and unlit regions coexist
  during the sweep, with a moving boundary between them.
- **The face is never tinted.** Both copies are the same pixels, so only exposure
  changes. The warm band is warm white rather than orange and peaks at 0.30 alpha.

Edge integration: a soft halo in the ground's own colour sits behind him and a
blurred contact shadow grounds him, so the cutout does not read as a hard sticker.
No blur is applied to the portrait at any point. The only blur in the sequence is
0.7px on the farthest card, to place it in depth.

## What is disabled on mobile and under reduced motion

Both fall back to the same composed still hero, decided by five media queries
that are identical in `app.css` and `app.js` and re-evaluated live on rotation,
resize and preference change.

Disabled in the fallback:

- The scroll-linked light sweep. The portrait is shown at full key instead.
- The oversized "KHALID" occlusion layer.
- The word-by-word assembly of the name and introduction.
- The parallax campaign cards.
- The ground's colour climb.
- The scroll listener and the animation loop entirely, so nothing runs.

Kept in the fallback: the portrait, the name, the introduction, the discipline
line, a 44px call to action, and the full case-study section.

The five gates: `max-width: 720px`; portrait under 1024px; portrait with a coarse
pointer; landscape coarse pointer under 560px tall; and
`prefers-reduced-motion: reduce`.

## Tested

Chromium via Playwright, at 1440x900, 1280x800 and 390x844.

- Forward and reverse scroll track progress exactly (0.75, 0.50, 0.25, 0.00).
- The sweep travels 0.00, 0.10, 0.55, 0.95, 1.00 across the stage, so it is a
  moving edge rather than a fade.
- Flick test: 120px steps advance 5 to 6 percent each, so every stage survives
  several flicks. 360px steps advance 17 percent, so no stage can be skipped.
- Zero console errors. Zero horizontal overflow at every width.
- First tab stop is the skip link. Focus rings are visible.
- Reduced motion off then on mid-session re-arms the scrub correctly.

## Not done, deliberately

- Only the hero and a short case section exist. Services, about, process, FAQ and
  contact are not built.
- The three case rows use verified figures but have no screenshots attached yet.
- The worst-frame contrast audit has not been run, since the ground is generated
  by CSS rather than footage.
