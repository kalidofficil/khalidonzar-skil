# Verified content inventory — Khalid Ounzar redesign

Working record for the redesign on `claude/khalid-portfolio-redesign-2jx71t`.
Everything in "Verified" was supplied by Khalid in this session (screenshots of the
old Lovable site, or written instructions). Everything in "Missing" must arrive
before it can appear on the site. Nothing gets invented to fill a gap.

Rules in force, set by Khalid:

- No invented clients, testimonials, qualifications, revenue, ROAS or outcomes.
- Reported COD orders, confirmed/delivered orders and actual profit are distinct
  and must be labelled as such.
- The old site is a content source only. Its design, colours, layout, typography
  and animations must not carry over. The repo's previous "paper & ink" build and
  the "storm into still" cinematic brief are superseded for design purposes.
- Screenshots must be scrubbed of confidential client information before they are
  committed or shown on the site. Sensitive originals are never committed.

## Identity (verified)

- **Name:** Khalid Ounzar — this spelling everywhere, visible text and metadata.
  (The repo previously used "Onzar"; every occurrence gets corrected in the redesign.)
- **Base:** Dubai.
- **Role:** Performance marketer and media buyer, hands-on e-commerce experience.
- **Audience for this site, in order:** brands and business owners considering his
  services; employers and recruiters hiring a media buyer / performance marketer;
  agencies interested in collaboration (not exclusively white-label).
- **Positioning note:** website and landing-page work is presented as a supporting
  creative capability, evidenced by actual projects.

## Old site content, transcribed from screenshots (verified)

Source: three screenshots of the Lovable project "Khalid Ounzar Portfolio"
(project 74b1d2be-593e-4f74-bd9c-f2aff1df9ad2), supplied 2026-08-30. Site nav:
Home · Portfolio · Let's Talk.

### Process — "What happens next: From first conversation to campaign action"

Lede: "A clear process designed to understand the business before recommending
media decisions."

1. **Initial Conversation** — We discuss your business, current advertising
   situation and primary objectives.
2. **Discovery & Access** — I review the offer, audience, previous results,
   creatives and available campaign data.
3. **Audit & Priorities** — I identify the strongest opportunities and the main
   performance bottlenecks.
4. **Action Plan** — You receive a focused testing and optimization plan aligned
   with your goals and budget.
5. **Execution & Reporting** — We launch the agreed actions, monitor performance
   and communicate what is working, what is not and what to test next.

### Skills — "The skills behind the numbers"

1. **Meta Ads & Media Buying** — Campaign analysis, audience testing, budget
   decisions and performance optimization across paid social campaigns.
2. **Creative Analysis** — Evaluating hooks, CTR, CPC and creative performance to
   understand where attention turns into action.
3. **E-commerce Funnel Analysis** — Looking beyond the ad to understand landing
   pages, orders, confirmation, delivery and real profitability.
4. **Product & Competitor Research** — Researching products, competitors, customer
   feedback and market signals before making advertising decisions.
5. **Tracking & Measurement** — Working knowledge of Meta Pixel, GA4, GTM, UTMs
   and conversion tracking to understand campaign performance.
6. **Data-Driven Optimization** — Using CPM, CTR, CPC, CPA, frequency, conversion
   rate and other signals to diagnose problems and identify opportunities.

### Approach — "How I approach it" (main heading partly hidden by the nav in the screenshot)

Lede: "I connect media buying decisions with creative performance, conversion data
and the wider customer journey."

1. **Campaign & Funnel Audit** — Review campaign structure, audiences, creatives,
   tracking and conversion points to locate the main bottlenecks.
2. **Structured Testing** — Prioritize meaningful tests across hooks, offers,
   creative formats, audiences and landing-page elements.
3. **Performance Optimization** — Analyze CPM, CTR, CPC, CPA, frequency and
   conversion rate to improve budget allocation and campaign efficiency.
4. **Business-Level Analysis** — Evaluate results beyond Ads Manager, including
   confirmation, delivery, returns and profitability when data is available.

## Missing before build-out (exact items)

1. **Portrait as a file.** The portrait was pasted inline in chat, which this
   environment can view but does not save to disk, so it cannot be processed or
   embedded. It must be re-sent as a file attachment (the four reference videos
   arrived that way and landed correctly). Highest available resolution.
2. **Homepage hero + about copy** from the old site: the headline, subheadline and
   any biography/experience text (screenshot or pasted text). Also the full
   "How I approach it" heading, which the nav bar covers in the screenshot.
3. **The Portfolio page**: every project/case study — client or project name (or
   anonymised label), what was run, platform, and the real figures with periods.
   Screenshots that will appear on the site must come as file attachments, and
   anything confidential gets scrubbed before it is committed.
4. **Campaign results**: the real numbers Khalid wants shown (spend managed, ROAS,
   COD reported vs delivered rates, etc.), each with its basis and period.
5. **Certifications**: names, issuers, dates; badge files if they should be shown.
6. **Contact details**: email for the site, LinkedIn URL, and any other channels
   (WhatsApp, calendar link, phone) that should appear.

## Environment constraints (verified in this session)

- Egress blocks `lovable.app` / `lovableproject.com` / Higgsfield's CDN, so the
  old site cannot be fetched directly and generated media cannot be downloaded
  here. Anything generated externally reaches the build only as a file upload
  into the session.
- Inline chat images are viewable but not saved to disk; file attachments are
  saved. Assets that must ship with the site need to be file attachments.
- Verified working locally: ffmpeg (static), Playwright + Chromium for testing,
  rembg (bria-rmbg-2.0) for portrait cutouts, Node 22, Python 3.11.
