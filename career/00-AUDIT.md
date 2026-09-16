# Khalid Ounzar — positioning audit, LinkedIn rewrite, application strategy
Prepared 16 September 2026. Sources inspected are listed in §0.

---

## 0. WHAT I ACTUALLY INSPECTED

**Inspected in full**
1. `Profile.pdf` — LinkedIn "Resume generated from profile" export, 4 pages, dated to a profile state current as of upload. Fully decoded (headline, About, all four Experience entries with dates, Education, Top Skills, Certifications, contact block).
2. This repository (`kalidofficil/khalidonzar-skil`) — a single-page portfolio site: `index.html` (30.5 KB), `README.md`, `cinematic/BRIEF.md`, `assets/`, `.github/workflows/deploy-pages.yml`. This is your "portfolio website" and it materially changes the advice, so I read it closely.

**Not received — I did not see these and have not guessed at them**
- Your CV / existing resume.
- The three campaign screenshots. I have only the numbers you typed in the brief. I have **not** seen date ranges, attribution windows, the account, the event definition, the currency, or the ad account name.
- The COBA Abu Dhabi reel and proposal, the Parker's creative concept, and the cinematic personal portfolio as finished files.
- Any target job descriptions.

**Not accessible**
- I cannot open `linkedin.com/in/khalid-ounzar-664bbb424` directly. LinkedIn blocks automated fetching. Everything I say about your LinkedIn comes from the PDF export you attached. The export does **not** show: your profile photo, banner, Featured section, Projects section, full Skills list (only the 3 pinned "Top Skills"), recommendations, or Open-to-Work status. I have flagged those as unverified rather than assessed them.

---

## 1. EXECUTIVE VERDICT

**Strongest honest positioning:** *Junior paid social / media buyer for e-commerce, who writes and cuts his own performance creative.* Dubai-based, Arabic + English.

The creative production skill is real and unusual at junior level — most junior buyers cannot produce their own ads. It is a differentiator. It is not a second career track you are currently hireable into at mid level.

### The five biggest priorities, in order

**1. Your LinkedIn currently claims roughly 2.6× the experience you told me you have. Fix this first.**

LinkedIn shows three consecutive, non-overlapping marketing roles:

| Entry | Dates on LinkedIn | Duration shown |
|---|---|---|
| Digitalpole — E-commerce & Media Buying Assistant | May 2025 – Jul 2026 | 1 yr 3 mo |
| Self-employed — Performance Marketing & E-commerce | Nov 2023 – Feb 2025 | 1 yr 4 mo |
| Independent E-commerce Project (Casablanca) | Aug 2021 – Nov 2022 | 1 yr 4 mo |

That totals **47 months — just under four years**. The date arithmetic is internally correct and the three do not overlap, so a recruiter reading the profile will conclude you have ~4 years in paid media.

You described to me: ~12 months Morocco COD e-commerce, ~6 months dropshipping, plus remote support for a Morocco e-commerce company. That is roughly **18 months**.

This is the single highest-risk item in your materials. It is not a wording problem — it is a factual one, and it is the kind of thing that ends a process at reference-check or in the first technical interview, when someone with four years on paper cannot answer a four-year-experience question. Either the LinkedIn dates are wrong, or the summary you gave me understates what you did. I cannot tell which from the outside. See §2, Q1–Q3.

**2. You are currently advertising two certifications you told me you have not earned.**

The LinkedIn Certifications section lists **Google Ads Search Certification** and **Meta Certified Media Buying Professional**. You told me both were goals. Certifications are the easiest claim in your entire profile to verify — Meta and Google both issue public credential IDs, and UAE agencies routinely ask for them. Remove both today. Re-add the moment you pass. This is a five-minute fix and it removes a disqualifying risk.

**3. Your portfolio site contains fabricated performance figures. Do not publish it as it stands.**

The site in this repo currently reads, in live page copy:

- `$8.4M` ad spend managed — *"Across 14 accounts since 2019"*
- `4.1×` blended ROAS — *"Trailing 12-month average"*
- `96%` client retention — *"Partner accounts, past 24 months"*
- `9` agency partners — *"Since going white-label in 2023"*
- Partner snapshot: combined spend `$412,900`, avg. blended ROAS `4.18×`
- Case studies claiming `4.6× blended ROAS, from 3.2×` and `+64% day-30 ROAS`
- Two testimonials whose body text is literally *"Placeholder quote — replace with a real partner reference."*

