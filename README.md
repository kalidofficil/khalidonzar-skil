# Khalid Ounzar — cinematic portfolio (Version 2)

Two experiences, cleanly separated.

**Chapter one is one uninterrupted film.** All nine approved clips play in story
order inside a single pinned, full-viewport stage. Nothing interrupts it — no
cards, no case studies, no content section. It runs from the spoken introduction
to the Dubai aerial and only then hands over.

**Chapter two is the work.** Positioning, capabilities, process, campaign
evidence, analysis, about and contact, laid out as a restrained 3D card system on
flat editorial surfaces.

Static HTML, CSS and vanilla JavaScript. No framework, no build step, and no
third-party requests at runtime — the two typefaces and every media file are
self-hosted. First screen: 163 KB over 12 requests.

```
index.html                  the page
design/TOKENS.md            the palette, sampled from the footage, and why
assets/css/v2.css           tokens, the film stage, the card system
assets/js/v2.js             the film timeline, speaking scenes, card depth
assets/cinematic/           eight media files: MP4 + WebM, desktop + mobile, posters
assets/captions/*.vtt       captions for the two speaking scenes
assets/fonts/               Instrument Serif and Manrope, self-hosted woff2
scripts/build-media.sh      rebuilds every derivative from the Release originals
scripts/serve.js            local server with HTTP Range support
legacy.html                 the pre-cinematic site, kept intact
```

Version 1 is preserved on branch `claude/cinematic-portfolio-final-xohv3f`.

## Run it

```bash
node scripts/serve.js        # → http://localhost:8000
```

**Use that server, not `python3 -m http.server`.** The film seeks inside its
clips, and seeking needs HTTP Range support. Python's built-in server ignores the
`Range` header and answers `200` with the whole file; Chromium then reports
`video.seekable` as an empty range and silently refuses every `currentTime`
assignment. Scenes still change as you scroll, so it looks like it works — but
nothing ever scrubs, and there is no console error to tell you why. Every real
host serves ranges, so this only bites locally. Opening `index.html` off disk
fails the same way.

## The film

Nine scenes on eight media files. Scenes 4 and 5 are two halves of one source
clip, so they share a file and that join does not exist.

| # | scene | file | label | playback |
|---|---|---|---|---|
| 1 | Office introduction | `s1-intro` | Introduction | **normal speed, original audio** |
| 2 | Office pullback | `s2-pullback` | Introduction | scroll-linked |
| 3 | Exterior Dubai building | `s3-exterior` | Strategy | scroll-linked |
| 4 | Boardroom presentation | `s45-boardroom` 0–1.73s | Strategy | scroll-linked |
| 5 | Through the screen, the building | `s45-boardroom` 1.73–4.93s | Execution | scroll-linked |
| 6 | Project room | `s6-project` | Execution | scroll-linked |
| 7 | Corridor walk | `s7-corridor` | Collaboration | scroll-linked |
| 8 | “Let’s work together. Contact me.” | `s8-contact` | Contact | **normal speed, original audio** |
| 9 | Building exit and Dubai aerial | `s9-aerial` | Contact | scroll-linked |

Each scene declares its own slice of the timeline in the markup:

```html
<div data-scene data-key="s45" data-label="Execution"
     data-from="1.73" data-to="4.93" data-weight="1.15" data-join="none"></div>
```

`weight` is how much scroll the scene buys; the film's height is the sum.
`join` is `cut`, `dissolve` or `wipe`, chosen per join by measuring the outgoing
and incoming frames — see `design/TOKENS.md` for the numbers.

Speaking scenes are never scrubbed. The timeline holds while they play at
`playbackRate = 1` with captions, then hands control back to the scroll. Sound
never starts without a click.

## Media

`assets/cinematic/` holds four encodes of every file — H.264 MP4 and VP9 WebM,
each at desktop (1600×1066, 3:2) and mobile (720×1280, 9:16) — plus a poster and
an end frame. MP4 is preferred at runtime; WebM covers browsers built without the
proprietary codecs.

The stage is full-viewport, so each clip is cropped with a per-clip offset
measured off the footage, protecting Khalid's face first, then the MacBook, the
boardroom screen, the team and the skyline. CSS covers the real viewport from
there.

The originals are **not** committed. To rebuild:

```bash
gh release download cinematic-assets -R kalidofficil/khalidonzar-skil -D ./originals
bash scripts/build-media.sh ./originals
```

That script documents what inspection found and fixes — a spurious end-card frame
on every clip, bands of damaged rows in three of them — and re-verifies the output.

## What the figures mean

Every number in the case studies is a metric **reported by Meta Ads Manager**. The
page says so, and shows no revenue, profit, ROAS, delivery rate or confirmation
rate, because there is no verified data for them. A reported purchase on a
cash-on-delivery campaign is not a delivered order, and the page does not let a
reader believe otherwise.

Two figures are marked as derived (CPM in case A, reach in case B) — arithmetic on
the reported figures, not separate claims. Case C shows `CPC — all clicks` rather
than a bare CPC, because $0.01 against a 2.29% link CTR only reconciles as cost
per *all* clicks.

The salon and real-estate pieces are labelled **Campaign concept** and **Sample
strategy**. They have not run and are not presented as results.

## Accessibility

- `prefers-reduced-motion` unpins the film, replaces it with poster frames in
  order, and removes every card transform; nothing seeks and nothing autoplays
- Captions on both speaking scenes from real `<track>` files, painted into an
  `aria-live` region so they are styled and still announced
- Every control is keyboard reachable with a visible focus ring
- All sampled text meets WCAG AA on its own ground — the primary button is ink on
  ember at 5.0:1, because cream on ember is only 3.3:1
- The page is complete and readable with video blocked, and with JavaScript off

## Contact details

| Channel | Value |
|---|---|
| Email | `ounzar.khalid1999@gmail.com` |
| WhatsApp | `+971 58 968 0262` → `https://wa.me/971589680262` |
| LinkedIn | `linkedin.com/in/khalid-ounzar-664bbb424` |

## Before publishing

1. **Set the domain.** `index.html` (canonical, Open Graph), `robots.txt` and
   `sitemap.xml` point at the GitHub Pages URL for this repository.
2. **Deploy.** `.github/workflows/deploy-pages.yml` publishes on push to `main`
   only, so nothing goes live from a feature branch.
