# Khalid Ounzar — cinematic portfolio (Version 3)

Two chapters, cleanly separated.

**Chapter one is one master film.** A single `<video>` element, full screen and
pinned, holding the complete 33.5-second edit. It is never divided, never
unmounted and never replaced. Scroll drives the playhead across the whole master;
the two spoken moments suspend scrubbing and play at normal speed instead.

**Chapter two is the work**, revealed only after the final Dubai frame, as a
sequence of cards that rise from below and settle on top of one another.

Static HTML, CSS and vanilla JavaScript. No framework, no build step, no
third-party requests at runtime. First screen: 181 KB over 8 requests.

```
index.html                    the page
design/TOKENS.md              the palette, measured from the master, and why
assets/css/v3.css             tokens, the film stage, the card systems
assets/js/v3.js               the scroll↔playhead loop, speaking moments, cards
assets/cinematic/             the web derivatives and the poster
assets/captions/master.en.vtt one caption track, keyed to master time
assets/fonts/                 Instrument Serif and Manrope, self-hosted
scripts/build-media.sh        rebuilds the derivatives from the Release master
scripts/serve.js              local server with HTTP Range support
legacy.html                   the pre-cinematic site, kept intact
```

Version 1 is on `claude/cinematic-portfolio-final-xohv3f`, Version 2 on
`claude/cinematic-portfolio-v2`. Neither is touched.

## Run it

```bash
node scripts/serve.js        # → http://localhost:8000
```

**Use that server, not `python3 -m http.server`.** Scrubbing seeks inside the
master, and seeking needs HTTP Range support. Python's built-in server ignores
the `Range` header and answers `200` with the whole file; Chromium then reports
`video.seekable` as empty and silently refuses every `currentTime` assignment, so
the film appears frozen with nothing in the console to explain it. Every real host
serves ranges. Opening `index.html` off disk fails the same way.

## The hero: a gate, then two phases of one film

There is one `<video>` on the page and it is never divided, swapped or reloaded.
It runs through three states.

**The gate.** On load the film is invisible. An opaque card — eyebrow, *Unlock my
portfolio*, the supporting line, **Unlock experience**, and the note about sound —
is painted from the palette, not from the footage, so the master's first frames
are never on screen. The film preloads behind it; **Unlock experience** stays
disabled, with a quiet *Preparing the film* line, until either `readyState ≥ 3`
or the buffer covers `0 → 2.47 s`. Nothing plays and nothing makes a sound before
that click.

**Phase 1 — the spoken introduction, `0 → 4.880 s`.** The click starts the film
from zero, unmuted, at `playbackRate = 1`. The gate stays fully opaque over it
until the playhead reaches **0.867 s** (master frame 26) and then fades out over
760 ms, so the audio begins at the true start of the sentence while the frames
that precede a composed one are never shown. This range is played, never scrubbed,
never reversed, never re-timed. Captions are painted from the `<track>` into the
page's own caption line. At `4.880 s` the film pauses, mutes, releases the scroll
lock and offers *Scroll to enter the experience*.

Why those two numbers:

| number | how it was chosen |
|---|---|
| reveal at **0.867 s** (frame 26) | frames 0–59 were extracted and inspected as a contact sheet, then the mouth band was cropped and re-inspected. Frames 0–25 catch the mouth mid-vowel — this is the wide-open frame that used to be the poster. Frame 26 is the first with the mouth closed and the eyes to camera. |
| introduction ends at **4.880 s** | two independent signals agree: the voice envelope falls to the noise floor after "Welcome to my portfolio", and the first visual scene cut lands at the same frame. |

**Phase 2 — the scroll-controlled cinematic, `4.880 → 33.517 s`.** From there
scroll owns the playhead and the film is silent. The section buys
`(13 + 1) × 100svh` of scroll; progress is `-rect.top / (offsetHeight -
innerHeight)`, clamped, and mapped onto the silent range only — scrolling back to
the very top lands on `4.880 s` and cannot re-enter the speech. The stage stays
pinned until the final frame, so no page content appears behind or beside the
film. At the final frame the pin releases and the work follows.

One scroll source of truth — `window.scrollY`. No Lenis, no ScrollTrigger, so
nothing can disagree about progress. Scroll events are passive; `currentTime` is
never assigned from a scroll handler. A single `requestAnimationFrame` loop
smooths a displayed time toward the target and seeks only when the two differ by
more than one frame:

| parameter | desktop | mobile |
|---|---|---|
| smoothing (lerp per frame) | 0.15 | 0.22 |
| seek threshold | 1/30 s (one frame) | 1/30 s |
| snap-to-target | within 1/30 s | within 1/30 s |