Against your actual evidence: three campaigns totalling **$1,212.80** in spend, no ROAS data at all, and no agency partners. The "since 2019" line also contradicts your own LinkedIn, where the earliest work starts August 2021.

**The good news: it is not live.** The deploy workflow only publishes on a push to `main`, and this repo has no `main` branch — only the two `claude/*` branches. So nothing has been published. One merge to `main` would publish all of it under your name.

The site was clearly generated as a template with placeholders (the README says so explicitly and 21 `REPLACE` markers remain in `index.html`). That is fine as a template. It is not fine as a portfolio. Either gut the numbers and rebuild it around your real, small, honest campaigns, or keep it unpublished. Do not send this URL to anyone in its current state.

**4. The portfolio and the LinkedIn are selling two different people, under three different spellings of your name.**

- LinkedIn sells a **consultant taking on clients**: the About ends *"If you're investing in paid acquisition... send me a message here on LinkedIn."*
- The portfolio sells a **white-label agency subcontractor**: *"White-label paid media for agencies. Meta, Google and TikTok, run under your brand, and your client never hears my name."* Six productised services including "account rescue" and "pitch and audit support." A two-week paid audit offer.
- You have told me you want to be **hired as an employee**.

Those are three different buyers. An in-house hiring manager who finds the white-label site will reasonably conclude you are building an agency and will treat you as a flight risk.

Name spellings in play: **"khalid ounzar"** (LinkedIn, all lowercase), **"Khalid Onzar"** (portfolio, repo, and the `khalidonzar.com` domain), **"Khalid Ounzar"** (your brief). Pick one, use it everywhere. Right now a recruiter cannot reliably match your portfolio to your LinkedIn — and the site's own structured data points at `linkedin.com/in/khalidonzar`, which is not your profile URL.

**5. Define what your "purchase" event actually is, before you show those numbers to anyone.**

Your three campaigns report costs per purchase of **$0.56, $0.28 and $2.14**. A $0.28 purchase is not a plausible paid e-commerce transaction anywhere. In Morocco COD the near-universal setup is that the Meta `Purchase` event fires on **COD order-form submission** — an order placed, not money received, and before confirmation and delivery attrition.

If that is what happened, these are **cost per COD order submitted** — closer to a cost per lead than a cost per sale. Any competent UAE media buyer will work this out in about four seconds. If you present them as "purchases at $0.56," you will be read as either not understanding your own tracking or overselling. If you present them correctly — *"Meta-reported purchase events firing on COD order submission; delivered-order data sat with the fulfilment side"* — the same numbers make you look careful and senior beyond your years.

This is the highest-leverage single sentence in your whole application package. It converts your weakest-looking data into your strongest credibility signal.

---

## 2. EVIDENCE GAPS — questions that change the output

Answer these and the resumes stop being drafts. I have not asked about anything you already told me.

1. **Digitalpole.** Are the dates May 2025 – Jul 2026 correct? Was this employment, freelance, part-time or an internship? Was it based in Dubai as LinkedIn states, or was it the remote support for the Morocco e-commerce company you mentioned? "Media Buying Assistant" — did you have login access to the ad account and make live changes, or did you prepare work someone else shipped?
2. **The 2021–2022 and 2023–2025 entries.** LinkedIn shows 16 months each. You described ~12 months COD and ~6 months dropshipping. Which is accurate? If the LinkedIn dates include periods where the project was dormant or you were studying, they need to change — the Oxford diploma (Jan–Sep 2023) and OFPPT (to Sep 2021) both sit inside or adjacent to those windows.
3. **Parker's Dubai.** What dates, and what was the job title? It is completely absent from your LinkedIn. If it overlaps May 2025 – Jul 2026, it conflicts with a full-time Dubai marketing role on the same profile.
4. **The three campaigns.** For each: date range, ad account/client, your role (did you build and optimise it, or report on it?), the attribution setting shown, the currency, and — critically — what the Purchase event was firing on. Screenshots.
5. **Contact email.** LinkedIn shows `khalidounzaroficial@gmail.com` (note: one `f` in "oficial"). Your account here is `kalidofficial55@gmail.com`. Which do you actually monitor? And do you have a UAE mobile number to put on a resume?
6. **Visa status.** Are you on a residence visa, employment visa, or do you require sponsorship? UAE listings filter hard on this and it belongs on the resume if it is favourable.
7. **COBA Abu Dhabi.** Was this delivered and published for a client, a paid pitch, or unsolicited spec work? The honest label changes completely between those.
8. **Certifications.** Have you since passed either exam? If in progress, when do you sit them?

