# Sama Al Ola General Contracting — Company Profile

A 24-page A4 company profile, rebuilt from the previous version with a new visual identity:
midnight navy, champagne and warm ivory, set in Noto Serif Display and Jost.

```
Sama-Al-Ola-Company-Profile.pdf   the finished profile (7 MB; fine for email and WhatsApp)
index.html                        all copy and page structure, one <section> per page
profile.css                       colours, type, grid and the layout of every page
assets/img/                       genuine project images, extracted from the previous profile
assets/logo/                      the original logo, plus single-colour versions made from its exact shape
assets/fonts/                     embedded fonts (SIL Open Font License, see OFL-*.txt)
tools/                            export and QA scripts
```

## Editing and exporting

Open `index.html` in Chrome to see every page. Text lives in `index.html`; positions, sizes and
colours live in `profile.css`, grouped by page (`.p01` … `.p24`).

To export the PDF (needs Node with Playwright, and Python with pypdf):

```bash
node tools/export-pdf.js                                # writes Sama-Al-Ola-Company-Profile.pdf
python3 tools/finalize-pdf.py Sama-Al-Ola-Company-Profile.pdf   # metadata + bookmarks
node tools/check-layout.js                              # text overflow, margins, collisions
node tools/check-resolution.js                          # real detail (ppi) of every placed image
```

The PDF embeds its fonts as subset TrueType. The contents page, the services index (page 6) and the
interiors index (page 14) link to their pages. The phone numbers, email and website on page 24 are
clickable. Bookmarks list every section and project.

## Design system

| Token | Value | Use |
|---|---|---|
| Midnight navy | `#0D1F3A` | dark pages, text on ivory |
| Champagne | `#C9A66B` / `#E4CC9C` | accents and italics on navy |
| Bronze | `#7E5E31` / `#8C6A3A` | accents on ivory (contrast 5.3:1 for small text) |
| Warm ivory | `#F6F1E7` | light pages |
| Display | Noto Serif Display 400/500, italic 400 | headlines, project names, numerals |
| Text | Jost 400/500/600 | body, labels, metadata (labels never below 7 pt) |

Grid: 18 mm side margins, 174 mm content width. Light and dark pages alternate; images are either
full-bleed or aligned to the grid.

## Image audit

Every image comes from the previous profile. No AI-generated, stock or invented imagery is used.
No official website or social account could be found to source originals: `www.sama-alola.com`
did not resolve when checked.

**Kept: 43 genuine project images.**

- 13 are site photographs: Tamim Apartment, Picasso Salon (4), Le Méridien Hotel (4) and Hitachi Zosen Offices (4).
- 30 are 3D design visualisations: all six villas, Kissaki, the Villa Qedaib interiors, VIP Villa, Lucky Office, Game Room and one Le Méridien image.
- Each visualisation carries a small **"Visualisation"** tag so clients don't mistake a render for a photograph of finished work. To remove the tags, add `.vis { display: none; }` to `profile.css` and re-export.

**Removed: 9 images.**

- The previous cover villa. It doesn't match any listed project, carries only about 500 px of real detail, and its origin couldn't be verified.
- 8 stock photos: hard-hat workers, a Chicago train, cranes, rope access, an AC technician, a hotel room and a lounge.

**Retouching.** The Hitachi photos got a mild neutral white balance to correct a blue cast. Nothing
else was edited. The Picasso Salon main photo is cropped to remove a third-party "fresha" watermark.
It appears to come from the salon's booking-platform listing, so confirm you're allowed to use it,
or supply your own photo.

**Resolution.** Many images had been enlarged before they reached the previous PDF. Their real
detail is far below their pixel size. Each image is placed no larger than its real detail allows:
`tools/check-resolution.js` reports 120–390 ppi effective for all 47 placements. Nothing is upscaled.

**Reuse.** Several villas have only one image, so a few appear twice, each time with a different crop
or purpose and a caption pointing to the project page:

| Image | Pages |
|---|---|
| Villa Mohammad Al Shehhi | cover (full façade) and page 9 (entrance crop) |
| Villa Qedaib exterior | page 2 (crop) and page 11 |
| Villa Mohammad Al Kaabi | page 6 and page 12 |
| Villa Hussain Al Hosani | page 10 and page 24 |

Four images from multi-image projects were moved to the service pages and are not repeated:

- VIP Villa bedroom: page 4
- VIP Villa formal dining: page 7
- Le Méridien counter: page 7
- Hitachi corridor: page 8

The project pages point to them.

## Originals to request from Sama Al Ola

Ask for the original files, not WhatsApp-forwarded copies. WhatsApp compresses photos unless they're
sent as documents. Aim for at least 3000 px on the long edge.

**Needed most.** These are too small to show larger than they are now:

1. Villa Hussain Al Hosani, exterior (about 600 px of real detail): pages 10 and 24
2. Villa Mohammad Al Kaabi, exterior (about 600 px): pages 6 and 12
3. Villa Faisal Khajeh, exterior (about 720 px): page 13
4. Villa Qedaib Musabbeh Alkaabi, the 6 interior images (about 520 px each): page 16
5. Hitachi Zosen Offices, the 4 site photos (about 390–490 px): pages 8 and 21
6. Le Méridien Hotel, all 5 images (about 430–520 px): pages 7 and 20
7. Lucky Office, the 9 visualisations (about 430 px): page 22
8. Picasso Salon, the 3 secondary photos (about 325–520 px) and an unwatermarked main photo: page 19
9. Game Room, the 2 visualisations (about 900 px): page 23

**Would sharpen print.** These are usable on screen today:

- Villa Mohammad Al Shehhi (cover)
- Villa Qedaib exterior
- Villa Adel Alkatheeri
- Kissaki (2)
- VIP Villa (4)
- Tamim Apartment

**Missing entirely.** These would strengthen the profile most:

- Site photographs of the completed villas. All six villa images are visualisations.
- Completion photos of Kissaki, VIP Villa, the Villa Qedaib interiors, Lucky Office and Game Room.
- Genuine photos for services C, D and E: maintenance work, AC plant and servicing, MEP installations.
- The manufacturing facility and team on site (mentioned on page 7).
- A second view of Villa Mohammad Al Shehhi, so page 9 no longer reuses the cover image.
- The logo as a vector file (AI, EPS, SVG or PDF). The current PNG (3523 × 863 px) is fine at the sizes used.

When a new image arrives, drop it into `assets/img/` under the same file name and re-export. If it has
more detail, add its name to `NATIVE_FACTOR` in `tools/check-resolution.js` with a factor of 1, then
enlarge its placement in `profile.css`.

## Content notes

- All company, project, consultant, location and scope details come from the previous profile.
  Repetitive descriptions were shortened, and spelling is consistent British English (the original
  already used "Aluminium").
- Locations read "District, City", for example "Al Riyadh, Abu Dhabi". The original's "Saadiyat" and
  "Al Saadiyat" are unified as "Al Saadiyat".
- Page 2 shows "06 villa projects · 09 interior projects" rather than a combined total, because Villa
  Qedaib Musabbeh Alkaabi appears in both sections (main contracting and interior decoration).
- Confirm the website `www.sama-alola.com` is live before sending; it is printed and linked on page 24.
