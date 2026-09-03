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

## How the scrubbing works

One scroll source of truth — `window.scrollY`. No Lenis, no ScrollTrigger, so
nothing can disagree about progress.

```
targetTime = scrollProgress × duration
```

A single `requestAnimationFrame` loop smooths a displayed time toward that target
and assigns `currentTime` only when the two differ by more than one frame:

| parameter | desktop | mobile |
|---|---|---|
| smoothing (lerp per frame) | 0.15 | 0.22 |
| seek threshold | 1/30 s (one frame) | 1/30 s |
| snap-to-target | within 1/30 s | within 1/30 s |

Both ends are exact rather than merely close: the first scroll position forces
time 0, and the last forces the complete final frame. Measured drift elsewhere is
0.03 s — under one frame — and survives fast, reverse and repeated
direction-change scrolling.

The stage is full-viewport, and the master is portrait, so `object-position` is
keyed along the timeline to keep the face, the boardroom screen, the team and the
skyline inside the crop as the film moves.

## Speaking moments

| moment | master window | behaviour |
|---|---|---|
| introduction | 0.25 – 4.95 s | plays on **Play introduction**; audio enabled by that click |
| contact | 27.35 – 30.20 s | plays when the journey reaches it, muted with captions unless audio was already unlocked; **Enable sound** is offered |

At either, scrubbing suspends and the video plays at `playbackRate = 1` with
captions, pause and replay. When the sentence ends the page carries the scroll
forward to that point, so the film continues into what follows rather than
rewinding. Scrolling away from a speaking moment ends it — the visitor is never
trapped. Neither line is ever scrubbed, reversed or re-timed.

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