**Proceeding without these:** everything below is written from what is supported. The two resumes are marked **DRAFT** for the reasons listed in each file.

---

## 3. ROLE FIT

### A. Media Buyer / Paid Social / Performance Marketing Executive

**Strongest evidence.** Meta Ads is genuinely your channel, and you have the thing most junior applicants lack: you have owned an entire commercial loop. Product research → offer → landing page → creative → buying → confirmation → delivery → margin. Your LinkedIn About already articulates the right instinct ("A low CPL means little if the leads aren't qualified"). Three campaigns with sane, internally consistent maths and a 61.08% hook rate. Arabic + English matters for UAE and GCC targeting.

**Requirements you already meet.** UAE listings for this role converge on: hands-on Meta Ads Manager execution; campaign setup, monitoring, optimisation and reporting; reading CPM/CPC/CTR/CPA/frequency; creative testing; working with a creative team. You meet all of those, and you can do the creative part yourself.

**Gaps that matter.**
- **Budget scale.** Your shown spend is ~$1,213 total. UAE agency and in-house roles ask what monthly budget you have managed. You currently have no answer. This is the gap that most limits you.
- **Tracking.** No evidence of GA4, GTM, Pixel/CAPI setup, or server-side events. Roles at the 2–4 year mark assume you can at least diagnose a broken event.
- **Google Ads.** Your headline gives Google equal billing with Meta. Nothing in your materials supports Google search competence. This will be tested in interview and it will not go well.
- **Client/stakeholder reporting.** No evidence of a recurring report to a client or manager.
- **UAE market experience.** All your buying evidence is Morocco. Different AOV, different payment behaviour, different platform mix.

**Appropriate seniority.** Junior / Executive. Titles to target: *Media Buyer (Junior)*, *Performance Marketing Executive*, *Paid Social Executive*, *Digital Marketing Executive (Paid)*, *Media Buying Assistant*, *Growth Executive*. Do **not** apply to *Senior* or *Performance Marketing Manager*. The 2–4 year "Media Buyer / Specialist" postings are a stretch but worth applying to selectively — your end-to-end ownership is a real argument there.

**Best-fit employers, in priority order.**
1. **UAE/GCC e-commerce brands and D2C startups** — your COD and unit-economics background transfers most directly; small teams value someone who can also cut the ad.
2. **Small-to-mid performance agencies (5–40 staff)** — hire junior, train on process, and want volume of hands-on execution.
3. **COD/dropship operators in the GCC** — Morocco COD experience is nearly a direct match; a genuinely underrated target that most applicants ignore.
4. Large network agencies (Publicis, Omnicom, Dentsu) — realistic only at coordinator/assistant level.

### B. Creative Strategist

**Strongest evidence.** You can take a concept from brief to finished short-form video alone (Claude, Higgsfield, CapCut, ElevenLabs), and you understand hook mechanics — the 61.08% hook rate shows you have watched that metric on your own work. Three creative projects exist.

**Requirements you meet.** Concept development, scripting, short-form video production, hook construction, fluency in the AI-assisted production stack that UAE agencies are actively hiring for right now.

**Gaps that matter, and they are larger here.**
- **Your creative work has no performance attached.** Creative strategy in a paid context is *"we tested six hooks, this angle won, here is why, here is what we tested next."* Parker's is a concept. The cinematic portfolio is personal. COBA's status is unconfirmed. None of them currently shows a creative decision validated by data — which is the entire job.
- **No brief/storyboard/testing artefacts.** No creative briefs, no storyboard-to-final comparisons, no testing matrices.
- **The UAE market for this title skews social-content, not performance-creative.** The listings I found lean 2–3 years of social content management, preferring UAE real estate, luxury hospitality and high-end agency backgrounds. You have none of those. Posted ranges for the junior end of these were AED 6,000–6,500.
- **No volume evidence.** Creative strategist roles want throughput — dozens of concepts per month.

