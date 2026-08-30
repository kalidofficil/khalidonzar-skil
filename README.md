# Khalid Onzar — white-label paid media

A single-page portfolio site for a white-label paid media partner working with
agencies. Static HTML, CSS and vanilla JavaScript: no framework, no build step,
no dependencies. Drop it on any host and it runs.

```
index.html              the whole page — all copy lives here
assets/css/styles.css   design tokens and layout
assets/js/main.js       nav, scroll reveals, KPI count-up, ROAS chart, contact form
assets/img/             your photos and case-study screenshots
assets/favicon.svg      tab icon
assets/og-cover.png     1200×630 social share card
scripts/og-cover.html   source for that card
scripts/make-og-cover.py     regenerates assets/og-cover.png
scripts/build-single-file.py builds dist/index.html with everything inlined
.github/workflows/deploy-pages.yml  publishes to GitHub Pages on push to main
```

## Run it locally

Open `index.html` in a browser, or serve it so relative paths behave exactly as
they will in production:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Adding your own images

The page ships with placeholder graphics so nothing looks broken before your
files arrive. There are four image slots:

| Slot | File to add | Shape | Where it appears |
|---|---|---|---|
| Portrait | `assets/img/portrait.jpg` | 4:5 (e.g. 1200×1500) | Beside the About copy |
| Case study 1 | `assets/img/case-1.jpg` | 16:10 (e.g. 1600×1000) | Inside the first case row |
| Case study 2 | `assets/img/case-2.jpg` | 16:10 | Inside the second case row |
| Case study 3 | `assets/img/case-3.jpg` | 16:10 | Inside the third case row |

To use one, drop the file into `assets/img/` and update two things in
`index.html` — the `src` and the `alt` text:

```html
<img src="assets/img/case-1.jpg"
     alt="Blended ROAS climbing across five months in the client dashboard"
     width="1600" height="1000" loading="lazy" decoding="async">
```

Then delete the `REPLACE` line in the `<figcaption>` above it, or write a real
caption there.

A few practical notes. Images are cropped to fill their slot (`object-fit:
cover`), so keep the subject near the centre. Export at roughly 1600px wide and
compress — a portfolio page has no business shipping 4MB screenshots. And crop
or blur anything in a dashboard screenshot that identifies a client: account
names, campaign names, URLs, currency totals you don't have permission to show.

## Before you publish: replace the placeholders

Every invented figure, quote and link is marked with a `REPLACE` comment:

```bash
grep -rn "REPLACE" index.html assets robots.txt
```

The list, in page order:

| Where | What to change |
|---|---|
| `<head>` | Canonical URL, Open Graph URLs, JSON-LD profile and social links |
| Hero | Current capacity line, your terms and base |
| Partner snapshot | The four rows and the channel mix split |
| Results | The four KPI figures and their notes |
| Chart | `series` and `TARGET` in `assets/js/main.js`, plus the figure caption |
| Selected work | All three cases, and their screenshots (see above) |
| About | Bio, portrait, toolkit, engagement terms |
| References | **Both quotes are placeholder text** — see the warning below |
| Contact | Email address (also `CONTACT_EMAIL` in `main.js`), calendar and LinkedIn URLs |
| `robots.txt` / `sitemap.xml` | Your live domain |

**Two things to be careful about.** The testimonials are written as obvious
placeholders on purpose — publish real quotes only, with the partner's written
permission to use their name and title. And the metrics throughout are
illustrative: swap in figures you can evidence from your own records before the
site goes anywhere near a prospect.

The cases are written anonymised ("DTC skincare", "B2B SaaS") which is the
normal convention for white-label work under NDA. Name a partner or a client
only where you have written permission.

## Make the contact form send

Out of the box the form validates, then opens a pre-filled email to
`CONTACT_EMAIL`. To have it post to a form service instead, add your endpoint to
the form tag in `index.html`:

```html
<form class="contact-form" id="contactForm" data-endpoint="https://formspree.io/f/YOUR_ID">
```

Anything that accepts a `multipart/form-data` POST and returns 2xx works —
Formspree, Basin, Netlify Forms, or your own handler. The mailto fallback stays
in place if the request fails.

## Deploy

**GitHub Pages** — the included workflow publishes the repo root on every push to
`main`. Enable it once under *Settings → Pages → Source → GitHub Actions*. For a
custom domain, add a `CNAME` file containing the domain and point your DNS at
GitHub.

**Netlify / Vercel / Cloudflare Pages** — connect the repo. There is no build
command; the publish directory is the repo root.

**Anything else** — upload `index.html`, `assets/`, `robots.txt` and
`sitemap.xml`. Or build the one-file version and upload that alone — it inlines
the CSS, JS and every image:

```bash
python3 scripts/build-single-file.py   # → dist/index.html
```

## Regenerate the social card

Edit `scripts/og-cover.html`, then:

```bash
python3 scripts/make-og-cover.py
```

It drives headless Chromium (`--chromium /path/to/chrome` if it isn't on your
PATH) and writes `assets/og-cover.png`.

## Notes on the build

- **Design.** Warm paper ground with a deep ink-green accent, set in Fraunces,
  Public Sans and Chivo Mono, laid out as ruled bands with account-style labels
  and tabular figures. One committed light world rather than a light/dark pair,
  so every colour is painted explicitly. The contact band is the single inverted
  block on the page.
- **Contrast.** Every ink and accent value is checked against the paper ground:
  body text 15.2:1, secondary 6.7:1, muted labels 4.9:1, accent 11.4:1.
- **Chart.** A single series against a neutral, directly-labelled target rule —
  one measure, one axis. The series colour sits inside the light-mode lightness
  band, clears the chroma floor, and holds contrast against the paper. It ships
  with a crosshair tooltip and a "view as table" toggle so the figures are
  readable without the graphic.
- **Accessibility.** Skip link, visible focus states, labelled form fields,
  `aria-current` on the nav, an accessible name and description on the chart,
  alt text on every image, and all animation disabled under
  `prefers-reduced-motion`.
- **SEO.** Description, Open Graph and Twitter cards, JSON-LD `Person`,
  `sitemap.xml` and `robots.txt`.
