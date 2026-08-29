# Khalid Onzar — performance marketing portfolio

A single-page portfolio site for a performance marketing personal brand. Static
HTML, CSS and vanilla JavaScript: no framework, no build step, no dependencies.
Drop it on any host and it runs.

```
index.html              the whole page — all copy lives here
assets/css/styles.css   design tokens and layout
assets/js/main.js       nav, scroll reveals, KPI count-up, ROAS chart, contact form
assets/favicon.svg      tab icon
assets/og-cover.png     1200×630 social share card
scripts/og-cover.html   source for that card
scripts/make-og-cover.py     regenerates assets/og-cover.png
scripts/build-single-file.py builds dist/index.html with the CSS and JS inlined
.github/workflows/deploy-pages.yml  publishes to GitHub Pages on push to main
```

## Run it locally

Open `index.html` in a browser, or serve it so relative paths behave exactly as
they will in production:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Before you publish: replace the placeholders

Every invented figure, quote and link is marked with a `REPLACE` comment. Find
them all with:

```bash
grep -rn "REPLACE" index.html assets robots.txt
```

The list, in page order:

| Where | What to change |
|---|---|
| `<head>` | Canonical URL, Open Graph URLs, JSON-LD profile and social links |
| Hero | Availability line, channels, years in-platform |
| Hero snapshot | The four account rows and the channel mix split |
| Results | The four KPI figures and their notes |
| Chart | `series` and `TARGET` in `assets/js/main.js`, plus the figure caption |
| Selected work | All three case studies |
| About | Bio, toolkit, engagement terms |
| References | **Both testimonials are placeholder text** — see the warning below |
| Contact | Email address (also `CONTACT_EMAIL` in `main.js`), calendar and LinkedIn URLs |
| `robots.txt` / `sitemap.xml` | Your live domain |

**Two things to be careful about.** The testimonials are written as obvious
placeholders on purpose — publish real quotes only, with the client's written
permission to use their name and title. And the metrics throughout are
illustrative: swap in figures you can evidence from your own account exports
before the site goes anywhere near a prospect.

The case studies are written anonymised ("DTC skincare", "B2B SaaS") which is
the normal convention when work sits under NDA. Name clients only where you have
permission.

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
`sitemap.xml`. Or build the one-file version and upload that alone:

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

- **Design.** Deep petrol ground with an amber accent, set in Bricolage
  Grotesque, Hanken Grotesk and Martian Mono. One committed theme rather than a
  light/dark pair, so every colour is painted explicitly.
- **Chart.** Single series against a labelled target rule — one measure, one
  axis. The two data colours are checked for colour-blind separation and
  contrast against the page ground. It ships with a crosshair tooltip and a
  "view as table" toggle so the figures are readable without the graphic.
- **Accessibility.** Skip link, visible focus states, labelled form fields,
  `aria-current` on the nav, an accessible name and description on the chart,
  and every animation disabled under `prefers-reduced-motion`.
- **SEO.** Description, Open Graph and Twitter cards, JSON-LD `Person`,
  `sitemap.xml` and `robots.txt`.