**Appropriate seniority.** Junior, and narrower than track A. *Creative Strategist (Junior)*, *UGC / Creative Coordinator*, *Content & Creative Executive*, *Performance Creative Associate*.

**Best-fit employers.** UGC-led e-commerce brands; performance agencies with an in-house creative pod; short-form-video specialist studios. Not luxury/real-estate social agencies — you do not match their stated background preference.

### Should the headline be combined?

**No. Lead with media buying; carry creative as the differentiator.**

Reasons, specifically:
1. **Volume.** UAE paid-media roles substantially outnumber creative strategist roles, and your evidence is stronger there.
2. **A combined headline reads as undecided at junior level.** At senior level "Performance Marketer & Creative Strategist" reads as range. At 18 months it reads as someone who has not chosen, and recruiters screening for a specific req will pass.
3. **The creative skill is worth more as a qualifier than as a co-title.** *"Media buyer who produces his own creative"* is a sharper, rarer, more hireable proposition than either title alone — and it is the honest description of what you do.
4. Nothing is lost. The About section and Featured items carry the creative evidence, so creative-strategist recruiters still find it.

---

## 4. DEEP LINKEDIN AUDIT

Format: **Current → hiring concern → exact fix → priority.**
Priority: **P0** = fix today, blocks shortlisting or is an integrity risk. **P1** = this week. **P2** = this month.

### Certifications — P0
**Current:** Section lists "Google Ads Search Certification" and "Meta Certified Media Buying Professional."
**Concern:** You have told me neither is earned. Both are publicly verifiable with a credential ID, and UAE agencies ask. Discovery is disqualifying and permanent.
**Fix:** Delete both entries now. If in progress, put a single line at the end of About: *"Currently preparing for Meta's media buying certification."* Re-add with the credential ID and issue date on the day you pass.

### Experience dates and durations — P0
**Current:** Three entries totalling 47 months.
**Concern:** As §1.1. Overstatement of tenure is the most common reason a marketing offer is withdrawn late.
**Fix:** Reconcile every start and end date against real records. Where a period was part-time, intermittent or study-concurrent, set the employment type to *Part-time*, *Freelance* or *Self-employed* and say so in the first line of the entry. A shorter honest history that you can defend beats a longer one that collapses under one question.

### Portfolio consistency — P0
**Current:** Portfolio positions you as a white-label agency supplier with $8.4M managed; LinkedIn positions you as a consultant; you want employment.
**Concern:** Any of the three contradicts the other two. The fabricated figures would end a process instantly.
**Fix:** Decide you are job-seeking. Rewrite or unpublish the site. Do not merge this repo to `main` until the numbers are real. Use one name spelling, and fix the site's structured-data LinkedIn URL — it currently points to `linkedin.com/in/khalidonzar`, which does not resolve to you.

### Name — P0
**Current:** "khalid ounzar" — all lowercase. Also "el misbah informatique" and "ighrem Laalam High School" lowercase.
**Concern:** Lowercase reads as carelessness on the one field every recruiter sees, and it breaks name-matching between your LinkedIn, resume and portfolio.
**Fix:** "Khalid Ounzar." Capitalise all company and school names: "Al Misbah Informatique", "Ighrem Laalam High School".

### Headline — P1
**Current:** *"Performance Marketer in Dubai | Meta & Google Ads | Helping Businesses Generate Qualified Leads & Sales | Paid Acquisition & Full-Funnel Growth"*
**Concerns:** (a) *"Helping Businesses Generate..."* is service-provider language — it signals freelancer, not candidate. (b) Google Ads has equal billing with Meta and is not supported by your evidence. (c) No job title a recruiter searches for — nobody filters for "Full-Funnel Growth". (d) No e-commerce, which is your actual differentiator. (e) Creative production, your rarest skill, is absent.
**Fix:** See §5. Also switch on **Open to Work** with the exact target titles — recruiter-only visibility if you prefer discretion.

