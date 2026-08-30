# Khalid Ounzar — performance marketing site

A one-page site for Khalid Ounzar, a performance marketer in Dubai working on
Meta ads and cash-on-delivery e-commerce. Static HTML, CSS and vanilla
JavaScript: no framework, no build step, no dependencies, and no third-party
requests at runtime. Drop it on any host and it runs.

The idea the whole page teaches: **a good cost per purchase is not a profit.**
Ads Manager counts a sale at the tap; in cash on delivery the money is decided
later, on the confirmation call and at the customer's door. The distance between
those two numbers is the site's argument, its hero, and its one interactive
moment.

```
index.html                 the whole page, all copy lives here
assets/css/fonts.css       self-hosted @font-face declarations
assets/css/styles.css      design tokens and layout
assets/js/main.js          the scroll hero, entrances, the hold, the form
assets/fonts/              Newsreader, Archivo, Spline Sans Mono (latin subset)
assets/img/                the portrait and the cropped dashboards
assets/favicon.svg         the gap mark
assets/og-cover.png        1200x630 social card
cinematic/DESIGN-PACKAGE.md  every design decision, written before the build
cinematic/BRIEF.md         the earlier storm-into-still concept, kept for reference
scripts/                   social card and single-file builders
.github/workflows/         publishes to GitHub Pages on push to main
```

## Run it locally

The hero needs a server, because it is driven by scroll and reads its own
geometry. Any one-liner works:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Opening `index.html` by double-clicking also works and shows the static hero.

## How the hero works

The hero is scroll-scrubbed, but there is no video: the scene is drawn in SVG
and its geometry is driven by scroll position. A reported line climbs, a lower
"real" line appears beneath it, and a caliper measures the distance between them
as the last beat lands.

It follows the same engineering standard a filmed hero would: a frame-rate
independent lerp on a rAF loop that goes idle when it converges, DOM writes
gated on change, caption beats paced in scroll distance and validated by a flick
test, and five media queries that swap in a designed static hero on phones,
portrait tablets, landscape phones and reduced motion. Those five queries are
duplicated in `styles.css` and in `GATES` in `main.js` and must stay identical.

**Why it is drawn and not filmed.** The original plan (`cinematic/BRIEF.md`) was
a generated storm-into-still film. The cloud session this was built in blocks the
generator's file host at the network policy level, so footage could be generated
but never pulled down to inspect, encode or ship. The drawn hero carries the same
structure and needs no footage. A local session can still make the film and slot
it in behind the scene without touching the beat map.

## Editing it

**Copy** all lives in `index.html`. The hero beats are the five `.band` elements;
each carries `data-a` and `data-b` (its slice of scroll progress) and `data-fx`
(its entrance). If you change a beat's words, re-run the flick test below.

**Colours and type** are tokens at the top of `styles.css`. The red is the call
to action and the gap marks only. The blue belongs to reported figures. Giving
either one a wider job is what would break the design.

**The interactive moment** is at the top of the hold section in `main.js`:
`REPORTED`, `CONF_RATE`, `DEL_RATE` and `REPORTED_CPA`. It is labelled on the
page as a worked example at typical Moroccan COD rates, not a client result.
Keep that label honest if you change the numbers.

**The contact form** opens the visitor's email app addressed to
`CONTACT_EMAIL` in `main.js`. To have submissions arrive through a form service
instead, add an endpoint to the form tag and wire the POST; the mailto path is a
sensible fallback either way.

## The dashboards

The case-study images are crops of real Meta Ads Manager views. They are cropped
deliberately: everything left of the metrics columns is cut away, along with the
browser chrome and the taskbar, so no account name, business ID, URL or campaign
name survives. **Any replacement screenshot must be cropped the same way before
it is committed.** The uncropped originals are not in this repo.

## Checks worth re-running after a change

```bash
grep -c '—' index.html                 # em dashes: must be 0
grep -niE 'leverage|seamless|empower|unlock|robust|actionable|data-driven|solutions' index.html
node --check assets/js/main.js
```

And in a browser, at desktop and at 375px wide: scrub the hero top to bottom,
flick-scroll it (every beat should stay readable across five or six normal
flicks), press and hold the confirmations panel, submit the form empty, and turn
reduced motion on while the page is open. The last one should pin everything to
its finished state rather than freezing it half-drawn.

## Deploy

**GitHub Pages** — the included workflow publishes the repo root on every push to
`main`. Enable it once under *Settings → Pages → Source → GitHub Actions*. For a
custom domain, add a `CNAME` file containing the domain and point DNS at GitHub.

**Netlify / Vercel / Cloudflare Pages** — connect the repo. No build command, and
the publish directory is the repo root.

**Anything else** — upload `index.html`, `assets/`, `robots.txt` and
`sitemap.xml`. Or build the one-file version and upload that alone; it inlines
the CSS, the JS, the fonts and every image, so it works with no network at all:

```bash
python3 scripts/build-single-file.py   # → dist/index.html
```

Before the site goes live on a real domain, patch the two `<!-- DEPLOY STEP -->`
tags in the `<head>` (`og:url` and `og:image`) with the live absolute URL, and
update `robots.txt` and `sitemap.xml` to match.

## Regenerate the social card

Edit `scripts/og-cover.html`, then:

```bash
python3 scripts/make-og-cover.py
```

It drives headless Chromium (`--chromium /path/to/chrome` if it is not on your
PATH) and writes `assets/og-cover.png`.

## Notes on the build

- **Design.** A cool instrument paper with navy ink and one red, set in
  Newsreader, Archivo and Spline Sans Mono. The signature element is the gap
  rule: one hairline that runs the page and opens into a caliper at three points.
- **Contrast.** Measured, not guessed. Body ink 15.3:1 on the canvas, secondary
  6.6:1, accent 4.9:1, data blue 6.0:1. The hero captions were audited against
  the darkest pixel actually rendered behind them: 6.1:1 at worst for the
  headlines, 4.7:1 for the settle subline.
- **Weight.** About 60KB of HTML, CSS and JS, plus 276KB of fonts and roughly
  900KB of dashboard images that load lazily below the fold.
- **Accessibility.** Skip link, landmarks, a real heading order, visible focus
  states, labelled fields with inline errors, `aria-current` on the nav, alt text
  on every image, the decorative scene marked `aria-hidden` and `inert`, 44px
  touch targets, and reduced motion honoured in both directions live.
- **SEO.** Description, Open Graph and Twitter cards, JSON-LD `Person`,
  `sitemap.xml` and `robots.txt`.