Only one seek is ever in flight. Asking for a new frame while the decoder is still
resolving the previous one queues work that is then thrown away, and that is what
makes a scrub stall; the loop waits for `seeking` to clear before issuing the next
one. Both ends are exact rather than merely close: the first scroll position forces
`4.880 s` and the last forces the complete final frame. Measured drift elsewhere is
**0.000 s across seven sampled positions**, and it survives fast, reverse and
repeated direction-change scrolling.

The stage is full-viewport, and the master is portrait, so `object-position` is
keyed along the timeline to keep the face, the boardroom screen, the team and the
skyline inside the crop as the film moves. There is no player container, no
timeline, no seconds counter and no native controls at any point.

### Measured in a browser

Playwright + Chromium, 1440×900 and iPhone 13, against `scripts/serve.js`:

| check | result |
|---|---|
| drift, 7 scroll positions across the silent range | 0.000 s |
| lowest time reachable by reverse scrolling | 4.880 s |
| black or blank frames during a full scrub | none |
| holds ≥ 0.15 s during a scrub at reading pace | 11 over ~32 s, longest 0.24 s |
| holds ≥ 0.30 s during a scrub | none |
| gate opacity while the playhead is under 0.867 s | 1.00 |
| horizontal overflow, desktop and mobile | 0 px |
| console errors | none |

The residual sub-quarter-second holds are software video decode on a headless
container CPU, not the loop; the loop's own drift is zero.

### When it cannot run

| situation | what happens |
|---|---|
| `prefers-reduced-motion` | the film section collapses to a static poster hero. The introduction plays only on **Play**, with captions and the same custom controls — never the browser's. Scrolling is free and scrubs nothing. |
| the film will not load | `networkState` is polled rather than trusting `<source>` error events, which the browser does not fire dependably once it has abandoned the whole list. The poster becomes the hero, carrying the positioning line and a working **Explore my work**. |
| **Skip cinematic** / **Skip the cinematic…** | the film pauses and mutes, the scroll lock lifts, and the page settles on the first content section. |

Unlock, Play, Pause, Replay, Captions and Skip are all reachable by keyboard with
a visible 2 px focus outline. Gate copy measures 5.0:1 or better against the
brightest part of its own ground.

## Media

The master is **not** committed. To rebuild the derivatives:

```bash
gh release download cinematicmasterv3 -R kalidofficil/khalidonzar-skil -D ./master
bash scripts/build-media.sh ./master/khalid-cinematic-master-v3.mp4
```

| file | resolution | bitrate | size |
|---|---|---|---|
| `khalid-cinematic-master-v3-web.mp4` | 1080 × 1448 | 6.98 Mbps | 28.4 MB |
| `khalid-cinematic-master-v3-web-mobile.mp4` | 720 × 966 | 2.60 Mbps | 10.9 MB |
| `…-web.webm` / `…-web-mobile.webm` | VP9 fallbacks | — | 24.8 / 8.9 MB |

Keyframes every 0.500 s (GOP 15 at 30 fps) so seeking lands where it should.
Duration is identical to the master to the millisecond. `design/TOKENS.md`
records the two damaged-row bands the master inherited and how they were repaired.

## What the figures mean

Every number is a metric **reported by Meta Ads Manager**. The page says so, and
shows no revenue, profit, ROAS, delivery rate or confirmation rate, because there
is no verified data for them. A reported purchase on a cash-on-delivery campaign
is not a delivered order.

Two figures are marked as derived (CPM in case A, reach in case B). Case C shows
`CPC — all clicks`, because $0.01 against a 2.29% link CTR only reconciles as cost
per *all* clicks. The salon and real-estate pieces are labelled **Campaign
concept** and **Sample strategy**; neither has run.

## Accessibility

- `prefers-reduced-motion` unpins the film, shows the poster with native controls,
  removes every card transform and lays the stack out as a plain vertical sequence
- Captions from a real `<track>`, painted into an `aria-live` region
- A transcript of both spoken lines is in the page for screen readers
- Every control is keyboard reachable with a visible focus ring
- All sampled text meets WCAG AA on its own ground
- The page is complete with video blocked, and with JavaScript off

## Contact

| Channel | Value |
|---|---|
| Email | `ounzar.khalid1999@gmail.com` |
| WhatsApp | `+971 58 968 0262` → `https://wa.me/971589680262` |
| LinkedIn | `linkedin.com/in/khalid-ounzar-664bbb424` |

## Before publishing

1. **Set the domain** in `index.html` (canonical, Open Graph), `robots.txt` and
   `sitemap.xml`.
2. **Deploy.** `.github/workflows/deploy-pages.yml` publishes on push to `main`
   only, so nothing goes live from a feature branch.