### About — P1
**Current:** ~380 words, opening *"Paid acquisition isn't about buying more traffic. It's about building a system that turns attention into profitable growth."* Closes with a DM solicitation.
**Concerns:**
- **Voice outruns evidence.** The register is that of someone with 6+ years. A recruiter who reads this and then sees "Media Buying Assistant" experiences a drop, and that gap reads as overselling. The thinking is genuinely good — it just needs a body of proof under it.
- **Zero specifics.** No number, no product category, no market, no result, no tool detail. All principle, no proof.
- **Wrong call to action.** *"send me a message here on LinkedIn"* asks recruiters to become clients.
- **"Lead Generation" is claimed as one of two focus areas** with nothing anywhere in your materials supporting a single lead-gen campaign. Every piece of evidence you have is e-commerce purchase-event.
- **No mention of creative production, Arabic/English, or visa/work status.**
**Fix:** Full rewrite in §5.

### Top Skills — P1
**Current pinned three:** Performance Marketing, TikTok Marketing, Google Ads.
**Concern:** **Meta Ads is not in your top three.** These three are what appear under your name in search previews. You have pinned your two weakest channels and omitted your strongest.
**Fix:** Pin **Meta Ads / Facebook Ads**, **Performance Marketing**, **E-commerce**. Full skill list in `02-KEYWORDS.md`.

### Experience entry content — P1
**Current:** Bullets are capability lists — *"Analyzed CPM, CTR, CPC, CPA, frequency, conversion rate and creative performance to identify bottlenecks and determine what to test next."*
**Concern:** This describes the job, not what you did in it. It is indistinguishable from a job description, so it proves nothing. Also every one of the three entries uses near-identical bullets and the same "Core Focus:" keyword string — so a reader learns nothing new from entries two and three, and the repetition reads as padding.
**Fix:** Differentiate them. One should be about COD unit economics, one about product testing velocity, one about supporting a live account. Rewrites in §5.

### Featured section — P1 (cannot verify)
**Current:** Not present in the PDF export. LinkedIn exports omit Featured, so I cannot tell whether you have one.
**Concern:** If empty, this is your largest missed opportunity — it is the only place on LinkedIn where a recruiter sees actual work without leaving the page.
**Fix:** Recommended items and order in §5.

### Projects section — P2 (cannot verify)
**Concern:** Your three creative projects and three campaign case studies have nowhere to live if this is empty.
**Fix:** Add each creative project with a one-line strategic rationale, not just a link.

### Photo and banner — cannot verify
Not in the export. Requirements: a clear, well-lit headshot, face filling roughly 60% of frame, neutral background. Banner: not a stock cityscape — use one legible line, e.g. *"Paid social & e-commerce media buying — Dubai"*.

### Contact block — P1
**Current:** `khalidounzaroficial@gmail.com`. No phone. LinkedIn URL is the default `khalid-ounzar-664bbb424`.
**Fix:** Confirm which inbox you actually monitor (see Q5 — you have given me two different addresses, and the LinkedIn one has a typo: "oficial"). Add a UAE mobile. Customise the URL to `linkedin.com/in/khalidounzar` if free — the numeric default looks like an unfinished profile, and a clean slug is what you print on a resume.

### Education — P2
**Current:** Three entries, correctly dated, no descriptions.
**Fix:** Add one line to the Oxford entry naming marketing/business modules. Keep OFPPT — a technical development diploma explains why you can build landing pages, which is a genuine asset. Note that OFPPT (to Sep 2021) overlaps the start of the Casablanca project (Aug 2021); make sure that is deliberate and defensible.

### What would stop a shortlist today
1. Certifications listed but not held — disqualifying if checked.
2. ~4 years implied vs ~18 months described — collapses in interview.
3. No budget-scale evidence anywhere; ~$1,213 total shown spend.
4. Campaign metrics with no commercial context — purchases with no revenue, no AOV, no delivery rate, no margin.
5. Creative work shown as visual output with no strategy or testing rationale.
6. COBA's client status unclear; Parker's employment conflated with Parker's spec creative.
7. No tracking evidence (GA4, GTM, Pixel/CAPI).
8. Portfolio unpublished, and unpublishable in current form.
9. Tool names foregrounded over decisions and outcomes.
10. Consultant/agency framing across every asset while applying for salaried roles.

**What strong junior candidates show that your materials do not yet.** A monthly budget figure they have been trusted with. One campaign narrative with a before state, a specific change, an after state, and a reason. A named business outcome — revenue, delivered orders, qualified leads, margin. Evidence that they can find and fix a broken conversion event. A creative test matrix showing variants, the winner, and the hypothesis that produced the next round. Two or three of those, at small scale, would move you from *borderline* to *yes* without your needing a single additional month of experience.
