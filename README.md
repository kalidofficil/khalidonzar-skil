# Khalid Ounzar — cinematic portfolio

A single-page portfolio for a performance marketer in Dubai. One continuous
cinematic journey through an office, broken open in the middle by a plain,
readable editorial section carrying the campaign figures.

Static HTML, CSS and vanilla JavaScript. No framework, no build step, no
third-party requests at runtime — fonts and every media file are self-hosted.

```
index.html                    the page — all copy lives here
legacy.html                   the previous "paper & ink" site, kept intact
assets/css/cinematic.css      design tokens, the cinematic stage, the editorial bands
assets/js/cinematic.js        scroll-linked playback, the two speaking scenes, page wiring
assets/cinematic/             web derivatives: MP4 + WebM, desktop + mobile, posters
assets/captions/*.vtt         captions for the two speaking scenes
assets/fonts/                 Fraunces and Public Sans, self-hosted woff2
scripts/build-media.sh        rebuilds every derivative from the Release originals
scripts/og-cover.html         source for assets/og-cover.png
```

## Run it

```bash
node scripts/serve.js        # → http://localhost:8000
```

**Use that server, not `python3 -m http.server`.** The scroll-linked scenes seek
inside their clips, and seeking needs HTTP Range support. Python's built-in
server ignores the `Range` header and answers `200` with the whole file;
Chromium then reports `video.seekable` as an empty range and silently refuses
every `currentTime` assignment. The journey still swaps scenes as you scroll, so
it looks like it works — but no scene ever scrubs, and there is no console error
to tell you why. Every real host (GitHub Pages, Netlify, Vercel, Cloudflare)
serves ranges, so this only ever bites locally.

Opening `index.html` straight off disk has the same problem, for the same
reason.

## The journey

Nine scenes cut from eight approved clips. Two of them speak; the rest are
driven by the scroll.

| # | Scene | Clip | Playback |
|---|---|---|---|
| 1 | Office introduction | `s01-intro` | **normal speed, original audio** |
| 2 | Office pullback to the window | `s02-pullback` | scroll-linked |
| 3 | Building exterior, blue hour | `s03-exterior` | scroll-linked |
| 4 | Conference-room presentation | `s04-conference` | scroll-linked, with a reading hold |
| 5 | Through the television, out again | `s05-transition` | scroll-linked |
| 6 | Project room, team at work | `s06-project` | scroll-linked |
| — | Performance evidence | — | editorial HTML |
| 7 | Corridor walk | `s07-corridor` | scroll-linked |
| 8 | "Let's work together. Contact me." | `s08-contact` | **normal speed, original audio** |
| 9 | Building exit and Dubai aerial | `s09-aerial` | scroll-linked |

Scenes 4 and 5 are two halves of one clip, cut at the same frame, so the join
is invisible. Scene 8 is never scroll-scrubbed: it plays on its own clock while
the scroll-linked journey holds, which is what "pause the cinematic while the
sentence plays" means here.

## How the scroll system works

Each journey is one tall `<section>` with a `position: sticky` stage inside it.
Section progress (0→1) is split into chapter ranges declared on each `<video>`:

```html
<video data-from="0.37" data-to="0.62" data-join="wipe" data-hold="0.30,0.72" ...>
```

- `data-from` / `data-to` — the chapter's slice of the section
- `data-hold` — a dead zone in the scroll where the footage freezes so a reader
  can finish the overlay before the camera moves again
- `data-join` — `fade`, `wipe` (a dark architectural band sweeps the cut where
  two clips do not frame-match), or `none` (a true continuous cut)

Playhead position is eased toward its target each frame rather than assigned
directly, so a fast flick decelerates instead of stuttering. Videos are encoded
with a keyframe every 5 frames so seeking lands where it should.

Loading is per chapter: the active clip and the next one, nothing else. Posters
are attached on demand too, which is why the first screen is ~167 KB.

## Media

`assets/cinematic/` holds four encodes of every scene — H.264 MP4 and VP9 WebM,
each at desktop (1080×1350) and mobile (720×900) — plus a poster and an end
frame. MP4 is preferred at runtime; WebM covers browsers built without the
proprietary codecs.

The originals are **not** committed. To rebuild:

```bash
gh release download cinematic-assets -R kalidofficil/khalidonzar-skil -D ./originals
bash scripts/build-media.sh ./originals
```

That script documents what inspection found and fixes: a spurious end-card frame
on every clip, bands of damaged green rows in three of them, and five different
source aspect ratios normalised to 4:5. It re-verifies the output at the end.

## What the figures mean

Every number in the case studies is a metric **reported by Meta Ads Manager**.
The page says so, in those words, and shows no revenue, profit, ROAS, delivery
rate or confirmation rate, because there is no verified data for them. A
reported purchase on a cash-on-delivery campaign is not a delivered order, and
the page does not let a reader believe otherwise.

Two figures are marked as derived (CPM in case A, reach in case B) — they are
arithmetic on the reported figures, not separate claims. Case C shows
`CPC — all clicks` rather than a bare CPC, because $0.01 against a 2.29% link
CTR only reconciles as cost per *all* clicks.

The salon and real-estate pieces are labelled **Concept** and **Sample
strategy**. They have not run and are not presented as results.

## Accessibility

- `prefers-reduced-motion` replaces the whole scroll system with poster frames
  and the same copy in normal document flow; nothing seeks and nothing autoplays
- Captions on both speaking scenes, from real `<track>` files, painted into an
  `aria-live` region so they are styled and still announced
- Full transcripts in `<details>` beside each speaking scene
- Every control is keyboard reachable with a visible focus ring
- All body text meets WCAG AA against its own ground; the process ladder marks
  its active step with colour and a rule rather than by dimming text below
  readable contrast
- The page is complete and readable with video blocked, and with JavaScript off

## Before publishing

1. **Check the contact email.** The page uses `kalidofficial55@gmail.com`, the
   address on the repository account. Swap it for a business address if you
   have one — it appears in `index.html` (twice, plus the JSON-LD) and once as
   `CONTACT_EMAIL` in `assets/js/cinematic.js`.
2. **Add LinkedIn / WhatsApp if you want them.** They are deliberately absent:
   no verified URL was available, and a broken button is worse than no button.
3. **Set the domain.** `index.html` (canonical, Open Graph), `robots.txt` and
   `sitemap.xml` currently point at the GitHub Pages URL for this repository.
4. **Deploy.** `.github/workflows/deploy-pages.yml` publishes on push to `main`
   only, so nothing goes live from a feature branch.
