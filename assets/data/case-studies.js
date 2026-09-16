/* ==========================================================================
   Khalid Ounzar — Case Studies data
   --------------------------------------------------------------------------
   The single source of truth. Every figure here was read off a Meta Ads
   Manager screenshot and cross-checked against it; nothing is modelled,
   derived or rounded unless the field says so.

   The rule this file exists to enforce: a value that has not been verified is
   `null`, never 0 and never a plausible-looking guess. Components render a
   section only when its branch is non-null, so a missing number cannot become
   an invented one by accident.

   ctr.kind is part of the data because the six campaigns come from two
   accounts whose Ads Manager columns are not the same metric — "all" clicks
   for products 01–03, "link" clicks for 04–06. Storing the kind alongside the
   value means a card physically cannot render an unlabelled CTR, and the six
   are never ranked against each other on it.
   ========================================================================== */

window.CASE_STUDIES = (function () {
  "use strict";

  /* Every product reserves an image slot. `image: null` renders the empty
     plate — a reserved frame carrying the number and name, obviously a slot
     rather than a photograph. Dropping a file in assets/products/ and setting
     this one field fills it; no layout or animation code changes. */
  function slot(n) {
    return { src: null, alt: null, slot: n, ratio: "4/5" };
  }

  var PRODUCTS = [
    {
      id: "product-01",
      n: "01",
      slug: "comfortable-rotating-chair",
      nameAr: "كرسي دوار مريح",
      nameEn: "Comfortable Rotating Chair",
      image: slot("01"),
      flagship: true,
      claim: "From product validation to 1,064 purchases.",
      account: "A",
      metrics: {
        purchases: 1064, cpa: 0.56, spend: 596.63,
        impressions: 246404, reach: 112807, frequency: 2.18,
        cpm: 2.42, ctr: { value: 2.87, kind: "all" },
        hookRate: 22.05, cpc: null
      },
      evidence: { shot: "A", row: "TEST RD 28/03/2026", lift: ["purchases", "cpa", "spend"] },
      overview:
        "An e-commerce COD campaign run to reported purchase volume. The interesting number is not the " +
        "count — it is that the cost held while the count grew.",
      validation: true,
      creative: null,
      landingPage: null,
      codFunnel: null,
      profitability: null,
      learnings: {
        worked: "Cost per reported purchase stayed flat as volume climbed, which is the only evidence that a " +
                "campaign is scaling rather than simply spending more.",
        watch: "A 2.18 frequency on 112,807 people is the ceiling showing itself. Past that the same audience " +
               "is being asked twice, and the cost that held here would not have held much further.",
        verdict: null
      }
    },

    {
      id: "product-02",
      n: "02",
      slug: "portable-relaxation-chair",
      nameAr: "كرسي الاسترخاء المحمول",
      nameEn: "Portable Relaxation Chair",
      image: slot("02"),
      claim: "The cheapest acquisition of the six.",
      account: "A",
      metrics: {
        purchases: 441, cpa: 0.28, spend: 125.02,
        impressions: 131120, reach: 55039, frequency: 2.38,
        cpm: 0.95, ctr: { value: 3.24, kind: "all" },
        hookRate: null, cpc: null
      },
      evidence: { shot: "A", row: "RD TEST | 2026-03-30", lift: ["purchases", "cpa", "cpm"] },
      overview:
        "A smaller budget on the same model. Cheap delivery did the work: a $0.95 CPM put the campaign in " +
        "front of enough people that a modest click rate still produced volume.",
      /* Scoping note held in the data so the copy cannot drift from it: the
         same product also ran in the second account at $2.81 across 16
         purchases. "Lowest" is true of this campaign, not of the product. */
      scope: "Lowest cost per reported purchase among these six campaigns. The same product also ran a " +
             "separate, much smaller campaign in another account at a far higher cost.",
      validation: true,
      creative: null, landingPage: null, codFunnel: null, profitability: null,
      learnings: {
        worked: "Buying attention at $0.95 per thousand impressions made a 3.24% click rate sufficient. " +
                "The efficiency came from delivery cost, not from the creative outperforming.",
        watch: "A result this cheap is a signal to test scale, not a number to quote as a standard. It has " +
               "not been reproduced at a larger budget.",
        verdict: null
      }
    },

    {
      id: "product-03",
      n: "03",
      slug: "led-light-strip",
      nameAr: "شريط الإضاءة 5 أمتار",
      nameEn: "5-Meter LED Light Strip",
      image: slot("03"),
      claim: null,
      account: null,
      /* Deliberately empty. A row that may be this product appears in one
         screenshot — 173 purchases at $0.61 — but it has not been confirmed as
         this campaign, so nothing is claimed here and this product is excluded
         from every total until it is. */
      metrics: null,
      pending: "Performance data for this product has not been added yet.",
      evidence: null, overview: null, validation: true,
      creative: null, landingPage: null, codFunnel: null, profitability: null, learnings: null
    },

    {
      id: "product-04",
      n: "04",
      slug: "elegant-car-accessory",
      nameAr: "اكسسوار أنيق للسيارة",
      nameEn: "Elegant Car Accessory",
      image: slot("04"),
      claim: "608,805 impressions at a $0.79 CPM.",
      account: "B",
      metrics: {
        purchases: 328, cpa: 1.47, spend: 480.93,
        impressions: 608805, reach: null, frequency: null,
        cpm: 0.79, ctr: { value: 1.81, kind: "link" },
        hookRate: 24.03, cpc: 0.03
      },
      evidence: { shot: "B", row: "FB-AY / 24-06-2026", lift: ["purchases", "cpa", "impressions"] },
      overview:
        "Volume bought at a very low delivery cost. 608,805 impressions for $480.93 is a $0.79 CPM — the " +
        "campaign's efficiency is in how cheaply it reached people, not in how hard the ad worked.",
      validation: true,
      creative: null, landingPage: null, codFunnel: null, profitability: null, learnings: null
    },

    {
      id: "product-05",
      n: "05",
      slug: "illuminated-laser-sword",
      nameAr: "سيف الليزر المضيء",
      nameEn: "Illuminated Laser Sword",
      image: slot("05"),
      claim: "A 61% hook rate that did not become clicks.",
      account: "B",
      metrics: {
        purchases: 229, cpa: 2.14, spend: 491.15,
        impressions: 1068666, reach: null, frequency: null,
        cpm: 0.46, ctr: { value: 2.29, kind: "link" },
        hookRate: 61.08, cpc: 0.01
      },
      evidence: { shot: "B", row: "FB-AY / 2026-06-21", lift: ["hookRate", "ctr", "impressions"] },
      overview:
        "Over a million impressions and a 61.08% hook rate — and only 2.29% of them clicked the link. This " +
        "is the campaign I learned the most from, because the failure is legible.",
      /* A very high hook rate is one stage of a funnel, not a verdict. The
         funnel below is what stops the number being read as a win. */
      funnel: [
        { k: "Watched hook", v: 61.08, w: 61.08 },
        { k: "Clicked link", v: 2.29, w: 2.29 },
        { k: "Reported buy", v: 0.02, w: 0.4, mute: true }
      ],
      validation: true,
      creative: null, landingPage: null, codFunnel: null, profitability: null,
      learnings: {
        worked: "The creative earned attention at scale. A 61.08% hook rate says the first frames did their " +
                "job on over a million impressions.",
        watch: "A 2.29% link CTR against that says the ad never converted attention into intent. The promise " +
               "did not carry past the hook.",
        changed: "Shorten the distance between the hook and the offer, put price and guarantee in the creative " +
                 "rather than on the page, and tighten placements even at a higher CPM.",
        verdict: null
      },
      note: "CPC shown is cost per all clicks, which is why it sits below what the link CTR implies."
    },

    {
      id: "product-06",
      n: "06",
      slug: "armrest-side-cups",
      nameAr: "أكودوار مع أكواب جانبية",
      nameEn: "Armrest with side cups",
      image: slot("06"),
      claim: "168,620 impressions, 173 reported purchases.",
      account: "B",
      metrics: {
        purchases: 173, cpa: 1.77, spend: 306.00,
        impressions: 168620, reach: null, frequency: null,
        cpm: 1.81, ctr: { value: 2.02, kind: "link" },
        hookRate: 26.16, cpc: 0.07
      },
      evidence: { shot: "B", row: "AY / 22-05-2026", lift: ["purchases", "cpa", "hookRate"] },
      overview:
        "A tighter, more expensive delivery than product 04 at a similar click rate. The higher CPM is the " +
        "whole difference in cost per purchase between the two.",
      validation: true,
      creative: null, landingPage: null, codFunnel: null, profitability: null, learnings: null
    }
  ];

  /* The workflow these products actually came through. Stages marked `mine`
     are the ones Khalid owned; the rest belong to the research team and the
     owner. Stated accurately because the distinction is the credibility. */
  var WORKFLOW = [
    { k: "1688 research", d: "A product research team searched Chinese marketplaces for trending products." },
    { k: "Rapid test", d: "Launched fast to answer one question: is there demand?" },
    { k: "Source creative", d: "The supplier's own footage, barely modified. Speed over polish, on purpose." },
    { k: "Demand signal", d: "Early orders say the product is worth importing." },
    { k: "Owner imports", d: "Stock is sourced from China. Nothing ships until it lands." },
    { k: "Creative", d: "Stronger advertising creative built for the validated product.", mine: true },
    { k: "Landing page", d: "Page built or rebuilt around the offer.", mine: true },
    { k: "Relaunch", d: "Campaign prepared and launched, or a winning campaign resumed.", mine: true },
    { k: "Optimisation", d: "Daily buying, budget pacing, audience and placement decisions.", mine: true },
    { k: "Confirmation", d: "COD orders are called before they ship. Not every reported order survives this." },
    { k: "Delivery", d: "Delivered, refused or returned at the door." },
    { k: "Profit", d: "What is left after product, delivery, returns and ad cost." }
  ];

  var CATEGORIES = [
    {
      id: "ecommerce", n: "01",
      title: "E-commerce Media Buying",
      sub: "Six real products, from validation to performance",
      status: "verified",
      statusLabel: "Verified campaign data",
      open: true
    },
    {
      id: "creative", n: "02",
      title: "Creative Strategy",
      sub: "Reels, hooks, concepts, scripts and performance creative",
      status: "pending",
      statusLabel: "In preparation",
      open: false,
      pending: "This work is being prepared. Rather than fill the space with placeholder projects, it stays " +
               "empty until there is something real to show."
    },
    {
      id: "concepts", n: "03",
      title: "Other / Concept Work",
      sub: "Speculative briefs — lead generation, real estate, salon",
      status: "concept",
      statusLabel: "Concept — not a result",
      open: true
    }
  ];

  /* Totals are computed, never typed, so they cannot drift from the data.
     Product 03 has no metrics and is excluded from all three. */
  function totals() {
    var t = { purchases: 0, spend: 0, impressions: 0, counted: 0, lowestCpa: null };
    PRODUCTS.forEach(function (p) {
      if (!p.metrics) return;
      t.counted++;
      t.purchases += p.metrics.purchases;
      t.spend += p.metrics.spend;
      t.impressions += p.metrics.impressions;
      if (t.lowestCpa === null || p.metrics.cpa < t.lowestCpa) t.lowestCpa = p.metrics.cpa;
    });
    t.spend = Math.round(t.spend * 100) / 100;
    return t;
  }

  return {
    products: PRODUCTS,
    categories: CATEGORIES,
    workflow: WORKFLOW,
    totals: totals(),
    byId: function (id) {
      for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
      return null;
    }
  };
})();
